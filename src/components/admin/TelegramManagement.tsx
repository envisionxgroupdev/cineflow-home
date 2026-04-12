import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Save, Send, Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";

const TELEGRAM_KEYS = {
  enabled: "telegram_enabled",
  botToken: "telegram_bot_token",
  chatId: "telegram_chat_id",
  movieTemplate: "telegram_movie_template",
  seriesTemplate: "telegram_series_template",
  sendPhoto: "telegram_send_photo",
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

export function TelegramManagement() {
  const [config, setConfig] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showToken, setShowToken] = useState(false);

  useEffect(() => { loadConfig(); }, []);

  const loadConfig = async () => {
    setLoading(true);
    const { data } = await supabase.from("site_settings").select("*");
    if (data) {
      const map: Record<string, string> = {};
      data.forEach((row: { key: string; value: string }) => { map[row.key] = row.value; });
      if (!map[TELEGRAM_KEYS.movieTemplate]) map[TELEGRAM_KEYS.movieTemplate] = DEFAULT_MOVIE_TEMPLATE;
      if (!map[TELEGRAM_KEYS.seriesTemplate]) map[TELEGRAM_KEYS.seriesTemplate] = DEFAULT_SERIES_TEMPLATE;
      if (!map[TELEGRAM_KEYS.sendPhoto]) map[TELEGRAM_KEYS.sendPhoto] = "true";
      setConfig(map);
    }
    setLoading(false);
  };

  const updateConfig = (key: string, value: string) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const [, key] of Object.entries(TELEGRAM_KEYS)) {
        const value = config[key] || "";
        await supabase.from("site_settings").upsert({ key, value }, { onConflict: "key" });
      }
      toast.success("Configurações do Telegram salvas!");
    } catch (err: any) {
      toast.error("Erro ao salvar: " + err.message);
    }
    setSaving(false);
  };

  const handleTest = async () => {
    const botToken = config[TELEGRAM_KEYS.botToken];
    const chatId = config[TELEGRAM_KEYS.chatId];

    if (!botToken || !chatId) {
      toast.error("Preencha o Token do Bot e o Chat ID primeiro");
      return;
    }

    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-telegram", {
        body: {
          botToken,
          chatId,
          message: "✅ *Teste de conexão do CineFlow!*\n\nSeu bot está configurado e funcionando corretamente.",
          parseMode: "Markdown",
        },
      });

      if (error) throw error;
      if (data?.ok) {
        toast.success("Mensagem de teste enviada com sucesso!");
      } else {
        toast.error("Erro: " + (data?.description || "Falha ao enviar"));
      }
    } catch (err: any) {
      toast.error("Erro ao enviar teste: " + err.message);
    }
    setTesting(false);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>;

  const isEnabled = config[TELEGRAM_KEYS.enabled] === "true";
  const sendPhoto = config[TELEGRAM_KEYS.sendPhoto] === "true";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display text-foreground">Bot do Telegram</h2>
          <p className="text-sm text-muted-foreground mt-1">Configure o bot para postar automaticamente quando novo conteúdo for adicionado</p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar
        </button>
      </div>

      {/* Toggle ativado/desativado */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isEnabled ? <CheckCircle className="h-5 w-5 text-green-400" /> : <XCircle className="h-5 w-5 text-muted-foreground" />}
            <div>
              <p className="text-sm font-medium text-foreground">Notificações do Telegram</p>
              <p className="text-xs text-muted-foreground">Enviar mensagem quando filmes ou séries forem adicionados</p>
            </div>
          </div>
          <button
            onClick={() => updateConfig(TELEGRAM_KEYS.enabled, isEnabled ? "false" : "true")}
            className={`relative w-12 h-6 rounded-full transition-colors ${isEnabled ? "bg-green-500" : "bg-muted"}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${isEnabled ? "translate-x-6" : "translate-x-0.5"}`} />
          </button>
        </div>
      </div>

      {/* Configurações do Bot */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-border bg-secondary/50">
          <h3 className="font-semibold text-foreground text-sm">Configurações do Bot</h3>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Token do Bot</label>
            <p className="text-xs text-muted-foreground mb-2">Obtenha em <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">@BotFather</a></p>
            <div className="relative">
              <input
                type={showToken ? "text" : "password"}
                value={config[TELEGRAM_KEYS.botToken] || ""}
                onChange={e => updateConfig(TELEGRAM_KEYS.botToken, e.target.value)}
                placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v..."
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 pr-10"
              />
              <button onClick={() => setShowToken(!showToken)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Chat ID do Grupo/Canal</label>
            <p className="text-xs text-muted-foreground mb-2">ID numérico do grupo ou canal (ex: -1001234567890)</p>
            <input
              type="text"
              value={config[TELEGRAM_KEYS.chatId] || ""}
              onChange={e => updateConfig(TELEGRAM_KEYS.chatId, e.target.value)}
              placeholder="-1001234567890"
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              <p className="text-sm font-medium text-foreground">Enviar com foto</p>
              <p className="text-xs text-muted-foreground">Incluir poster do conteúdo na mensagem</p>
            </div>
            <button
              onClick={() => updateConfig(TELEGRAM_KEYS.sendPhoto, sendPhoto ? "false" : "true")}
              className={`relative w-12 h-6 rounded-full transition-colors ${sendPhoto ? "bg-green-500" : "bg-muted"}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${sendPhoto ? "translate-x-6" : "translate-x-0.5"}`} />
            </button>
          </div>

          <button onClick={handleTest} disabled={testing}
            className="flex items-center gap-2 bg-[#0088cc] text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#0088cc]/90 transition-colors disabled:opacity-50 mt-2">
            {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Enviar mensagem de teste
          </button>
        </div>
      </div>

      {/* Templates */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-border bg-secondary/50">
          <h3 className="font-semibold text-foreground text-sm">Template da Mensagem — Filmes</h3>
        </div>
        <div className="p-5">
          <p className="text-xs text-muted-foreground mb-2">
            Variáveis: <code className="bg-secondary px-1 rounded">{'{title}'}</code> <code className="bg-secondary px-1 rounded">{'{year}'}</code> <code className="bg-secondary px-1 rounded">{'{rating}'}</code> <code className="bg-secondary px-1 rounded">{'{genre}'}</code> <code className="bg-secondary px-1 rounded">{'{overview}'}</code> <code className="bg-secondary px-1 rounded">{'{link}'}</code>
          </p>
          <textarea
            value={config[TELEGRAM_KEYS.movieTemplate] || ""}
            onChange={e => updateConfig(TELEGRAM_KEYS.movieTemplate, e.target.value)}
            rows={8}
            className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y"
          />
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-border bg-secondary/50">
          <h3 className="font-semibold text-foreground text-sm">Template da Mensagem — Séries</h3>
        </div>
        <div className="p-5">
          <p className="text-xs text-muted-foreground mb-2">
            Variáveis: <code className="bg-secondary px-1 rounded">{'{title}'}</code> <code className="bg-secondary px-1 rounded">{'{year}'}</code> <code className="bg-secondary px-1 rounded">{'{rating}'}</code> <code className="bg-secondary px-1 rounded">{'{genre}'}</code> <code className="bg-secondary px-1 rounded">{'{overview}'}</code> <code className="bg-secondary px-1 rounded">{'{link}'}</code>
          </p>
          <textarea
            value={config[TELEGRAM_KEYS.seriesTemplate] || ""}
            onChange={e => updateConfig(TELEGRAM_KEYS.seriesTemplate, e.target.value)}
            rows={8}
            className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y"
          />
        </div>
      </div>
    </div>
  );
}
