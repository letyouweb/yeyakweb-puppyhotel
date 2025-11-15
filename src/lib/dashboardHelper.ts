// 대시보드 Supabase 연동 헬퍼 파일 (커스텀 버전)
import { reservationService } from './supabase';
import { realSMSService } from './realSMS';
import type { Reservation } from './supabase';
// 로컬 스토리지 업데이트를 위해 실시간 동기화 유틸리티 가져오기
import {
  updateReservationData,
  removeReservationData,
} from '../components/feature/RealtimeReservationSync';

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
    style: reservation.grooming_style,
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
    grooming_style: reservation.style,
  };
}

// 실시간 예약 데이터 가져오기
export async function loadAllReservations() {
  try {
    const data = await reservationService.getAll();
    // Convert to legacy format and filter out soft-deleted (cancelled) reservations.
    return data
      .map(convertToLegacyFormat)
      .filter((r) => r.status !== 'cancelled' && r.status !== 'deleted');
  } catch (error) {
    console.error('예약 데이터 로드 실패:', error);
    return [];
  }
}

// Soft delete reservations by updating status to 'cancelled'.
// Returns an object with success flag and list of updated reservations (legacy format).
export async function softDeleteReservations(ids: string[]) {
  if (!ids || ids.length === 0) {
    return { success: false, error: 'No reservation IDs provided' };
  }
  try {
    // Perform status update on each reservation. Do not send SMS when soft deleting.
    const results = await Promise.all(
      ids.map(async (id) => {
        const res = await updateReservationStatus(id, 'cancelled', false);
        return res;
      }),
    );
    // Extract updated data where success is true
    const updated = results
      .filter((r) => r.success)
      .map((r) => r.data);
    return { success: true, data: updated };
  } catch (error) {
    console.error('소프트 삭제 실패:', error);
    return { success: false, error };
  }
}

// 예약 상태 업데이트 + SMS 자동 발송
export async function updateReservationStatus(
  reservationId: string,
  newStatus: string,
  sendSMS: boolean = true,
) {
  try {
    const updated = await reservationService.update(reservationId, {
      status: newStatus as any,
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
// Supabase에서 새로운 예약/수정/삭제 이벤트를 감지하여 콜백을 호출하고
// 로컬 스토리지에도 변경 사항을 반영한다.
export function subscribeToReservations(callback: (data: any) => void) {
  return reservationService.subscribeToChanges((payload: any) => {
    console.log('예약 변경 감지:', payload);
    // INSERT, UPDATE, DELETE 이벤트 처리
    if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
      const legacy = convertToLegacyFormat(payload.new as Reservation);
      // Always notify callback
      callback({ type: payload.eventType, data: legacy });
      try {
        // For soft-deleted reservations (status cancelled or deleted), remove from localStorage and skip re-adding.
        if (legacy.status === 'cancelled' || legacy.status === 'deleted') {
          removeReservationData([legacy.id]);
        } else {
          // Remove any existing entry to avoid duplicates
          removeReservationData([legacy.id]);
          updateReservationData(legacy, legacy.service as any);
        }
      } catch (e) {
        console.warn('localStorage 예약 동기화 실패:', e);
      }
    } else if (payload.eventType === 'DELETE') {
      const id = payload.old.id;
      callback({ type: 'DELETE', id });
      try {
        removeReservationData([id]);
      } catch (e) {
        console.warn('localStorage 예약 삭제 동기화 실패:', e);
      }
    }
  });
}