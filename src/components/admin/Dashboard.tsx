import { useState, useEffect, useRef, useCallback } from "react";
import {
  Film, Tv, AlertTriangle, Database, Globe, CheckCircle, XCircle, Loader2,
  Inbox, MessageSquare, Volume2, VolumeX, Activity, Clock, Wifi, Server,
  Users, TrendingUp, RefreshCw,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Stats {
  movies: number;
  series: number;
  reports: number;
  pendingRequests: number;
  newMessages: number;
  totalUsers: number;
  releases: number;
}

interface ServiceCheck {
  key: string;
  label: string;
  online: boolean;
  latencyMs: number | null;
  icon: typeof Database;
  description?: string;
}

const REFRESH_MS = 30_000;

/** Plays a short beep using WebAudio (no asset needed) */
function playAlertBeep() {
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
  } catch { /* ignore */ }
}

async function timedFetch(url: string, opts?: RequestInit): Promise<{ ok: boolean; ms: number }> {
  const start = performance.now();
  try {
    const res = await fetch(url, opts);
    return { ok: opts?.mode === "no-cors" ? true : res.ok, ms: Math.round(performance.now() - start) };
  } catch {
    return { ok: false, ms: Math.round(performance.now() - start) };
  }
}

export function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [services, setServices] = useState<ServiceCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [uptimeStart] = useState<Date>(new Date());
  const previousServicesRef = useRef<ServiceCheck[]>([]);

  const checkAll = useCallback(async () => {
    const dbStart = performance.now();
    const [moviesRes, seriesRes, reportsRes, requestsRes, messagesRes, usersRes, releasesMRes, releasesSRes,
      tmdb, warezEmbed, warezSite, embedMovies, googleDns] = await Promise.all([
      supabase.from('movies').select('id', { count: 'exact', head: true }),
      supabase.from('series').select('id', { count: 'exact', head: true }),
      supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('contact_messages').select('id', { count: 'exact', head: true }).eq('status', 'new'),
      supabase.from('user_roles').select('user_id', { count: 'exact', head: true }),
      supabase.from('movies').select('id', { count: 'exact', head: true }).eq('is_release', true),
      supabase.from('series').select('id', { count: 'exact', head: true }).eq('is_release', true),
      timedFetch('https://api.themoviedb.org/3/configuration?api_key=c3303b4812a831ae634e26763a65644e'),
      timedFetch('https://embed.warezcdn.com/', { mode: 'no-cors' }),
      timedFetch('https://warezcdn.site/', { mode: 'no-cors' }),
      timedFetch('https://embedmovies.cc/', { mode: 'no-cors' }),
      timedFetch('https://dns.google/resolve?name=pipocamax.com&type=A'),
    ]);
    const dbMs = Math.round(performance.now() - dbStart);

    const next: Stats = {
      movies: moviesRes.count ?? 0,
      series: seriesRes.count ?? 0,
      reports: reportsRes.count ?? 0,
      pendingRequests: requestsRes.count ?? 0,
      newMessages: messagesRes.count ?? 0,
      totalUsers: usersRes.count ?? 0,
      releases: (releasesMRes.count ?? 0) + (releasesSRes.count ?? 0),
    };

    const nextServices: ServiceCheck[] = [
      { key: 'db', label: 'Banco de Dados', online: !moviesRes.error, latencyMs: dbMs, icon: Database, description: 'Lovable Cloud / Postgres' },
      { key: 'tmdb', label: 'TMDB API', online: tmdb.ok, latencyMs: tmdb.ms, icon: Globe, description: 'Catálogo de metadados' },
      { key: 'warez_embed', label: 'WarezCDN (Embed)', online: warezEmbed.ok, latencyMs: warezEmbed.ms, icon: Server, description: 'Player principal' },
      { key: 'warez_site', label: 'WarezCDN (Lista)', online: warezSite.ok, latencyMs: warezSite.ms, icon: Server, description: 'Sincronização de catálogo' },
      { key: 'embed_movies', label: 'EmbedMovies', online: embedMovies.ok, latencyMs: embedMovies.ms, icon: Server, description: 'Player alternativo' },
      { key: 'dns', label: 'DNS / Internet', online: googleDns.ok, latencyMs: googleDns.ms, icon: Wifi, description: 'Resolução de DNS' },
    ];

    // Compare to previous and trigger alerts on transitions
    const prev = previousServicesRef.current;
    if (prev.length > 0) {
      for (const cur of nextServices) {
        const before = prev.find(p => p.key === cur.key);
        if (!before) continue;
        if (before.online && !cur.online) {
          toast.error(`⚠️ ${cur.label} está OFFLINE`, { duration: 8000 });
          if (soundEnabled) playAlertBeep();
        } else if (!before.online && cur.online) {
          toast.success(`✅ ${cur.label} voltou ao ar`);
        }
      }
    }
    previousServicesRef.current = nextServices;

    setStats(next);
    setServices(nextServices);
    setLastCheck(new Date());
    setLoading(false);
  }, [soundEnabled]);

  useEffect(() => {
    checkAll();
    const id = setInterval(checkAll, REFRESH_MS);
    return () => clearInterval(id);
  }, [checkAll]);

  if (loading && !stats) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>;
  if (!stats) return null;

  const cards = [
    { label: "Filmes", value: stats.movies, icon: Film, color: "text-primary" },
    { label: "Séries", value: stats.series, icon: Tv, color: "text-primary" },
    { label: "Lançamentos", value: stats.releases, icon: TrendingUp, color: "text-primary" },
    { label: "Usuários", value: stats.totalUsers, icon: Users, color: "text-primary" },
    { label: "Reports", value: stats.reports, icon: AlertTriangle, color: stats.reports > 0 ? "text-destructive" : "text-primary" },
    { label: "Pedidos", value: stats.pendingRequests, icon: Inbox, color: stats.pendingRequests > 0 ? "text-yellow-500" : "text-primary" },
    { label: "Mensagens", value: stats.newMessages, icon: MessageSquare, color: stats.newMessages > 0 ? "text-yellow-500" : "text-primary" },
  ];

  const anyDown = services.some(s => !s.online);
  const onlineCount = services.filter(s => s.online).length;
  const avgLatency = Math.round(
    services.filter(s => s.latencyMs !== null).reduce((a, s) => a + (s.latencyMs ?? 0), 0)
    / Math.max(1, services.filter(s => s.latencyMs !== null).length)
  );

  const formatUptime = () => {
    const ms = Date.now() - uptimeStart.getTime();
    const m = Math.floor(ms / 60000);
    const h = Math.floor(m / 60);
    const d = Math.floor(h / 24);
    if (d > 0) return `${d}d ${h % 24}h`;
    if (h > 0) return `${h}h ${m % 60}m`;
    return `${m}m`;
  };

  const latencyColor = (ms: number | null) => {
    if (ms === null) return "text-muted-foreground";
    if (ms < 300) return "text-green-500";
    if (ms < 800) return "text-yellow-500";
    return "text-destructive";
  };

  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {cards.map(card => (
          <div key={card.label} className="bg-card border border-border rounded-lg p-4 flex items-center gap-3">
            <div className={`p-2.5 rounded-lg bg-secondary ${card.color}`}>
              <card.icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xl font-bold text-foreground tabular-nums">{card.value}</p>
              <p className="text-[11px] text-muted-foreground truncate">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Health summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1 text-muted-foreground text-xs"><Activity className="h-3.5 w-3.5" /> Saúde geral</div>
          <p className={`text-lg font-bold ${anyDown ? 'text-destructive' : 'text-green-500'}`}>
            {onlineCount}/{services.length} OK
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1 text-muted-foreground text-xs"><Wifi className="h-3.5 w-3.5" /> Latência média</div>
          <p className={`text-lg font-bold ${latencyColor(avgLatency)}`}>{avgLatency}ms</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1 text-muted-foreground text-xs"><Clock className="h-3.5 w-3.5" /> Sessão admin</div>
          <p className="text-lg font-bold text-foreground">{formatUptime()}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1 text-muted-foreground text-xs"><RefreshCw className="h-3.5 w-3.5" /> Última checagem</div>
          <p className="text-sm font-semibold text-foreground">{lastCheck ? lastCheck.toLocaleTimeString("pt-BR") : "—"}</p>
        </div>
      </div>

      {/* Services list */}
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
          </div>
        </div>
        <div className="space-y-2">
          {services.map(svc => (
            <div key={svc.key} className="flex items-center justify-between py-2.5 px-3 rounded-md bg-secondary/30 hover:bg-secondary/60 transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <svc.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm text-foreground truncate">{svc.label}</p>
                  {svc.description && <p className="text-[10px] text-muted-foreground truncate">{svc.description}</p>}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {svc.latencyMs !== null && (
                  <span className={`text-[11px] font-mono tabular-nums ${latencyColor(svc.latencyMs)}`}>
                    {svc.latencyMs}ms
                  </span>
                )}
                {svc.online ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-green-500">
                    <CheckCircle className="h-3.5 w-3.5" /> Online
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-medium text-destructive">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
                    </span>
                    <XCircle className="h-3.5 w-3.5" /> Offline
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[11px] text-muted-foreground">
          Verificação automática a cada {REFRESH_MS / 1000}s. Quedas geram toast e beep sonoro no navegador.
        </p>
      </div>

      <button onClick={() => { setLoading(true); checkAll(); }} className="text-sm text-primary hover:underline inline-flex items-center gap-1">
        <RefreshCw className="h-3.5 w-3.5" /> Atualizar agora
      </button>
    </div>
  );
}
