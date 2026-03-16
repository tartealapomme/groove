-- Migration: Création des tables user_collection et user_favorites pour GROOV
-- À exécuter dans Supabase SQL Editor : copier-coller ce fichier puis Run

-- =============================================================================
-- Table user_collection : vinyles dans la bibliothèque de l'utilisateur
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.user_collection (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  discogs_id integer NOT NULL,
  title text,
  artist text,
  year text,
  label text,
  genre text[] DEFAULT '{}',
  thumb text,
  cover text,
  condition text,
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, discogs_id)
);

-- Index pour les requêtes par user_id
CREATE INDEX IF NOT EXISTS idx_user_collection_user_id ON public.user_collection(user_id);
CREATE INDEX IF NOT EXISTS idx_user_collection_discogs_id ON public.user_collection(discogs_id);

-- =============================================================================
-- Table user_favorites : vinyles en wishlist (coups de cœur)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.user_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  discogs_id integer NOT NULL,
  title text,
  artist text,
  thumb text,
  cover text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, discogs_id)
);

-- Index pour les requêtes par user_id
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON public.user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_discogs_id ON public.user_favorites(discogs_id);

-- =============================================================================
-- Row Level Security (RLS)
-- =============================================================================

-- Activer RLS sur les deux tables
ALTER TABLE public.user_collection ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

-- Politiques user_collection (DROP IF EXISTS pour ré-exécution)
DROP POLICY IF EXISTS "user_collection_select_own" ON public.user_collection;
DROP POLICY IF EXISTS "user_collection_insert_own" ON public.user_collection;
DROP POLICY IF EXISTS "user_collection_update_own" ON public.user_collection;
DROP POLICY IF EXISTS "user_collection_delete_own" ON public.user_collection;

CREATE POLICY "user_collection_select_own"
  ON public.user_collection FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "user_collection_insert_own"
  ON public.user_collection FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_collection_update_own"
  ON public.user_collection FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_collection_delete_own"
  ON public.user_collection FOR DELETE
  USING (auth.uid() = user_id);

-- Politiques user_favorites (DROP IF EXISTS pour ré-exécution)
DROP POLICY IF EXISTS "user_favorites_select_own" ON public.user_favorites;
DROP POLICY IF EXISTS "user_favorites_insert_own" ON public.user_favorites;
DROP POLICY IF EXISTS "user_favorites_update_own" ON public.user_favorites;
DROP POLICY IF EXISTS "user_favorites_delete_own" ON public.user_favorites;

CREATE POLICY "user_favorites_select_own"
  ON public.user_favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "user_favorites_insert_own"
  ON public.user_favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_favorites_update_own"
  ON public.user_favorites FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_favorites_delete_own"
  ON public.user_favorites FOR DELETE
  USING (auth.uid() = user_id);
