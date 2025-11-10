// 프론트엔드에서 직접 SOLAPI API 호출
import { Reservation } from './supabase';

const SOLAPI_API_KEY = 'NCSATGLIDQRVD1BS';
const SOLAPI_API_SECRET = 'DDXRMRRHOVF0ITYY58SZDYE6C3SEIL9J';
const SMS_SENDER = '01082411619';

export const directSMSService = {
  async sendConfirmation(reservation: Reservation) {
    const message = `[PuppyHotel] ${reservation.owner_name}님의 ${reservation.pet_name} ${
      reservation.service === 'grooming' ? '미용' : reservation.service === 'hotel' ? '호텔' : '데이케어'
    } 예약이 확정되었습니다. 일시: ${reservation.reservation_date} ${reservation.reservation_time || ''}.`;

    console.log('📱 SMS 발송 시작:', {
      to: reservation.phone,
      message: message
    });

    try {
      // 전화번호 형식 정리
      const cleanPhone = reservation.phone.replace(/-/g, '');

      // SOLAPI 직접 호출
      const response = await fetch('https://api.solapi.com/messages/v4/send', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${SOLAPI_API_KEY}:${SOLAPI_API_SECRET}`)}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: {
            to: cleanPhone,
            from: SMS_SENDER,
            text: message,
          },
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'SMS 발송 실패');
      }

      console.log('✅ SMS 발송 성공:', result);

      return {
        success: true,
        message: 'SMS 발송 완료',
        data: result
      };
    } catch (error) {
      console.error('❌ SMS 발송 실패:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'SMS 발송 실패',
        message: '예약은 확정되었으나 SMS 발송에 실패했습니다.'
      };
    }
  }
};
