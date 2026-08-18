-- =========================================================================
-- Digital QR Menu — Supabase Storage setup
-- Run AFTER schema.sql and rls_policies.sql.
--
-- Creates one public bucket ("menu-images") used for:
--   * café logo
--   * café background photo
--   * menu item photos
--
-- Public visitors need to be able to VIEW these images (they're shown on
-- the menu without login), but only admins may upload/replace/delete them.
-- =========================================================================

-- 1) Create the bucket (id and name both "menu-images"), marked public so
--    image URLs work directly in <img src="..."> without a signed URL.
insert into storage.buckets (id, name, public)
values ('menu-images', 'menu-images', true)
on conflict (id) do nothing;

-- 2) Storage RLS policies live on storage.objects.
alter table storage.objects enable row level security;

-- Public read for anything inside the menu-images bucket.
drop policy if exists "menu_images_public_read" on storage.objects;
create policy "menu_images_public_read"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'menu-images');

-- Only authorized admins may upload new files.
drop policy if exists "menu_images_admin_insert" on storage.objects;
create policy "menu_images_admin_insert"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'menu-images' and public.is_admin());

-- Only authorized admins may replace/update files.
drop policy if exists "menu_images_admin_update" on storage.objects;
create policy "menu_images_admin_update"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'menu-images' and public.is_admin())
  with check (bucket_id = 'menu-images' and public.is_admin());

-- Only authorized admins may delete files.
drop policy if exists "menu_images_admin_delete" on storage.objects;
create policy "menu_images_admin_delete"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'menu-images' and public.is_admin());

-- =========================================================================
-- Notes:
--   * The dashboard also lets you create/inspect this bucket visually under
--     Storage → Buckets. If you prefer the UI, just make sure:
--       - Bucket name: menu-images
--       - Public bucket: ON
--     then re-run just the policy statements above.
--   * Recommended folder convention inside the bucket:
--       logos/…        café logo
--       backgrounds/…  café background photo
--       items/…        menu item photos
-- =========================================================================
