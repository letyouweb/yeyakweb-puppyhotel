// Supabase Edge Function: SMS 발송
// 경로: supabase/functions/send-sms/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const SOLAPI_API_KEY = 'NCSATGLIDQRVD1BS'
const SOLAPI_API_SECRET = 'DDXRMRRHOVF0ITYY58SZDYE6C3SEIL9J'
const SMS_SENDER = '01082411619'

serve(async (req) => {
  // CORS 헤더
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  // OPTIONS 요청 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, message } = await req.json()

    // 전화번호 형식 정리 (하이픈 제거)
    const cleanPhone = to.replace(/-/g, '')

    // SOLAPI 요청
    const solapiResponse = await fetch('https://api.solapi.com/messages/v4/send', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${SOLAPI_API_KEY}:${SOLAPI_API_SECRET}`)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: {
          to: cleanPhone,
          from: SMS_SENDER,
          text: message,
        },
      }),
    })

    const result = await solapiResponse.json()

    if (!solapiResponse.ok) {
      throw new Error(result.message || 'SMS 발송 실패')
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'SMS 발송 성공',
        data: result 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('SMS 발송 에러:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
