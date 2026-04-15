import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { invokeEdgeFunction } from "@/lib/invokeEdgeFunction";
import { toast } from "sonner";
import { Loader2, Save, Send, Eye, EyeOff, CheckCircle, XCircle, Plus, Trash2 } from "lucide-react";
...
  const handleTest = async (channel: TelegramChannel) => {
    const botToken = config[TELEGRAM_KEYS.botToken];
    if (!botToken) { toast.error("Preencha o Token do Bot primeiro"); return; }
    if (!channel.chatId) { toast.error("Preencha o Chat ID deste canal"); return; }

    setTesting(channel.id);
    try {
      const data = await invokeEdgeFunction<{ ok?: boolean; description?: string }>("send-telegram", {
        botToken,
        chatId: channel.chatId,
        text: `✅ *Teste de conexão do CineFlow!*\n\nCanal: ${channel.name || "Sem nome"}\nTipo: ${channel.type === "all" ? "Todos" : channel.type === "movies" ? "Filmes" : "Séries"}\n\nBot configurado e funcionando!`,
        parse_mode: "Markdown",
      });

      if (data?.ok) {
        toast.success(`Teste enviado para "${channel.name || channel.chatId}"!`);
      } else {
        toast.error("Erro: " + (data?.description || "Falha ao enviar"));
      }
    } catch (err: any) {
      toast.error("Erro ao enviar teste: " + err.message);
    }
    setTesting(null);
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

      {/* Toggle */}
      <div className="bg-card border border-border rounded-xl p-5">
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

      {/* Bot Token */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-border bg-secondary/50">
          <h3 className="font-semibold text-foreground text-sm">Token do Bot</h3>
        </div>
        <div className="p-5 space-y-4">
          <div>
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

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Enviar com foto</p>
              <p className="text-xs text-muted-foreground">Incluir poster do conteúdo na mensagem</p>
            </div>
            <Toggle enabled={sendPhoto} onChange={() => updateConfig(TELEGRAM_KEYS.sendPhoto, sendPhoto ? "false" : "true")} />
          </div>
        </div>
      </div>

      {/* Channels */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-border bg-secondary/50 flex items-center justify-between">
          <h3 className="font-semibold text-foreground text-sm">Canais / Grupos</h3>
          <button onClick={addChannel} className="flex items-center gap-1 text-primary text-xs font-semibold hover:text-primary/80">
            <Plus className="h-3.5 w-3.5" /> Adicionar Canal
          </button>
        </div>
        <div className="p-5 space-y-4">
          {channels.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum canal configurado. Adicione um canal para receber notificações.</p>
          )}
          {channels.map((ch) => (
            <div key={ch.id} className="bg-secondary/50 border border-border rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={ch.name}
                  onChange={e => updateChannel(ch.id, "name", e.target.value)}
                  placeholder="Nome do canal (ex: Filmes HD)"
                  className="flex-1 bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <button onClick={() => removeChannel(ch.id)} className="p-2 text-destructive hover:bg-destructive/10 rounded-lg">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Chat ID</label>
                <input
                  type="text"
                  value={ch.chatId}
                  onChange={e => updateChannel(ch.id, "chatId", e.target.value)}
                  placeholder="-1001234567890"
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Tipo de conteúdo</label>
                  <div className="flex gap-2">
                    {(["all", "movies", "series"] as const).map(t => (
                      <button
                        key={t}
                        onClick={() => updateChannel(ch.id, "type", t)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${ch.type === t ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground border border-border"}`}
                      >
                        {t === "all" ? "Todos" : t === "movies" ? "Filmes" : "Séries"}
                      </button>
                    ))}
                  </div>
                </div>

                <button onClick={() => handleTest(ch)} disabled={testing === ch.id}
                  className="flex items-center gap-1.5 bg-[#0088cc] text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-[#0088cc]/90 transition-colors disabled:opacity-50 self-end">
                  {testing === ch.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  Testar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Templates */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-border bg-secondary/50">
          <h3 className="font-semibold text-foreground text-sm">Template — Filmes</h3>
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
          <h3 className="font-semibold text-foreground text-sm">Template — Séries</h3>
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
