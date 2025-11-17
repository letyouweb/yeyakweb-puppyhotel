// src/constants/messages.ts

// 예약 관련 폼에서 사용하는 공통 메시지 모음
// HomePage 등에서 `RESERVATION_FORM_MESSAGES.success / error`로 사용합니다.

export const RESERVATION_FORM_MESSAGES = {
  // 성공 메시지
  success: '예약이 정상적으로 접수되었습니다. 곧 연락드리겠습니다 😊',

  // 에러 메시지
  error: '예약 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',

  // (옵션) 아래 메시지들은 다른 폼에서도 공통으로 쓸 수 있습니다.
  required: '필수 입력 항목입니다.',
  invalidPhone: '연락처 형식을 다시 확인해주세요. 예: 010-1234-5678',
  invalidDate: '날짜를 올바르게 선택해주세요.',
} as const;

export type ReservationFormMessageKey = keyof typeof RESERVATION_FORM_MESSAGES;
