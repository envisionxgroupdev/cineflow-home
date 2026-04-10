import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { contentUrl } from "@/lib/utils";
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
  const [items, setItems] = useState<HeroItem[]>([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    loadFeatured();
  }, []);

  // Auto-advance every 6s
  useEffect(() => {
    if (items.length <= 1) return;
    const timer = setInterval(() => setCurrent((c) => (c + 1) % items.length), 6000);
    return () => clearInterval(timer);
  }, [items.length]);

  const loadFeatured = async () => {
    const [moviesRes, seriesRes] = await Promise.all([
      supabase.from("movies").select("*").not("backdrop_url", "is", null).order("created_at", { ascending: false }).limit(5),
      supabase.from("series").select("*").not("backdrop_url", "is", null).order("created_at", { ascending: false }).limit(5),
    ]);

    const toHero = (items: (Movie | Series)[], type: "movie" | "series"): HeroItem[] =>
      items
        .filter((i) => i.backdrop_url)
        .map((i) => ({
          id: i.id,
          title: i.title,
          overview: i.overview,
          backdrop: i.backdrop_url!,
          poster: i.image_url || "/placeholder.svg",
          rating: i.rating,
          year: i.year || "",
          genre: i.genre || "",
          type,
        }));

    const all = [
      ...toHero((moviesRes.data || []) as Movie[], "movie"),
      ...toHero((seriesRes.data || []) as Series[], "series"),
    ].slice(0, 8);

    setItems(all);
  };

  const go = useCallback(
    (dir: number) => {
      if (items.length === 0) return;
      setCurrent((c) => (c + dir + items.length) % items.length);
    },
    [items.length]
  );

  const item = items[current];

  // Fallback while loading or no data
  if (items.length === 0) {
    return (
      <section className="relative h-[70vh] min-h-[400px] flex items-center overflow-hidden bg-background">
        <div className="absolute inset-0 bg-gradient-to-t from-background to-background/50" />
        <div className="relative container mx-auto px-4 text-center">
          <h1 className="font-display text-4xl md:text-6xl text-foreground mb-4">CINEFLOW</h1>
          <p className="text-muted-foreground">Filmes e séries online grátis em HD</p>
        </div>
      </section>
    );
  }

  return (
    <section className="relative h-[70vh] min-h-[420px] md:h-[80vh] flex items-end overflow-hidden">
      {/* Backdrop carousel */}
      <AnimatePresence mode="wait">
        <motion.div
          key={item.id}
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <img
            src={item.backdrop}
            alt={item.title}
            className="w-full h-full object-cover"
          />
        </motion.div>
      </AnimatePresence>

      {/* Cinematic overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/40 to-transparent" />

      {/* Film grain */}
      <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iLjc1Ii8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsdGVyPSJ1cmwoI2EpIi8+PC9zdmc+')]" />

      {/* Content */}
      <div className="relative container mx-auto px-4 pb-10 md:pb-16 z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={item.id + "-info"}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5 }}
            className="max-w-xl"
          >
            {/* Badge */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-bold uppercase tracking-widest bg-primary/20 text-primary px-2.5 py-1 rounded">
                {item.type === "movie" ? "Filme" : "Série"}
              </span>
              {item.genre && (
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  {item.genre.split(",")[0]}
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="font-display text-3xl md:text-5xl lg:text-6xl text-foreground leading-tight mb-3">
              {item.title}
            </h1>

            {/* Meta */}
            <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
              {item.year && <span>{item.year}</span>}
              {item.rating > 0 && (
                <span className="flex items-center gap-1 text-yellow-400">
                  <Star className="h-3.5 w-3.5 fill-current" />
                  {item.rating.toFixed(1)}
                </span>
              )}
            </div>

            {/* Overview */}
            {item.overview && (
              <p className="text-muted-foreground text-sm md:text-base line-clamp-2 md:line-clamp-3 mb-6 max-w-md leading-relaxed">
                {item.overview}
              </p>
            )}

            {/* CTA */}
            <Link
              to={contentUrl(item.type, item.id, item.title)}
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg font-semibold text-sm transition-all hover:shadow-[0_0_24px_hsl(var(--primary)/0.4)]"
            >
              <Play className="h-4 w-4 fill-current" />
              Assistir Agora
            </Link>
          </motion.div>
        </AnimatePresence>

        {/* Navigation arrows + dots */}
        <div className="flex items-center justify-between mt-8">
          {/* Dots */}
          <div className="flex items-center gap-2">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-1 rounded-full transition-all duration-300 ${
                  i === current
                    ? "w-6 bg-primary"
                    : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                }`}
              />
            ))}
          </div>

          {/* Arrows */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => go(-1)}
              className="p-2 rounded-full border border-border/40 text-foreground/70 hover:text-foreground hover:border-border transition-all"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => go(1)}
              className="p-2 rounded-full border border-border/40 text-foreground/70 hover:text-foreground hover:border-border transition-all"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom strip */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
    </section>
  );
}
