import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { supabase } from '@/integrations/supabase/client';
import {
  getMovieDetails,
  getMovieCredits,
  getImageUrl,
  getWarezPlayerUrl,
  type TmdbMovieDetails,
  type TmdbCastMember,
} from '@/services/tmdb';
import { ArrowLeft, Star, Clock, Calendar, Play, Loader2 } from 'lucide-react';
import type { Movie } from '@/types/database';

const MovieDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [details, setDetails] = useState<TmdbMovieDetails | null>(null);
  const [cast, setCast] = useState<TmdbCastMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPlayer, setShowPlayer] = useState(false);

  useEffect(() => {
    if (id) loadMovie(id);
  }, [id]);

  const loadMovie = async (movieId: string) => {
    setLoading(true);
    const { data } = await supabase.from('movies').select('*').eq('id', movieId).single();
    if (data) {
      setMovie(data as Movie);
      if (data.tmdb_id) {
        const [det, cre] = await Promise.all([
          getMovieDetails(data.tmdb_id),
          getMovieCredits(data.tmdb_id),
        ]);
        setDetails(det);
        setCast(cre);
      }
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-20 text-center py-20">
          <p className="text-muted-foreground">Filme não encontrado.</p>
          <Link to="/" className="text-primary hover:underline mt-2 inline-block">Voltar</Link>
        </div>
      </div>
    );
  }

  const tmdbId = movie.tmdb_id;
  const backdrop = details?.backdrop_path
    ? getImageUrl(details.backdrop_path, 'original')
    : movie.backdrop_url;
  const genres = details?.genres?.map((g) => g.name).join(', ') || movie.genre || '';
  const runtime = details?.runtime;
  const overview = details?.overview || movie.overview || '';
  const tagline = details?.tagline || '';

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Backdrop Hero */}
      <div className="relative w-full h-[50vh] md:h-[60vh]">
        <img
          src={backdrop || '/placeholder.svg'}
          alt={movie.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 to-transparent" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 -mt-40 relative z-10 pb-12">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 text-sm">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Poster */}
          <div className="shrink-0">
            <img
              src={movie.image_url || '/placeholder.svg'}
              alt={movie.title}
              className="w-48 md:w-64 rounded-xl shadow-2xl shadow-primary/10"
            />
          </div>

          {/* Info */}
          <div className="flex-1">
            <h1 className="font-display text-3xl md:text-5xl text-foreground mb-2">{movie.title}</h1>

            {tagline && (
              <p className="text-primary italic text-sm mb-4">"{tagline}"</p>
            )}

            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-6">
              <span className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                {movie.rating?.toFixed(1)}
              </span>
              {movie.year && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" /> {movie.year}
                </span>
              )}
              {runtime && (
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" /> {runtime} min
                </span>
              )}
              {genres && (
                <span className="bg-secondary px-2 py-0.5 rounded text-xs">{genres}</span>
              )}
            </div>

            {/* Play Button */}
            {tmdbId && (
              <button
                onClick={() => setShowPlayer(!showPlayer)}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors mb-6"
              >
                <Play className="h-5 w-5 fill-current" />
                {showPlayer ? 'Fechar Player' : 'Assistir Agora'}
              </button>
            )}

            {/* Player */}
            {showPlayer && tmdbId && (
              <div className="mb-8 rounded-xl overflow-hidden border border-border bg-black">
                <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
                  <iframe
                    src={getWarezPlayerUrl('filme', tmdbId)}
                    className="absolute inset-0 w-full h-full"
                    allowFullScreen
                    allow="autoplay; encrypted-media"
                    referrerPolicy="origin"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                  />
                </div>
              </div>
            )}

            {/* Synopsis */}
            {overview && (
              <div className="mb-8">
                <h3 className="font-display text-xl text-foreground mb-3">SINOPSE</h3>
                <p className="text-muted-foreground leading-relaxed">{overview}</p>
              </div>
            )}
          </div>
        </div>

        {/* Cast */}
        {cast.length > 0 && (
          <div className="mt-12">
            <h3 className="font-display text-2xl text-foreground mb-6">ELENCO</h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
              {cast.map((member) => (
                <div key={member.id} className="text-center">
                  <div className="aspect-square rounded-full overflow-hidden bg-secondary mb-2 mx-auto w-20 h-20">
                    {member.profile_path ? (
                      <img
                        src={getImageUrl(member.profile_path, 'w185')}
                        alt={member.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xl font-display">
                        {member.name[0]}
                      </div>
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
    </div>
  );
};

export default MovieDetails;
