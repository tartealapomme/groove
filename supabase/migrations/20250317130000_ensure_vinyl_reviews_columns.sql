-- S'assurer que les colonnes vinyl existent (au cas où 20250316200000 n'a pas été appliquée)
alter table public.vinyl_reviews
  add column if not exists vinyl_title text,
  add column if not exists vinyl_artist text,
  add column if not exists vinyl_thumb text;
