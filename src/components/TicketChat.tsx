import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Loader2, Send, ShieldCheck, User as UserIcon } from 'lucide-react';
import type { TicketMessage, Report } from '@/types/database';

interface Props {
  ticket: Report;
  /** If true, viewer is the admin (sends is_admin=true) */
  asAdmin?: boolean;
  onSent?: () => void;
}

export function TicketChat({ ticket, asAdmin = false, onSent }: Props) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('ticket_messages')
      .select('*')
      .eq('ticket_id', ticket.id)
      .order('created_at', { ascending: true });
    if (error) toast.error(error.message);
    else setMessages((data || []) as TicketMessage[]);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [ticket.id]);

  // mark as read for the viewer
  useEffect(() => {
    const patch = asAdmin ? { unread_for_admin: false } : { unread_for_user: false };
    supabase.from('reports').update(patch).eq('id', ticket.id).then(() => {});
    // eslint-disable-next-line
  }, [ticket.id, asAdmin]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // realtime subscription
  useEffect(() => {
    const ch = supabase
      .channel(`ticket-${ticket.id}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'ticket_messages', filter: `ticket_id=eq.${ticket.id}` },
        (payload) => {
          setMessages(prev => prev.some(m => m.id === (payload.new as any).id) ? prev : [...prev, payload.new as TicketMessage]);
        })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [ticket.id]);

  const send = async () => {
    const text = body.trim();
    if (!text || !user) return;
    if (text.length > 2000) { toast.error('Mensagem muito longa (máx 2000)'); return; }
    setSending(true);
    const { error } = await supabase.from('ticket_messages').insert({
      ticket_id: ticket.id,
      sender_id: user.id,
      is_admin: asAdmin,
      body: text,
    });
    setSending(false);
    if (error) { toast.error(error.message); return; }
    setBody('');
    onSent?.();
  };

  return (
    <div className="flex flex-col h-full min-h-[300px]">
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-3 bg-secondary/30 rounded-lg border border-border">
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 text-primary animate-spin" /></div>
        ) : messages.length === 0 ? (
          <p className="text-xs text-center text-muted-foreground py-8">Nenhuma mensagem ainda.</p>
        ) : messages.map(m => {
          const mine = m.sender_id === user?.id;
          return (
            <div key={m.id} className={`flex gap-2 ${mine ? 'justify-end' : 'justify-start'}`}>
              {!mine && (
                <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${m.is_admin ? 'bg-primary/20 text-primary border border-primary/40' : 'bg-secondary text-muted-foreground border border-border'}`}>
                  {m.is_admin ? <ShieldCheck className="h-3.5 w-3.5" /> : <UserIcon className="h-3.5 w-3.5" />}
                </div>
              )}
              <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
                mine
                  ? 'bg-primary text-primary-foreground rounded-br-sm'
                  : m.is_admin
                    ? 'bg-primary/10 border border-primary/30 text-foreground rounded-bl-sm'
                    : 'bg-card border border-border text-foreground rounded-bl-sm'
              }`}>
                {m.is_admin && !mine && <p className="text-[10px] font-bold uppercase text-primary mb-0.5">Staff</p>}
                <p className="whitespace-pre-wrap break-words">{m.body}</p>
                <p className={`text-[10px] mt-1 opacity-70`}>{new Date(m.created_at).toLocaleString('pt-BR')}</p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {ticket.status !== 'closed' ? (
        <div className="mt-3 flex gap-2">
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Escreva uma mensagem..."
            rows={2}
            maxLength={2000}
            onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) send(); }}
            className="flex-1 px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
          />
          <button
            onClick={send}
            disabled={sending || !body.trim()}
            className="self-end flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      ) : (
        <p className="mt-3 text-xs text-center text-muted-foreground py-2 border border-dashed border-border rounded-lg">
          Este ticket foi fechado. Nenhuma nova mensagem pode ser enviada.
        </p>
      )}
    </div>
  );
}
