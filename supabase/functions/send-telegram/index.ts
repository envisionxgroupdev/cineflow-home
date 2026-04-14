import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { botToken, chatId, text, photo, parse_mode } = await req.json();

    if (!botToken || !chatId) {
      return new Response(
        JSON.stringify({ ok: false, description: "Missing botToken or chatId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let url: string;
    let body: Record<string, unknown>;

    if (photo) {
      url = `https://api.telegram.org/bot${botToken}/sendPhoto`;
      body = { chat_id: chatId, photo, caption: text || "", parse_mode: parse_mode || "Markdown" };
    } else {
      url = `https://api.telegram.org/bot${botToken}/sendMessage`;
      body = { chat_id: chatId, text: text || "", parse_mode: parse_mode || "Markdown" };
    }

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    return new Response(JSON.stringify(data), {
      status: res.ok ? 200 : 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, description: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
