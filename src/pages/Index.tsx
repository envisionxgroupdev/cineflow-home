import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { ContentSection } from "@/components/ContentSection";
import { ReleasesSection } from "@/components/ReleasesSection";
import { Footer } from "@/components/Footer";
import { EditContentModal } from "@/components/EditContentModal";
import { AdBanner } from "@/components/AdBanner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Movie, Series } from "@/types/database";
import { Loader2 } from "lucide-react";

const Index = () => {
  const { isAdmin } = useAuth();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [series, setSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [editItem, setEditItem] = useState<{ item: Movie | Series; type: 'movie' | 'series' } | null>(null);

  useEffect(() => { loadContent(); }, []);

  const loadContent = async () => {
    const [moviesRes, seriesRes] = await Promise.all([
      supabase.from('movies').select('*').order('created_at', { ascending: false }).limit(25),
      supabase.from('series').select('*').order('created_at', { ascending: false }).limit(25),
    ]);
    if (moviesRes.data) setMovies(moviesRes.data as Movie[]);
    if (seriesRes.data) setSeries(seriesRes.data as Series[]);
    setLoading(false);
  };

  const toCardFormat = (items: (Movie | Series)[], type: 'movie' | 'series') =>
    items.map((item) => ({
      id: item.id,
      title: item.title,
      year: item.year || '',
      rating: item.rating,
      imageUrl: item.image_url || '/placeholder.svg',
      genre: item.genre || '',
      type,
      isAdmin,
      onEdit: isAdmin ? () => setEditItem({ item, type }) : undefined,
    }));

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Cineflow — Filmes e Séries Online Grátis em HD</title>
        <meta name="description" content="Assista filmes e séries online grátis em HD com legendas e dublagem em português. Os melhores lançamentos do cinema." />
      </Helmet>
      <Navbar />
      <HeroSection />
      <div className="cinema-gradient">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
        ) : (
          <>
            <AdBanner page="home" position="top" />
            <ReleasesSection />
            {movies.length > 0 && <ContentSection id="filmes" title="FILMES" items={toCardFormat(movies, 'movie')} />}
            <AdBanner page="home" position="middle" />
            {series.length > 0 && <ContentSection id="series" title="SÉRIES" items={toCardFormat(series, 'series')} />}
            {movies.length === 0 && series.length === 0 && (
              <div className="text-center py-20">
                <p className="text-muted-foreground">Nenhum conteúdo adicionado ainda.</p>
                <p className="text-muted-foreground text-sm mt-2">
                  Acesse o <a href="/admin" className="text-primary hover:underline">painel admin</a> para adicionar filmes e séries.
                </p>
              </div>
            )}
            <AdBanner page="home" position="bottom" />
          </>
        )}
      </div>
      <Footer />

      {editItem && (
        <EditContentModal
          item={editItem.item}
          type={editItem.type}
          open={!!editItem}
          onClose={() => setEditItem(null)}
          onSaved={() => { loadContent(); setEditItem(null); }}
        />
      )}
    </div>
  );
};

export default Index;
