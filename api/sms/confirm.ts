import type { VercelRequest, VercelResponse } from '@vercel/node';

const apiKey = process.env.SOLAPI_API_KEY;
const apiSecret = process.env.SOLAPI_API_SECRET;
const sender = process.env.SMS_SENDER;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 디버그 모드
  const isDebug = req.query.debug === 'true';

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 환경변수 확인 (디버그 모드에서만)
  if (isDebug) {
    return res.status(200).json({
      debug: true,
      hasApiKey: !!apiKey,
      hasApiSecret: !!apiSecret,
      hasSender: !!sender,
      apiKeyLength: apiKey?.length || 0,
      apiSecretLength: apiSecret?.length || 0,
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

    // Step 1: Solapi 인증 토큰 가져오기
    console.log('🔑 인증 요청 시작');
    
    const authResponse = await fetch('https://api.solapi.com/messages/v4/auth/access-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apiKey: apiKey,
        apiSecret: apiSecret,
      }),
    });

    console.log('📥 인증 응답 상태:', authResponse.status);

    if (!authResponse.ok) {
      const authError = await authResponse.text();
      console.error('❌ 인증 실패:', authError);
      
      return res.status(500).json({ 
        error: 'Authentication failed',
        status: authResponse.status,
        details: authError,
      });
    }

    const authData = await authResponse.json();
    const accessToken = authData.accessToken;

    console.log('✅ 인증 성공, 토큰 획득');

    // Step 2: SMS 발송
    console.log('📤 SMS 발송 요청');
    
    const sendResponse = await fetch('https://api.solapi.com/messages/v4/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
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
