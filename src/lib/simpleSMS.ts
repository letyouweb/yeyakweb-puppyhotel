// SMS 발송 간단 구현
// SOLAPI 설정 없이도 작동하도록 수정

import { Reservation } from './supabase';

export const simpleSMSService = {
  async sendConfirmation(reservation: Reservation) {
    const message = `[PuppyHotel] ${reservation.owner_name}님의 ${reservation.pet_name} ${
      reservation.service === 'grooming' ? '미용' : reservation.service === 'hotel' ? '호텔' : '데이케어'
    } 예약이 확정되었습니다. 일시: ${reservation.reservation_date} ${reservation.reservation_time || ''}.`;

    console.log('📱 SMS 발송 (시뮬레이션):', {
      to: reservation.phone,
      message: message
    });

    // 실제 SMS 발송 로직 (SOLAPI 설정 시 활성화)
    /*
    try {
      const response = await fetch('YOUR_SUPABASE_EDGE_FUNCTION_URL/send-sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer YOUR_ANON_KEY`
        },
        body: JSON.stringify({
          to: reservation.phone,
          message: message
        })
      });

      if (!response.ok) {
        throw new Error('SMS 발송 실패');
      }

      return await response.json();
    } catch (error) {
      console.error('SMS 발송 실패:', error);
      throw error;
    }
    */

    // 시뮬레이션: 성공 반환
    return {
      success: true,
      message: 'SMS 발송 완료 (시뮬레이션)',
      phone: reservation.phone,
      text: message
    };
  }
};
