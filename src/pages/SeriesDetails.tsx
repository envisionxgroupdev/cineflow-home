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
import { ArrowLeft, Star, Calendar, Play, Loader2, ChevronDown, AlertTriangle, Pencil, SkipBack, SkipForward } from 'lucide-react';
import { ShareButtons } from '@/components/ShareButtons';
import { AdBanner } from '@/components/AdBanner';
import type { Series } from '@/types/database';

type PlayerSource = 'warezcdn' | 'embedmovies';

const SeriesDetails = () => {
  const { slug } = useParams<{ slug: string }>();
  const { isAdmin } = useAuth();
  const [series, setSeries] = useState<Series | null>(null);
  const [details, setDetails] = useState<TmdbSeriesDetails | null>(null);
  const [cast, setCast] = useState<TmdbCastMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [episodes, setEpisodes] = useState<TmdbEpisode[]>([]);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [playingEpisode, setPlayingEpisode] = useState<{ season: number; episode: number } | null>(null);
  const [activePlayer, setActivePlayer] = useState<PlayerSource>('warezcdn');
  const [reportOpen, setReportOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => { if (slug) loadSeries(slug); }, [slug]);

  useEffect(() => {
    if (series?.tmdb_id && selectedSeason >= 0) loadEpisodes(series.tmdb_id, selectedSeason);
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
        const firstSeason = det.seasons?.find((s: TmdbSeason) => s.season_number > 0);
        if (firstSeason) setSelectedSeason(firstSeason.season_number);
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
        <title>{`Assistir ${series.title} Online Grátis Dublado HD - PipocaMax`}</title>
        <meta name="description" content={`Assistir ${series.title} todas as temporadas online grátis em HD dublado e legendado. ${overview?.slice(0, 120)}`} />
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
      <div className="relative w-full h-[50vh] md:h-[60vh]">
        <img src={backdrop || '/placeholder.svg'} alt={series.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 to-transparent" />
      </div>

      <AdBanner page="series_detail" position="top" />
      <div className="container mx-auto px-4 -mt-40 relative z-10 pb-12">
        <nav aria-label="breadcrumb" className="mb-4 text-xs text-muted-foreground">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li><Link to="/" className="hover:text-foreground transition-colors">Início</Link></li>
            <li aria-hidden="true">/</li>
            <li><Link to="/series" className="hover:text-foreground transition-colors">Séries</Link></li>
            <li aria-hidden="true">/</li>
            <li className="text-foreground truncate max-w-[200px]" aria-current="page">{series.title}</li>
          </ol>
        </nav>
        <div className="flex items-center justify-between mb-6">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
          <div className="flex items-center gap-2">
            <ShareButtons url={canonicalUrl} title={series.title} />
            {isAdmin && (
              <button onClick={() => setEditOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-medium hover:bg-primary/20 transition-colors">
                <Pencil className="h-3.5 w-3.5" /> Editar
              </button>
            )}
            <button onClick={() => setReportOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-destructive/10 text-destructive rounded-lg text-xs font-medium hover:bg-destructive/20 transition-colors">
              <AlertTriangle className="h-3.5 w-3.5" /> Reportar
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          <div className="shrink-0">
            <img src={series.image_url || '/placeholder.svg'} alt={series.title} className="w-48 md:w-64 rounded-xl shadow-2xl shadow-primary/10" />
          </div>
          <div className="flex-1">
            <h1 className="font-display text-3xl md:text-5xl text-foreground mb-2">{series.title}</h1>
            {tagline && <p className="text-primary italic text-sm mb-4">"{tagline}"</p>}
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-6">
              <span className="flex items-center gap-1"><Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />{series.rating?.toFixed(1)}</span>
              {series.year && <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {series.year}</span>}
              {details?.number_of_seasons && (
                <span className="bg-secondary px-2 py-0.5 rounded text-xs">{details.number_of_seasons} temporada{details.number_of_seasons > 1 ? 's' : ''}</span>
              )}
              {genres && <span className="bg-secondary px-2 py-0.5 rounded text-xs">{genres}</span>}
            </div>
            {overview && (
              <div className="mb-8">
                <h3 className="font-display text-xl text-foreground mb-3">SINOPSE</h3>
                <p className="text-muted-foreground leading-relaxed">{overview}</p>
              </div>
            )}

            <div className="mb-8 space-y-1 text-sm text-muted-foreground/70">
              <p className="font-semibold text-foreground/80 uppercase">ASSISTIR {series.title.toUpperCase()} ONLINE GRÁTIS</p>
              <p>{series.title} LEGENDADO || {series.title} DUBLADO</p>
              <p>{series.title} Online - Assistir {series.title} Online Grátis Dublado Legendado</p>
            </div>
          </div>
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
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <h3 className="font-display text-xl text-foreground">ASSISTINDO — T{playingEpisode.season} E{playingEpisode.episode}</h3>
              <button onClick={() => setPlayingEpisode(null)} className="text-sm text-muted-foreground hover:text-foreground">Fechar Player</button>
            </div>
            <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
              <div className="flex gap-2">
                <button onClick={() => setActivePlayer('warezcdn')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${activePlayer === 'warezcdn' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>
                  Player 1 — WarezCDN
                </button>
                <button onClick={() => setActivePlayer('embedmovies')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${activePlayer === 'embedmovies' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>
                  Player 2 — EmbedMovies
                </button>
              </div>
              <div className="flex gap-2">
                <button onClick={goPrev} disabled={!hasPrev}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-secondary text-foreground hover:bg-primary/20 hover:text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-secondary disabled:hover:text-foreground">
                  <SkipBack className="h-3.5 w-3.5" /> Anterior
                </button>
                <button onClick={goNext} disabled={!hasNext}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                  Próximo Episódio <SkipForward className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <div className="rounded-xl overflow-hidden border border-border bg-black">
              <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
                <iframe src={getEpisodePlayerUrl(playingEpisode.season, playingEpisode.episode, activePlayer)}
                  className="absolute inset-0 w-full h-full" allowFullScreen
                  allow="autoplay; encrypted-media" referrerPolicy="origin" />
              </div>
            </div>
          </div>
          );
        })()}

        {/* Seasons & Episodes */}
        {seasons.length > 0 && tmdbId && (
          <div className="mt-12">
            <h3 className="font-display text-2xl text-foreground mb-6">TEMPORADAS & EPISÓDIOS</h3>
            <div className="relative inline-block mb-6">
              <select value={selectedSeason}
                onChange={e => { setSelectedSeason(Number(e.target.value)); setPlayingEpisode(null); }}
                className="appearance-none bg-secondary border border-border text-foreground rounded-lg px-4 py-2.5 pr-10 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50">
                {seasons.map(s => (
                  <option key={s.season_number} value={s.season_number}>Temporada {s.season_number} ({s.episode_count} eps)</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>

            {loadingEpisodes ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 text-primary animate-spin" /></div>
            ) : (
              <div className="space-y-3">
                {episodes.map(ep => (
                  <div key={ep.id}
                    className={`flex items-start gap-4 p-4 rounded-xl border transition-colors cursor-pointer ${
                      playingEpisode?.season === ep.season_number && playingEpisode?.episode === ep.episode_number
                        ? 'border-primary bg-primary/10' : 'border-border bg-card hover:bg-secondary/50'
                    }`}
                    onClick={() => setPlayingEpisode({ season: ep.season_number, episode: ep.episode_number })}>
                    <div className="relative shrink-0 w-32 sm:w-44 aspect-video rounded-lg overflow-hidden bg-secondary">
                      {ep.still_path ? (
                        <img src={getImageUrl(ep.still_path, 'w300')} alt={ep.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground"><Play className="h-6 w-6" /></div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
                        <Play className="h-8 w-8 text-white fill-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-primary">E{ep.episode_number}</span>
                        <h4 className="text-sm font-medium text-foreground truncate">{ep.name}</h4>
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
        )}

        <AdBanner page="series_detail" position="middle" />

        {/* Cast */}
        {cast.length > 0 && (
          <div className="mt-12">
            <h3 className="font-display text-2xl text-foreground mb-6">ELENCO</h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
              {cast.map(member => (
                <div key={member.id} className="text-center">
                  <div className="aspect-square rounded-full overflow-hidden bg-secondary mb-2 mx-auto w-20 h-20">
                    {member.profile_path ? (
                      <img src={getImageUrl(member.profile_path, 'w185')} alt={member.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xl font-display">{member.name[0]}</div>
                    )}
                  </div>
                  <p className="text-xs font-medium text-foreground truncate">{member.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{member.character}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <AdBanner page="series_detail" position="bottom" />
      <Footer />
      <ReportModal contentId={series.id} contentType="series" contentTitle={series.title} open={reportOpen} onClose={() => setReportOpen(false)} />
      {isAdmin && <EditContentModal item={series} type="series" open={editOpen} onClose={() => setEditOpen(false)} onSaved={() => loadSeries(series.id)} />}
    </div>
  );
};

export default SeriesDetails;
