import { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, Loader2, Bell, Sparkles, Tv, Info, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { slugify } from '@/lib/utils';
import type { NotificationRow } from '@/components/NotificationsBell';
import type { Movie, Series } from '@/types/database';

type ContentLite = { id: string; title: string; image_url: string | null; type: 'movie' | 'series' };

export function NotificationsManagement() {
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // form
  const [type, setType] = useState<'release' | 'update' | 'info'>('release');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [contentSearch, setContentSearch] = useState('');
  const [contentResults, setContentResults] = useState<ContentLite[]>([]);
  const [selected, setSelected] = useState<ContentLite | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('notifications').select('*').order('created_at', { ascending: false });
    if (data) setItems(data as NotificationRow[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // search content (movies + series)
  useEffect(() => {
    const q = contentSearch.trim();
    if (q.length < 2) { setContentResults([]); return; }
    const t = setTimeout(async () => {
      const [m, s] = await Promise.all([
        supabase.from('movies').select('id,title,image_url').ilike('title', `%${q}%`).limit(5),
        supabase.from('series').select('id,title,image_url').ilike('title', `%${q}%`).limit(5),
      ]);
      const merged: ContentLite[] = [
        ...((m.data as Movie[] | null) || []).map(r => ({ id: r.id, title: r.title, image_url: r.image_url, type: 'movie' as const })),
        ...((s.data as Series[] | null) || []).map(r => ({ id: r.id, title: r.title, image_url: r.image_url, type: 'series' as const })),
      ];
      setContentResults(merged);
    }, 300);
    return () => clearTimeout(t);
  }, [contentSearch]);

  const reset = () => {
    setTitle(''); setMessage(''); setSelected(null); setContentSearch(''); setContentResults([]); setType('release');
  };

  const handleCreate = async () => {
    if (!title.trim()) { toast.error('Adicione um título'); return; }
    setCreating(true);
    const slug = selected ? `assistir-${slugify(selected.title)}-online-gratis` : null;
    const { error } = await supabase.from('notifications').insert({
      title: title.trim(),
      message: message.trim() || null,
      type,
      content_type: selected?.type || null,
      content_slug: slug,
      image_url: selected?.image_url || null,
      is_active: true,
    });
    if (error) toast.error('Erro: ' + error.message);
    else { toast.success('Notificação publicada!'); reset(); load(); }
    setCreating(false);
  };

  const toggleActive = async (n: NotificationRow) => {
    const { error } = await supabase.from('notifications').update({ is_active: !n.is_active }).eq('id', n.id);
    if (error) toast.error(error.message); else load();
  };

  const remove = async (id: string) => {
    if (!window.confirm('Excluir esta notificação?')) return;
    const { error } = await supabase.from('notifications').delete().eq('id', id);
    if (error) toast.error(error.message); else { toast.success('Removida'); load(); }
  };

  const inputClass = "w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50";
  const types: { key: typeof type; label: string; icon: any }[] = [
    { key: 'release', label: 'Lançamento', icon: Sparkles },
    { key: 'update', label: 'Atualização (Série)', icon: Tv },
    { key: 'info', label: 'Aviso geral', icon: Info },
  ];

  return (
    <div className="space-y-6">
      {/* Create form */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-4">
        <h3 className="font-display text-base text-foreground flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" /> NOVA NOTIFICAÇÃO
        </h3>

        <div className="flex gap-2 flex-wrap">
          {types.map(t => (
            <button key={t.key} onClick={() => setType(t.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                type === t.key ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}>
              <t.icon className="h-4 w-4" /> {t.label}
            </button>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Título (ex: Novo filme adicionado!)" className={inputClass} />
          <input value={message} onChange={e => setMessage(e.target.value)} placeholder="Mensagem curta (opcional)" className={inputClass} />
        </div>

        {/* Content link */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Vincular ao conteúdo (opcional)</label>
          {selected ? (
            <div className="flex items-center gap-3 p-2 bg-secondary border border-border rounded-lg">
              {selected.image_url && <img src={selected.image_url} className="w-10 h-14 object-cover rounded" alt="" />}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{selected.title}</p>
                <p className="text-xs text-muted-foreground uppercase">{selected.type === 'movie' ? 'Filme' : 'Série'}</p>
              </div>
              <button onClick={() => { setSelected(null); setContentSearch(''); }} className="text-xs text-destructive hover:underline">Remover</button>
            </div>
          ) : (
            <div className="relative">
              <input value={contentSearch} onChange={e => setContentSearch(e.target.value)} placeholder="Buscar filme ou série…" className={inputClass} />
              {contentResults.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-card border border-border rounded-lg shadow-lg max-h-64 overflow-y-auto">
                  {contentResults.map(r => (
                    <button key={`${r.type}-${r.id}`} onClick={() => { setSelected(r); setContentResults([]); setContentSearch(''); }}
                      className="w-full flex items-center gap-2 p-2 hover:bg-secondary/60 text-left">
                      {r.image_url && <img src={r.image_url} className="w-8 h-11 object-cover rounded" alt="" />}
                      <span className="text-sm text-foreground flex-1 truncate">{r.title}</span>
                      <span className="text-[10px] uppercase text-muted-foreground">{r.type === 'movie' ? 'Filme' : 'Série'}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <button onClick={handleCreate} disabled={creating} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50">
          {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Publicar notificação
        </button>
      </div>

      {/* List */}
      <div>
        <h3 className="font-display text-base text-foreground mb-3">PUBLICADAS ({items.length})</h3>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhuma notificação ainda.</p>
        ) : (
          <div className="space-y-2">
            {items.map(n => {
              const Icon = n.type === 'release' ? Sparkles : n.type === 'update' ? Tv : Info;
              return (
                <div key={n.id} className={`flex items-center gap-3 p-3 bg-card border rounded-lg ${n.is_active ? 'border-border' : 'border-border/40 opacity-60'}`}>
                  <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{n.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {n.message || '—'} · {new Date(n.created_at).toLocaleString('pt-BR')}
                      {n.content_slug && <span className="ml-1 text-primary">· vinculada</span>}
                    </p>
                  </div>
                  <button onClick={() => toggleActive(n)} title={n.is_active ? 'Desativar' : 'Ativar'} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                    {n.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                  <button onClick={() => remove(n.id)} className="p-2 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
