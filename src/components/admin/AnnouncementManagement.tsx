import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Save, Megaphone, Info, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { SITE_SETTINGS_UPDATED_EVENT } from '@/lib/siteSettingsEvents';
import { SITE_ANNOUNCEMENT_KEYS } from '@/components/SiteAnnouncementBanner';

type BannerType = 'info' | 'warning' | 'success' | 'announcement';

const TYPES: { value: BannerType; label: string; icon: typeof Info; preview: string }[] = [
  { value: 'announcement', label: 'Aviso', icon: Megaphone, preview: 'bg-foreground text-background' },
  { value: 'info', label: 'Informação', icon: Info, preview: 'bg-primary text-primary-foreground' },
  { value: 'warning', label: 'Atenção', icon: AlertTriangle, preview: 'bg-amber-500 text-black' },
  { value: 'success', label: 'Sucesso', icon: CheckCircle2, preview: 'bg-emerald-500 text-black' },
];

export function AnnouncementManagement() {
  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<BannerType>('announcement');
  const [link, setLink] = useState('');
  const [linkLabel, setLinkLabel] = useState('Saiba mais');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('*')
        .in('key', Object.values(SITE_ANNOUNCEMENT_KEYS));
      if (data) {
        for (const row of data as { key: string; value: string }[]) {
          if (row.key === SITE_ANNOUNCEMENT_KEYS.enabled) setEnabled(row.value === 'true');
          if (row.key === SITE_ANNOUNCEMENT_KEYS.message) setMessage(row.value || '');
          if (row.key === SITE_ANNOUNCEMENT_KEYS.type && row.value) setType(row.value as BannerType);
          if (row.key === SITE_ANNOUNCEMENT_KEYS.link) setLink(row.value || '');
          if (row.key === SITE_ANNOUNCEMENT_KEYS.linkLabel && row.value) setLinkLabel(row.value);
        }
      }
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    if (enabled && !message.trim()) {
      toast.error('Escreva uma mensagem antes de ativar o aviso.');
      return;
    }
    setSaving(true);
    const rows = [
      { key: SITE_ANNOUNCEMENT_KEYS.enabled, value: enabled ? 'true' : 'false' },
      { key: SITE_ANNOUNCEMENT_KEYS.message, value: message },
      { key: SITE_ANNOUNCEMENT_KEYS.type, value: type },
      { key: SITE_ANNOUNCEMENT_KEYS.link, value: link },
      { key: SITE_ANNOUNCEMENT_KEYS.linkLabel, value: linkLabel },
      { key: SITE_ANNOUNCEMENT_KEYS.version, value: String(Date.now()) },
    ];
    const { error } = await supabase.from('site_settings').upsert(rows as any, { onConflict: 'key' });
    if (error) toast.error('Erro ao salvar: ' + error.message);
    else {
      toast.success('Aviso atualizado — todos os visitantes verão o banner novamente.');
      window.dispatchEvent(new Event(SITE_SETTINGS_UPDATED_EVENT));
    }
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>;

  const currentStyle = TYPES.find(t => t.value === type) ?? TYPES[0];
  const PreviewIcon = currentStyle.icon;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${enabled ? 'bg-primary/15 text-primary' : 'bg-secondary text-muted-foreground'}`}>
              <Megaphone className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">Banner de aviso no topo</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Aparece em todas as páginas do site, acima do conteúdo. Use para anúncios importantes — novidades, instabilidades, promoções.</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input type="checkbox" className="sr-only peer" checked={enabled} onChange={e => setEnabled(e.target.checked)} />
            <div className="w-11 h-6 bg-secondary border border-border rounded-full peer peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-background after:rounded-full after:h-5 after:w-5 after:transition-transform peer-checked:after:translate-x-5"></div>
          </label>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Estilo</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {TYPES.map(t => {
              const Icon = t.icon;
              const active = t.value === type;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${active ? 'border-primary bg-primary/10 text-foreground' : 'border-border bg-secondary text-muted-foreground hover:text-foreground'}`}
                >
                  <Icon className="h-4 w-4" />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Mensagem</label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={3}
            maxLength={300}
            placeholder="Ex.: Novos episódios disponíveis! Confira a aba Novidades."
            className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
          />
          <p className="text-[11px] text-muted-foreground mt-1">{message.length}/300 caracteres</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Link (opcional)</label>
            <input
              value={link}
              onChange={e => setLink(e.target.value)}
              placeholder="/novidades ou https://..."
              className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Texto do link</label>
            <input
              value={linkLabel}
              onChange={e => setLinkLabel(e.target.value)}
              placeholder="Saiba mais"
              className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar e publicar
        </button>
        <p className="text-[11px] text-muted-foreground">Ao salvar, o aviso aparece imediatamente para todos os visitantes — inclusive quem já havia fechado a versão anterior.</p>
      </div>

      {/* Preview */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Pré-visualização</p>
        <div className={`${currentStyle.preview} relative w-full rounded-lg overflow-hidden`}>
          <div className="flex items-center gap-3 px-4 py-2.5 pr-12">
            <PreviewIcon className="h-4 w-4 shrink-0" />
            <p className="text-sm font-medium leading-snug flex-1">
              {message || 'Sua mensagem aparecerá aqui.'}
              {link && (
                <span className="ml-2 underline underline-offset-2 font-semibold">
                  {linkLabel || 'Saiba mais'} →
                </span>
              )}
            </p>
          </div>
          <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:bg-black/10">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
