-- =========================================================================
-- Digital QR Menu — Database Schema
-- Run this file in: Supabase Dashboard → SQL Editor → New query → Run
-- =========================================================================

-- Needed for gen_random_uuid()
create extension if not exists "pgcrypto";

-- -------------------------------------------------------------------------
-- 1. admins
--    Whitelist of Supabase Auth users who are allowed to manage the menu.
--    A row here does NOT create a login — it only *authorizes* an existing
--    Supabase Auth user (created in Authentication → Users) to write data.
-- -------------------------------------------------------------------------
create table if not exists public.admins (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  created_at  timestamptz not null default now()
);

comment on table public.admins is 'Whitelist of auth.users allowed to manage the café menu (dashboard access).';

-- -------------------------------------------------------------------------
-- 2. categories
-- -------------------------------------------------------------------------
create table if not exists public.categories (
  id           uuid primary key default gen_random_uuid(),
  name_ku      text not null,
  name_ar      text,
  name_en      text,
  sort_order   integer not null default 0,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.categories is 'Menu categories (e.g. Hot Drinks, Cold Drinks, Desserts).';

-- -------------------------------------------------------------------------
-- 3. menu_items
-- -------------------------------------------------------------------------
create table if not exists public.menu_items (
  id              uuid primary key default gen_random_uuid(),
  category_id     uuid not null references public.categories (id) on delete cascade,
  name_ku         text not null,
  name_ar         text,
  name_en         text,
  description_ku  text,
  description_ar  text,
  description_en  text,
  price           numeric(10, 2) not null check (price >= 0),
  image_url       text,
  is_available    boolean not null default true,
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table public.menu_items is 'Individual menu items (drinks/food) belonging to a category.';

create index if not exists menu_items_category_id_idx on public.menu_items (category_id);
create index if not exists menu_items_sort_idx on public.menu_items (category_id, sort_order);
create index if not exists categories_sort_idx on public.categories (sort_order);

-- -------------------------------------------------------------------------
-- 4. settings
--    Single-row table (id is always 1) holding café-wide configuration.
-- -------------------------------------------------------------------------
create table if not exists public.settings (
  id                 smallint primary key default 1,
  cafe_name_ku       text not null default 'کافێی من',
  cafe_name_ar       text default 'مقهاي',
  cafe_name_en       text default 'My Café',
  logo_url           text,
  background_url     text,
  theme_primary      text not null default '#1f1410',
  theme_secondary    text not null default '#c9a15a',
  currency_code      text not null default 'IQD',
  currency_symbol    text not null default 'د.ع',
  default_language   text not null default 'ku' check (default_language in ('ku', 'ar', 'en')),
  updated_at         timestamptz not null default now(),
  constraint settings_singleton check (id = 1)
);

comment on table public.settings is 'Single-row table holding café branding & configuration used by the public menu.';

-- Seed the one settings row so the app always has something to read.
insert into public.settings (id)
values (1)
on conflict (id) do nothing;

-- -------------------------------------------------------------------------
-- updated_at auto-touch triggers
-- -------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_categories_updated_at on public.categories;
create trigger trg_categories_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

drop trigger if exists trg_menu_items_updated_at on public.menu_items;
create trigger trg_menu_items_updated_at
  before update on public.menu_items
  for each row execute function public.set_updated_at();

drop trigger if exists trg_settings_updated_at on public.settings;
create trigger trg_settings_updated_at
  before update on public.settings
  for each row execute function public.set_updated_at();

-- =========================================================================
-- Next steps:
--   1. Run rls_policies.sql to lock the tables down.
--   2. Run storage_setup.sql to create the image storage bucket.
--   3. (Optional) Run seed.sql for demo data.
-- =========================================================================
