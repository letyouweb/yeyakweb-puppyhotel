import { useState, useEffect } from 'react';

// 서비스별 예약 데이터 타입 정의
interface GenericReservation {
  id: string;
  service: 'grooming' | 'hotel' | 'daycare';
  date?: string;        // grooming/daycare 예약 날짜
  checkIn?: string;     // hotel 예약 체크인 날짜
  checkOut?: string;    // hotel 예약 체크아웃 날짜
  time?: string;        // grooming/daycare 예약 시간
  petName: string;
  ownerName: string;
  phone?: string;
  roomType?: string;
  style?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
}

// 날짜별 예약 통계를 저장하기 위한 타입
interface DateSummary {
  total: number;
  grooming: number;
  hotel: number;
  daycare: number;
  groomingTimes: string[]; // grooming 서비스 예약된 시간 목록
  reservations: GenericReservation[]; // 선택한 날짜의 예약 목록 전체
}

/**
 * ReservationCalendar
 *
 * 홈페이지 랜딩 페이지에서 "예약 현황 먼저 확인하기" 버튼을 클릭할 때 표시되는 달력 컴포넌트입니다.
 * 기존 구현은 더미 데이터를 사용했지만, 실제 예약 현황을 표시하도록 개선되었습니다.
 *
 * 기능:
 *  - localStorage의 allReservations 배열에서 날짜별 예약 정보를 집계합니다.
 *  - grooming/hotel/daycare 서비스별 예약 건수와 grooming 예약 시간 목록을 수집하여 사용자가 시간을 확인할 수 있도록 합니다.
 *  - 달력 셀에는 예약 건수에 따라 여유/보통/포화 상태를 색으로 표시합니다.
 *  - 날짜를 클릭하면 해당 날짜의 예약 상세 목록과, grooming 서비스의 경우 예약된 시간과 남은 시간 목록을 보여줍니다.
 */
