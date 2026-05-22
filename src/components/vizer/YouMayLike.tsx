import { useQuery } from '@tanstack/react-query';
import { Star, Sparkles } from 'lucide-react';
import { getRecommendations, getImageUrl } from '@/services/tmdb';

interface YouMayLikeProps {
  type: 'movie' | 'tv';
  tmdbId: number;
}

export function YouMayLike({ type, tmdbId }: YouMayLikeProps) {
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['recommendations', type, tmdbId],
    queryFn: () => getRecommendations(type, tmdbId),
    staleTime: 1000 * 60 * 30,
    enabled: !!tmdbId,
  });

  if (isLoading || items.length === 0) return null;

  return (
    <section className="mt-12">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <h3 className="font-display text-2xl md:text-3xl text-foreground">VOCÊ PODE GOSTAR</h3>
        <div className="flex-1 h-px bg-gradient-to-r from-primary/30 to-transparent" />
      </div>
      <div className="flex gap-3 md:gap-4 overflow-x-auto pb-3 snap-x" style={{ scrollbarWidth: 'none' }}>
        {items.map(item => {
          const title = item.title || item.name || '';
          return (
            <div key={item.id} className="snap-start shrink-0 w-[140px] sm:w-[160px] md:w-[180px]">
              <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-secondary ring-1 ring-border/20 hover:ring-primary/50 transition-all shadow-lg">
                <img
                  src={getImageUrl(item.poster_path, 'w342')}
                  alt={title}
                  loading="lazy"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
                {item.vote_average > 0 && (
                  <div className="absolute top-1.5 right-1.5 flex items-center gap-1 bg-background/85 backdrop-blur-sm px-1.5 py-0.5 rounded text-[10px] font-semibold text-foreground">
                    <Star className="h-2.5 w-2.5 text-primary fill-primary" />
                    {item.vote_average.toFixed(1)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
