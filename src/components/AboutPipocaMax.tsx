import { motion } from 'framer-motion';
import { Popcorn, Film, Tv, Sparkles } from 'lucide-react';

export function AboutPipocaMax() {
  return (
    <section className="relative py-16 md:py-24 overflow-hidden">
      {/* Decorative gradient blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute -top-20 -right-20 w-[300px] h-[300px] rounded-full bg-primary/5 blur-[100px]" />
      </div>

      <div className="container mx-auto px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="max-w-4xl mx-auto"
        >
          <div className="rounded-3xl border border-border/60 bg-gradient-to-br from-card/90 via-card/60 to-card/30 backdrop-blur-md p-8 md:p-12 shadow-2xl shadow-primary/5">
            {/* Logo / Brand */}
            <div className="flex items-center justify-center mb-6">
              <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/30">
                <Popcorn className="h-5 w-5 text-primary" />
                <span className="font-display text-lg tracking-[0.25em] text-primary">PIPOCAMAX</span>
              </div>
            </div>

            <h2 className="font-display text-3xl md:text-5xl text-center text-foreground mb-3 leading-tight">
              FILMES <span className="text-primary">ONLINE GRÁTIS</span>
            </h2>
            <p className="text-center text-sm md:text-base text-muted-foreground font-medium uppercase tracking-wider mb-8">
              Séries Online · Animes Online · Lançamentos em HD
            </p>

            {/* Feature row */}
            <div className="grid grid-cols-3 gap-3 mb-8">
              {[
                { icon: Film, label: 'Filmes' },
                { icon: Tv, label: 'Séries' },
                { icon: Sparkles, label: 'Animes' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex flex-col items-center gap-2 py-4 rounded-xl bg-foreground/5 border border-border/30">
                  <Icon className="h-5 w-5 text-primary" />
                  <span className="text-xs font-semibold text-foreground/80">{label}</span>
                </div>
              ))}
            </div>

            <div className="space-y-4 text-sm md:text-base text-muted-foreground leading-relaxed">
              <p className="text-xs text-muted-foreground/70 text-center">
                Palavras-chave: assistir filmes online grátis, séries online dublado HD, animes online legendado, lançamentos do cinema, melhor site de filmes e séries grátis.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