export default function ReservationCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [summaryData, setSummaryData] = useState<Record<string, DateSummary>>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // grooming 서비스에서 사용되는 표준 시간대
  const groomingTimeSlots = [
    '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'
  ];

  // 컴포넌트 로드 및 월 변경 시 예약 데이터 재집계
  useEffect(() => {
    loadReservationSummary();
    // reservationUpdated 이벤트를 감지하여 데이터 갱신
    const handleUpdate = () => {
      loadReservationSummary();
    };
    window.addEventListener('reservationUpdated', handleUpdate);
    return () => {
      window.removeEventListener('reservationUpdated', handleUpdate);
    };
  }, [currentDate]);

  /**
   * localStorage에서 allReservations 데이터를 읽어
   * 날짜별 예약 요약(summaryData)을 생성합니다.
   */
  const loadReservationSummary = () => {
    try {
      const raw = localStorage.getItem('allReservations');
      const all: GenericReservation[] = raw ? JSON.parse(raw) : [];
      const grouped: Record<string, DateSummary> = {};
      all.forEach((res) => {
        // 예약 날짜 결정: grooming/daycare는 date, hotel은 checkIn
        const dateKey = res.date || res.checkIn;
        if (!dateKey) return;
        if (!grouped[dateKey]) {
          grouped[dateKey] = {
            total: 0,
            grooming: 0,
            hotel: 0,
            daycare: 0,
            groomingTimes: [],
            reservations: []
          };
        }
        grouped[dateKey].total += 1;
        if (res.service === 'grooming') {
          grouped[dateKey].grooming += 1;
          if (res.time) {
            grouped[dateKey].groomingTimes.push(res.time);
          }
        } else if (res.service === 'hotel') {
          grouped[dateKey].hotel += 1;
        } else if (res.service === 'daycare') {
          grouped[dateKey].daycare += 1;
        }
        grouped[dateKey].reservations.push(res);
      });
      // grooming 예약 시간 중복 제거 및 정렬
      Object.keys(grouped).forEach((date) => {
        const times = Array.from(new Set(grouped[date].groomingTimes));
        times.sort();
        grouped[date].groomingTimes = times;
      });
      setSummaryData(grouped);
    } catch (err) {
      console.warn('예약 요약 데이터 로드 실패:', err);
      setSummaryData({});
    }
  };

  // 월 내 일수와 시작 요일을 계산하여 달력 배열 생성
  const getMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDay = firstDay.getDay();
    const days: (number | null)[] = [];
    for (let i = 0; i < startDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    return days;
  };

  // 특정 날짜의 예약 건수를 반환 (없으면 0)
  const getReservationCount = (day: number) => {
    const dateKey = formatDate(day);
    return summaryData[dateKey]?.total || 0;
  };

  // 예약 수에 따른 색상 및 텍스트 구분
  const getStatusStyle = (count: number) => {
    if (count === 0) return { colorClass: 'bg-gray-100 text-gray-500', text: '예약없음' };
    if (count <= 2) return { colorClass: 'bg-green-100 text-green-700', text: '여유' };
    if (count <= 5) return { colorClass: 'bg-yellow-100 text-yellow-700', text: '보통' };
    return { colorClass: 'bg-red-100 text-red-700', text: '포화' };
  };

  // 선택한 날짜로 포맷된 문자열을 반환
  const formatDate = (day: number) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const date = new Date(year, month, day);
    return date.toISOString().split('T')[0];
  };

  // 월 이동 핸들러
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(direction === 'prev' ? newDate.getMonth() - 1 : newDate.getMonth() + 1);
    setCurrentDate(newDate);
    setSelectedDate(null);
  };

  // 날짜 클릭 핸들러
  const handleDateClick = (day: number) => {
    const dateKey = formatDate(day);
    setSelectedDate(selectedDate === dateKey ? null : dateKey);
  };

  // 오늘 날짜 비교를 위한 문자열
  const todayStr = new Date().toISOString().split('T')[0];

  // 요일 라벨
  const dayLabels = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        {/* 헤더: 월 이동 */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-bold text-gray-900">
            <i className="ri-calendar-line mr-2 text-blue-600"></i>
            예약 현황 달력
          </h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              <i className="ri-arrow-left-line text-gray-600"></i>
            </button>
            <h4 className="text-xl font-semibold text-gray-800 min-w-[120px] text-center">
              {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
            </h4>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              <i className="ri-arrow-right-line text-gray-600"></i>
            </button>
          </div>
        </div>
        {/* 범례 */}
        <div className="flex items-center justify-center space-x-6 mb-6 p-4 bg-blue-50 rounded-lg">
          <Legend colorClass="bg-gray-100" label="예약없음" />
          <Legend colorClass="bg-green-100" label="여유 (1-2건)" />
          <Legend colorClass="bg-yellow-100" label="보통 (3-5건)" />
          <Legend colorClass="bg-red-100" label="포화 (6건+)" />
        </div>
      </div>
      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayLabels.map((day, idx) => (
          <div
            key={day}
            className={`p-2 text-center font-semibold text-sm ${idx === 0 ? 'text-red-600' : idx === 6 ? 'text-blue-600' : 'text-gray-700'}`}
          >
            {day}
          </div>
        ))}
      </div>
      {/* 날짜 셀 렌더링 */}
      <div className="grid grid-cols-7 gap-1">
        {getMonthDays().map((day, index) => {
          if (day === null) {
            return <div key={index} className="p-3" />;
          }
          const dateKey = formatDate(day);
          const count = getReservationCount(day);
          const status = getStatusStyle(count);
          const isToday = dateKey === todayStr;
          const isSelected = selectedDate === dateKey;
          return (
            <div
              key={day}
              onClick={() => handleDateClick(day)}
              className={`relative p-3 border rounded-lg cursor-pointer transition-all ${
                isSelected ? 'bg-blue-50 border-blue-300' : 'border-gray-200 hover:bg-gray-50'
              } ${isToday ? 'ring-2 ring-blue-200' : ''}`}
            >
              <div className="text-center">
                <div
                  className={`text-lg font-semibold mb-1 ${
                    index % 7 === 0
                      ? 'text-red-600'
                      : index % 7 === 6
                      ? 'text-blue-600'
                      : 'text-gray-900'
                  }`}
                >
                  {day}
                </div>
                <div className="space-y-1">
                  <div
                    className={`text-xs px-2 py-1 rounded-full ${status.colorClass}`}
                  >
                    {status.text}
                  </div>
                  {count > 0 && (
                    <div className="text-xs text-gray-600">{count}건 예약</div>
                  )}
                </div>
              </div>
              {isToday && (
                <div className="absolute top-1 right-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                </div>
              )}
            </div>
          );
        })}
      </div>
      {/* 선택된 날짜 상세 정보 패널 */}
      {selectedDate && summaryData[selectedDate] && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200 max-h-80 overflow-y-auto">
          <h4 className="font-semibold text-blue-900 mb-3">
            {new Date(selectedDate).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long'
            })}
            {' '}예약 현황
          </h4>
          {/* grooming 서비스의 예약 시간 및 여유 시간 표시 */}
          {summaryData[selectedDate].grooming > 0 && (
            <div className="mb-4">
              <h5 className="text-sm font-medium text-gray-700 mb-1">미용 예약 시간</h5>
              <div className="flex flex-wrap gap-2">
                {groomingTimeSlots.map((slot) => {
                  const isBooked = summaryData[selectedDate].groomingTimes.includes(slot);
                  return (
                    <span
                      key={slot}
                      className={`px-2 py-1 text-xs rounded-full ${isBooked ? 'bg-red-100 text-red-700 line-through' : 'bg-green-100 text-green-700'}`}
                    >
                      {slot}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
          {/* 예약 상세 목록 */}
          <div className="space-y-3">
            {summaryData[selectedDate].reservations.map((res, idx) => (
              <div key={idx} className="bg-white rounded-lg p-3 border border-blue-200">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      {/* 서비스 아이콘 */}
                      <i
                        className={`ri-$
                          {res.service === 'grooming'
                            ? 'scissors-2-line text-yellow-500'
                            : res.service === 'hotel'
                            ? 'hotel-bed-line text-blue-500'
                            : 'customer-service-2-line text-purple-500'}
                        `}
                      ></i>
                      <span className="font-semibold text-gray-900">
                        {res.service === 'grooming'
                          ? `미용 ${res.time || ''}`
                          : res.service === 'hotel'
                          ? `호텔 체크인`
                          : '데이케어'}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          res.status === 'confirmed'
                            ? 'bg-green-100 text-green-800'
                            : res.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : res.status === 'completed'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {res.status === 'confirmed'
                          ? '확정'
                          : res.status === 'pending'
                          ? '대기'
                          : res.status === 'completed'
                          ? '완료'
                          : '취소'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-700">
                      <div className="flex items-center space-x-4">
                        <span>
                          <strong>반려동물:</strong> {res.petName}
                        </span>
                        <span>
                          <strong>보호자:</strong> {res.ownerName}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 mt-1">
                        {res.service === 'hotel' && (
                          <span>
                            <strong>체크아웃:</strong> {res.checkOut}
                          </span>
                        )}
                        {res.service === 'grooming' && (
                          <span>
                            <strong>미용 스타일:</strong> {res.style || '기본미용'}
                          </span>
                        )}
                        {res.service === 'hotel' && (
                          <span>
                            <strong>객실 타입:</strong> {res.roomType || '일반룸'}
                          </span>
                        )}
                        {res.service === 'daycare' && res.time && (
                          <span>
                            <strong>시간:</strong> {res.time}
                          </span>
                        )}
                        {res.phone && (
                          <span>
                            <strong>연락처:</strong> {res.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** Legend 컴포넌트: 범례 표시를 위한 재사용 가능한 컴포넌트 */
function Legend({ colorClass, label }: { colorClass: string; label: string }) {
  return (
    <div className="flex items-center space-x-2">
      <div className={`w-4 h-4 rounded ${colorClass}`}></div>
      <span className="text-sm text-gray-700">{label}</span>
    </div>
  );
}