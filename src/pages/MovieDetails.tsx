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
  getMovieDetails, getMovieCredits, getImageUrl, getWarezPlayerUrl, getEmbedMoviesUrl, getSuperflixUrl,
  type TmdbMovieDetails, type TmdbCastMember,
} from '@/services/tmdb';
import { ArrowLeft, Star, Clock, Calendar, Play, Loader2, AlertTriangle, Pencil } from 'lucide-react';
import { WatchlistButton } from '@/components/WatchlistButton';
import { ShareButtons } from '@/components/ShareButtons';
import { ClosePlayerDialog } from '@/components/ClosePlayerDialog';
import { AdBanner } from '@/components/AdBanner';
import { VizerHero } from '@/components/vizer/VizerHero';
import { YouMayLike } from '@/components/vizer/YouMayLike';
import type { Movie } from '@/types/database';

type PlayerSource = 'warezcdn' | 'embedmovies' | 'superflix';

const MovieDetails = () => {
  const { slug } = useParams<{ slug: string }>();
  const { isAdmin } = useAuth();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [details, setDetails] = useState<TmdbMovieDetails | null>(null);
  const [cast, setCast] = useState<TmdbCastMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPlayer, setShowPlayer] = useState(false);
  const [activePlayer, setActivePlayer] = useState<PlayerSource>('warezcdn');
  const [reportOpen, setReportOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);

  useEffect(() => { if (slug) loadMovie(slug); }, [slug]);

  const loadMovie = async (urlSlug: string) => {
    setLoading(true);
    setMovie(null);
    setDetails(null);
    setCast([]);

    const found = await findRowBySlug<Movie>('movies', urlSlug);

    if (found) {
      setMovie(found);
      if (found.tmdb_id) {
        const [det, cre] = await Promise.all([getMovieDetails(found.tmdb_id), getMovieCredits(found.tmdb_id)]);
        setDetails(det);
        setCast(cre);
      }
    }

    setLoading(false);
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>;

  if (!movie) return (
    <div className="min-h-screen bg-background"><Navbar />
      <div className="pt-20 text-center py-20">
        <p className="text-muted-foreground">Filme não encontrado.</p>
        <Link to="/" className="text-primary hover:underline mt-2 inline-block">Voltar</Link>
      </div>
    </div>
  );

  const tmdbId = movie.tmdb_id;
  const backdrop = details?.backdrop_path ? getImageUrl(details.backdrop_path, 'original') : movie.backdrop_url;
  const genres = details?.genres?.map(g => g.name).join(', ') || movie.genre || '';
  const runtime = details?.runtime;
  const overview = details?.overview || movie.overview || '';
  const tagline = details?.tagline || '';

  const getPlayerUrl = (source: PlayerSource) => {
    if (source === 'warezcdn') return movie.player_url || (tmdbId ? getWarezPlayerUrl('filme', tmdbId) : '');
    if (source === 'embedmovies') return movie.player_url_2 || (tmdbId ? getEmbedMoviesUrl('filme', tmdbId) : '');
    return tmdbId ? getSuperflixUrl('filme', tmdbId) : '';
  };

  const playerSrc = getPlayerUrl(activePlayer);
  const hasPlayer1 = !!(movie.player_url || tmdbId);
  const hasPlayer2 = !!(movie.player_url_2 || tmdbId);
  const hasPlayer3 = !!tmdbId;

  const canonicalUrl = `https://pipocamax.com/filme/assistir-${slugify(movie.title)}-online-gratis`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Movie',
    name: movie.title,
    description: overview?.slice(0, 300),
    image: movie.image_url || backdrop,
    datePublished: movie.release_date || movie.year,
    genre: genres,
    aggregateRating: movie.rating ? { '@type': 'AggregateRating', ratingValue: movie.rating, bestRating: 10, ratingCount: 1 } : undefined,
    duration: runtime ? `PT${runtime}M` : undefined,
    url: canonicalUrl,
    actor: cast.slice(0, 5).map(c => ({ '@type': 'Person', name: c.name })),
  };
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Início', item: 'https://pipocamax.com/' },
      { '@type': 'ListItem', position: 2, name: 'Filmes', item: 'https://pipocamax.com/filmes' },
      { '@type': 'ListItem', position: 3, name: movie.title, item: canonicalUrl },
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <html lang="pt-BR" />
        <title>{`${movie.title}${movie.year ? ` (${movie.year})` : ''} Online HD — PipocaMax`}</title>
        <meta name="description" content={`Assista ${movie.title}${movie.year ? ` (${movie.year})` : ''} online grátis em HD dublado e legendado. ${overview?.slice(0, 80) || ''}`.slice(0, 158)} />
        <meta name="keywords" content={`${movie.title}, assistir ${movie.title}, ${movie.title} online, ${movie.title} dublado, ${movie.title} legendado, filme ${movie.year || ''}, ${genres}`} />
        <link rel="canonical" href={canonicalUrl} />
        <link rel="alternate" hrefLang="pt-BR" href={canonicalUrl} />
        <meta property="og:title" content={`Assistir ${movie.title}${movie.year ? ` (${movie.year})` : ''} Online Grátis Dublado HD`} />
        <meta property="og:description" content={overview?.slice(0, 160)} />
        {movie.image_url && <meta property="og:image" content={movie.image_url} />}
        <meta property="og:type" content="video.movie" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:site_name" content="PipocaMax" />
        <meta property="og:locale" content="pt_BR" />
        <meta name="twitter:card" content="summary_large_image" />
        {movie.image_url && <meta name="twitter:image" content={movie.image_url} />}
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbLd)}</script>
      </Helmet>
      <Navbar />
      <VizerHero
        backdrop={backdrop}
        poster={movie.image_url}
        title={movie.title}
        tagline={tagline}
        year={movie.year}
        runtimeLabel={runtime ? `${Math.floor(runtime / 60)}h ${runtime % 60}min` : null}
        rating={movie.rating}
        genres={details?.genres?.map(g => g.name) || (movie.genre ? [movie.genre] : [])}
        overview={overview}
        cast={cast}
        actions={
          <>
            {(hasPlayer1 || hasPlayer2) && (
              <button onClick={() => { setShowPlayer(true); setTimeout(() => document.getElementById('player')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50); }}
                className="group inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full text-sm font-bold shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:brightness-110 transition-all">
                <Play className="h-4 w-4 fill-current transition-transform group-hover:scale-110" />
                {showPlayer ? 'Player aberto' : 'Assistir'}
              </button>
            )}
            <WatchlistButton item={{
              content_id: movie.id, content_type: 'movie', title: movie.title,
              image_url: movie.image_url, year: movie.year, rating: movie.rating,
            }} />
            <ShareButtons url={canonicalUrl} title={movie.title} />
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

      <AdBanner page="movie_detail" position="top" />
      <div className="container mx-auto px-4 relative z-10 pb-12">
        <nav aria-label="breadcrumb" className="mb-6 text-xs text-muted-foreground">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li><Link to="/" className="hover:text-foreground transition-colors">Início</Link></li>
            <li aria-hidden="true">/</li>
            <li><Link to="/filmes" className="hover:text-foreground transition-colors">Filmes</Link></li>
            <li aria-hidden="true">/</li>
            <li className="text-foreground truncate max-w-[200px]" aria-current="page">{movie.title}</li>
          </ol>
        </nav>
        <button
          type="button"
          onClick={() => {
            if (showPlayer) {
              setConfirmCloseOpen(true);
            } else {
              window.history.length > 1 ? window.history.back() : (window.location.href = '/filmes');
            }
          }}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>

        {showPlayer && playerSrc && (
          <div id="player" className="mb-8 rounded-2xl border border-border/60 bg-gradient-to-b from-card/80 to-card/40 backdrop-blur-sm shadow-2xl shadow-primary/5 overflow-hidden">
            <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3 border-b border-border/50 bg-background/40">
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex h-2 w-2 rounded-full bg-primary shadow-[0_0_10px] shadow-primary animate-pulse shrink-0" />
                <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Assistindo agora</p>
              </div>
              {(hasPlayer1 && hasPlayer2) && (
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
              )}
            </div>
            <div className="bg-black">
              <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
                <iframe src={playerSrc} className="absolute inset-0 w-full h-full" allowFullScreen
                  allow="autoplay; encrypted-media" referrerPolicy="origin" />
              </div>
            </div>
          </div>
        )}

        <div className="mb-8 space-y-1 text-sm text-muted-foreground/70">
          <p className="font-semibold text-foreground/80 uppercase">ASSISTIR {movie.title.toUpperCase()} ONLINE GRÁTIS</p>
          <p>{movie.title} LEGENDADO || {movie.title} DUBLADO</p>
          <p>{movie.title} Online - Assistir {movie.title} Online Grátis Dublado Legendado</p>
        </div>

        <AdBanner page="movie_detail" position="middle" />

        {tmdbId && <YouMayLike type="movie" tmdbId={tmdbId} />}

      </div>

      <AdBanner page="movie_detail" position="bottom" />
      <Footer />

      <ReportModal contentId={movie.id} contentType="movie" contentTitle={movie.title} open={reportOpen} onClose={() => setReportOpen(false)} />
      {isAdmin && <EditContentModal item={movie} type="movie" open={editOpen} onClose={() => setEditOpen(false)} onSaved={() => loadMovie(movie.id)} />}
      <ClosePlayerDialog
        open={confirmCloseOpen}
        onCancel={() => setConfirmCloseOpen(false)}
        onConfirm={() => {
          setConfirmCloseOpen(false);
          setShowPlayer(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    </div>
  );
};

export default MovieDetails;
