import { serve } from "std/server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const to = body?.to;
    const text = body?.text ?? body?.message;

    if (!to || !text) {
      return new Response(JSON.stringify({ error: "missing params" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const API_KEY = Deno.env.get("SOLAPI_API_KEY");
    const API_SECRET = Deno.env.get("SOLAPI_API_SECRET");
    const SENDER = Deno.env.get("SOLAPI_SENDER") ?? Deno.env.get("SMS_SENDER");

    if (!API_KEY || !API_SECRET || !SENDER) {
      return new Response(JSON.stringify({ error: "missing server secrets" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const basic = btoa(`${API_KEY}:${API_SECRET}`);
    const payload = {
      messages: [
        {
          to: typeof to === "string" ? to.replace(/[^0-9]/g, "") : to,
          from: SENDER,
          text,
        },
      ],
    };

    const res = await fetch("https://api.solapi.com/messages/v4/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${basic}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await res.json();
    if (!res.ok) {
      return new Response(JSON.stringify({ error: "solapi error", detail: result }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, result }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message ?? "unexpected_error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
