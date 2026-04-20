import { useState, useEffect } from "react";
import { Film, Tv, AlertTriangle, Database, Globe, CheckCircle, XCircle, Loader2, Inbox, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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

export function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAll();
  }, []);

  async function checkAll() {
    setLoading(true);
    const [moviesRes, seriesRes, reportsRes, requestsRes, messagesRes, tmdbRes, warezRes] = await Promise.all([
      supabase.from('movies').select('id', { count: 'exact', head: true }),
      supabase.from('series').select('id', { count: 'exact', head: true }),
      supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('contact_messages').select('id', { count: 'exact', head: true }).eq('status', 'new'),
      fetch('https://api.themoviedb.org/3/configuration?api_key=c3303b4812a831ae634e26763a65644e').then(r => r.ok).catch(() => false),
      fetch('https://embed.warezcdn.com/').then(r => r.ok).catch(() => false),
    ]);

    setStats({
      movies: moviesRes.count ?? 0,
      series: seriesRes.count ?? 0,
      reports: reportsRes.count ?? 0,
      pendingRequests: requestsRes.count ?? 0,
      newMessages: messagesRes.count ?? 0,
      dbConnected: !moviesRes.error,
      tmdbOnline: tmdbRes as boolean,
      warezOnline: warezRes as boolean,
    });
    setLoading(false);
  }

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>;
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
        <h3 className="font-display text-lg text-foreground mb-4">STATUS DOS SERVIÇOS</h3>
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
                  <XCircle className="h-4 w-4" /> Offline
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <button onClick={checkAll} className="text-sm text-primary hover:underline">Atualizar status</button>
    </div>
  );
}
