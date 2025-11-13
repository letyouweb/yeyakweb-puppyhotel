// AI 챗봇에서 예약을 Supabase에 저장하는 전역 함수
// 홈페이지가 로드되면 자동으로 window 객체에 등록됩니다

import { faqService } from './supabase';

/**
 * 챗봇 예약 API를 초기화합니다.
 *
 * 기존 구현에서는 createGroomingReservation, createHotelReservation,
 * createDaycareReservation 함수가 Supabase에 예약을 생성했습니다.
 * 본 사이트에서는 챗봇을 통해 예약을 받지 않기 때문에 각
 * 예약 생성 함수는 예약을 생성하지 않고 안내 메시지만 반환합니다.
 *
 * 사용자는 예약폼을 통해서만 예약을 접수할 수 있습니다.
 */
export function setupChatbotReservationAPI() {
  // 미용 예약 생성 요청에 대한 응답
  (window as any).createGroomingReservation = async (_data: {
    petName: string;
    ownerName: string;
    phone: string;
    date: string;
    time: string;
    style: string;
    notes?: string;
  }) => {
    // 챗봇에서는 예약을 받지 않으므로 안내 메시지를 반환
    const message =
      '챗봇으로 예약접수는 받지 않고 있습니다. 예약신청은 예약폼에 작성해 주시기 바랍니다.';
    return {
      success: false,
      error: message,
    };
  };

  // 호텔 예약 생성 요청에 대한 응답
  (window as any).createHotelReservation = async (_data: {
    petName: string;
    ownerName: string;
    phone: string;
    checkIn: string;
    checkOut: string;
    roomType?: string;
    notes?: string;
  }) => {
    const message =
      '챗봇으로 예약접수는 받지 않고 있습니다. 예약신청은 예약폼에 작성해 주시기 바랍니다.';
    return {
      success: false,
      error: message,
    };
  };

  // 데이케어 예약 생성 요청에 대한 응답
  (window as any).createDaycareReservation = async (_data: {
    petName: string;
    ownerName: string;
    phone: string;
    date: string;
    time: string;
    notes?: string;
  }) => {
    const message =
      '챗봇으로 예약접수는 받지 않고 있습니다. 예약신청은 예약폼에 작성해 주시기 바랍니다.';
    return {
      success: false,
      error: message,
    };
  };

  // FAQ 조회 (챗봇이 자주 묻는 질문에 답변할 수 있도록)
  (window as any).getFAQs = async () => {
    try {
      const faqs = await faqService.list();
      const activeFaqs = faqs.filter((faq) => faq.is_active);

      return {
        success: true,
        count: activeFaqs.length,
        faqs: activeFaqs.map((faq) => ({
          question: faq.question,
          answer: faq.answer,
          tags: faq.tags || [],
        })),
        message: `${activeFaqs.length}개의 FAQ를 찾았습니다.`,
      };
    } catch (error) {
      console.error('FAQ 조회 실패:', error);
      return {
        success: false,
        error: 'FAQ를 불러오는 중 오류가 발생했습니다.',
        faqs: [],
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
    'window.getFAQs()',
  ]);
}