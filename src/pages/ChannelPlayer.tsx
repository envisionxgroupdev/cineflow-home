import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ArrowLeft, Radio, Tv, ShieldAlert } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import type { TvChannel } from '@/types/channel';

const ChannelPlayer = () => {
  const { externalId } = useParams<{ externalId: string }>();
  const [channel, setChannel] = useState<TvChannel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!externalId) return;
    (async () => {
      const { data } = await supabase.from('tv_channels').select('*').eq('external_id', externalId).maybeSingle();
      setChannel(data as TvChannel | null);
      setLoading(false);
    })();
  }, [externalId]);

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{channel ? `${channel.name} ao vivo` : 'Canal'} — PipocaMax</title>
        <meta name="description" content={`Assista ${channel?.name || 'canais de TV'} ao vivo online grátis em HD no PipocaMax.`} />
      </Helmet>
      <Navbar />
      <div className="pt-20 pb-12">
        <div className="container mx-auto px-4">
          <Link to="/canais" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Voltar para canais
          </Link>

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>
          ) : !channel ? (
            <div className="text-center py-20">
              <Tv className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-40" />
              <p className="text-muted-foreground">Canal não encontrado.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-4 mb-6">
                {channel.logo_url && (
                  <div className="w-16 h-16 rounded-xl bg-card border border-border p-2 flex items-center justify-center shrink-0">
                    <img src={channel.logo_url} alt={channel.name} className="max-w-full max-h-full object-contain" />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="flex items-center gap-1 text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded uppercase tracking-wider">
                      <Radio className="h-3 w-3" /> Ao vivo
                    </span>
                    {channel.category && (
                      <span className="text-xs text-muted-foreground">{channel.category}</span>
                    )}
                  </div>
                  <h1 className="font-display text-2xl md:text-4xl text-foreground">{channel.name}</h1>
                </div>
              </div>

              {/* channel player v3 */}
              <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-border">
                <iframe
                  ref={iframeRef}
                  key={`${channel.embed_url}-${reloadKey}`}
                  src={channel.embed_url}
                  className="absolute inset-0 w-full h-full"
                  allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                  allowFullScreen
                  referrerPolicy="origin"
                  loading="eager"
                  title={channel.name}
                  onLoad={() => setIframeLoaded(true)}
                />
                {!iframeLoaded && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-none">
                    <Loader2 className="h-8 w-8 text-primary animate-spin mb-3" />
                    <p className="text-xs text-muted-foreground">Carregando player...</p>
                  </div>
                )}
              </div>

              <div className="mt-4 p-4 rounded-xl bg-card border border-border">
                <p className="text-sm text-foreground mb-1 font-medium">Player não carregou ou está travado?</p>
                <p className="text-xs text-muted-foreground mb-3">
                  No Chrome Mobile alguns embeds são bloqueados (Lite Mode, bloqueadores de anúncio). Recarregue ou abra o player em nova aba.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => { setReloadKey(k => k + 1); }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-secondary text-foreground hover:bg-secondary/80 transition-colors"
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> Recarregar player
                  </button>
                  <a
                    href={channel.embed_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> Abrir em nova aba
                  </a>
                </div>
              </div>

              {channel.description && (
                <p className="mt-6 text-sm text-muted-foreground max-w-3xl">{channel.description}</p>
              )}
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ChannelPlayer;
