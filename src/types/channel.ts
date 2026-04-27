export interface TvChannel {
  id: string;
  external_id: string;
  name: string;
  category: string | null;
  description: string | null;
  logo_url: string | null;
  embed_url: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}
