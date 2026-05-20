import { Link } from "react-router-dom";
import { Tv, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";

interface ChannelCardProps {
  id: string;
  externalId: string;
  name: string;
  category: string | null;
  logoUrl: string | null;
  isAdmin?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function ChannelCard({ id, externalId, name, category, logoUrl, isAdmin, onEdit, onDelete }: ChannelCardProps) {
  const [imgError, setImgError] = useState(false);
  const proxied = logoUrl ? `https://images.weserv.nl/?url=${encodeURIComponent(logoUrl.replace(/^https?:\/\//, ''))}&w=240&h=240&fit=contain&output=webp` : null;
  return (
    <div className="group relative">
      <Link to={`/canal/${externalId}`} className="block">
        <div className="relative aspect-square rounded-xl overflow-hidden bg-card border border-border group-hover:border-primary/60 transition-colors flex items-center justify-center p-4">
          {logoUrl && !imgError ? (
            <img
              src={proxied!}
              alt={name}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              className="max-w-full max-h-full object-contain transition-transform duration-300 group-hover:scale-105"
              onError={(e) => {
                const img = e.currentTarget;
                if (img.src !== logoUrl) {
                  img.src = logoUrl;
                } else {
                  setImgError(true);
                }
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <Tv className="h-10 w-10" />
              <span className="text-[9px] uppercase tracking-wider text-center px-1 line-clamp-2">{name}</span>
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/95 via-background/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <p className="text-[10px] uppercase tracking-wider text-primary font-bold">Ao vivo</p>
          </div>
        </div>
        <div className="mt-2">
          <h3 className="text-xs font-medium text-foreground truncate">{name}</h3>
          {category && <p className="text-[10px] text-muted-foreground truncate">{category}</p>}
        </div>
      </Link>

      {isAdmin && (
        <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(); }}
              className="p-1.5 bg-background/80 backdrop-blur-sm border border-border rounded-md text-muted-foreground hover:text-primary hover:border-primary"
              title="Editar">
              <Pencil className="h-3 w-3" />
            </button>
          )}
          {onDelete && (
            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(); }}
              className="p-1.5 bg-background/80 backdrop-blur-sm border border-border rounded-md text-muted-foreground hover:text-destructive hover:border-destructive"
              title="Excluir">
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
