/**
 * Supabase connection config.
 *
 * IMPORTANT:
 *   - This "publishable" key (Supabase's new name for the anon key) is safe
 *     to ship in frontend code — it is designed to be public. Real
 *     protection comes from Row Level Security (RLS), set up in
 *     supabase/rls_policies.sql.
 *   - NEVER put a "secret key" / "service_role" key here or anywhere in
 *     frontend code. It bypasses RLS completely and must stay server-side only.
 */
window.SUPABASE_CONFIG = {
  url: 'https://ejiclrpdxlgfolwmnocs.supabase.co',
  anonKey: 'sb_publishable_bq6-ipRaG1DHAHdv8s9ouQ_UPY6ES3d',
};
