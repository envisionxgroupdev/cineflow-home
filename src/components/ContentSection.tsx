import { motion } from "framer-motion";
import { MovieCard } from "./MovieCard";
import { ChevronRight } from "lucide-react";

interface ContentItem {
  id: string;
  title: string;
  year: string;
  rating: number;
  imageUrl: string;
  genre: string;
  type: "movie" | "series";
}

interface ContentSectionProps {
  id?: string;
  title: string;
  items: ContentItem[];
}

export function ContentSection({ id, title, items }: ContentSectionProps) {
  return (
    <section id={id} className="py-12">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-3xl md:text-4xl text-foreground">
            {title}
          </h2>
          <button className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors">
            Ver todos
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05, duration: 0.4 }}
            >
              <MovieCard {...item} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
