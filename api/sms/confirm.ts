import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.SOLAPI_API_KEY;
  const apiSecret = process.env.SOLAPI_API_SECRET;
  const sender = process.env.SMS_SENDER;

  if (!apiKey || !apiSecret || !sender) {
    return res.status(500).json({ error: 'Missing environment variables' });
  }

  try {
    const { to, text } = req.body;
    
    if (!to || !text) {
      return res.status(400).json({ error: 'Missing to or text' });
    }

    const solapi = await import('solapi');
    const { config, msg } = solapi;

    config.init({
      apiKey: apiKey,
      apiSecret: apiSecret
    });

    const result = await msg.send({
      messages: [{
        to: to.replace(/-/g, ''),
        from: sender,
        text: text
      }]
    });

    return res.status(200).json({
      ok: true,
      data: result
    });
    
  } catch (error: any) {
    console.error('SMS Error:', error);
    return res.status(500).json({
      error: error.message
    });
  }
}
