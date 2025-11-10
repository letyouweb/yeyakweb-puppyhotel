// AI 챗봇에서 예약을 Supabase에 저장하는 전역 함수
// 홈페이지가 로드되면 자동으로 window 객체에 등록됩니다

import { reservationService, faqService } from '../lib/supabase';

// 챗봇이 호출할 수 있는 예약 생성 함수
export function setupChatbotReservationAPI() {
  // 미용 예약 생성
  (window as any).createGroomingReservation = async (data: {
    petName: string;
    ownerName: string;
    phone: string;
    date: string;
    time: string;
    style: string;
    notes?: string;
  }) => {
    try {
      const result = await reservationService.create({
        pet_name: data.petName,
        owner_name: data.ownerName,
        service: 'grooming',
        reservation_date: data.date,
        reservation_time: data.time,
        status: 'pending',
        phone: data.phone,
        grooming_style: data.style,
        special_notes: data.notes || ''
      });

      return {
        success: true,
        reservationId: result.id,
        message: `${data.petName}의 미용 예약이 접수되었습니다. 관리자가 확인 후 연락드립니다.`
      };
    } catch (error) {
      console.error('예약 생성 실패:', error);
      return {
        success: false,
        error: '예약 중 오류가 발생했습니다.'
      };
    }
  };

  // 호텔 예약 생성
  (window as any).createHotelReservation = async (data: {
    petName: string;
    ownerName: string;
    phone: string;
    checkIn: string;
    checkOut: string;
    roomType?: string;
    notes?: string;
  }) => {
    try {
      const result = await reservationService.create({
        pet_name: data.petName,
        owner_name: data.ownerName,
        service: 'hotel',
        reservation_date: data.checkIn,
        status: 'pending',
        phone: data.phone,
        room_type: data.roomType || 'medium',
        check_in: data.checkIn,
        check_out: data.checkOut,
        special_notes: data.notes || ''
      });

      return {
        success: true,
        reservationId: result.id,
        message: `${data.petName}의 호텔 예약이 접수되었습니다. 관리자가 확인 후 연락드립니다.`
      };
    } catch (error) {
      console.error('예약 생성 실패:', error);
      return {
        success: false,
        error: '예약 중 오류가 발생했습니다.'
      };
    }
  };

  // 데이케어 예약 생성
  (window as any).createDaycareReservation = async (data: {
    petName: string;
    ownerName: string;
    phone: string;
    date: string;
    time: string;
    notes?: string;
  }) => {
    try {
      const result = await reservationService.create({
        pet_name: data.petName,
        owner_name: data.ownerName,
        service: 'daycare',
        reservation_date: data.date,
        reservation_time: data.time,
        status: 'pending',
        phone: data.phone,
        special_notes: data.notes || ''
      });

      return {
        success: true,
        reservationId: result.id,
        message: `${data.petName}의 데이케어 예약이 접수되었습니다. 관리자가 확인 후 연락드립니다.`
      };
    } catch (error) {
      console.error('예약 생성 실패:', error);
      return {
        success: false,
        error: '예약 중 오류가 발생했습니다.'
      };
    }
  };

  // FAQ 조회 (챗봇이 자주 묻는 질문에 답변할 수 있도록)
  (window as any).getFAQs = async () => {
    try {
      const faqs = await faqService.list();
      const activeFaqs = faqs.filter(faq => faq.is_active);
      
      return {
        success: true,
        count: activeFaqs.length,
        faqs: activeFaqs.map(faq => ({
          question: faq.question,
          answer: faq.answer,
          tags: faq.tags || []
        })),
        message: `${activeFaqs.length}개의 FAQ를 찾았습니다.`
      };
    } catch (error) {
      console.error('FAQ 조회 실패:', error);
      return {
        success: false,
        error: 'FAQ를 불러오는 중 오류가 발생했습니다.',
        faqs: []
      };
    }
  };

  console.log('🤖 챗봇 예약 API 준비 완료!');
  console.log('사용 가능한 함수:', [
    'window.getAvailableSlots(date, service)',
    'window.getReservationStatus(date)',
    'window.createGroomingReservation(data)',
    'window.createHotelReservation(data)',
    'window.createDaycareReservation(data)',
    'window.getFAQs()'
  ]);
}
