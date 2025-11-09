import { createClient, type Session } from '@supabase/supabase-js';
import { hashSecurityAnswer } from '../utils/security';

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

export interface CalendarSettingsRecord {
  id?: string;
  is_enabled: boolean;
  business_hours: { start: string; end: string };
  available_days: string[];
  max_bookings_per_day: number;
  updated_at?: string;
}

export interface WeeklyGroomingScheduleRecord {
  id?: string;
  day_of_week: string;
  is_open: boolean;
  time_slots: string[];
  max_bookings: number;
  updated_at?: string;
}

export interface AdminProfile {
  id?: string;
  user_id: string;
  username?: string;
  email?: string;
  security_question?: string;
  security_answer_hash?: string;
  created_at?: string;
  updated_at?: string;
}

interface AdminProfileInput {
  id?: string;
  user_id: string;
  username?: string;
  email?: string;
  security_question?: string;
  security_answer?: string;
}

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
  
  subscribeToChanges(callback: (payload: any) => void) {
    return supabase
      .channel('reservations')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reservations' },
        callback
      )
      .subscribe();
  }
};

export const calendarSettingsService = {
  async getLatest(): Promise<CalendarSettingsRecord | null> {
    const { data, error } = await supabase
      .from('calendar_settings')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data as CalendarSettingsRecord | null;
  },

  async upsert(settings: CalendarSettingsRecord) {
    const payload = {
      id: settings.id,
      is_enabled: settings.is_enabled,
      business_hours: settings.business_hours,
      available_days: settings.available_days,
      max_bookings_per_day: settings.max_bookings_per_day
    };

    const { data, error } = await supabase
      .from('calendar_settings')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single();
    if (error) throw error;
    return data as CalendarSettingsRecord;
  }
};

export const weeklyGroomingScheduleService = {
  async getAll(): Promise<WeeklyGroomingScheduleRecord[]> {
    const { data, error } = await supabase
      .from('weekly_grooming_schedule')
      .select('*');
    if (error) throw error;
    return data as WeeklyGroomingScheduleRecord[];
  },

  async getByDay(day: string) {
    const { data, error } = await supabase
      .from('weekly_grooming_schedule')
      .select('*')
      .eq('day_of_week', day)
      .maybeSingle();
    if (error) throw error;
    return data as WeeklyGroomingScheduleRecord | null;
  },

  async upsert(entries: WeeklyGroomingScheduleRecord[]) {
    const payload = entries.map((entry) => ({
      id: entry.id,
      day_of_week: entry.day_of_week,
      is_open: entry.is_open,
      time_slots: entry.time_slots,
      max_bookings: entry.max_bookings
    }));

    const { data, error } = await supabase
      .from('weekly_grooming_schedule')
      .upsert(payload, { onConflict: 'day_of_week' })
      .select();
    if (error) throw error;
    return data as WeeklyGroomingScheduleRecord[];
  }
};

export const adminProfileService = {
  async getByUserId(userId: string) {
    const { data, error } = await supabase
      .from('admin_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    return data as AdminProfile | null;
  },

  async getByEmail(email: string) {
    const normalized = email.toLowerCase();
    const { data, error } = await supabase
      .from('admin_profiles')
      .select('*')
      .eq('email', normalized)
      .maybeSingle();
    if (error) throw error;
    return data as AdminProfile | null;
  },

  async upsert(profile: AdminProfileInput) {
    const payload: Record<string, any> = {
      id: profile.id,
      user_id: profile.user_id,
      username: profile.username,
      email: profile.email?.toLowerCase(),
      security_question: profile.security_question
    };

    if (profile.security_answer) {
      payload.security_answer_hash = await hashSecurityAnswer(profile.security_answer);
    }

    const { data, error } = await supabase
      .from('admin_profiles')
      .upsert(payload, { onConflict: 'user_id' })
      .select()
      .single();
    if (error) throw error;
    return data as AdminProfile;
  },

  async verifySecurityAnswer(email: string, answer: string) {
    const profile = await adminProfileService.getByEmail(email);
    if (!profile?.security_answer_hash) {
      throw new Error('등록된 보안 정보가 없습니다.');
    }

    const hashed = await hashSecurityAnswer(answer);
    if (hashed !== profile.security_answer_hash) {
      throw new Error('보안 답변이 일치하지 않습니다.');
    }

    return profile;
  }
};

export const adminService = {
  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
    return data.user;
  },

  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getSession(): Promise<Session | null> {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  onAuthStateChange(callback: (session: Session | null) => void) {
    return supabase.auth.onAuthStateChange((_event, session) => callback(session));
  },

  async updateEmail(email: string) {
    const { data, error } = await supabase.auth.updateUser({ email });
    if (error) throw error;
    return data.user;
  },

  async updatePassword(newPassword: string) {
    const { data, error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
    return data.user;
  },

  async getSecurityQuestion(email: string) {
    const profile = await adminProfileService.getByEmail(email);
    if (!profile?.security_question) {
      throw new Error('등록된 보안 질문이 없습니다.');
    }
    return profile.security_question;
  },

  async verifySecurityAnswer(email: string, answer: string) {
    return adminProfileService.verifySecurityAnswer(email, answer);
  },

  async triggerPasswordReset(email: string) {
    const redirectTo = typeof window !== 'undefined'
      ? `${window.location.origin}/admin`
      : undefined;

    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo
    });
    if (error) throw error;
    return data;
  }
};

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

export const smsService = {
  async sendConfirmation(reservation: Reservation) {
    const message = `[PuppyHotel] ${reservation.owner_name}님 ${reservation.pet_name}님 ${
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
          message,
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

export const chatbotService = {
  async getAvailableSlots(date: string, service: string) {
    const { data: reservations, error } = await supabase
      .from('reservations')
      .select('reservation_time, status')
      .eq('reservation_date', date)
      .eq('service', service)
      .in('status', ['confirmed', 'pending']);
    
    if (error) throw error;
    
    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const schedule = await weeklyGroomingScheduleService.getByDay(dayOfWeek);
    
    if (!schedule || !schedule.is_open) {
      return [];
    }
    
    const bookedTimes = reservations?.map(r => r.reservation_time) || [];
    const availableSlots = schedule.time_slots.filter(
      (slot: string) => slot && !bookedTimes.includes(slot)
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
