-- Rendre les profils, collections et wishlists lisibles par tous (profils publics)
create policy "profiles_select_public"
  on public.profiles for select
  using (true);

create policy "user_collection_select_public"
  on public.user_collection for select
  using (true);

create policy "user_favorites_select_public"
  on public.user_favorites for select
  using (true);
