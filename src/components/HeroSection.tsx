import { motion } from "framer-motion";
import { Play, Star } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

export function HeroSection() {
  return (
    <section className="relative h-[85vh] min-h-[500px] flex items-end overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img
          src={heroBg}
          alt="Cinema"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative container mx-auto px-4 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-2xl"
        >
          <div className="flex items-center gap-2 mb-4">
            <span className="bg-primary px-3 py-1 rounded-sm text-xs font-semibold text-primary-foreground uppercase tracking-wider">
              Em destaque
            </span>
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              8.7
            </span>
          </div>

          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl text-foreground leading-none mb-4">
            EXPERIÊNCIA{" "}
            <span className="text-gradient-cinema">CINEMATOGRÁFICA</span>
          </h1>

          <p className="text-muted-foreground text-base md:text-lg max-w-lg mb-8 leading-relaxed">
            Descubra os melhores filmes e séries. Acompanhe lançamentos, explore
            sinopses e mergulhe no universo do cinema.
          </p>

          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg font-semibold transition-colors">
              <Play className="h-5 w-5" />
              Explorar
            </button>
            <button className="px-6 py-3 rounded-lg font-semibold border border-border text-foreground hover:bg-secondary transition-colors">
              Lançamentos
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
