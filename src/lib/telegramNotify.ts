import { supabase } from "@/integrations/supabase/client";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
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
    // Load telegram config from site_settings
    const { data: settings } = await supabase.from("site_settings").select("*");
    if (!settings) return;

    const config: Record<string, string> = {};
    settings.forEach((row: { key: string; value: string }) => { config[row.key] = row.value; });

    if (config.telegram_enabled !== "true") return;
    if (!config.telegram_bot_token || !config.telegram_chat_id) return;

    const slug = slugify(content.title);
    const siteUrl = window.location.origin;
    const link = content.type === "movie"
      ? `${siteUrl}/filme/${slug}`
      : `${siteUrl}/serie/${slug}`;

    const templateKey = content.type === "movie" ? "telegram_movie_template" : "telegram_series_template";
    let message = config[templateKey] || "";

    // Replace variables
    message = message
      .replace(/{title}/g, content.title)
      .replace(/{year}/g, content.year || "—")
      .replace(/{rating}/g, String(content.rating))
      .replace(/{genre}/g, content.genre || "—")
      .replace(/{overview}/g, (content.overview || "").slice(0, 200))
      .replace(/{link}/g, link);

    const sendPhoto = config.telegram_send_photo === "true";
    const photoUrl = sendPhoto && content.imageUrl ? content.imageUrl : undefined;

    await supabase.functions.invoke("send-telegram", {
      body: {
        botToken: config.telegram_bot_token,
        chatId: config.telegram_chat_id,
        message,
        parseMode: "Markdown",
        photoUrl,
      },
    });
  } catch (err) {
    console.error("Telegram notification error:", err);
  }
}
