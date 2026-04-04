import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';

const GENRE_LIST = [
  'Ação', 'Aventura', 'Animação', 'Comédia', 'Crime', 'Documentário',
  'Drama', 'Família', 'Fantasia', 'Ficção científica', 'Guerra', 'História',
  'Horror', 'Mistério', 'Música', 'Romance', 'Suspense', 'Terror',
  'TV Movie', 'Western',
];

interface GenreFilterProps {
  items: { genre?: string | null }[];
  selected: string | null;
  onSelect: (genre: string | null) => void;
}

export function GenreFilter({ items, selected, onSelect }: GenreFilterProps) {
  const available = useMemo(() => {
    const set = new Set<string>();
    items.forEach(item => {
      (item.genre || '').split(',').forEach(g => {
        const t = g.trim();
        if (t) set.add(t);
      });
    });
    return GENRE_LIST.filter(g => set.has(g));
  }, [items]);

  if (available.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      <button
        onClick={() => onSelect(null)}
        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
          !selected
            ? 'bg-primary text-primary-foreground'
            : 'bg-secondary text-muted-foreground hover:text-foreground'
        }`}
      >
        Todos
      </button>
      {available.map(genre => (
        <button
          key={genre}
          onClick={() => onSelect(selected === genre ? null : genre)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            selected === genre
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-muted-foreground hover:text-foreground'
          }`}
        >
          {genre}
        </button>
      ))}
    </div>
  );
}
