import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Save, Loader2, Code2, FileCode, Eye, EyeOff } from 'lucide-react';

interface CodeSetting {
  key: string;
  value: string;
}

const CODE_FIELDS = [
  {
    key: 'head_scripts',
    label: 'Scripts no <head>',
    icon: FileCode,
    placeholder: '<script>...</script> ou <meta .../>',
    help: 'Qualquer código para o <head> (pixels, meta tags, verificações, analytics, etc).',
  },
  {
    key: 'body_scripts',
    label: 'Scripts no <body>',
    icon: Code2,
    placeholder: '<script>...</script> ou <noscript>...</noscript>',
    help: 'Qualquer código para o final do <body> (pixels, chatbots, etc).',
  },
  {
    key: 'footer_scripts',
    label: 'Código no Footer',
    icon: Code2,
    placeholder: 'HTML ou scripts para o footer',
    help: 'Código que será injetado dentro do footer do site (antes do copyright).',
  },
];

export function CodeManagement() {
  const [codes, setCodes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tableExists, setTableExists] = useState(true);
  const [previewing, setPreviewing] = useState<Record<string, boolean>>({});

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

  const togglePreview = (key: string) => {
    setPreviewing(prev => ({ ...prev, [key]: !prev[key] }));
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

-- Public can READ settings (needed to inject scripts on every page load)
CREATE POLICY "Public can read settings"
  ON public.site_settings FOR SELECT
  USING (true);

-- Only admins can INSERT/UPDATE/DELETE
CREATE POLICY "Admins can manage settings"
  ON public.site_settings FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));`}
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
          <h3 className="font-display text-xl text-foreground">Códigos Personalizados</h3>
          <p className="text-sm text-muted-foreground mt-1">Insira scripts, meta tags e códigos de rastreamento nas áreas do site.</p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar
        </button>
      </div>

      <div className="grid gap-4">
        {CODE_FIELDS.map(field => {
          const value = codes[field.key] || '';
          const isPreview = previewing[field.key] && value;

          return (
            <div key={field.key} className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <field.icon className="h-4 w-4 text-primary" />
                  <label className="text-sm font-semibold text-foreground">{field.label}</label>
                </div>
                {value && (
                  <button
                    onClick={() => togglePreview(field.key)}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    {isPreview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    {isPreview ? 'Editar' : 'Preview'}
                  </button>
                )}
              </div>
              <p className="text-xs text-muted-foreground mb-3">{field.help}</p>

              {isPreview ? (
                <div className="bg-secondary border border-border rounded-lg p-4 overflow-x-auto">
                  <pre className="text-xs text-foreground font-mono whitespace-pre-wrap break-all">{value}</pre>
                </div>
              ) : (
                <textarea
                  value={value}
                  onChange={e => setCodes({ ...codes, [field.key]: e.target.value })}
                  placeholder={field.placeholder}
                  rows={4}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono resize-y"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
