import { motion } from "framer-motion";
import { Play, Star, TrendingUp } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

export function HeroSection() {
  return (
    <section className="relative h-[85vh] min-h-[500px] flex items-end overflow-hidden">
      {/* Background with Ken Burns effect */}
      <motion.div
        className="absolute inset-0"
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 12, ease: "easeOut" }}
      >
        <img
          src={heroBg}
          alt="Cinema"
          className="w-full h-full object-cover"
        />
      </motion.div>

      {/* Cinematic overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/20" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/40 to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(var(--primary)/0.08),_transparent_60%)]" />

      {/* Film grain overlay */}
      <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iLjc1Ii8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsdGVyPSJ1cmwoI2EpIi8+PC9zdmc+')]" />

      {/* Content */}
      <div className="relative container mx-auto px-4 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-2xl"
        >
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="flex items-center gap-3 mb-4"
          >
            <span className="bg-primary/90 backdrop-blur-sm px-3 py-1 rounded-sm text-xs font-semibold text-primary-foreground uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="h-3 w-3" />
              Em destaque
            </span>
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              8.7
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-5xl md:text-7xl lg:text-8xl text-foreground leading-none mb-4"
          >
            EXPERIÊNCIA{" "}
            <span className="text-gradient-cinema">CINEMATOGRÁFICA</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="text-muted-foreground text-base md:text-lg max-w-lg mb-8 leading-relaxed"
          >
            Descubra os melhores filmes e séries. Acompanhe lançamentos, explore
            sinopses e mergulhe no universo do cinema.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="flex items-center gap-4"
          >
            <a href="#lancamentos" className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg font-semibold transition-all hover:shadow-[0_0_20px_hsl(var(--primary)/0.4)]">
              <Play className="h-5 w-5" />
              Explorar
            </a>
            <a href="#filmes" className="px-6 py-3 rounded-lg font-semibold border border-border/60 text-foreground hover:bg-secondary hover:border-border transition-all">
              Catálogo
            </a>
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom cinema strip */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
    </section>
  );
}
