// 공통 예약 타입 정의
export interface Reservation {
  id: string;
  petName: string;
  ownerName: string;
  service: 'grooming' | 'hotel' | 'daycare';
  date: string; // YYYY-MM-DD 형식
  time: string; // HH:mm 형식
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  phone: string;
  checkIn?: string; // 호텔용 체크인 날짜
  checkOut?: string; // 호텔용 체크아웃 날짜
  roomType?: string; // 호텔용 룸타입
  style?: string; // 미용용 스타일
}

// 캘린더 컴포넌트 Props 인터페이스
export interface CalendarProps {
  reservations: Reservation[];
}
