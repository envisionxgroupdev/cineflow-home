import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { TicketChat } from '@/components/TicketChat';
import type { Report, TicketStatus } from '@/types/database';
import {
  LifeBuoy, Plus, Loader2, MessageSquare, X, Ticket as TicketIcon,
  Search, Filter, Send,
} from 'lucide-react';

const CATEGORIES = [
  { value: 'Conta / Login', label: 'Conta / Login' },
  { value: 'Problema com player', label: 'Problema com player' },
  { value: 'Conteúdo indisponível', label: 'Conteúdo indisponível' },
  { value: 'Erro no site', label: 'Erro no site' },
  { value: 'Sugestão / Feedback', label: 'Sugestão / Feedback' },
  { value: 'Outro', label: 'Outro' },
];

type Filter = 'all' | 'open' | 'replied' | 'closed';

function TicketStatusBadge({ status }: { status: TicketStatus }) {
  const map: Record<string, { label: string; cls: string }> = {
    open: { label: 'Aberto', cls: 'bg-yellow-500/15 text-yellow-500 border-yellow-500/30' },
    pending: { label: 'Aberto', cls: 'bg-yellow-500/15 text-yellow-500 border-yellow-500/30' },
    in_progress: { label: 'Em andamento', cls: 'bg-blue-500/15 text-blue-500 border-blue-500/30' },
    resolved: { label: 'Resolvido', cls: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30' },
    closed: { label: 'Fechado', cls: 'bg-muted text-muted-foreground border-border' },
    dismissed: { label: 'Recusado', cls: 'bg-destructive/15 text-destructive border-destructive/30' },
  };
  const m = map[status] || map.open;
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${m.cls}`}>{m.label}</span>;
}

const Support = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [tickets, setTickets] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [openTicket, setOpenTicket] = useState<Report | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');

  // New ticket form
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0].value);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadTickets = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('user_id', user.id)
      .order('last_message_at', { ascending: false });
    if (error) toast.error(error.message);
    else setTickets((data || []) as Report[]);
    setLoading(false);
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/login'); return; }
    loadTickets();
    // eslint-disable-next-line
  }, [user?.id, authLoading]);

  // Realtime: refresh list on any change to user's tickets
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`support-${user.id}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'reports', filter: `user_id=eq.${user.id}` },
        () => loadTickets())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line
  }, [user?.id]);

  // Deep link ?ticket=ID
  useEffect(() => {
    const id = searchParams.get('ticket');
    if (!id || tickets.length === 0) return;
    const found = tickets.find(t => t.id === id);
    if (found) {
      setOpenTicket(found);
      const next = new URLSearchParams(searchParams);
      next.delete('ticket');
      setSearchParams(next, { replace: true });
    }
  }, [tickets, searchParams, setSearchParams]);

  const submitNew = async () => {
    if (!user) return;
    if (!subject.trim() || subject.trim().length < 4) { toast.error('Informe um assunto (mín 4 caracteres).'); return; }
    if (!message.trim() || message.trim().length < 10) { toast.error('Descreva o problema (mín 10 caracteres).'); return; }
    setSubmitting(true);
    const { data, error } = await supabase.from('reports').insert({
      user_id: user.id,
      content_id: 'support',
      content_type: 'support',
      content_title: subject.trim().slice(0, 120),
      reason: category,
      details: message.trim().slice(0, 4000),
      reporter_email: user.email ?? null,
      status: 'open',
    }).select('*').maybeSingle();
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Ticket aberto com sucesso!');
    setSubject(''); setMessage(''); setCategory(CATEGORIES[0].value);
    setShowNew(false);
    if (data) {
      setTickets(prev => [data as Report, ...prev]);
      setOpenTicket(data as Report);
    } else {
      loadTickets();
    }
  };

  const normalized = (s: TicketStatus): Filter => {
    if (['pending', 'open', 'in_progress'].includes(s)) return s === 'in_progress' ? 'replied' : 'open';
    if (['closed', 'resolved', 'dismissed'].includes(s)) return 'closed';
    return 'open';
  };

  const filtered = tickets
    .filter(t => filter === 'all' ? true : (filter === 'replied' ? (t.unread_for_user || normalized(t.status) === 'replied') : normalized(t.status) === filter))
    .filter(t => !query.trim() ? true : `${t.content_title} ${t.reason} ${t.details ?? ''}`.toLowerCase().includes(query.toLowerCase()));

  const counts = {
    all: tickets.length,
    open: tickets.filter(t => normalized(t.status) === 'open').length,
    replied: tickets.filter(t => t.unread_for_user).length,
    closed: tickets.filter(t => normalized(t.status) === 'closed').length,
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Suporte — PipocaMax</title>
        <meta name="description" content="Abra um ticket de suporte e acompanhe todas as suas solicitações no PipocaMax." />
      </Helmet>
      <Navbar />

      <main className="pt-24 pb-12 container mx-auto px-4 max-w-4xl">
        {/* Hero */}
        <header className="mb-6">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary">
                <LifeBuoy className="h-5 w-5" />
              </div>
              <div>
                <h1 className="font-display text-2xl sm:text-3xl tracking-wide text-foreground">Central de Suporte</h1>
                <p className="text-sm text-muted-foreground">
                  Abra um chamado e acompanhe todas as suas solicitações em um só lugar.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowNew(true)}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider hover:bg-primary/90 hover:shadow-[0_0_20px_hsl(var(--primary)/0.6)] transition-all"
            >
              <Plus className="h-4 w-4" /> Novo ticket
            </button>
          </div>
        </header>

        {/* Filters */}
        <div className="bg-card border border-border rounded-xl p-3 mb-4 flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
          <div className="flex items-center gap-2 flex-1 min-w-0 px-3 py-2 bg-secondary/50 border border-border rounded-lg">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar por assunto, motivo ou texto..."
              className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {([
              { k: 'all', label: 'Todos' },
              { k: 'open', label: 'Abertos' },
              { k: 'replied', label: 'Respondidos' },
              { k: 'closed', label: 'Encerrados' },
            ] as { k: Filter; label: string }[]).map(({ k, label }) => (
              <button
                key={k}
                onClick={() => setFilter(k)}
                className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-colors border ${
                  filter === k
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-secondary border-border text-muted-foreground hover:text-foreground hover:border-primary/40'
                }`}
              >
                {label} <span className="opacity-70">({counts[k]})</span>
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <section className="bg-card border border-border rounded-xl p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-3 px-1">
            <TicketIcon className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">Meus tickets</h2>
            <span className="ml-auto text-[11px] text-muted-foreground">{tickets.length} no total</span>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 text-primary animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center">
              <LifeBuoy className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-4">
                {tickets.length === 0
                  ? 'Você ainda não abriu nenhum ticket.'
                  : 'Nenhum ticket encontrado com esses filtros.'}
              </p>
              {tickets.length === 0 && (
                <button
                  onClick={() => setShowNew(true)}
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors"
                >
                  <Plus className="h-4 w-4" /> Abrir meu primeiro ticket
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-2">
              {filtered.map(t => (
                <button
                  key={t.id}
                  onClick={() => setOpenTicket(t)}
                  className="text-left bg-secondary/40 border border-border hover:border-primary/50 hover:bg-secondary/60 rounded-lg p-3 transition-colors group"
                >
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <MessageSquare className="h-3.5 w-3.5 text-primary shrink-0" />
                    <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">{t.content_title}</p>
                    <TicketStatusBadge status={t.status} />
                    {t.unread_for_user && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase bg-primary text-primary-foreground animate-pulse">
                        Nova resposta
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">
                    <span className="text-foreground/70">{t.reason}</span>
                    {' · atualizado em '}
                    {new Date(t.last_message_at || t.created_at).toLocaleString('pt-BR')}
                  </p>
                </button>
              ))}
            </div>
          )}
        </section>

        <p className="text-[11px] text-muted-foreground text-center mt-6">
          Também pode usar o botão <span className="text-primary font-semibold">Reportar</span> nas páginas de filmes e séries para abrir um ticket com o conteúdo já preenchido.
        </p>
      </main>

      {/* New ticket modal */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-stretch sm:items-center justify-center bg-black/70 sm:p-4" onClick={() => setShowNew(false)}>
          <div className="bg-card border border-border sm:rounded-xl w-full sm:max-w-lg max-h-[100dvh] sm:max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
              <div className="flex items-center gap-2">
                <Plus className="h-4 w-4 text-primary" />
                <h3 className="font-display text-base text-foreground">Abrir novo ticket</h3>
              </div>
              <button onClick={() => setShowNew(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 space-y-3 overflow-y-auto">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Assunto</label>
                <input
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  maxLength={120}
                  placeholder="Resuma seu problema em poucas palavras"
                  className="mt-1 w-full px-3 py-2.5 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Filter className="h-3 w-3" /> Categoria
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="mt-1 w-full px-3 py-2.5 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Descrição</label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  maxLength={4000}
                  rows={6}
                  placeholder="Conte com detalhes o que está acontecendo. Inclua passos, navegador, dispositivo, etc."
                  className="mt-1 w-full px-3 py-2.5 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                />
                <p className="text-[10px] text-muted-foreground mt-1 text-right">{message.length}/4000</p>
              </div>
            </div>
            <div className="p-4 border-t border-border flex gap-2 shrink-0">
              <button
                onClick={() => setShowNew(false)}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={submitNew}
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Enviar ticket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ticket chat modal */}
      {openTicket && (
        <div className="fixed inset-0 z-50 flex items-stretch sm:items-center justify-center bg-black/70 sm:p-4" onClick={() => { setOpenTicket(null); loadTickets(); }}>
          <div className="bg-card border border-border sm:rounded-xl w-full sm:max-w-2xl h-[100dvh] sm:h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <TicketIcon className="h-4 w-4 text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{openTicket.content_title}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{openTicket.reason}</p>
                </div>
              </div>
              <button onClick={() => { setOpenTicket(null); loadTickets(); }} className="text-muted-foreground hover:text-foreground shrink-0">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-2 sm:p-4 flex-1 min-h-0 overflow-hidden flex flex-col">
              <TicketChat ticket={openTicket} />
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Support;
