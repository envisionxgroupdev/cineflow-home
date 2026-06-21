import { Star, Pencil, Play } from "lucide-react";
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

export function MovieCard({ id, title, year, rating, imageUrl, type, isAdmin, onEdit, priority = false }: MovieCardProps) {
  const href = contentUrl(type, id, title);

  return (
    <div className="group relative">
      <Link to={href} className="block">
        <div className="relative aspect-[2/3] rounded-md overflow-hidden bg-secondary ring-1 ring-border/40 group-hover:ring-primary/60 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_12px_30px_-10px_hsl(var(--primary)/0.55)]">
          <img
            src={imageUrl}
            alt={`Pôster de ${title}${year ? ` (${year})` : ''} — assistir ${type === 'movie' ? 'filme' : 'série'} online`}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            // @ts-expect-error fetchpriority is valid HTML, React types lag
            fetchpriority={priority ? "high" : "low"}
            sizes="(max-width: 640px) 42vw, (max-width: 1024px) 220px, 230px"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />

          {/* Rating badge (Vizer-style: always visible, top-right) */}
          {rating > 0 && (
            <div className="absolute top-1.5 right-1.5 flex items-center gap-1 bg-background/85 backdrop-blur-sm px-1.5 py-0.5 rounded text-[10px] font-semibold text-foreground">
              <Star className="h-2.5 w-2.5 text-primary fill-primary" />
              {rating.toFixed(1)}
            </div>
          )}

          {/* Play overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
            <div className="flex items-center justify-center w-11 h-11 rounded-full bg-primary text-primary-foreground shadow-[0_0_24px_hsl(var(--primary)/0.65)] scale-75 group-hover:scale-100 transition-transform duration-300">
              <Play className="h-5 w-5 fill-current ml-0.5" />
            </div>
          </div>
        </div>
      </Link>

      {isAdmin && onEdit && (
        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(); }}
          className="absolute top-1.5 left-1.5 z-10 p-1.5 bg-background/80 backdrop-blur-sm border border-border rounded-md text-muted-foreground hover:text-primary hover:border-primary transition-colors opacity-0 group-hover:opacity-100"
          title="Editar">
          <Pencil className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
