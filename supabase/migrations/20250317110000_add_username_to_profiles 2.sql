-- Pseudo unique pour l'URL du profil (ex: /profil/johndoe)
-- Nullable pour les utilisateurs existants
alter table public.profiles
  add column if not exists username text;

-- Unique case-insensitive (John = john)
create unique index if not exists profiles_username_lower_key
  on public.profiles (lower(username)) where username is not null;

-- Contrainte : 3-30 caractères, lettres minuscules, chiffres, underscore uniquement
alter table public.profiles
  drop constraint if exists profiles_username_format;
alter table public.profiles
  add constraint profiles_username_format
  check (username is null or (username ~ '^[a-z0-9_]{3,30}$'));
