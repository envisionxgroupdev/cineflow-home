import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Ban } from 'lucide-react';

/**
 * Blocks the entire app when the current user is banned.
 * Also subscribes to user_roles changes so banning takes effect live.
 */
export function BannedGate({ children }: { children: React.ReactNode }) {
  const { user, isBanned, signOut } = useAuth();
  const [liveBanned, setLiveBanned] = useState(false);

  useEffect(() => {
    if (!user) { setLiveBanned(false); return; }
    const channel = supabase
      .channel(`user-roles-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'user_roles', filter: `user_id=eq.${user.id}` },
        (payload: any) => {
          if (payload?.new?.role === 'banned') setLiveBanned(true);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const banned = isBanned || liveBanned;

  if (banned) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-card border border-destructive/40 rounded-2xl p-8 text-center">
          <div className="mx-auto h-14 w-14 rounded-full bg-destructive/10 border border-destructive/40 flex items-center justify-center mb-4">
            <Ban className="h-7 w-7 text-destructive" />
          </div>
          <h1 className="font-display text-2xl text-foreground mb-2">Conta bloqueada</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Sua conta foi banida e não pode mais acessar o PipocaMax. Se você acredita
            que isso é um engano, entre em contato com o suporte.
          </p>
          <button
            onClick={async () => { await signOut(); window.location.href = '/login'; }}
            className="w-full bg-destructive text-destructive-foreground px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-destructive/90 transition-colors"
          >
            Sair
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
