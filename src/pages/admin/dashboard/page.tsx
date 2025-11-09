import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GroomingCalendar from '../../../components/feature/GroomingCalendar';
import { loadAllReservations, updateReservationStatus, subscribeToReservations } from '../../../lib/dashboardHelper';

interface Reservation {
  id: string;
  petName: string;
  ownerName: string;
  service: 'hotel' | 'grooming' | 'daycare';
  date: string;
  time: string;
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
  phone: string;
  roomType?: string;
  checkIn?: string;
  checkOut?: string;
  style?: string;
}

interface AdminAccount {
  username: string;
  password: string;
  email: string;
  securityQuestion: string;
  securityAnswer: string;
}

interface WeeklySchedule {
  [key: string]: {
    isOpen: boolean;
    timeSlots: string[];
    maxBookings: number;
  };
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('calendar');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [adminAccount, setAdminAccount] = useState<AdminAccount>({
    username: 'admin',
    password: 'puppyhotel2024',
    email: 'admin@puppyhotel.com',
    securityQuestion: '가장 좋아하는 반려동물의 이름은?',
    securityAnswer: 'puppy'
  });
  const [isEditingAccount, setIsEditingAccount] = useState(false);
  const [calendarSettings, setCalendarSettings] = useState({
    isEnabled: false,
    businessHours: {
      start: '09:00',
      end: '20:00'
    },
    availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    maxBookingsPerDay: 20
  });

