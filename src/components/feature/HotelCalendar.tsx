import { useState, useEffect } from 'react';

interface HotelReservation {
  id: string;
  petName: string;
  ownerName: string;
  checkIn: string;
  checkOut: string;
  roomType: string;
  phone: string;
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
}

interface HotelData {
  [date: string]: HotelReservation[];
}

/**
 * 호텔 예약 달력 컴포넌트
 * - localStorage에 저장된 hotelReservations 데이터를 불러와 날짜별로 그룹화하여 달력에 표시합니다.
 * - 선택한 날짜의 예약 목록을 보여주며, 수동으로 예약을 추가/삭제할 수 있습니다.
 */
export default function HotelCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [hotelData, setHotelData] = useState<HotelData>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  // 예약 추가 폼 표시 여부
  const [showAddForm, setShowAddForm] = useState(false);
  // 새 호텔 예약 입력 값 상태
  const [newReservation, setNewReservation] = useState({
    petName: '',
    ownerName: '',
    checkOut: '',
    roomType: '',
    phone: ''
  });

  useEffect(() => {
    loadHotelData();
    // 실시간 예약 업데이트 감지
    const handleReservationUpdate = () => {
      loadHotelData();
    };
    window.addEventListener('reservationUpdated', handleReservationUpdate);
    return () => {
      window.removeEventListener('reservationUpdated', handleReservationUpdate);
    };
  }, [currentDate]);

  // 호텔 예약 데이터 불러오기 및 그룹화
  const loadHotelData = () => {
    try {
      // 호텔 예약은 allReservations에서 service가 'hotel'인 경우와 hotelReservations 모두를 포함한다.
      const allRaw = localStorage.getItem('allReservations');
      const hotelRaw = localStorage.getItem('hotelReservations');
      let reservations: any[] = [];
      // 1) 전체 예약 중 service === 'hotel' 항목 추가
      if (allRaw) {
        try {
          const all = JSON.parse(allRaw);
          const fromAll = all.filter((r: any) => r && r.service === 'hotel');
          reservations = reservations.concat(fromAll);
        } catch (e) {
          console.warn('allReservations 파싱 실패:', e);
        }
      }
      // 2) 호텔 달력에서 수동으로 추가한 예약 포함
      if (hotelRaw) {
        try {
          const fromHotel = JSON.parse(hotelRaw);
          reservations = reservations.concat(fromHotel);
        } catch (e) {
          console.warn('hotelReservations 파싱 실패:', e);
        }
      }
      // 예약 데이터가 없으면 모의 데이터 생성
      if (!reservations.length) {
        generateMockHotelData();
        return;
      }
      // 3) id 기준으로 중복 제거
      const seenIds = new Set<string>();
      const deduped: any[] = [];
      for (const res of reservations) {
        if (!res || !res.id) continue;
        if (seenIds.has(res.id)) continue;
        seenIds.add(res.id);
        deduped.push(res);
      }
      // 4) 체크인 날짜 기준으로 그룹화
      const groupedData: HotelData = {};
      deduped.forEach((reservation: any) => {
        const checkInDate = reservation.checkIn || reservation.date;
        if (!checkInDate) return;
        if (!groupedData[checkInDate]) {
          groupedData[checkInDate] = [];
        }
        groupedData[checkInDate].push({
          id: reservation.id,
          petName: reservation.petName,
          ownerName: reservation.ownerName || '고객',
          checkIn: checkInDate,
          checkOut: reservation.checkOut || '미정',
          roomType: reservation.roomType || '일반룸',
          phone: reservation.phone,
          status: reservation.status
        });
      });
      setHotelData(groupedData);
    } catch (error) {
      console.warn('호텔 예약 데이터 로드 실패:', error);
      generateMockHotelData();
    }
  };

  // 모의 호텔 데이터 생성 (개발용)
  const generateMockHotelData = () => {
    const data: HotelData = {};
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const petNames = ['초코', '바둑이', '뽀삐', '코코', '몽이', '루루', '보리', '콩이', '마루', '하늘'];
    const ownerNames = ['김민수', '이영희', '박철수', '정수진', '최동훈', '한지민', '송민호', '윤서연', '장미영', '오준석'];
    const roomTypes = ['소형견룸', '중형견룸', '대형견룸', '고양이룸', '프리미엄룸'];
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateString = date.toISOString().split('T')[0];
      // 주말과 평일에 따른 예약 패턴
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const maxReservations = isWeekend ? 8 : 5;
      const numReservations = Math.floor(Math.random() * maxReservations);
      if (numReservations > 0) {
        const dayReservations: HotelReservation[] = [];
        for (let i = 0; i < numReservations; i++) {
          const checkOutDate = new Date(date);
          checkOutDate.setDate(checkOutDate.getDate() + Math.floor(Math.random() * 5) + 1);
          dayReservations.push({
            id: `hotel-${dateString}-${i}`,
            petName: petNames[Math.floor(Math.random() * petNames.length)],
            ownerName: ownerNames[Math.floor(Math.random() * ownerNames.length)],
            checkIn: dateString,
            checkOut: checkOutDate.toISOString().split('T')[0],
            roomType: roomTypes[Math.floor(Math.random() * roomTypes.length)],
            phone: `010-${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`,
            status: ['confirmed', 'pending', 'completed'][Math.floor(Math.random() * 3)] as any
          });
        }
        data[dateString] = dayReservations;
      }
    }
    setHotelData(data);
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    const days: (number | null)[] = [];
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
    return hotelData[dateString]?.length || 0;
  };

  const getStatusColor = (count: number) => {
    if (count === 0) return 'bg-gray-100 text-gray-500';
    if (count <= 3) return 'bg-green-100 text-green-700';
    if (count <= 6) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  const getStatusText = (count: number) => {
    if (count === 0) return '예약없음';
    if (count <= 3) return '여유';
    if (count <= 6) return '보통';
    return '만실';
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
    // 폼을 초기화
    setShowAddForm(false);
    setNewReservation({ petName: '', ownerName: '', checkOut: '', roomType: '', phone: '' });
  };

  const handleDateClick = (day: number) => {
    const dateString = getDateString(day);
    setSelectedDate(selectedDate === dateString ? null : dateString);
    // 날짜를 바꿀 때 폼을 초기화
    setShowAddForm(false);
    setNewReservation({ petName: '', ownerName: '', checkOut: '', roomType: '', phone: '' });
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

  // 새 예약 폼 입력 핸들러
  const handleNewChange = (field: keyof typeof newReservation, value: string) => {
    setNewReservation((prev) => ({ ...prev, [field]: value }));
  };

  // 호텔 예약 추가
  const addReservation = () => {
    if (!selectedDate) return;
    const reservations = JSON.parse(localStorage.getItem('hotelReservations') || '[]');
    const newRes: any = {
      id: `hotel-${selectedDate}-${Date.now()}`,
      petName: newReservation.petName || '반려동물',
      ownerName: newReservation.ownerName || '고객',
      checkIn: selectedDate,
      checkOut: newReservation.checkOut || selectedDate,
      roomType: newReservation.roomType || '일반룸',
      phone: newReservation.phone || '',
      status: 'confirmed'
    };
    reservations.push(newRes);
    localStorage.setItem('hotelReservations', JSON.stringify(reservations));
    // 폼 초기화 및 닫기
    setNewReservation({ petName: '', ownerName: '', checkOut: '', roomType: '', phone: '' });
    setShowAddForm(false);
    loadHotelData();
    window.dispatchEvent(new CustomEvent('reservationUpdated'));
  };

  // 호텔 예약 삭제
  const deleteReservation = (id: string) => {
    const reservations = JSON.parse(localStorage.getItem('hotelReservations') || '[]');
    const newData = reservations.filter((r: any) => r.id !== id);
    localStorage.setItem('hotelReservations', JSON.stringify(newData));
    loadHotelData();
    window.dispatchEvent(new CustomEvent('reservationUpdated'));
  };

  const monthNames = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
  const dayNames = ['일','월','화','수','목','금','토'];
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-bold text-gray-900">
            <i className="ri-hotel-line mr-2 text-blue-600"></i>
            호텔 예약 달력
          </h3>
          <div className="flex items-center space-x-2">
            <button onClick={() => navigateMonth('prev')} className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors cursor-pointer">
              <i className="ri-arrow-left-line text-gray-600"></i>
            </button>
            <h4 className="text-xl font-semibold text-gray-800 min-w-[120px] text-center">
              {currentDate.getFullYear()}년 {monthNames[currentDate.getMonth()]}
            </h4>
            <button onClick={() => navigateMonth('next')} className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors cursor-pointer">
              <i className="ri-arrow-right-line text-gray-600"></i>
            </button>
          </div>
        </div>
        {/* 범례 */}
        <div className="flex items-center justify-center space-x-6 mb-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gray-100 rounded"></div>
            <span className="text-sm text-gray-700">예약없음</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-100 rounded"></div>
            <span className="text-sm text-gray-700">여유 (1-3건)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-yellow-100 rounded"></div>
            <span className="text-sm text-gray-700">보통 (4-6건)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-100 rounded"></div>
            <span className="text-sm text-gray-700">만실 (7건+)</span>
          </div>
        </div>
      </div>
      {/* 달력 헤더 */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((day, index) => (
          <div key={day} className={`p-3 text-center font-semibold text-sm ${index === 0 ? 'text-red-600' : index === 6 ? 'text-blue-600' : 'text-gray-700'}`}>{day}</div>
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
            <div key={day} onClick={() => handleDateClick(day)} className={`relative p-3 border border-gray-200 rounded-lg cursor-pointer transition-all hover:shadow-md ${isToday ? 'ring-2 ring-blue-500' : ''} ${isSelected ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'}`}>
              <div className="text-center">
                <div className={`text-lg font-semibold mb-1 ${index % 7 === 0 ? 'text-red-600' : index % 7 === 6 ? 'text-blue-600' : 'text-gray-900'}`}>{day}</div>
                <div className="space-y-1">
                  <div className={`text-xs px-2 py-1 rounded-full ${getStatusColor(reservationCount)}`}>{getStatusText(reservationCount)}</div>
                  {reservationCount > 0 && <div className="text-xs text-gray-600">{reservationCount}건 예약</div>}
                </div>
              </div>
              {isToday && <div className="absolute top-1 right-1"><div className="w-2 h-2 bg-blue-500 rounded-full"></div></div>}
            </div>
          );
        })}
      </div>
      {/* 선택된 날짜 상세 정보 */}
      {selectedDate && hotelData[selectedDate] && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-3">
            {new Date(selectedDate).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })} 호텔 예약 현황
          </h4>
          <div className="space-y-3">
            {hotelData[selectedDate].map((reservation, index) => (
              <div key={index} className="bg-white rounded-lg p-3 border border-blue-200">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-semibold text-gray-900">{reservation.petName}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${getReservationStatusColor(reservation.status)}`}>{reservation.status === 'confirmed' ? '확정' : reservation.status === 'pending' ? '대기' : reservation.status === 'completed' ? '완료' : '취소'}</span>
                    </div>
                    <div className="text-sm text-gray-700">
                      <div className="flex items-center space-x-4">
                        <span><strong>보호자:</strong> {reservation.ownerName}</span>
                        <span><strong>룸타입:</strong> {reservation.roomType}</span>
                      </div>
                      <div className="flex items-center space-x-4 mt-1">
                        <span><strong>체크인:</strong> {reservation.checkIn}</span>
                        <span><strong>체크아웃:</strong> {reservation.checkOut}</span>
                      </div>
                      <div className="mt-1">
                        <span><strong>연락처:</strong> {reservation.phone}</span>
                      </div>
                    </div>
                  </div>
                  {/* 삭제 버튼 */}
                  <button onClick={() => deleteReservation(reservation.id)} className="text-red-500 text-xs ml-2">삭제</button>
                </div>
              </div>
            ))}
          </div>
          {/* 예약 추가/폼 */}
          <div className="mt-4">
            {showAddForm ? (
              <div className="space-y-2">
                <input type="text" placeholder="반려동물 이름" value={newReservation.petName} onChange={(e) => handleNewChange('petName', e.target.value)} className="w-full border p-2 rounded" />
                <input type="text" placeholder="보호자 이름" value={newReservation.ownerName} onChange={(e) => handleNewChange('ownerName', e.target.value)} className="w-full border p-2 rounded" />
                <input type="date" placeholder="체크아웃" value={newReservation.checkOut} onChange={(e) => handleNewChange('checkOut', e.target.value)} className="w-full border p-2 rounded" />
                <input type="text" placeholder="룸타입" value={newReservation.roomType} onChange={(e) => handleNewChange('roomType', e.target.value)} className="w-full border p-2 rounded" />
                <input type="text" placeholder="연락처" value={newReservation.phone} onChange={(e) => handleNewChange('phone', e.target.value)} className="w-full border p-2 rounded" />
                <div className="flex space-x-2">
                  <button onClick={addReservation} className="bg-blue-500 text-white px-3 py-1 rounded">추가</button>
                  <button onClick={() => { setShowAddForm(false); setNewReservation({ petName: '', ownerName: '', checkOut: '', roomType: '', phone: '' }); }} className="border px-3 py-1 rounded">취소</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowAddForm(true)} className="bg-blue-500 text-white px-3 py-1 rounded">예약 추가</button>
            )}
          </div>
        </div>
      )}
      {/* 예약이 없는 날짜에 대한 안내와 추가 폼 */}
      {selectedDate && !hotelData[selectedDate] && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="font-semibold text-gray-700 mb-2">
            {new Date(selectedDate).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
          </h4>
          <p className="text-gray-600 mb-4">이 날은 호텔 예약이 없습니다.</p>
          {/* 예약이 없는 날에도 새 예약 추가 가능 */}
          <div>
            {showAddForm ? (
              <div className="space-y-2">
                <input type="text" placeholder="반려동물 이름" value={newReservation.petName} onChange={(e) => handleNewChange('petName', e.target.value)} className="w-full border p-2 rounded" />
                <input type="text" placeholder="보호자 이름" value={newReservation.ownerName} onChange={(e) => handleNewChange('ownerName', e.target.value)} className="w-full border p-2 rounded" />
                <input type="date" placeholder="체크아웃" value={newReservation.checkOut} onChange={(e) => handleNewChange('checkOut', e.target.value)} className="w-full border p-2 rounded" />
                <input type="text" placeholder="룸타입" value={newReservation.roomType} onChange={(e) => handleNewChange('roomType', e.target.value)} className="w-full border p-2 rounded" />
                <input type="text" placeholder="연락처" value={newReservation.phone} onChange={(e) => handleNewChange('phone', e.target.value)} className="w-full border p-2 rounded" />
                <div className="flex space-x-2">
                  <button onClick={addReservation} className="bg-blue-500 text-white px-3 py-1 rounded">추가</button>
                  <button onClick={() => { setShowAddForm(false); setNewReservation({ petName: '', ownerName: '', checkOut: '', roomType: '', phone: '' }); }} className="border px-3 py-1 rounded">취소</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowAddForm(true)} className="bg-blue-500 text-white px-3 py-1 rounded">예약 추가</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}