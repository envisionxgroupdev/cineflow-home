import { useEffect, useState, useCallback, useRef } from 'react';
import { Bell, X, Sparkles, Tv, Info, ExternalLink, Ticket as TicketIcon, CheckCircle2, XCircle, Inbox, Search, MessageCircle, Lock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface NotificationRow {
  id: string;
  title: string;
  message: string | null;
  type: 'release' | 'update' | 'info' | string;
  content_type: 'movie' | 'series' | null;
  content_slug: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
}

interface TicketNotif {
  id: string; // ticket id
  title: string;
  message: string;
  created_at: string;
  unread: boolean;
}

interface RequestNotif {
  id: string;
  title: string;
  status: 'fulfilled' | 'rejected';
  content_title: string;
  created_at: string;
  unread: boolean;
}

const READ_KEY = 'pipocamax-read-notifications';
const REQ_READ_KEY = 'pipocamax-read-requests';
const TOAST_SHOWN_KEY = 'pipocamax-toast-shown';
const POLL_MS = 60_000;

function getReadIds(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(READ_KEY) || '[]')); } catch { return new Set(); }
}
function saveReadIds(ids: Set<string>) {
  try { localStorage.setItem(READ_KEY, JSON.stringify([...ids].slice(-200))); } catch {}
}
function getReqReadKeys(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(REQ_READ_KEY) || '[]')); } catch { return new Set(); }
}
function saveReqReadKeys(ids: Set<string>) {
  try { localStorage.setItem(REQ_READ_KEY, JSON.stringify([...ids].slice(-200))); } catch {}
}
function getToastShown(): Set<string> {
  try { return new Set(JSON.parse(sessionStorage.getItem(TOAST_SHOWN_KEY) || '[]')); } catch { return new Set(); }
}
function saveToastShown(ids: Set<string>) {
  try { sessionStorage.setItem(TOAST_SHOWN_KEY, JSON.stringify([...ids].slice(-50))); } catch {}
}

function buildHref(n: NotificationRow): string | null {
  if (!n.content_slug || !n.content_type) return null;
  return n.content_type === 'movie' ? `/filme/${n.content_slug}` : `/serie/${n.content_slug}`;
}

function iconFor(type: string) {
  if (type === 'release') return Sparkles;
  if (type === 'update') return Tv;
  return Info;
}


