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

      {/* Update bar */}
      <div className="flex items-center justify-end gap-3 text-xs text-muted-foreground">
        <Clock className="h-3.5 w-3.5" />
        <span>Última atualização: {lastCheck ? lastCheck.toLocaleTimeString("pt-BR") : "—"}</span>
        <button onClick={loadAll} className="text-primary hover:underline inline-flex items-center gap-1">
          <RefreshCw className="h-3 w-3" /> Atualizar
        </button>
      </div>
    </div>
  );
}
