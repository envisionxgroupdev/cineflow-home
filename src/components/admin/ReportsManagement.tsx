import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, AlertTriangle, X, Trash2, MessageSquare, CheckCircle2, Circle, Lock, Play, Search, Inbox, ChevronRight, Mail } from 'lucide-react';
import type { Report, TicketStatus } from '@/types/database';
import { TicketChat } from '@/components/TicketChat';


const STATUS_LABEL: Record<TicketStatus, string> = {
  open: 'Aberto',
  in_progress: 'Em andamento',
  resolved: 'Resolvido',
  closed: 'Fechado',
  pending: 'Aberto',
  dismissed: 'Fechado',
};

const STATUS_COLOR: Record<TicketStatus, string> = {
  open: 'bg-yellow-500/15 text-yellow-500',
  pending: 'bg-yellow-500/15 text-yellow-500',
  in_progress: 'bg-blue-500/15 text-blue-500',
  resolved: 'bg-green-500/15 text-green-500',
  closed: 'bg-muted text-muted-foreground',
  dismissed: 'bg-muted text-muted-foreground',
};

type Filter = 'all' | 'open' | 'in_progress' | 'resolved' | 'closed';

export function ReportsManagement() {
  const [tickets, setTickets] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('open');
  const [viewing, setViewing] = useState<Report | null>(null);
  const [authors, setAuthors] = useState<Record<string, { email: string | null; display_name: string | null }>>({});

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('last_message_at', { ascending: false });
    if (error) { toast.error(error.message); setLoading(false); return; }
    const list = (data || []) as Report[];
    setTickets(list);

    const ids = Array.from(new Set(list.map(t => t.user_id).filter(Boolean))) as string[];
    if (ids.length) {
      const { data: profs } = await supabase.from('profiles').select('id,email,display_name').in('id', ids);
      const map: Record<string, any> = {};
      (profs || []).forEach((p: any) => { map[p.id] = { email: p.email, display_name: p.display_name }; });
      setAuthors(map);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const setStatus = async (id: string, status: TicketStatus) => {
    const patch: any = { status };
    if (status === 'resolved' || status === 'closed') patch.resolved_at = new Date().toISOString();
    if (status === 'open' || status === 'in_progress') patch.resolved_at = null;
    const { error } = await supabase.from('reports').update(patch).eq('id', id);
    if (error) { toast.error(error.message); return; }
    setTickets(ts => ts.map(t => t.id === id ? { ...t, ...patch } : t));
    if (viewing?.id === id) setViewing({ ...viewing, ...patch });
    toast.success('Status atualizado');
  };

  const remove = async (id: string) => {
    if (!confirm('Excluir este ticket permanentemente?')) return;
    const { error } = await supabase.from('reports').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    setTickets(ts => ts.filter(t => t.id !== id));
    if (viewing?.id === id) setViewing(null);
    toast.success('Ticket excluído');
  };

  // Normalize legacy statuses for filtering
  const normalized = (s: TicketStatus): Filter => {
    if (s === 'pending') return 'open';
    if (s === 'dismissed') return 'closed';
    return s as Filter;
  };

  const filtered = filter === 'all' ? tickets : tickets.filter(t => normalized(t.status) === filter);

  const counts = {
    all: tickets.length,
    open: tickets.filter(t => normalized(t.status) === 'open').length,
    in_progress: tickets.filter(t => normalized(t.status) === 'in_progress').length,
    resolved: tickets.filter(t => normalized(t.status) === 'resolved').length,
    closed: tickets.filter(t => normalized(t.status) === 'closed').length,
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {(['open', 'in_progress', 'resolved', 'closed', 'all'] as Filter[]).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filter === f ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}>
            {f === 'all' ? 'Todos' : STATUS_LABEL[f as TicketStatus]} ({counts[f]})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-12 text-center text-sm text-muted-foreground">
          Nenhum ticket neste filtro.
        </div>
      ) : (
        <div className="grid gap-2">
          {filtered.map(t => {
            const author = t.user_id ? authors[t.user_id] : null;
            return (
              <button
                key={t.id}
                onClick={() => setViewing(t)}
                className="text-left bg-card border border-border hover:border-primary/40 rounded-lg p-4 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <MessageSquare className="h-4 w-4 text-primary shrink-0" />
                      <h3 className="text-sm font-semibold text-foreground truncate">{t.content_title}</h3>
                      <span className="text-[10px] text-muted-foreground">· {t.content_type === 'movie' ? 'Filme' : 'Série'}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${STATUS_COLOR[t.status]}`}>
                        {STATUS_LABEL[t.status]}
                      </span>
                      {t.unread_for_admin && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-destructive text-destructive-foreground">
                          Novo
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      <span className="text-foreground/80">{author?.display_name || author?.email || t.reporter_email || 'Usuário'}</span>
                      {' · '}
                      <span className="text-destructive">{t.reason}</span>
                    </p>
                  </div>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                    {new Date(t.last_message_at || t.created_at).toLocaleString('pt-BR')}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {viewing && (
        <div className="fixed inset-0 z-50 flex items-stretch sm:items-center justify-center bg-black/70 sm:p-4" onClick={() => { setViewing(null); load(); }}>
          <div className="bg-card border border-border sm:rounded-xl w-full sm:max-w-5xl h-[100dvh] sm:h-[92vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
                <div className="min-w-0">
                  <h3 className="font-display text-base text-foreground truncate">{viewing.content_title}</h3>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {viewing.content_type === 'movie' ? 'Filme' : 'Série'} · {viewing.reason} ·{' '}
                    <span className={`px-1.5 py-0.5 rounded ${STATUS_COLOR[viewing.status]}`}>{STATUS_LABEL[viewing.status]}</span>
                  </p>
                </div>
              </div>
              <button onClick={() => { setViewing(null); load(); }} className="text-muted-foreground hover:text-foreground shrink-0">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-2 sm:p-4 flex-1 min-h-0 overflow-hidden flex flex-col">
              <TicketChat ticket={viewing} asAdmin onSent={() => {
                setTickets(ts => ts.map(t => t.id === viewing.id ? { ...t, unread_for_user: true, last_message_at: new Date().toISOString() } : t));
              }} />
            </div>

            <div className="p-3 border-t border-border flex gap-2 flex-wrap shrink-0">
              <button onClick={() => setStatus(viewing.id, 'in_progress')}
                className="text-xs px-3 py-1.5 rounded bg-blue-500/15 text-blue-500 hover:bg-blue-500/25 transition-colors flex items-center gap-1">
                <Play className="h-3 w-3" /> Em andamento
              </button>
              <button onClick={() => setStatus(viewing.id, 'resolved')}
                className="text-xs px-3 py-1.5 rounded bg-green-500/15 text-green-500 hover:bg-green-500/25 transition-colors flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Resolvido
              </button>
              <button onClick={() => setStatus(viewing.id, 'closed')}
                className="text-xs px-3 py-1.5 rounded bg-muted text-muted-foreground hover:bg-muted/80 transition-colors flex items-center gap-1">
                <Lock className="h-3 w-3" /> Fechar
              </button>
              <button onClick={() => setStatus(viewing.id, 'open')}
                className="text-xs px-3 py-1.5 rounded bg-yellow-500/15 text-yellow-500 hover:bg-yellow-500/25 transition-colors flex items-center gap-1">
                <Circle className="h-3 w-3" /> Reabrir
              </button>
              <button onClick={() => remove(viewing.id)}
                className="ml-auto text-xs px-3 py-1.5 rounded bg-destructive/15 text-destructive hover:bg-destructive/25 transition-colors flex items-center gap-1">
                <Trash2 className="h-3 w-3" /> Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
