import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { invokeEdgeFunction } from "@/lib/invokeEdgeFunction";
import { toast } from "sonner";
import { Loader2, Save, Send, Eye, EyeOff, CheckCircle, XCircle, Plus, Trash2 } from "lucide-react";

const TELEGRAM_KEYS = {
  enabled: "telegram_enabled",
  botToken: "telegram_bot_token",
  sendPhoto: "telegram_send_photo",
  movieTemplate: "telegram_movie_template",
  seriesTemplate: "telegram_series_template",
  channels: "telegram_channels",
};

const DEFAULT_MOVIE_TEMPLATE = `🎬 *Novo Filme Adicionado!*

🎥 *{title}* ({year})
⭐ Nota: {rating}
🎭 Gênero: {genre}

📖 {overview}

🔗 [Assistir Agora]({link})`;

const DEFAULT_SERIES_TEMPLATE = `📺 *Nova Série Adicionada!*

🎥 *{title}* ({year})
⭐ Nota: {rating}
🎭 Gênero: {genre}

📖 {overview}

🔗 [Assistir Agora]({link})`;

interface TelegramChannel {
  id: string;
  name: string;
  chatId: string;
  type: "all" | "movies" | "series";
}

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${enabled ? "bg-green-500" : "bg-muted-foreground/30"}`}
    >
      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${enabled ? "translate-x-5" : "translate-x-0"}`} />
    </button>
  );
}

