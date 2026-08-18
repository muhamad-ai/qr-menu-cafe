/**
 * Login page logic (admin/index.html).
 */
(function () {
  const form = document.getElementById('loginForm');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const errorBox = document.getElementById('loginError');
  const submitBtn = document.getElementById('loginSubmit');

  const params = new URLSearchParams(location.search);
  if (params.get('reason') === 'not_authorized') {
    showError('ئەم هەژمارە ڕێگەپێدراو نییە بۆ چوونەژوورەوەی dashboard. پەیوەندی بە خاوەنی کافێکە بکە.');
  }

  function showError(message) {
    errorBox.textContent = message;
    errorBox.hidden = false;
  }

  function hideError() {
    errorBox.hidden = true;
  }

  async function redirectIfAlreadyAdmin() {
    const { data } = await window.sb.auth.getSession();
    if (!data.session) return;
    const { data: adminRow } = await window.sb
      .from('admins')
      .select('id')
      .eq('id', data.session.user.id)
      .maybeSingle();
    if (adminRow) location.href = 'dashboard.html';
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      showError('تکایە ئیمەیل و تێپەڕەوشە هەردووکیان بنووسە.');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'چوونەژوورەوە...';

    try {
      const { data, error } = await window.sb.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const { data: adminRow, error: adminErr } = await window.sb
        .from('admins')
        .select('id')
        .eq('id', data.user.id)
        .maybeSingle();

      if (adminErr || !adminRow) {
        await window.sb.auth.signOut();
        showError('ئەم هەژمارە ڕێگەپێدراو نییە بۆ چوونەژوورەوەی dashboard.');
        return;
      }

      location.href = 'dashboard.html';
    } catch (err) {
      showError(err.message || 'چوونەژوورەوە سەرنەکەوت. ئیمەیل و تێپەڕەوشەکەت بپشکنە.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'چوونەژوورەوە';
    }
  });

  redirectIfAlreadyAdmin();
})();
