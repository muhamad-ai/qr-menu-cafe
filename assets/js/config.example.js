/**
 * Supabase connection config.
 *
 * 1. Copy this file to "config.js" (same folder).
 * 2. Fill in your project's URL and PUBLIC anon key
 *    (Supabase Dashboard → Project Settings → API).
 *
 * IMPORTANT:
 *   - The "anon" key is safe to ship in frontend code — it is designed to
 *     be public. Real protection comes from Row Level Security (RLS),
 *     which is set up in supabase/rls_policies.sql.
 *   - NEVER put the "service_role" key here or anywhere in frontend code.
 *     It bypasses RLS completely and must stay server-side only.
 */
window.SUPABASE_CONFIG = {
  url: 'https://YOUR-PROJECT-REF.supabase.co',
  anonKey: 'YOUR-PUBLIC-ANON-KEY',
};
