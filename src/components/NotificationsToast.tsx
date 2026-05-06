import { useEffect, useState, useRef } from 'react';
import { X, Sparkles, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';

interface NotificationRow {
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

const READ_KEY = 'pipocamax-read-notifications';
const TOAST_SHOWN_KEY = 'pipocamax-toast-shown';
const POLL_MS = 60_000;
const DISPLAY_MS = 5000;

function getReadIds(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(READ_KEY) || '[]')); } catch { return new Set(); }
}
function saveReadIds(ids: Set<string>) {
  try { localStorage.setItem(READ_KEY, JSON.stringify([...ids].slice(-200))); } catch {}
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

function labelFor(type: string) {
  if (type === 'release') return 'Novo Lançamento';
  if (type === 'update') return 'Atualização';
  return 'Aviso';
}

export function NotificationsToast() {
  const [queue, setQueue] = useState<NotificationRow[]>([]);
  const [current, setCurrent] = useState<NotificationRow | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(20);
      if (cancelled || !data) return;
      const read = getReadIds();
      const shown = getToastShown();
      const fresh = (data as NotificationRow[]).filter(n => !read.has(n.id) && !shown.has(n.id));
      if (fresh.length) setQueue(q => [...fresh.reverse(), ...q]);
    };
    load();
    const id = setInterval(load, POLL_MS);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  useEffect(() => {
    if (current || queue.length === 0) return;
    const next = queue[0];
    setQueue(q => q.slice(1));
    setCurrent(next);
    const shown = getToastShown(); shown.add(next.id); saveToastShown(shown);
    // mark as read immediately so it never appears again, even across sessions
    const r = getReadIds(); r.add(next.id); saveReadIds(r);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCurrent(null), DISPLAY_MS);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [queue, current]);

  const dismiss = (markAsRead = false) => {
    if (current && markAsRead) {
      const r = getReadIds(); r.add(current.id); saveReadIds(r);
    }
    setCurrent(null);
  };

  return (
    <AnimatePresence>
      {current && (
        <motion.div
          key={current.id}
          initial={{ opacity: 0, x: 40, y: 20 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: 40, y: 20 }}
          transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          className="fixed bottom-4 right-4 z-[60] w-[340px] max-w-[calc(100vw-2rem)]"
        >
          <div className="bg-card border border-primary/40 shadow-2xl shadow-primary/20 rounded-xl overflow-hidden">
            <div className="flex">
              {current.image_url && (
                <img src={current.image_url} alt="" className="w-20 h-28 object-cover flex-shrink-0" />
              )}
              <div className="flex-1 p-3 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                    <Sparkles className="h-3 w-3" />
                    {labelFor(current.type)}
                  </span>
                  <button onClick={() => dismiss(true)} className="text-muted-foreground hover:text-foreground -mt-0.5">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="text-sm font-semibold text-foreground line-clamp-1 mt-1">{current.title}</p>
                {current.message && <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{current.message}</p>}
                {buildHref(current) && (
                  <Link
                    to={buildHref(current)!}
                    onClick={() => dismiss(true)}
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
  );
}
