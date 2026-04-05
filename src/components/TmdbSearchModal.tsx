import { useState, useCallback } from 'react';
import { Search, Plus, X, Loader2, Sparkles, Calendar } from 'lucide-react';
import { searchMovies, searchSeries, tmdbMovieToDb, tmdbSeriesToDb, getImageUrl, type TmdbMovie, type TmdbSeries } from '@/services/tmdb';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TmdbSearchModalProps {
  type: 'movie' | 'series';
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
}

export const TmdbSearchModal = ({ type, open, onClose, onAdded }: TmdbSearchModalProps) => {
  const [query, setQuery] = useState('');
  const [year, setYear] = useState('');
  const [results, setResults] = useState<(TmdbMovie | TmdbSeries)[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState<number | null>(null);
  const [releaseIds, setReleaseIds] = useState<Set<number>>(new Set());
  const [importedIds, setImportedIds] = useState<Set<number>>(new Set());

  const toggleRelease = (id: number) => {
    setReleaseIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // Load imported IDs when modal opens
  const loadImported = useCallback(async () => {
    const table = type === 'movie' ? 'movies' : 'series';
    const allIds: number[] = [];
    let from = 0;
    while (true) {
      const { data } = await supabase.from(table).select('tmdb_id').range(from, from + 999);
      if (!data || data.length === 0) break;
      allIds.push(...data.map((d: any) => d.tmdb_id).filter(Boolean));
      if (data.length < 1000) break;
      from += 1000;
    }
    setImportedIds(new Set(allIds));
  }, [type]);

  // Load on open
  useState(() => { if (open) loadImported(); });

  const handleSearch = useCallback(async () => {
    if (!query.trim() && !year.trim()) return;
    setSearching(true);
    try {
      await loadImported();
      const yearNum = year ? parseInt(year) : undefined;
      const data = type === 'movie' ? await searchMovies(query, yearNum) : await searchSeries(query, yearNum);
      setResults(data.slice(0, 20));
    } catch {
      toast.error('Erro ao buscar no TMDB');
    }
    setSearching(false);
  }, [query, year, type, loadImported]);

  const handleAdd = async (item: TmdbMovie | TmdbSeries) => {
    const tmdbId = item.id;
    if (importedIds.has(tmdbId)) {
      toast.info('Este conteúdo já foi importado!');
      return;
    }
    setAdding(tmdbId);
    try {
      const isRelease = releaseIds.has(tmdbId);
      if (type === 'movie') {
        const mapped = await tmdbMovieToDb(item as TmdbMovie);
        const { error } = await supabase.from('movies').upsert({ ...mapped, is_release: isRelease }, { onConflict: 'tmdb_id' });
        if (error) throw error;
      } else {
        const mapped = await tmdbSeriesToDb(item as TmdbSeries);
        const { error } = await supabase.from('series').upsert({ ...mapped, is_release: isRelease }, { onConflict: 'tmdb_id' });
        if (error) throw error;
      }
      toast.success(`"${type === 'movie' ? (item as TmdbMovie).title : (item as TmdbSeries).name}" adicionado!`);
      setImportedIds(prev => new Set([...prev, tmdbId]));
      onAdded();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar');
    }
    setAdding(null);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-display text-xl text-foreground">BUSCAR {type === 'movie' ? 'FILME' : 'SÉRIE'} — TMDB</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>

        <div className="p-4 border-b border-border">
          <form onSubmit={e => { e.preventDefault(); handleSearch(); }} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Digite o nome..."
                className="w-full pl-10 pr-4 py-2.5 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            <div className="relative w-24 shrink-0">
              <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input type="number" value={year} onChange={e => setYear(e.target.value)} placeholder="Ano"
                min="1900" max={new Date().getFullYear() + 1}
                className="w-full pl-8 pr-2 py-2.5 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            <button type="submit" disabled={searching}
              className="bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-50">
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Buscar'}
            </button>
          </form>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {results.length === 0 && !searching && (
            <p className="text-center text-muted-foreground text-sm py-8">Pesquise um {type === 'movie' ? 'filme' : 'série'} pelo nome</p>
          )}
          {results.map(item => {
            const title = type === 'movie' ? (item as TmdbMovie).title : (item as TmdbSeries).name;
            const date = type === 'movie' ? (item as TmdbMovie).release_date : (item as TmdbSeries).first_air_date;
            const poster = 'poster_path' in item ? item.poster_path : null;
            const isRelease = releaseIds.has(item.id);

            return (
              <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
                <img src={getImageUrl(poster, 'w92')} alt={title} className="w-12 h-16 object-cover rounded" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{title}</p>
                  <p className="text-xs text-muted-foreground">{date?.slice(0, 4) || '—'} • ⭐ {item.vote_average.toFixed(1)}</p>
                </div>
                <button onClick={() => toggleRelease(item.id)} title={isRelease ? 'Remover de lançamentos' : 'Marcar como lançamento'}
                  className={`p-1.5 rounded-lg transition-colors shrink-0 ${isRelease ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-primary hover:bg-primary/10'}`}>
                  <Sparkles className="h-4 w-4" />
                </button>
                <button onClick={() => handleAdd(item)} disabled={adding === item.id}
                  className="flex items-center gap-1 bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-primary/90 disabled:opacity-50 shrink-0">
                  {adding === item.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                  Adicionar
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
