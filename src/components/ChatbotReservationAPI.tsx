// 챗봇 예약 조회 API 컴포넌트
// 이 컴포넌트를 홈페이지에 추가하면 챗봇이 예약 상황을 실시간으로 조회할 수 있습니다

import { useEffect, useState } from 'react';
import { chatbotService } from '../lib/supabase';
import { setupChatbotReservationAPI } from '../lib/chatbotAPI';

interface ReservationStatus {
  date: string;
  hotel: { available: number; booked: number };
  grooming: { available: number; booked: number };
  daycare: { available: number; booked: number };
}

/**
 * 챗봇과 연동하여 예약 조회 기능을 제공하는 컴포넌트입니다.
 *
 * 로드 시 예약 생성/FAQ 함수 및 예약 조회 함수를 window 객체에 등록합니다.
 * UI는 화면에 표시되지 않으며 챗봇이 직접 window 함수를 호출합니다.
 */
export default function ChatbotReservationAPI() {
  const [status, setStatus] = useState<ReservationStatus | null>(null);

  // 챗봇이 호출할 수 있는 전역 함수 등록
  useEffect(() => {
    // 예약 생성 API 등록 (챗봇에서는 예약을 생성하지 않고 안내 메시지를 반환함)
    setupChatbotReservationAPI();

    // 특정 날짜의 예약 가능 시간 조회
    (window as any).getAvailableSlots = async (date: string, service: string) => {
      try {
        const slots = await chatbotService.getAvailableSlots(date, service);
        return {
          success: true,
          date,
          service,
          availableSlots: slots,
          message:
            slots.length > 0
              ? `${date}에 ${slots.length}개의 예약 가능 시간이 있습니다.`
              : `${date}는 예약이 마감되었습니다.`,
        };
      } catch (error) {
        return {
          success: false,
          error: '예약 조회에 실패했습니다.',
        };
      }
    };

    // 특정 날짜의 전체 예약 현황 조회
    (window as any).getReservationStatus = async (date: string) => {
      try {
        const summary = await chatbotService.getReservationStatus(date);
        return {
          success: true,
          date,
          summary,
          message: `호텔 ${summary.hotel.available}개, 미용 ${summary.grooming.available}개, 데이케어 ${summary.daycare.available}개 예약 가능합니다.`,
        };
      } catch (error) {
        return {
          success: false,
          error: '예약 현황 조회에 실패했습니다.',
        };
      }
    };

    // 오늘 예약 현황 자동 로드
    loadTodayStatus();

    // 10분마다 자동 갱신
    const interval = setInterval(loadTodayStatus, 600000);

    return () => {
      clearInterval(interval);
      delete (window as any).getAvailableSlots;
      delete (window as any).getReservationStatus;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadTodayStatus = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const summary = await chatbotService.getReservationStatus(today);
      setStatus({
        date: today,
        ...summary,
      });
    } catch (error) {
      console.error('예약 현황 로드 실패:', error);
    }
  };

  // UI는 숨김 (챗봇만 사용)
  return null;
}

// 챗봇 프롬프트에 추가할 예약 조회 가이드
export const CHATBOT_RESERVATION_GUIDE = `
예약 조회 기능 사용법:

1. 특정 날짜의 예약 가능 시간 조회:
   window.getAvailableSlots('2024-12-25', 'grooming')
   
2. 특정 날짜의 전체 예약 현황:
   window.getReservationStatus('2024-12-25')
 
3. FAQ 조회:
   window.getFAQs()

응답 예시:
{
  success: true,
  date: '2024-12-25',
  availableSlots: ['09:00', '10:00', '14:00'],
  message: '2024-12-25에 3개의 예약 가능 시간이 있습니다.'
}
`;