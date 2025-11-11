// SMS 발송 실제 구현 (프로덕션 Vercel API 사용)

import { Reservation } from './supabase';

const DEFAULT_ENDPOINT = '/api/sms/confirm';

const API_URL =
  import.meta.env?.VITE_SMS_ENDPOINT && import.meta.env.VITE_SMS_ENDPOINT.length > 0
    ? import.meta.env.VITE_SMS_ENDPOINT
    : typeof window !== 'undefined'
      ? `${window.location.origin}${DEFAULT_ENDPOINT}`
      : DEFAULT_ENDPOINT;

export const realSMSService = {
  async sendConfirmation(reservation: Reservation) {
    const message = `[PuppyHotel] ${reservation.owner_name}님의 ${reservation.pet_name} ${
      reservation.service === 'grooming' ? '미용' : reservation.service === 'hotel' ? '호텔' : '데이케어'
    } 예약이 확정되었습니다. 일시: ${reservation.reservation_date} ${reservation.reservation_time || ''}.`;

    console.log('========================================');
    console.log('📱 SMS 발송 시작');
    console.log('========================================');
    console.log('수신자:', reservation.phone);
    console.log('메시지:', message);
    console.log('API URL:', API_URL);
    console.log('========================================');

    try {
      console.log('🚀 Vercel API 호출');
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: reservation.phone,
          text: message
        })
      });

      console.log('📥 응답 상태:', response.status, response.ok ? 'OK' : 'ERROR');

      if (!response.ok) {
        const error = await response.json();
        console.error('❌ 에러 응답:', error);
        throw new Error(error.error || 'SMS 발송 실패');
      }

      const result = await response.json();
      console.log('✅ SMS 발송 완료!', result);

      return {
        success: true,
        message: 'SMS 발송 완료',
        data: result
      };
    } catch (error) {
      console.error('========================================');
      console.error('❌ SMS 발송 실패');
      console.error('에러:', error);
      console.error('========================================');
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'SMS 발송 실패',
        message: '예약은 확정되었으나 SMS 발송에 실패했습니다.'
      };
    }
  }
};
