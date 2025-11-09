import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SOLAPI_API_KEY = 'NCSATGLIDQRVD1BS';
const SOLAPI_API_SECRET = 'DDXRMRRHOVF0ITYY58SZDYE6C3SEIL9J';
const FROM_NUMBER = '01082411619'; // 발신번호 (실제 번호로 변경 필요)

interface SmsRequest {
  to: string;
  message: string;
  reservationId?: string;
}

serve(async (req) => {
  // CORS 헤더
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, message, reservationId }: SmsRequest = await req.json();

    // SOLAPI 문자 발송
    const authString = btoa(`${SOLAPI_API_KEY}:${SOLAPI_API_SECRET}`);
    
    const response = await fetch('https://api.solapi.com/messages/v4/send', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: {
          to: to,
          from: FROM_NUMBER,
          text: message
        }
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(`SOLAPI 오류: ${JSON.stringify(result)}`);
    }

    // 발송 성공 로그 (옵션)
    console.log(`SMS 발송 성공: ${to} - ${result.messageId || result.groupId}`);

    return new Response(
      JSON.stringify({
        success: true,
        messageId: result.messageId || result.groupId,
        message: 'SMS가 성공적으로 발송되었습니다.'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('SMS 발송 오류:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'SMS 발송에 실패했습니다.'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
