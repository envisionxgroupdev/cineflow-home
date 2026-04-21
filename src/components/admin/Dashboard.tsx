import { useState, useEffect, useRef } from "react";
import { Film, Tv, AlertTriangle, Database, Globe, CheckCircle, XCircle, Loader2, Inbox, MessageSquare, Volume2, VolumeX } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { playAlertBeep, sendServiceAlert } from "@/lib/serviceAlert";

interface Stats {
  movies: number;
  series: number;
  reports: number;
  pendingRequests: number;
  newMessages: number;
  dbConnected: boolean;
  tmdbOnline: boolean;
  warezOnline: boolean;
}

const REFRESH_MS = 30_000;

export function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const previousRef = useRef<Stats | null>(null);

  useEffect(() => {
    checkAll();
    const id = setInterval(checkAll, REFRESH_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function checkAll() {
    const [moviesRes, seriesRes, reportsRes, requestsRes, messagesRes, tmdbRes, warezRes] = await Promise.all([
      supabase.from('movies').select('id', { count: 'exact', head: true }),
      supabase.from('series').select('id', { count: 'exact', head: true }),
      supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('contact_messages').select('id', { count: 'exact', head: true }).eq('status', 'new'),
      fetch('https://api.themoviedb.org/3/configuration?api_key=c3303b4812a831ae634e26763a65644e').then(r => r.ok).catch(() => false),
      fetch('https://embed.warezcdn.com/', { mode: 'no-cors' }).then(() => true).catch(() => false),
    ]);

    const next: Stats = {
      movies: moviesRes.count ?? 0,
      series: seriesRes.count ?? 0,
      reports: reportsRes.count ?? 0,
      pendingRequests: requestsRes.count ?? 0,
      newMessages: messagesRes.count ?? 0,
      dbConnected: !moviesRes.error,
      tmdbOnline: tmdbRes as boolean,
      warezOnline: warezRes as boolean,
    };

    // Compare to previous and trigger alerts on transitions
    const prev = previousRef.current;
    if (prev) {
      const checks: Array<[string, boolean, boolean]> = [
        ["Banco de Dados", prev.dbConnected, next.dbConnected],
        ["TMDB API", prev.tmdbOnline, next.tmdbOnline],
        ["WarezCDN", prev.warezOnline, next.warezOnline],
      ];
      for (const [name, before, after] of checks) {
        if (before && !after) {
          toast.error(`⚠️ ${name} está OFFLINE`, { duration: 8000 });
          if (soundEnabled) playAlertBeep();
          void sendServiceAlert(name, "down");
        } else if (!before && after) {
          toast.success(`✅ ${name} voltou ao ar`);
          void sendServiceAlert(name, "up");
        }
      }
    }
    previousRef.current = next;

    setStats(next);
    setLastCheck(new Date());
    setLoading(false);
  }

  if (loading && !stats) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>;
  if (!stats) return null;

  const cards = [
    { label: "Filmes", value: stats.movies, icon: Film, color: "text-primary" },
    { label: "Séries", value: stats.series, icon: Tv, color: "text-primary" },
    { label: "Reports Pendentes", value: stats.reports, icon: AlertTriangle, color: stats.reports > 0 ? "text-destructive" : "text-primary" },
    { label: "Pedidos Pendentes", value: stats.pendingRequests, icon: Inbox, color: stats.pendingRequests > 0 ? "text-yellow-500" : "text-primary" },
    { label: "Mensagens Novas", value: stats.newMessages, icon: MessageSquare, color: stats.newMessages > 0 ? "text-yellow-500" : "text-primary" },
  ];

  const services = [
    { label: "Banco de Dados (Supabase)", online: stats.dbConnected, icon: Database },
    { label: "TMDB API", online: stats.tmdbOnline, icon: Globe },
    { label: "WarezCDN", online: stats.warezOnline, icon: Globe },
  ];

  const anyDown = services.some(s => !s.online);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {cards.map(card => (
          <div key={card.label} className="bg-card border border-border rounded-lg p-5 flex items-center gap-4">
            <div className={`p-3 rounded-lg bg-secondary ${card.color}`}>
              <card.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{card.value}</p>
              <p className="text-xs text-muted-foreground">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="font-display text-lg text-foreground">STATUS DOS SERVIÇOS</h3>
            {anyDown && (
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-destructive" />
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSoundEnabled(s => !s)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              title={soundEnabled ? "Desativar som de alerta" : "Ativar som de alerta"}
            >
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>
            <span className="text-[11px] text-muted-foreground">
              {lastCheck ? `Atualizado ${lastCheck.toLocaleTimeString("pt-BR")}` : ""}
            </span>
          </div>
        </div>
        <div className="space-y-3">
          {services.map(svc => (
            <div key={svc.label} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
              <div className="flex items-center gap-3">
                <svc.icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-foreground">{svc.label}</span>
              </div>
              {svc.online ? (
                <span className="flex items-center gap-1.5 text-xs font-medium text-green-500">
                  <CheckCircle className="h-4 w-4" /> Online
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-xs font-medium text-destructive">
                  <span className="relative flex h-2 w-2 mr-0.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
                  </span>
                  <XCircle className="h-4 w-4" /> Offline
                </span>
              )}
            </div>
          ))}
        </div>
        <p className="mt-4 text-[11px] text-muted-foreground">
          Verificação automática a cada 30s. Falhas geram toast, beep sonoro e alerta no Telegram (canais do tipo "alerts" ou "all").
        </p>
      </div>

      <button onClick={() => { setLoading(true); checkAll(); }} className="text-sm text-primary hover:underline">
        Atualizar agora
      </button>
    </div>
  );
}
