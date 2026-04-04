import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { MovieCard } from './MovieCard';
import type { Movie, Series } from '@/types/database';

export function ReleasesSection() {
  const [items, setItems] = useState<{ id: string; title: string; year: string; rating: number; imageUrl: string; genre: string; type: 'movie' | 'series' }[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    loadReleases();
  }, []);

  useEffect(() => {
    checkScroll();
  }, [items]);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
  };

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.75;
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
    setTimeout(checkScroll, 400);
  };

  const loadReleases = async () => {
    const [moviesRes, seriesRes] = await Promise.all([
      supabase.from('movies').select('*').eq('is_release', true).order('created_at', { ascending: false }),
      supabase.from('series').select('*').eq('is_release', true).order('created_at', { ascending: false }),
    ]);
    const movies = ((moviesRes.data || []) as Movie[]).map(m => ({
      id: m.id, title: m.title, year: m.year || '', rating: m.rating,
      imageUrl: m.image_url || '/placeholder.svg', genre: m.genre || '', type: 'movie' as const,
    }));
    const series = ((seriesRes.data || []) as Series[]).map(s => ({
      id: s.id, title: s.title, year: s.year || '', rating: s.rating,
      imageUrl: s.image_url || '/placeholder.svg', genre: s.genre || '', type: 'series' as const,
    }));
    setItems([...movies, ...series]);
    setLoading(false);
  };

  if (!loading && items.length === 0) return null;

  return (
    <section id="lancamentos" className="py-12 relative">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3 mb-6"
        >
          <div className="p-2 rounded-lg bg-primary/10 cinema-glow">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <h2 className="font-display text-3xl md:text-4xl text-foreground">LANÇAMENTOS</h2>
          <div className="flex-1 h-px bg-gradient-to-r from-primary/30 to-transparent ml-4" />
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>
        ) : (
          <div className="relative group">
            {/* Navigation arrows */}
            {canScrollLeft && (
              <button
                onClick={() => scroll('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/90 backdrop-blur-sm border border-border hover:border-primary/50 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-2 group-hover:translate-x-0"
              >
                <ChevronLeft className="h-5 w-5 text-foreground" />
              </button>
            )}
            {canScrollRight && (
              <button
                onClick={() => scroll('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/90 backdrop-blur-sm border border-border hover:border-primary/50 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0"
              >
                <ChevronRight className="h-5 w-5 text-foreground" />
              </button>
            )}

            {/* Fade edges */}
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-[5] pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-[5] pointer-events-none" />

            {/* Scrollable carousel */}
            <div
              ref={scrollRef}
              onScroll={checkScroll}
              className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 snap-x snap-mandatory"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {items.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06, duration: 0.4, ease: 'easeOut' }}
                  className="min-w-[150px] sm:min-w-[180px] md:min-w-[200px] snap-start"
                >
                  <MovieCard {...item} />
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
