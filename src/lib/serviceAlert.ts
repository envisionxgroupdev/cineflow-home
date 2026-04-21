import { supabase } from "@/integrations/supabase/client";
import { callTelegram } from "./telegramNotify";

interface TelegramChannel {
  id: string;
  name: string;
  chatId: string;
  type: "all" | "movies" | "series" | "alerts";
}

const ALERT_COOLDOWN_MS = 10 * 60 * 1000; // 10 min between alerts per service
const lastAlertAt: Record<string, number> = {};

/** Plays a short beep using WebAudio (no asset needed) */
export function playAlertBeep() {
  try {
    const Ctx = (window as unknown as { AudioContext: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext
      || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.25);
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
    osc.start();
    osc.stop(ctx.currentTime + 0.42);
  } catch {
    // ignore — autoplay restrictions or unsupported
  }
}

/** Sends a Telegram alert to admin channels (type "alerts" or "all"), throttled per service */
export async function sendServiceAlert(serviceName: string, status: "down" | "up") {
  const key = `${serviceName}:${status}`;
  const now = Date.now();
  if (lastAlertAt[key] && now - lastAlertAt[key] < ALERT_COOLDOWN_MS) return;
  lastAlertAt[key] = now;

  try {
    const { data: settings } = await supabase.from("site_settings").select("*");
    if (!settings) return;
    const config: Record<string, string> = {};
    settings.forEach((row: { key: string; value: string }) => { config[row.key] = row.value; });

    if (config.telegram_enabled !== "true" || !config.telegram_bot_token) return;

    let channels: TelegramChannel[] = [];
    try { channels = JSON.parse(config.telegram_channels || "[]"); } catch { /* empty */ }

    const alertChannels = channels.filter(c => c.chatId && (c.type === "alerts" || c.type === "all"));
    if (alertChannels.length === 0) return;

    const emoji = status === "down" ? "🚨" : "✅";
    const label = status === "down" ? "*OFFLINE*" : "*ONLINE novamente*";
    const text = `${emoji} *Alerta PipocaMax*\n\nServiço: \`${serviceName}\`\nStatus: ${label}\n\n_${new Date().toLocaleString("pt-BR")}_`;

    for (const ch of alertChannels) {
      try { await callTelegram(config.telegram_bot_token, ch.chatId, text); }
      catch (e) { console.error("Alert send failed:", e); }
    }
  } catch (e) {
    console.error("sendServiceAlert error:", e);
  }
}
