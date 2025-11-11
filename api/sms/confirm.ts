import type { VercelRequest, VercelResponse } from '@vercel/node';
import { SolapiMessageService } from 'solapi';

const svc = new SolapiMessageService(
  process.env.SOLAPI_API_KEY,
  process.env.SOLAPI_API_SECRET,
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body ?? {};
    const to = String(body.to ?? '').replace(/\D/g, '');
    const text = String(body.message ?? body.text ?? '').trim();
    const from = String(process.env.SMS_SENDER ?? process.env.SOLAPI_SENDER ?? '').replace(/\D/g, '');

    if (!from || !to || !text) {
      return res.status(400).json({ ok: false, error: 'bad_request', fields: { from: !!from, to: !!to, text: !!text } });
    }

    const result = await svc.sendOne({ to, from, text });
    return res.status(200).json({ ok: true, result });
  } catch (err: any) {
    const upstream = err?.response?.data ?? { name: err?.name, message: err?.message };
    return res.status(500).json({ ok: false, upstream });
  }
}
