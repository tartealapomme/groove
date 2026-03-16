-- User preferences (genres & artists from onboarding)
-- Replaces localStorage-only storage with persistent server-side data
create table if not exists public.user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  genres text[] default '{}',
  artists text[] default '{}',
  onboarding_completed boolean default false,
  updated_at timestamptz default now(),
  created_at timestamptz default now(),
  constraint user_preferences_user_id_key unique (user_id)
);

alter table public.user_preferences enable row level security;

create policy "Users can read own preferences"
  on public.user_preferences for select
  using (auth.uid() = user_id);

create policy "Users can insert own preferences"
  on public.user_preferences for insert
  with check (auth.uid() = user_id);

create policy "Users can update own preferences"
  on public.user_preferences for update
  using (auth.uid() = user_id);

-- Auto-create preferences row on user signup
create or replace function public.handle_new_user_preferences()
returns trigger as $$
begin
  insert into public.user_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created_preferences on auth.users;
create trigger on_auth_user_created_preferences
  after insert on auth.users
  for each row execute function public.handle_new_user_preferences();
