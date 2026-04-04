import { useState, useEffect } from 'react';
import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { ContentSection } from "@/components/ContentSection";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import type { Movie, Series } from "@/types/database";
import { Loader2 } from "lucide-react";

const Index = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [series, setSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    const [moviesRes, seriesRes] = await Promise.all([
      supabase.from('movies').select('*').order('created_at', { ascending: false }),
      supabase.from('series').select('*').order('created_at', { ascending: false }),
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
    }));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />

      <div className="cinema-gradient">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
        ) : (
          <>
            {movies.length > 0 && (
              <ContentSection id="filmes" title="FILMES" items={toCardFormat(movies, 'movie')} />
            )}
            {series.length > 0 && (
              <ContentSection id="series" title="SÉRIES" items={toCardFormat(series, 'series')} />
            )}
            {movies.length === 0 && series.length === 0 && (
              <div className="text-center py-20">
                <p className="text-muted-foreground">Nenhum conteúdo adicionado ainda.</p>
                <p className="text-muted-foreground text-sm mt-2">
                  Acesse o <a href="/admin" className="text-primary hover:underline">painel admin</a> para adicionar filmes e séries.
                </p>
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Index;
