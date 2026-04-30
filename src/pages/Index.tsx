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

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['home-content'],
    queryFn: async () => {
      const MOVIE_FIELDS = 'id,title,year,rating,image_url,genre,is_release,created_at';
      const SERIES_FIELDS = 'id,title,year,rating,image_url,genre,is_release,is_anime,created_at';
      const CHANNEL_FIELDS = 'id,external_id,name,category,logo_url,is_active';
      const [moviesRes, seriesRes, animesRes, channelsRes,
             moviesCountRes, seriesCountRes, animesCountRes, channelsCountRes] = await Promise.all([
        supabase.from('movies').select(MOVIE_FIELDS).order('created_at', { ascending: false }).limit(HOME_LIMIT),
        supabase.from('series').select(SERIES_FIELDS).eq('is_anime', false).order('created_at', { ascending: false }).limit(HOME_LIMIT),
        supabase.from('series').select(SERIES_FIELDS).eq('is_anime', true).order('created_at', { ascending: false }).limit(HOME_LIMIT),
        supabase.from('tv_channels').select(CHANNEL_FIELDS).eq('is_active', true).order('name').limit(18),
        supabase.from('movies').select('id', { count: 'exact', head: true }),
        supabase.from('series').select('id', { count: 'exact', head: true }).eq('is_anime', false),
        supabase.from('series').select('id', { count: 'exact', head: true }).eq('is_anime', true),
        supabase.from('tv_channels').select('id', { count: 'exact', head: true }).eq('is_active', true),
      ]);
      return {
        movies: (moviesRes.data || []) as Movie[],
        series: (seriesRes.data || []) as Series[],
        animes: (animesRes.data || []) as Series[],
        channels: (channelsRes.data || []) as TvChannel[],
        counts: {
          movies: moviesCountRes.count ?? 0,
          series: seriesCountRes.count ?? 0,
          animes: animesCountRes.count ?? 0,
          channels: channelsCountRes.count ?? 0,
        },
      };
    },
    staleTime: 1000 * 60 * 10,
  });

  const movies = data?.movies || [];
  const series = data?.series || [];
  const animes = data?.animes || [];
  const channels = data?.channels || [];
  const counts = data?.counts || { movies: 0, series: 0, animes: 0, channels: 0 };

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
        {!isLoading && (movies.length > 0 || series.length > 0 || animes.length > 0 || channels.length > 0) && (
          <section className="container mx-auto px-4 py-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
              {[
                { icon: Film, label: "Filmes", value: movies.length, suffix: "+", to: "/filmes" },
                { icon: Tv, label: "Séries", value: series.length, suffix: "+", to: "/series" },
                { icon: Sparkles, label: "Animes", value: animes.length, suffix: "+", to: "/animes" },
                { icon: Radio, label: "Canais TV", value: channels.length, suffix: "+", to: "/canais" },
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
                    className="group relative block bg-gradient-to-br from-card/80 to-card/30 backdrop-blur-sm border border-border/60 hover:border-primary/40 rounded-xl px-3 py-3 md:px-4 md:py-4 flex items-center gap-3 transition-all hover:shadow-[0_0_20px_hsl(var(--primary)/0.2)] overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:via-transparent group-hover:to-primary/10 transition-all" />
                    <div className="relative w-9 h-9 md:w-11 md:h-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary/20 group-hover:scale-110 transition-all">
                      <s.icon className="h-4 w-4 md:h-5 md:w-5" />
                    </div>
                    <div className="relative min-w-0">
                      <p className="text-lg md:text-2xl font-bold text-foreground tabular-nums leading-none">
                        {s.value}<span className="text-primary">{s.suffix}</span>
                      </p>
                      <p className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wider mt-1">{s.label}</p>
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
          <section id="canais" className="py-12">
            <div className="container mx-auto px-4">
              <motion.div
                initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.5 }}
                className="flex items-center justify-between mb-6"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Radio className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="font-display text-3xl md:text-4xl text-foreground">CANAIS AO VIVO</h2>
                  <div className="hidden sm:block flex-1 h-px bg-gradient-to-r from-primary/20 to-transparent ml-4 min-w-[60px]" />
                </div>
                <Link to="/canais" className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors group">
                  Ver todos <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </motion.div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-9 gap-3">
                {channels.map((c, i) => (
                  <motion.div key={c.id}
                    initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }} transition={{ delay: i * 0.02, duration: 0.3 }}>
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
