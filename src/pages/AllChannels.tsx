import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ChannelCard } from '@/components/ChannelCard';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Search, Radio } from 'lucide-react';
import { motion } from 'framer-motion';
import { AdBanner } from '@/components/AdBanner';
import { Helmet } from 'react-helmet-async';
import type { TvChannel } from '@/types/channel';
import { toast } from 'sonner';

const LIST_FIELDS = 'id,external_id,name,category,logo_url,is_active';

const AllChannels = () => {
  const { isAdmin } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [confirmDel, setConfirmDel] = useState<TvChannel | null>(null);

  const { data: channels = [], isLoading: loading } = useQuery({
    queryKey: ['all-channels'],
    queryFn: async () => {
      const { data } = await supabase.from('tv_channels').select(LIST_FIELDS).eq('is_active', true).order('name');
      return (data || []) as TvChannel[];
    },
  });

  const categories = useMemo(() => {
    const set = new Set<string>();
    channels.forEach(c => c.category && set.add(c.category));
    return Array.from(set).sort();
  }, [channels]);

  const filtered = useMemo(() => channels.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = !category || c.category === category;
    return matchSearch && matchCat;
  }), [channels, search, category]);

  const handleDelete = async (ch: TvChannel) => {
    const { error } = await supabase.from('tv_channels').delete().eq('id', ch.id);
    if (error) { toast.error(error.message); return; }
    toast.success('Canal removido');
    qc.setQueryData<TvChannel[]>(['all-channels'], prev => (prev || []).filter(c => c.id !== ch.id));
    setConfirmDel(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Canais de TV ao Vivo Online Grátis — PipocaMax</title>
        <meta name="description" content="Assista canais de TV ao vivo online grátis. Globo, SBT, Record, ESPN, HBO e muito mais em HD." />
        <link rel="canonical" href="https://pipocamax.com/canais" />
      </Helmet>
      <Navbar />
      <div className="pt-20 pb-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 rounded-lg bg-primary/10">
              <Radio className="h-6 w-6 text-primary" />
            </div>
            <h1 className="font-display text-3xl md:text-5xl text-foreground">CANAIS DE <span className="text-gradient-cinema">TV AO VIVO</span></h1>
          </div>

          <div className="relative max-w-md mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input type="text" placeholder="Buscar canais..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>

          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              <button onClick={() => setCategory(null)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${!category ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>
                Todos
              </button>
              {categories.map(cat => (
                <button key={cat} onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${category === cat ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>
                  {cat}
                </button>
              ))}
            </div>
          )}

          <AdBanner page="home" position="top" />

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
              {filtered.map((c, i) => (
                <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02, duration: 0.3 }}>
                  <ChannelCard
                    id={c.id} externalId={c.external_id} name={c.name}
                    category={c.category} logoUrl={c.logo_url}
                    isAdmin={isAdmin}
                    onDelete={isAdmin ? () => setConfirmDel(c) : undefined}
                  />
                </motion.div>
              ))}
              {filtered.length === 0 && (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  {channels.length === 0 ? 'Nenhum canal sincronizado ainda. Use o painel admin para sincronizar.' : 'Nenhum canal encontrado.'}
                </div>
              )}
            </div>
          )}

          <AdBanner page="home" position="bottom" />
        </div>
      </div>
      <Footer />

      {confirmDel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setConfirmDel(null)}>
          <div className="bg-card border border-border rounded-xl w-full max-w-sm p-6 text-center" onClick={e => e.stopPropagation()}>
            <h3 className="font-display text-lg text-foreground mb-2">Excluir "{confirmDel.name}"?</h3>
            <p className="text-sm text-muted-foreground mb-6">Essa ação não pode ser desfeita.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDel(null)} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium bg-secondary text-muted-foreground hover:text-foreground">Cancelar</button>
              <button onClick={() => handleDelete(confirmDel)} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllChannels;
