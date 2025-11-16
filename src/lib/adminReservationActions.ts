import {
  updateReservationData,
  removeReservationData,
} from '../components/feature/RealtimeReservationSync';
import { updateReservationStatus } from './dashboardHelper';
import { reservationService } from './supabase';
import { convertToLegacyFormat } from './dashboardHelper';

type LegacyReservation = ReturnType<typeof convertToLegacyFormat>;
export type ReservationStatus = 'confirmed' | 'pending' | 'completed' | 'cancelled';

const dispatchReservationUpdated = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('reservationUpdated'));
  }
};

const syncReservationCache = (reservationId: string, reservation?: LegacyReservation) => {
  try {
    removeReservationData([reservationId]);
  } catch (error) {
    console.warn('localStorage reservation removal failed:', error);
  }

  if (reservation && reservation.status !== 'cancelled' && reservation.status !== 'deleted') {
    try {
      updateReservationData(reservation, reservation.service as any);
    } catch (error) {
      console.warn('localStorage reservation update failed:', error);
    }
  }
};

export async function changeReservationStatus(
  reservationId: string,
  newStatus: ReservationStatus,
) {
  try {
    const result = await updateReservationStatus(
      reservationId,
      newStatus,
      newStatus === 'confirmed',
    );
    if (!result.success || !result.data) {
      return { success: false, error: result.error };
    }
    const updatedReservation = result.data;
    syncReservationCache(reservationId, updatedReservation);
    dispatchReservationUpdated();
    return { success: true, reservation: updatedReservation };
  } catch (error) {
    return { success: false, error };
  }
}

export async function confirmReservation(reservationId: string) {
  return changeReservationStatus(reservationId, 'confirmed');
}

export async function completeReservation(reservationId: string) {
  return changeReservationStatus(reservationId, 'completed');
}

export async function cancelReservation(reservationId: string) {
  return changeReservationStatus(reservationId, 'cancelled');
}

export async function deleteReservation(reservationId: string) {
  try {
    await reservationService.remove(reservationId);
    syncReservationCache(reservationId);
    dispatchReservationUpdated();
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}
