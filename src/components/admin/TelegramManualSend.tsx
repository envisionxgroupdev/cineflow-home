import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Send, Search, Film, Tv, CheckCircle2, XCircle } from "lucide-react";
import { callTelegram, buildContentLink, renderTemplate } from "@/lib/telegramNotify";

interface ContentRow {
  id: string;
  title: string;
  year: number | null;
  rating: number | null;
  genre: string | null;
  overview: string | null;
  poster: string | null;
  type: "movie" | "series";
}

interface TelegramChannel {
  id: string;
  name: string;
  chatId: string;
  type: "all" | "movies" | "series";
}

type SendResult = { channel: string; ok: boolean; error?: string };

export function TelegramManualSend() {
  const [config, setConfig] = useState<Record<string, string>>({});
  const [channels, setChannels] = useState<TelegramChannel[]>([]);
  const [contentType, setContentType] = useState<"movie" | "series">("movie");
  const [items, setItems] = useState<ContentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState<ContentRow | null>(null);
  const [selectedChannels, setSelectedChannels] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState<SendResult[] | null>(null);

  useEffect(() => { void load(); }, []);
  useEffect(() => { void loadContent(); }, [contentType]);

  const load = async () => {
    const { data } = await supabase.from("site_settings").select("*");
    if (data) {
      const map: Record<string, string> = {};
      data.forEach((row: { key: string; value: string }) => { map[row.key] = row.value; });
      setConfig(map);
      try {
        const ch: TelegramChannel[] = JSON.parse(map.telegram_channels || "[]");
        setChannels(ch);
      } catch {
        setChannels([]);
      }
    }
  };

  const loadContent = async () => {
    setLoading(true);
    setSelectedItem(null);
    setResults(null);
    const table = contentType === "movie" ? "movies" : "series";
    const { data } = await supabase.from(table).select("id, title, year, rating, genre, overview, poster").order("created_at", { ascending: false }).limit(500);
    if (data) {
      setItems((data as Array<Omit<ContentRow, "type">>).map(r => ({ ...r, type: contentType })));
    }
    setLoading(false);
  };

  const filtered = useMemo(
    () => items.filter(i => i.title.toLowerCase().includes(search.toLowerCase())).slice(0, 100),
    [items, search]
  );

  const eligibleChannels = channels.filter(ch =>
    ch.chatId && (ch.type === "all" || (ch.type === "movies" && contentType === "movie") || (ch.type === "series" && contentType === "series"))
  );

  const toggleChannel = (id: string) => {
    setSelectedChannels(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelectedChannels(new Set(eligibleChannels.map(c => c.id)));
  const clearAll = () => setSelectedChannels(new Set());

  const handleSend = async () => {
    if (!selectedItem) { toast.error("Escolha um filme/série"); return; }
    if (selectedChannels.size === 0) { toast.error("Selecione ao menos 1 canal"); return; }
    const botToken = (config.telegram_bot_token || "").trim();
    if (!botToken) { toast.error("Configure o token do bot na aba Configurações"); return; }

    setSending(true);
    setResults(null);

    const link = buildContentLink(selectedItem.type, selectedItem.title);
    const tplKey = selectedItem.type === "movie" ? "telegram_movie_template" : "telegram_series_template";
    const template = config[tplKey] || "";
    const message = renderTemplate(template, {
      title: selectedItem.title,
      year: selectedItem.year ? String(selectedItem.year) : null,
      rating: selectedItem.rating || 0,
      genre: selectedItem.genre,
      overview: selectedItem.overview,
      imageUrl: selectedItem.poster,
      type: selectedItem.type,
    }, link);

    const sendPhoto = config.telegram_send_photo === "true";
    const buttonLabel = config.telegram_button_label || "▶️ Assistir Agora";
    const targets = eligibleChannels.filter(c => selectedChannels.has(c.id));

    const out: SendResult[] = [];
    for (const ch of targets) {
      try {
        const res = await callTelegram(botToken, ch.chatId, message, sendPhoto ? selectedItem.poster : null, link, buttonLabel);
        out.push({ channel: ch.name || ch.chatId, ok: !!res?.ok, error: res?.ok ? undefined : (res?.description || "Falha") });
      } catch (err) {
        out.push({ channel: ch.name || ch.chatId, ok: false, error: (err as Error).message });
      }
    }

    setResults(out);
    setSending(false);
    const okCount = out.filter(r => r.ok).length;
    if (okCount === out.length) toast.success(`Enviado para ${okCount} canal(is)!`);
    else if (okCount === 0) toast.error("Falha em todos os canais");
    else toast(`${okCount}/${out.length} enviados`);
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-display text-lg text-foreground">Envio Manual</h3>
        <p className="text-xs text-muted-foreground mt-1">Repostar filmes/séries já cadastrados nos canais do Telegram.</p>
      </div>

      <div className="flex gap-2">
        {(["movie", "series"] as const).map(t => (
          <button key={t} onClick={() => setContentType(t)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              contentType === t ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}>
            {t === "movie" ? <Film className="h-4 w-4" /> : <Tv className="h-4 w-4" />}
            {t === "movie" ? "Filmes" : "Séries"}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Lista de conteúdo */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="border-b border-border bg-secondary/50 px-4 py-3 flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..."
              className="flex-1 bg-transparent text-sm focus:outline-none text-foreground placeholder:text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">{filtered.length}/{items.length}</span>
          </div>
          <div className="max-h-[420px] overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
            ) : filtered.length === 0 ? (
              <p className="text-center py-8 text-sm text-muted-foreground">Nada encontrado.</p>
            ) : (
              filtered.map(item => (
                <button key={item.id} onClick={() => { setSelectedItem(item); setResults(null); }}
                  className={`w-full flex items-center gap-3 p-3 border-b border-border/50 hover:bg-secondary/40 transition-colors text-left ${
                    selectedItem?.id === item.id ? "bg-primary/10" : ""
                  }`}>
                  {item.poster ? (
                    <img src={item.poster} alt="" className="w-10 h-14 object-cover rounded shrink-0" loading="lazy" />
                  ) : (
                    <div className="w-10 h-14 bg-secondary rounded shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.year || "—"} · ⭐ {item.rating || 0}</p>
                  </div>
                  {selectedItem?.id === item.id && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Painel direito */}
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-foreground">Canais ({selectedChannels.size}/{eligibleChannels.length})</h4>
              <div className="flex gap-2">
                <button onClick={selectAll} className="text-[11px] text-primary hover:underline">Todos</button>
                <button onClick={clearAll} className="text-[11px] text-muted-foreground hover:text-foreground">Limpar</button>
              </div>
            </div>
            {eligibleChannels.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">Nenhum canal compatível com {contentType === "movie" ? "filmes" : "séries"}.</p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {eligibleChannels.map(ch => (
                  <label key={ch.id} className="flex items-center gap-2 p-2 rounded hover:bg-secondary/50 cursor-pointer">
                    <input type="checkbox" checked={selectedChannels.has(ch.id)} onChange={() => toggleChannel(ch.id)}
                      className="w-4 h-4 accent-primary" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{ch.name || "Sem nome"}</p>
                      <p className="text-[10px] text-muted-foreground font-mono truncate">{ch.chatId}</p>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground uppercase">
                      {ch.type === "all" ? "Todos" : ch.type === "movies" ? "Filmes" : "Séries"}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <button onClick={handleSend} disabled={sending || !selectedItem || selectedChannels.size === 0}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {sending ? "Enviando..." : `Enviar ${selectedItem ? `"${selectedItem.title}"` : "agora"}`}
          </button>

          {results && (
            <div className="bg-card border border-border rounded-xl p-4 space-y-2">
              <h4 className="text-sm font-semibold text-foreground mb-2">Resultado</h4>
              {results.map((r, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  {r.ok
                    ? <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                    : <XCircle className="h-4 w-4 text-destructive shrink-0" />}
                  <span className="text-foreground">{r.channel}</span>
                  {r.error && <span className="text-destructive truncate">— {r.error}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
