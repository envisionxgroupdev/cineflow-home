import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Bookmark, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { contentUrl } from "@/lib/utils";
import { HeroSkeleton } from "@/components/HeroSkeleton";
import type { Movie, Series } from "@/types/database";

interface HeroItem {
  id: string;
  title: string;
  overview: string | null;
  backdrop: string;
  poster: string;
  rating: number;
  year: string;
  genre: string;
  runtime?: number | null;
  type: "movie" | "series";
}

export function HeroSection() {
  const [current, setCurrent] = useState(0);

  const { data: items = [], isLoading: loading } = useQuery({
    queryKey: ['home-hero'],
    queryFn: async (): Promise<HeroItem[]> => {
      const [moviesRes, seriesRes] = await Promise.all([
        supabase.from("movies").select("id,title,overview,image_url,backdrop_url,rating,year,genre").not("backdrop_url", "is", null).order("created_at", { ascending: false }).limit(5),
        supabase.from("series").select("id,title,overview,image_url,backdrop_url,rating,year,genre").not("backdrop_url", "is", null).order("created_at", { ascending: false }).limit(5),
      ]);
      const toHero = (arr: Partial<Movie | Series>[], type: "movie" | "series"): HeroItem[] =>
        arr.filter(i => i.backdrop_url).map(i => ({
          id: i.id!,
          title: i.title!,
          overview: i.overview ?? null,
          backdrop: i.backdrop_url!,
          poster: i.image_url || "/placeholder.svg",
          rating: i.rating ?? 0,
          year: i.year || "",
          genre: i.genre || "",
          type,
        }));
      return [
        ...toHero(moviesRes.data || [], "movie"),
        ...toHero(seriesRes.data || [], "series"),
      ].slice(0, 8);
    },
    staleTime: 1000 * 60 * 10,
  });

  useEffect(() => {
    if (items.length <= 1) return;
    const timer = setInterval(() => setCurrent((c) => (c + 1) % items.length), 7000);
    return () => clearInterval(timer);
  }, [items.length]);

  const go = useCallback(
    (i: number) => {
      if (items.length === 0) return;
      setCurrent(((i % items.length) + items.length) % items.length);
    },
    [items.length]
  );

  if (loading) return <HeroSkeleton />;

  if (items.length === 0) {
    return (
      <section className="relative h-[70vh] min-h-[400px] flex items-center overflow-hidden bg-background">
        <div className="relative container mx-auto px-4 text-center">
          <h1 className="font-display text-4xl md:text-6xl text-foreground mb-4">PIPOCAMAX</h1>
          <p className="text-muted-foreground">Filmes e séries online grátis em HD</p>
        </div>
      </section>
    );
  }

  const item = items[current];
  const ratingPct = Math.max(0, Math.min(100, (item.rating / 10) * 100));
  const genres = item.genre ? item.genre.split(",").map(g => g.trim()).filter(Boolean).slice(0, 3) : [];

  return (
    <section className="relative min-h-[600px] md:min-h-[680px] flex items-center justify-center overflow-hidden bg-background py-12 md:py-20">
      {/* Backdrop blurred & darkened */}
      <AnimatePresence mode="wait">
        <motion.div
          key={item.id}
          className="absolute inset-0 z-0"
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        >
          <img
            src={item.backdrop}
            alt={item.title}
            width={1920}
            height={1080}
            fetchPriority="high"
            decoding="async"
            className="w-full h-full object-cover scale-110 blur-xl opacity-50"
          />
          {/* Vignette + darken to centre */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,hsl(var(--background)/0.6)_55%,hsl(var(--background))_100%)]" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/60" />
          {/* Red glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.12),transparent_60%)]" />
        </motion.div>
      </AnimatePresence>

      {/* Centered content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={item.id + "-info"}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl mx-auto flex flex-col items-center"
          >
            {/* Title */}
            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl text-foreground leading-[0.95] mb-6 drop-shadow-[0_4px_24px_hsl(var(--primary)/0.4)]">
              {item.title}
            </h1>

            {/* Meta line: year • clock • runtime • stars */}
            <div className="flex items-center justify-center gap-3 md:gap-4 text-sm text-foreground/80 mb-5 flex-wrap">
              {item.year && <span className="font-medium">{item.year}</span>}
              {item.year && item.rating > 0 && <span className="text-foreground/30">•</span>}
              {item.rating > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  {/* 5 stars with red fill % */}
                  <span className="relative inline-block">
                    <span className="flex gap-0.5 text-foreground/15">
                      {[0, 1, 2, 3, 4].map(i => <Star key={i} className="h-3.5 w-3.5 fill-current" />)}
                    </span>
                    <span
                      className="absolute inset-0 overflow-hidden text-primary"
                      style={{ width: `${ratingPct}%` }}
                    >
                      <span className="flex gap-0.5">
                        {[0, 1, 2, 3, 4].map(i => <Star key={i} className="h-3.5 w-3.5 fill-current" />)}
                      </span>
                    </span>
                  </span>
                  <span className="text-foreground/70 text-xs">{item.rating.toFixed(1)}</span>
                </span>
              )}
            </div>

            {/* Genre chips */}
            {genres.length > 0 && (
              <div className="flex items-center justify-center flex-wrap gap-2 mb-5">
                {genres.map(g => (
                  <span
                    key={g}
                    className="px-3 py-1 rounded-full text-xs font-medium bg-foreground/10 text-foreground/80 border border-foreground/10 backdrop-blur-sm"
                  >
                    {g}
                  </span>
                ))}
              </div>
            )}

            {/* Overview */}
            {item.overview && (
              <p className="text-muted-foreground text-sm md:text-base line-clamp-3 mb-8 max-w-xl leading-relaxed">
                {item.overview}
              </p>
            )}

            {/* CTAs — pills */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                to={contentUrl(item.type, item.id, item.title)}
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-7 py-3 rounded-full font-semibold text-sm transition-all hover:scale-[1.03] shadow-[0_8px_30px_-4px_hsl(var(--primary)/0.5)]"
              >
                <Play className="h-4 w-4 fill-current" />
                Assistir {item.type === "movie" ? "Filme" : "Série"}
              </Link>
              <button
                type="button"
                className="inline-flex items-center gap-2 bg-foreground/10 hover:bg-foreground/15 backdrop-blur-md text-foreground px-7 py-3 rounded-full font-semibold text-sm transition-all border border-foreground/15"
              >
                <Bookmark className="h-4 w-4" />
                Listar
              </button>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Dot indicators */}
        <div className="mt-10 md:mt-12 flex items-center justify-center gap-2">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => go(i)}
              aria-label={`Slide ${i + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === current ? "w-6 bg-primary" : "w-2 bg-foreground/25 hover:bg-foreground/40"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
