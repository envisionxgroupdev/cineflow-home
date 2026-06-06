import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Save, Wrench, AlertTriangle } from 'lucide-react';
import { SITE_SETTINGS_UPDATED_EVENT } from '@/lib/siteSettingsEvents';

const KEYS = {
  enabled: 'maintenance_enabled',
  title: 'maintenance_title',
  message: 'maintenance_message',
};

export function MaintenanceManagement() {
  const [enabled, setEnabled] = useState(false);
  const [title, setTitle] = useState('Site em manutenção');
  const [message, setMessage] = useState('Estamos realizando uma atualização. Voltaremos em breve!');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('site_settings').select('*').in('key', Object.values(KEYS));
      if (data) {
        for (const row of data as { key: string; value: string }[]) {
          if (row.key === KEYS.enabled) setEnabled(row.value === 'true');
          if (row.key === KEYS.title && row.value) setTitle(row.value);
          if (row.key === KEYS.message && row.value) setMessage(row.value);
        }
      }
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    const rows = [
      { key: KEYS.enabled, value: enabled ? 'true' : 'false' },
      { key: KEYS.title, value: title },
      { key: KEYS.message, value: message },
    ];
    const { error } = await supabase.from('site_settings').upsert(rows as any, { onConflict: 'key' });
    if (error) toast.error('Erro ao salvar: ' + error.message);
    else {
      toast.success('Configurações salvas');
      window.dispatchEvent(new Event(SITE_SETTINGS_UPDATED_EVENT));
    }
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${enabled ? 'bg-destructive/15 text-destructive' : 'bg-primary/10 text-primary'}`}>
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">Modo manutenção</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Quando ativado, o site mostrará a página de manutenção para todos os visitantes (admins continuam acessando normalmente).</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input type="checkbox" className="sr-only peer" checked={enabled} onChange={e => setEnabled(e.target.checked)} />
            <div className="w-11 h-6 bg-secondary border border-border rounded-full peer peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-background after:rounded-full after:h-5 after:w-5 after:transition-transform peer-checked:after:translate-x-5"></div>
          </label>
        </div>

        {enabled && (
          <div className="mt-4 flex items-start gap-2 bg-destructive/10 border border-destructive/30 text-destructive text-xs rounded-lg p-3">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>Manutenção ativa — visitantes verão a tela de manutenção até você desativar.</span>
          </div>
        )}
      </div>

      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Título</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Mensagem</label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
          />
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar configurações
        </button>
      </div>

      {/* Preview */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Pré-visualização</p>
        <div className="bg-background border border-border rounded-xl p-8 text-center">
          <div className="h-14 w-14 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-4">
            <Wrench className="h-6 w-6 text-primary" />
          </div>
          <h3 className="font-display text-2xl text-foreground mb-2">{title}</h3>
          <p className="text-sm text-muted-foreground whitespace-pre-line">{message}</p>
        </div>
      </div>
    </div>
  );
}
