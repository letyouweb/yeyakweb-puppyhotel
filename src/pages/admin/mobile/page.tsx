import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../../../lib/supabase';
import {
  changeReservationStatus,
  deleteReservation as deleteReservationAction,
  type ReservationStatus,
} from '../../../lib/adminReservationActions';
import {
  useTodayReservationsForMobile,
  type MobileReservation,
} from '../../../hooks/useTodayReservationsForMobile';

const SERVICE_LABELS: Record<MobileReservation['service'], string> = {
  grooming: '미용',
  hotel: '호텔',
  daycare: '데이케어',
};

const SERVICE_SECTIONS: Array<{ key: MobileReservation['service']; title: string }> = [
  { key: 'grooming', title: '1. 오늘 미용 예약' },
  { key: 'hotel', title: '2. 오늘 호텔 예약' },
  { key: 'daycare', title: '3. 오늘 데이케어 예약' },
];

const STATUS_LABELS: Record<MobileReservation['status'], string> = {
  pending: '대기',
  confirmed: '확정',
  completed: '완료',
  cancelled: '취소',
  deleted: '삭제됨',
};

const STATUS_STYLES: Record<MobileReservation['status'], string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  completed: 'bg-slate-100 text-slate-600 border-slate-200',
  cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
  deleted: 'bg-rose-50 text-rose-700 border-rose-200',
};

const formatReservationDate = (dateStr: string) => {
  if (!dateStr) return '';
  const target = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(target.getTime())) return dateStr;
  try {
    const formatter = new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      weekday: 'short',
    });
    const parts = formatter.formatToParts(target);
    const year = parts.find((part) => part.type === 'year')?.value ?? '';
    const month = parts.find((part) => part.type === 'month')?.value ?? '';
    const day = parts.find((part) => part.type === 'day')?.value ?? '';
    const weekday = parts.find((part) => part.type === 'weekday')?.value ?? '';
    return `${year}-${month}-${day} (${weekday})`;
  } catch {
    return dateStr;
  }
};

const getTimeRange = (reservation: MobileReservation) => {
  if (reservation.checkIn || reservation.checkOut) {
    return `${reservation.checkIn || '-'} ~ ${reservation.checkOut || '-'}`;
  }
  return reservation.time || null;
};

const getScheduleLabel = (reservation: MobileReservation) => {
  const dateLabel = formatReservationDate(reservation.date);
  const timeRange = getTimeRange(reservation);
  return [dateLabel, timeRange].filter(Boolean).join(' ');
};

const getServiceDetail = (reservation: MobileReservation) => {
  if (reservation.service === 'grooming') {
    return reservation.style || '미용 예약';
  }
  if (reservation.service === 'hotel') {
    return reservation.roomType || '호텔 예약';
  }
  if (reservation.service === 'daycare') {
    return reservation.roomType || '데이케어 예약';
  }
  return SERVICE_LABELS[reservation.service];
};

