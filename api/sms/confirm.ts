import type { VercelRequest, VercelResponse } from '@vercel/node';
import { SolapiMessageService } from 'solapi';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let body: Record<string, unknown> = {};
  const raw = req.body ?? {};
  try {
    body = typeof raw === 'string' ? (raw ? JSON.parse(raw) : {}) : (raw as Record<string, unknown>);
  } catch (error) {
    console.error('Invalid JSON payload', error);
    return res.status(400).json({ error: 'invalid_json' });
  }

  const { to, message, text } = (body || {}) as { to?: string; message?: string; text?: string };
  const smsText = message ?? text;

  if (!to || !smsText) {
    return res.status(400).json({ error: 'bad_request', hint: 'to, message(text) 필요' });
  }

  const apiKey = process.env.SOLAPI_API_KEY;
  const apiSecret = process.env.SOLAPI_API_SECRET;
  const sender = process.env.SOLAPI_SENDER || process.env.SMS_SENDER;

  if (!apiKey || !apiSecret || !sender) {
    return res.status(500).json({ error: 'server_env_missing' });
  }

  try {
    const messageService = new SolapiMessageService(apiKey, apiSecret);
    const result = await messageService.send({
      to: to.replace(/\D/g, ''),
      from: sender,
      text: smsText
    });
    return res.status(200).json({ ok: true, data: result });
  } catch (e: any) {
    const status = e?.response?.status ?? 500;
    const data = e?.response?.data ?? e?.message ?? 'unknown';
    console.error('SOLAPI ERROR', status, data);
    return res.status(status).json({ ok: false, upstream: data });
  }
}
