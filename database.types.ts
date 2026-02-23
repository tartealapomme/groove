// Types Supabase à ajuster selon ton schéma réel.
// Pour démarrer, on laisse une structure minimale compatible avec le module @nuxtjs/supabase.

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
      // Exemple : table profiles à adapter à ton modèle
      profiles: {
        Row: {
          id: string
          email: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          email?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          email?: string | null
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

