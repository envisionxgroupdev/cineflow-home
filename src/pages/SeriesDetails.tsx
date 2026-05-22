import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ReportModal } from '@/components/ReportModal';
import { EditContentModal } from '@/components/EditContentModal';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { slugify } from '@/lib/utils';
import { findRowBySlug } from '@/lib/contentSlugLookup';
import {
  getSeriesDetails, getSeriesCredits, getSeasonEpisodes, getImageUrl, getWarezPlayerUrl, getEmbedMoviesUrl,
  type TmdbSeriesDetails, type TmdbCastMember, type TmdbEpisode, type TmdbSeason,
} from '@/services/tmdb';
import { ArrowLeft, Star, Calendar, Play, Loader2, ChevronDown, AlertTriangle, Pencil, SkipBack, SkipForward, Bookmark } from 'lucide-react';
import { ShareButtons } from '@/components/ShareButtons';
import { AdBanner } from '@/components/AdBanner';
import { VizerHero } from '@/components/vizer/VizerHero';
import { YouMayLike } from '@/components/vizer/YouMayLike';
import type { Series } from '@/types/database';

type PlayerSource = 'warezcdn' | 'embedmovies';

const SeriesDetails = () => {
  const { slug } = useParams<{ slug: string }>();
  const { isAdmin } = useAuth();
  const [series, setSeries] = useState<Series | null>(null);
  const [details, setDetails] = useState<TmdbSeriesDetails | null>(null);
  const [cast, setCast] = useState<TmdbCastMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);
  const [episodes, setEpisodes] = useState<TmdbEpisode[]>([]);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [playingEpisode, setPlayingEpisode] = useState<{ season: number; episode: number } | null>(null);
  const [activePlayer, setActivePlayer] = useState<PlayerSource>('warezcdn');
  const [reportOpen, setReportOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => { if (slug) loadSeries(slug); }, [slug]);

  useEffect(() => {
    if (series?.tmdb_id && selectedSeason !== null && selectedSeason >= 0) loadEpisodes(series.tmdb_id, selectedSeason);
  }, [series?.tmdb_id, selectedSeason]);

  const loadSeries = async (urlSlug: string) => {
    setLoading(true);
    setSeries(null);
    setDetails(null);
    setCast([]);
    setEpisodes([]);

    const found = await findRowBySlug<Series>('series', urlSlug);

    if (found) {
      setSeries(found);
      if (found.tmdb_id) {
        const [det, cre] = await Promise.all([getSeriesDetails(found.tmdb_id), getSeriesCredits(found.tmdb_id)]);
        setDetails(det); setCast(cre);
      }
    }

    setLoading(false);
  };

  const loadEpisodes = async (tmdbId: number, season: number) => {
    setLoadingEpisodes(true);
    setEpisodes(await getSeasonEpisodes(tmdbId, season));
    setLoadingEpisodes(false);
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>;

  if (!series) return (
    <div className="min-h-screen bg-background"><Navbar />
      <div className="pt-20 text-center py-20">
        <p className="text-muted-foreground">Série não encontrada.</p>
        <Link to="/" className="text-primary hover:underline mt-2 inline-block">Voltar</Link>
      </div>
    </div>
  );

  const tmdbId = series.tmdb_id;
  const backdrop = details?.backdrop_path ? getImageUrl(details.backdrop_path, 'original') : series.backdrop_url;
  const genres = details?.genres?.map(g => g.name).join(', ') || series.genre || '';
  const overview = details?.overview || series.overview || '';
  const tagline = details?.tagline || '';
  const seasons = details?.seasons?.filter(s => s.season_number > 0) || [];

  const getEpisodePlayerUrl = (season: number, episode: number, source: PlayerSource) => {
    if (source === 'warezcdn') {
      if (series.player_url) return `${series.player_url}/${season}/${episode}`;
      if (tmdbId) return getWarezPlayerUrl('serie', tmdbId, season, episode);
    } else {
      if (series.player_url_2) return `${series.player_url_2}/${season}/${episode}`;
      if (tmdbId) return getEmbedMoviesUrl('serie', tmdbId, season, episode);
    }
    return '';
  };

  const canonicalUrl = `https://pipocamax.com/serie/assistir-${slugify(series.title)}-online-gratis`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TVSeries',
    name: series.title,
    description: overview?.slice(0, 300),
    image: series.image_url || backdrop,
    datePublished: series.first_air_date || series.year,
    genre: genres,
    numberOfSeasons: details?.number_of_seasons,
    aggregateRating: series.rating ? { '@type': 'AggregateRating', ratingValue: series.rating, bestRating: 10, ratingCount: 1 } : undefined,
    url: canonicalUrl,
    actor: cast.slice(0, 5).map(c => ({ '@type': 'Person', name: c.name })),
  };
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Início', item: 'https://pipocamax.com/' },
      { '@type': 'ListItem', position: 2, name: 'Séries', item: 'https://pipocamax.com/series' },
      { '@type': 'ListItem', position: 3, name: series.title, item: canonicalUrl },
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <html lang="pt-BR" />
        <title>{`${series.title} Online HD — PipocaMax`}</title>
        <meta name="description" content={`Assista ${series.title} todas as temporadas online grátis em HD dublado e legendado. ${overview?.slice(0, 70) || ''}`.slice(0, 158)} />
        <meta name="keywords" content={`${series.title}, assistir ${series.title}, ${series.title} online, ${series.title} dublado, ${series.title} todas temporadas, série ${series.year || ''}`} />
        <link rel="canonical" href={canonicalUrl} />
        <link rel="alternate" hrefLang="pt-BR" href={canonicalUrl} />
        <meta property="og:title" content={`Assistir ${series.title} Online Grátis Dublado HD`} />
        <meta property="og:description" content={overview?.slice(0, 160)} />
        {series.image_url && <meta property="og:image" content={series.image_url} />}
        <meta property="og:type" content="video.tv_show" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:site_name" content="PipocaMax" />
        <meta property="og:locale" content="pt_BR" />
        <meta name="twitter:card" content="summary_large_image" />
        {series.image_url && <meta name="twitter:image" content={series.image_url} />}
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbLd)}</script>
      </Helmet>
      <Navbar />
      <VizerHero
        backdrop={backdrop}
        poster={series.image_url}
        title={series.title}
        tagline={tagline}
        year={series.year}
        subLine={details?.number_of_seasons ? `${details.number_of_seasons} Temporada${details.number_of_seasons > 1 ? 's' : ''}` : null}
        rating={series.rating}
        genres={details?.genres?.map(g => g.name) || (series.genre ? [series.genre] : [])}
        overview={overview}
        cast={cast}
        actions={
          <>
            <button className="inline-flex items-center gap-2 bg-foreground/10 text-foreground px-5 py-3 rounded-full text-sm font-semibold border border-foreground/15 hover:bg-foreground/15 transition-all">
              <Bookmark className="h-4 w-4" /> Listar
            </button>
            <ShareButtons url={canonicalUrl} title={series.title} />
            {isAdmin && (
              <button onClick={() => setEditOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-primary/10 text-primary rounded-full text-xs font-medium hover:bg-primary/20 transition-colors">
                <Pencil className="h-3.5 w-3.5" /> Editar
              </button>
            )}
            <button onClick={() => setReportOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-destructive/10 text-destructive rounded-full text-xs font-medium hover:bg-destructive/20 transition-colors">
              <AlertTriangle className="h-3.5 w-3.5" /> Reportar
            </button>
          </>
        }
      />

      <AdBanner page="series_detail" position="top" />
      <div className="container mx-auto px-4 relative z-10 pb-12">
        <nav aria-label="breadcrumb" className="mb-6 text-xs text-muted-foreground">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li><Link to="/" className="hover:text-foreground transition-colors">Início</Link></li>
            <li aria-hidden="true">/</li>
            <li><Link to="/series" className="hover:text-foreground transition-colors">Séries</Link></li>
            <li aria-hidden="true">/</li>
            <li className="text-foreground truncate max-w-[200px]" aria-current="page">{series.title}</li>
          </ol>
        </nav>
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-4">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>
        <div id="temporadas" />

        <div className="mb-8 space-y-1 text-sm text-muted-foreground/70">
          <p className="font-semibold text-foreground/80 uppercase">ASSISTIR {series.title.toUpperCase()} ONLINE GRÁTIS</p>
          <p>{series.title} LEGENDADO || {series.title} DUBLADO</p>
          <p>{series.title} Online - Assistir {series.title} Online Grátis Dublado Legendado</p>
        </div>

        {/* Player */}
        {playingEpisode && (() => {
          const currentSeasonInfo = seasons.find(s => s.season_number === playingEpisode.season);
          const currentSeasonEpCount = currentSeasonInfo?.episode_count ?? episodes.length;
          const seasonIdx = seasons.findIndex(s => s.season_number === playingEpisode.season);
          const prevSeason = seasonIdx > 0 ? seasons[seasonIdx - 1] : null;
          const nextSeason = seasonIdx >= 0 && seasonIdx < seasons.length - 1 ? seasons[seasonIdx + 1] : null;

          const hasPrev = playingEpisode.episode > 1 || !!prevSeason;
          const hasNext = playingEpisode.episode < currentSeasonEpCount || !!nextSeason;

          const goPrev = () => {
            if (playingEpisode.episode > 1) {
              setPlayingEpisode({ season: playingEpisode.season, episode: playingEpisode.episode - 1 });
            } else if (prevSeason) {
              setSelectedSeason(prevSeason.season_number);
              setPlayingEpisode({ season: prevSeason.season_number, episode: prevSeason.episode_count });
            }
          };
          const goNext = () => {
            if (playingEpisode.episode < currentSeasonEpCount) {
              setPlayingEpisode({ season: playingEpisode.season, episode: playingEpisode.episode + 1 });
            } else if (nextSeason) {
              setSelectedSeason(nextSeason.season_number);
              setPlayingEpisode({ season: nextSeason.season_number, episode: 1 });
            }
          };

          return (
          <div className="mt-8 mb-4">
            <div className="rounded-2xl border border-border/60 bg-gradient-to-b from-card/80 to-card/40 backdrop-blur-sm shadow-2xl shadow-primary/5 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3 border-b border-border/50 bg-background/40">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex h-2 w-2 rounded-full bg-primary shadow-[0_0_10px] shadow-primary animate-pulse shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Assistindo agora</p>
                    <h3 className="font-display text-sm sm:text-base text-foreground truncate">
                      Temporada {playingEpisode.season} · Episódio {playingEpisode.episode}
                    </h3>
                  </div>
                </div>
                <button onClick={() => {
                    if (window.confirm('Deseja realmente fechar o player? Você perderá o progresso atual deste episódio.')) {
                      setPlayingEpisode(null);
                    }
                  }}
                  className="text-xs font-medium text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-md hover:bg-secondary/60 transition-colors shrink-0">
                  Fechar
                </button>
              </div>

              {/* Player */}
              <div className="bg-black">
                <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
                  <iframe src={getEpisodePlayerUrl(playingEpisode.season, playingEpisode.episode, activePlayer)}
                    className="absolute inset-0 w-full h-full" allowFullScreen
                    allow="autoplay; encrypted-media" referrerPolicy="origin" />
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 flex-wrap bg-background/40 border-t border-border/50">
                {/* Player switcher */}
                <div className="inline-flex items-center p-1 rounded-full bg-secondary/60 border border-border/50">
                  <button onClick={() => setActivePlayer('warezcdn')}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${activePlayer === 'warezcdn' ? 'bg-primary text-primary-foreground shadow-md shadow-primary/30' : 'text-muted-foreground hover:text-foreground'}`}>
                    Player 1
                  </button>
                  <button onClick={() => setActivePlayer('embedmovies')}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${activePlayer === 'embedmovies' ? 'bg-primary text-primary-foreground shadow-md shadow-primary/30' : 'text-muted-foreground hover:text-foreground'}`}>
                    Player 2
                  </button>
                </div>

                {/* Episode nav */}
                <div className="flex items-center gap-2">
                  <button onClick={goPrev} disabled={!hasPrev}
                    className="group flex items-center gap-1.5 h-9 px-3.5 rounded-full text-xs font-semibold border border-border/60 bg-secondary/40 text-foreground hover:bg-secondary hover:border-border transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                    <SkipBack className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5 group-disabled:!translate-x-0" />
                    <span className="hidden sm:inline">Anterior</span>
                  </button>
                  <button onClick={goNext} disabled={!hasNext}
                    className="group flex items-center gap-1.5 h-9 px-4 rounded-full text-xs font-semibold bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:brightness-110 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none">
                    Próximo Episódio
                    <SkipForward className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-disabled:!translate-x-0" />
                  </button>
                </div>
              </div>
            </div>
          </div>
          );
        })()}

        {/* Seasons & Episodes (Vizer-style two-column layout) */}
        {seasons.length > 0 && tmdbId && (
          <div className="mt-12">
            <h3 className="font-display text-2xl text-foreground mb-6">TEMPORADAS & EPISÓDIOS</h3>

            <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
              {/* Seasons list (left) */}
              <aside className="lg:sticky lg:top-24 lg:self-start">
                <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-border/40 bg-background/40">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Temporadas</p>
                  </div>
                  <div className="max-h-[60vh] lg:max-h-[70vh] overflow-y-auto flex lg:flex-col gap-2 p-2">
                    {seasons.map(s => {
                      const active = selectedSeason === s.season_number;
                      return (
                        <button
                          key={s.season_number}
                          onClick={() => { setSelectedSeason(s.season_number); setPlayingEpisode(null); }}
                          className={`shrink-0 lg:w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all whitespace-nowrap lg:whitespace-normal flex items-center justify-between gap-3 ${
                            active
                              ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'
                              : 'bg-foreground/5 text-foreground/85 hover:bg-foreground/10 border border-foreground/5'
                          }`}
                        >
                          <span>Temporada {s.season_number}</span>
                          <span className={`text-[10px] font-normal px-2 py-0.5 rounded-full ${active ? 'bg-primary-foreground/15 text-primary-foreground' : 'bg-foreground/10 text-foreground/60'}`}>
                            {s.episode_count} eps
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </aside>

              {/* Episodes list (right) */}
              <div>
                <div className="flex items-baseline justify-between mb-4">
                  <h4 className="font-display text-lg text-foreground">EPISÓDIOS · T{selectedSeason}</h4>
                  <span className="text-xs text-muted-foreground">{episodes.length} episódios</span>
                </div>

                {loadingEpisodes ? (
                  <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 text-primary animate-spin" /></div>
                ) : (
                  <div className="space-y-3">
                    {episodes.map(ep => (
                      <div key={ep.id}
                        className={`group flex items-start gap-4 p-3 sm:p-4 rounded-xl border transition-all cursor-pointer ${
                          playingEpisode?.season === ep.season_number && playingEpisode?.episode === ep.episode_number
                            ? 'border-primary bg-primary/10' : 'border-border/40 bg-card/40 hover:bg-secondary/60 hover:border-border'
                        }`}
                        onClick={() => setPlayingEpisode({ season: ep.season_number, episode: ep.episode_number })}>
                        <div className="relative shrink-0 w-32 sm:w-44 aspect-video rounded-lg overflow-hidden bg-secondary">
                          {ep.still_path ? (
                            <img src={getImageUrl(ep.still_path, 'w300')} alt={ep.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground"><Play className="h-6 w-6" /></div>
                          )}
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="bg-primary/90 rounded-full p-2.5">
                              <Play className="h-5 w-5 text-primary-foreground fill-current" />
                            </div>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-primary">E{ep.episode_number}</span>
                            <h4 className="text-sm font-semibold text-foreground truncate">{ep.name}</h4>
                          </div>
                          {ep.overview && <p className="text-xs text-muted-foreground line-clamp-2">{ep.overview}</p>}
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            {ep.vote_average > 0 && <span className="flex items-center gap-1"><Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />{ep.vote_average.toFixed(1)}</span>}
                            {ep.runtime && <span>{ep.runtime} min</span>}
                            {ep.air_date && <span>{ep.air_date}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {tmdbId && <YouMayLike type="tv" tmdbId={tmdbId} />}

        <AdBanner page="series_detail" position="middle" />

      </div>

      <AdBanner page="series_detail" position="bottom" />
      <Footer />
      <ReportModal contentId={series.id} contentType="series" contentTitle={series.title} open={reportOpen} onClose={() => setReportOpen(false)} />
      {isAdmin && <EditContentModal item={series} type="series" open={editOpen} onClose={() => setEditOpen(false)} onSaved={() => loadSeries(series.id)} />}
    </div>
  );
};

export default SeriesDetails;
