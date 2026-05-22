import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Loader2, Sparkles, ChevronLeft, ChevronRight, Play, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { contentUrl } from '@/lib/utils';
import type { Movie, Series } from '@/types/database';

interface ReleaseItem {
  id: string;
  title: string;
  year: string;
  rating: number;
  imageUrl: string;
  backdrop: string | null;
  genre: string;
  overview: string | null;
  type: 'movie' | 'series';
}

export function ReleasesSection() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const { data: items = [], isLoading: loading } = useQuery({
    queryKey: ['home-releases'],
    queryFn: async (): Promise<ReleaseItem[]> => {
      const [moviesRes, seriesRes] = await Promise.all([
        supabase.from('movies').select('id,title,year,rating,image_url,backdrop_url,genre,overview').eq('is_release', true).order('created_at', { ascending: false }).limit(20),
        supabase.from('series').select('id,title,year,rating,image_url,backdrop_url,genre,overview').eq('is_release', true).order('created_at', { ascending: false }).limit(20),
      ]);
      const toItem = (arr: Partial<Movie | Series>[], type: 'movie' | 'series'): ReleaseItem[] =>
        (arr || []).map(i => ({
          id: i.id!, title: i.title!, year: i.year || '', rating: i.rating ?? 0,
          imageUrl: i.image_url || '/placeholder.svg',
          backdrop: i.backdrop_url || null,
          genre: i.genre || '',
          overview: i.overview || null,
          type,
        }));
      return [
        ...toItem(moviesRes.data || [], 'movie'),
        ...toItem(seriesRes.data || [], 'series'),
      ];
    },
    staleTime: 1000 * 60 * 10,
  });

  useEffect(() => { checkScroll(); }, [items]);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
  };

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'left' ? -el.clientWidth * 0.75 : el.clientWidth * 0.75, behavior: 'smooth' });
    setTimeout(checkScroll, 400);
  };

  if (!loading && items.length === 0) return null;

  return (
    <section id="lancamentos" className="py-12 md:py-16 relative">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3 mb-8"
        >
          <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <h2 className="font-display text-3xl md:text-4xl text-foreground">NOVIDADES</h2>
          <div className="flex-1 h-px bg-gradient-to-r from-primary/30 to-transparent ml-4" />
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>
        ) : (
          <div className="relative group/carousel">
            {/* Nav arrows */}
            {canScrollLeft && (
              <button onClick={() => scroll('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-background/90 backdrop-blur-md border border-border/60 hover:border-primary/50 rounded-full p-2.5 opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 -translate-x-3 group-hover/carousel:translate-x-0 shadow-lg">
                <ChevronLeft className="h-5 w-5 text-foreground" />
              </button>
            )}
            {canScrollRight && (
              <button onClick={() => scroll('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-background/90 backdrop-blur-md border border-border/60 hover:border-primary/50 rounded-full p-2.5 opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 translate-x-3 group-hover/carousel:translate-x-0 shadow-lg">
                <ChevronRight className="h-5 w-5 text-foreground" />
              </button>
            )}

            {/* Fade edges */}
            <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

            {/* Scrollable carousel */}
            <div
              ref={scrollRef}
              onScroll={checkScroll}
              className="flex gap-4 md:gap-5 overflow-x-auto pb-4 snap-x snap-mandatory"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {items.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: Math.min(i * 0.05, 0.3), duration: 0.4 }}
                  className="snap-start shrink-0 w-[200px] sm:w-[220px] md:w-[240px]"
                >
                  <ReleaseCard item={item} priority={i < 4} />
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function ReleaseCard({ item, priority = false }: { item: ReleaseItem; priority?: boolean }) {
  const href = contentUrl(item.type, item.id, item.title);

  return (
    <Link to={href} className="group/card block relative">
      {/* Poster */}
      <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-secondary ring-1 ring-border/10 group-hover/card:ring-primary/40 transition-all duration-500 shadow-md group-hover/card:shadow-xl group-hover/card:shadow-primary/10">
        <img
          src={item.imageUrl}
          alt={item.title}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          // @ts-expect-error fetchpriority is valid HTML, React types lag
          fetchpriority={priority ? "high" : "low"}
          sizes="(max-width: 640px) 200px, (max-width: 1024px) 220px, 240px"
          className="w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-110"
        />

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent opacity-0 group-hover/card:opacity-100 transition-all duration-500" />

        {/* Play button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-all duration-300 scale-75 group-hover/card:scale-100">
          <div className="bg-primary/90 backdrop-blur-sm rounded-full p-3 shadow-lg shadow-primary/30">
            <Play className="h-5 w-5 text-primary-foreground fill-current" />
          </div>
        </div>

        {/* Type badge */}
        <span className="absolute top-2.5 left-2.5 bg-primary/90 backdrop-blur-sm text-primary-foreground text-[10px] font-bold uppercase px-2 py-0.5 rounded-md tracking-wider">
          {item.type === 'movie' ? 'Filme' : 'Série'}
        </span>

        {/* Rating badge */}
        {item.rating > 0 && (
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-background/80 backdrop-blur-sm text-foreground text-xs font-semibold px-2 py-0.5 rounded-md">
            <Star className="h-3 w-3 text-yellow-400 fill-current" />
            {item.rating.toFixed(1)}
          </div>
        )}

        {/* Bottom info on hover */}
        <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-2 opacity-0 group-hover/card:translate-y-0 group-hover/card:opacity-100 transition-all duration-300 delay-75">
          {item.genre && (
            <p className="text-[11px] text-muted-foreground truncate">{item.genre}</p>
          )}
        </div>
      </div>

      {/* Info below card */}
      <div className="mt-3 px-0.5">
        <h3 className="text-sm font-semibold text-foreground truncate group-hover/card:text-primary transition-colors duration-300">
          {item.title}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">{item.year}</p>
      </div>
    </Link>
  );
}
