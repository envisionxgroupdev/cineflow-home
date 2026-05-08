import { supabase } from '@/integrations/supabase/client';

const TMDB_IMG = 'https://image.tmdb.org/t/p';
const SUPABASE_URL = 'https://qqyldlfexibvvnykklee.supabase.co';
const PROXY_URL = `${SUPABASE_URL}/functions/v1/tmdb-proxy`;

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

// Call the secure tmdb-proxy edge function. The proxy holds the API key server-side.
async function tmdbFetch<T>(path: string, params: Record<string, string | number | undefined> = {}): Promise<T> {
  const qs = new URLSearchParams();
  qs.set('path', path);
  qs.set('language', 'pt-BR');
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') qs.set(k, String(v));
  }
  const res = await fetch(`${PROXY_URL}?${qs.toString()}`);
  if (!res.ok) throw new Error(`TMDB proxy error ${res.status}`);
  return res.json() as Promise<T>;
}

let movieGenresCache: TmdbGenre[] = [];
let tvGenresCache: TmdbGenre[] = [];

async function fetchGenres(type: 'movie' | 'tv'): Promise<TmdbGenre[]> {
  const cache = type === 'movie' ? movieGenresCache : tvGenresCache;
  if (cache.length > 0) return cache;

  const data = await tmdbFetch<{ genres: TmdbGenre[] }>(`genre/${type}/list`);
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

export async function searchMovies(query: string, year?: number): Promise<TmdbMovie[]> {
  if (!query.trim() && year) {
    const data = await tmdbFetch<{ results: TmdbMovie[] }>('discover/movie', {
      primary_release_year: year,
      sort_by: 'popularity.desc',
    });
    return data.results || [];
  }
  const data = await tmdbFetch<{ results: TmdbMovie[] }>('search/movie', {
    query,
    primary_release_year: year,
  });
  return data.results || [];
}

export async function searchSeries(query: string, year?: number): Promise<TmdbSeries[]> {
  if (!query.trim() && year) {
    const data = await tmdbFetch<{ results: TmdbSeries[] }>('discover/tv', {
      first_air_date_year: year,
      sort_by: 'popularity.desc',
    });
    return data.results || [];
  }
  const data = await tmdbFetch<{ results: TmdbSeries[] }>('search/tv', {
    query,
    first_air_date_year: year,
  });
  return data.results || [];
}

export async function getTrendingMovies(): Promise<TmdbMovie[]> {
  const data = await tmdbFetch<{ results: TmdbMovie[] }>('movie/now_playing', { page: 1 });
  return data.results || [];
}

export async function getTrendingSeries(): Promise<TmdbSeries[]> {
  const data = await tmdbFetch<{ results: TmdbSeries[] }>('tv/on_the_air', { page: 1 });
  return data.results || [];
}

export async function getMovieDetails(tmdbId: number): Promise<TmdbMovieDetails> {
  return tmdbFetch<TmdbMovieDetails>(`movie/${tmdbId}`);
}

export async function getSeriesDetails(tmdbId: number): Promise<TmdbSeriesDetails> {
  return tmdbFetch<TmdbSeriesDetails>(`tv/${tmdbId}`);
}

export async function getMovieCredits(tmdbId: number): Promise<TmdbCastMember[]> {
  const data = await tmdbFetch<{ cast: TmdbCastMember[] }>(`movie/${tmdbId}/credits`);
  return (data.cast || []).slice(0, 12);
}

export async function getSeriesCredits(tmdbId: number): Promise<TmdbCastMember[]> {
  const data = await tmdbFetch<{ cast: TmdbCastMember[] }>(`tv/${tmdbId}/credits`);
  return (data.cast || []).slice(0, 12);
}

export async function getSeasonEpisodes(tmdbId: number, seasonNumber: number): Promise<TmdbEpisode[]> {
  const data = await tmdbFetch<{ episodes: TmdbEpisode[] }>(`tv/${tmdbId}/season/${seasonNumber}`);
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
  if (type === 'filme') return `https://warezcdn.site/filme/${tmdbId}`;
  if (season !== undefined && episode !== undefined) return `https://warezcdn.site/serie/${tmdbId}/${season}/${episode}`;
  if (season !== undefined) return `https://warezcdn.site/serie/${tmdbId}/${season}`;
  return `https://warezcdn.site/serie/${tmdbId}`;
}

// MyEmbed player URLs
export function getEmbedMoviesUrl(type: 'filme' | 'serie', tmdbId: number, season?: number, episode?: number): string {
  if (type === 'filme') return `https://myembed.biz/filme/${tmdbId}`;
  if (season !== undefined && episode !== undefined) return `https://myembed.biz/serie/${tmdbId}/${season}/${episode}`;
  if (season !== undefined) return `https://myembed.biz/serie/${tmdbId}/${season}`;
  return `https://myembed.biz/serie/${tmdbId}`;
}

// Unused import suppression — keeps supabase import for potential future auth headers
void supabase;