export default function AdminMobileDashboard() {
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const {
    todayGrooming,
    todayHotel,
    todayDaycare,
    refresh,
    isLoading,
    isRefreshing,
    error: dataError,
    todayKey,
  } = useTodayReservationsForMobile(isAuthorized);

  const todayDisplay = formatReservationDate(todayKey);

  useEffect(() => {
    let mounted = true;
    const initialize = async () => {
      try {
        const session = await adminService.getSession();
        if (!mounted) return;
        const user = session?.user;
        if (!user) {
          navigate('/admin');
          return;
        }
        localStorage.setItem('adminAuth', 'true');
        setIsAuthorized(true);
      } catch (error) {
        console.error('Failed to initialize mobile dashboard:', error);
        if (mounted) {
          setErrorMessage('관리자 인증에 실패했습니다. 다시 로그인해주세요.');
        }
      }
    };
    initialize();
    return () => {
      mounted = false;
    };
  }, [navigate]);

  const stats = useMemo<Record<MobileReservation['service'], number> & { total: number }>(() => {
    return {
      grooming: todayGrooming.length,
      hotel: todayHotel.length,
      daycare: todayDaycare.length,
      total: todayGrooming.length + todayHotel.length + todayDaycare.length,
    };
  }, [todayDaycare.length, todayGrooming.length, todayHotel.length]);

  const sections = useMemo(
    () => [
      { ...SERVICE_SECTIONS[0], reservations: todayGrooming },
      { ...SERVICE_SECTIONS[1], reservations: todayHotel },
      { ...SERVICE_SECTIONS[2], reservations: todayDaycare },
    ],
    [todayDaycare, todayGrooming, todayHotel],
  );

  const combinedError = errorMessage || dataError;

  const handleRefresh = () => {
    if (!isRefreshing) {
      refresh();
    }
  };

  const handleLogout = async () => {
    try {
      await adminService.logout();
    } catch (error) {
      console.error('Failed to logout:', error);
    } finally {
      localStorage.removeItem('adminAuth');
      navigate('/admin');
    }
  };

  const handleStatusChange = async (reservationId: string, nextStatus: ReservationStatus) => {
    setProcessingId(reservationId);
    setErrorMessage(null);
    const result = await changeReservationStatus(reservationId, nextStatus);
    if (!result.success) {
      setErrorMessage('상태를 업데이트하지 못했습니다. 다시 시도해주세요.');
    } else {
      await refresh();
    }
    setProcessingId(null);
  };

  const handleDeleteReservation = async (reservationId: string) => {
    const confirmed = typeof window === 'undefined' ? true : window.confirm('이 예약을 삭제할까요?');
    if (!confirmed) return;
    setProcessingId(reservationId);
    setErrorMessage(null);
    const result = await deleteReservationAction(reservationId);
    if (!result.success) {
      setErrorMessage('예약을 삭제하지 못했습니다. 잠시 후 다시 시도해주세요.');
    } else {
      await refresh();
    }
    setProcessingId(null);
  };

  const renderReservationCard = (reservation: MobileReservation) => {
    const schedule = getScheduleLabel(reservation);
    const serviceDetail = getServiceDetail(reservation);
    return (
      <article
        key={reservation.id}
        className="mb-2 flex flex-col gap-1 rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
      >
        <div className="flex items-center justify-between gap-3">
          <span className="text-base font-semibold text-slate-900">
            {reservation.petName || reservation.ownerName || '예약'}
          </span>
          <span
            className={`text-xs font-semibold rounded-full border px-2 py-1 ${STATUS_STYLES[reservation.status]}`}
          >
            {STATUS_LABELS[reservation.status]}
          </span>
        </div>
        <div className="text-xs text-gray-600">
          {[schedule, serviceDetail].filter(Boolean).join('  ') || '일정 정보 없음'}
        </div>
        {reservation.phone ? <p className="text-xs text-slate-500">{reservation.phone}</p> : null}
        {reservation.specialNotes ? (
          <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">{reservation.specialNotes}</p>
        ) : null}
        <div className="mt-1 flex justify-end gap-2">
          {reservation.status === 'pending' ? (
            <button
              type="button"
              onClick={() => handleStatusChange(reservation.id, 'confirmed')}
              disabled={processingId === reservation.id}
              className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
            >
              <i className="ri-check-line text-sm" />
              {processingId === reservation.id ? '처리 중...' : '확정'}
            </button>
          ) : null}
          {(reservation.status === 'pending' || reservation.status === 'confirmed') && (
            <button
              type="button"
              onClick={() => handleStatusChange(reservation.id, 'cancelled')}
              disabled={processingId === reservation.id}
              className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 disabled:opacity-50"
            >
              <i className="ri-close-line text-sm" />
              {processingId === reservation.id ? '처리 중...' : '취소'}
            </button>
          )}
          <button
            type="button"
            onClick={() => handleDeleteReservation(reservation.id)}
            disabled={processingId === reservation.id}
            className="inline-flex items-center gap-1 rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 disabled:opacity-50"
          >
            <i className="ri-delete-bin-line text-sm" />
            {processingId === reservation.id ? '처리 중...' : '삭제'}
          </button>
        </div>
      </article>
    );
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-4">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
        <header className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">PuppyHotel</p>
              <h1 className="text-2xl font-semibold text-slate-900">모바일 관리자</h1>
            </div>
            <button
              type="button"
              onClick={() => navigate('/admin/dashboard')}
              className="rounded-full border border-slate-300 px-4 py-1 text-sm font-medium text-slate-700"
            >
              데스크톱 버전 보기
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">오늘</p>
              <p className="text-lg font-semibold text-slate-900">{todayDisplay}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="text-sm font-medium text-rose-500 underline-offset-2 hover:underline"
            >
              로그아웃
            </button>
          </div>
        </header>

        {combinedError ? (
          <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {combinedError}
          </div>
        ) : null}

        <section className="rounded-3xl border border-slate-100 bg-white px-5 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">오늘 예약</p>
              <p className="text-3xl font-semibold text-slate-900">{stats.total}</p>
            </div>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {isRefreshing ? '불러오는 중...' : '새로고침'}
            </button>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
            {(['hotel', 'grooming', 'daycare'] as const).map((service) => (
              <div key={service} className="rounded-2xl bg-slate-50 px-2 py-3">
                <p className="text-xs text-slate-500">{SERVICE_LABELS[service]}</p>
                <p className="text-xl font-semibold text-slate-900">{stats[service]}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="flex flex-col gap-6">
          {sections.map((section) => {
            const isEmpty = !isLoading && section.reservations.length === 0;
            return (
              <section key={section.key} className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-900">{section.title}</h2>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {section.reservations.length}건
                  </span>
                </div>

                {isLoading ? (
                  <div className="rounded-3xl border border-slate-100 bg-white px-5 py-8 text-center text-slate-500">
                    불러오는 중입니다...
                  </div>
                ) : null}

                {isEmpty ? (
                  <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-5 py-8 text-center text-slate-500">
                    오늘은 {SERVICE_LABELS[section.key]} 예약이 없습니다.
                  </div>
                ) : null}

                {!isLoading && section.reservations.map((reservation) => renderReservationCard(reservation))}
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}
