import { Star, Pencil } from "lucide-react";
import { Link } from "react-router-dom";
import { contentUrl } from "@/lib/utils";

interface MovieCardProps {
  id: string;
  title: string;
  year: string;
  rating: number;
  imageUrl: string;
  genre: string;
  type: "movie" | "series";
  isAdmin?: boolean;
  onEdit?: () => void;
  priority?: boolean;
}

export function MovieCard({ id, title, year, rating, imageUrl, genre, type, isAdmin, onEdit, priority = false }: MovieCardProps) {
  const href = contentUrl(type, id, title);

  return (
    <div className="group relative">
      <Link to={href} className="cinema-card-hover block">
        <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-secondary">
          <img
            src={imageUrl}
            alt={title}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            // @ts-expect-error fetchpriority is valid HTML, React types lag
            fetchpriority={priority ? "high" : "low"}
            sizes="(max-width: 640px) 42vw, (max-width: 1024px) 220px, 230px"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <span className="absolute top-2 left-2 bg-primary/90 text-primary-foreground text-[10px] font-bold uppercase px-2 py-0.5 rounded">
            {type === "movie" ? "Filme" : "Série"}
          </span>
          <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
              <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
              {rating.toFixed(1)}
              <span className="mx-1">•</span>
              {year}
            </div>
            <p className="text-xs text-muted-foreground">{genre}</p>
          </div>
        </div>
        <div className="mt-2">
          <h3 className="text-sm font-medium text-foreground truncate">{title}</h3>
          <p className="text-xs text-muted-foreground">{year}</p>
        </div>
      </Link>

      {isAdmin && onEdit && (
        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(); }}
          className="absolute top-2 right-2 z-10 p-1.5 bg-background/80 backdrop-blur-sm border border-border rounded-lg text-muted-foreground hover:text-primary hover:border-primary transition-colors opacity-0 group-hover:opacity-100"
          title="Editar">
          <Pencil className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
