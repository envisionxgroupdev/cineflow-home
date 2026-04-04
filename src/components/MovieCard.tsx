import { Star } from "lucide-react";

interface MovieCardProps {
  title: string;
  year: string;
  rating: number;
  imageUrl: string;
  genre: string;
  type: "movie" | "series";
}

export function MovieCard({ title, year, rating, imageUrl, genre, type }: MovieCardProps) {
  return (
    <div className="group relative cinema-card-hover cursor-pointer">
      <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-secondary">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Badge */}
        <span className="absolute top-2 left-2 bg-primary/90 text-primary-foreground text-[10px] font-bold uppercase px-2 py-0.5 rounded">
          {type === "movie" ? "Filme" : "Série"}
        </span>

        {/* Hover info */}
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
    </div>
  );
}
