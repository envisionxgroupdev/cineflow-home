import { supabase } from "@/integrations/supabase/client";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

interface TelegramChannel {
  id: string;
  name: string;
  chatId: string;
  type: "all" | "movies" | "series";
}

interface ContentInfo {
  title: string;
  year: string | null;
  rating: number;
  genre: string | null;
  overview: string | null;
  imageUrl: string | null;
  type: "movie" | "series";
}

export async function sendTelegramNotification(content: ContentInfo) {
  try {
    const { data: settings } = await supabase.from("site_settings").select("*");
    if (!settings) return;

    const config: Record<string, string> = {};
    settings.forEach((row: { key: string; value: string }) => { config[row.key] = row.value; });

    if (config.telegram_enabled !== "true") return;
    if (!config.telegram_bot_token) return;

    // Parse channels
    let channels: TelegramChannel[] = [];
    try {
      channels = JSON.parse(config.telegram_channels || "[]");
    } catch {
      // Legacy single channel
      if (config.telegram_chat_id) {
        channels = [{ id: "legacy", name: "Principal", chatId: config.telegram_chat_id, type: "all" }];
      }
    }

    if (channels.length === 0) return;

    // Filter channels by content type
    const targetChannels = channels.filter(ch =>
      ch.chatId && (ch.type === "all" || (ch.type === "movies" && content.type === "movie") || (ch.type === "series" && content.type === "series"))
    );

    if (targetChannels.length === 0) return;

    const slug = slugify(content.title);
    const siteUrl = window.location.origin;
    const link = content.type === "movie"
      ? `${siteUrl}/filme/assistir-${slug}-online-gratis`
      : `${siteUrl}/serie/assistir-${slug}-online-gratis`;

    const templateKey = content.type === "movie" ? "telegram_movie_template" : "telegram_series_template";
    const template = config[templateKey] || "";

    const message = template
      .replace(/{title}/g, content.title)
      .replace(/{year}/g, content.year || "—")
      .replace(/{rating}/g, String(content.rating))
      .replace(/{genre}/g, content.genre || "—")
      .replace(/{overview}/g, (content.overview || "").slice(0, 200))
      .replace(/{link}/g, link);

    const sendPhoto = config.telegram_send_photo === "true";
    const botToken = config.telegram_bot_token;

    // Send to all matching channels
    for (const ch of targetChannels) {
      try {
        if (sendPhoto && content.imageUrl) {
          await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: ch.chatId,
              photo: content.imageUrl,
              caption: message,
              parse_mode: "Markdown",
            }),
          });
        } else {
          await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: ch.chatId,
              text: message,
              parse_mode: "Markdown",
            }),
          });
        }
      } catch (err) {
        console.error(`Telegram send error for channel ${ch.name}:`, err);
      }
    }
  } catch (err) {
    console.error("Telegram notification error:", err);
  }
}
