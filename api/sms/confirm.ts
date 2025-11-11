import type { VercelRequest, VercelResponse } from '@vercel/node';

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
    return res.status(400).json({ ok: false, error: 'invalid_json' });
  }

  const { to, message, text } = (body || {}) as { to?: string; message?: string; text?: string };
  const smsText = message ?? text;

  const apiKey = process.env.SOLAPI_API_KEY;
  const apiSecret = process.env.SOLAPI_API_SECRET;
  const sender = (process.env.SOLAPI_SENDER || process.env.SMS_SENDER || '').replace(/\D/g, '');

  if (!to || !smsText) {
    return res.status(400).json({ ok: false, error: 'bad_request', hint: 'to, message(text) 필요' });
  }
  if (!apiKey || !apiSecret || !sender) {
    return res.status(500).json({ ok: false, error: 'server_env_missing' });
  }

  const toNum = String(to).replace(/\D/g, '');

  try {
    const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
    const payload = { message: { to: toNum, from: sender, text: smsText } };

    const rsp = await fetch('https://api.solapi.com/messages/v4/send', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const textBody = await rsp.text();
    let data: unknown;
    try {
      data = JSON.parse(textBody);
    } catch {
      data = textBody;
    }

    if (!rsp.ok) {
      return res.status(rsp.status).json({ ok: false, upstream: data });
    }

    return res.status(200).json({ ok: true, data });
  } catch (e: any) {
    return res.status(500).json({
      ok: false,
      upstream: { name: e?.name, message: e?.message, code: e?.code },
    });
  }
}
