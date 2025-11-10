import { Reservation, supabase } from './supabase';

export const realSMSService = {
  async sendConfirmation(reservation: Reservation) {
    const message = `[PuppyHotel] ${reservation.owner_name}님 ${reservation.pet_name} ${
      reservation.service === 'grooming' ? '미용' : reservation.service === 'hotel' ? '호텔' : '데이케어'
    } 예약이 확정되었습니다. 일정: ${reservation.reservation_date} ${reservation.reservation_time || ''}.`;

    const cleanPhone = reservation.phone?.replace(/[^0-9]/g, '') || reservation.phone;

    console.log('📨 SMS 전송 요청:', {
      to: cleanPhone,
      text: message,
    });

    try {
      const { data, error } = await supabase.functions.invoke('send-sms', {
        body: { to: cleanPhone, text: message },
      });

      if (error) {
        throw error;
      }

      console.log('✅ SMS 전송 성공:', data);
      return {
        success: true,
        message: 'SMS 전송 완료',
        data,
      };
    } catch (error) {
      console.error('⚠️ SMS 전송 실패:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'SMS 전송 실패',
        message: '예약은 확정되었지만 문자 발송에 실패했습니다.',
      };
    }
  },
};
