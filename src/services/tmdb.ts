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

export async function searchSeries(query: string): Promise<TmdbSeries[]> {
  const res = await fetch(
    `${TMDB_BASE}/search/tv?api_key=${TMDB_API_KEY}&language=pt-BR&query=${encodeURIComponent(query)}`
  );
  const data = await res.json();
  return data.results || [];
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
