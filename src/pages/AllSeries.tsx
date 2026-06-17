import { useState, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { MovieCard } from '@/components/MovieCard';
import { EditContentModal } from '@/components/EditContentModal';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Search, Tv } from 'lucide-react';
import { motion } from 'framer-motion';
import { GenreFilter } from '@/components/GenreFilter';
import { PaginationControl } from '@/components/PaginationControl';
import { AdBanner } from '@/components/AdBanner';
import { Helmet } from 'react-helmet-async';
import type { Series } from '@/types/database';

const PER_PAGE = 25;
const LIST_FIELDS = 'id,title,year,rating,image_url,genre,is_release,is_anime,created_at';

const AllSeries = () => {
  const { isAdmin } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [editItem, setEditItem] = useState<Series | null>(null);
  const [genre, setGenre] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const { data: series = [], isLoading: loading } = useQuery({
    queryKey: ['all-series'],
    queryFn: async () => {
      const { data } = await supabase.from('series').select(LIST_FIELDS).eq('is_anime', false).order('created_at', { ascending: false });
      return (data || []) as Series[];
    },
  });

  const reload = () => qc.invalidateQueries({ queryKey: ['all-series'] });

  const filtered = useMemo(() => series.filter(s => {
    const matchSearch = s.title.toLowerCase().includes(search.toLowerCase());
    const matchGenre = !genre || (s.genre || '').split(',').map(g => g.trim()).includes(genre);
    return matchSearch && matchGenre;
  }), [series, search, genre]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  useEffect(() => { setPage(1); }, [search, genre]);

  const handlePageChange = (p: number) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Séries Online Grátis em HD — PipocaMax</title>
        <meta name="description" content="Assista séries online grátis em HD. Catálogo completo com lançamentos, drama, comédia, ficção e muito mais." />
        <link rel="canonical" href="https://pipocamax.sbs/series" />
        <meta property="og:title" content="Séries Online Grátis em HD — PipocaMax" />
        <meta property="og:description" content="Catálogo completo de séries online grátis em HD dublado e legendado." />
        <meta property="og:url" content="https://pipocamax.sbs/series" />
        <meta property="og:type" content="website" />
        <meta name="twitter:title" content="Séries Online Grátis em HD — PipocaMax" />
        <meta name="twitter:description" content="Catálogo completo de séries online grátis em HD." />
      </Helmet>
      <Navbar />
      <div className="pt-20 pb-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 rounded-lg bg-primary/10">
              <Tv className="h-6 w-6 text-primary" />
            </div>
            <h1 className="font-display text-3xl md:text-5xl text-foreground">TODAS AS <span className="text-gradient-cinema">SÉRIES</span></h1>
          </div>

          <div className="relative max-w-md mb-8">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input type="text" placeholder="Buscar séries..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>

          <GenreFilter items={series} selected={genre} onSelect={setGenre} />

          <AdBanner page="series" position="top" />

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {paged.map((s, i) => (
                  <motion.div key={s.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03, duration: 0.4 }}>
                    <MovieCard
                      id={s.id} title={s.title} year={s.year || ''} rating={s.rating}
                      imageUrl={s.image_url || '/placeholder.svg'} genre={s.genre || ''} type="series"
                      isAdmin={isAdmin} onEdit={isAdmin ? () => setEditItem(s) : undefined}
                    />
                  </motion.div>
                ))}
                {filtered.length === 0 && (
                  <div className="col-span-full text-center py-12 text-muted-foreground">Nenhuma série encontrada.</div>
                )}
              </div>
              <AdBanner page="series" position="middle" />
              <PaginationControl currentPage={page} totalPages={totalPages} onPageChange={handlePageChange} />
              <AdBanner page="series" position="bottom" />
            </>
          )}
        </div>
      </div>
      <Footer />
      {editItem && (
        <EditContentModal item={editItem} type="series" open={!!editItem}
          onClose={() => setEditItem(null)} onSaved={() => { reload(); setEditItem(null); }} />
      )}
    </div>
  );
};

export default AllSeries;
