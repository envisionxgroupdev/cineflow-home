const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TELEGRAM_TOKEN_PATTERN = /^\d{6,}:[A-Za-z0-9_-]{20,}$/;

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const botToken = typeof payload.botToken === "string" ? payload.botToken.trim() : "";
    const chatId = typeof payload.chatId === "string" || typeof payload.chatId === "number" ? String(payload.chatId).trim() : "";
    const text = typeof payload.text === "string" ? payload.text : "";
    const photo = typeof payload.photo === "string" ? payload.photo.trim() : "";
    const parseMode = typeof payload.parse_mode === "string" ? payload.parse_mode : "Markdown";

    if (!botToken || !chatId) {
      return jsonResponse({ ok: false, description: "Missing botToken or chatId" }, 400);
    }

    if (!TELEGRAM_TOKEN_PATTERN.test(botToken)) {
      return jsonResponse({
        ok: false,
        description: "Invalid Telegram bot token format. Use the full token from @BotFather, like 123456789:AAxxxx...",
      }, 400);
    }

    const url = photo
      ? `https://api.telegram.org/bot${botToken}/sendPhoto`
      : `https://api.telegram.org/bot${botToken}/sendMessage`;

    const body = photo
      ? { chat_id: chatId, photo, caption: text, parse_mode: parseMode }
      : { chat_id: chatId, text, parse_mode: parseMode };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok && res.status === 404 && data?.description === "Not Found") {
      return jsonResponse({
        ok: false,
        description: "Telegram rejected the bot token. Confirm the token is correct and still active in @BotFather.",
        telegram_error: data,
      }, 400);
    }

    return jsonResponse(data, res.ok ? 200 : 400);
  } catch (err) {
    return jsonResponse({ ok: false, description: String(err) }, 500);
  }
});
