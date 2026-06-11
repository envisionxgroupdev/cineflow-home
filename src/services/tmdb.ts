const TMDB_API_KEY = 'c3303b4812a831ae634e26763a65644e';
const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMG = 'https://image.tmdb.org/t/p';
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

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

async function tmdbFetchJson<T = any>(path: string, params: Record<string, string | number | undefined> = {}): Promise<T> {
  const direct = new URL(`${TMDB_BASE}${path}`);
  direct.searchParams.set('api_key', TMDB_API_KEY);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') direct.searchParams.set(key, String(value));
  });

  const proxied = `${SUPABASE_URL}/functions/v1/warez-proxy?url=${encodeURIComponent(direct.toString())}`;
  const res = await fetch(proxied, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  if (!res.ok) throw new Error(`TMDB ${res.status} em ${path}`);
  const data = await res.json();
  if (data?.status_code && data?.success === false) throw new Error(data.status_message || `TMDB ${data.status_code}`);
  return data as T;
}

async function fetchGenres(type: 'movie' | 'tv'): Promise<TmdbGenre[]> {
  const cache = type === 'movie' ? movieGenresCache : tvGenresCache;
  if (cache.length > 0) return cache;

  const data: any = await tmdbFetchJson(`/genre/${type}/list`, { language: 'pt-BR' });
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
    const data: any = await tmdbFetchJson('/discover/movie', { language: 'pt-BR', primary_release_year: year, sort_by: 'popularity.desc' });
    return data.results || [];
  }
  const data: any = await tmdbFetchJson('/search/movie', { language: 'pt-BR', query, primary_release_year: year });
  return data.results || [];
}

export async function searchSeries(query: string, year?: number): Promise<TmdbSeries[]> {
  if (!query.trim() && year) {
    const data: any = await tmdbFetchJson('/discover/tv', { language: 'pt-BR', first_air_date_year: year, sort_by: 'popularity.desc' });
    return data.results || [];
  }
  const data: any = await tmdbFetchJson('/search/tv', { language: 'pt-BR', query, first_air_date_year: year });
  return data.results || [];
}

export async function getTrendingMovies(): Promise<TmdbMovie[]> {
  const res = await fetch(`${TMDB_BASE}/movie/now_playing?api_key=${TMDB_API_KEY}&language=pt-BR&page=1`);
  const data = await res.json();
  return data.results || [];
}

export async function getTrendingSeries(): Promise<TmdbSeries[]> {
  const res = await fetch(`${TMDB_BASE}/tv/on_the_air?api_key=${TMDB_API_KEY}&language=pt-BR&page=1`);
  const data = await res.json();
  return data.results || [];
}

export async function getMovieDetails(tmdbId: number): Promise<TmdbMovieDetails> {
  const res = await fetch(`${TMDB_BASE}/movie/${tmdbId}?api_key=${TMDB_API_KEY}&language=pt-BR`);
  if (!res.ok) throw new Error(`TMDB ${res.status} for movie ${tmdbId}`);
  const data = await res.json();
  if (!data || !data.id) throw new Error(`TMDB movie ${tmdbId} resposta inválida`);
  return data;
}

export async function getSeriesDetails(tmdbId: number): Promise<TmdbSeriesDetails> {
  const res = await fetch(`${TMDB_BASE}/tv/${tmdbId}?api_key=${TMDB_API_KEY}&language=pt-BR`);
  if (!res.ok) throw new Error(`TMDB ${res.status} for tv ${tmdbId}`);
  const data = await res.json();
  if (!data || !data.id) throw new Error(`TMDB tv ${tmdbId} resposta inválida`);
  return data;
}

export async function getMovieCredits(tmdbId: number): Promise<TmdbCastMember[]> {
  const res = await fetch(`${TMDB_BASE}/movie/${tmdbId}/credits?api_key=${TMDB_API_KEY}&language=pt-BR`);
  const data = await res.json();
  return (data.cast || []).slice(0, 12);
}

export async function getSeriesCredits(tmdbId: number): Promise<TmdbCastMember[]> {
  const res = await fetch(`${TMDB_BASE}/tv/${tmdbId}/credits?api_key=${TMDB_API_KEY}&language=pt-BR`);
  const data = await res.json();
  return (data.cast || []).slice(0, 12);
}

export async function getSeasonEpisodes(tmdbId: number, seasonNumber: number): Promise<TmdbEpisode[]> {
  const res = await fetch(`${TMDB_BASE}/tv/${tmdbId}/season/${seasonNumber}?api_key=${TMDB_API_KEY}&language=pt-BR`);
  const data = await res.json();
  return (data.episodes || []).map((ep: TmdbEpisode) => ({
    ...ep,
    name: ep.name || `Episódio ${ep.episode_number}`,
    overview: ep.overview && ep.overview.trim() ? ep.overview : '',
  }));
}

export interface TmdbLogo {
  file_path: string;
  iso_639_1: string | null;
  aspect_ratio: number;
}

export async function getTitleLogo(type: 'movie' | 'tv', tmdbId: number): Promise<string | null> {
  const res = await fetch(`${TMDB_BASE}/${type}/${tmdbId}/images?api_key=${TMDB_API_KEY}&include_image_language=pt,en,null`);
  const data = await res.json();
  const logos: TmdbLogo[] = data.logos || [];
  if (logos.length === 0) return null;
  const pt = logos.find(l => l.iso_639_1 === 'pt');
  const en = logos.find(l => l.iso_639_1 === 'en');
  const chosen = pt || en || logos[0];
  return chosen.file_path ? `${TMDB_IMG}/w500${chosen.file_path}` : null;
}

export interface TmdbRecommendation {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
}

export async function getRecommendations(type: 'movie' | 'tv', tmdbId: number): Promise<TmdbRecommendation[]> {
  const res = await fetch(`${TMDB_BASE}/${type}/${tmdbId}/recommendations?api_key=${TMDB_API_KEY}&language=pt-BR&page=1`);
  const data = await res.json();
  return (data.results || []).slice(0, 12);
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
  if (type === 'filme') return `https://warezcdn.lat/filme/${tmdbId}`;
  if (season !== undefined && episode !== undefined) return `https://warezcdn.lat/serie/${tmdbId}/${season}/${episode}`;
  if (season !== undefined) return `https://warezcdn.lat/serie/${tmdbId}/${season}`;
  return `https://warezcdn.lat/serie/${tmdbId}`;
}

// MyEmbed player URLs
export function getEmbedMoviesUrl(type: 'filme' | 'serie', tmdbId: number, season?: number, episode?: number): string {
  if (type === 'filme') return `https://myembed.biz/filme/${tmdbId}`;
  if (season !== undefined && episode !== undefined) return `https://myembed.biz/serie/${tmdbId}/${season}/${episode}`;
  if (season !== undefined) return `https://myembed.biz/serie/${tmdbId}/${season}`;
  return `https://myembed.biz/serie/${tmdbId}`;
}

// SuperFlix player URLs — https://superflixapi.fit/doc
export function getSuperflixUrl(type: 'filme' | 'serie', tmdbId: number, season?: number, episode?: number): string {
  if (type === 'filme') return `https://superflixapi.fit/filme/${tmdbId}`;
  if (season !== undefined && episode !== undefined) return `https://superflixapi.fit/serie/${tmdbId}/${season}/${episode}`;
  if (season !== undefined) return `https://superflixapi.fit/serie/${tmdbId}/${season}`;
  return `https://superflixapi.fit/serie/${tmdbId}`;
}
