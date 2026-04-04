const TMDB_API_KEY = 'c3303b4812a831ae634e26763a65644e';
const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMG = 'https://image.tmdb.org/t/p';

export interface TmdbMovie {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  genre_ids: number[];
}

export interface TmdbSeries {
  id: number;
  name: string;
  original_name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  vote_average: number;
  genre_ids: number[];
}

export interface TmdbCastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

export interface TmdbSeason {
  id: number;
  season_number: number;
  name: string;
  episode_count: number;
  poster_path: string | null;
  air_date: string | null;
  overview: string;
}

export interface TmdbEpisode {
  id: number;
  episode_number: number;
  season_number: number;
  name: string;
  overview: string;
  still_path: string | null;
  air_date: string | null;
  vote_average: number;
  runtime: number | null;
}

export interface TmdbMovieDetails {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  runtime: number | null;
  genres: { id: number; name: string }[];
  tagline: string;
}

export interface TmdbSeriesDetails {
  id: number;
  name: string;
  original_name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  vote_average: number;
  genres: { id: number; name: string }[];
  tagline: string;
  number_of_seasons: number;
  seasons: TmdbSeason[];
}

interface TmdbGenre {
  id: number;
  name: string;
}

let movieGenresCache: TmdbGenre[] = [];
let tvGenresCache: TmdbGenre[] = [];

async function fetchGenres(type: 'movie' | 'tv'): Promise<TmdbGenre[]> {
  const cache = type === 'movie' ? movieGenresCache : tvGenresCache;
  if (cache.length > 0) return cache;

  const res = await fetch(`${TMDB_BASE}/genre/${type}/list?api_key=${TMDB_API_KEY}&language=pt-BR`);
  const data = await res.json();
  const genres = data.genres || [];

  if (type === 'movie') movieGenresCache = genres;
  else tvGenresCache = genres;

  return genres;
}

export function getImageUrl(path: string | null, size = 'w500'): string {
  if (!path) return '/placeholder.svg';
  return `${TMDB_IMG}/${size}${path}`;
}

function mapGenreIds(ids: number[], genres: TmdbGenre[]): string {
  return ids
    .map((id) => genres.find((g) => g.id === id)?.name)
    .filter(Boolean)
    .slice(0, 3)
    .join(', ');
}

export async function searchMovies(query: string): Promise<TmdbMovie[]> {
  const res = await fetch(
    `${TMDB_BASE}/search/movie?api_key=${TMDB_API_KEY}&language=pt-BR&query=${encodeURIComponent(query)}`
  );
  const data = await res.json();
  return data.results || [];
}

export async function getTrendingMovies(): Promise<TmdbMovie[]> {
  const res = await fetch(
    `${TMDB_BASE}/movie/now_playing?api_key=${TMDB_API_KEY}&language=pt-BR&page=1`
  );
  const data = await res.json();
  return data.results || [];
}

export async function getTrendingSeries(): Promise<TmdbSeries[]> {
  const res = await fetch(
    `${TMDB_BASE}/tv/on_the_air?api_key=${TMDB_API_KEY}&language=pt-BR&page=1`
  );
  const data = await res.json();
  return data.results || [];
}

export async function searchSeries(query: string): Promise<TmdbSeries[]> {
  const res = await fetch(
    `${TMDB_BASE}/search/tv?api_key=${TMDB_API_KEY}&language=pt-BR&query=${encodeURIComponent(query)}`
  );
  const data = await res.json();
  return data.results || [];
}

export async function getMovieDetails(tmdbId: number): Promise<TmdbMovieDetails> {
  const res = await fetch(
    `${TMDB_BASE}/movie/${tmdbId}?api_key=${TMDB_API_KEY}&language=pt-BR`
  );
  return res.json();
}

export async function getSeriesDetails(tmdbId: number): Promise<TmdbSeriesDetails> {
  const res = await fetch(
    `${TMDB_BASE}/tv/${tmdbId}?api_key=${TMDB_API_KEY}&language=pt-BR`
  );
  return res.json();
}

export async function getMovieCredits(tmdbId: number): Promise<TmdbCastMember[]> {
  const res = await fetch(
    `${TMDB_BASE}/movie/${tmdbId}/credits?api_key=${TMDB_API_KEY}&language=pt-BR`
  );
  const data = await res.json();
  return (data.cast || []).slice(0, 12);
}

export async function getSeriesCredits(tmdbId: number): Promise<TmdbCastMember[]> {
  const res = await fetch(
    `${TMDB_BASE}/tv/${tmdbId}/credits?api_key=${TMDB_API_KEY}&language=pt-BR`
  );
  const data = await res.json();
  return (data.cast || []).slice(0, 12);
}

export async function getSeasonEpisodes(tmdbId: number, seasonNumber: number): Promise<TmdbEpisode[]> {
  const res = await fetch(
    `${TMDB_BASE}/tv/${tmdbId}/season/${seasonNumber}?api_key=${TMDB_API_KEY}&language=pt-BR`
  );
  const data = await res.json();
  return data.episodes || [];
}

export async function tmdbMovieToDb(movie: TmdbMovie) {
  const genres = await fetchGenres('movie');
  return {
    title: movie.title,
    original_title: movie.original_title,
    overview: movie.overview,
    year: movie.release_date?.slice(0, 4) || '',
    genre: mapGenreIds(movie.genre_ids, genres),
    rating: Math.round(movie.vote_average * 10) / 10,
    image_url: getImageUrl(movie.poster_path),
    backdrop_url: getImageUrl(movie.backdrop_path, 'w1280'),
    tmdb_id: movie.id,
    release_date: movie.release_date,
  };
}

export async function tmdbSeriesToDb(series: TmdbSeries) {
  const genres = await fetchGenres('tv');
  return {
    title: series.name,
    original_title: series.original_name,
    overview: series.overview,
    year: series.first_air_date?.slice(0, 4) || '',
    genre: mapGenreIds(series.genre_ids, genres),
    rating: Math.round(series.vote_average * 10) / 10,
    image_url: getImageUrl(series.poster_path),
    backdrop_url: getImageUrl(series.backdrop_path, 'w1280'),
    tmdb_id: series.id,
    first_air_date: series.first_air_date,
  };
}

// WarezCDN player URLs
export function getWarezPlayerUrl(type: 'filme' | 'serie', tmdbId: number, season?: number, episode?: number): string {
  if (type === 'filme') {
    return `https://warezcdn.site/filme/${tmdbId}`;
  }
  if (season !== undefined && episode !== undefined) {
    return `https://warezcdn.site/serie/${tmdbId}/${season}/${episode}`;
  }
  if (season !== undefined) {
    return `https://warezcdn.site/serie/${tmdbId}/${season}`;
  }
  return `https://warezcdn.site/serie/${tmdbId}`;
}

// EmbedMovies player URLs
export function getEmbedMoviesUrl(type: 'filme' | 'serie', tmdbId: number, season?: number, episode?: number): string {
  if (type === 'filme') {
    return `https://embedmovies.org/embed/movie/${tmdbId}`;
  }
  if (season !== undefined && episode !== undefined) {
    return `https://embedmovies.org/embed/tv/${tmdbId}/${season}/${episode}`;
  }
  return `https://embedmovies.org/embed/tv/${tmdbId}`;
}
