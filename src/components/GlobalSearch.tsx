import { useState, useRef, useEffect } from 'react';
import { Search, X, Film, Tv, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { Movie, Series } from '@/types/database';

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [series, setSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!query.trim()) { setMovies([]); setSeries([]); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const [m, s] = await Promise.all([
        supabase.from('movies').select('*').ilike('title', `%${query}%`).limit(5),
        supabase.from('series').select('*').ilike('title', `%${query}%`).limit(5),
      ]);
      setMovies((m.data as Movie[]) || []);
      setSeries((s.data as Series[]) || []);
      setLoading(false);
    }, 300);
  }, [query]);

  const go = (path: string) => { setOpen(false); setQuery(''); navigate(path); };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-muted-foreground hover:text-foreground transition-colors">
        <Search className="h-5 w-5" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-20 bg-black/70" onClick={() => setOpen(false)}>
      <div className="w-full max-w-lg mx-4 bg-card border border-border rounded-xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar filmes e séries..."
            className="flex-1 bg-transparent text-foreground text-sm outline-none placeholder:text-muted-foreground"
          />
          {loading && <Loader2 className="h-4 w-4 text-primary animate-spin" />}
          <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {movies.length === 0 && series.length === 0 && query.trim() && !loading && (
            <p className="text-center text-muted-foreground text-sm py-6">Nenhum resultado encontrado</p>
          )}
          {movies.length > 0 && (
            <div className="p-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase px-2 py-1">Filmes</p>
              {movies.map(m => (
                <button key={m.id} onClick={() => go(`/filme/${m.id}`)}
                  className="flex items-center gap-3 w-full px-2 py-2 rounded-lg hover:bg-secondary transition-colors text-left">
                  <Film className="h-4 w-4 text-primary shrink-0" />
                  <img src={m.image_url || '/placeholder.svg'} alt={m.title} className="w-8 h-11 object-cover rounded" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{m.title}</p>
                    <p className="text-xs text-muted-foreground">{m.year} • ⭐ {m.rating}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
          {series.length > 0 && (
            <div className="p-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase px-2 py-1">Séries</p>
              {series.map(s => (
                <button key={s.id} onClick={() => go(`/serie/${s.id}`)}
                  className="flex items-center gap-3 w-full px-2 py-2 rounded-lg hover:bg-secondary transition-colors text-left">
                  <Tv className="h-4 w-4 text-primary shrink-0" />
                  <img src={s.image_url || '/placeholder.svg'} alt={s.title} className="w-8 h-11 object-cover rounded" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{s.title}</p>
                    <p className="text-xs text-muted-foreground">{s.year} • ⭐ {s.rating}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
