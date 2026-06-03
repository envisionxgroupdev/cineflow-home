import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface WatchlistItem {
  id: string;
  user_id: string;
  content_id: string;
  content_type: 'movie' | 'series';
  title: string;
  image_url: string | null;
  year: string | null;
  rating: number;
  created_at: string;
}

export interface WatchlistAddInput {
  content_id: string;
  content_type: 'movie' | 'series';
  title: string;
  image_url?: string | null;
  year?: string | null;
  rating?: number;
}

export function useWatchlist() {
  const { user } = useAuth();
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) { setItems([]); setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('watchlist')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (!error && data) setItems(data as WatchlistItem[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const isInList = useCallback(
    (content_id: string, content_type: 'movie' | 'series') =>
      items.some(i => i.content_id === content_id && i.content_type === content_type),
    [items]
  );

  const add = useCallback(async (input: WatchlistAddInput) => {
    if (!user) { toast.error('Faça login para usar Minha Lista'); return false; }
    const { data, error } = await supabase
      .from('watchlist')
      .insert({ user_id: user.id, rating: input.rating ?? 0, ...input })
      .select()
      .single();
    if (error) { toast.error('Erro ao adicionar à lista'); return false; }
    if (data) setItems(prev => [data as WatchlistItem, ...prev]);
    toast.success('Adicionado à Minha Lista');
    return true;
  }, [user]);

  const remove = useCallback(async (content_id: string, content_type: 'movie' | 'series') => {
    if (!user) return false;
    const { error } = await supabase
      .from('watchlist')
      .delete()
      .eq('user_id', user.id)
      .eq('content_id', content_id)
      .eq('content_type', content_type);
    if (error) { toast.error('Erro ao remover'); return false; }
    setItems(prev => prev.filter(i => !(i.content_id === content_id && i.content_type === content_type)));
    toast.success('Removido da lista');
    return true;
  }, [user]);

  const toggle = useCallback(async (input: WatchlistAddInput) => {
    if (isInList(input.content_id, input.content_type)) {
      return remove(input.content_id, input.content_type);
    }
    return add(input);
  }, [isInList, add, remove]);

  return { items, loading, isInList, add, remove, toggle, reload: load };
}
