import { useState, useEffect, useCallback } from "react";
import {
  Film, Tv, AlertTriangle, Inbox, MessageSquare, Loader2,
  Users, TrendingUp, RefreshCw, Sparkles, Radio, Clock,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Stats {
  movies: number;
  series: number;
  animes: number;
  channels: number;
  reports: number;
  pendingRequests: number;
  newMessages: number;
  totalUsers: number;
  releases: number;
}

const REFRESH_MS = 60_000;

export function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const loadAll = useCallback(async () => {
    const [
      moviesRes, seriesRes, animesRes, channelsRes,
      reportsRes, requestsRes, messagesRes, usersRes,
      releasesMRes, releasesSRes,
    ] = await Promise.all([
      supabase.from('movies').select('id', { count: 'exact', head: true }),
      supabase.from('series').select('id', { count: 'exact', head: true }).eq('is_anime', false),
      supabase.from('series').select('id', { count: 'exact', head: true }).eq('is_anime', true),
      supabase.from('tv_channels').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('contact_messages').select('id', { count: 'exact', head: true }).eq('status', 'new'),
      supabase.from('user_roles').select('user_id', { count: 'exact', head: true }),
      supabase.from('movies').select('id', { count: 'exact', head: true }).eq('is_release', true),
      supabase.from('series').select('id', { count: 'exact', head: true }).eq('is_release', true),
    ]);

    const next: Stats = {
      movies: moviesRes.count ?? 0,
      series: seriesRes.count ?? 0,
      animes: animesRes.count ?? 0,
      channels: channelsRes.count ?? 0,
      reports: reportsRes.count ?? 0,
      pendingRequests: requestsRes.count ?? 0,
      newMessages: messagesRes.count ?? 0,
      totalUsers: usersRes.count ?? 0,
      releases: (releasesMRes.count ?? 0) + (releasesSRes.count ?? 0),
    };

    setStats(next);
    setLastCheck(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAll();
    const id = setInterval(loadAll, REFRESH_MS);
    return () => clearInterval(id);
  }, [loadAll]);

  if (loading && !stats) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>;
  if (!stats) return null;

  const cards = [
    { label: "Filmes", value: stats.movies, icon: Film },
    { label: "Séries", value: stats.series, icon: Tv },
    { label: "Animes", value: stats.animes, icon: Sparkles },
    { label: "Canais TV", value: stats.channels, icon: Radio },
    { label: "Lançamentos", value: stats.releases, icon: TrendingUp },
    { label: "Usuários", value: stats.totalUsers, icon: Users },
    { label: "Reports", value: stats.reports, icon: AlertTriangle, alert: stats.reports > 0 },
    { label: "Pedidos", value: stats.pendingRequests, icon: Inbox, alert: stats.pendingRequests > 0 },
    { label: "Mensagens", value: stats.newMessages, icon: MessageSquare, alert: stats.newMessages > 0 },
  ];

  const totalContent = stats.movies + stats.series + stats.animes;

  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-3">
        {cards.map(card => (
          <div
            key={card.label}
            className={`bg-card border rounded-lg p-3 flex items-center gap-3 transition-colors ${
              card.alert ? 'border-destructive/50 bg-destructive/5' : 'border-border'
            }`}
          >
            <div className={`p-2 rounded-lg bg-secondary ${card.alert ? 'text-destructive' : 'text-primary'}`}>
              <card.icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold text-foreground tabular-nums leading-tight">{card.value}</p>
              <p className="text-[10px] text-muted-foreground truncate uppercase tracking-wider">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Insights row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1 text-muted-foreground text-xs">
            <Activity className="h-3.5 w-3.5" /> Acervo total
          </div>
          <p className="text-2xl font-bold text-foreground tabular-nums">{totalContent.toLocaleString('pt-BR')}</p>
          <p className="text-[10px] text-muted-foreground">títulos disponíveis</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1 text-muted-foreground text-xs">
            <PlusCircle className="h-3.5 w-3.5" /> Hoje
          </div>
          <p className="text-2xl font-bold text-foreground tabular-nums">+{stats.addedToday}</p>
          <p className="text-[10px] text-muted-foreground">títulos adicionados</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1 text-muted-foreground text-xs">
            <Calendar className="h-3.5 w-3.5" /> Últimos 7 dias
          </div>
          <p className="text-2xl font-bold text-foreground tabular-nums">+{stats.addedWeek}</p>
          <p className="text-[10px] text-muted-foreground">títulos adicionados</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1 text-muted-foreground text-xs">
            <Clock className="h-3.5 w-3.5" /> Atualização
          </div>
          <p className="text-base font-semibold text-foreground">
            {lastCheck ? lastCheck.toLocaleTimeString("pt-BR") : "—"}
          </p>
          <button onClick={loadAll} className="text-[10px] text-primary hover:underline inline-flex items-center gap-1 mt-0.5">
            <RefreshCw className="h-3 w-3" /> Atualizar
          </button>
        </div>
      </div>

      {/* Recent activity */}
      <div className="bg-card border border-border rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-primary" />
            <h3 className="font-display text-lg text-foreground tracking-wider">ÚLTIMOS ADICIONADOS</h3>
          </div>
          <span className="text-[11px] text-muted-foreground">Atualiza a cada {REFRESH_MS / 1000}s</span>
        </div>
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Nenhum conteúdo recente.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {recent.map(item => (
              <Link
                key={`${item.type}-${item.id}`}
                to={contentUrl(item.type, item.id, item.title)}
                target="_blank"
                className="flex items-center gap-3 p-2 rounded-md bg-secondary/30 hover:bg-secondary/60 transition-colors group"
              >
                <img
                  src={item.image_url || '/placeholder.svg'}
                  alt={item.title}
                  className="w-10 h-14 object-cover rounded shrink-0 bg-secondary"
                  loading="lazy"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground truncate group-hover:text-primary transition-colors">{item.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                      {item.type === 'movie' ? 'Filme' : item.is_anime ? 'Anime' : 'Série'}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{timeAgo(item.created_at)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
