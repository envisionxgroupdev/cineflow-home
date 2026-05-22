import { useRef } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Play, Star, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { getImageUrl, type TmdbEpisode, type TmdbSeason } from '@/services/tmdb';

interface Props {
  open: boolean;
  onClose: () => void;
  seasons: TmdbSeason[];
  selectedSeason: number | null;
  setSelectedSeason: (n: number | null) => void;
  episodes: TmdbEpisode[];
  loadingEpisodes: boolean;
  playingEpisode: { season: number; episode: number } | null;
  onPickEpisode: (season: number, episode: number) => void;
}

export function SeasonsModal({
  open, onClose, seasons, selectedSeason, setSelectedSeason,
  episodes, loadingEpisodes, playingEpisode, onPickEpisode,
}: Props) {
  const scroller = useRef<HTMLDivElement>(null);

  const scroll = (dir: 1 | -1) => {
    if (!scroller.current) return;
    scroller.current.scrollBy({ left: dir * scroller.current.clientWidth * 0.8, behavior: 'smooth' });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-5xl w-[95vw] p-0 gap-0 bg-card border-border/60 overflow-hidden">
        <DialogTitle className="sr-only">Temporadas e episódios</DialogTitle>

        {selectedSeason === null ? (
          <div className="p-6 sm:p-8">
            <div className="flex items-baseline justify-between mb-6">
              <h3 className="font-display text-2xl text-foreground">TEMPORADAS</h3>
              <span className="text-xs text-muted-foreground">{seasons.length} temporada{seasons.length > 1 ? 's' : ''}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[65vh] overflow-y-auto pr-1">
              {seasons.map(s => (
                <button
                  key={s.season_number}
                  onClick={() => setSelectedSeason(s.season_number)}
                  className="group relative aspect-[16/10] rounded-2xl border border-border/50 bg-background/40 hover:bg-primary/10 hover:border-primary/60 transition-all overflow-hidden text-left p-4 flex flex-col justify-end"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="relative font-display text-xl text-foreground leading-none">T{s.season_number}</span>
                  <span className="relative text-xs text-muted-foreground mt-2">Temporada {s.season_number}</span>
                  <span className="relative text-[10px] text-foreground/50 mt-0.5">{s.episode_count} episódios</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-6 sm:p-8">
            <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedSeason(null)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-foreground/10 hover:bg-foreground/15 border border-foreground/10 text-foreground transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Temporadas
                </button>
                <h3 className="font-display text-xl text-foreground">EPISÓDIOS · T{selectedSeason}</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground mr-2">{episodes.length} eps</span>
                <button onClick={() => scroll(-1)} className="p-2 rounded-full bg-foreground/10 hover:bg-foreground/15 border border-foreground/10 text-foreground transition-colors">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button onClick={() => scroll(1)} className="p-2 rounded-full bg-foreground/10 hover:bg-foreground/15 border border-foreground/10 text-foreground transition-colors">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {loadingEpisodes ? (
              <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 text-primary animate-spin" /></div>
            ) : (
              <div
                ref={scroller}
                className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 -mx-2 px-2"
                style={{ scrollbarWidth: 'thin' }}
              >
                {episodes.map(ep => {
                  const active = playingEpisode?.season === ep.season_number && playingEpisode?.episode === ep.episode_number;
                  return (
                    <button
                      key={ep.id}
                      onClick={() => onPickEpisode(ep.season_number, ep.episode_number)}
                      className={`group snap-start shrink-0 w-[260px] sm:w-[300px] text-left rounded-2xl border transition-all overflow-hidden flex flex-col ${
                        active ? 'border-primary bg-primary/10' : 'border-border/40 bg-background/40 hover:bg-secondary/60 hover:border-border'
                      }`}
                    >
                      <div className="relative w-full aspect-video bg-secondary overflow-hidden">
                        {ep.still_path ? (
                          <img src={getImageUrl(ep.still_path, 'w500')} alt={ep.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground"><Play className="h-8 w-8" /></div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="bg-primary/90 rounded-full p-3">
                            <Play className="h-5 w-5 text-primary-foreground fill-current" />
                          </div>
                        </div>
                        <span className="absolute top-2 left-2 text-[10px] font-bold uppercase tracking-wider bg-background/80 backdrop-blur text-foreground px-2 py-0.5 rounded-full">
                          E{ep.episode_number}
                        </span>
                      </div>
                      <div className="p-3 flex-1 flex flex-col">
                        <h4 className="text-sm font-semibold text-foreground line-clamp-1 mb-1">{ep.name}</h4>
                        {ep.overview && (
                          <p className="text-xs text-muted-foreground line-clamp-3 mb-2 flex-1">{ep.overview}</p>
                        )}
                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-auto">
                          {ep.vote_average > 0 && (
                            <span className="flex items-center gap-1">
                              <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                              {ep.vote_average.toFixed(1)}
                            </span>
                          )}
                          {ep.runtime ? <span>{ep.runtime} min</span> : null}
                          {ep.air_date ? <span>{ep.air_date}</span> : null}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
