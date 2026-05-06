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

        {/* Stats strip */}
        {!isLoading && (counts.movies > 0 || counts.series > 0 || counts.animes > 0 || counts.channels > 0) && (
          <section className="container mx-auto px-3 sm:px-4 py-4 md:py-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
              {[
                { icon: Film, label: "Filmes", value: counts.movies, suffix: "", to: "/filmes" },
                { icon: Tv, label: "Séries", value: counts.series, suffix: "", to: "/series" },
                { icon: Sparkles, label: "Animes", value: counts.animes, suffix: "", to: "/animes" },
                { icon: Radio, label: "Canais TV", value: counts.channels, suffix: "", to: "/canais" },
              ].map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05, duration: 0.4 }}
                >
                  <Link
                    to={s.to}
                    className="group relative block bg-gradient-to-br from-card/80 to-card/30 backdrop-blur-sm border border-border/60 hover:border-primary/40 rounded-xl px-2.5 py-2.5 md:px-4 md:py-4 flex items-center gap-2 md:gap-3 transition-all hover:shadow-[0_0_20px_hsl(var(--primary)/0.2)] overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:via-transparent group-hover:to-primary/10 transition-all" />
                    <div className="relative w-8 h-8 md:w-11 md:h-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary/20 group-hover:scale-110 transition-all">
                      <s.icon className="h-4 w-4 md:h-5 md:w-5" />
                    </div>
                    <div className="relative min-w-0">
                      <p className="text-base md:text-2xl font-bold text-foreground tabular-nums leading-none">
                        {s.value}<span className="text-primary">{s.suffix}</span>
                      </p>
                      <p className="text-[9px] md:text-xs text-muted-foreground uppercase tracking-wider mt-1 truncate">{s.label}</p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        <ReleasesSection />
        {movies.length > 0 && <ContentSection id="filmes" title="FILMES" items={toCardFormat(movies, 'movie')} />}
        <AdBanner page="home" position="middle" />
        {series.length > 0 && <ContentSection id="series" title="SÉRIES" items={toCardFormat(series, 'series')} />}
        {animes.length > 0 && <ContentSection id="animes" title="ANIMES" items={toCardFormat(animes, 'series')} />}

        {channels.length > 0 && (
          <section id="canais" className="py-8 md:py-12">
            <div className="container mx-auto px-3 sm:px-4">
              <motion.div
                initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.5 }}
                className="flex items-center justify-between mb-4 md:mb-6 gap-3"
              >
                <div className="flex items-center gap-2 md:gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                    <Radio className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                  </div>
                  <h2 className="font-display text-2xl md:text-4xl text-foreground truncate">CANAIS AO VIVO</h2>
                  <div className="hidden md:block flex-1 h-px bg-gradient-to-r from-primary/20 to-transparent ml-4 min-w-[60px]" />
                </div>
                <Link to="/canais" className="flex items-center gap-1 text-xs sm:text-sm text-primary hover:text-primary/80 transition-colors group shrink-0">
                  Ver todos <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </motion.div>
              <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-9 gap-2 sm:gap-3">
                {channels.map((c, i) => (
                  <motion.div key={c.id}
                    initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }} transition={{ delay: Math.min(i * 0.02, 0.3), duration: 0.3 }}>
                    <ChannelCard
                      id={c.id} externalId={c.external_id} name={c.name}
                      category={c.category} logoUrl={c.logo_url}
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )}

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
