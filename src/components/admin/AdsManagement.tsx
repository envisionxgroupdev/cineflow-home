import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Save, Eye, EyeOff, Monitor, Film, Tv } from "lucide-react";
import { SITE_SETTINGS_UPDATED_EVENT } from "@/lib/siteSettingsEvents";

interface AdField {
  key: string;
  label: string;
  page: string;
  position: string;
}

const AD_FIELDS: AdField[] = [
  { key: "ad_home_top", label: "Topo", page: "Home", position: "Topo da página" },
  { key: "ad_home_middle", label: "Meio", page: "Home", position: "Entre o conteúdo" },
  { key: "ad_home_bottom", label: "Rodapé", page: "Home", position: "Antes do footer" },
  { key: "ad_movies_top", label: "Topo", page: "Filmes", position: "Topo da página" },
  { key: "ad_movies_middle", label: "Meio", page: "Filmes", position: "Entre o conteúdo" },
  { key: "ad_movies_bottom", label: "Rodapé", page: "Filmes", position: "Antes do footer" },
  { key: "ad_series_top", label: "Topo", page: "Séries", position: "Topo da página" },
  { key: "ad_series_middle", label: "Meio", page: "Séries", position: "Entre o conteúdo" },
  { key: "ad_series_bottom", label: "Rodapé", page: "Séries", position: "Antes do footer" },
];

const PAGE_GROUPS = [
  { name: "Home", icon: Monitor, fields: AD_FIELDS.filter(f => f.page === "Home") },
  { name: "Filmes", icon: Film, fields: AD_FIELDS.filter(f => f.page === "Filmes") },
  { name: "Séries", icon: Tv, fields: AD_FIELDS.filter(f => f.page === "Séries") },
];

export function AdsManagement() {
  const [ads, setAds] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState<string | null>(null);

  useEffect(() => { loadAds(); }, []);

  const loadAds = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("site_settings").select("*");
    if (data) {
      const map: Record<string, string> = {};
      data.forEach((row: { key: string; value: string }) => { map[row.key] = row.value; });
      setAds(map);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const field of AD_FIELDS) {
        const value = ads[field.key] || "";
        const { error } = await supabase
          .from("site_settings")
          .upsert({ key: field.key, value }, { onConflict: "key" });
        if (error) throw error;
      }

      window.dispatchEvent(new Event(SITE_SETTINGS_UPDATED_EVENT));
      toast.success("Anúncios salvos com sucesso!");
    } catch (err: any) {
      toast.error("Erro ao salvar: " + err.message);
    }
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display text-foreground">Gerenciar Anúncios</h2>
          <p className="text-sm text-muted-foreground mt-1">Cole o código HTML/JS dos anúncios para cada posição do site</p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar
        </button>
      </div>

      {PAGE_GROUPS.map(group => (
        <div key={group.name} className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-border bg-secondary/50">
            <group.icon className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-foreground text-sm">{group.name}</h3>
          </div>
          <div className="p-5 space-y-5">
            {group.fields.map(field => (
              <div key={field.key}>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-foreground">{field.label} <span className="text-muted-foreground font-normal">— {field.position}</span></label>
                  <button onClick={() => setPreviewing(previewing === field.key ? null : field.key)}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    {previewing === field.key ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    {previewing === field.key ? "Ocultar" : "Preview"}
                  </button>
                </div>
                <textarea
                  value={ads[field.key] || ""}
                  onChange={e => setAds({ ...ads, [field.key]: e.target.value })}
                  placeholder={`Cole aqui o código do anúncio para ${field.page} — ${field.position}`}
                  rows={3}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y"
                />
                {previewing === field.key && ads[field.key] && (
                  <div className="mt-2 p-3 bg-secondary/50 border border-border rounded-lg">
                    <p className="text-xs text-muted-foreground mb-2">Preview do código:</p>
                    <div className="bg-background p-3 rounded border border-border overflow-auto max-h-40">
                      <pre className="text-xs text-foreground whitespace-pre-wrap break-all">{ads[field.key]}</pre>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
