// Types Supabase pour GROOV
// Générés manuellement pour user_collection et user_favorites.
// Pour régénérer : npx supabase gen types typescript --project-id TON_PROJECT_ID > database.types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      user_collection: {
        Row: {
          id: string
          user_id: string
          discogs_id: number
          title: string | null
          artist: string | null
          year: string | null
          label: string | null
          genre: string[]
          thumb: string | null
          cover: string | null
          condition: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          discogs_id: number
          title?: string | null
          artist?: string | null
          year?: string | null
          label?: string | null
          genre?: string[]
          thumb?: string | null
          cover?: string | null
          condition?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          discogs_id?: number
          title?: string | null
          artist?: string | null
          year?: string | null
          label?: string | null
          genre?: string[]
          thumb?: string | null
          cover?: string | null
          condition?: string | null
          notes?: string | null
          created_at?: string
        }
        Relationships: []
      }
      user_favorites: {
        Row: {
          id: string
          user_id: string
          discogs_id: number
          title: string | null
          artist: string | null
          thumb: string | null
          cover: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          discogs_id: number
          title?: string | null
          artist?: string | null
          thumb?: string | null
          cover?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          discogs_id?: number
          title?: string | null
          artist?: string | null
          thumb?: string | null
          cover?: string | null
          created_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          email: string | null
          role: 'user' | 'admin'
          display_name: string | null
          avatar_url: string | null
          bio: string | null
          username: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          email?: string | null
          role?: 'user' | 'admin'
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          username?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          email?: string | null
          role?: 'user' | 'admin'
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          username?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      vinyl_reviews: {
        Row: {
          id: string
          user_id: string
          discogs_id: number
          rating: number
          title: string | null
          body: string | null
          vinyl_title: string | null
          vinyl_artist: string | null
          vinyl_thumb: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          discogs_id: number
          rating: number
          title?: string | null
          body?: string | null
          vinyl_title?: string | null
          vinyl_artist?: string | null
          vinyl_thumb?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          discogs_id?: number
          rating?: number
          title?: string | null
          body?: string | null
          vinyl_title?: string | null
          vinyl_artist?: string | null
          vinyl_thumb?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_follows: {
        Row: {
          id: string
          follower_id: string
          following_id: string
          created_at: string
        }
        Insert: {
          id?: string
          follower_id: string
          following_id: string
          created_at?: string
        }
        Update: {
          id?: string
          follower_id?: string
          following_id?: string
          created_at?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          id: string
          user_id: string
          badge_key: string
          unlocked_at: string
        }
        Insert: {
          id?: string
          user_id: string
          badge_key: string
          unlocked_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          badge_key?: string
          unlocked_at?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          id: string
          user_id: string
          genres: string[]
          artists: string[]
          onboarding_completed: boolean
          updated_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          genres?: string[]
          artists?: string[]
          onboarding_completed?: boolean
          updated_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          genres?: string[]
          artists?: string[]
          onboarding_completed?: boolean
          updated_at?: string
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
