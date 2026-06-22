import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const STATUS_LABEL: Record<string, string> = {
  open: 'aberto',
  in_progress: 'em andamento',
  resolved: 'resolvido',
  closed: 'fechado',
  pending: 'aberto',
  dismissed: 'fechado',
};

/**
 * Listens (in realtime) for admin replies and status changes on the current
 * user's tickets, and surfaces a toast with a CTA to the profile page.
 * Mounted once globally.
 */
export function TicketNotifier() {
  const { user } = useAuth();
  const navigate = useNavigate();
  // remember previous status per ticket to detect transitions
  const statusRef = useRef<Record<string, string>>({});

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    // Prime cache with current ticket statuses so we don't toast on first load
    (async () => {
      const { data } = await supabase
        .from('reports')
        .select('id,status')
        .eq('user_id', user.id);
      if (cancelled) return;
      const map: Record<string, string> = {};
      (data || []).forEach((r: any) => { map[r.id] = r.status; });
      statusRef.current = map;
    })();

    const channel = supabase
      .channel(`ticket-notify-${user.id}`)
      // Admin reply on one of my tickets
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'ticket_messages' },
        async (payload) => {
          const msg: any = payload.new;
          if (!msg?.is_admin) return;
          if (msg.sender_id === user.id) return;
          // Confirm the ticket belongs to this user (RLS already enforces SELECT)
          const { data: t } = await supabase
            .from('reports')
            .select('id,content_title,user_id')
            .eq('id', msg.ticket_id)
            .maybeSingle();
          if (!t || t.user_id !== user.id) return;
          toast.message('Nova resposta da equipe', {
            description: `Ticket: ${t.content_title}`,
            action: { label: 'Abrir', onClick: () => navigate('/perfil') },
          });
        })
      // Status change on one of my tickets
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'reports', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const next: any = payload.new;
          const prev = statusRef.current[next.id];
          statusRef.current[next.id] = next.status;
          if (!prev || prev === next.status) return;
          toast.message('Status do ticket atualizado', {
            description: `${next.content_title}: ${STATUS_LABEL[next.status] ?? next.status}`,
            action: { label: 'Ver', onClick: () => navigate('/perfil') },
          });
        })
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [user?.id, navigate]);

  return null;
}
