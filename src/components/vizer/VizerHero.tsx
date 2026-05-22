import { ReactNode } from 'react';
import { Star } from 'lucide-react';
import { getImageUrl, type TmdbCastMember } from '@/services/tmdb';

interface VizerHeroProps {
  backdrop: string | null | undefined;
  poster: string | null | undefined;
  title: string;
  tagline?: string;
  year?: string | number | null;
  runtimeLabel?: string | null; // e.g. "2h 15min" or "5 Temporadas"
  subLine?: string | null; // e.g. "5 Temporadas" for series
  rating?: number | null;
  genres: string[];
  overview?: string | null;
  cast: TmdbCastMember[];
  actions?: ReactNode;
}

export function VizerHero({
  backdrop, poster, title, tagline, year, runtimeLabel, subLine,
  rating, genres, overview, cast, actions,
}: VizerHeroProps) {
  const fullStars = rating ? Math.round((rating / 2)) : 0;
  return (
    <section className="relative w-full overflow-hidden">
      {/* Blurred backdrop bg */}
      <div className="absolute inset-0 -z-10">
        {backdrop && (
          <img
            src={backdrop}
            alt=""
            aria-hidden
            className="w-full h-full object-cover scale-110 blur-2xl opacity-40"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/85 to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/40 to-background/80" />
      </div>

      <div className="container mx-auto px-4 pt-24 md:pt-32 pb-10 md:pb-14">
        <div className="flex flex-col md:flex-row gap-6 md:gap-10">
          {/* Poster */}
          <div className="shrink-0 mx-auto md:mx-0">
            <div className="relative w-44 sm:w-52 md:w-64 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl shadow-black/60 ring-1 ring-border/30">
              <img src={poster || '/placeholder.svg'} alt={title} className="w-full h-full object-cover" />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl text-foreground mb-3 leading-tight">{title}</h1>
            {tagline && <p className="text-foreground/70 italic text-sm md:text-base mb-4">{tagline}</p>}

            {subLine && <p className="text-foreground/80 text-sm md:text-base mb-3">{subLine}</p>}

            <div className="flex flex-wrap items-center gap-4 text-sm text-foreground/70 mb-5">
              {year && <span>{year}</span>}
              {runtimeLabel && <span className="flex items-center gap-1">• {runtimeLabel}</span>}
              {!!rating && (
                <span className="inline-flex items-center gap-1.5">
                  <span className="relative inline-flex">
                    <span className="flex gap-0.5 text-foreground/15">
                      {[0,1,2,3,4].map(i => <Star key={i} className="h-4 w-4 fill-current" />)}
                    </span>
                    <span
                      className="absolute inset-y-0 left-0 overflow-hidden text-yellow-400 pointer-events-none"
                      style={{ width: `${Math.max(0, Math.min(100, (rating / 10) * 100))}%` }}
                      aria-hidden
                    >
                      <span className="flex gap-0.5 w-max">
                        {[0,1,2,3,4].map(i => <Star key={i} className="h-4 w-4 fill-current shrink-0" />)}
                      </span>
                    </span>
                  </span>
                  <span className="ml-1 text-xs text-foreground/60">{rating.toFixed(1)}</span>
                </span>
              )}
            </div>

            {genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-5">
                {genres.map(g => (
                  <span key={g} className="px-3 py-1 rounded-full bg-foreground/10 text-foreground/85 text-xs font-medium border border-foreground/10 backdrop-blur-sm">
                    {g}
                  </span>
                ))}
              </div>
            )}

            {cast.length > 0 && (
              <div className="mb-5">
                <p className="text-foreground/80 text-sm font-semibold mb-2">Elenco</p>
                <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                  {cast.slice(0, 12).map(m => (
                    <div key={m.id} className="shrink-0 flex items-center gap-2 pl-1 pr-3 py-1 rounded-full bg-foreground/5 border border-foreground/10">
                      <div className="h-7 w-7 rounded-full overflow-hidden bg-secondary shrink-0">
                        {m.profile_path ? (
                          <img src={getImageUrl(m.profile_path, 'w185')} alt={m.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground">{m.name[0]}</div>
                        )}
                      </div>
                      <div className="min-w-0 leading-tight">
                        <p className="text-[11px] font-semibold text-foreground truncate max-w-[110px]">{m.name}</p>
                        <p className="text-[10px] text-foreground/55 italic truncate max-w-[110px]">{m.character}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {overview && (
              <p className="text-sm md:text-base text-foreground/80 leading-relaxed mb-6 max-w-3xl">{overview}</p>
            )}

            {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
          </div>
        </div>
      </div>
    </section>
  );
}
