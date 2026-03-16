-- FK pour joindre vinyl_reviews avec profiles (profiles.id = auth.users.id)
alter table public.vinyl_reviews
  add constraint vinyl_reviews_user_id_profiles_fkey
  foreign key (user_id) references public.profiles(id)
  on delete cascade;
