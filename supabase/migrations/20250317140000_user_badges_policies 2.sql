-- Active le RLS sur la table user_badges (si ce n'est pas déjà fait)
alter table public.user_badges enable row level security;

-- Contrainte d'unicité pour éviter plusieurs fois le même badge par utilisateur
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'user_badges_user_badge_unique'
  ) then
    alter table public.user_badges
      add constraint user_badges_user_badge_unique
      unique (user_id, badge_key);
  end if;
end $$;

-- Policy : chaque utilisateur peut voir ses propres badges
create policy "Users can select own badges"
on public.user_badges
for select
to authenticated
using (auth.uid() = user_id);

-- Policy : chaque utilisateur peut insérer ses propres badges
create policy "Users can insert own badges"
on public.user_badges
for insert
to authenticated
with check (auth.uid() = user_id);

