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
  const [adultConfirmed, setAdultConfirmed] = useState(false);

  useEffect(() => {
    if (!externalId) return;
    (async () => {
      const { data } = await supabase.from('tv_channels').select('*').eq('external_id', externalId).maybeSingle();
      setChannel(data as TvChannel | null);
      setLoading(false);
    })();
  }, [externalId]);

  const isAdult = !!channel && /adult|adulto|\+18|18\+|xxx|ero|porn/i.test(
    `${channel.name} ${channel.category ?? ''}`
  );
  const showAdultGate = isAdult && !adultConfirmed;

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

              {/* channel player */}
              <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-border">
                {showAdultGate ? (
                  <div className="absolute inset-0 flex items-center justify-center p-6 bg-gradient-to-br from-background via-background to-destructive/20">
                    <div className="max-w-md text-center">
                      <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-destructive/15 border border-destructive/40 flex items-center justify-center">
                        <ShieldAlert className="h-8 w-8 text-destructive" />
                      </div>
                      <p className="text-[10px] font-bold tracking-[0.3em] text-destructive uppercase mb-2">Conteúdo adulto • +18</p>
                      <h2 className="font-display text-xl md:text-2xl text-foreground mb-3">Aviso de Conteúdo Adulto</h2>
                      <p className="text-sm text-muted-foreground mb-6">
                        Este canal contém conteúdo destinado exclusivamente a maiores de 18 anos. Ao continuar, você declara ter idade legal para visualizá-lo e assume total responsabilidade pelo acesso.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2 justify-center">
                        <Link
                          to="/canais"
                          className="px-5 py-2.5 rounded-lg border border-border bg-card text-sm text-foreground hover:bg-muted transition-colors"
                        >
                          Sair
                        </Link>
                        <button
                          onClick={() => setAdultConfirmed(true)}
                          className="px-5 py-2.5 rounded-lg bg-destructive text-destructive-foreground text-sm font-semibold hover:bg-destructive/90 transition-colors"
                        >
                          Sou maior de 18 anos
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <iframe
                    key={channel.embed_url}
                    src={channel.embed_url}
                    className="absolute inset-0 w-full h-full"
                    allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                    allowFullScreen
                    referrerPolicy="origin"
                    loading="eager"
                    title={channel.name}
                  />
                )}
              </div>

              {!showAdultGate && (
                <div className="mt-4 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/40 flex items-start gap-3">
                  <ShieldAlert className="h-5 w-5 text-yellow-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-200">
                    <span className="font-semibold">Aviso:</span> se o player travar ou não carregar, use uma <span className="font-semibold">VPN</span> e tente novamente.
                  </p>
                </div>
              )}

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
