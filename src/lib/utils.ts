import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

export function contentUrl(type: 'movie' | 'series', id: string, title: string): string {
  const prefix = type === 'movie' ? 'filme' : 'serie';
  return `/assistir/${prefix}/${id}/${slugify(title)}`;
}
