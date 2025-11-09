
import { useState, useEffect } from 'react';

interface ReservationData {
  [date: string]: {
    total: number;
    available: number;
    services: {
      hotel: number;
      grooming: number;
      daycare: number;
    };
  };
}

export default function ReservationCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [reservationData, setReservationData] = useState<ReservationData>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    generateMockReservationData();
  }, [currentDate]);

  const generateMockReservationData = () => {
    const data: ReservationData = {};
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateString = date.toISOString().split('T')[0];
      
      // 주말과 평일에 따른 예약 패턴 생성
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const baseBookings = isWeekend ? 15 : 12;
      const randomVariation = Math.floor(Math.random() * 8) - 4;
      const totalBookings = Math.max(0, baseBookings + randomVariation);
      
      const maxCapacity = 20;
      const available = Math.max(0, maxCapacity - totalBookings);
      
      // 서비스별 예약 분배
      const hotelBookings = Math.floor(totalBookings * 0.4);
      const groomingBookings = Math.floor(totalBookings * 0.4);
      const daycareBookings = totalBookings - hotelBookings - groomingBookings;

      data[dateString] = {
        total: totalBookings,
        available: available,
        services: {
          hotel: hotelBookings,
          grooming: groomingBookings,
          daycare: daycareBookings
        }
      };
    }

    setReservationData(data);
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // 이전 달의 빈 칸들
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // 현재 달의 날짜들
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const getDateString = (day: number) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    return new Date(year, month, day).toISOString().split('T')[0];
  };

  const getAvailabilityStatus = (day: number) => {
    const dateString = getDateString(day);
    const data = reservationData[dateString];
    
    if (!data) return 'available';
    
    if (data.available === 0) return 'full';
    if (data.available <= 3) return 'limited';
    return 'available';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'full': return 'bg-red-500 text-white';
      case 'limited': return 'bg-yellow-500 text-white';
      case 'available': return 'bg-green-500 text-white';
      default: return 'bg-gray-200 text-gray-600';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'full': return '예약 마감';
      case 'limited': return '잔여 적음';
      case 'available': return '예약 가능';
      default: return '';
    }
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

  const monthNames = [
    '1월', '2월', '3월', '4월', '5월', '6월',
    '7월', '8월', '9월', '10월', '11월', '12월'
  ];

  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-bold text-gray-900">
            <i className="ri-calendar-line mr-2 text-teal-600"></i>
            예약 현황 달력
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
        <div className="flex items-center justify-center space-x-6 mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-sm text-gray-700">예약 가능</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <span className="text-sm text-gray-700">잔여 적음</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-sm text-gray-700">예약 마감</span>
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
            return <div key={index} className="p-3"></div>;
          }

          const dateString = getDateString(day);
          const status = getAvailabilityStatus(day);
          const data = reservationData[dateString];
          const isToday = dateString === today;
          const isSelected = selectedDate === dateString;

          return (
            <div
              key={day}
              onClick={() => handleDateClick(day)}
              className={`relative p-3 border border-gray-200 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                isToday ? 'ring-2 ring-teal-500' : ''
              } ${isSelected ? 'bg-teal-50 border-teal-300' : 'hover:bg-gray-50'}`}
            >
              <div className="text-center">
                <div className={`text-lg font-semibold mb-1 ${
                  index % 7 === 0 ? 'text-red-600' : 
                  index % 7 === 6 ? 'text-blue-600' : 'text-gray-900'
                }`}>
                  {day}
                </div>
                
                {data && (
                  <div className="space-y-1">
                    <div className={`text-xs px-2 py-1 rounded-full ${getStatusColor(status)}`}>
                      {getStatusText(status)}
                    </div>
                    <div className="text-xs text-gray-600">
                      {data.total}건 예약
                    </div>
                  </div>
                )}
              </div>

              {isToday && (
                <div className="absolute top-1 right-1">
                  <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 선택된 날짜 상세 정보 */}
      {selectedDate && reservationData[selectedDate] && (
        <div className="mt-6 p-4 bg-teal-50 rounded-lg border border-teal-200">
          <h4 className="font-semibold text-teal-900 mb-3">
            {new Date(selectedDate).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long'
            })} 예약 현황
          </h4>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700">총 예약:</span>
                <span className="font-semibold text-gray-900">
                  {reservationData[selectedDate].total}건
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700">예약 가능:</span>
                <span className="font-semibold text-green-600">
                  {reservationData[selectedDate].available}건
                </span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-700 mb-2">서비스별 예약</div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    <i className="ri-hotel-line mr-1"></i>호텔:
                  </span>
                  <span>{reservationData[selectedDate].services.hotel}건</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    <i className="ri-scissors-line mr-1"></i>미용:
                  </span>
                  <span>{reservationData[selectedDate].services.grooming}건</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    <i className="ri-home-heart-line mr-1"></i>데이케어:
                  </span>
                  <span>{reservationData[selectedDate].services.daycare}건</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
