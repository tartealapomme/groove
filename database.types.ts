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
          created_at: string | null
        }
        Insert: {
          id?: string
          email?: string | null
          role?: 'user' | 'admin'
          created_at?: string | null
        }
        Update: {
          id?: string
          email?: string | null
          role?: 'user' | 'admin'
          created_at?: string | null
        }
        Relationships: []
      }
      homepage_trends: {
        Row: {
          id: string
          title: string
          artist: string
          discogs_id: number | null
          cover: string | null
          position: number
          created_at: string | null
        }
        Insert: {
          id?: string
          title: string
          artist: string
          discogs_id?: number | null
          cover?: string | null
          position?: number
          created_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          artist?: string
          discogs_id?: number | null
          cover?: string | null
          position?: number
          created_at?: string | null
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
