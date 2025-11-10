// SMS 발송 실제 구현 (Supabase Edge Function 사용)

import { Reservation } from './supabase';

const SUPABASE_URL = 'https://ssvkmyscxjhrkbulujvq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_iBq280ikbyXnH9ikXBm-7A_q719JG5D';

export const realSMSService = {
  async sendConfirmation(reservation: Reservation) {
    const message = `[PuppyHotel] ${reservation.owner_name}님의 ${reservation.pet_name} ${
      reservation.service === 'grooming' ? '미용' : reservation.service === 'hotel' ? '호텔' : '데이케어'
    } 예약이 확정되었습니다. 일시: ${reservation.reservation_date} ${reservation.reservation_time || ''}.`;

    console.log('📱 SMS 발송 시작:', {
      to: reservation.phone,
      message: message
    });

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/send-sms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          to: reservation.phone,
          message: message
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'SMS 발송 실패');
      }

      const result = await response.json();
      console.log('✅ SMS 발송 성공:', result);

      return {
        success: true,
        message: 'SMS 발송 완료',
        data: result
      };
    } catch (error) {
      console.error('❌ SMS 발송 실패:', error);
      
      // 에러를 throw하지 않고 실패 결과만 반환 (예약 확정은 성공하도록)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'SMS 발송 실패',
        message: '예약은 확정되었으나 SMS 발송에 실패했습니다.'
      };
    }
  }
};
