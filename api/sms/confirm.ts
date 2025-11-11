import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

const apiKey = process.env.SOLAPI_API_KEY;
const apiSecret = process.env.SOLAPI_API_SECRET;
const sender = process.env.SMS_SENDER;

// HMAC 서명 생성
function getHmacSignature(timestamp: string, salt: string): string {
  const data = timestamp + salt;
  return crypto.createHmac('sha256', apiSecret!)
    .update(data)
    .digest('hex');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 디버그 모드
  const isDebug = req.query.debug === 'true';

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 환경변수 확인 (디버그 모드)
  if (isDebug) {
    return res.status(200).json({
      debug: true,
      hasApiKey: !!apiKey,
      hasApiSecret: !!apiSecret,
      hasSender: !!sender,
      apiKeyLength: apiKey?.length || 0,
      apiSecretLength: apiSecret?.length || 0,
      apiKeyPrefix: apiKey?.substring(0, 4) || '',
    });
  }

  if (!apiKey || !apiSecret || !sender) {
    return res.status(500).json({ 
      error: 'Missing environment variables',
      details: {
        hasApiKey: !!apiKey,
        hasApiSecret: !!apiSecret,
        hasSender: !!sender,
      }
    });
  }

  try {
    const { to, text } = req.body as { to?: string; text?: string };
    
    if (!to || !text) {
      return res.status(400).json({ error: 'Missing required fields: to, text' });
    }

    // 전화번호 하이픈 제거
    const cleanPhone = to.replace(/-/g, '');

    console.log('📱 SMS 발송 시작:', { to: cleanPhone, from: sender });

    // HMAC 인증 방식
    const timestamp = Date.now().toString();
    const salt = Math.random().toString(36).substring(2, 15);
    const signature = getHmacSignature(timestamp, salt);

    console.log('🔑 HMAC 인증 방식 사용');

    const sendResponse = await fetch('https://api.solapi.com/messages/v4/send', {
      method: 'POST',
      headers: {
        'Authorization': `HMAC-SHA256 apiKey=${apiKey}, date=${timestamp}, salt=${salt}, signature=${signature}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: {
          to: cleanPhone,
          from: sender,
          text: text,
        },
      }),
    });

    console.log('📥 발송 응답 상태:', sendResponse.status);

    if (!sendResponse.ok) {
      const sendError = await sendResponse.text();
      console.error('❌ 발송 실패:', sendError);
      
      return res.status(500).json({ 
        error: 'SMS send failed',
        status: sendResponse.status,
        details: sendError,
      });
    }

    const result = await sendResponse.json();
    console.log('✅ SMS 발송 성공:', result);

    return res.status(200).json({
      ok: true,
      messageId: result.groupId || result.messageId,
      data: result
    });
    
  } catch (error: any) {
    console.error('🚨 SMS API Error:', error);
    return res.status(500).json({
      error: error.message || 'Internal server error',
      stack: error.stack,
    });
  }
}
