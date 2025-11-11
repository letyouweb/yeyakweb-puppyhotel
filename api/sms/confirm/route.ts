// app/api/sms/confirm/route.ts
export const runtime = 'nodejs';           // Node 런타임 강제 (crypto 등 사용)
export const dynamic = 'force-dynamic';    // 캐시 방지

import { NextResponse } from 'next/server';
import SolapiClient from 'solapi'; // npm i solapi (서버 전용)

const API_KEY = process.env.SOLAPI_API_KEY!;
const API_SECRET = process.env.SOLAPI_API_SECRET!;
const SENDER = process.env.SOLAPI_SENDER!; // 등록된 발신번호

export async function POST(req: Request) {
  try {
    const { to, message } = await req.json().catch(() => ({}));
    if (!to || !message) {
      return NextResponse.json({ error: 'bad_request', hint: 'to, message 필수' }, { status: 400 });
    }
    if (!API_KEY || !API_SECRET || !SENDER) {
      return NextResponse.json({ error: 'server_env_missing' }, { status: 500 });
    }

    const client = new SolapiClient(API_KEY, API_SECRET);

    // 실제 발송
    const result = await client.sendOne({
      to,
      from: SENDER,
      text: message,
    });

    return NextResponse.json({ ok: true, result }, { status: 200 });
  } catch (e: any) {
    // 솔라피 에러를 그대로 보여줘야 원인 판단 가능
    const status = e?.response?.status || 500;
    const data = e?.response?.data || e?.message || 'unknown';
    console.error('SOLAPI ERROR', status, data);
    return NextResponse.json({ ok: false, upstream: data }, { status });
  }
}