  // 요일별 미용예약 설정
  const [weeklyGroomingSchedule, setWeeklyGroomingSchedule] = useState<WeeklySchedule>({
    monday: { isOpen: true, timeSlots: ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'], maxBookings: 8 },
    tuesday: { isOpen: true, timeSlots: ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'], maxBookings: 8 },
    wednesday: { isOpen: true, timeSlots: ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'], maxBookings: 8 },
    thursday: { isOpen: true, timeSlots: ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'], maxBookings: 8 },
    friday: { isOpen: true, timeSlots: ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'], maxBookings: 8 },
    saturday: { isOpen: true, timeSlots: ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00'], maxBookings: 6 },
    sunday: { isOpen: false, timeSlots: [], maxBookings: 0 }
  });

  const navigate = useNavigate();

  const dayNames = {
    monday: '월요일',
    tuesday: '화요일', 
    wednesday: '수요일',
    thursday: '목요일',
    friday: '금요일',
    saturday: '토요일',
    sunday: '일요일'
  };

  useEffect(() => {
    // 관리자 인증 확인
    const isAuthenticated = localStorage.getItem('isAdminLoggedIn');
    if (!isAuthenticated) {
      navigate('/admin');
      return;
    }

    // Supabase에서 실시간 예약 데이터 불러오기
    const loadData = async () => {
      try {
        const data = await loadAllReservations();
        setReservations(data);
      } catch (error) {
        console.error('데이터 로드 실패:', error);
      }
    };

    loadData();

    // 실시간 구독 설정
    const subscription = subscribeToReservations((update) => {
      if (update.type === 'INSERT' || update.type === 'UPDATE') {
        setReservations(prev => {
          const exists = prev.find(r => r.id === update.data.id);
          if (exists) {
            return prev.map(r => r.id === update.data.id ? update.data : r);
          } else {
            return [...prev, update.data];
          }
        });
      } else if (update.type === 'DELETE') {
        setReservations(prev => prev.filter(r => r.id !== update.id));
      }
    });

    // 정리
    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const loadReservationData = () => {
    // 전체 예약 데이터 불러오기
    const allReservations = JSON.parse(localStorage.getItem('allReservations') || '[]');
    const hotelReservations = JSON.parse(localStorage.getItem('hotelReservations') || '[]');
    const groomingReservations = JSON.parse(localStorage.getItem('groomingReservations') || '[]');
    
    // 기존 모의 데이터와 실제 예약 데이터 합치기
    const mockData: Reservation[] = [
      {
        id: '1',
        petName: '초코',
        ownerName: '김민수',
        service: 'grooming',
        date: new Date().toISOString().split('T')[0],
        time: '10:00',
        status: 'confirmed',
        phone: '010-1234-5678',
        style: '전체미용'
      },
      {
        id: '2',
        petName: '바둑이',
        ownerName: '이영희',
        service: 'hotel',
        date: new Date().toISOString().split('T')[0],
        time: '14:00',
        status: 'pending',
        phone: '010-2345-6789',
        roomType: '중형견룸',
        checkIn: new Date().toISOString().split('T')[0],
        checkOut: new Date(Date.now() + 86400000).toISOString().split('T')[0]
      },
      {
        id: '3',
        petName: '뽀삐',
        ownerName: '박철수',
        service: 'grooming',
        date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        time: '11:30',
        status: 'pending',
        phone: '010-3456-7890',
        style: '부분컷'
      },
      {
        id: '4',
        petName: '코코',
        ownerName: '정수진',
        service: 'daycare',
        date: new Date().toISOString().split('T')[0],
        time: '09:00',
        status: 'completed',
        phone: '010-4567-8901'
      },
      {
        id: '5',
        petName: '몽이',
        ownerName: '최동훈',
        service: 'grooming',
        date: new Date(Date.now() + 172800000).toISOString().split('T')[0],
        time: '15:00',
        status: 'pending',
        phone: '010-5678-9012',
        style: '목욕+컷'
      },
      {
        id: '6',
        petName: '루루',
        ownerName: '한지민',
        service: 'hotel',
        date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        time: '16:00',
        status: 'pending',
        phone: '010-6789-0123',
        roomType: '소형견룸',
        checkIn: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        checkOut: new Date(Date.now() + 259200000).toISOString().split('T')[0]
      },
      {
        id: '7',
        petName: '보리',
        ownerName: '송민호',
        service: 'daycare',
        date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        time: '08:00',
        status: 'pending',
        phone: '010-7890-1234'
      }
    ];

    // 실제 예약 데이터를 Reservation 형식으로 변환
    const convertedReservations = allReservations.map((reservation: any) => ({
      id: reservation.id,
      petName: reservation.petName,
      ownerName: reservation.ownerName || '고객',
      service: reservation.service,
      date: reservation.date || reservation.checkIn,
      time: reservation.time || '미정',
      status: reservation.status,
      phone: reservation.phone,
      roomType: reservation.roomType,
      checkIn: reservation.checkIn,
      checkOut: reservation.checkOut,
      style: reservation.style
    }));

    // 모의 데이터와 실제 데이터 합치기
    const combinedReservations = [...mockData, ...convertedReservations];
    setReservations(combinedReservations);
  };

  const handleLogout = () => {
    localStorage.removeItem('adminAuth');
    navigate('/');
  };

  const handleCalendarSetup = () => {
    const updatedSettings = { ...calendarSettings, isEnabled: true };
    setCalendarSettings(updatedSettings);
    localStorage.setItem('calendarSettings', JSON.stringify(updatedSettings));
    alert('캘린더 설정이 완료되었습니다. AI 상담 챗봇이 24시간 예약 문의를 받을 수 있습니다.');
  };

  const handleAccountUpdate = () => {
    localStorage.setItem('adminAccount', JSON.stringify(adminAccount));
    setIsEditingAccount(false);
    alert('관리자 계정 정보가 업데이트되었습니다.');
  };

  const handleWeeklyScheduleUpdate = (day: string, field: string, value: any) => {
    const updatedSchedule = {
      ...weeklyGroomingSchedule,
      [day]: {
        ...weeklyGroomingSchedule[day],
        [field]: value
      }
    };
    setWeeklyGroomingSchedule(updatedSchedule);
    localStorage.setItem('weeklyGroomingSchedule', JSON.stringify(updatedSchedule));
  };

  const addTimeSlot = (day: string, time: string) => {
    if (time && !weeklyGroomingSchedule[day].timeSlots.includes(time)) {
      const newTimeSlots = [...weeklyGroomingSchedule[day].timeSlots, time].sort();
      handleWeeklyScheduleUpdate(day, 'timeSlots', newTimeSlots);
    }
  };

  const removeTimeSlot = (day: string, time: string) => {
    const newTimeSlots = weeklyGroomingSchedule[day].timeSlots.filter(slot => slot !== time);
    handleWeeklyScheduleUpdate(day, 'timeSlots', newTimeSlots);
  };

  // 예약 상태 변경 함수
  const handleStatusChange = async (
    reservationId: string,
    newStatus: 'confirmed' | 'pending' | 'completed' | 'cancelled'
  ) => {
    try {
      // Supabase 업데이트 + SMS 자동 발송
      const result = await updateReservationStatus(reservationId, newStatus, true);
      
      if (result.success) {
        // 로컬 상태 업데이트
        setReservations(prev =>
          prev.map(r => r.id === reservationId ? result.data : r)
        );
        
        // 성공 알림
        if (newStatus === 'confirmed') {
          alert('예약이 확정되었으며, 고객에게 문자가 발송되었습니다.');
        }
      } else {
        alert('상태 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('상태 변경 실패:', error);
      alert('오류가 발생했습니다.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getServiceIcon = (service: string) => {
    switch (service) {
      case 'hotel': return 'ri-hotel-line';
      case 'grooming': return 'ri-scissors-line';
      case 'daycare': return 'ri-home-heart-line';
      default: return 'ri-service-line';
    }
  };

  const todayReservations = reservations.filter(r => r.date === new Date().toISOString().split('T')[0]);
  const groomingReservations = reservations.filter(r => r.service === 'grooming');
  const hotelReservations = reservations.filter(r => r.service === 'hotel');
  const daycareReservations = reservations.filter(r => r.service === 'daycare');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900" style={{fontFamily: 'Pacifico, serif'}}>
                PuppyHotel Admin
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <a href="/" className="text-gray-600 hover:text-gray-900 cursor-pointer">
                <i className="ri-home-line mr-2"></i>메인 사이트
              </a>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors whitespace-nowrap cursor-pointer"
              >
                <i className="ri-logout-box-line mr-2"></i>로그아웃
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">관리자 대시보드</h2>
          <p className="text-gray-600">PuppyHotel 운영 관리 시스템</p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('reservations')}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap cursor-pointer ${
                  activeTab === 'reservations'
                    ? 'border-teal-500 text-teal-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <i className="ri-list-check mr-2"></i>예약 관리
              </button>
              <button
                onClick={() => setActiveTab('grooming')}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap cursor-pointer ${
                  activeTab === 'grooming'
                    ? 'border-teal-500 text-teal-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <i className="ri-scissors-line mr-2"></i>미용예약현황
              </button>
              <button
                onClick={() => setActiveTab('hotel')}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap cursor-pointer ${
                  activeTab === 'hotel'
                    ? 'border-teal-500 text-teal-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <i className="ri-hotel-line mr-2"></i>호텔
              </button>
              <button
                onClick={() => setActiveTab('daycare')}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap cursor-pointer ${
                  activeTab === 'daycare'
                    ? 'border-teal-500 text-teal-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <i className="ri-home-heart-line mr-2"></i>데이케어
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'reservations' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-900">예약 관리</h3>
                
                <div className="grid md:grid-cols-4 gap-6">
                  <div className="bg-blue-50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-gray-900">오늘 예약</h4>
                      <span className="text-2xl font-bold text-blue-600">{todayReservations.length}</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      호텔 {todayReservations.filter(r => r.service === 'hotel').length}건, 
                      미용 {todayReservations.filter(r => r.service === 'grooming').length}건,
                      데이케어 {todayReservations.filter(r => r.service === 'daycare').length}건
                    </p>
                  </div>
                  
                  <div className="bg-green-50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-gray-900">이번 주</h4>
                      <span className="text-2xl font-bold text-green-600">{reservations.length}</span>
                    </div>
                    <p className="text-sm text-gray-600">전체 예약 건수</p>
                  </div>
                  
                  <div className="bg-yellow-50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-gray-900">대기 중</h4>
                      <span className="text-2xl font-bold text-yellow-600">
                        {reservations.filter(r => r.status === 'pending').length}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">확정 대기 예약</p>
                  </div>
                  
                  <div className="bg-purple-50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-gray-900">완료된 예약</h4>
                      <span className="text-2xl font-bold text-purple-600">
                        {reservations.filter(r => r.status === 'completed').length}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">이번 달 완료 건수</p>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h4 className="font-semibold text-gray-900">실시간 예약 현황</h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">반려동물</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">보호자</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">서비스</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">날짜/시간</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">연락처</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">관리</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {reservations.map((reservation) => (
                          <tr key={reservation.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {reservation.petName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {reservation.ownerName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="flex items-center">
                                <i className={`${getServiceIcon(reservation.service)} mr-2`}></i>
                                {reservation.service === 'hotel' ? '호텔' : 
                                 reservation.service === 'grooming' ? '미용' : '데이케어'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {reservation.date} {reservation.time}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(reservation.status)}`}>
                                {reservation.status === 'confirmed' ? '확정' :
                                 reservation.status === 'pending' ? '대기' :
                                 reservation.status === 'completed' ? '완료' : '취소'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {reservation.phone}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {reservation.status === 'pending' && (
                                <button
                                  onClick={() => handleStatusChange(reservation.id, 'confirmed')}
                                  className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 transition-colors whitespace-nowrap cursor-pointer mr-2"
                                >
                                  <i className="ri-check-line mr-1"></i>확정
                                </button>
                              )}
                              {reservation.status === 'confirmed' && (
                                <button
                                  onClick={() => handleStatusChange(reservation.id, 'completed')}
                                  className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 transition-colors whitespace-nowrap cursor-pointer mr-2"
                                >
                                  <i className="ri-check-double-line mr-1"></i>완료
                                </button>
                              )}
                              <button
                                onClick={() => handleStatusChange(reservation.id, 'cancelled')}
                                className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700 transition-colors whitespace-nowrap cursor-pointer"
                              >
                                <i className="ri-close-line mr-1"></i>취소
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'grooming' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-900">미용 예약 현황</h3>
                
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-pink-50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-gray-900">오늘 미용</h4>
                      <span className="text-2xl font-bold text-pink-600">
                        {groomingReservations.filter(r => r.date === new Date().toISOString().split('T')[0]).length}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">오늘 예정된 미용</p>
                  </div>
                  
                  <div className="bg-purple-50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-gray-900">이번 주</h4>
                      <span className="text-2xl font-bold text-purple-600">{groomingReservations.length}</span>
                    </div>
                    <p className="text-sm text-gray-600">전체 미용 예약</p>
                  </div>
                  
                  <div className="bg-indigo-50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-gray-900">대기 중</h4>
                      <span className="text-2xl font-bold text-indigo-600">
                        {groomingReservations.filter(r => r.status === 'pending').length}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">확정 대기 미용</p>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h4 className="font-semibold text-gray-900">미용 예약 목록</h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">반려동물</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">보호자</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">미용 스타일</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">날짜/시간</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">연락처</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">관리</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {groomingReservations.map((reservation) => (
                          <tr key={reservation.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {reservation.petName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {reservation.ownerName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {reservation.style || '기본 미용'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {reservation.date} {reservation.time}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(reservation.status)}`}>
                                {reservation.status === 'confirmed' ? '확정' :
                                 reservation.status === 'pending' ? '대기' :
                                 reservation.status === 'completed' ? '완료' : '취소'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {reservation.phone}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {reservation.status === 'pending' && (
                                <button
                                  onClick={() => handleStatusChange(reservation.id, 'confirmed')}
                                  className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 transition-colors whitespace-nowrap cursor-pointer mr-2"
                                >
                                  <i className="ri-check-line mr-1"></i>확정
                                </button>
                              )}
                              {reservation.status === 'confirmed' && (
                                <button
                                  onClick={() => handleStatusChange(reservation.id, 'completed')}
                                  className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 transition-colors whitespace-nowrap cursor-pointer mr-2"
                                >
                                  <i className="ri-check-double-line mr-1"></i>완료
                                </button>
                              )}
                              <button
                                onClick={() => handleStatusChange(reservation.id, 'cancelled')}
                                className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700 transition-colors whitespace-nowrap cursor-pointer"
                              >
                                <i className="ri-close-line mr-1"></i>취소
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">요일별 미용 예약 설정</h4>
                  <div className="space-y-4">
                    {Object.entries(weeklyGroomingSchedule).map(([day, schedule]) => (
                      <div key={day} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="font-medium text-gray-900">{dayNames[day as keyof typeof dayNames]}</h5>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={schedule.isOpen}
                              onChange={(e) => handleWeeklyScheduleUpdate(day, 'isOpen', e.target.checked)}
                              className="mr-2"
                            />
                            <span className="text-sm text-gray-600">운영</span>
                          </label>
                        </div>
                        
                        {schedule.isOpen && (
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">예약 가능 시간</label>
                              <div className="flex flex-wrap gap-2 mb-2">
                                {schedule.timeSlots.map((time) => (
                                  <span
                                    key={time}
                                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-800"
                                  >
                                    {time}
                                    <button
                                      onClick={() => removeTimeSlot(day, time)}
                                      className="ml-2 text-teal-600 hover:text-teal-800 cursor-pointer"
                                    >
                                      <i className="ri-close-line"></i>
                                    </button>
                                  </span>
                                ))}
                              </div>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="time"
                                  id={`time-${day}`}
                                  className="border border-gray-300 rounded px-3 py-1 text-sm"
                                />
                                <button
                                  onClick={() => {
                                    const input = document.getElementById(`time-${day}`) as HTMLInputElement;
                                    if (input.value) {
                                      addTimeSlot(day, input.value);
                                      input.value = '';
                                    }
                                  }}
                                  className="bg-teal-600 text-white px-3 py-1 rounded text-sm hover:bg-teal-700 transition-colors whitespace-nowrap cursor-pointer"
                                >
                                  <i className="ri-add-line mr-1"></i>추가
                                </button>
                              </div>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">최대 예약 수</label>
                              <input
                                type="number"
                                value={schedule.maxBookings}
                                onChange={(e) => handleWeeklyScheduleUpdate(day, 'maxBookings', parseInt(e.target.value))}
                                className="border border-gray-300 rounded px-3 py-2 text-sm w-20"
                                min="0"
                                max="20"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'hotel' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-900">호텔 예약 현황</h3>
                
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-blue-50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-gray-900">현재 투숙</h4>
                      <span className="text-2xl font-bold text-blue-600">
                        {hotelReservations.filter(r => r.status === 'confirmed' && 
                          new Date(r.checkIn || r.date) <= new Date() && 
                          new Date(r.checkOut || r.date) >= new Date()).length}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">현재 투숙 중인 반려동물</p>
                  </div>
                  
                  <div className="bg-green-50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-gray-900">이번 주</h4>
                      <span className="text-2xl font-bold text-green-600">{hotelReservations.length}</span>
                    </div>
                    <p className="text-sm text-gray-600">전체 호텔 예약</p>
                  </div>
                  
                  <div className="bg-yellow-50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-gray-900">대기 중</h4>
                      <span className="text-2xl font-bold text-yellow-600">
                        {hotelReservations.filter(r => r.status === 'pending').length}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">확정 대기 예약</p>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h4 className="font-semibold text-gray-900">호텔 예약 목록</h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">반려동물</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">보호자</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">객실 타입</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">체크인/체크아웃</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">연락처</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">관리</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {hotelReservations.map((reservation) => (
                          <tr key={reservation.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {reservation.petName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {reservation.ownerName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {reservation.roomType || '일반룸'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {reservation.checkIn} ~ {reservation.checkOut}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(reservation.status)}`}>
                                {reservation.status === 'confirmed' ? '확정' :
                                 reservation.status === 'pending' ? '대기' :
                                 reservation.status === 'completed' ? '완료' : '취소'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {reservation.phone}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {reservation.status === 'pending' && (
                                <button
                                  onClick={() => handleStatusChange(reservation.id, 'confirmed')}
                                  className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 transition-colors whitespace-nowrap cursor-pointer mr-2"
                                >
                                  <i className="ri-check-line mr-1"></i>확정
                                </button>
                              )}
                              {reservation.status === 'confirmed' && (
                                <button
                                  onClick={() => handleStatusChange(reservation.id, 'completed')}
                                  className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 transition-colors whitespace-nowrap cursor-pointer mr-2"
                                >
                                  <i className="ri-check-double-line mr-1"></i>완료
                                </button>
                              )}
                              <button
                                onClick={() => handleStatusChange(reservation.id, 'cancelled')}
                                className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700 transition-colors whitespace-nowrap cursor-pointer"
                              >
                                <i className="ri-close-line mr-1"></i>취소
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'daycare' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-900">데이케어 현황</h3>
                
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-orange-50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-gray-900">오늘 데이케어</h4>
                      <span className="text-2xl font-bold text-orange-600">
                        {daycareReservations.filter(r => r.date === new Date().toISOString().split('T')[0]).length}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">오늘 이용 중인 반려동물</p>
                  </div>
                  
                  <div className="bg-teal-50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-gray-900">이번 주</h4>
                      <span className="text-2xl font-bold text-teal-600">{daycareReservations.length}</span>
                    </div>
                    <p className="text-sm text-gray-600">전체 데이케어 예약</p>
                  </div>
                  
                  <div className="bg-red-50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-gray-900">대기 중</h4>
                      <span className="text-2xl font-bold text-red-600">
                        {daycareReservations.filter(r => r.status === 'pending').length}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">확정 대기 예약</p>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h4 className="font-semibold text-gray-900">데이케어 예약 목록</h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">반려동물</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">보호자</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">날짜/시간</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">연락처</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">관리</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {daycareReservations.map((reservation) => (
                          <tr key={reservation.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {reservation.petName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {reservation.ownerName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {reservation.date} {reservation.time}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(reservation.status)}`}>
                                {reservation.status === 'confirmed' ? '확정' :
                                 reservation.status === 'pending' ? '대기' :
                                 reservation.status === 'completed' ? '완료' : '취소'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {reservation.phone}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {reservation.status === 'pending' && (
                                <button
                                  onClick={() => handleStatusChange(reservation.id, 'confirmed')}
                                  className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 transition-colors whitespace-nowrap cursor-pointer mr-2"
                                >
                                  <i className="ri-check-line mr-1"></i>확정
                                </button>
                              )}
                              {reservation.status === 'confirmed' && (
                                <button
                                  onClick={() => handleStatusChange(reservation.id, 'completed')}
                                  className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 transition-colors whitespace-nowrap cursor-pointer mr-2"
                                >
                                  <i className="ri-check-double-line mr-1"></i>완료
                                </button>
                              )}
                              <button
                                onClick={() => handleStatusChange(reservation.id, 'cancelled')}
                                className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700 transition-colors whitespace-nowrap cursor-pointer"
                              >
                                <i className="ri-close-line mr-1"></i>취소
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-900">시스템 설정</h3>
                
                {/* 관리자 계정 관리 */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-900">
                      <i className="ri-user-settings-line mr-2"></i>관리자 계정 관리
                    </h4>
                    <button
                      onClick={() => setIsEditingAccount(!isEditingAccount)}
                      className="bg-teal-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-teal-700 transition-colors whitespace-nowrap cursor-pointer"
                    >
                      <i className="ri-edit-line mr-2"></i>
                      {isEditingAccount ? '취소' : '수정'}
                    </button>
                  </div>
                  
                  {isEditingAccount ? (
                    <div className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">관리자 아이디</label>
                          <input
                            type="text"
                            value={adminAccount.username}
                            onChange={(e) => setAdminAccount({...adminAccount, username: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-teal-500 focus:border-teal-500 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">비밀번호</label>
                          <input
                            type="password"
                            value={adminAccount.password}
                            onChange={(e) => setAdminAccount({...adminAccount, password: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-teal-500 focus:border-teal-500 text-sm"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">이메일</label>
                        <input
                          type="email"
                          value={adminAccount.email}
                          onChange={(e) => setAdminAccount({...adminAccount, email: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-teal-500 focus:border-teal-500 text-sm"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">보안 질문</label>
                        <select
                          value={adminAccount.securityQuestion}
                          onChange={(e) => setAdminAccount({...adminAccount, securityQuestion: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-teal-500 focus:border-teal-500 text-sm pr-8"
                        >
                          <option value="가장 좋아하는 반려동물의 이름은?">가장 좋아하는 반려동물의 이름은?</option>
                          <option value="어머니의 성함은?">어머니의 성함은?</option>
                          <option value="태어난 도시는?">태어난 도시는?</option>
                          <option value="첫 번째 직장의 이름은?">첫 번째 직장의 이름은?</option>
                          <option value="가장 좋아하는 음식은?">가장 좋아하는 음식은?</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">보안 답변</label>
                        <input
                          type="text"
                          value={adminAccount.securityAnswer}
                          onChange={(e) => setAdminAccount({...adminAccount, securityAnswer: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-teal-500 focus:border-teal-500 text-sm"
                          placeholder="보안 질문에 대한 답변을 입력하세요"
                        />
                      </div>
                      
                      <div className="flex space-x-3">
                        <button
                          onClick={handleAccountUpdate}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors whitespace-nowrap cursor-pointer"
                        >
                          <i className="ri-save-line mr-2"></i>저장
                        </button>
                        <button
                          onClick={() => setIsEditingAccount(false)}
                          className="bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-700 transition-colors whitespace-nowrap cursor-pointer"
                        >
                          <i className="ri-close-line mr-2"></i>취소
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm text-gray-600">관리자 아이디:</span>
                          <p className="font-medium">{adminAccount.username}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">비밀번호:</span>
                          <p className="font-medium">••••••••••</p>
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">이메일:</span>
                        <p className="font-medium">{adminAccount.email}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">보안 질문:</span>
                        <p className="font-medium">{adminAccount.securityQuestion}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* 캘린더 설정 */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">
                    <i className="ri-calendar-line mr-2"></i>캘린더 설정
                  </h4>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h5 className="font-medium text-gray-900">AI 상담 캘린더 연동</h5>
                        <p className="text-sm text-gray-600">AI 챗봇이 24시간 예약 문의를 받을 수 있습니다</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`text-sm font-medium ${calendarSettings.isEnabled ? 'text-green-600' : 'text-gray-500'}`}>
                          {calendarSettings.isEnabled ? '활성화됨' : '비활성화됨'}
                        </span>
                        <button
                          onClick={handleCalendarSetup}
                          className="bg-teal-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-teal-700 transition-colors whitespace-nowrap cursor-pointer"
                        >
                          <i className="ri-settings-line mr-2"></i>설정
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">운영 시작 시간</label>
                        <input
                          type="time"
                          value={calendarSettings.businessHours.start}
                          onChange={(e) => setCalendarSettings({
                            ...calendarSettings,
                            businessHours: { ...calendarSettings.businessHours, start: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-teal-500 focus:border-teal-500 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">운영 종료 시간</label>
                        <input
                          type="time"
                          value={calendarSettings.businessHours.end}
                          onChange={(e) => setCalendarSettings({
                            ...calendarSettings,
                            businessHours: { ...calendarSettings.businessHours, end: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-teal-500 focus:border-teal-500 text-sm"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">일일 최대 예약 수</label>
                      <input
                        type="number"
                        value={calendarSettings.maxBookingsPerDay}
                        onChange={(e) => setCalendarSettings({
                          ...calendarSettings,
                          maxBookingsPerDay: parseInt(e.target.value)
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-teal-500 focus:border-teal-500 text-sm"
                        min="1"
                        max="50"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}