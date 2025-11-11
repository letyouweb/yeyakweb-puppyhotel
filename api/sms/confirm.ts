import type { VercelRequest, VercelResponse } from '@vercel/node';
import { SolapiMessageService } from 'solapi';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // safe parse
  let body: any = {};
  try {
    const raw = req.body ?? {};
    body = typeof raw === 'string' ? (raw ? JSON.parse(raw) : {}) : raw;
  } catch {
    return res.status(400).json({ ok: false, error: 'invalid_json' });
  }

  const { to, message, text } = body || {};
  const smsText = (message ?? text ?? '').toString().trim();

  const apiKey = process.env.SOLAPI_API_KEY;
  const apiSecret = process.env.SOLAPI_API_SECRET;
  const sender = (process.env.SOLAPI_SENDER || process.env.SMS_SENDER || '').replace(/\D/g, '');

  if (!to || !smsText) {
    return res.status(400).json({ ok: false, error: 'bad_request', hint: 'to, message(text) 필요' });
  }
  if (!apiKey || !apiSecret) {
    return res.status(500).json({ ok: false, error: 'server_env_missing', hint: 'API KEY/SECRET' });
  }
  if (!sender) {
    return res.status(500).json({ ok: false, error: 'server_env_missing', hint: 'SENDER 번호' });
  }

  try {
    const svc = new SolapiMessageService(apiKey, apiSecret);

    // SDK 단건 발송 (공식 권장)
    const result = await svc.sendOne({
      to: String(to).replace(/\D/g, ''), // 숫자만
      from: sender,
      text: smsText,
    });

    return res.status(200).json({ ok: true, data: result });
  } catch (e: any) {
    // SDK가 주는 원문 에러를 그대로 노출
    const status  = e?.response?.status ?? 500;
    const details = e?.response?.data ?? { name: e?.name, message: e?.message, code: e?.code };
    console.error('SOLAPI SDK ERROR', status, details);
    return res.status(status).json({ ok: false, upstream: details });
  }
}
