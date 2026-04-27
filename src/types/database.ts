export interface Movie {
  id: string;
  title: string;
  original_title: string | null;
  overview: string | null;
  year: string | null;
  genre: string | null;
  rating: number;
  image_url: string | null;
  backdrop_url: string | null;
  tmdb_id: number | null;
  release_date: string | null;
  is_release: boolean;
  player_url: string | null;
  player_url_2: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Series {
  id: string;
  title: string;
  original_title: string | null;
  overview: string | null;
  year: string | null;
  genre: string | null;
  rating: number;
  image_url: string | null;
  backdrop_url: string | null;
  tmdb_id: number | null;
  first_air_date: string | null;
  is_release: boolean;
  is_anime: boolean;
  player_url: string | null;
  player_url_2: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export type AppRole = 'admin' | 'user';

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
}

export interface Report {
  id: string;
  content_id: string;
  content_type: 'movie' | 'series';
  content_title: string;
  reason: string;
  details: string | null;
  status: 'pending' | 'resolved' | 'dismissed';
  created_at: string;
  reporter_email: string | null;
}

export interface ContentRequest {
  id: string;
  title: string;
  type: 'movie' | 'series';
  year: string | null;
  notes: string | null;
  requester_name: string | null;
  requester_email: string | null;
  status: 'pending' | 'fulfilled' | 'rejected';
  created_at: string;
  updated_at: string;
}
