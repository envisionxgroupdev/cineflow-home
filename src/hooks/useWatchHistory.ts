import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface WatchHistoryItem {
  id: string;
  user_id: string;
  content_id: string;
  content_type: 'movie' | 'series';
  title: string;
  image_url: string | null;
  year: string | null;
  rating: number | null;
  season: number | null;
  episode: number | null;
  last_watched_at: string;
  created_at: string;
}

export interface WatchHistoryInput {
  content_id: string;
  content_type: 'movie' | 'series';
  title: string;
  image_url?: string | null;
  year?: string | null;
  rating?: number | null;
  season?: number | null;
  episode?: number | null;
}

/**
 * Records a "continue watching" entry for the logged-in user.
 * No-op when there's no authenticated user.
 */
export async function recordWatchHistory(userId: string | undefined, input: WatchHistoryInput) {
  if (!userId) return;
  try {
    await (supabase as any)
      .from('watch_history')
      .upsert(
        {
          user_id: userId,
          content_id: input.content_id,
          content_type: input.content_type,
          title: input.title,
          image_url: input.image_url ?? null,
          year: input.year ?? null,
          rating: input.rating ?? null,
          season: input.season ?? null,
          episode: input.episode ?? null,
          last_watched_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,content_id,content_type' }
      );
  } catch (e) {
    console.warn('[watch_history] failed to record', e);
  }
}

export function useWatchHistory(limit = 12) {
  const { user } = useAuth();
  const [items, setItems] = useState<WatchHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user) { setItems([]); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('watch_history')
      .select('*')
      .eq('user_id', user.id)
      .order('last_watched_at', { ascending: false })
      .limit(limit);
    if (!error) setItems((data || []) as WatchHistoryItem[]);
    setLoading(false);
  }, [user, limit]);

  const remove = useCallback(async (id: string) => {
    if (!user) return;
    await supabase.from('watch_history').delete().eq('id', id).eq('user_id', user.id);
    setItems(prev => prev.filter(i => i.id !== id));
  }, [user]);

  useEffect(() => { void load(); }, [load]);

  return { items, loading, reload: load, remove };
}
