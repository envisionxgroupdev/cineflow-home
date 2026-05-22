import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Play, ChevronLeft, ChevronRight } from "lucide-react";
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
  const words = item.title.split(" ");
  const half = Math.ceil(words.length / 2);
  const firstPart = words.slice(0, half).join(" ");
  const secondPart = words.slice(half).join(" ");

  return (
    <section className="relative h-[80vh] min-h-[540px] flex items-end overflow-hidden bg-background">
      {/* Backdrop carousel — editorial grayscale */}
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
            className="w-full h-full object-cover grayscale opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Film grain */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iLjc1Ii8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsdGVyPSJ1cmwoI2EpIi8+PC9zdmc+')]" />

      {/* Editorial content */}
      <div className="relative z-10 container mx-auto px-5 md:px-8 pb-10 md:pb-14 w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={item.id + "-info"}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5 }}
          >
            {/* Eyebrow */}
            <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
              <div className="w-8 md:w-12 h-px bg-primary" />
              <span className="text-[10px] uppercase tracking-[0.4em] font-semibold text-primary">
                {item.type === "movie" ? "Filme em Destaque" : "Série em Destaque"}
              </span>
            </div>

            {/* Editorial title with watermark */}
            <div className="relative">
              <span
                aria-hidden
                className="absolute -top-6 md:-top-12 -left-1 md:-left-4 text-6xl md:text-9xl opacity-[0.06] font-bold pointer-events-none select-none uppercase whitespace-nowrap font-display"
              >
                Featured
              </span>
              <h1 className="relative font-display text-5xl md:text-8xl lg:text-9xl leading-[0.85] uppercase tracking-tighter mb-4 text-foreground">
                {firstPart}
                {secondPart && (
                  <>
                    <br />
                    <span className="text-primary">{secondPart}</span>
                  </>
                )}
              </h1>
            </div>

            {/* Meta + synopsis */}
            <div className="flex flex-wrap items-center gap-4 md:gap-6 mt-6 md:mt-8">
              <div className="flex items-center gap-2 bg-foreground/5 border border-foreground/10 px-3 py-1">
                {item.genre && (
                  <>
                    <span className="text-primary text-xs font-bold uppercase">{item.genre.split(",")[0]}</span>
                    <span className="text-foreground/30">|</span>
                  </>
                )}
                {item.year && <span className="text-xs font-medium">{item.year}</span>}
                {item.rating > 0 && (
                  <>
                    <span className="text-foreground/30">|</span>
                    <span className="text-yellow-400 text-xs font-bold">{item.rating.toFixed(1)}</span>
                  </>
                )}
              </div>
              {item.overview && (
                <p className="max-w-md text-sm text-muted-foreground font-light leading-snug line-clamp-2">
                  {item.overview}
                </p>
              )}
            </div>

            {/* CTA */}
            <Link
              to={contentUrl(item.type, item.id, item.title)}
              className="mt-8 md:mt-10 inline-flex items-center gap-4 bg-primary hover:bg-accent text-primary-foreground px-8 md:px-10 py-4 font-bold uppercase text-[10px] tracking-[0.2em] transition-all hover:-translate-y-1"
            >
              Assistir Agora
              <Play className="h-4 w-4 fill-current" />
            </Link>
          </motion.div>
        </AnimatePresence>

        {/* Carousel indicators */}
        <div className="mt-8 md:mt-12 flex items-center gap-3 md:gap-4">
          <div className="flex gap-2">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                aria-label={`Slide ${i + 1}`}
                className={`h-0.5 transition-all ${i === current ? "w-8 bg-primary" : "w-4 bg-foreground/20 hover:bg-foreground/40"}`}
              />
            ))}
          </div>
          <span className="text-[10px] uppercase font-bold text-foreground/40 tracking-widest whitespace-nowrap">
            {String(current + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
          </span>
          <div className="flex-1" />
          <button
            onClick={() => go(-1)}
            aria-label="Anterior"
            className="p-2 border border-foreground/15 text-foreground/70 hover:text-foreground hover:border-primary transition-all"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => go(1)}
            aria-label="Próximo"
            className="p-2 border border-foreground/15 text-foreground/70 hover:text-foreground hover:border-primary transition-all"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
