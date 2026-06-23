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
  const [query, setQuery] = useState('');



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

  const baseFiltered = filter === 'all' ? tickets : tickets.filter(t => normalized(t.status) === filter);
  const q = query.trim().toLowerCase();
  const filtered = q
    ? baseFiltered.filter(t => {
        const a = t.user_id ? authors[t.user_id] : null;
        return (
          t.content_title?.toLowerCase().includes(q) ||
          t.reason?.toLowerCase().includes(q) ||
          a?.display_name?.toLowerCase().includes(q) ||
          a?.email?.toLowerCase().includes(q) ||
          t.reporter_email?.toLowerCase().includes(q)
        );
      })
    : baseFiltered;

  const counts = {
    all: tickets.length,
    open: tickets.filter(t => normalized(t.status) === 'open').length,
    in_progress: tickets.filter(t => normalized(t.status) === 'in_progress').length,
    resolved: tickets.filter(t => normalized(t.status) === 'resolved').length,
    closed: tickets.filter(t => normalized(t.status) === 'closed').length,
  };
  const unread = tickets.filter(t => t.unread_for_admin).length;

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>;

  const FILTER_META: Record<Filter, { label: string; cls: string; dot: string }> = {
    all:         { label: 'Todos',        cls: 'border-border',           dot: 'bg-foreground/40' },
    open:        { label: 'Abertos',      cls: 'border-yellow-500/40',    dot: 'bg-yellow-500' },
    in_progress: { label: 'Em andamento', cls: 'border-blue-500/40',      dot: 'bg-blue-500' },
    resolved:    { label: 'Resolvidos',   cls: 'border-green-500/40',     dot: 'bg-green-500' },
    closed:      { label: 'Fechados',     cls: 'border-border',           dot: 'bg-muted-foreground' },
  };

  return (
    <div className="space-y-5">
      {/* Stats header */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {(['open', 'in_progress', 'resolved', 'closed', 'all'] as Filter[]).map(f => {
          const meta = FILTER_META[f];
          const active = filter === f;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-left rounded-xl border p-3 transition-all ${
                active
                  ? `bg-primary/10 ${meta.cls} ring-2 ring-primary/30 shadow-[0_4px_20px_-8px_hsl(var(--primary)/0.5)]`
                  : `bg-card ${meta.cls} hover:bg-secondary/40`
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{meta.label}</span>
              </div>
              <p className="font-display text-2xl text-foreground mt-1 leading-none">{counts[f]}</p>
              {f === 'open' && unread > 0 && (
                <p className="text-[10px] font-bold text-destructive mt-1">{unread} sem leitura</p>
              )}
            </button>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar por título, motivo, e-mail ou usuário..."
            className="w-full pl-9 pr-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <button onClick={load} className="px-3 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg border border-border bg-card hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-colors">
          Atualizar
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-xl p-12 text-center">
          <Inbox className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Nenhum ticket neste filtro.</p>
        </div>
      ) : (
        <ul className="grid gap-2">
          {filtered.map(t => {
            const author = t.user_id ? authors[t.user_id] : null;
            const name = author?.display_name || author?.email?.split('@')[0] || t.reporter_email || 'Usuário';
            const initial = (name || '?')[0].toUpperCase();
            const isOpen = normalized(t.status) === 'open';
            return (
              <li key={t.id}>
                <button
                  onClick={() => setViewing(t)}
                  className={`w-full text-left bg-card border rounded-xl p-3 sm:p-4 transition-all hover:border-primary/50 hover:bg-secondary/30 group ${
                    t.unread_for_admin ? 'border-destructive/40 shadow-[0_0_0_1px_hsl(var(--destructive)/0.2)]' : 'border-border'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 border ${
                      isOpen ? 'bg-yellow-500/15 text-yellow-500 border-yellow-500/30' : 'bg-secondary text-muted-foreground border-border'
                    }`}>
                      {initial}
                    </div>

                    {/* Body */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold text-foreground truncate">{t.content_title}</h3>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${STATUS_COLOR[t.status]}`}>
                          {STATUS_LABEL[t.status]}
                        </span>
                        {t.unread_for_admin && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-destructive text-destructive-foreground animate-pulse">
                            Novo
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1 flex-wrap">
                        <span className="inline-flex items-center gap-1 text-foreground/80">
                          <Mail className="h-3 w-3" /> {name}
                        </span>
                        <span className="text-border">•</span>
                        <span className="text-destructive font-medium">{t.reason}</span>
                        <span className="text-border">•</span>
                        <span>{t.content_type === 'movie' ? 'Filme' : 'Série'}</span>
                      </div>
                    </div>

                    {/* Time + chevron */}
                    <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {new Date(t.last_message_at || t.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
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
