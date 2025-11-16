import { useCallback, useEffect, useMemo, useState } from 'react';
import { convertToLegacyFormat, subscribeToReservations } from '../lib/dashboardHelper';
import { reservationService } from '../lib/supabase';

export type MobileReservation = ReturnType<typeof convertToLegacyFormat>;
type ServiceKey = MobileReservation['service'];

const SERVICE_ORDER: ServiceKey[] = ['hotel', 'grooming', 'daycare'];

const sortReservations = (items: MobileReservation[]) => {
  return [...items].sort((a, b) => {
    const serviceDiff = SERVICE_ORDER.indexOf(a.service) - SERVICE_ORDER.indexOf(b.service);
    if (serviceDiff !== 0) return serviceDiff;
    const timeA = a.time || '99:99';
    const timeB = b.time || '99:99';
    return timeA.localeCompare(timeB);
  });
};

const getKstDateKey = () => {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60 * 1000;
  const kst = new Date(utc + 9 * 60 * 60 * 1000);
  return kst.toISOString().split('T')[0];
};

export function useTodayReservationsForMobile(enabled: boolean = true) {
  const todayKey = useMemo(() => getKstDateKey(), []);
  const [reservations, setReservations] = useState<MobileReservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filterToday = useCallback(
    (items: MobileReservation[]) =>
      items.filter(
        (reservation) =>
          reservation.date === todayKey &&
          reservation.status !== 'cancelled' &&
          reservation.status !== 'deleted',
      ),
    [todayKey],
  );

  const fetchReservations = useCallback(async () => {
    if (!enabled) return;
    setIsRefreshing(true);
    setError(null);
    try {
      const data = await reservationService.getByDate(todayKey);
      const normalized = filterToday(data.map(convertToLegacyFormat));
      setReservations(sortReservations(normalized));
    } catch (err) {
      console.error('Failed to load today reservations:', err);
      setError('오늘 예약을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [enabled, filterToday, todayKey]);

  const handleRealtimeUpdate = useCallback(
    (payload: { type: string; data?: MobileReservation; id?: string }) => {
      setReservations((current) => {
        if (payload.type === 'DELETE' && payload.id) {
          return current.filter((reservation) => reservation.id !== payload.id);
        }
        const updatedReservation = payload.data;
        if (!updatedReservation) {
          return current;
        }
        if (
          updatedReservation.date !== todayKey ||
          updatedReservation.status === 'cancelled' ||
          updatedReservation.status === 'deleted'
        ) {
          return current.filter((reservation) => reservation.id !== updatedReservation.id);
        }
        const existing = current.find((reservation) => reservation.id === updatedReservation.id);
        const next = existing
          ? current.map((reservation) =>
              reservation.id === updatedReservation.id ? updatedReservation : reservation,
            )
          : [...current, updatedReservation];
        return sortReservations(next);
      });
    },
    [todayKey],
  );

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }
    let subscription: ReturnType<typeof subscribeToReservations> | null = null;
    fetchReservations();
    subscription = subscribeToReservations(handleRealtimeUpdate);
    return () => {
      subscription?.unsubscribe?.();
    };
  }, [enabled, fetchReservations, handleRealtimeUpdate]);

  const grouped = useMemo(() => {
    return {
      grooming: sortReservations(reservations.filter((reservation) => reservation.service === 'grooming')),
      hotel: sortReservations(reservations.filter((reservation) => reservation.service === 'hotel')),
      daycare: sortReservations(reservations.filter((reservation) => reservation.service === 'daycare')),
    };
  }, [reservations]);

  return {
    todayGrooming: grouped.grooming,
    todayHotel: grouped.hotel,
    todayDaycare: grouped.daycare,
    refresh: fetchReservations,
    isLoading,
    isRefreshing,
    error,
    todayKey,
  };
}
