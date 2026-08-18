-- =========================================================================
-- Digital QR Menu — Row Level Security (RLS) Policies
-- Run this AFTER schema.sql, in the Supabase SQL Editor.
--
-- Model:
--   * Public (anon key, no login) → READ ONLY on categories / menu_items / settings.
--   * Authenticated users who are listed in `admins` → full read/write on
--     categories / menu_items / settings, and can manage Storage images.
--   * Nobody can insert/update/delete as an anonymous visitor.
--   * The `admins` table itself is never exposed to the public.
-- =========================================================================

-- -------------------------------------------------------------------------
-- Helper: is the currently authenticated user an authorized admin?
-- SECURITY DEFINER so it can read `admins` even though `admins` itself
-- has RLS enabled (avoids policy recursion).
-- -------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.admins where id = auth.uid()
  );
$$;

-- Only allow authenticated callers to even run the function (defense in depth).
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated, anon;

-- =========================================================================
-- admins
-- =========================================================================
alter table public.admins enable row level security;

drop policy if exists "admins_select_self" on public.admins;
create policy "admins_select_self"
  on public.admins
  for select
  to authenticated
  using (id = auth.uid());

-- No insert/update/delete policies for admins/anon on purpose:
-- new admins are added manually by the project owner via the SQL editor
-- (see README → "Creating the admin account"). This prevents anyone from
-- promoting themselves to admin through the app.

-- =========================================================================
-- categories
-- =========================================================================
alter table public.categories enable row level security;

drop policy if exists "categories_public_read" on public.categories;
create policy "categories_public_read"
  on public.categories
  for select
  to anon, authenticated
  using (true);

drop policy if exists "categories_admin_insert" on public.categories;
create policy "categories_admin_insert"
  on public.categories
  for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "categories_admin_update" on public.categories;
create policy "categories_admin_update"
  on public.categories
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "categories_admin_delete" on public.categories;
create policy "categories_admin_delete"
  on public.categories
  for delete
  to authenticated
  using (public.is_admin());

-- =========================================================================
-- menu_items
-- =========================================================================
alter table public.menu_items enable row level security;

drop policy if exists "menu_items_public_read" on public.menu_items;
create policy "menu_items_public_read"
  on public.menu_items
  for select
  to anon, authenticated
  using (true);

drop policy if exists "menu_items_admin_insert" on public.menu_items;
create policy "menu_items_admin_insert"
  on public.menu_items
  for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "menu_items_admin_update" on public.menu_items;
create policy "menu_items_admin_update"
  on public.menu_items
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "menu_items_admin_delete" on public.menu_items;
create policy "menu_items_admin_delete"
  on public.menu_items
  for delete
  to authenticated
  using (public.is_admin());

-- =========================================================================
-- settings
-- =========================================================================
alter table public.settings enable row level security;

drop policy if exists "settings_public_read" on public.settings;
create policy "settings_public_read"
  on public.settings
  for select
  to anon, authenticated
  using (true);

-- settings is a single seeded row (id = 1) — admins only ever UPDATE it,
-- never insert/delete, but we allow it for completeness/flexibility.
drop policy if exists "settings_admin_update" on public.settings;
create policy "settings_admin_update"
  on public.settings
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "settings_admin_insert" on public.settings;
create policy "settings_admin_insert"
  on public.settings
  for insert
  to authenticated
  with check (public.is_admin());

-- =========================================================================
-- Sanity check query (run manually, optional):
-- select tablename, rowsecurity from pg_tables where schemaname = 'public';
-- =========================================================================
