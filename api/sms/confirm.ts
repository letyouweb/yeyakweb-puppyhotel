import type { VercelRequest, VercelResponse } from '@vercel/node';
import { SolapiMessageService } from 'solapi';

const stripBom = (value?: string | null) =>
  (value ?? '').replace(/\ufeff/g, '').trim();

const rawAllowedOrigins =
  process.env.SMS_ALLOWED_ORIGINS ??
  process.env.CORS_ALLOWED_ORIGINS ??
  '*';

const allowedOrigins = rawAllowedOrigins
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

const corsHeaders = {
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
};

const applyCors = (req: VercelRequest, res: VercelResponse) => {
  const headerOrigin = req.headers.origin;
  const requestOrigin = Array.isArray(headerOrigin) ? headerOrigin[0] : headerOrigin;
  let allowOrigin = '*';

  if (allowedOrigins.length && !allowedOrigins.includes('*')) {
    if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
      allowOrigin = requestOrigin;
    } else {
      allowOrigin = allowedOrigins[0];
    }
  }

  res.setHeader('Access-Control-Allow-Origin', allowOrigin);
  Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));
};

const respond = (req: VercelRequest, res: VercelResponse, status: number, payload: any) => {
  applyCors(req, res);
  return res.status(status).json(payload);
};

const solapiKey = stripBom(process.env.SOLAPI_API_KEY);
const solapiSecret = stripBom(process.env.SOLAPI_API_SECRET);

if (!solapiKey || !solapiSecret) {
  throw new Error('SOLAPI credentials are missing');
}

const svc = new SolapiMessageService(solapiKey, solapiSecret);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    applyCors(req, res);
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return respond(req, res, 405, { error: 'Method not allowed' });
  }

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
      return respond(req, res, 400, { ok: false, error: 'bad_request', fields: { from: !!from, to: !!to, text: !!text } });
    }

    const result = await svc.sendOne({ to, from, text });
    return respond(req, res, 200, { ok: true, result });
  } catch (err: any) {
    const status = Number(err?.response?.status ?? err?.httpStatus ?? 500);
    const upstream = toUpstream(err);
    const finalStatus = status >= 400 && status < 600 ? status : 500;
    return respond(req, res, finalStatus, { ok: false, upstream });
  }
}
