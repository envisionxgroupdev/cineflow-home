import { motion } from "framer-motion";
import { Play, Film, Tv, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import heroBg from "@/assets/hero-bg.jpg";

export function HeroSection() {
  return (
    <section className="relative h-[85vh] min-h-[500px] flex items-center overflow-hidden">
      {/* Background with Ken Burns effect */}
      <motion.div
        className="absolute inset-0"
        initial={{ scale: 1.15 }}
        animate={{ scale: 1 }}
        transition={{ duration: 20, ease: "easeOut" }}
      >
        <img src={heroBg} alt="Cinema" className="w-full h-full object-cover" />
      </motion.div>

      {/* Cinematic overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/30" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/50 to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(var(--primary)/0.1),_transparent_50%)]" />

      {/* Film grain */}
      <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iLjc1Ii8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsdGVyPSJ1cmwoI2EpIi8+PC9zdmc+')]" />

      {/* Content */}
      <div className="relative container mx-auto px-4">
        <div className="max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center gap-2 bg-primary/15 backdrop-blur-sm border border-primary/20 px-4 py-1.5 rounded-full mb-6"
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium text-primary tracking-wide">STREAMING GRÁTIS EM HD</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="font-display text-4xl md:text-6xl lg:text-7xl text-foreground leading-none mb-3"
            >
              SEUS FILMES E SÉRIES{" "}
              <span className="text-gradient-cinema">FAVORITOS</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="text-muted-foreground text-sm md:text-base max-w-md mb-8 leading-relaxed"
            >
              Assista aos melhores lançamentos do cinema e da TV, tudo em um só lugar — sem cadastro, sem complicação.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="flex flex-wrap items-center gap-3"
            >
              <Link to="/filmes" className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-lg font-semibold text-sm transition-all hover:shadow-[0_0_24px_hsl(var(--primary)/0.4)]">
                <Film className="h-4 w-4" />
                Filmes
              </Link>
              <Link to="/series" className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm border border-border/60 text-foreground hover:bg-secondary hover:border-border transition-all">
                <Tv className="h-4 w-4" />
                Séries
              </Link>
              <a href="#lancamentos" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2.5">
                <Play className="h-4 w-4" />
                Lançamentos
              </a>
            </motion.div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.6 }}
            className="flex items-center gap-6 mt-12 pt-6 border-t border-border/20"
          >
            {[
              { label: "Filmes", value: "1000+" },
              { label: "Séries", value: "500+" },
              { label: "Qualidade", value: "HD" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="font-display text-lg md:text-xl text-foreground">{stat.value}</p>
                <p className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Bottom strip */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
    </section>
  );
}
