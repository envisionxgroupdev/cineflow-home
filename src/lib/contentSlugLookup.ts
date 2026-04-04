import { supabase } from '@/integrations/supabase/client';
import { slugify } from '@/lib/utils';

const PAGE_SIZE = 500;

function matchesSlug(title: string, urlSlug: string) {
  const baseSlug = slugify(title);
  const fullSlug = `assistir-${baseSlug}-online-gratis`;
  return fullSlug === urlSlug || baseSlug === urlSlug;
}

export async function findRowBySlug<T extends { title: string }>(
  table: 'movies' | 'series',
  urlSlug: string,
): Promise<T | null> {
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .order('created_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      console.error(`[findRowBySlug] ${table} lookup failed`, error);
      return null;
    }

    const rows = (data as T[] | null) ?? [];
    if (rows.length === 0) return null;

    const found = rows.find((row) => matchesSlug(row.title, urlSlug));
    if (found) return found;

    if (rows.length < PAGE_SIZE) return null;
    from += PAGE_SIZE;
  }
}
