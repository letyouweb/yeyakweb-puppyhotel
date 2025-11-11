import type { VercelRequest, VercelResponse } from '@vercel/node';
import SolapiClient from 'solapi';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to, text, message } = req.body || {};
  const finalText = text ?? message;

  if (!to || !finalText) {
    return res.status(400).json({ error: 'Missing to or text' });
  }

  const apiKey = process.env.SOLAPI_API_KEY;
  const apiSecret = process.env.SOLAPI_API_SECRET;
  const sender = process.env.SOLAPI_SENDER ?? process.env.SMS_SENDER;

  if (!apiKey || !apiSecret || !sender) {
    return res.status(500).json({ error: 'Missing environment variables' });
  }

  try {
    const client = new SolapiClient(apiKey, apiSecret);
    const result = await client.sendOne({
      to: typeof to === 'string' ? to.replace(/-/g, '') : to,
      from: sender,
      text: finalText
    });

    return res.status(200).json({ ok: true, data: result });
  } catch (error: any) {
    console.error('SMS Error:', error);
    return res.status(error?.response?.status || 500).json({
      error: error?.response?.data || error.message || 'Unknown error'
    });
  }
}
