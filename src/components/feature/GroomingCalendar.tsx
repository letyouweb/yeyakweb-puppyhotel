import { useState, useEffect } from 'react';

interface GroomingReservation {
  id: string;
  petName: string;
  ownerName: string;
  time: string;
  phone: string;
  style: string;
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
}

interface GroomingData {
  [date: string]: GroomingReservation[];
}

export default function GroomingCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [groomingData, setGroomingData] = useState<GroomingData>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    loadGroomingData();
    
    // 실시간 예약 업데이트 감지
    const handleReservationUpdate = () => {
      loadGroomingData();
    };
    
    window.addEventListener('reservationUpdated', handleReservationUpdate);
    
    return () => {
      window.removeEventListener('reservationUpdated', handleReservationUpdate);
    };
  }, [currentDate]);

  const loadGroomingData = () => {
    // 저장된 미용 예약 데이터 불러오기
    const savedData = localStorage.getItem('groomingReservations');
    if (savedData) {
      const reservations = JSON.parse(savedData);
      const groupedData: GroomingData = {};
      
      reservations.forEach((reservation: any) => {
        const date = reservation.date;
        if (!groupedData[date]) {
          groupedData[date] = [];
        }
        groupedData[date].push({
          id: reservation.id,
          petName: reservation.petName,
          ownerName: reservation.ownerName || '고객',
          time: reservation.time,
          phone: reservation.phone,
          style: reservation.style || '기본미용',
          status: reservation.status
        });
      });

      // 시간순으로 정렬
      Object.keys(groupedData).forEach(date => {
        groupedData[date].sort((a, b) => a.time.localeCompare(b.time));
      });

      setGroomingData(groupedData);
    } else {
      // 모의 데이터 생성
      generateMockGroomingData();
    }
  };

  const generateMockGroomingData = () => {
    const data: GroomingData = {};
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const timeSlots = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
    const petNames = ['초코', '바둑이', '뽀삐', '코코', '몽이', '루루', '보리', '콩이'];
    const ownerNames = ['김민수', '이영희', '박철수', '정수진', '최동훈', '한지민', '송민호', '윤서연'];
    const styles = ['전체미용', '부분컷', '목욕+컷', '발톱정리', '얼굴컷', '위생미용'];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateString = date.toISOString().split('T')[0];
      
      // 주말과 평일에 따른 예약 패턴
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const maxReservations = isWeekend ? 6 : 4;
      const numReservations = Math.floor(Math.random() * maxReservations);
      
      if (numReservations > 0) {
        const dayReservations: GroomingReservation[] = [];
        const usedTimes = new Set<string>();
        
        for (let i = 0; i < numReservations; i++) {
          let time;
          do {
            time = timeSlots[Math.floor(Math.random() * timeSlots.length)];
          } while (usedTimes.has(time));
          
          usedTimes.add(time);
          
          dayReservations.push({
            id: `grooming-${dateString}-${i}`,
            petName: petNames[Math.floor(Math.random() * petNames.length)],
            ownerName: ownerNames[Math.floor(Math.random() * ownerNames.length)],
            time: time,
            phone: `010-${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`,
            style: styles[Math.floor(Math.random() * styles.length)],
            status: ['confirmed', 'pending', 'completed'][Math.floor(Math.random() * 3)] as any
          });
        }
        
        dayReservations.sort((a, b) => a.time.localeCompare(b.time));
        data[dateString] = dayReservations;
      }
    }

    setGroomingData(data);
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
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
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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
            return <div key={index} className="p-3"></div>;
          }

          const dateString = getDateString(day);
          const reservationCount = getReservationCount(day);
          const isToday = dateString === today;
          const isSelected = selectedDate === dateString;

          return (
            <div
              key={day}
              onClick={() => handleDateClick(day)}
              className={`relative p-3 border border-gray-200 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                isToday ? 'ring-2 ring-yellow-500' : ''
              } ${isSelected ? 'bg-yellow-50 border-yellow-300' : 'hover:bg-gray-50'}`}
            >
              <div className="text-center">
                <div className={`text-lg font-semibold mb-1 ${
                  index % 7 === 0 ? 'text-red-600' : 
                  index % 7 === 6 ? 'text-blue-600' : 'text-gray-900'
                }`}>
                  {day}
                </div>
                
                <div className="space-y-1">
                  <div className={`text-xs px-2 py-1 rounded-full ${getStatusColor(reservationCount)}`}>
                    {getStatusText(reservationCount)}
                  </div>
                  {reservationCount > 0 && (
                    <div className="text-xs text-gray-600">
                      {reservationCount}건 예약
                    </div>
                  )}
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
            {new Date(selectedDate).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long'
            })} 미용 예약 현황
          </h4>
          
          <div className="space-y-3">
            {groomingData[selectedDate].map((reservation, index) => (
              <div key={index} className="bg-white rounded-lg p-3 border border-yellow-200">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-semibold text-gray-900">{reservation.time}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${getReservationStatusColor(reservation.status)}`}>
                        {reservation.status === 'confirmed' ? '확정' :
                         reservation.status === 'pending' ? '대기' :
                         reservation.status === 'completed' ? '완료' : '취소'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-700">
                      <div className="flex items-center space-x-4">
                        <span><strong>반려동물:</strong> {reservation.petName}</span>
                        <span><strong>보호자:</strong> {reservation.ownerName}</span>
                      </div>
                      <div className="flex items-center space-x-4 mt-1">
                        <span><strong>미용스타일:</strong> {reservation.style}</span>
                        <span><strong>연락처:</strong> {reservation.phone}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedDate && !groomingData[selectedDate] && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="font-semibold text-gray-700 mb-2">
            {new Date(selectedDate).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long'
            })}
          </h4>
          <p className="text-gray-600">이 날은 미용 예약이 없습니다.</p>
        </div>
      )}
    </div>
  );
}