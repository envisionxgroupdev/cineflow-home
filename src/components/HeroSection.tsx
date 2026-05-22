import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Star, ChevronLeft, ChevronRight, Info } from "lucide-react";
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
    (dir: number) => {
      if (items.length === 0) return;
      setCurrent((c) => (c + dir + items.length) % items.length);
    },
    [items.length]
  );

  if (loading) return <HeroSkeleton />;

  if (items.length === 0) {
    return (
      <section className="relative h-[70vh] min-h-[400px] flex items-center overflow-hidden bg-background">
        <div className="absolute inset-0 bg-gradient-to-t from-background to-background/50" />
        <div className="relative container mx-auto px-4 text-center">
          <h1 className="font-display text-4xl md:text-6xl text-foreground mb-4">PIPOCAMAX</h1>
          <p className="text-muted-foreground">Filmes e séries online grátis em HD</p>
        </div>
      </section>
    );
  }

  const item = items[current];

  return (
    <section className="relative h-[85vh] min-h-[520px] md:h-[88vh] flex items-end overflow-hidden">
      {/* Backdrop full bleed */}
      <AnimatePresence mode="wait">
        <motion.div
          key={item.id}
          className="absolute inset-0 z-0"
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <img
            src={item.backdrop}
            alt={item.title}
            width={1920}
            height={1080}
            fetchPriority="high"
            decoding="async"
            className="w-full h-full object-cover"
          />
        </motion.div>
      </AnimatePresence>

      {/* Overlays: bottom + left gradient for readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/85 via-background/30 to-transparent" />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 pb-10 md:pb-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={item.id + "-info"}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl"
          >
            {/* Type badge */}
            <span className="inline-block text-[10px] font-bold uppercase tracking-widest bg-primary text-primary-foreground px-2.5 py-1 rounded mb-3">
              {item.type === "movie" ? "Filme" : "Série"}
            </span>

            {/* Title */}
            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl text-foreground leading-[0.95] mb-4 drop-shadow-lg">
              {item.title}
            </h1>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-3 md:gap-4 text-sm text-foreground/80 mb-4">
              {item.rating > 0 && (
                <span className="flex items-center gap-1 text-yellow-400 font-semibold">
                  <Star className="h-4 w-4 fill-current" />
                  {item.rating.toFixed(1)}
                </span>
              )}
              {item.year && <span>{item.year}</span>}
              {item.genre && (
                <span className="text-muted-foreground">
                  {item.genre.split(",").slice(0, 3).join(" • ")}
                </span>
              )}
            </div>

            {/* Overview */}
            {item.overview && (
              <p className="text-muted-foreground text-sm md:text-base line-clamp-3 mb-6 max-w-xl leading-relaxed">
                {item.overview}
              </p>
            )}

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3">
              <Link
                to={contentUrl(item.type, item.id, item.title)}
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-7 py-3 rounded-md font-bold text-sm transition-all hover:scale-[1.02] shadow-lg shadow-primary/30"
              >
                <Play className="h-4 w-4 fill-current" />
                Assistir
              </Link>
              <Link
                to={contentUrl(item.type, item.id, item.title)}
                className="inline-flex items-center gap-2 bg-foreground/10 hover:bg-foreground/20 backdrop-blur-md text-foreground px-7 py-3 rounded-md font-bold text-sm transition-all border border-foreground/20"
              >
                <Info className="h-4 w-4" />
                Mais Info
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation arrows + dots */}
        <div className="flex items-center justify-between mt-8">
          <div className="flex items-center gap-2">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                aria-label={`Slide ${i + 1}`}
                className={`h-1 rounded-full transition-all duration-300 ${
                  i === current ? "w-6 bg-primary" : "w-2 bg-foreground/30 hover:bg-foreground/50"
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => go(-1)}
              aria-label="Anterior"
              className="p-2 rounded-full bg-background/40 backdrop-blur-md border border-foreground/15 text-foreground/80 hover:text-foreground hover:bg-background/60 transition-all"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => go(1)}
              aria-label="Próximo"
              className="p-2 rounded-full bg-background/40 backdrop-blur-md border border-foreground/15 text-foreground/80 hover:text-foreground hover:bg-background/60 transition-all"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
