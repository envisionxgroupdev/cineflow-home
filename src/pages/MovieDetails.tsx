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
import {
  getMovieDetails, getMovieCredits, getImageUrl, getWarezPlayerUrl, getEmbedMoviesUrl,
  type TmdbMovieDetails, type TmdbCastMember,
} from '@/services/tmdb';
import { ArrowLeft, Star, Clock, Calendar, Play, Loader2, AlertTriangle, Pencil } from 'lucide-react';
import type { Movie } from '@/types/database';

type PlayerSource = 'warezcdn' | 'embedmovies';

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

  useEffect(() => { if (slug) loadMovie(slug); }, [slug]);

  const loadMovie = async (urlSlug: string) => {
    setLoading(true);
    const { data: all } = await supabase.from('movies').select('*');
    const movies = all as Movie[] | null;
    // Try exact match first, then progressively looser matches
    const found = movies?.find(m => {
      const s = slugify(m.title);
      const fullSlug = `assistir-${s}-online-gratis`;
      return fullSlug === urlSlug;
    }) || movies?.find(m => {
      const s = slugify(m.title);
      return urlSlug.includes(s) && s.length > 2;
    }) || null;
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
    return movie.player_url_2 || (tmdbId ? getEmbedMoviesUrl('filme', tmdbId) : '');
  };

  const playerSrc = getPlayerUrl(activePlayer);
  const hasPlayer1 = !!(movie.player_url || tmdbId);
  const hasPlayer2 = !!(movie.player_url_2 || tmdbId);

  const canonicalUrl = `https://cineflow.top/filme/assistir-${slugify(movie.title)}-online-gratis`;
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

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{movie.title} — Assistir Online Grátis | Cineflow</title>
        <meta name="description" content={`Assistir ${movie.title} online grátis em HD dublado. ${overview?.slice(0, 120)}`} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={`${movie.title} — Assistir Online | Cineflow`} />
        <meta property="og:description" content={overview?.slice(0, 160)} />
        {movie.image_url && <meta property="og:image" content={movie.image_url} />}
        <meta property="og:type" content="video.movie" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:site_name" content="Cineflow" />
        <meta property="og:locale" content="pt_BR" />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>
      <Navbar />
      <div className="relative w-full h-[50vh] md:h-[60vh]">
        <img src={backdrop || '/placeholder.svg'} alt={movie.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 to-transparent" />
      </div>

      <div className="container mx-auto px-4 -mt-40 relative z-10 pb-12">
        <div className="flex items-center justify-between mb-6">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
          <div className="flex items-center gap-2">
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
            <img src={movie.image_url || '/placeholder.svg'} alt={movie.title} className="w-48 md:w-64 rounded-xl shadow-2xl shadow-primary/10" />
          </div>
          <div className="flex-1">
            <h1 className="font-display text-3xl md:text-5xl text-foreground mb-2">{movie.title}</h1>
            {tagline && <p className="text-primary italic text-sm mb-4">"{tagline}"</p>}
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-6">
              <span className="flex items-center gap-1"><Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />{movie.rating?.toFixed(1)}</span>
              {movie.year && <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {movie.year}</span>}
              {runtime && <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {runtime} min</span>}
              {genres && <span className="bg-secondary px-2 py-0.5 rounded text-xs">{genres}</span>}
            </div>

            {(hasPlayer1 || hasPlayer2) && (
              <div className="flex flex-col gap-3 mb-6">
                <button onClick={() => setShowPlayer(!showPlayer)}
                  className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors w-fit">
                  <Play className="h-5 w-5 fill-current" />
                  {showPlayer ? 'Fechar Player' : 'Assistir Agora'}
                </button>
                {showPlayer && (
                  <div className="flex gap-2">
                    {hasPlayer1 && (
                      <button onClick={() => setActivePlayer('warezcdn')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${activePlayer === 'warezcdn' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>
                        Player 1 — WarezCDN
                      </button>
                    )}
                    {hasPlayer2 && (
                      <button onClick={() => setActivePlayer('embedmovies')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${activePlayer === 'embedmovies' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>
                        Player 2 — EmbedMovies
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {showPlayer && playerSrc && (
              <div className="mb-8 rounded-xl overflow-hidden border border-border bg-black">
                <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
                  <iframe src={playerSrc} className="absolute inset-0 w-full h-full" allowFullScreen
                    allow="autoplay; encrypted-media" referrerPolicy="origin" />
                </div>
              </div>
            )}

            {overview && (
              <div className="mb-8">
                <h3 className="font-display text-xl text-foreground mb-3">SINOPSE</h3>
                <p className="text-muted-foreground leading-relaxed">{overview}</p>
              </div>
            )}
          </div>
        </div>

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

      <Footer />

      <ReportModal contentId={movie.id} contentType="movie" contentTitle={movie.title} open={reportOpen} onClose={() => setReportOpen(false)} />
      {isAdmin && <EditContentModal item={movie} type="movie" open={editOpen} onClose={() => setEditOpen(false)} onSaved={() => loadMovie(movie.id)} />}
    </div>
  );
};

export default MovieDetails;
