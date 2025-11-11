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

  const toUpstream = (err: any) => {
    if (err?.response?.data && typeof err.response.data === 'object') {
      return err.response.data;
    }
    const errorCode = err?.errorCode ?? err?.code ?? err?.name ?? 'UnknownError';
    const errorMessage = err?.errorMessage ?? err?.message ?? 'Unknown error';
    return { errorCode, errorMessage };
  };

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
    const status = Number(err?.response?.status ?? err?.httpStatus ?? 500);
    const upstream = toUpstream(err);
    return res.status(status >= 400 && status < 600 ? status : 500).json({ ok: false, upstream });
  }
}
