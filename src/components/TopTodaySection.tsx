import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Loader2, TrendingUp, ChevronLeft, ChevronRight, Play, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { contentUrl } from '@/lib/utils';

interface Item {
  id: string;
  title: string;
  year: string;
  rating: number;
  imageUrl: string;
  type: 'movie' | 'series';
}

export function TopTodaySection() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['home-top-today'],
    queryFn: async (): Promise<Item[]> => {
      // "Today" = highest rated among most recently added (last ~60 entries)
      const [m, s] = await Promise.all([
        supabase.from('movies').select('id,title,year,rating,image_url,created_at').order('created_at', { ascending: false }).limit(30),
        supabase.from('series').select('id,title,year,rating,image_url,created_at').order('created_at', { ascending: false }).limit(30),
      ]);
      const all: Item[] = [
        ...(m.data || []).map((i): Item => ({ id: i.id, title: i.title, year: i.year || '', rating: i.rating ?? 0, imageUrl: i.image_url || '/placeholder.svg', type: 'movie' })),
        ...(s.data || []).map((i): Item => ({ id: i.id, title: i.title, year: i.year || '', rating: i.rating ?? 0, imageUrl: i.image_url || '/placeholder.svg', type: 'series' })),
      ];
      return all.sort((a, b) => b.rating - a.rating).slice(0, 10);
    },
    staleTime: 1000 * 60 * 10,
  });

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 0);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
  };

  useEffect(() => { checkScroll(); }, [items]);

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'left' ? -el.clientWidth * 0.8 : el.clientWidth * 0.8, behavior: 'smooth' });
    setTimeout(checkScroll, 400);
  };

  if (!isLoading && items.length === 0) return null;

  return (
    <section id="top-hoje" className="py-12 md:py-16 relative">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.5 }}
          className="flex items-center gap-3 mb-8"
        >
          <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
            <TrendingUp className="h-6 w-6 text-primary" />
          </div>
          <h2 className="font-display text-3xl md:text-4xl text-foreground">TOP 10 HOJE</h2>
          <div className="flex-1 h-px bg-gradient-to-r from-primary/30 to-transparent ml-4" />
        </motion.div>

        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>
        ) : (
          <div className="relative group/carousel">
            {canLeft && (
              <button onClick={() => scroll('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-30 bg-background/90 backdrop-blur-md border border-border/60 hover:border-primary/50 rounded-full p-2.5 opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 -translate-x-3 group-hover/carousel:translate-x-0 shadow-lg">
                <ChevronLeft className="h-5 w-5 text-foreground" />
              </button>
            )}
            {canRight && (
              <button onClick={() => scroll('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-30 bg-background/90 backdrop-blur-md border border-border/60 hover:border-primary/50 rounded-full p-2.5 opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 translate-x-3 group-hover/carousel:translate-x-0 shadow-lg">
                <ChevronRight className="h-5 w-5 text-foreground" />
              </button>
            )}

            <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

            <div
              ref={scrollRef}
              onScroll={checkScroll}
              className="flex gap-4 md:gap-5 overflow-x-auto pb-4 pt-2 snap-x snap-mandatory"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {items.map((item, i) => (
                <Card key={item.id} item={item} rank={i + 1} priority={i < 3} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function Card({ item, rank, priority }: { item: Item; rank: number; priority?: boolean }) {
  const href = contentUrl(item.type, item.id, item.title);
  return (
    <Link to={href} className="snap-start shrink-0 w-[160px] sm:w-[180px] md:w-[200px] group/card block">
      <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-secondary ring-1 ring-border/20 group-hover/card:ring-primary/50 transition-all duration-500 shadow-xl">
        <img
          src={item.imageUrl}
          alt={`${rank}. ${item.title}`}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          className="w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-70 group-hover/card:opacity-90 transition-opacity" />

        {/* Rank badge */}
        <div className="absolute top-2 left-2 flex items-center gap-1 bg-primary/90 backdrop-blur-sm text-primary-foreground text-xs font-extrabold px-2 py-0.5 rounded-md tracking-wider shadow-lg shadow-primary/40">
          #{rank}
        </div>

        {/* Rating */}
        {item.rating > 0 && (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-background/80 backdrop-blur-sm text-foreground text-[11px] font-semibold px-1.5 py-0.5 rounded-md">
            <Star className="h-3 w-3 text-yellow-400 fill-current" />
            {item.rating.toFixed(1)}
          </div>
        )}

        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-all duration-300 scale-75 group-hover/card:scale-100">
          <div className="bg-primary/90 backdrop-blur-sm rounded-full p-3 shadow-lg shadow-primary/40">
            <Play className="h-5 w-5 text-primary-foreground fill-current" />
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="text-xs sm:text-sm font-semibold text-white truncate drop-shadow-md">{item.title}</h3>
          <p className="text-[10px] sm:text-xs text-white/70">{item.year}</p>
        </div>
      </div>
    </Link>
  );
}
