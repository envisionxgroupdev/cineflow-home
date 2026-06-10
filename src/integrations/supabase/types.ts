export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          created_at: string
          details: Json | null
          id: string
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          status: string
          subject: string
          telegram: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          status?: string
          subject: string
          telegram?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          status?: string
          subject?: string
          telegram?: string | null
        }
        Relationships: []
      }
      movies: {
        Row: {
          backdrop_url: string | null
          created_at: string
          created_by: string | null
          genre: string | null
          id: string
          image_url: string | null
          is_release: boolean
          original_title: string | null
          overview: string | null
          player_url: string | null
          player_url_2: string | null
          rating: number
          release_date: string | null
          title: string
          tmdb_id: number | null
          updated_at: string
          year: string | null
        }
        Insert: {
          backdrop_url?: string | null
          created_at?: string
          created_by?: string | null
          genre?: string | null
          id?: string
          image_url?: string | null
          is_release?: boolean
          original_title?: string | null
          overview?: string | null
          player_url?: string | null
          player_url_2?: string | null
          rating?: number
          release_date?: string | null
          title: string
          tmdb_id?: number | null
          updated_at?: string
          year?: string | null
        }
        Update: {
          backdrop_url?: string | null
          created_at?: string
          created_by?: string | null
          genre?: string | null
          id?: string
          image_url?: string | null
          is_release?: boolean
          original_title?: string | null
          overview?: string | null
          player_url?: string | null
          player_url_2?: string | null
          rating?: number
          release_date?: string | null
          title?: string
          tmdb_id?: number | null
          updated_at?: string
          year?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          content_slug: string | null
          content_type: string | null
          created_at: string
          id: string
          image_url: string | null
          is_active: boolean
          message: string | null
          title: string
          type: string
        }
        Insert: {
          content_slug?: string | null
          content_type?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          message?: string | null
          title: string
          type?: string
        }
        Update: {
          content_slug?: string | null
          content_type?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          message?: string | null
          title?: string
          type?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          content_id: string
          content_title: string
          content_type: string
          created_at: string
          details: string | null
          id: string
          reason: string
          reporter_email: string | null
          status: string
        }
        Insert: {
          content_id: string
          content_title: string
          content_type: string
          created_at?: string
          details?: string | null
          id?: string
          reason: string
          reporter_email?: string | null
          status?: string
        }
        Update: {
          content_id?: string
          content_title?: string
          content_type?: string
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          reporter_email?: string | null
          status?: string
        }
        Relationships: []
      }
      requests: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          requester_email: string | null
          requester_name: string | null
          status: string
          title: string
          type: string
          updated_at: string
          year: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          requester_email?: string | null
          requester_name?: string | null
          status?: string
          title: string
          type: string
          updated_at?: string
          year?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          requester_email?: string | null
          requester_name?: string | null
          status?: string
          title?: string
          type?: string
          updated_at?: string
          year?: string | null
        }
        Relationships: []
      }
      series: {
        Row: {
          backdrop_url: string | null
          created_at: string
          created_by: string | null
          first_air_date: string | null
          genre: string | null
          id: string
          image_url: string | null
          is_anime: boolean
          is_release: boolean
          original_title: string | null
          overview: string | null
          player_url: string | null
          player_url_2: string | null
          rating: number
          title: string
          tmdb_id: number | null
          updated_at: string
          year: string | null
        }
        Insert: {
          backdrop_url?: string | null
          created_at?: string
          created_by?: string | null
          first_air_date?: string | null
          genre?: string | null
          id?: string
          image_url?: string | null
          is_anime?: boolean
          is_release?: boolean
          original_title?: string | null
          overview?: string | null
          player_url?: string | null
          player_url_2?: string | null
          rating?: number
          title: string
          tmdb_id?: number | null
          updated_at?: string
          year?: string | null
        }
        Update: {
          backdrop_url?: string | null
          created_at?: string
          created_by?: string | null
          first_air_date?: string | null
          genre?: string | null
          id?: string
          image_url?: string | null
          is_anime?: boolean
          is_release?: boolean
          original_title?: string | null
          overview?: string | null
          player_url?: string | null
          player_url_2?: string | null
          rating?: number
          title?: string
          tmdb_id?: number | null
          updated_at?: string
          year?: string | null
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value?: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      tv_channels: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          embed_url: string
          external_id: string
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          embed_url: string
          external_id: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          embed_url?: string
          external_id?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      watchlist: {
        Row: {
          content_id: string
          content_type: string
          created_at: string
          id: string
          image_url: string | null
          rating: number
          title: string
          user_id: string
          year: string | null
        }
        Insert: {
          content_id: string
          content_type: string
          created_at?: string
          id?: string
          image_url?: string | null
          rating?: number
          title: string
          user_id: string
          year?: string | null
        }
        Update: {
          content_id?: string
          content_type?: string
          created_at?: string
          id?: string
          image_url?: string | null
          rating?: number
          title?: string
          user_id?: string
          year?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "banned"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user", "banned"],
    },
  },
} as const
