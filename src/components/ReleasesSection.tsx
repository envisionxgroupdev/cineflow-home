import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { MovieCard } from './MovieCard';
import type { Movie, Series } from '@/types/database';

export function ReleasesSection() {
  const [items, setItems] = useState<{ id: string; title: string; year: string; rating: number; imageUrl: string; genre: string; type: 'movie' | 'series' }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReleases();
  }, []);

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
    <section id="lancamentos" className="py-12">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-3 mb-6">
          <Sparkles className="h-6 w-6 text-primary" />
          <h2 className="font-display text-3xl md:text-4xl text-foreground">LANÇAMENTOS</h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {items.map((item, i) => (
              <motion.div key={item.id}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.04, duration: 0.4 }}>
                <MovieCard {...item} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
