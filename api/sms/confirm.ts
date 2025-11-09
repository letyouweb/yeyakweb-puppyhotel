import type { VercelRequest, VercelResponse } from '@vercel/node';
import Solapi from 'solapi';

const apiKey = process.env.SOLAPI_API_KEY;
const apiSecret = process.env.SOLAPI_API_SECRET;
const sender = process.env.SMS_SENDER;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  if (!apiKey || !apiSecret || !sender) {
    return res.status(500).json({ ok: false, error: 'missing_env' });
  }

  try {
    const { to, text } = req.body as { to?: string; text?: string };
    if (!to || !text) {
      return res.status(400).json({ ok: false, error: 'bad_request' });
    }

    const messageService = new Solapi(apiKey, apiSecret);
    const result = await messageService.sendOne({
      to,
      from: sender,
      text,
    });

    return res.status(200).json({
      ok: true,
      messageId: result?.messageId || result?.groupId || null,
    });
  } catch (error: any) {
    console.error('SOLAPI send error:', error);
    return res.status(500).json({
      ok: false,
      error: error?.message || 'sms_failed',
    });
  }
}
