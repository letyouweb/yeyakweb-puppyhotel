import type { VercelRequest, VercelResponse } from '@vercel/node';
import { SolapiMessageService } from 'solapi';

const stripBom = (value?: string | null) =>
  (value ?? '').replace(/\ufeff/g, '').trim();

const solapiKey = stripBom(process.env.SOLAPI_API_KEY);
const solapiSecret = stripBom(process.env.SOLAPI_API_SECRET);

if (!solapiKey || !solapiSecret) {
  throw new Error('SOLAPI credentials are missing');
}

const svc = new SolapiMessageService(solapiKey, solapiSecret);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body ?? {};
    const to = String(body.to ?? '').replace(/\D/g, '');
    const text = stripBom(String(body.message ?? body.text ?? '')).trim();
    const from = stripBom(String(process.env.SMS_SENDER ?? process.env.SOLAPI_SENDER ?? '')).replace(/\D/g, '');

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
