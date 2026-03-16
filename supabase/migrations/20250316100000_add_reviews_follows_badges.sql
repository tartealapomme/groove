-- ═══════════════════════════════════════
-- 1. VINYL REVIEWS
-- ═══════════════════════════════════════
create table if not exists public.vinyl_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  discogs_id integer not null,
  rating smallint not null check (rating >= 1 and rating <= 5),
  title text,
  body text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint vinyl_reviews_user_vinyl unique (user_id, discogs_id)
);

create index if not exists idx_vinyl_reviews_discogs on public.vinyl_reviews(discogs_id);
create index if not exists idx_vinyl_reviews_user on public.vinyl_reviews(user_id);

alter table public.vinyl_reviews enable row level security;

create policy "Anyone can read reviews"
  on public.vinyl_reviews for select using (true);

create policy "Users can insert own reviews"
  on public.vinyl_reviews for insert
  with check (auth.uid() = user_id);

create policy "Users can update own reviews"
  on public.vinyl_reviews for update
  using (auth.uid() = user_id);

create policy "Users can delete own reviews"
  on public.vinyl_reviews for delete
  using (auth.uid() = user_id);

-- ═══════════════════════════════════════
-- 2. USER FOLLOWS
-- ═══════════════════════════════════════
create table if not exists public.user_follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid references auth.users(id) on delete cascade not null,
  following_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now(),
  constraint user_follows_unique unique (follower_id, following_id),
  constraint user_follows_no_self check (follower_id != following_id)
);

create index if not exists idx_user_follows_follower on public.user_follows(follower_id);
create index if not exists idx_user_follows_following on public.user_follows(following_id);

alter table public.user_follows enable row level security;

create policy "Anyone can see follows"
  on public.user_follows for select using (true);

create policy "Users can follow"
  on public.user_follows for insert
  with check (auth.uid() = follower_id);

create policy "Users can unfollow"
  on public.user_follows for delete
  using (auth.uid() = follower_id);

-- ═══════════════════════════════════════
-- 3. USER BADGES
-- ═══════════════════════════════════════
create table if not exists public.user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  badge_key text not null,
  unlocked_at timestamptz default now(),
  constraint user_badges_unique unique (user_id, badge_key)
);

create index if not exists idx_user_badges_user on public.user_badges(user_id);

alter table public.user_badges enable row level security;

create policy "Anyone can see badges"
  on public.user_badges for select using (true);

create policy "System can insert badges"
  on public.user_badges for insert
  with check (auth.uid() = user_id);

-- Add display_name to profiles for public profile features
alter table public.profiles
  add column if not exists display_name text,
  add column if not exists avatar_url text,
  add column if not exists bio text;
