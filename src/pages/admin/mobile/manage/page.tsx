import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../../../../lib/supabase';
import { loadAllReservations } from '../../../../lib/dashboardHelper';
import {
  changeReservationStatus,
  deleteReservation as deleteReservationAction,
  type ReservationStatus,
} from '../../../../lib/adminReservationActions';

interface MobileReservation {
  id: string;
  petName: string;
  ownerName: string;
  service: 'hotel' | 'grooming' | 'daycare';
  date: string;
  time: string;
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled' | 'deleted';
  phone: string;
  roomType?: string;
  checkIn?: string;
  checkOut?: string;
  style?: string;
  specialNotes?: string;
}

const SERVICE_LABELS: Record<MobileReservation['service'], string> = {
  grooming: '미용',
  hotel: '호텔',
  daycare: '데이케어',
};

const SERVICE_SECTIONS: Array<{ key: MobileReservation['service']; title: string }> = [
  { key: 'grooming', title: '미용 대기 예약' },
  { key: 'hotel', title: '호텔 대기 예약' },
  { key: 'daycare', title: '데이케어 대기 예약' },
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

// 관리용 예약 카드 렌더링 함수 (버튼 있음)
const renderReservationCard = (
  reservation: MobileReservation,
  onStatusChange: (id: string, status: ReservationStatus) => void,
  onDelete: (id: string) => void,
  processingId: string | null
) => {
  const timeDisplay = reservation.time ? reservation.time.substring(0, 5) : '시간 미정';

  const ServiceIcon =
    reservation.service === 'grooming'
      ? '✂️'
      : reservation.service === 'hotel'
      ? '🏨'
      : '🐾';

  const statusStyle = STATUS_STYLES[reservation.status] ?? STATUS_STYLES.pending;
  const statusLabel = STATUS_LABELS[reservation.status] ?? '알 수 없음';
  const schedule = getScheduleLabel(reservation);
  const serviceDetail = getServiceDetail(reservation);

  return (
    <article
      key={reservation.id}
      className="mb-2 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      {/* 상단: 이름과 상태 */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col">
          <p className="flex items-center gap-2 text-base font-bold text-slate-800">
            <span className="text-xl">{ServiceIcon}</span>
            {reservation.petName}
            <span className="text-sm font-normal text-slate-500">
              ({SERVICE_LABELS[reservation.service]})
            </span>
          </p>
          <p className="mt-1 text-sm text-slate-600">
            보호자: {reservation.ownerName} · {timeDisplay}
          </p>
        </div>

        {/* 우측: 상태 뱃지 (pending이 아닌 경우만) */}
        {reservation.status !== 'pending' && (
          <span className={`text-xs font-semibold rounded-full border px-3 py-1 ${statusStyle}`}>
            {statusLabel}
          </span>
        )}
      </div>

      {/* 일정 정보 */}
      <div className="text-xs text-gray-600">
        {[schedule, serviceDetail].filter(Boolean).join('  ') || '일정 정보 없음'}
      </div>

      {/* 연락처 */}
      {reservation.phone ? <p className="text-xs text-slate-500">📞 {reservation.phone}</p> : null}

      {/* 특이사항 */}
      {reservation.specialNotes ? (
        <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
          📝 {reservation.specialNotes}
        </p>
      ) : null}

      {/* 버튼 영역 */}
      <div className="mt-2 flex justify-end gap-2">
        {reservation.status === 'pending' ? (
          <button
            type="button"
            onClick={() => onStatusChange(reservation.id, 'confirmed')}
            disabled={processingId === reservation.id}
            className="inline-flex items-center gap-1 rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-50 shadow-md"
          >
            <i className="ri-check-line text-base" />
            {processingId === reservation.id ? '처리 중...' : '대기 → 확정'}
          </button>
        ) : null}
        {(reservation.status === 'pending' || reservation.status === 'confirmed') && (
          <button
            type="button"
            onClick={() => onStatusChange(reservation.id, 'cancelled')}
            disabled={processingId === reservation.id}
            className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 disabled:opacity-50 hover:bg-amber-100"
          >
            <i className="ri-close-line text-sm" />
            {processingId === reservation.id ? '처리 중...' : '취소'}
          </button>
        )}
        <button
          type="button"
          onClick={() => onDelete(reservation.id)}
          disabled={processingId === reservation.id}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-50 hover:bg-slate-50"
        >
          <i className="ri-delete-bin-line text-sm" />
          {processingId === reservation.id ? '처리 중...' : '삭제'}
        </button>
      </div>
    </article>
  );
};

export default function AdminMobileManagePage() {
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [reservations, setReservations] = useState<MobileReservation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 오늘 날짜 구하기
  const todayKey = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const todayDisplay = formatReservationDate(todayKey);

  // 예약 데이터 불러오기
  const loadReservations = useCallback(async () => {
    if (!isAuthorized) return;
    
    try {
      setIsLoading(true);
      setErrorMessage(null); // 에러 메시지 초기화
      // 오늘 이후의 pending 예약만 가져오기
      const data = await loadAllReservations();
      
      const today = new Date(todayKey);
      const filtered = (data || [])
        .filter((r: any) => {
          // pending 상태만
          if (r.status !== 'pending') return false;
          
          // 오늘 이후 날짜만
          const resDate = new Date(r.date);
          return resDate >= today;
        })
        .map((r: any) => ({
          id: r.id,
          petName: r.petName || '',
          ownerName: r.ownerName || '',
          service: r.service,
          date: r.date,
          time: r.time || '',
          status: r.status,
          phone: r.phone || '',
          roomType: r.roomType,
          checkIn: r.checkIn,
          checkOut: r.checkOut,
          style: r.style,
          specialNotes: r.specialNotes,
        } as MobileReservation));

      setReservations(filtered);
      console.log(`[ADMIN-MOBILE] 예약 데이터 로딩 성공: ${filtered.length}건`);
    } catch (error) {
      console.error('[ADMIN-MOBILE] 예약 데이터 로딩 실패:', error);
      setErrorMessage('예약 데이터를 불러오는데 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthorized, todayKey]);

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
        console.error('Failed to initialize mobile manage page:', error);
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

  useEffect(() => {
    if (isAuthorized) {
      loadReservations();
    }
  }, [isAuthorized, loadReservations]);

  // 서비스별 필터링
  const groomingReservations = useMemo(
    () => reservations.filter(r => r.service === 'grooming'),
    [reservations]
  );
  
  const hotelReservations = useMemo(
    () => reservations.filter(r => r.service === 'hotel'),
    [reservations]
  );
  
  const daycareReservations = useMemo(
    () => reservations.filter(r => r.service === 'daycare'),
    [reservations]
  );

  const stats = useMemo<Record<MobileReservation['service'], number> & { total: number }>(() => {
    return {
      grooming: groomingReservations.length,
      hotel: hotelReservations.length,
      daycare: daycareReservations.length,
      total: reservations.length,
    };
  }, [daycareReservations.length, groomingReservations.length, hotelReservations.length, reservations.length]);

  const sections = useMemo(
    () => [
      { ...SERVICE_SECTIONS[0], reservations: groomingReservations },
      { ...SERVICE_SECTIONS[1], reservations: hotelReservations },
      { ...SERVICE_SECTIONS[2], reservations: daycareReservations },
    ],
    [daycareReservations, groomingReservations, hotelReservations],
  );

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    await loadReservations();
    setIsRefreshing(false);
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
      await loadReservations();
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
      await loadReservations();
    }
    setProcessingId(null);
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-4">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
        <header className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">PuppyHotel</p>
              <h1 className="text-2xl font-semibold text-slate-900">예약 관리</h1>
            </div>
            <button
              type="button"
              onClick={() => navigate('/admin/dashboard')}
              className="rounded-full border border-slate-300 px-4 py-1 text-sm font-medium text-slate-700"
            >
              데스크톱 버전
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">대기 예약 관리</p>
              <p className="text-lg font-semibold text-slate-900">{todayDisplay} 이후</p>
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

        {/* 오늘 스케줄만 보기 버튼 */}
        <button
          type="button"
          onClick={() => navigate('/admin/mobile')}
          className="w-full rounded-xl bg-blue-600 px-6 py-4 text-base font-semibold text-white shadow-md hover:bg-blue-700 transition-colors"
        >
          <i className="ri-calendar-check-line mr-2"></i>
          오늘 스케줄만 보기
        </button>

        {errorMessage ? (
          <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errorMessage}
          </div>
        ) : null}

        <section className="rounded-3xl border border-slate-100 bg-white px-5 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">대기 중인 예약</p>
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
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
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
                    {SERVICE_LABELS[section.key]} 대기 예약이 없습니다.
                  </div>
                ) : null}

                {!isLoading &&
                  section.reservations.map((reservation) =>
                    renderReservationCard(reservation, handleStatusChange, handleDeleteReservation, processingId)
                  )}
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}
