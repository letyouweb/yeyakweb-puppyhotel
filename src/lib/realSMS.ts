// realSMS.ts - 완전 수정 버전 (모든 문제 해결)

import type { Reservation } from './supabase';

const isDev = (import.meta.env?.DEV ?? import.meta.env?.MODE === 'development') === true;
const DEFAULT_ENDPOINT = isDev
  ? 'http://localhost:3000/api/sms/confirm'
  : '/api/sms/confirm';

const hasCustomEndpoint =
  !!import.meta.env?.VITE_SMS_ENDPOINT && import.meta.env.VITE_SMS_ENDPOINT.length > 0;
const forceCustomEndpoint =
  (import.meta.env?.VITE_SMS_FORCE_ENDPOINT ?? '').toString().toLowerCase() === 'true';

const shouldUseCustomEndpoint = hasCustomEndpoint && (!isDev || forceCustomEndpoint);

const windowOrigin = typeof window !== 'undefined' ? window.location.origin : '';
const sameOriginEndpoint = windowOrigin ? `${windowOrigin}${DEFAULT_ENDPOINT}` : DEFAULT_ENDPOINT;

const API_URL = shouldUseCustomEndpoint
  ? import.meta.env.VITE_SMS_ENDPOINT!
  : isDev && windowOrigin.includes('localhost')
  ? DEFAULT_ENDPOINT
  : sameOriginEndpoint;

// ✅ SMS 에러 클래스
class SMSError extends Error {
  constructor(
    public code: string,
    public statusCode?: number,
    message?: string
  ) {
    super(message || `SMS Error: ${code}`);
    this.name = 'SMSError';
  }
}

// ✅ 재시도 로직
async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

interface FetchOptions extends RequestInit {
  retries?: number;
  timeout?: number;
}

async function fetchWithRetry(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const {
    retries = 3,
    timeout = 15000,
    ...fetchOptions
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // TODO: 실제 서비스 배포 시에는 timeout/abort 로직을 다시 정교하게 설계할 것
      // 개발 중에는 AbortController를 사용하지 않습니다 (디버깅 편의를 위해)
      let controller: AbortController | undefined;
      let timeoutId: NodeJS.Timeout | undefined;

      if (!isDev) {
        controller = new AbortController();
        timeoutId = setTimeout(() => controller.abort(), timeout);
      }

      const response = await fetch(url, {
        ...fetchOptions,
        ...(controller && { signal: controller.signal }),
      });

      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // ✅ 성공 응답
      if (response.ok) {
        return response;
      }

      // ✅ 재시도 가능한 에러 (5xx, 429)
      if (response.status >= 500 || response.status === 429) {
        if (attempt < retries) {
          const delay = 1000 * attempt;
          console.warn(
            `⚠️  재시도 ${attempt}/${retries} (${delay}ms 후): HTTP ${response.status}`
          );
          await sleep(delay);
          continue;
        }
      }

      // ✅ 재시도 불가능한 에러 (4xx)
      throw new SMSError(
        'HTTP_ERROR',
        response.status,
        `HTTP ${response.status}: ${response.statusText}`
      );
    } catch (error) {
      lastError = error as Error;

      if (error instanceof SMSError) {
        throw error;
      }

      // AbortError 처리 (사용자가 요청을 취소했거나 타임아웃이 발생한 경우)
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('❌ SMS 요청이 AbortController에 의해 취소되었습니다.', error);
        throw new SMSError(
          'ABORTED',
          undefined,
          'SMS 요청이 클라이언트에서 취소되었습니다. (타임아웃 또는 사용자 취소)'
        );
      }

      if (error instanceof TypeError && error.message.includes('fetch')) {
        if (attempt < retries) {
          const delay = 1000 * attempt;
          console.warn(
            `⚠️  재시도 ${attempt}/${retries} (${delay}ms 후): 네트워크 오류`
          );
          await sleep(delay);
          continue;
        }
      }

      throw new SMSError(
        'NETWORK_ERROR',
        undefined,
        `네트워크 오류: ${lastError.message}`
      );
    }
  }

  throw lastError || new SMSError('UNKNOWN_ERROR', undefined, '알 수 없는 오류');
}

// ✅ 안전한 JSON 파싱
async function parseResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type');
  const text = await response.text();

  // ✅ 빈 응답 체크
  if (!text) {
    throw new SMSError(
      'EMPTY_RESPONSE',
      response.status,
      'API 응답이 비어있습니다'
    );
  }

  // ✅ JSON 형식 체크
  if (!contentType?.includes('application/json')) {
    throw new SMSError(
      'INVALID_CONTENT_TYPE',
      response.status,
      `예상치 못한 Content-Type: ${contentType}`
    );
  }

  try {
    return JSON.parse(text) as T;
  } catch (error) {
    throw new SMSError(
      'JSON_PARSE_ERROR',
      response.status,
      `JSON 파싱 실패: ${text.substring(0, 100)}`
    );
  }
}

interface SMSResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export const realSMSService = {
  async sendConfirmation(reservation: Reservation) {
    const message = `[PuppyHotel] ${reservation.owner_name}님의 ${reservation.pet_name} ${
      reservation.service === 'grooming'
        ? '미용'
        : reservation.service === 'hotel'
        ? '호텔'
        : '데이케어'
    } 예약이 확정되었습니다. 일시: ${reservation.reservation_date} ${
      reservation.reservation_time || ''
    }.`;

    // 개발 환경에서는 실제 SMS를 발송하지 않고 조기 리턴
    if (isDev) {
      const params = {
        수신자: reservation.phone,
        메시지: message.substring(0, 50) + '...',
        서비스: reservation.service,
      };
      console.log('🔧 [개발 환경] SMS 발송 스킵', params);
      return {
        success: true,
        code: 'DEV_SKIP',
        message: '개발 환경: 실제 SMS 미발송',
      };
    }

    console.log('========================================');
    console.log('📱 SMS 발송 시작');
    console.log('========================================');
    console.log('수신자:', reservation.phone);
    console.log('메시지:', message);
    console.log('API URL:', API_URL);
    console.log('========================================');

    try {
      const phoneNumber = reservation.phone?.replace(/[^0-9]/g, '');

      if (!phoneNumber) {
        throw new SMSError(
          'INVALID_PHONE',
          undefined,
          '유효한 전화번호가 없습니다'
        );
      }

      const payload = {
        to: phoneNumber,
        message,
        text: message,
        reservationId: reservation.id,
        customerName: reservation.owner_name,
      };

      console.log('🚀 API 호출 시작');

      const response = await fetchWithRetry(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
        retries: 3,
        timeout: 15000,
      });

      console.log('📥 응답 상태:', response.status);

      const data = await parseResponse<SMSResponse>(response);

      console.log('========================================');
      console.log('✅ SMS 발송 성공!');
      console.log('📧 메시지 ID:', data.messageId || 'N/A');
      console.log('========================================');

      return {
        success: true,
        message: 'SMS 발송 완료',
        data,
      };
    } catch (error) {
      console.log('========================================');
      console.log('❌ SMS 발송 실패');

      if (error instanceof SMSError) {
        console.error(`에러 코드: ${error.code}`);
        console.error(`상태 코드: ${error.statusCode || 'N/A'}`);
        console.error(`메시지: ${error.message}`);
      } else {
        console.error('에러:', error);
      }

      console.log('========================================');

      return {
        success: false,
        error:
          error instanceof SMSError
            ? error.message
            : error instanceof Error
            ? error.message
            : 'SMS 발송 실패',
        message: '예약은 확정되었으나 SMS 발송에 실패했습니다.',
      };
    }
  },
};

export { SMSError };