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

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed' | 'pending' | 'dismissed';

export interface Report {
  id: string;
  user_id: string | null;
  content_id: string;
  content_type: 'movie' | 'series';
  content_title: string;
  reason: string;
  details: string | null;
  status: TicketStatus;
  created_at: string;
  updated_at?: string;
  resolved_at: string | null;
  reporter_email: string | null;
  last_message_at?: string;
  unread_for_admin?: boolean;
  unread_for_user?: boolean;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  is_admin: boolean;
  body: string | null;
  created_at: string;
  attachment_url: string | null;
  attachment_name: string | null;
  attachment_type: string | null;
  attachment_size: number | null;
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
