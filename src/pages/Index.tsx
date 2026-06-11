import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { ContentSection } from "@/components/ContentSection";
import { ReleasesSection } from "@/components/ReleasesSection";
import { Top10Section } from "@/components/Top10Section";
import { TopTodaySection } from "@/components/TopTodaySection";
import { NovidadesSection } from "@/components/NovidadesSection";

import { Footer } from "@/components/Footer";
import { EditContentModal } from "@/components/EditContentModal";
import { AdBanner } from "@/components/AdBanner";
import { SplashLoader } from "@/components/SplashLoader";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Movie, Series } from "@/types/database";
import type { TvChannel } from "@/types/channel";
import { TelegramFloat } from "@/components/TelegramFloat";
import { ChannelCard } from "@/components/ChannelCard";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Film, Tv, Sparkles, Radio, ChevronRight } from "lucide-react";

const HOME_LIMIT = 12;

const Index = () => {
  const { isAdmin } = useAuth();
  const [editItem, setEditItem] = useState<{ item: Movie | Series; type: 'movie' | 'series' } | null>(null);

  const MOVIE_FIELDS = 'id,title,year,rating,image_url,genre,is_release,created_at';
  const SERIES_FIELDS = 'id,title,year,rating,image_url,genre,is_release,is_anime,created_at';
  const CHANNEL_FIELDS = 'id,external_id,name,category,logo_url,is_active';

  // Above-the-fold: movies + series (fast first paint)
  const { data: primary, isLoading, refetch: refetchPrimary } = useQuery({
    queryKey: ['home-primary'],
    queryFn: async () => {
      const [moviesRes, seriesRes] = await Promise.all([
        supabase.from('movies').select(MOVIE_FIELDS).order('created_at', { ascending: false }).limit(HOME_LIMIT),
        supabase.from('series').select(SERIES_FIELDS).eq('is_anime', false).order('created_at', { ascending: false }).limit(HOME_LIMIT),
      ]);
      return {
        movies: (moviesRes.data || []) as Movie[],
        series: (seriesRes.data || []) as Series[],
      };
    },
    staleTime: 1000 * 60 * 10,
  });

  // Secondary: animes + channels (deferred)
  const { data: secondary, refetch: refetchSecondary } = useQuery({
    queryKey: ['home-secondary'],
    queryFn: async () => {
      const [animesRes, channelsRes] = await Promise.all([
        supabase.from('series').select(SERIES_FIELDS).eq('is_anime', true).order('created_at', { ascending: false }).limit(HOME_LIMIT),
        supabase.from('tv_channels').select(CHANNEL_FIELDS).eq('is_active', true).order('name').limit(18),
      ]);
      return {
        animes: (animesRes.data || []) as Series[],
        channels: (channelsRes.data || []) as TvChannel[],
      };
    },
    staleTime: 1000 * 60 * 10,
  });

  // Counts: cheap head queries, separate
  const { data: counts = { movies: 0, series: 0, animes: 0, channels: 0 } } = useQuery({
    queryKey: ['home-counts'],
    queryFn: async () => {
      const [m, s, a, c] = await Promise.all([
        supabase.from('movies').select('id', { count: 'exact', head: true }),
        supabase.from('series').select('id', { count: 'exact', head: true }).eq('is_anime', false),
        supabase.from('series').select('id', { count: 'exact', head: true }).eq('is_anime', true),
        supabase.from('tv_channels').select('id', { count: 'exact', head: true }).eq('is_active', true),
      ]);
      return { movies: m.count ?? 0, series: s.count ?? 0, animes: a.count ?? 0, channels: c.count ?? 0 };
    },
    staleTime: 1000 * 60 * 10,
  });

  const refetch = () => { void refetchPrimary(); void refetchSecondary(); };

  const movies = primary?.movies || [];
  const series = primary?.series || [];
  const animes = secondary?.animes || [];
  const channels = secondary?.channels || [];

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

        <TopTodaySection />
        <ReleasesSection />
        <NovidadesSection />
        <Top10Section />
        {movies.length > 0 && <ContentSection id="filmes" title="FILMES" items={toCardFormat(movies, 'movie')} />}
        <AdBanner page="home" position="middle" />
        {series.length > 0 && <ContentSection id="series" title="SÉRIES" items={toCardFormat(series, 'series')} />}
        {animes.length > 0 && <ContentSection id="animes" title="ANIMES" items={toCardFormat(animes, 'series')} />}

        {!isLoading && movies.length === 0 && series.length === 0 && animes.length === 0 && channels.length === 0 && (
          <div className="text-center py-20">
            <p className="text-muted-foreground">Nenhum conteúdo adicionado ainda.</p>
            <p className="text-muted-foreground text-sm mt-2">
              Acesse o <a href="/admin" className="text-primary hover:underline">painel admin</a> para adicionar conteúdo.
            </p>
          </div>
        )}
        <AdBanner page="home" position="bottom" />
      </div>
      <TelegramFloat />
      
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
