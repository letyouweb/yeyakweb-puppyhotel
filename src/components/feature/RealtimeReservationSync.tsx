
import { useEffect } from 'react';

// 실시간 예약 동기화를 위한 유틸리티 컴포넌트
export default function RealtimeReservationSync() {
  useEffect(() => {
    // 페이지 로드 시 예약 데이터 초기화
    const initializeReservationData = () => {
      // 기존 데이터가 없으면 빈 배열로 초기화
      if (!localStorage.getItem('allReservations')) {
        localStorage.setItem('allReservations', JSON.stringify([]));
      }
      if (!localStorage.getItem('hotelReservations')) {
        localStorage.setItem('hotelReservations', JSON.stringify([]));
      }
      if (!localStorage.getItem('groomingReservations')) {
        localStorage.setItem('groomingReservations', JSON.stringify([]));
      }
    };

    initializeReservationData();

    // 스토리지 변경 감지 (다른 탭에서 예약이 추가될 때)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'allReservations' || e.key === 'hotelReservations' || e.key === 'groomingReservations') {
        // 페이지 새로고침 없이 데이터 업데이트
        window.dispatchEvent(new CustomEvent('reservationUpdated'));
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return null; // 이 컴포넌트는 UI를 렌더링하지 않음
}

// 예약 데이터 업데이트 유틸리티 함수들
export const updateReservationData = (newReservation: any, type: 'hotel' | 'grooming') => {
  // 전체 예약 데이터 업데이트
  const allReservations = JSON.parse(localStorage.getItem('allReservations') || '[]');
  allReservations.push(newReservation);
  localStorage.setItem('allReservations', JSON.stringify(allReservations));

  // 서비스별 예약 데이터 업데이트
  const serviceKey = type === 'hotel' ? 'hotelReservations' : 'groomingReservations';
  const serviceReservations = JSON.parse(localStorage.getItem(serviceKey) || '[]');
  serviceReservations.push(newReservation);
  localStorage.setItem(serviceKey, JSON.stringify(serviceReservations));

  // 커스텀 이벤트 발생으로 다른 컴포넌트들에게 업데이트 알림
  window.dispatchEvent(new CustomEvent('reservationUpdated'));
};

export const getReservationStats = () => {
  const allReservations = JSON.parse(localStorage.getItem('allReservations') || '[]');
  const today = new Date().toISOString().split('T')[0];
  
  return {
    total: allReservations.length,
    today: allReservations.filter((r: any) => (r.date || r.checkIn) === today).length,
    hotel: allReservations.filter((r: any) => r.service === 'hotel').length,
    grooming: allReservations.filter((r: any) => r.service === 'grooming').length,
    pending: allReservations.filter((r: any) => r.status === 'pending').length,
    confirmed: allReservations.filter((r: any) => r.status === 'confirmed').length,
    completed: allReservations.filter((r: any) => r.status === 'completed').length
  };
};
