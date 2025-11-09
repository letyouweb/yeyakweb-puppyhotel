import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase 환경 변수가 설정되지 않았습니다.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// 예약 관련 타입 정의
export interface Reservation {
  id: string;
  pet_name: string;
  owner_name: string;
  service: 'hotel' | 'grooming' | 'daycare';
  reservation_date: string;
  reservation_time?: string;
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
  phone: string;
  email?: string;
  room_type?: string;
  check_in?: string;
  check_out?: string;
  grooming_style?: string;
  special_notes?: string;
  created_at: string;
  updated_at: string;
}

// 예약 서비스 함수들
export const reservationService = {
  async getAll() {
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .order('reservation_date', { ascending: true });
    if (error) throw error;
    return data as Reservation[];
  },
  
  async getByDate(date: string) {
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('reservation_date', date);
    if (error) throw error;
    return data as Reservation[];
  },
  
  async create(reservation: Partial<Reservation>) {
    const { data, error } = await supabase
      .from('reservations')
      .insert(reservation)
      .select()
      .single();
    if (error) throw error;
    return data as Reservation;
  },
  
  async update(id: string, updates: Partial<Reservation>) {
    const { data, error } = await supabase
      .from('reservations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Reservation;
  },
  
  // 실시간 구독
  subscribeToChanges(callback: (payload: any) => void) {
    return supabase
      .channel('reservations')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'reservations' }, 
        callback
      )
      .subscribe();
  }
};

// 관리자 인증 함수들
export const adminService = {
  async login(username: string, password: string) {
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('username', username)
      .eq('password_hash', password)
      .single();
    if (error) throw error;
    return data;
  },
  
  async verifySecurityAnswer(username: string, answer: string) {
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('username', username)
      .eq('security_answer_hash', answer.toLowerCase().trim())
      .single();
    if (error) throw error;
    return data;
  },
  
  async resetPassword(username: string, newPassword: string) {
    const { data, error } = await supabase
      .from('admin_users')
      .update({ password_hash: newPassword })
      .eq('username', username)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  
  async updateAccount(username: string, updates: Partial<{
    password_hash: string;
    email: string;
    security_question: string;
    security_answer_hash: string;
  }>) {
    const { data, error } = await supabase
      .from('admin_users')
      .update(updates)
      .eq('username', username)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};

// 설정 관련 함수들
export const settingsService = {
  async get(key: string) {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('setting_key', key)
      .single();
    if (error) throw error;
    return data?.setting_value;
  },
  
  async set(key: string, value: any) {
    const { data, error } = await supabase
      .from('settings')
      .upsert({ 
        setting_key: key, 
        setting_value: value 
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};

// SMS 발송 서비스
export const smsService = {
  async sendConfirmation(reservation: Reservation) {
    const message = `[PuppyHotel] ${reservation.owner_name}님, ${reservation.pet_name}의 ${
      reservation.service === 'grooming' ? '미용' : 
      reservation.service === 'hotel' ? '호텔' : '데이케어'
    } 예약이 확정되었습니다. 날짜: ${reservation.reservation_date} ${reservation.reservation_time || ''}. 문의: 02-1234-5678`;
    
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/send-sms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`
        },
        body: JSON.stringify({
          to: reservation.phone,
          message: message,
          reservationId: reservation.id
        })
      });
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('SMS 발송 실패:', error);
      throw error;
    }
  }
};

// 챗봇용 예약 조회 API
export const chatbotService = {
  async getAvailableSlots(date: string, service: string) {
    const { data: reservations, error } = await supabase
      .from('reservations')
      .select('reservation_time, status')
      .eq('reservation_date', date)
      .eq('service', service)
      .in('status', ['confirmed', 'pending']);
    
    if (error) throw error;
    
    // 설정에서 가능한 시간대 가져오기
    const settings = await settingsService.get('weekly_grooming_schedule');
    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'lowercase' });
    
    if (!settings || !settings[dayOfWeek]) {
      return [];
    }
    
    const daySchedule = settings[dayOfWeek];
    if (!daySchedule.isOpen) {
      return [];
    }
    
    // 예약된 시간 제외
    const bookedTimes = reservations?.map(r => r.reservation_time) || [];
    const availableSlots = daySchedule.timeSlots.filter(
      (slot: string) => !bookedTimes.includes(slot)
    );
    
    return availableSlots;
  },
  
  async getReservationStatus(date: string) {
    const { data, error } = await supabase
      .from('reservations')
      .select('service, status')
      .eq('reservation_date', date);
    
    if (error) throw error;
    
    const summary = {
      hotel: { available: 10, booked: 0 },
      grooming: { available: 8, booked: 0 },
      daycare: { available: 15, booked: 0 }
    };
    
    data?.forEach(res => {
      if (res.status === 'confirmed' || res.status === 'pending') {
        summary[res.service as keyof typeof summary].booked++;
        summary[res.service as keyof typeof summary].available--;
      }
    });
    
    return summary;
  }
};
