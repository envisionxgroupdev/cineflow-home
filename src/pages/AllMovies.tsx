import { useState, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { MovieCard } from '@/components/MovieCard';
import { EditContentModal } from '@/components/EditContentModal';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Search, Film } from 'lucide-react';
import { motion } from 'framer-motion';
import { GenreFilter } from '@/components/GenreFilter';
import { PaginationControl } from '@/components/PaginationControl';
import { AdBanner } from '@/components/AdBanner';
import { Helmet } from 'react-helmet-async';
import type { Movie } from '@/types/database';

const PER_PAGE = 25;
const LIST_FIELDS = 'id,title,year,rating,image_url,genre,is_release,created_at';

const AllMovies = () => {
  const { isAdmin } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [editItem, setEditItem] = useState<Movie | null>(null);
  const [genre, setGenre] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const { data: movies = [], isLoading: loading } = useQuery({
    queryKey: ['all-movies'],
    queryFn: async () => {
      const { data } = await supabase.from('movies').select(LIST_FIELDS).order('created_at', { ascending: false });
      return (data || []) as Movie[];
    },
  });

  const reload = () => qc.invalidateQueries({ queryKey: ['all-movies'] });

  const filtered = useMemo(() => movies.filter(m => {
    const matchSearch = m.title.toLowerCase().includes(search.toLowerCase());
    const matchGenre = !genre || (m.genre || '').split(',').map(g => g.trim()).includes(genre);
    return matchSearch && matchGenre;
  }), [movies, search, genre]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [search, genre]);

  const handlePageChange = (p: number) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Filmes Online Grátis em HD — PipocaMax</title>
        <meta name="description" content="Assista filmes online grátis em HD. Catálogo completo com lançamentos, ação, comédia, drama e muito mais." />
        <link rel="canonical" href="https://pipocamax.sbs/filmes" />
        <meta property="og:title" content="Filmes Online Grátis em HD — PipocaMax" />
        <meta property="og:description" content="Catálogo completo de filmes online grátis em HD com lançamentos atualizados diariamente." />
        <meta property="og:url" content="https://pipocamax.sbs/filmes" />
        <meta property="og:type" content="website" />
        <meta name="twitter:title" content="Filmes Online Grátis em HD — PipocaMax" />
        <meta name="twitter:description" content="Catálogo completo de filmes online grátis em HD." />
      </Helmet>
      <Navbar />
      <div className="pt-20 pb-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 rounded-lg bg-primary/10">
              <Film className="h-6 w-6 text-primary" />
            </div>
            <h1 className="font-display text-3xl md:text-5xl text-foreground">TODOS OS <span className="text-gradient-cinema">FILMES</span></h1>
          </div>

          <div className="relative max-w-md mb-8">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input type="text" placeholder="Buscar filmes..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>

          <GenreFilter items={movies} selected={genre} onSelect={setGenre} />

          <AdBanner page="movies" position="top" />

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {paged.map((movie, i) => (
                  <motion.div key={movie.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03, duration: 0.4 }}>
                    <MovieCard
                      id={movie.id} title={movie.title} year={movie.year || ''} rating={movie.rating}
                      imageUrl={movie.image_url || '/placeholder.svg'} genre={movie.genre || ''} type="movie"
                      isAdmin={isAdmin} onEdit={isAdmin ? () => setEditItem(movie) : undefined}
                    />
                  </motion.div>
                ))}
                {filtered.length === 0 && (
                  <div className="col-span-full text-center py-12 text-muted-foreground">Nenhum filme encontrado.</div>
                )}
              </div>
              <AdBanner page="movies" position="middle" />
              <PaginationControl currentPage={page} totalPages={totalPages} onPageChange={handlePageChange} />
              <AdBanner page="movies" position="bottom" />
            </>
          )}
        </div>
      </div>
      <Footer />
      {editItem && (
        <EditContentModal item={editItem} type="movie" open={!!editItem}
          onClose={() => setEditItem(null)} onSaved={() => { reload(); setEditItem(null); }} />
      )}
    </div>
  );
};

export default AllMovies;
