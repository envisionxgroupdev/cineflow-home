import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { MovieCard } from "./MovieCard";
import { GenreFilter } from "./GenreFilter";
import { ChevronRight, ChevronLeft, Film, Tv, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

interface ContentItem {
  id: string;
  title: string;
  year: string;
  rating: number;
  imageUrl: string;
  genre: string;
  type: "movie" | "series";
  isAdmin?: boolean;
  onEdit?: () => void;
}

interface ContentSectionProps {
  id?: string;
  title: string;
  items: ContentItem[];
}

const META: Record<string, { icon: typeof Film; href: string }> = {
  filmes: { icon: Film, href: "/filmes" },
  series: { icon: Tv, href: "/series" },
  animes: { icon: Sparkles, href: "/animes" },
};

export function ContentSection({ id, title, items }: ContentSectionProps) {
  const meta = META[id || "filmes"] || META.filmes;
  const Icon = meta.icon;
  const [genre, setGenre] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const filtered = genre
    ? items.filter(item => (item.genre || '').split(',').map(g => g.trim()).includes(genre))
    : items;

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    checkScroll();
    const onResize = () => checkScroll();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [filtered.length]);

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'left' ? -el.clientWidth * 0.85 : el.clientWidth * 0.85, behavior: 'smooth' });
    setTimeout(checkScroll, 400);
  };

  return (
    <section id={id} className="py-8 md:py-12">
      <div className="container mx-auto px-3 sm:px-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between mb-4 md:mb-6 gap-3"
        >
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <div className="p-2 rounded-lg bg-primary/10 shrink-0">
              <Icon className="h-4 w-4 md:h-5 md:w-5 text-primary" />
            </div>
            <h2 className="font-display text-2xl md:text-4xl text-foreground truncate">{title}</h2>
            <div className="hidden md:block flex-1 h-px bg-gradient-to-r from-primary/20 to-transparent ml-4 min-w-[60px]" />
          </div>
          <Link to={meta.href} className="flex items-center gap-1 text-xs sm:text-sm text-primary hover:text-primary/80 transition-colors group shrink-0">
            Ver todos
            <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </motion.div>

        <GenreFilter items={items} selected={genre} onSelect={setGenre} />

        {filtered.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Nenhum resultado para este gênero.
          </div>
        ) : (
          <div className="relative group/carousel">
            {canLeft && (
              <button
                onClick={() => scroll('left')}
                aria-label="Anterior"
                className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-background/90 backdrop-blur-md border border-border/60 hover:border-primary/50 rounded-full p-2.5 opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 -translate-x-3 group-hover/carousel:translate-x-0 shadow-lg"
              >
                <ChevronLeft className="h-5 w-5 text-foreground" />
              </button>
            )}
            {canRight && (
              <button
                onClick={() => scroll('right')}
                aria-label="Próximo"
                className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-background/90 backdrop-blur-md border border-border/60 hover:border-primary/50 rounded-full p-2.5 opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 translate-x-3 group-hover/carousel:translate-x-0 shadow-lg"
              >
                <ChevronRight className="h-5 w-5 text-foreground" />
              </button>
            )}

            <div className="hidden md:block absolute left-0 top-0 bottom-0 w-10 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
            <div className="hidden md:block absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

            <div
              ref={scrollRef}
              onScroll={checkScroll}
              className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide -mx-3 sm:mx-0 px-3 sm:px-0"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {filtered.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: Math.min(index * 0.03, 0.3), duration: 0.4 }}
                  className="snap-start shrink-0 w-[42vw] xs:w-[40vw] sm:w-[200px] md:w-[210px] lg:w-[220px] xl:w-[230px] max-w-[230px]"
                >
                  <MovieCard {...item} />
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
