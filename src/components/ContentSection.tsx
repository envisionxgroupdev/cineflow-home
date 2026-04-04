import { motion } from "framer-motion";
import { MovieCard } from "./MovieCard";
import { ChevronRight, Film, Tv } from "lucide-react";

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

export function ContentSection({ id, title, items }: ContentSectionProps) {
  const isMovies = id === 'filmes';
  const Icon = isMovies ? Film : Tv;

  return (
    <section id={id} className="py-12">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between mb-6"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <h2 className="font-display text-3xl md:text-4xl text-foreground">{title}</h2>
            <div className="hidden sm:block flex-1 h-px bg-gradient-to-r from-primary/20 to-transparent ml-4 min-w-[60px]" />
          </div>
          <Link to={isMovies ? '/filmes' : '/series'} className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors group">
            Ver todos
            <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </motion.div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {items.map((item, index) => (
            <motion.div key={item.id}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: index * 0.04, duration: 0.4 }}>
              <MovieCard {...item} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
