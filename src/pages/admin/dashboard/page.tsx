import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User } from '@supabase/supabase-js';
import GroomingCalendar from '../../../components/feature/GroomingCalendar';
import HotelCalendar from '../../../components/feature/HotelCalendar';
import DaycareCalendar from '../../../components/feature/DaycareCalendar';
import RealtimeReservationSync, {
  updateReservationData,
  removeReservationData,
} from '../../../components/feature/RealtimeReservationSync';
import { loadAllReservations, updateReservationStatus, subscribeToReservations } from '../../../lib/dashboardHelper';
import {
  adminProfileService,
  adminService,
  calendarSettingsService,
  weeklyGroomingScheduleService,
  faqService,
  reservationService,
  type FAQ
} from '../../../lib/supabase';

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
  email: string;
  securityQuestion: string;
  securityAnswer?: string;
}

interface WeeklySchedule {
  [key: string]: {
    id?: string;
    isOpen: boolean;
    timeSlots: string[];
    maxBookings: number;
  };
}

const DEFAULT_AVAILABLE_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const DEFAULT_CALENDAR_SETTINGS = {
  isEnabled: false,
  businessHours: {
    start: '09:00',
    end: '20:00'
  },
  availableDays: [...DEFAULT_AVAILABLE_DAYS],
  maxBookingsPerDay: 20
};

