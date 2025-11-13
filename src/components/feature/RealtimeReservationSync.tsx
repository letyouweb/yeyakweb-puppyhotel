import { useEffect } from 'react';

// 실시간 예약 동기화를 위한 유틸리티 컴포넌트
// 브라우저의 localStorage에 전체 예약과 서비스별 예약 데이터를 초기화하고,
// 스토리지 변경을 감지하여 다른 컴포넌트에 업데이트 이벤트를 전달합니다.
export default function RealtimeReservationSync() {
  useEffect(() => {
    // 초기화: 로컬 스토리지에 필요한 키가 없으면 빈 배열로 생성
    const initializeReservationData = () => {
      if (!localStorage.getItem('allReservations')) {
        localStorage.setItem('allReservations', JSON.stringify([]));
      }
      if (!localStorage.getItem('hotelReservations')) {
        localStorage.setItem('hotelReservations', JSON.stringify([]));
      }
      if (!localStorage.getItem('groomingReservations')) {
        localStorage.setItem('groomingReservations', JSON.stringify([]));
      }
      // 새로운 데이케어 예약 저장소 초기화
      if (!localStorage.getItem('daycareReservations')) {
        localStorage.setItem('daycareReservations', JSON.stringify([]));
      }
    };

    initializeReservationData();

    // 다른 탭에서 localStorage가 변경될 때 변경을 감지하여 커스텀 이벤트를 발생
    const handleStorageChange = (e: StorageEvent) => {
      if (
        e.key === 'allReservations' ||
        e.key === 'hotelReservations' ||
        e.key === 'groomingReservations' ||
        e.key === 'daycareReservations'
      ) {
        window.dispatchEvent(new CustomEvent('reservationUpdated'));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  return null; // UI를 렌더링하지 않는 유틸리티 컴포넌트
}

// 예약 데이터를 localStorage에 업데이트하는 유틸리티 함수
// 전체 예약(allReservations)과 서비스별 예약(hotel/grooming/daycare) 배열에 새 예약을 추가/업데이트한 후
// reservationUpdated 이벤트를 발생시켜 달력 컴포넌트가 새 데이터를 불러오도록 합니다.
// 중복 방지: 동일한 ID가 있으면 기존 예약을 업데이트하고, 없으면 추가합니다.
export const updateReservationData = (
  newReservation: any,
  type: 'hotel' | 'grooming' | 'daycare'
) => {
  // 전체 예약 데이터 업데이트
  const allReservations = JSON.parse(localStorage.getItem('allReservations') || '[]');
  const allIndex = allReservations.findIndex((r: any) => r.id === newReservation.id);
  if (allIndex !== -1) {
    // 기존 예약 업데이트
    allReservations[allIndex] = newReservation;
  } else {
    // 새 예약 추가
    allReservations.push(newReservation);
  }
  localStorage.setItem('allReservations', JSON.stringify(allReservations));

  // 서비스별 예약 데이터 업데이트
  let serviceKey: string;
  switch (type) {
    case 'hotel':
      serviceKey = 'hotelReservations';
      break;
    case 'grooming':
      serviceKey = 'groomingReservations';
      break;
    case 'daycare':
      serviceKey = 'daycareReservations';
      break;
    default:
      serviceKey = 'groomingReservations';
  }
  const serviceReservations = JSON.parse(localStorage.getItem(serviceKey) || '[]');
  const serviceIndex = serviceReservations.findIndex((r: any) => r.id === newReservation.id);
  if (serviceIndex !== -1) {
    // 기존 예약 업데이트
    serviceReservations[serviceIndex] = newReservation;
  } else {
    // 새 예약 추가
    serviceReservations.push(newReservation);
  }
  localStorage.setItem(serviceKey, JSON.stringify(serviceReservations));

  // 다른 컴포넌트에게 데이터 변경을 알림
  window.dispatchEvent(new CustomEvent('reservationUpdated'));
  
  // 콘솔 로그로 디버깅 정보 출력
  console.log(`✅ 예약 업데이트 완료: ${type} - ${newReservation.petName} (${newReservation.id})`);
};

// 선택된 예약을 localStorage에서 제거하는 함수
// 주어진 ID 배열에 해당하는 예약을 전체 예약과 각 서비스별 예약 목록에서 삭제하고
// reservationUpdated 이벤트를 발생시켜 달력 데이터를 갱신합니다.
export const removeReservationData = (ids: string[]) => {
  if (!ids?.length) return;
  // 전체 예약 배열에서 제거
  const allReservations = JSON.parse(localStorage.getItem('allReservations') || '[]');
  const filteredAll = allReservations.filter((r: any) => !ids.includes(r.id));
  localStorage.setItem('allReservations', JSON.stringify(filteredAll));

  // 서비스별 배열에서 제거
  const keys = ['hotelReservations', 'groomingReservations', 'daycareReservations'];
  keys.forEach((key) => {
    const list = JSON.parse(localStorage.getItem(key) || '[]');
    const filtered = list.filter((r: any) => !ids.includes(r.id));
    localStorage.setItem(key, JSON.stringify(filtered));
  });

  // 변경 알림
  window.dispatchEvent(new CustomEvent('reservationUpdated'));
};

// 예약 통계를 반환하는 유틸리티 함수
export const getReservationStats = () => {
  const allReservations = JSON.parse(localStorage.getItem('allReservations') || '[]');
  const today = new Date().toISOString().split('T')[0];
  return {
    total: allReservations.length,
    today: allReservations.filter((r: any) => (r.date || r.checkIn) === today).length,
    hotel: allReservations.filter((r: any) => r.service === 'hotel').length,
    grooming: allReservations.filter((r: any) => r.service === 'grooming').length,
    daycare: allReservations.filter((r: any) => r.service === 'daycare').length,
    pending: allReservations.filter((r: any) => r.status === 'pending').length,
    confirmed: allReservations.filter((r: any) => r.status === 'confirmed').length,
    completed: allReservations.filter((r: any) => r.status === 'completed').length
  };
};