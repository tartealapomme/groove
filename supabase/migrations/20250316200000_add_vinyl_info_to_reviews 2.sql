-- Ajouter infos vinyle aux reviews pour affichage sur le profil
alter table public.vinyl_reviews
  add column if not exists vinyl_title text,
  add column if not exists vinyl_artist text,
  add column if not exists vinyl_thumb text;
