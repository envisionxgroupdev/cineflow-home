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

export function contentUrl(type: 'movie' | 'series', _id: string, title: string): string {
  const prefix = type === 'movie' ? 'filme' : 'serie';
  const slug = `assistir-${slugify(title)}-online-gratis`;
  return `/${prefix}/${slug}`;
}

export function extractTitleFromSlug(slug: string): string {
  return slug
    .replace(/^assistir-/, '')
    .replace(/-online-gratis$/, '')
    .replace(/-/g, ' ');
}
