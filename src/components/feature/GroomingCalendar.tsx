import { useState, useEffect } from 'react';
import type { Reservation, CalendarProps } from '../../types/reservation';

interface GroomingData {
  [date: string]: Reservation[];
}

/**
 * 미용 예약 달력 컴포넌트 (Supabase 연동)
 * - props로 전달받은 reservations 데이터를 사용하여 달력에 표시합니다.
 * - localStorage 의존성을 완전히 제거하고 Supabase 데이터만 사용합니다.
 */
export default function GroomingCalendar({ reservations }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [groomingData, setGroomingData] = useState<GroomingData>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    loadGroomingData();
  }, [reservations, currentDate]);

  const loadGroomingData = () => {
    try {
      // reservations에서 미용 서비스만 필터링 (cancelled 제외)
      const groomingReservations = reservations.filter(
        (r) => r.service === 'grooming' && r.status !== 'cancelled'
      );

      // 날짜별로 그룹화
      const groupedData: GroomingData = {};
      groomingReservations.forEach((reservation) => {
        const date = reservation.date;
        if (!date) return;
        if (!groupedData[date]) {
          groupedData[date] = [];
        }
        groupedData[date].push(reservation);
      });

      // 각 날짜별로 시간순 정렬
      Object.keys(groupedData).forEach((date) => {
        groupedData[date].sort((a, b) => a.time.localeCompare(b.time));
      });

      setGroomingData(groupedData);
    } catch (error) {
      console.warn('미용 예약 데이터 로드 실패:', error);
      setGroomingData({});
    }
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    const days = [] as (number | null)[];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    return days;
  };

  // 날짜 문자열을 로컬 시간 기준(한국 시간)으로 반환하는 함수
  const getDateString = (day: number) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const monthStr = month.toString().padStart(2, '0');
    const dayStr = day.toString().padStart(2, '0');
    return `${year}-${monthStr}-${dayStr}`;
  };

  const getReservationCount = (day: number) => {
    const dateString = getDateString(day);
    return groomingData[dateString]?.length || 0;
  };

  const getStatusColor = (count: number) => {
    if (count === 0) return 'bg-gray-100 text-gray-500';
    if (count <= 2) return 'bg-green-100 text-green-700';
    if (count <= 4) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  const getStatusText = (count: number) => {
    if (count === 0) return '예약없음';
    if (count <= 2) return '여유';
    if (count <= 4) return '보통';
    return '포화';
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
    setSelectedDate(null);
  };

  const handleDateClick = (day: number) => {
    const dateString = getDateString(day);
    setSelectedDate(selectedDate === dateString ? null : dateString);
  };

  const getReservationStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-bold text-gray-900">
            <i className="ri-scissors-line mr-2 text-yellow-600"></i>
            미용 예약 달력
          </h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <i className="ri-arrow-left-line text-gray-600"></i>
            </button>
            <h4 className="text-xl font-semibold text-gray-800 min-w-[120px] text-center">
              {currentDate.getFullYear()}년 {monthNames[currentDate.getMonth()]}
            </h4>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <i className="ri-arrow-right-line text-gray-600"></i>
            </button>
          </div>
        </div>
        {/* 범례 */}
        <div className="flex items-center justify-center space-x-6 mb-6 p-4 bg-yellow-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gray-100 rounded"></div>
            <span className="text-sm text-gray-700">예약없음</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-100 rounded"></div>
            <span className="text-sm text-gray-700">여유 (1-2건)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-yellow-100 rounded"></div>
            <span className="text-sm text-gray-700">보통 (3-4건)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-100 rounded"></div>
            <span className="text-sm text-gray-700">포화 (5건+)</span>
          </div>
        </div>
      </div>
      {/* 달력 헤더 */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((day, index) => (
          <div
            key={day}
            className={`p-3 text-center font-semibold text-sm ${
              index === 0 ? 'text-red-600' : index === 6 ? 'text-blue-600' : 'text-gray-700'
            }`}
          >
            {day}
          </div>
        ))}
      </div>
      {/* 달력 본체 */}
      <div className="grid grid-cols-7 gap-1">
        {getDaysInMonth().map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="p-3"></div>;
          }
          const dateString = getDateString(day);
          const reservationCount = getReservationCount(day);
          const isToday = dateString === today;
          const isSelected = selectedDate === dateString;
          return (
            <div
              key={dateString}
              onClick={() => handleDateClick(day)}
              className={`relative p-3 border border-gray-200 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                isToday ? 'ring-2 ring-yellow-500' : ''
              } ${isSelected ? 'bg-yellow-50 border-yellow-300' : 'hover:bg-gray-50'}`}
            >
              <div className="text-center">
                <div
                  className={`text-lg font-semibold mb-1 ${
                    index % 7 === 0 ? 'text-red-600' : index % 7 === 6 ? 'text-blue-600' : 'text-gray-900'
                  }`}
                >
                  {day}
                </div>
                <div className="space-y-1">
                  <div className={`text-xs px-2 py-1 rounded-full ${getStatusColor(reservationCount)}`}>
                    {getStatusText(reservationCount)}
                  </div>
                  {reservationCount > 0 && <div className="text-xs text-gray-600">{reservationCount}건 예약</div>}
                </div>
              </div>
              {isToday && (
                <div className="absolute top-1 right-1">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {/* 선택된 날짜 상세 정보 */}
      {selectedDate && groomingData[selectedDate] && (
        <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <h4 className="font-semibold text-yellow-900 mb-3">
            {new Date(selectedDate + 'T00:00:00').toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long',
            })}{' '}
            미용 예약 현황
          </h4>
          <div className="space-y-3">
            {groomingData[selectedDate].map((reservation) => (
              <div key={reservation.id} className="bg-white rounded-lg p-3 border border-yellow-200">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-semibold text-gray-900">{reservation.time}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${getReservationStatusColor(reservation.status)}`}>
                        {reservation.status === 'confirmed'
                          ? '확정'
                          : reservation.status === 'pending'
                          ? '대기'
                          : reservation.status === 'completed'
                          ? '완료'
                          : '취소'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-700">
                      <div className="flex items-center space-x-4">
                        <span>
                          <strong>반려동물:</strong> {reservation.petName}
                        </span>
                        <span>
                          <strong>보호자:</strong> {reservation.ownerName}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 mt-1">
                        <span>
                          <strong>미용스타일:</strong> {reservation.style || '기본미용'}
                        </span>
                        <span>
                          <strong>연락처:</strong> {reservation.phone}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* 예약이 없는 날짜에 대한 안내 */}
      {selectedDate && !groomingData[selectedDate] && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="font-semibold text-gray-700 mb-2">
            {new Date(selectedDate + 'T00:00:00').toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long',
            })}
          </h4>
          <p className="text-gray-600">이 날은 미용 예약이 없습니다.</p>
        </div>
      )}
    </div>
  );
}
