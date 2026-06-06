import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Wrench, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { SITE_SETTINGS_UPDATED_EVENT } from '@/lib/siteSettingsEvents';

export function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading: authLoading } = useAuth();
  const [enabled, setEnabled] = useState(false);
  const [title, setTitle] = useState('Site em manutenção');
  const [message, setMessage] = useState('Estamos realizando uma atualização. Voltaremos em breve!');
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('*')
        .in('key', ['maintenance_enabled', 'maintenance_title', 'maintenance_message']);
      if (!active) return;
      if (data) {
        for (const row of data as { key: string; value: string }[]) {
          if (row.key === 'maintenance_enabled') setEnabled(row.value === 'true');
          if (row.key === 'maintenance_title' && row.value) setTitle(row.value);
          if (row.key === 'maintenance_message' && row.value) setMessage(row.value);
        }
      }
      setChecked(true);
    };
    void load();
    const handler = () => void load();
    window.addEventListener(SITE_SETTINGS_UPDATED_EVENT, handler);
    return () => { active = false; window.removeEventListener(SITE_SETTINGS_UPDATED_EVENT, handler); };
  }, []);

  // Always allow admin routes & login to render so admin can disable
  const path = typeof window !== 'undefined' ? window.location.pathname : '/';
  const adminPath = path.startsWith('/admin') || path.startsWith('/login');

  if (!checked || authLoading) return <>{children}</>;
  if (!enabled || isAdmin || adminPath) return <>{children}</>;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
      <div className="max-w-md w-full text-center">
        <div className="h-20 w-20 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-6 animate-pulse">
          <Wrench className="h-9 w-9 text-primary" />
        </div>
        <h1 className="font-display text-3xl sm:text-4xl text-foreground mb-3">{title}</h1>
        <p className="text-sm text-muted-foreground whitespace-pre-line mb-8">{message}</p>
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider border border-border text-muted-foreground hover:text-primary hover:border-primary/40 px-4 py-2 rounded-md transition-colors"
        >
          <Shield className="h-3.5 w-3.5" /> Acesso administrativo
        </Link>
      </div>
    </div>
  );
}
