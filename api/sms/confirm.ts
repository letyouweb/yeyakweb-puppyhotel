import type { VercelRequest, VercelResponse } from '@vercel/node';

const apiKey = process.env.SOLAPI_API_KEY;
const apiSecret = process.env.SOLAPI_API_SECRET;
const sender = process.env.SMS_SENDER;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!apiKey || !apiSecret || !sender) {
    return res.status(500).json({ error: 'Missing environment variables' });
  }

  try {
    const { to, text } = req.body as { to?: string; text?: string };
    
    if (!to || !text) {
      return res.status(400).json({ error: 'Missing required fields: to, text' });
    }

    // 전화번호 하이픈 제거
    const cleanPhone = to.replace(/-/g, '');

    // Step 1: Solapi 인증 토큰 가져오기
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

    if (!authResponse.ok) {
      const authError = await authResponse.json();
      return res.status(500).json({ 
        error: 'Authentication failed',
        details: authError 
      });
    }

    const authData = await authResponse.json();
    const accessToken = authData.accessToken;

    // Step 2: SMS 발송
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

    if (!sendResponse.ok) {
      const sendError = await sendResponse.json();
      return res.status(500).json({ 
        error: 'SMS send failed',
        details: sendError 
      });
    }

    const result = await sendResponse.json();

    return res.status(200).json({
      ok: true,
      messageId: result.groupId || result.messageId,
      data: result
    });
    
  } catch (error: any) {
    console.error('SMS API Error:', error);
    return res.status(500).json({
      error: error.message || 'Internal server error',
    });
  }
}
