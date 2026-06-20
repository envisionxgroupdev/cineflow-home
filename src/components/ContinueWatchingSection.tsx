import { Link } from 'react-router-dom';
import { Play, X, History } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useWatchHistory } from '@/hooks/useWatchHistory';
import { slugify } from '@/lib/utils';

export function ContinueWatchingSection() {
  const { user } = useAuth();
  const { items, remove } = useWatchHistory(14);

  if (!user || items.length === 0) return null;

  return (
    <section id="continuar-assistindo" className="py-8 md:py-10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
              <History className="h-4.5 w-4.5 text-primary" />
            </div>
            <div>
              <h2 className="font-display text-lg md:text-xl text-foreground leading-tight">
                Continuar Assistindo
              </h2>
              <p className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
                de onde você parou
              </p>
            </div>
          </div>
        </div>

        <div className="-mx-4 px-4 overflow-x-auto scrollbar-hide">
          <div className="flex gap-3 md:gap-4 pb-2">
            {items.map((item, idx) => {
              const href = item.content_type === 'movie'
                ? `/filme/assistir-${slugify(item.title)}-online-gratis`
                : `/serie/assistir-${slugify(item.title)}-online-gratis`;
              const epLabel = item.content_type === 'series' && item.season && item.episode
                ? `T${item.season} · E${item.episode}`
                : null;
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="group relative shrink-0 w-[150px] md:w-[180px]"
                >
                  <Link to={href} className="block">
                    <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-secondary/40 border border-border/40 shadow-lg shadow-black/30">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.title}
                          loading="lazy"
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-secondary to-background" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-xl shadow-primary/40">
                          <Play className="h-5 w-5 fill-current ml-0.5" />
                        </div>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-2.5 space-y-0.5">
                        {epLabel && (
                          <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/15 border border-primary/30 px-1.5 py-0.5 rounded">
                            {epLabel}
                          </span>
                        )}
                        <p className="text-xs md:text-sm font-semibold text-white line-clamp-2 leading-tight drop-shadow">
                          {item.title}
                        </p>
                      </div>
                      <div className="absolute top-1.5 left-1.5 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-black/60 text-white/90 backdrop-blur-sm">
                        {item.content_type === 'movie' ? 'Filme' : 'Série'}
                      </div>
                    </div>
                  </Link>
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); void remove(item.id); }}
                    aria-label="Remover do histórico"
                    className="absolute top-1.5 right-1.5 h-7 w-7 rounded-full bg-black/70 hover:bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
