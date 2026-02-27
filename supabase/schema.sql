-- =============================================================================
-- FrancoisAI — Full Database Schema
-- Run this entire script in the Supabase SQL Editor for a fresh project.
-- After running, search for "REPLACE" to find the two placeholders you must
-- update before the app will accept sign-ins.
-- =============================================================================


-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type meal_type as enum ('breakfast', 'lunch', 'dinner', 'snack');
create type storage_location as enum ('fridge', 'freezer', 'pantry', 'other');
create type chat_role as enum ('user', 'model', 'tool');


-- ---------------------------------------------------------------------------
-- Helper: auto-update updated_at
-- ---------------------------------------------------------------------------

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;


-- ---------------------------------------------------------------------------
-- profiles
-- Mirror of auth.users — created automatically on sign-up via trigger below.
-- ---------------------------------------------------------------------------

create table profiles (
  id           uuid primary key references auth.users on delete cascade,
  display_name text not null,
  avatar_url   text,
  created_at   timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "Authenticated users can read all profiles"
  on profiles for select to authenticated using (true);

create policy "Users can update their own profile"
  on profiles for update to authenticated using (auth.uid() = id);


-- ---------------------------------------------------------------------------
-- recipes
-- ---------------------------------------------------------------------------

create table recipes (
  id                 uuid primary key default gen_random_uuid(),
  created_by         uuid references profiles(id) on delete set null,
  title              text not null,
  description        text,
  servings           int,
  prep_time_minutes  int,
  cook_time_minutes  int,
  image_url          text,
  source_url         text,
  tags               text[] not null default '{}',
  is_shared          boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

alter table recipes enable row level security;

create policy "Authenticated users can read all recipes"
  on recipes for select to authenticated using (true);

create policy "Authenticated users can insert recipes"
  on recipes for insert to authenticated with check (true);

create policy "Authenticated users can update recipes"
  on recipes for update to authenticated using (true);

create policy "Authenticated users can delete recipes"
  on recipes for delete to authenticated using (true);

create trigger recipes_updated_at
  before update on recipes
  for each row execute procedure update_updated_at();


-- ---------------------------------------------------------------------------
-- recipe_ingredients
-- ---------------------------------------------------------------------------

create table recipe_ingredients (
  id          uuid primary key default gen_random_uuid(),
  recipe_id   uuid not null references recipes(id) on delete cascade,
  name        text not null,
  quantity    numeric,
  unit        text,
  notes       text,
  order_index int not null default 0
);

alter table recipe_ingredients enable row level security;

create policy "Authenticated users can manage recipe ingredients"
  on recipe_ingredients for all to authenticated
  using (true) with check (true);


-- ---------------------------------------------------------------------------
-- recipe_steps
-- ---------------------------------------------------------------------------

create table recipe_steps (
  id          uuid primary key default gen_random_uuid(),
  recipe_id   uuid not null references recipes(id) on delete cascade,
  step_number int not null,
  instruction text not null
);

alter table recipe_steps enable row level security;

create policy "Authenticated users can manage recipe steps"
  on recipe_steps for all to authenticated
  using (true) with check (true);


-- ---------------------------------------------------------------------------
-- meal_entries
-- ---------------------------------------------------------------------------

create table meal_entries (
  id                uuid primary key default gen_random_uuid(),
  created_by        uuid references profiles(id) on delete set null,
  date              date not null,
  meal_type         meal_type not null,
  recipe_id         uuid references recipes(id) on delete set null,
  custom_meal_text  text,
  notes             text,
  order_index       int not null default 0,
  servings_override numeric,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

alter table meal_entries enable row level security;

create policy "Authenticated users can manage meal entries"
  on meal_entries for all to authenticated
  using (true) with check (true);

create trigger meal_entries_updated_at
  before update on meal_entries
  for each row execute procedure update_updated_at();


-- ---------------------------------------------------------------------------
-- inventory_items
-- ---------------------------------------------------------------------------

create table inventory_items (
  id          uuid primary key default gen_random_uuid(),
  added_by    uuid references profiles(id) on delete set null,
  name        text not null,
  quantity    numeric,
  unit        text,
  category    text,
  location    storage_location,
  expiry_date date,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table inventory_items enable row level security;

create policy "Authenticated users can manage inventory"
  on inventory_items for all to authenticated
  using (true) with check (true);

create trigger inventory_items_updated_at
  before update on inventory_items
  for each row execute procedure update_updated_at();


-- ---------------------------------------------------------------------------
-- shopping_lists
-- ---------------------------------------------------------------------------

create table shopping_lists (
  id           uuid primary key default gen_random_uuid(),
  created_by   uuid references profiles(id) on delete set null,
  name         text not null,
  is_completed boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table shopping_lists enable row level security;

create policy "Authenticated users can manage shopping lists"
  on shopping_lists for all to authenticated
  using (true) with check (true);

create trigger shopping_lists_updated_at
  before update on shopping_lists
  for each row execute procedure update_updated_at();


-- ---------------------------------------------------------------------------
-- shopping_list_items
-- ---------------------------------------------------------------------------

create table shopping_list_items (
  id          uuid primary key default gen_random_uuid(),
  list_id     uuid not null references shopping_lists(id) on delete cascade,
  added_by    uuid references profiles(id) on delete set null,
  recipe_id   uuid references recipes(id) on delete set null,
  name        text not null,
  quantity    numeric,
  unit        text,
  notes       text,
  category    text,
  order_index int not null default 0,
  is_checked  boolean not null default false
);

alter table shopping_list_items enable row level security;

create policy "Authenticated users can manage shopping list items"
  on shopping_list_items for all to authenticated
  using (true) with check (true);


-- ---------------------------------------------------------------------------
-- ai_chat_sessions
-- ---------------------------------------------------------------------------

create table ai_chat_sessions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  title      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table ai_chat_sessions enable row level security;

create policy "Users can manage their own chat sessions"
  on ai_chat_sessions for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create trigger ai_chat_sessions_updated_at
  before update on ai_chat_sessions
  for each row execute procedure update_updated_at();


-- ---------------------------------------------------------------------------
-- ai_chat_messages
-- ---------------------------------------------------------------------------

create table ai_chat_messages (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references ai_chat_sessions(id) on delete cascade,
  role        chat_role not null,
  content     text,
  raw_payload jsonb,
  created_at  timestamptz not null default now()
);

alter table ai_chat_messages enable row level security;

create policy "Users can manage messages in their own sessions"
  on ai_chat_messages for all to authenticated
  using (
    exists (
      select 1 from ai_chat_sessions
      where id = ai_chat_messages.session_id
      and user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from ai_chat_sessions
      where id = ai_chat_messages.session_id
      and user_id = auth.uid()
    )
  );


-- ---------------------------------------------------------------------------
-- staple_items
-- Weekly staples for the shopping list — auto-added every Monday.
-- ---------------------------------------------------------------------------

create table staple_items (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_by uuid references auth.users on delete set null,
  created_at timestamptz not null default now()
);

alter table staple_items enable row level security;

create policy "Authenticated users can manage staple items"
  on staple_items for all to authenticated
  using (true) with check (true);


-- ---------------------------------------------------------------------------
-- Auth trigger: create profile on sign-up
-- Pulls display name and avatar from Google OAuth metadata.
-- ---------------------------------------------------------------------------

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();


-- ---------------------------------------------------------------------------
-- Auth trigger: restrict sign-ups to 2 specific users
--
-- REPLACE the two placeholder addresses below with the Google account email
-- addresses of the two people who should have access, then run the script.
-- ---------------------------------------------------------------------------

create or replace function enforce_user_limit()
returns trigger as $$
declare
  user_count int;
begin
  -- Email allowlist — REPLACE these with your two Google account addresses
  if new.email not in (
    'REPLACE_WITH_USER1_EMAIL@gmail.com',
    'REPLACE_WITH_USER2_EMAIL@gmail.com'
  ) then
    raise exception 'Signups are restricted to invited users only.';
  end if;

  -- Hard cap at 2 users
  select count(*) into user_count from auth.users;
  if user_count >= 2 then
    raise exception 'This app is limited to 2 users.';
  end if;

  return new;
end;
$$ language plpgsql security definer;

create trigger enforce_user_limit_trigger
  before insert on auth.users
  for each row execute procedure enforce_user_limit();
