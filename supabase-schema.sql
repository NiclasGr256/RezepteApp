create table public.recipes (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id uuid not null default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 150),
  ingredients text not null check (char_length(ingredients) between 1 and 10000),
  instructions text not null check (char_length(instructions) between 1 and 20000),
  servings integer check (servings between 1 and 1000),
  labels text[] not null default '{}' check (
    cardinality(labels) <= 13 and labels <@ array[
      'Frühstück', 'Mittagessen', 'Abendessen', 'Snack', 'Suppe', 'Salat',
      'Hauptgericht', 'Dessert', 'Backen', 'Schnell (bis 30 Min.)',
      'Einfach', 'Vegetarisch', 'Vegan'
    ]
  ),
  photo text not null default '' check (
    photo = '' or (char_length(photo) <= 2500000 and photo ~ '^data:image/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$')
  ),
  created_at timestamptz not null default now(),
  primary key (user_id, id)
);

create index recipes_user_recent_idx on public.recipes (user_id, created_at desc, id desc);

alter table public.recipes enable row level security;
revoke all on table public.recipes from public, anon, authenticated;
grant select, insert, update, delete on table public.recipes to authenticated;

create policy own_recipes on public.recipes
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
