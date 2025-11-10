// 대시보드 Supabase 연동 헬퍼 파일
import { reservationService } from './supabase';
import { realSMSService } from './realSMS';
import type { Reservation } from './supabase';

// Supabase 예약 데이터를 대시보드 형식으로 변환
export function convertToLegacyFormat(reservation: Reservation) {
  return {
    id: reservation.id,
    petName: reservation.pet_name,
    ownerName: reservation.owner_name,
    service: reservation.service,
    date: reservation.reservation_date,
    time: reservation.reservation_time || '미정',
    status: reservation.status,
    phone: reservation.phone,
    roomType: reservation.room_type,
    checkIn: reservation.check_in,
    checkOut: reservation.check_out,
    style: reservation.grooming_style
  };
}

// 대시보드 형식을 Supabase 형식으로 변환
export function convertToSupabaseFormat(reservation: any) {
  return {
    pet_name: reservation.petName,
    owner_name: reservation.ownerName,
    service: reservation.service,
    reservation_date: reservation.date || reservation.checkIn,
    reservation_time: reservation.time,
    status: reservation.status,
    phone: reservation.phone,
    room_type: reservation.roomType,
    check_in: reservation.checkIn,
    check_out: reservation.checkOut,
    grooming_style: reservation.style
  };
}

// 실시간 예약 데이터 가져오기
export async function loadAllReservations() {
  try {
    const data = await reservationService.getAll();
    return data.map(convertToLegacyFormat);
  } catch (error) {
    console.error('예약 데이터 로드 실패:', error);
    return [];
  }
}

// 예약 상태 업데이트 + SMS 자동 발송
export async function updateReservationStatus(
  reservationId: string,
  newStatus: string,
  sendSMS: boolean = true
) {
  try {
    const updated = await reservationService.update(reservationId, {
      status: newStatus as any
    });

    // pending -> confirmed 변경 시 SMS 발송
    if (sendSMS && newStatus === 'confirmed') {
      try {
        const smsResult = await realSMSService.sendConfirmation(updated);
        if (smsResult.success) {
          console.log('✅ SMS 발송 성공');
        } else {
          console.warn('⚠️ SMS 발송 실패:', smsResult.error);
        }
      } catch (error) {
        console.warn('⚠️ SMS 발송 실패 (무시하고 계속):', error);
      }
    }

    return { success: true, data: convertToLegacyFormat(updated) };
  } catch (error) {
    console.error('상태 업데이트 실패:', error);
    return { success: false, error };
  }
}

// 실시간 구독 설정
export function subscribeToReservations(callback: (data: any) => void) {
  return reservationService.subscribeToChanges((payload) => {
    console.log('예약 변경 감지:', payload);
    
    // INSERT, UPDATE, DELETE 이벤트 처리
    if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
      callback({
        type: payload.eventType,
        data: convertToLegacyFormat(payload.new)
      });
    } else if (payload.eventType === 'DELETE') {
      callback({
        type: 'DELETE',
        id: payload.old.id
      });
    }
  });
}
