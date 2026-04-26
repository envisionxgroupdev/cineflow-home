import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { ContentSection } from "@/components/ContentSection";
import { ReleasesSection } from "@/components/ReleasesSection";
import { Footer } from "@/components/Footer";
import { EditContentModal } from "@/components/EditContentModal";
import { AdBanner } from "@/components/AdBanner";
import { SplashLoader } from "@/components/SplashLoader";
import { CookieBanner } from "@/components/CookieBanner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Movie, Series } from "@/types/database";
import { TelegramFloat } from "@/components/TelegramFloat";
import { Film, Tv, Sparkles } from "lucide-react";

const HOME_LIMIT = 12;

const Index = () => {
  const { isAdmin } = useAuth();
  const [editItem, setEditItem] = useState<{ item: Movie | Series; type: 'movie' | 'series' } | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['home-content'],
    queryFn: async () => {
      const [moviesRes, seriesRes] = await Promise.all([
        supabase.from('movies').select('*').order('created_at', { ascending: false }).limit(HOME_LIMIT),
        supabase.from('series').select('*').order('created_at', { ascending: false }).limit(HOME_LIMIT),
      ]);
      return {
        movies: (moviesRes.data || []) as Movie[],
        series: (seriesRes.data || []) as Series[],
      };
    },
  });

  const movies = data?.movies || [];
  const series = data?.series || [];

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
      <SplashLoader done={!isLoading} />
      <Helmet>
        <html lang="pt-BR" />
        <title>PipocaMax — Filmes e Séries Online Grátis em HD Dublado</title>
        <meta name="description" content="Assista filmes e séries online grátis em HD dublado e legendado em português. Lançamentos do cinema atualizados diariamente no PipocaMax." />
        <link rel="canonical" href="https://pipocamax.com/" />
        <link rel="alternate" hrefLang="pt-BR" href="https://pipocamax.com/" />
        <meta property="og:title" content="PipocaMax — Filmes e Séries Online Grátis em HD Dublado" />
        <meta property="og:description" content="Assista filmes e séries online grátis em HD dublado e legendado em português. Lançamentos do cinema atualizados diariamente." />
        <meta property="og:url" content="https://pipocamax.com/" />
        <meta property="og:locale" content="pt_BR" />
        <meta name="twitter:title" content="PipocaMax — Filmes e Séries Online Grátis em HD Dublado" />
        <meta name="twitter:description" content="Assista filmes e séries online grátis em HD dublado e legendado em português." />
      </Helmet>
      <Navbar />
      <HeroSection />
      <div className="cinema-gradient">
        <AdBanner page="home" position="top" />

        {/* Stats strip */}
        {!isLoading && (movies.length > 0 || series.length > 0) && (
          <section className="container mx-auto px-4 py-4">
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Film, label: "Filmes", value: movies.length, suffix: "+" },
                { icon: Tv, label: "Séries", value: series.length, suffix: "+" },
                { icon: Sparkles, label: "HD Grátis", value: "100", suffix: "%" },
              ].map(s => (
                <div key={s.label} className="bg-card/50 backdrop-blur-sm border border-border/60 rounded-xl px-3 py-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <s.icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-base md:text-lg font-bold text-foreground tabular-nums leading-none">
                      {s.value}<span className="text-primary">{s.suffix}</span>
                    </p>
                    <p className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wider">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <ReleasesSection />
        {movies.length > 0 && <ContentSection id="filmes" title="FILMES" items={toCardFormat(movies, 'movie')} />}
        <AdBanner page="home" position="middle" />
        {series.length > 0 && <ContentSection id="series" title="SÉRIES" items={toCardFormat(series, 'series')} />}
        {!isLoading && movies.length === 0 && series.length === 0 && (
          <div className="text-center py-20">
            <p className="text-muted-foreground">Nenhum conteúdo adicionado ainda.</p>
            <p className="text-muted-foreground text-sm mt-2">
              Acesse o <a href="/admin" className="text-primary hover:underline">painel admin</a> para adicionar filmes e séries.
            </p>
          </div>
        )}
        <AdBanner page="home" position="bottom" />
      </div>
      <TelegramFloat />
      <CookieBanner />
      <Footer />

      {editItem && (
        <EditContentModal
          item={editItem.item}
          type={editItem.type}
          open={!!editItem}
          onClose={() => setEditItem(null)}
          onSaved={() => { void refetch(); setEditItem(null); }}
        />
      )}
    </div>
  );
};

export default Index;