export function NotificationsBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [tickets, setTickets] = useState<TicketNotif[]>([]);
  const [requests, setRequests] = useState<RequestNotif[]>([]);
  const [reqReadKeys, setReqReadKeys] = useState<Set<string>>(() => getReqReadKeys());
  const [readIds, setReadIds] = useState<Set<string>>(() => getReadIds());
  const [open, setOpen] = useState(false);
  const [popup, setPopup] = useState<NotificationRow | null>(null);
  const popupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) setItems(data as NotificationRow[]);
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  // Map raw report status -> bell notification meta
  const statusMeta = (status: string): { title: string; icon: typeof Inbox; toastFn: typeof toast.success } | null => {
    switch (status) {
      case 'open': return { title: 'Ticket recebido', icon: Inbox, toastFn: toast.info ?? toast };
      case 'in_review':
      case 'analyzing': return { title: 'Ticket em análise', icon: Search, toastFn: toast.info ?? toast };
      case 'replied': return { title: 'Nova resposta no seu ticket', icon: MessageCircle, toastFn: toast.info ?? toast };
      case 'resolved': return { title: 'Ticket resolvido', icon: CheckCircle2, toastFn: toast.success };
      case 'dismissed': return { title: 'Ticket recusado', icon: XCircle, toastFn: toast.error };
      case 'closed': return { title: 'Ticket fechado', icon: Lock, toastFn: toast.info ?? toast };
      default: return null;
    }
  };

  // Ticket notifications (only for logged-in users)
  const loadTickets = useCallback(async () => {
    if (!user) { setTickets([]); return; }
    const { data } = await supabase
      .from('reports')
      .select('id,content_title,status,unread_for_user,last_message_at,updated_at')
      .eq('user_id', user.id)
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .limit(15);
    if (!data) return;
    const mapped: TicketNotif[] = data
      .filter((t: any) => t.unread_for_user || ['resolved', 'closed', 'dismissed'].includes(t.status))
      .map((t: any) => {
        const meta = statusMeta(t.status);
        return {
          id: t.id,
          title: t.unread_for_user ? 'Nova resposta da equipe' : (meta?.title ?? `Status: ${t.status}`),
          message: t.content_title,
          created_at: t.last_message_at || t.updated_at,
          unread: !!t.unread_for_user,
        };
      });
    setTickets(mapped);
  }, [user]);

  // Tracks ticket statuses we've already seen so we don't re-toast on mount/refresh
  const ticketStatusRef = useRef<Map<string, string>>(new Map());
  const ticketStatusReady = useRef(false);

  // Seed the status map once tickets load, so subsequent realtime changes are real transitions
  useEffect(() => {
    if (!user) { ticketStatusReady.current = false; ticketStatusRef.current.clear(); return; }
    supabase
      .from('reports')
      .select('id,status')
      .eq('user_id', user.id)
      .then(({ data }) => {
        ticketStatusRef.current.clear();
        (data || []).forEach((r: any) => ticketStatusRef.current.set(r.id, r.status));
        ticketStatusReady.current = true;
      });
  }, [user]);

  useEffect(() => {
    loadTickets();
    if (!user) return;
    const channelName = `bell-tickets-${user.id}-${Math.random().toString(36).slice(2, 8)}`;
    const ch = supabase
      .channel(channelName)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'ticket_messages' },
        () => { loadTickets(); })
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'reports', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const newRow: any = payload.new;
          const oldRow: any = payload.old;
          const prevStatus = ticketStatusRef.current.get(newRow.id) ?? oldRow?.status;
          if (ticketStatusReady.current && prevStatus && prevStatus !== newRow.status) {
            const meta = statusMeta(newRow.status);
            if (meta) {
              meta.toastFn(meta.title, {
                description: newRow.content_title || 'Seu ticket foi atualizado.',
                icon: undefined,
                duration: 10000,
                action: {
                  label: 'Abrir ticket',
                  onClick: () => navigate(`/perfil?ticket=${newRow.id}`),
                },
              });
            }
          }
          ticketStatusRef.current.set(newRow.id, newRow.status);
          loadTickets();
        })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, loadTickets]);

  // Request notifications (status changed from pending to fulfilled/rejected)
  const loadRequests = useCallback(async () => {
    if (!user) { setRequests([]); return; }
    const { data } = await supabase
      .from('requests')
      .select('id,title,status,updated_at')
      .eq('user_id', user.id)
      .in('status', ['fulfilled', 'rejected'])
      .order('updated_at', { ascending: false })
      .limit(15);
    if (!data) return;
    const keys = getReqReadKeys();
    const mapped: RequestNotif[] = (data as any[]).map((r) => {
      const key = `${r.id}:${r.status}`;
      return {
        id: r.id,
        title: r.status === 'fulfilled' ? 'Pedido adicionado ao site!' : 'Pedido recusado',
        status: r.status,
        content_title: r.title,
        created_at: r.updated_at,
        unread: !keys.has(key),
      };
    });
    setRequests(mapped);
  }, [user]);

  useEffect(() => {
    loadRequests();
    if (!user) return;
    const channelName = `bell-requests-${user.id}-${Math.random().toString(36).slice(2, 8)}`;
    const ch = supabase
      .channel(channelName)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'requests', filter: `user_id=eq.${user.id}` },
        () => { loadRequests(); })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, loadRequests]);

  // Show toast popup once per session for the newest unread notification
  useEffect(() => {
    if (items.length === 0) return;
    const toastShown = getToastShown();
    const candidate = items.find(n => !readIds.has(n.id) && !toastShown.has(n.id));
    if (candidate) {
      setPopup(candidate);
      toastShown.add(candidate.id);
      saveToastShown(toastShown);
      if (popupTimer.current) clearTimeout(popupTimer.current);
      popupTimer.current = setTimeout(() => setPopup(null), 8000);
    }
    return () => { if (popupTimer.current) clearTimeout(popupTimer.current); };
  }, [items, readIds]);

  const ticketUnreadCount = tickets.filter(t => t.unread).length;
  const newsUnreadCount = items.filter(n => !readIds.has(n.id)).length;
  const requestUnreadCount = requests.filter(r => r.unread).length;
  const unreadCount = newsUnreadCount + ticketUnreadCount + requestUnreadCount;

  const markRead = (id: string) => {
    const next = new Set(readIds); next.add(id); setReadIds(next); saveReadIds(next);
  };
  const markRequestRead = (r: RequestNotif) => {
    const next = new Set(reqReadKeys); next.add(`${r.id}:${r.status}`);
    setReqReadKeys(next); saveReqReadKeys(next);
  };
  const markAllRead = async () => {
    const next = new Set(readIds); items.forEach(n => next.add(n.id));
    setReadIds(next); saveReadIds(next);
    if (requestUnreadCount > 0) {
      const nextReq = new Set(reqReadKeys);
      requests.forEach(r => nextReq.add(`${r.id}:${r.status}`));
      setReqReadKeys(nextReq); saveReqReadKeys(nextReq);
    }
    if (user && ticketUnreadCount > 0) {
      await supabase.from('reports').update({ unread_for_user: false }).eq('user_id', user.id).eq('unread_for_user', true);
      loadTickets();
    }
  };

  const openTicket = async (t: TicketNotif) => {
    setOpen(false);
    navigate('/perfil');
    if (t.unread) {
      await supabase.from('reports').update({ unread_for_user: false }).eq('id', t.id);
      loadTickets();
    }
  };

  const openRequest = (r: RequestNotif) => {
    setOpen(false);
    if (r.unread) markRequestRead(r);
    navigate('/perfil');
  };

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setOpen(o => !o)}
          aria-label="Notificações"
          className="relative h-9 w-9 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center ring-2 ring-background">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        <AnimatePresence>
          {open && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-[340px] max-w-[calc(100vw-2rem)] bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <h3 className="font-display text-sm tracking-wider text-foreground">NOTIFICAÇÕES</h3>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs text-primary hover:underline">Marcar todas</button>
                  )}
                </div>
                <div className="max-h-[60vh] overflow-y-auto">
                  {user && tickets.length > 0 && (
                    <>
                      <div className="px-4 py-2 bg-secondary/40 border-b border-border/50">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Seus tickets</span>
                      </div>
                      {tickets.map(t => (
                        <button
                          key={`t-${t.id}`}
                          onClick={() => openTicket(t)}
                          className={`w-full text-left flex gap-3 px-4 py-3 border-b border-border/50 transition-colors hover:bg-secondary/50 ${t.unread ? 'bg-primary/5' : ''}`}
                        >
                          <div className={`flex-shrink-0 h-9 w-9 rounded-lg flex items-center justify-center ${t.unread ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
                            <TicketIcon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-semibold text-foreground line-clamp-1">{t.title}</p>
                              {t.unread && <span className="flex-shrink-0 h-2 w-2 rounded-full bg-primary mt-1.5" />}
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{t.message}</p>
                            <p className="text-[10px] text-muted-foreground/70 mt-1">
                              {new Date(t.created_at).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              <span className="ml-2 inline-flex items-center gap-0.5 text-primary"><ExternalLink className="h-2.5 w-2.5" /> Abrir</span>
                            </p>
                          </div>
                        </button>
                      ))}
                    </>
                  )}


                  {user && requests.length > 0 && (
                    <>
                      <div className="px-4 py-2 bg-secondary/40 border-b border-border/50">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Seus pedidos</span>
                      </div>
                      {requests.map(r => {
                        const Icon = r.status === 'fulfilled' ? CheckCircle2 : XCircle;
                        const accent = r.status === 'fulfilled' ? 'bg-emerald-500 text-white' : 'bg-destructive text-destructive-foreground';
                        return (
                          <button
                            key={`r-${r.id}-${r.status}`}
                            onClick={() => openRequest(r)}
                            className={`w-full text-left flex gap-3 px-4 py-3 border-b border-border/50 transition-colors hover:bg-secondary/50 ${r.unread ? 'bg-primary/5' : ''}`}
                          >
                            <div className={`flex-shrink-0 h-9 w-9 rounded-lg flex items-center justify-center ${r.unread ? accent : 'bg-secondary text-muted-foreground'}`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-sm font-semibold text-foreground line-clamp-1">{r.title}</p>
                                {r.unread && <span className="flex-shrink-0 h-2 w-2 rounded-full bg-primary mt-1.5" />}
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{r.content_title}</p>
                              <p className="text-[10px] text-muted-foreground/70 mt-1">
                                {new Date(r.created_at).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                <span className="ml-2 inline-flex items-center gap-0.5 text-primary"><ExternalLink className="h-2.5 w-2.5" /> Ver</span>
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </>
                  )}

                  {items.length > 0 && (tickets.length > 0 || requests.length > 0) && (
                    <div className="px-4 py-2 bg-secondary/40 border-b border-border/50">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Novidades</span>
                    </div>
                  )}

                  {items.length === 0 && tickets.length === 0 && requests.length === 0 ? (
                    <p className="p-6 text-center text-sm text-muted-foreground">Nenhuma notificação ainda.</p>
                  ) : items.map(n => {
                    const Icon = iconFor(n.type);
                    const href = buildHref(n);
                    const unread = !readIds.has(n.id);
                    const Wrapper: any = href ? Link : 'div';
                    const wrapperProps: any = href ? { to: href } : {};
                    return (
                      <Wrapper
                        key={n.id}
                        {...wrapperProps}
                        onClick={() => { markRead(n.id); if (href) setOpen(false); }}
                        className={`flex gap-3 px-4 py-3 border-b border-border/50 last:border-b-0 transition-colors ${href ? 'cursor-pointer hover:bg-secondary/50' : ''} ${unread ? 'bg-primary/5' : ''}`}
                      >
                        <div className={`flex-shrink-0 h-9 w-9 rounded-lg flex items-center justify-center ${unread ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-semibold text-foreground line-clamp-1">{n.title}</p>
                            {unread && <span className="flex-shrink-0 h-2 w-2 rounded-full bg-primary mt-1.5" />}
                          </div>
                          {n.message && <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.message}</p>}
                          <p className="text-[10px] text-muted-foreground/70 mt-1">
                            {new Date(n.created_at).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            {href && <span className="ml-2 inline-flex items-center gap-0.5 text-primary"><ExternalLink className="h-2.5 w-2.5" /> Ver</span>}
                          </p>
                        </div>
                      </Wrapper>
                    );
                  })}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {popup && (
          <motion.div
            initial={{ opacity: 0, x: 40, y: 20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: 40, y: 20 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            className="fixed bottom-4 right-4 z-[60] w-[340px] max-w-[calc(100vw-2rem)]"
          >
            <div className="bg-card border border-primary/40 shadow-2xl shadow-primary/20 rounded-xl overflow-hidden">
              <div className="flex">
                {popup.image_url && (
                  <img src={popup.image_url} alt="" className="w-20 h-28 object-cover flex-shrink-0" />
                )}
                <div className="flex-1 p-3 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                      <Sparkles className="h-3 w-3" />
                      {popup.type === 'release' ? 'Novo Lançamento' : popup.type === 'update' ? 'Atualização' : 'Aviso'}
                    </span>
                    <button onClick={() => setPopup(null)} className="text-muted-foreground hover:text-foreground -mt-0.5">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="text-sm font-semibold text-foreground line-clamp-1 mt-1">{popup.title}</p>
                  {popup.message && <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{popup.message}</p>}
                  {buildHref(popup) && (
                    <Link
                      to={buildHref(popup)!}
                      onClick={() => { markRead(popup.id); setPopup(null); }}
                      className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                    >
                      Assistir agora <ExternalLink className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
