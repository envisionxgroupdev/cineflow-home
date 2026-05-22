import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const BRANDS = [
  { label: 'Netflix', q: 'netflix' },
  { label: 'Disney', q: 'disney' },
  { label: 'Max', q: 'max' },
  { label: 'Marvel', q: 'marvel' },
  { label: 'DC', q: 'dc' },
  { label: '007', q: '007' },
  { label: 'Star Wars', q: 'star wars' },
  { label: 'Pixar', q: 'pixar' },
];

export function BrandsRow() {
  return (
    <section className="py-8 md:py-10">
      <div className="container mx-auto px-4">
        <div className="flex gap-3 md:gap-4 overflow-x-auto pb-2 snap-x" style={{ scrollbarWidth: 'none' }}>
          {BRANDS.map((b, i) => (
            <motion.div
              key={b.label}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: Math.min(i * 0.04, 0.25), duration: 0.35 }}
              className="snap-start"
            >
              <Link
                to={`/buscar?q=${encodeURIComponent(b.q)}`}
                className="group flex items-center justify-center shrink-0 w-32 sm:w-40 md:w-48 h-20 sm:h-24 rounded-2xl bg-foreground/[0.04] border border-foreground/10 hover:border-primary/40 hover:bg-foreground/[0.07] transition-all duration-300 shadow-lg shadow-black/20"
              >
                <span className="font-display text-base sm:text-xl md:text-2xl text-foreground/80 group-hover:text-foreground tracking-wide uppercase">
                  {b.label}
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
