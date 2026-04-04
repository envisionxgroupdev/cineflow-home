import { useState, useEffect } from 'react';
import { X, Sparkles, Loader2, Trash2, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Movie, Series } from '@/types/database';

interface EditContentModalProps {
  item: Movie | Series;
  type: 'movie' | 'series';
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function EditContentModal({ item, type, open, onClose, onSaved }: EditContentModalProps) {
  const [title, setTitle] = useState(item.title);
  const [year, setYear] = useState(item.year || '');
  const [genre, setGenre] = useState(item.genre || '');
  const [rating, setRating] = useState(String(item.rating));
  const [overview, setOverview] = useState(item.overview || '');
  const [imageUrl, setImageUrl] = useState(item.image_url || '');
  const [playerUrl, setPlayerUrl] = useState(item.player_url || '');
  const [playerUrl2, setPlayerUrl2] = useState(item.player_url_2 || '');
  const [isRelease, setIsRelease] = useState(item.is_release || false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTitle(item.title);
    setYear(item.year || '');
    setGenre(item.genre || '');
    setRating(String(item.rating));
    setOverview(item.overview || '');
    setImageUrl(item.image_url || '');
    setPlayerUrl(item.player_url || '');
    setPlayerUrl2(item.player_url_2 || '');
    setIsRelease(item.is_release || false);
  }, [item]);

  const handleSave = async () => {
    setSaving(true);
    const table = type === 'movie' ? 'movies' : 'series';
    const { error } = await supabase.from(table).update({
      title,
      year,
      genre,
      rating: parseFloat(rating) || 0,
      overview,
      image_url: imageUrl || null,
      player_url: playerUrl || null,
      player_url_2: playerUrl2 || null,
      is_release: isRelease,
    }).eq('id', item.id);

    if (error) {
      toast.error('Erro ao salvar: ' + error.message);
    } else {
      toast.success('Salvo com sucesso!');
      onSaved();
      onClose();
    }
    setSaving(false);
  };

  if (!open) return null;

  const inputClass = "w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50";
  const labelClass = "block text-xs font-semibold text-muted-foreground uppercase mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl w-full max-w-lg max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-display text-lg text-foreground">EDITAR {type === 'movie' ? 'FILME' : 'SÉRIE'}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <label className={labelClass}>Título</label>
            <input value={title} onChange={e => setTitle(e.target.value)} className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Ano</label>
              <input value={year} onChange={e => setYear(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Nota</label>
              <input value={rating} onChange={e => setRating(e.target.value)} type="number" step="0.1" min="0" max="10" className={inputClass} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Gênero</label>
            <input value={genre} onChange={e => setGenre(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Sinopse</label>
            <textarea value={overview} onChange={e => setOverview(e.target.value)} rows={3} className={inputClass + " resize-none"} />
          </div>
          <div>
            <label className={labelClass}>URL da Imagem (Poster)</label>
            <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} className={inputClass} placeholder="https://..." />
          </div>

          {/* Player 1 - WarezCDN */}
          <div className="border border-border rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <label className={labelClass + " mb-0"}>Player 1 — WarezCDN</label>
              {playerUrl && (
                <button onClick={() => setPlayerUrl('')} className="text-destructive hover:text-destructive/80 text-xs flex items-center gap-1">
                  <Trash2 className="h-3 w-3" /> Remover
                </button>
              )}
            </div>
            <input value={playerUrl} onChange={e => setPlayerUrl(e.target.value)} className={inputClass} placeholder="https://warezcdn.site/filme/..." />
            <p className="text-[10px] text-muted-foreground">Deixe vazio para usar o player padrão (WarezCDN via TMDB ID)</p>
          </div>

          {/* Player 2 - EmbedMovies */}
          <div className="border border-border rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <label className={labelClass + " mb-0"}>Player 2 — EmbedMovies</label>
              {playerUrl2 && (
                <button onClick={() => setPlayerUrl2('')} className="text-destructive hover:text-destructive/80 text-xs flex items-center gap-1">
                  <Trash2 className="h-3 w-3" /> Remover
                </button>
              )}
            </div>
            <input value={playerUrl2} onChange={e => setPlayerUrl2(e.target.value)} className={inputClass} placeholder="https://embedmovies.org/embed/movie/..." />
            <p className="text-[10px] text-muted-foreground">Deixe vazio para usar o player padrão (EmbedMovies via TMDB ID)</p>
          </div>

          <div>
            <button onClick={() => setIsRelease(!isRelease)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors w-full justify-center ${
                isRelease ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}>
              <Sparkles className="h-4 w-4" />
              {isRelease ? 'Marcado como Lançamento' : 'Marcar como Lançamento'}
            </button>
          </div>
        </div>

        <div className="p-4 border-t border-border flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium bg-secondary text-muted-foreground hover:text-foreground transition-colors">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}
