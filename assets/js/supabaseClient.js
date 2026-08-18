/**
 * Shared Supabase client instance.
 * Requires:
 *   - the Supabase JS SDK (loaded via CDN in each HTML page)
 *   - config.js (copied from config.example.js) defining window.SUPABASE_CONFIG
 */
(function () {
  if (!window.SUPABASE_CONFIG || !window.SUPABASE_CONFIG.url || !window.SUPABASE_CONFIG.anonKey) {
    console.error(
      '[supabaseClient] Missing config.js. Copy assets/js/config.example.js to assets/js/config.js and fill in your Supabase URL + anon key.'
    );
  }

  const { createClient } = supabase;

  window.sb = createClient(
    window.SUPABASE_CONFIG?.url || '',
    window.SUPABASE_CONFIG?.anonKey || '',
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    }
  );
})();