export function TelegramManagement() {
  const [config, setConfig] = useState<Record<string, string>>({});
  const [channels, setChannels] = useState<TelegramChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [showToken, setShowToken] = useState(false);

  useEffect(() => {
    void loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    const { data } = await supabase.from("site_settings").select("*");

    if (data) {
      const map: Record<string, string> = {};
      data.forEach((row: { key: string; value: string }) => {
        map[row.key] = row.value;
      });

      if (!map[TELEGRAM_KEYS.movieTemplate]) map[TELEGRAM_KEYS.movieTemplate] = DEFAULT_MOVIE_TEMPLATE;
      if (!map[TELEGRAM_KEYS.seriesTemplate]) map[TELEGRAM_KEYS.seriesTemplate] = DEFAULT_SERIES_TEMPLATE;
      if (!map[TELEGRAM_KEYS.sendPhoto]) map[TELEGRAM_KEYS.sendPhoto] = "true";
      setConfig(map);

      try {
        const parsed = JSON.parse(map[TELEGRAM_KEYS.channels] || "[]") as TelegramChannel[];
        setChannels(parsed);
      } catch {
        if (map.telegram_chat_id) {
          setChannels([{ id: crypto.randomUUID(), name: "Canal Principal", chatId: map.telegram_chat_id, type: "all" }]);
        }
      }
    }

    setLoading(false);
  };

  const updateConfig = (key: string, value: string) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const addChannel = () => {
    setChannels((prev) => [...prev, { id: crypto.randomUUID(), name: "", chatId: "", type: "all" }]);
  };

  const removeChannel = (id: string) => {
    setChannels((prev) => prev.filter((channel) => channel.id !== id));
  };

  const updateChannel = (id: string, field: keyof TelegramChannel, value: string) => {
    setChannels((prev) => prev.map((channel) => (channel.id === id ? { ...channel, [field]: value } : channel)));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const keysToSave = { ...TELEGRAM_KEYS };
      delete (keysToSave as { channels?: string }).channels;

      for (const [, key] of Object.entries(keysToSave)) {
        const value = config[key] || "";
        await supabase.from("site_settings").upsert({ key, value }, { onConflict: "key" });
      }

      await supabase.from("site_settings").upsert(
        { key: TELEGRAM_KEYS.channels, value: JSON.stringify(channels) },
        { onConflict: "key" },
      );

      toast.success("Configurações do Telegram salvas!");
    } catch (err: any) {
      toast.error("Erro ao salvar: " + err.message);
    }
    setSaving(false);
  };

  const handleTest = async (channel: TelegramChannel) => {
    const botToken = (config[TELEGRAM_KEYS.botToken] || "").trim();
    const chatId = channel.chatId.trim();

    if (!botToken) {
      toast.error("Preencha o Token do Bot primeiro");
      return;
    }
    if (!chatId) {
      toast.error("Preencha o Chat ID deste canal");
      return;
    }

    setTesting(channel.id);
    try {
      const data = await invokeEdgeFunction<{ ok?: boolean; description?: string }>("send-telegram", {
        botToken,
        chatId,
        text: `✅ *Teste de conexão do CineFlow!*\n\nCanal: ${channel.name || "Sem nome"}\nTipo: ${channel.type === "all" ? "Todos" : channel.type === "movies" ? "Filmes" : "Séries"}\n\nBot configurado e funcionando!`,
        parse_mode: "Markdown",
      });

      if (data?.ok) {
        toast.success(`Teste enviado para "${channel.name || chatId}"!`);
      } else {
        toast.error("Erro: " + (data?.description || "Falha ao enviar"));
      }
    } catch (err: any) {
      toast.error("Erro ao enviar teste: " + err.message);
    }
    setTesting(null);
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const isEnabled = config[TELEGRAM_KEYS.enabled] === "true";
  const sendPhoto = config[TELEGRAM_KEYS.sendPhoto] === "true";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display text-foreground">Bot do Telegram</h2>
          <p className="mt-1 text-sm text-muted-foreground">Configure o bot para postar automaticamente quando novo conteúdo for adicionado</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar
        </button>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isEnabled ? <CheckCircle className="h-5 w-5 text-green-400" /> : <XCircle className="h-5 w-5 text-muted-foreground" />}
            <div>
              <p className="text-sm font-medium text-foreground">Notificações do Telegram</p>
              <p className="text-xs text-muted-foreground">Enviar mensagem quando filmes ou séries forem adicionados</p>
            </div>
          </div>
          <Toggle enabled={isEnabled} onChange={() => updateConfig(TELEGRAM_KEYS.enabled, isEnabled ? "false" : "true")} />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border bg-secondary/50 px-5 py-3">
          <h3 className="text-sm font-semibold text-foreground">Token do Bot</h3>
        </div>
        <div className="space-y-4 p-5">
          <div>
            <p className="mb-2 text-xs text-muted-foreground">Obtenha em <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">@BotFather</a></p>
            <div className="relative">
              <input
                type={showToken ? "text" : "password"}
                value={config[TELEGRAM_KEYS.botToken] || ""}
                onChange={(e) => updateConfig(TELEGRAM_KEYS.botToken, e.target.value)}
                placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v..."
                className="w-full rounded-lg border border-border bg-secondary px-3 py-2.5 pr-10 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <button onClick={() => setShowToken(!showToken)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Enviar com foto</p>
              <p className="text-xs text-muted-foreground">Incluir poster do conteúdo na mensagem</p>
            </div>
            <Toggle enabled={sendPhoto} onChange={() => updateConfig(TELEGRAM_KEYS.sendPhoto, sendPhoto ? "false" : "true")} />
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border bg-secondary/50 px-5 py-3">
          <h3 className="text-sm font-semibold text-foreground">Canais / Grupos</h3>
          <button onClick={addChannel} className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80">
            <Plus className="h-3.5 w-3.5" /> Adicionar Canal
          </button>
        </div>
        <div className="space-y-4 p-5">
          {channels.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">Nenhum canal configurado. Adicione um canal para receber notificações.</p>
          )}
          {channels.map((channel) => (
            <div key={channel.id} className="space-y-3 rounded-lg border border-border bg-secondary/50 p-4">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={channel.name}
                  onChange={(e) => updateChannel(channel.id, "name", e.target.value)}
                  placeholder="Nome do canal (ex: Filmes HD)"
                  className="flex-1 rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <button onClick={() => removeChannel(channel.id)} className="rounded-lg p-2 text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Chat ID</label>
                <input
                  type="text"
                  value={channel.chatId}
                  onChange={(e) => updateChannel(channel.id, "chatId", e.target.value)}
                  placeholder="-1001234567890"
                  className="w-full rounded-lg border border-border bg-secondary px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="mb-1.5 block text-xs text-muted-foreground">Tipo de conteúdo</label>
                  <div className="flex gap-2">
                    {(["all", "movies", "series"] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => updateChannel(channel.id, "type", type)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${channel.type === type ? "bg-primary text-primary-foreground" : "border border-border bg-secondary text-muted-foreground hover:text-foreground"}`}
                      >
                        {type === "all" ? "Todos" : type === "movies" ? "Filmes" : "Séries"}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => handleTest(channel)}
                  disabled={testing === channel.id}
                  className="self-end rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  <span className="flex items-center gap-1.5">
                    {testing === channel.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                    Testar
                  </span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border bg-secondary/50 px-5 py-3">
          <h3 className="text-sm font-semibold text-foreground">Template — Filmes</h3>
        </div>
        <div className="p-5">
          <p className="mb-2 text-xs text-muted-foreground">
            Variáveis: <code className="rounded bg-secondary px-1">{'{title}'}</code> <code className="rounded bg-secondary px-1">{'{year}'}</code> <code className="rounded bg-secondary px-1">{'{rating}'}</code> <code className="rounded bg-secondary px-1">{'{genre}'}</code> <code className="rounded bg-secondary px-1">{'{overview}'}</code> <code className="rounded bg-secondary px-1">{'{link}'}</code>
          </p>
          <textarea
            value={config[TELEGRAM_KEYS.movieTemplate] || ""}
            onChange={(e) => updateConfig(TELEGRAM_KEYS.movieTemplate, e.target.value)}
            rows={8}
            className="w-full resize-y rounded-lg border border-border bg-secondary px-3 py-2 font-mono text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border bg-secondary/50 px-5 py-3">
          <h3 className="text-sm font-semibold text-foreground">Template — Séries</h3>
        </div>
        <div className="p-5">
          <p className="mb-2 text-xs text-muted-foreground">
            Variáveis: <code className="rounded bg-secondary px-1">{'{title}'}</code> <code className="rounded bg-secondary px-1">{'{year}'}</code> <code className="rounded bg-secondary px-1">{'{rating}'}</code> <code className="rounded bg-secondary px-1">{'{genre}'}</code> <code className="rounded bg-secondary px-1">{'{overview}'}</code> <code className="rounded bg-secondary px-1">{'{link}'}</code>
          </p>
          <textarea
            value={config[TELEGRAM_KEYS.seriesTemplate] || ""}
            onChange={(e) => updateConfig(TELEGRAM_KEYS.seriesTemplate, e.target.value)}
            rows={8}
            className="w-full resize-y rounded-lg border border-border bg-secondary px-3 py-2 font-mono text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>
    </div>
  );
}