const DEFAULT_WEEKLY_SCHEDULE: WeeklySchedule = {
  monday: { isOpen: true, timeSlots: ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'], maxBookings: 8 },
  tuesday: { isOpen: true, timeSlots: ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'], maxBookings: 8 },
  wednesday: { isOpen: true, timeSlots: ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'], maxBookings: 8 },
  thursday: { isOpen: true, timeSlots: ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'], maxBookings: 8 },
  friday: { isOpen: true, timeSlots: ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'], maxBookings: 8 },
  saturday: { isOpen: true, timeSlots: ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00'], maxBookings: 6 },
  sunday: { isOpen: false, timeSlots: [], maxBookings: 0 }
};

const DEFAULT_FAQ_FORM: FAQ = {
  question: '',
  answer: '',
  tags: [],
  is_active: true,
  sort_order: 0,
};

const cloneDefaultCalendarSettings = () => ({
  ...DEFAULT_CALENDAR_SETTINGS,
  businessHours: { ...DEFAULT_CALENDAR_SETTINGS.businessHours },
  availableDays: [...DEFAULT_AVAILABLE_DAYS]
});

const createDefaultWeeklySchedule = (): WeeklySchedule => JSON.parse(JSON.stringify(DEFAULT_WEEKLY_SCHEDULE));

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('calendar');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  // Selected reservation IDs for bulk deletion
  const [selectedReservations, setSelectedReservations] = useState<string[]>([]);
  // Flag to indicate if all reservations are selected
  const [selectAll, setSelectAll] = useState(false);
  const [adminAccount, setAdminAccount] = useState<AdminAccount>({
    username: 'admin',
    email: 'admin@puppyhotel.com',
    securityQuestion: '가장 좋아하는 반려동물의 이름은?',
    securityAnswer: ''
  });
  const [isEditingAccount, setIsEditingAccount] = useState(false);
  const [calendarSettings, setCalendarSettings] = useState(() => cloneDefaultCalendarSettings());
  // 요일별 미용예약 설정
  const [weeklyGroomingSchedule, setWeeklyGroomingSchedule] = useState<WeeklySchedule>(() => createDefaultWeeklySchedule());
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [adminProfileId, setAdminProfileId] = useState<string | null>(null);
  const [calendarSettingsId, setCalendarSettingsId] = useState<string | null>(null);
  const [calendarSaving, setCalendarSaving] = useState(false);
  const [weeklyScheduleSaving, setWeeklyScheduleSaving] = useState(false);
  const [accountSaving, setAccountSaving] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ newPassword: '', confirmPassword: '' });
  const [passwordSaving, setPasswordSaving] = useState(false);
  // FAQ state
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [faqForm, setFaqForm] = useState<FAQ>(DEFAULT_FAQ_FORM);
  const [faqLoading, setFaqLoading] = useState(false);
  const navigate = useNavigate();
  const dayNames = {
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday'
  };

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        setFaqLoading(true);
        const data = await faqService.list();
        setFaqs(data ?? []);
      } catch (error) {
        console.error('FAQ 목록 로드 실패:', error);
      } finally {
        setFaqLoading(false);
      }
    };
    fetchFaqs();
  }, []);

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null;
    const initializeDashboard = async () => {
      try {
        const session = await adminService.getSession();
        const user = session?.user;
        if (!user) {
          navigate('/admin');
          return;
        }
        setSupabaseUser(user);
        localStorage.setItem('adminAuth', 'true');
        const [reservationData, calendarData, weeklyData, profile] = await Promise.all([
          loadAllReservations(),
          calendarSettingsService.getLatest(),
          weeklyGroomingScheduleService.getAll(),
          adminProfileService.getByUserId(user.id)
        ]);
        setReservations(reservationData);
        if (calendarData) {
          setCalendarSettings({
            isEnabled: calendarData.is_enabled,
            businessHours: calendarData.business_hours || DEFAULT_CALENDAR_SETTINGS.businessHours,
            availableDays: calendarData.available_days || DEFAULT_AVAILABLE_DAYS,
            maxBookingsPerDay: calendarData.max_bookings_per_day || DEFAULT_CALENDAR_SETTINGS.maxBookingsPerDay
          });
          setCalendarSettingsId(calendarData.id || null);
        } else {
          setCalendarSettings(cloneDefaultCalendarSettings());
          setCalendarSettingsId(null);
        }
        if (weeklyData?.length) {
          const normalized: WeeklySchedule = createDefaultWeeklySchedule();
          weeklyData.forEach((row) => {
            const key = (row.day_of_week || '').toLowerCase();
            if (!key) return;
            normalized[key] = {
              id: row.id,
              isOpen: row.is_open,
              timeSlots: row.time_slots || [],
              maxBookings: row.max_bookings ?? DEFAULT_WEEKLY_SCHEDULE[key]?.maxBookings ?? 8
            };
          });
          setWeeklyGroomingSchedule(normalized);
        } else {
          setWeeklyGroomingSchedule(createDefaultWeeklySchedule());
        }
        if (profile) {
          setAdminProfileId(profile.id || null);
          setAdminAccount({
            username: profile.username || 'admin',
            email: profile.email || user.email || 'admin@puppyhotel.com',
            securityQuestion: profile.security_question || '가장 좋아하는 반려동물의 이름은?',
            securityAnswer: ''
          });
        } else {
          setAdminAccount((prev) => ({
            ...prev,
            email: user.email || prev.email
          }));
        }
      } catch (error) {
        console.error('대시보드 초기화 실패:', error);
      }
    };
    initializeDashboard();
    subscription = subscribeToReservations((update) => {
      if (update.type === 'INSERT' || update.type === 'UPDATE') {
        setReservations((prev) => {
          const exists = prev.find((r) => r.id === update.data.id);
          if (exists) {
            return prev.map((r) => (r.id === update.data.id ? update.data : r));
          }
          return [...prev, update.data];
        });
      } else if (update.type === 'DELETE') {
        setReservations((prev) => prev.filter((r) => r.id !== update.id));
      }
    });
    return () => {
      subscription?.unsubscribe();
    };
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await adminService.logout();
    } finally {
      localStorage.removeItem('adminAuth');
      navigate('/');
    }
  };

  const handleCalendarSetup = async () => {
    const updatedSettings = { ...calendarSettings, isEnabled: true };
    setCalendarSettings(updatedSettings);
    setCalendarSaving(true);
    try {
      const saved = await calendarSettingsService.upsert({
        id: calendarSettingsId || undefined,
        is_enabled: true,
        business_hours: updatedSettings.businessHours,
        available_days: updatedSettings.availableDays,
        max_bookings_per_day: updatedSettings.maxBookingsPerDay
      });
      setCalendarSettingsId(saved.id || null);
      alert('캘린더 설정이 Supabase에 저장되었습니다. AI 상담 챗봇이 24시간 예약 문의를 처리합니다.');
    } catch (error) {
      console.error('캘린더 설정 저장 실패:', error);
      alert('캘린더 설정 저장 중 오류가 발생했습니다.');
    } finally {
      setCalendarSaving(false);
    }
  };

  const handleAccountUpdate = async () => {
    if (!supabaseUser) {
      alert('세션이 만료되었습니다. 다시 로그인해 주세요.');
      navigate('/admin');
      return;
    }
    setAccountSaving(true);
    try {
      const profile = await adminProfileService.upsert({
        id: adminProfileId || undefined,
        user_id: supabaseUser.id,
        username: adminAccount.username,
        email: adminAccount.email,
        security_question: adminAccount.securityQuestion,
        security_answer: adminAccount.securityAnswer?.trim() ? adminAccount.securityAnswer : undefined
      });
      setAdminProfileId(profile.id || null);
      if (adminAccount.email && supabaseUser.email !== adminAccount.email) {
        await adminService.updateEmail(adminAccount.email);
      }
      setAdminAccount((prev) => ({ ...prev, securityAnswer: '' }));
      setIsEditingAccount(false);
      alert('관리자 계정 정보가 Supabase에 안전하게 저장되었습니다.');
    } catch (error) {
      console.error('관리자 계정 저장 실패:', error);
      alert('계정 정보를 저장하지 못했습니다.');
    } finally {
      setAccountSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!supabaseUser) {
      alert('세션이 만료되었습니다. 다시 로그인해 주세요.');
      navigate('/admin');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      alert('비밀번호는 최소 8자리 이상이어야 합니다.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }
    setPasswordSaving(true);
    try {
      await adminService.updatePassword(passwordForm.newPassword);
      setPasswordForm({ newPassword: '', confirmPassword: '' });
      alert('비밀번호가 안전하게 변경되었습니다.');
    } catch (error) {
      console.error('비밀번호 변경 실패:', error);
      alert('비밀번호를 변경하지 못했습니다.');
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleWeeklyScheduleUpdate = (day: string, field: string, value: any) => {
    setWeeklyGroomingSchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
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

  const handleWeeklyScheduleSave = async () => {
    setWeeklyScheduleSaving(true);
    try {
      const payload = Object.entries(weeklyGroomingSchedule).map(([day, schedule]) => ({
        id: schedule.id,
        day_of_week: day,
        is_open: schedule.isOpen,
        time_slots: schedule.timeSlots,
        max_bookings: schedule.maxBookings
      }));
      const saved = await weeklyGroomingScheduleService.upsert(payload);
      if (saved?.length) {
        const normalized = { ...weeklyGroomingSchedule };
        saved.forEach((row: any) => {
          const key = (row.day_of_week || '').toLowerCase();
          if (!key) return;
          normalized[key] = {
            id: row.id,
            isOpen: row.is_open,
            timeSlots: row.time_slots || [],
            maxBookings: row.max_bookings
          };
        });
        setWeeklyGroomingSchedule(normalized);
      }
      alert('요일별 미용예약 설정이 Supabase에 저장되었습니다.');
    } catch (error) {
      console.error('주간 스케줄 저장 실패:', error);
      alert('요일별 미용예약 설정 저장에 실패했습니다.');
    } finally {
      setWeeklyScheduleSaving(false);
    }
  };

  // 예약 상태 변경 함수
  const handleStatusChange = async (
    reservationId: string,
    newStatus: 'confirmed' | 'pending' | 'completed' | 'cancelled'
  ) => {
    try {
      const result = await updateReservationStatus(reservationId, newStatus, true);
      if (result.success) {
        setReservations((prev) =>
          prev.map((reservation) => (reservation.id === reservationId ? result.data : reservation))
        );
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

  // Toggle selection for an individual reservation
  const toggleSelectReservation = (id: string) => {
    setSelectedReservations((prev) => {
      if (prev.includes(id)) {
        return prev.filter((rId) => rId !== id);
      }
      return [...prev, id];
    });
  };

  // Toggle select all reservations
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectAll(false);
      setSelectedReservations([]);
    } else {
      setSelectAll(true);
      setSelectedReservations(reservations.map((r) => r.id));
    }
  };

  // Delete selected reservations
  const deleteSelectedReservations = async () => {
    if (!selectedReservations.length) return;
    if (!confirm('선택된 예약을 삭제하시겠습니까?')) return;
    try {
      await reservationService.removeMany(selectedReservations);
      setReservations((prev) => prev.filter((r) => !selectedReservations.includes(r.id)));
      setSelectedReservations([]);
      setSelectAll(false);
      // localStorage에서도 해당 예약들을 제거하여 달력 데이터에 반영
      try {
        removeReservationData(selectedReservations);
      } catch (e) {
        console.warn('localStorage 예약 삭제 중 오류:', e);
      }
      alert('선택된 예약이 삭제되었습니다.');
    } catch (error) {
      console.error('예약 삭제 실패:', error);
      alert('예약 삭제 중 오류가 발생했습니다.');
    }
  };

  // When a pending status is clicked, navigate to the appropriate tab based on service
  const handlePendingClick = (reservation: Reservation) => {
    // 예약 상세를 해당 서비스 탭으로 이동시키고 로컬 스토리지에 예약을 업데이트
    const service = reservation.service;
    // 새 예약 객체를 생성 (localStorage 구조에 맞게)
    let newRes: any = {};
    if (service === 'grooming') {
      newRes = {
        id: reservation.id,
        petName: reservation.petName,
        ownerName: reservation.ownerName,
        date: reservation.date,
        time: reservation.time,
        phone: reservation.phone,
        style: reservation.style || '기본미용',
        status: reservation.status,
        service: 'grooming'
      };
    } else if (service === 'hotel') {
      newRes = {
        id: reservation.id,
        petName: reservation.petName,
        ownerName: reservation.ownerName,
        checkIn: reservation.checkIn || reservation.date,
        checkOut: reservation.checkOut || reservation.date,
        roomType: reservation.roomType || '일반룸',
        phone: reservation.phone,
        status: reservation.status,
        service: 'hotel'
      };
    } else if (service === 'daycare') {
      newRes = {
        id: reservation.id,
        petName: reservation.petName,
        ownerName: reservation.ownerName,
        date: reservation.date,
        time: reservation.time,
        phone: reservation.phone,
        status: reservation.status,
        service: 'daycare'
      };
    }
    // localStorage 업데이트: 기존 동일 ID가 있으면 먼저 삭제한 후 추가
    try {
      // 동일한 예약을 제거하여 중복을 방지합니다.
      removeReservationData([reservation.id]);
      updateReservationData(newRes, service as any);
    } catch (e) {
      console.error('예약 데이터를 업데이트하는 중 오류 발생:', e);
    }
    // 해당 서비스 탭으로 이동
    switch (service) {
      case 'grooming':
        setActiveTab('grooming');
        break;
      case 'hotel':
        setActiveTab('hotel');
        break;
      case 'daycare':
        setActiveTab('daycare');
        break;
      default:
        break;
    }
  };

  // FAQ 관련 핸들러 함수들
  const resetFaqForm = () => setFaqForm(DEFAULT_FAQ_FORM);
  const saveFAQ = async () => {
    if (!faqForm.question?.trim() || !faqForm.answer?.trim()) {
      alert('질문과 답변을 모두 입력해 주세요.');
      return;
    }
    const payload: FAQ = {
      ...faqForm,
      question: faqForm.question.trim(),
      answer: faqForm.answer.trim(),
      tags: faqForm.tags?.map((tag) => tag.trim()).filter(Boolean) ?? [],
      sort_order: faqForm.sort_order ?? faqs.length + 1,
      is_active: faqForm.is_active ?? true,
    };
    try {
      setFaqLoading(true);
      if (faqForm.id) {
        const updated = await faqService.update(faqForm.id, payload);
        setFaqs((prev) => prev.map((faq) => (faq.id === updated.id ? updated : faq)));
      } else {
        const created = await faqService.create(payload);
        setFaqs((prev) => [...prev, created]);
      }
      resetFaqForm();
    } catch (error) {
      console.error('FAQ 저장 실패:', error);
      alert('FAQ 저장 중 오류가 발생했습니다.');
    } finally {
      setFaqLoading(false);
    }
  };

  const editFAQ = (faq: FAQ) => {
    setFaqForm({
      ...faq,
      tags: faq.tags ?? [],
    });
  };

  const delFAQ = async (id: string) => {
    if (!confirm('해당 FAQ를 삭제하시겠습니까?')) {
      return;
    }
    try {
      setFaqLoading(true);
      await faqService.remove(id);
      setFaqs((prev) => prev.filter((faq) => faq.id !== id));
      if (faqForm.id === id) {
        resetFaqForm();
      }
    } catch (error) {
      console.error('FAQ 삭제 실패:', error);
      alert('FAQ 삭제 중 오류가 발생했습니다.');
    } finally {
      setFaqLoading(false);
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
      {/* 실시간 로컬스토리지 예약 동기화 컴포넌트 */}
      <RealtimeReservationSync />
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
                onClick={() => setActiveTab('calendar')}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap cursor-pointer ${
                  activeTab === 'calendar'
                    ? 'border-teal-500 text-teal-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <i className="ri-calendar-line mr-2"></i>캘린더 설정
              </button>
              <button
                onClick={() => setActiveTab('weekly-schedule')}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap cursor-pointer ${
                  activeTab === 'weekly-schedule'
                    ? 'border-teal-500 text-teal-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <i className="ri-scissors-line mr-2"></i>요일별 미용예약 설정
              </button>
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
              <button
                onClick={() => setActiveTab('account')}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap cursor-pointer ${
                  activeTab === 'account'
                    ? 'border-teal-500 text-teal-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <i className="ri-user-settings-line mr-2"></i>계정 관리
              </button>
            </nav>
          </div>
          <div className="p-6">
            {activeTab === 'calendar' && (
              <div className="space-y-6">
                <div className="bg-teal-50 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mr-4">
                      <i className="ri-calendar-check-line text-2xl text-teal-600"></i>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">AI 상담 챗봇 캘린더 설정</h3>
                      <p className="text-gray-600">고객들이 24시간 예약 문의를 할 수 있도록 설정합니다</p>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div className="bg-white rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">
                        <i className="ri-time-line mr-2 text-teal-600"></i>영업시간 설정
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <label className="text-sm font-medium text-gray-700">시작 시간:</label>
                          <input
                            type="time"
                            value={calendarSettings.businessHours.start}
                            onChange={(e) => setCalendarSettings({
                              ...calendarSettings,
                              businessHours: { ...calendarSettings.businessHours, start: e.target.value }
                            })}
                            className="border border-gray-300 rounded px-2 py-1 text-sm"
                          />
                        </div>
                        <div className="flex items-center space-x-3">
                          <label className="text-sm font-medium text-gray-700">종료 시간:</label>
                          <input
                            type="time"
                            value={calendarSettings.businessHours.end}
                            onChange={(e) => setCalendarSettings({
                              ...calendarSettings,
                              businessHours: { ...calendarSettings.businessHours, end: e.target.value }
                            })}
                            className="border border-gray-300 rounded px-2 py-1 text-sm"
                          />
                        </div>
                        <div className="flex items-center space-x-3">
                          <label className="text-sm font-medium text-gray-700">일일 최대 예약:</label>
                          <input
                            type="number"
                            value={calendarSettings.maxBookingsPerDay}
                            onChange={(e) => setCalendarSettings({
                              ...calendarSettings,
                              maxBookingsPerDay: parseInt(e.target.value)
                            })}
                            className="border border-gray-300 rounded px-2 py-1 text-sm w-20"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">
                        <i className="ri-robot-line mr-2 text-teal-600"></i>AI 챗봇 상태
                      </h4>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-2 ${calendarSettings.isEnabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          <span>{calendarSettings.isEnabled ? '활성화됨' : '비활성화됨'}</span>
                        </div>
                        <p>• 24시간 자동 응답</p>
                        <p>• 예약 가능 시간 안내</p>
                        <p>• 서비스 정보 제공</p>
                        <p>• 실시간 예약 접수</p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleCalendarSetup}
                    disabled={calendarSaving}
                    className="w-full bg-teal-600 text-white py-4 rounded-lg font-semibold hover:bg-teal-700 transition-colors whitespace-nowrap cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <i className="ri-calendar-check-line mr-2"></i>{calendarSaving ? '저장 중...' : '캘린더 설정 완료하기'}
                  </button>
                </div>
              </div>
            )}
            {activeTab === 'weekly-schedule' && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
                  <h3 className="text-xl font-bold text-gray-900">요일별 미용예약 설정</h3>
                  <div className="flex items-center space-x-4">
                    <div className="text-sm text-gray-600">
                      <i className="ri-information-line mr-1"></i>
                      각 요일별로 운영시간과 예약 가능 시간을 설정하세요
                    </div>
                    <button
                      onClick={handleWeeklyScheduleSave}
                      disabled={weeklyScheduleSaving}
                      className="bg-teal-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-teal-700 transition-colors whitespace-nowrap cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <i className="ri-save-line mr-2"></i>{weeklyScheduleSaving ? '저장 중...' : '설정 저장'}
                    </button>
                  </div>
                </div>
                <div className="grid gap-6">
                  {Object.entries(weeklyGroomingSchedule).map(([day, schedule]) => (
                    <div key={day} className="bg-white rounded-lg border border-gray-200 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <h4 className="text-lg font-semibold text-gray-900 mr-4">
                            {dayNames[day as keyof typeof dayNames]}
                          </h4>
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={schedule.isOpen}
                              onChange={(e) => handleWeeklyScheduleUpdate(day, 'isOpen', e.target.checked)}
                              className="sr-only"
                            />
                            <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${schedule.isOpen ? 'bg-teal-600' : 'bg-gray-200'}`}> 
                              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${schedule.isOpen ? 'translate-x-6' : 'translate-x-1'}`} />
                            </div>
                            <span className="ml-2 text-sm text-gray-600">
                              {schedule.isOpen ? '운영' : '휴무'}
                            </span>
                          </label>
                        </div>
                        {schedule.isOpen && (
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              <label className="text-sm font-medium text-gray-700">최대 예약:</label>
                              <input
                                type="number"
                                min="1"
                                max="20"
                                value={schedule.maxBookings}
                                onChange={(e) => handleWeeklyScheduleUpdate(day, 'maxBookings', parseInt(e.target.value))}
                                className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                              <span className="text-sm text-gray-600">건</span>
                            </div>
                          </div>
                        )}
                      </div>
                      {schedule.isOpen && (
                        <div>
                          <div className="mb-4">
                            <h5 className="text-sm font-medium text-gray-700 mb-2">예약 가능 시간</h5>
                            <div className="flex flex-wrap gap-2 mb-3">
                              {schedule.timeSlots.map((time) => (
                                <div key={time} className="flex items-center bg-teal-50 rounded-lg px-3 py-1">
                                  <span className="text-sm text-teal-700">{time}</span>
                                  <button
                                    onClick={() => removeTimeSlot(day, time)}
                                    className="ml-2 text-teal-500 hover:text-teal-700 cursor-pointer"
                                  >
                                    <i className="ri-close-line text-xs"></i>
                                  </button>
                                </div>
                              ))}
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="time"
                                id={`time-${day}`}
                                className="border border-gray-300 rounded px-2 py-1 text-sm"
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
                                <i className="ri-add-line mr-1"></i>시간 추가
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="bg-yellow-50 rounded-lg p-4">
                  <div className="flex items-start">
                    <i className="ri-lightbulb-line text-yellow-600 mr-2 mt-1"></i>
                    <div>
                      <h4 className="font-medium text-yellow-800 mb-1">설정 팁</h4>
                      <ul className="text-sm text-yellow-700 space-y-1">
                        <li>• 점심시간(12:00-13:00)은 제외하고 설정하는 것을 권장합니다</li>
                        <li>• 미용 서비스는 보통 1-2시간이 소요되므로 충분한 간격을 두세요</li>
                        <li>• 주말에는 예약이 몰릴 수 있으니 최대 예약 수를 조정하세요</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
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
                          {/* Selection & Delete column */}
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={selectAll}
                                onChange={toggleSelectAll}
                                className="h-4 w-4 text-teal-600 border-gray-300 rounded"
                              />
                              <button
                                type="button"
                                onClick={deleteSelectedReservations}
                                disabled={selectedReservations.length === 0}
                                className={`text-red-600 font-medium ${selectedReservations.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:text-red-800'}`}
                              >
                                삭제
                              </button>
                            </div>
                          </th>
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
                              <span
                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(reservation.status)} ${reservation.status === 'pending' ? 'cursor-pointer underline' : ''}`}
                                onClick={() => {
                                  if (reservation.status === 'pending') {
                                    handlePendingClick(reservation);
                                  }
                                }}
                              >
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
                            {/* Row selection checkbox */}
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <input
                                type="checkbox"
                                checked={selectedReservations.includes(reservation.id)}
                                onChange={() => toggleSelectReservation(reservation.id)}
                                className="h-4 w-4 text-teal-600 border-gray-300 rounded"
                              />
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
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900">미용예약현황</h3>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">실시간 업데이트</span>
                  </div>
                </div>
                <div className="grid md:grid-cols-4 gap-6">
                  <div className="bg-pink-50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-gray-900">오늘 미용</h4>
                      <span className="text-2xl font-bold text-pink-600">
                        {groomingReservations.filter(r => r.date === new Date().toISOString().split('T')[0]).length}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">진행 중인 미용</p>
                  </div>
                  <div className="bg-indigo-50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-gray-900">대기 중</h4>
                      <span className="text-2xl font-bold text-indigo-600">
                        {groomingReservations.filter(r => r.status === 'pending').length}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">예약 대기</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-gray-900">완료</h4>
                      <span className="text-2xl font-bold text-green-600">
                        {groomingReservations.filter(r => r.status === 'completed').length}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">오늘 완료</p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-gray-900">총 예약</h4>
                      <span className="text-2xl font-bold text-orange-600">{groomingReservations.length}</span>
                    </div>
                    <p className="text-sm text-gray-600">이번 주 전체</p>
                  </div>
                </div>
                {/* 미용 예약 달력 */}
                <GroomingCalendar />
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h4 className="font-semibold text-gray-900">미용 예약 상세 현황</h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">시간</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">반려동물</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">보호자</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">날짜</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">미용스타일</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">연락처</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {groomingReservations.map((reservation) => (
                          <tr key={reservation.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {reservation.time}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              <div className="flex items-center">
                                <i className="ri-scissors-line mr-2 text-pink-500"></i>
                                {reservation.petName}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {reservation.ownerName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {reservation.date}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {reservation.style || '기본미용'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(reservation.status)}`}> 
                                {reservation.status === 'confirmed' ? '확정' :
                                  reservation.status === 'pending' ? '대기' :
                                  reservation.status === 'completed' ? '완료' : '취소'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <a href={`tel:${reservation.phone}`} className="text-teal-600 hover:text-teal-800 cursor-pointer">
                                {reservation.phone}
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'hotel' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900">호텔</h3>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">실시간 업데이트</span>
                  </div>
                </div>
                <div className="grid md:grid-cols-4 gap-6">
                  <div className="bg-blue-50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-gray-900">오늘 체크인</h4>
                      <span className="text-2xl font-bold text-blue-600">
                        {hotelReservations.filter(r => r.checkIn === new Date().toISOString().split('T')[0]).length}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">신규 입실</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-gray-900">현재 투숙</h4>
                      <span className="text-2xl font-bold text-purple-600">
                        {hotelReservations.filter(r => r.status === 'confirmed').length}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">투숙 중</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-gray-900">오늘 체크아웃</h4>
                      <span className="text-2xl font-bold text-green-600">
                        {hotelReservations.filter(r => r.checkOut === new Date().toISOString().split('T')[0]).length}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">퇴실 예정</p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-gray-900">총 예약</h4>
                      <span className="text-2xl font-bold text-orange-600">{hotelReservations.length}</span>
                    </div>
                    <p className="text-sm text-gray-600">이번 주 전체</p>
                  </div>
                </div>
                {/* 호텔 예약 달력 */}
                <HotelCalendar />
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h4 className="font-semibold text-gray-900">호텔 예약 현황</h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">반려동물</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">보호자</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">룸타입</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">체크인</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">체크아웃</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">연락처</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {hotelReservations.map((reservation) => (
                          <tr key={reservation.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              <div className="flex items-center">
                                <i className="ri-hotel-line mr-2 text-blue-500"></i>
                                {reservation.petName}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {reservation.ownerName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {reservation.roomType || '일반룸'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {reservation.checkIn || reservation.date}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {reservation.checkOut || '미정'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(reservation.status)}`}>
                                {reservation.status === 'confirmed' ? '확정' :
                                  reservation.status === 'pending' ? '대기' :
                                  reservation.status === 'completed' ? '완료' : '취소'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <a href={`tel:${reservation.phone}`} className="text-teal-600 hover:text-teal-800 cursor-pointer">
                                {reservation.phone}
                              </a>
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
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900">데이케어</h3>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">실시간 업데이트</span>
                  </div>
                </div>
                <div className="grid md:grid-cols-4 gap-6">
                  <div className="bg-orange-50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-gray-900">오늘 등원</h4>
                      <span className="text-2xl font-bold text-orange-600">
                        {daycareReservations.filter(r => r.date === new Date().toISOString().split('T')[0]).length}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">오늘 데이케어</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-gray-900">현재 돌봄</h4>
                      <span className="text-2xl font-bold text-green-600">
                        {daycareReservations.filter(r => r.status === 'confirmed').length}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">돌봄 중</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-gray-900">완료</h4>
                      <span className="text-2xl font-bold text-blue-600">
                        {daycareReservations.filter(r => r.status === 'completed').length}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">오늘 완료</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-gray-900">총 예약</h4>
                      <span className="text-2xl font-bold text-purple-600">{daycareReservations.length}</span>
                    </div>
                    <p className="text-sm text-gray-600">이번 주 전체</p>
                  </div>
                </div>
                {/* 데이케어 예약 달력 */}
                <DaycareCalendar />
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h4 className="font-semibold text-gray-900">데이케어 예약 현황</h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">시간</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">반려동물</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">보호자</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">날짜</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">연락처</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {daycareReservations.map((reservation) => (
                          <tr key={reservation.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {reservation.time}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              <div className="flex items-center">
                                <i className="ri-home-heart-line mr-2 text-orange-500"></i>
                                {reservation.petName}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {reservation.ownerName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {reservation.date}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(reservation.status)}`}>
                                {reservation.status === 'confirmed' ? '확정' :
                                  reservation.status === 'pending' ? '대기' :
                                  reservation.status === 'completed' ? '완료' : '취소'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <a href={`tel:${reservation.phone}`} className="text-teal-600 hover:text-teal-800 cursor-pointer">
                                {reservation.phone}
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'account' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-900">계정 관리</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-semibold text-gray-900">
                        <i className="ri-user-settings-line mr-2 text-teal-600"></i>관리자 계정 정보
                      </h4>
                      <button
                        onClick={() => setIsEditingAccount(!isEditingAccount)}
                        className="text-teal-600 hover:text-teal-800 cursor-pointer"
                      >
                        <i className="ri-edit-line mr-1"></i>
                        {isEditingAccount ? '취소' : '수정'}
                      </button>
                    </div>
                    {isEditingAccount ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">아이디</label>
                          <input
                            type="text"
                            value={adminAccount.username}
                            onChange={(e) => setAdminAccount((prev) => ({ ...prev, username: e.target.value }))}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                          <input
                            type="email"
                            value={adminAccount.email}
                            onChange={(e) => setAdminAccount((prev) => ({ ...prev, email: e.target.value }))}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">보안 질문</label>
                          <input
                            type="text"
                            value={adminAccount.securityQuestion}
                            onChange={(e) => setAdminAccount((prev) => ({ ...prev, securityQuestion: e.target.value }))}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">보안 답변</label>
                          <input
                            type="text"
                            value={adminAccount.securityAnswer || ''}
                            onChange={(e) => setAdminAccount((prev) => ({ ...prev, securityAnswer: e.target.value }))}
                            placeholder="새로운 보안 답변을 입력하세요"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                          />
                          <p className="text-xs text-gray-500 mt-1">새로운 답변만 저장되며 입력하지 않으면 기존 값이 유지됩니다.</p>
                        </div>
                        <button
                          onClick={handleAccountUpdate}
                          disabled={accountSaving}
                          className="w-full bg-teal-600 text-white py-2 rounded-lg font-semibold hover:bg-teal-700 transition-colors whitespace-nowrap cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          <i className="ri-save-line mr-2"></i>{accountSaving ? '저장 중...' : '저장'}
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">아이디</span>
                          <span className="ml-2 text-gray-600">{adminAccount.username}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">비밀번호</span>
                          <span className="ml-2 text-gray-600">Supabase Auth로 암호화되어 관리됩니다.</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">이메일</span>
                          <span className="ml-2 text-gray-600">{adminAccount.email}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">보안 질문</span>
                          <span className="ml-2 text-gray-600">{adminAccount.securityQuestion}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h4 className="font-semibold text-gray-900 mb-4">
                      <i className="ri-shield-check-line mr-2 text-green-600"></i>보안 설정
                    </h4>
                    <div className="space-y-4">
                      <div className="bg-green-50 rounded-lg p-4">
                        <h5 className="font-medium text-green-800 mb-2">계정 보안 상태</h5>
                        <div className="space-y-2 text-sm text-green-700">
                          <div className="flex items-center">
                            <i className="ri-check-line mr-2"></i>
                            <span>비밀번호 암호화 저장</span>
                          </div>
                          <div className="flex items-center">
                            <i className="ri-check-line mr-2"></i>
                            <span>보안 질문 등록 완료</span>
                          </div>
                          <div className="flex items-center">
                            <i className="ri-check-line mr-2"></i>
                            <span>이메일 인증 완료</span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h5 className="font-medium text-yellow-800 mb-2">
                          <i className="ri-information-line mr-2"></i>비밀번호 찾기 안내
                        </h5>
                        <p className="text-sm text-yellow-700 mb-3">
                          보안 질문을 통과하면 등록된 이메일로 Supabase 비밀번호 재설정 링크가 자동 전송됩니다.
                        </p>
                        <a href="/admin" className="text-yellow-800 hover:text-yellow-900 text-sm font-medium cursor-pointer">
                          <i className="ri-arrow-right-line mr-1"></i>로그인 페이지로 이동
                        </a>
                      </div>
                    </div>
                    <div className="mt-6 border-t border-gray-100 pt-4">
                      <h5 className="font-medium text-gray-900 mb-3">비밀번호 변경</h5>
                      <div className="space-y-3">
                        <input
                          type="password"
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                          placeholder="새 비밀번호 (최소 8자)"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        />
                        <input
                          type="password"
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                          placeholder="비밀번호 확인"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        />
                        <button
                          onClick={handlePasswordChange}
                          disabled={passwordSaving}
                          className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors whitespace-nowrap cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          <i className="ri-lock-password-line mr-2"></i>{passwordSaving ? '변경 중...' : '비밀번호 변경'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'faq' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    <i className="ri-question-answer-line mr-2 text-teal-600"></i>FAQ 관리
                  </h3>
                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      saveFAQ();
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">질문</label>
                      <input
                        type="text"
                        value={faqForm.question}
                        onChange={(event) => setFaqForm({ ...faqForm, question: event.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        placeholder="예: 체크인은 몇 시부터 가능한가요?"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">답변</label>
                      <textarea
                        value={faqForm.answer}
                        onChange={(event) => setFaqForm({ ...faqForm, answer: event.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        rows={4}
                        placeholder="예: 체크인은 오후 2시, 체크아웃은 오전 11시입니다."
                        required
                      />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">태그 (쉼표로 구분)</label>
                        <input
                          type="text"
                          value={(faqForm.tags ?? []).join(', ')}
                          onChange={(event) =>
                            setFaqForm({
                              ...faqForm,
                              tags: event.target.value.split(',').map((tag) => tag.trim()).filter(Boolean),
                            })
                          }
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                          placeholder="예: 요금, 체크인"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">정렬 순서</label>
                        <input
                          type="number"
                          min={0}
                          value={faqForm.sort_order ?? 0}
                          onChange={(event) => setFaqForm({ ...faqForm, sort_order: Number(event.target.value) || 0 })}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <label className="flex items-center text-sm text-gray-700">
                        <input
                          type="checkbox"
                          className="mr-2"
                          checked={faqForm.is_active ?? true}
                          onChange={(event) => setFaqForm({ ...faqForm, is_active: event.target.checked })}
                        />
                        노출 상태
                      </label>
                      {faqForm.id && (
                        <span className="text-xs text-gray-500">ID: {faqForm.id}</span>
                      )}
                    </div>
                    <div className="flex gap-3 flex-wrap">
                      <button
                        type="submit"
                        disabled={faqLoading}
                        className="px-6 py-2 rounded-lg text-white bg-teal-600 hover:bg-teal-700 font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {faqLoading ? '저장 중...' : faqForm.id ? 'FAQ 업데이트' : 'FAQ 추가'}
                      </button>
                      <button
                        type="button"
                        onClick={resetFaqForm}
                        className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        새로 작성
                      </button>
                    </div>
                  </form>
                </div>
                <div className="bg-white rounded-lg border border-gray-200">
                  <div className="overflow-x-auto">
                    {faqLoading && faqs.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">FAQ를 불러오는 중입니다...</div>
                    ) : faqs.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">등록된 FAQ가 없습니다.</div>
                    ) : (
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">질문</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">답변</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">태그</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">정렬</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">동작</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {faqs.map((faq) => (
                            <tr key={faq.id ?? faq.question}>
                              <td className="px-4 py-2 text-sm font-medium text-gray-900">{faq.question}</td>
                              <td className="px-4 py-2 text-sm text-gray-600 max-w-xl">{faq.answer}</td>
                              <td className="px-4 py-2 text-sm text-gray-500">{(faq.tags ?? []).join(', ') || '-'}</td>
                              <td className="px-4 py-2 text-sm text-gray-500">{faq.sort_order ?? '-'}</td>
                              <td className="px-4 py-2 text-sm text-right space-x-2">
                                <button
                                  type="button"
                                  onClick={() => editFAQ(faq)}
                                  className="px-3 py-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100"
                                >
                                  수정
                                </button>
                                <button
                                  type="button"
                                  onClick={() => faq.id && delFAQ(faq.id)}
                                  disabled={!faq.id || faqLoading}
                                  className="px-3 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                  삭제
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
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