import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getTrendingMovies, getTrendingSeries, getImageUrl, type TmdbMovie, type TmdbSeries } from '@/services/tmdb';
import { Loader2, Film, Tv } from 'lucide-react';
import { Link } from 'react-router-dom';

type Tab = 'movies' | 'series';

export function ReleasesSection() {
  const [tab, setTab] = useState<Tab>('movies');
  const [movies, setMovies] = useState<TmdbMovie[]>([]);
  const [series, setSeries] = useState<TmdbSeries[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getTrendingMovies(), getTrendingSeries()]).then(([m, s]) => {
      setMovies(m.slice(0, 12));
      setSeries(s.slice(0, 12));
      setLoading(false);
    });
  }, []);

  const items = tab === 'movies' ? movies : series;

  return (
    <section id="lancamentos" className="py-12">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <h2 className="font-display text-3xl md:text-4xl text-foreground">LANÇAMENTOS</h2>
          <div className="flex gap-2">
            <button onClick={() => setTab('movies')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === 'movies' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}>
              <Film className="h-4 w-4" /> Filmes
            </button>
            <button onClick={() => setTab('series')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === 'series' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}>
              <Tv className="h-4 w-4" /> Séries
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {items.map((item, i) => {
              const title = tab === 'movies' ? (item as TmdbMovie).title : (item as TmdbSeries).name;
              const date = tab === 'movies' ? (item as TmdbMovie).release_date : (item as TmdbSeries).first_air_date;
              const poster = item.poster_path;
              // These are TMDB items not in DB, link won't work unless added — show as preview cards
              return (
                <motion.div key={item.id}
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.04, duration: 0.4 }}>
                  <div className="group relative rounded-lg overflow-hidden bg-card border border-border hover:border-primary/50 transition-all duration-300">
                    <div className="aspect-[2/3] overflow-hidden">
                      <img src={getImageUrl(poster)} alt={title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <p className="text-sm font-semibold text-white truncate">{title}</p>
                      <p className="text-xs text-white/70">{date?.slice(0, 4) || '—'} • ⭐ {item.vote_average.toFixed(1)}</p>
                    </div>
                    <div className="absolute top-2 right-2 bg-primary/90 text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded">
                      NOVO
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
