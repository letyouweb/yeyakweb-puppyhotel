// 이 파일을 dashboard/page.tsx의 useEffect와 handleStatusChange 부분에 통합하세요

import { loadAllReservations, updateReservationStatus, subscribeToReservations } from '../../../lib/dashboardHelper';

// ===== useEffect 교체용 코드 =====
// 기존 useEffect를 아래 코드로 교체하세요

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

// ===== handleStatusChange 교체용 코드 =====
// 기존 handleStatusChange 함수를 아래 코드로 교체하세요

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
