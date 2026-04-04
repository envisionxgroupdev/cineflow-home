import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Save, Loader2, Code2, Search, BarChart3, FileCode } from 'lucide-react';

interface CodeSetting {
  key: string;
  value: string;
}

const CODE_FIELDS = [
  {
    key: 'google_analytics',
    label: 'Google Analytics (GA4)',
    icon: BarChart3,
    placeholder: 'G-XXXXXXXXXX',
    help: 'Cole apenas o ID de medição (ex: G-XXXXXXXXXX). O script será injetado automaticamente no <head>.',
  },
  {
    key: 'google_search_console',
    label: 'Google Search Console',
    icon: Search,
    placeholder: 'Cole a meta tag completa ou apenas o content="..."',
    help: 'Cole o código de verificação do Search Console. Será adicionado como meta tag no <head>.',
  },
  {
    key: 'head_scripts',
    label: 'Scripts no <head>',
    icon: FileCode,
    placeholder: '<script>...</script> ou <meta .../>',
    help: 'Qualquer código extra para o <head> (pixels, meta tags, etc). Será injetado no topo de todas as páginas.',
    multiline: true,
  },
  {
    key: 'body_scripts',
    label: 'Scripts no <body>',
    icon: Code2,
    placeholder: '<script>...</script> ou <noscript>...</noscript>',
    help: 'Qualquer código para o final do <body> (pixels, chatbots, etc).',
    multiline: true,
  },
];

export function CodeManagement() {
  const [codes, setCodes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tableExists, setTableExists] = useState(true);

  useEffect(() => { loadCodes(); }, []);

  const loadCodes = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('site_settings').select('*');
    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        setTableExists(false);
      }
      setLoading(false);
      return;
    }
    const map: Record<string, string> = {};
    (data as CodeSetting[])?.forEach(row => { map[row.key] = row.value; });
    setCodes(map);
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const field of CODE_FIELDS) {
        const value = codes[field.key] || '';
        const { data: existing } = await supabase
          .from('site_settings')
          .select('key')
          .eq('key', field.key)
          .maybeSingle();

        if (existing) {
          await supabase.from('site_settings').update({ value }).eq('key', field.key);
        } else if (value) {
          await supabase.from('site_settings').insert({ key: field.key, value });
        }
      }
      toast.success('Códigos salvos com sucesso!');
    } catch {
      toast.error('Erro ao salvar códigos');
    }
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>;

  if (!tableExists) {
    return (
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="font-display text-lg text-foreground mb-4">⚠️ Tabela não encontrada</h3>
        <p className="text-sm text-muted-foreground mb-4">Execute o seguinte SQL no seu Supabase para criar a tabela:</p>
        <pre className="bg-secondary rounded-lg p-4 text-xs text-foreground overflow-x-auto whitespace-pre-wrap">
{`CREATE TABLE public.site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage settings"
  ON public.site_settings FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);`}
        </pre>
        <button onClick={loadCodes} className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
          Verificar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-xl text-foreground">Códigos de Integração</h3>
          <p className="text-sm text-muted-foreground mt-1">Configure Google Analytics, Search Console e outros scripts.</p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar
        </button>
      </div>

      <div className="grid gap-4">
        {CODE_FIELDS.map(field => (
          <div key={field.key} className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <field.icon className="h-4 w-4 text-primary" />
              <label className="text-sm font-semibold text-foreground">{field.label}</label>
            </div>
            <p className="text-xs text-muted-foreground mb-3">{field.help}</p>
            {'multiline' in field && field.multiline ? (
              <textarea
                value={codes[field.key] || ''}
                onChange={e => setCodes({ ...codes, [field.key]: e.target.value })}
                placeholder={field.placeholder}
                rows={4}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono resize-y"
              />
            ) : (
              <input
                type="text"
                value={codes[field.key] || ''}
                onChange={e => setCodes({ ...codes, [field.key]: e.target.value })}
                placeholder={field.placeholder}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
