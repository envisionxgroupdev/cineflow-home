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

export async function callTelegram(
  botToken: string,
  chatId: string,
  text: string,
  photo?: string | null,
  link?: string | null,
  buttonLabel?: string,
) {
  const baseUrl = `https://api.telegram.org/bot${botToken.trim()}`;

  const reply_markup = link?.trim()
    ? { inline_keyboard: [[{ text: buttonLabel || "▶️ Assistir Agora", url: link.trim() }]] }
    : undefined;

  let url: string;
  let body: Record<string, unknown>;

  if (photo?.trim()) {
    url = `${baseUrl}/sendPhoto`;
    body = { chat_id: chatId.trim(), photo: photo.trim(), caption: text, parse_mode: "Markdown", reply_markup };
  } else {
    url = `${baseUrl}/sendMessage`;
    body = {
      chat_id: chatId.trim(),
      text,
      parse_mode: "Markdown",
      disable_web_page_preview: false,
      reply_markup,
    };
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  return res.json();
}

export function buildContentLink(type: "movie" | "series", title: string): string {
  const slug = slugify(title);
  const siteUrl = window.location.origin;
  return type === "movie"
    ? `${siteUrl}/filme/assistir-${slug}-online-gratis`
    : `${siteUrl}/serie/assistir-${slug}-online-gratis`;
}

export function renderTemplate(template: string, content: ContentInfo, link: string): string {
  return template
    .replace(/{title}/g, content.title)
    .replace(/{year}/g, content.year || "—")
    .replace(/{rating}/g, String(content.rating))
    .replace(/{genre}/g, content.genre || "—")
    .replace(/{overview}/g, (content.overview || "").slice(0, 200))
    .replace(/{link}/g, link);
}

export async function sendTelegramNotification(content: ContentInfo) {
  try {
    const { data: settings } = await supabase.from("site_settings").select("*");
    if (!settings) return;

    const config: Record<string, string> = {};
    settings.forEach((row: { key: string; value: string }) => { config[row.key] = row.value; });

    if (config.telegram_enabled !== "true") return;
    if (!config.telegram_bot_token) return;

    let channels: TelegramChannel[] = [];
    try {
      channels = JSON.parse(config.telegram_channels || "[]");
    } catch {
      if (config.telegram_chat_id) {
        channels = [{ id: "legacy", name: "Principal", chatId: config.telegram_chat_id, type: "all" }];
      }
    }

    if (channels.length === 0) return;

    // Strict routing: if specific-type channels exist for this content,
    // send ONLY to them. "all" channels are a fallback for when no
    // specific channel was configured for the content type.
    const specificType = content.type === "movie" ? "movies" : "series";
    const specific = channels.filter(ch => ch.chatId && ch.type === specificType);
    const targetChannels = specific.length > 0
      ? specific
      : channels.filter(ch => ch.chatId && ch.type === "all");

    if (targetChannels.length === 0) return;

    const link = buildContentLink(content.type, content.title);
    const templateKey = content.type === "movie" ? "telegram_movie_template" : "telegram_series_template";
    const template = config[templateKey] || "";
    const message = renderTemplate(template, content, link);

    const sendPhoto = config.telegram_send_photo === "true";
    const botToken = config.telegram_bot_token;
    const buttonLabel = config.telegram_button_label || "▶️ Assistir Agora";

    for (const ch of targetChannels) {
      try {
        await callTelegram(botToken, ch.chatId, message, sendPhoto ? content.imageUrl : null, link, buttonLabel);
      } catch (err) {
        console.error(`Telegram send error for channel ${ch.name}:`, err);
      }
    }
  } catch (err) {
    console.error("Telegram notification error:", err);
  }
}
