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

/**
 * 미용 예약 달력 컴포넌트
 * - localStorage에 저장된 groomingReservations 데이터를 불러와 날짜별로 그룹화하여 달력에 표시합니다.
 * - 선택한 날짜의 예약 목록을 보여주며, 수동으로 예약 추가/삭제가 가능합니다.
 */
export default function GroomingCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [groomingData, setGroomingData] = useState<GroomingData>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  // 수동 예약 추가 폼 표시 여부
  const [showAddForm, setShowAddForm] = useState(false);
  // 새 예약 입력 값 상태
  const [newReservation, setNewReservation] = useState({
    petName: '',
    ownerName: '',
    time: '',
    phone: '',
    style: ''
  });

  useEffect(() => {
    loadGroomingData();
    // 실시간 예약 업데이트 감지: reservationUpdated 이벤트가 발생하면 데이터 재로드
    const handleReservationUpdate = () => {
      loadGroomingData();
    };
    window.addEventListener('reservationUpdated', handleReservationUpdate);
    return () => {
      window.removeEventListener('reservationUpdated', handleReservationUpdate);
    };
  }, [currentDate]);

  const loadGroomingData = () => {
    try {
      // 미용 예약은 allReservations에서 service가 'grooming'인 것과 groomingReservations 모두 포함
      const allRaw = localStorage.getItem('allReservations');
      const groomingRaw = localStorage.getItem('groomingReservations');
      let reservations: any[] = [];
      // 1) 전체 예약 중 미용(grooming) 예약 필터링
      if (allRaw) {
        try {
          const all = JSON.parse(allRaw);
          const fromAll = all.filter((r: any) => r && r.service === 'grooming');
          reservations = reservations.concat(fromAll);
        } catch (e) {
          console.warn('allReservations 파싱 실패:', e);
        }
      }
      // 2) 미용 달력에서 수동 추가한 예약 포함
      if (groomingRaw) {
        try {
          const fromGrooming = JSON.parse(groomingRaw);
          reservations = reservations.concat(fromGrooming);
        } catch (e) {
          console.warn('groomingReservations 파싱 실패:', e);
        }
      }
      if (!reservations.length) {
        generateMockGroomingData();
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
      // 4) 날짜별 그룹화
      const groupedData: GroomingData = {};
      deduped.forEach((reservation: any) => {
        const date = reservation.date;
        if (!date) return;
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
      // 시간순 정렬
      Object.keys(groupedData).forEach(date => {
        groupedData[date].sort((a, b) => a.time.localeCompare(b.time));
      });
      setGroomingData(groupedData);
    } catch (error) {
      console.warn('미용 예약 데이터 로드 실패:', error);
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
  // toISOString()은 UTC 기준으로 날짜를 문자열로 반환하여 하루가 밀리는 문제가 발생할 수 있으므로
  // 연도/월/일을 직접 조합하여 "YYYY-MM-DD" 형식의 문자열을 생성한다.
  const getDateString = (day: number) => {
    const year = currentDate.getFullYear();
    // getMonth()는 0부터 시작하므로 +1을 해준다
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
    // 폼을 초기화하고 숨김
    setShowAddForm(false);
    setNewReservation({ petName: '', ownerName: '', time: '', phone: '', style: '' });
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

  // 입력 변경 핸들러
  const handleNewChange = (field: keyof typeof newReservation, value: string) => {
    setNewReservation((prev) => ({ ...prev, [field]: value }));
  };

  // 새 예약 추가
  const addReservation = () => {
    if (!selectedDate) return;
    const reservations = JSON.parse(localStorage.getItem('groomingReservations') || '[]');
    const newRes = {
      id: `grooming-${selectedDate}-${Date.now()}`,
      petName: newReservation.petName || '반려동물',
      ownerName: newReservation.ownerName || '고객',
      date: selectedDate,
      time: newReservation.time || '미정',
      phone: newReservation.phone || '',
      style: newReservation.style || '기본미용',
      status: 'confirmed',
      service: 'grooming'
    };
    reservations.push(newRes);
    localStorage.setItem('groomingReservations', JSON.stringify(reservations));
    setNewReservation({ petName: '', ownerName: '', time: '', phone: '', style: '' });
    setShowAddForm(false);
    loadGroomingData();
    window.dispatchEvent(new CustomEvent('reservationUpdated'));
  };

  // 예약 삭제
  const deleteReservation = (id: string) => {
    const reservations = JSON.parse(localStorage.getItem('groomingReservations') || '[]');
    const newData = reservations.filter((r: any) => r.id !== id);
    localStorage.setItem('groomingReservations', JSON.stringify(newData));
    loadGroomingData();
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
            <i className="ri-scissors-line mr-2 text-yellow-600"></i>
            미용 예약 달력
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
          <div key={day} className={`p-3 text-center font-semibold text-sm ${index === 0 ? 'text-red-600' : index === 6 ? 'text-blue-600' : 'text-gray-700'}`}>{day}</div>
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
            <div key={dateString} onClick={() => handleDateClick(day)} className={`relative p-3 border border-gray-200 rounded-lg cursor-pointer transition-all hover:shadow-md ${isToday ? 'ring-2 ring-yellow-500' : ''} ${isSelected ? 'bg-yellow-50 border-yellow-300' : 'hover:bg-gray-50'}`}>
              <div className="text-center">
                <div className={`text-lg font-semibold mb-1 ${index % 7 === 0 ? 'text-red-600' : index % 7 === 6 ? 'text-blue-600' : 'text-gray-900'}`}>{day}</div>
                <div className="space-y-1">
                  <div className={`text-xs px-2 py-1 rounded-full ${getStatusColor(reservationCount)}`}>{getStatusText(reservationCount)}</div>
                  {reservationCount > 0 && <div className="text-xs text-gray-600">{reservationCount}건 예약</div>}
                </div>
              </div>
              {isToday && <div className="absolute top-1 right-1"><div className="w-2 h-2 bg-yellow-500 rounded-full"></div></div>}
            </div>
          );
        })}
      </div>
      {/* 선택된 날짜 상세 정보 */}
      {selectedDate && groomingData[selectedDate] && (
        <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <h4 className="font-semibold text-yellow-900 mb-3">
            {new Date(selectedDate).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })} 미용 예약 현황
          </h4>
          <div className="space-y-3">
            {groomingData[selectedDate].map((reservation) => (
              <div key={reservation.id} className="bg-white rounded-lg p-3 border border-yellow-200">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-semibold text-gray-900">{reservation.time}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${getReservationStatusColor(reservation.status)}`}>
                        {reservation.status === 'confirmed' ? '확정' : reservation.status === 'pending' ? '대기' : reservation.status === 'completed' ? '완료' : '취소'}
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
                <input type="time" value={newReservation.time} onChange={(e) => handleNewChange('time', e.target.value)} className="w-full border p-2 rounded" />
                <input type="text" placeholder="연락처" value={newReservation.phone} onChange={(e) => handleNewChange('phone', e.target.value)} className="w-full border p-2 rounded" />
                <input type="text" placeholder="미용 스타일" value={newReservation.style} onChange={(e) => handleNewChange('style', e.target.value)} className="w-full border p-2 rounded" />
                <div className="flex space-x-2">
                  <button onClick={addReservation} className="bg-yellow-500 text-white px-3 py-1 rounded">추가</button>
                  <button onClick={() => { setShowAddForm(false); setNewReservation({ petName: '', ownerName: '', time: '', phone: '', style: '' }); }} className="border px-3 py-1 rounded">취소</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowAddForm(true)} className="bg-yellow-500 text-white px-3 py-1 rounded">예약 추가</button>
            )}
          </div>
        </div>
      )}
      {/* 예약이 없는 날짜에 대한 안내와 추가 폼 */}
      {selectedDate && !groomingData[selectedDate] && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="font-semibold text-gray-700 mb-2">
            {new Date(selectedDate).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
          </h4>
          <p className="text-gray-600 mb-4">이 날은 미용 예약이 없습니다.</p>
          {/* 예약이 없는 날에도 새 예약 추가 가능 */}
          <div>
            {showAddForm ? (
              <div className="space-y-2">
                <input type="text" placeholder="반려동물 이름" value={newReservation.petName} onChange={(e) => handleNewChange('petName', e.target.value)} className="w-full border p-2 rounded" />
                <input type="text" placeholder="보호자 이름" value={newReservation.ownerName} onChange={(e) => handleNewChange('ownerName', e.target.value)} className="w-full border p-2 rounded" />
                <input type="time" value={newReservation.time} onChange={(e) => handleNewChange('time', e.target.value)} className="w-full border p-2 rounded" />
                <input type="text" placeholder="연락처" value={newReservation.phone} onChange={(e) => handleNewChange('phone', e.target.value)} className="w-full border p-2 rounded" />
                <input type="text" placeholder="미용 스타일" value={newReservation.style} onChange={(e) => handleNewChange('style', e.target.value)} className="w-full border p-2 rounded" />
                <div className="flex space-x-2">
                  <button onClick={addReservation} className="bg-yellow-500 text-white px-3 py-1 rounded">추가</button>
                  <button onClick={() => { setShowAddForm(false); setNewReservation({ petName: '', ownerName: '', time: '', phone: '', style: '' }); }} className="border px-3 py-1 rounded">취소</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowAddForm(true)} className="bg-yellow-500 text-white px-3 py-1 rounded">예약 추가</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}