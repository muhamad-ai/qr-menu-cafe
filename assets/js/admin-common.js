/**
 * Shared helpers for every admin dashboard page:
 *   - auth guard (redirect to login if not an authorized admin)
 *   - sidebar/topbar wiring
 *   - toast notifications
 *   - confirm-before-delete dialog
 *
 * Every admin/*.html page (except admin/index.html, the login page) should
 * call `Admin.guard()` before doing anything else.
 */
const Admin = (function () {
  let currentUser = null;

  async function guard() {
    const { data, error } = await window.sb.auth.getSession();
    if (error || !data.session) {
      redirectToLogin();
      return null;
    }

    const uid = data.session.user.id;
    const { data: adminRow, error: adminErr } = await window.sb
      .from('admins')
      .select('id, full_name')
      .eq('id', uid)
      .maybeSingle();

    if (adminErr || !adminRow) {
      // Authenticated with Supabase, but not whitelisted as an admin.
      await window.sb.auth.signOut();
      redirectToLogin('not_authorized');
      return null;
    }

    currentUser = { id: uid, email: data.session.user.email, fullName: adminRow.full_name };
    initShell();
    return currentUser;
  }

  function redirectToLogin(reason) {
    const base = location.pathname.includes('/admin/') ? 'index.html' : 'admin/index.html';
    location.href = reason ? `${base}?reason=${reason}` : base;
  }

  const NAV_ITEMS = [
    { page: 'dashboard.html', label: 'گشتی' },
    { page: 'categories.html', label: 'بەشەکان' },
    { page: 'items.html', label: 'خواردنەوەکان' },
    { page: 'settings.html', label: 'ڕێکخستنەکان' },
  ];

  function initShell() {
    const sidebar = document.getElementById('sidebar');
    const page = location.pathname.split('/').pop() || 'dashboard.html';

    if (sidebar) {
      const links = NAV_ITEMS.map(
        (item) =>
          `<a href="${item.page}" data-page="${item.page}" class="${item.page === page ? 'active' : ''}">${item.label}</a>`
      ).join('');

      sidebar.innerHTML = `
        <div class="sidebar__brand">☕ بەڕێوەبردنی مێنیو</div>
        ${links}
        <div class="sidebar__footer">
          <div id="currentUserLabel" style="font-size:0.78rem;opacity:0.75;margin-bottom:8px;"></div>
          <button id="logoutBtn" class="btn btn-secondary btn-block" type="button">دەرچوون</button>
        </div>
      `;
    }

    const toggleBtn = document.getElementById('mobileMenuBtn');
    if (toggleBtn && sidebar) {
      toggleBtn.addEventListener('click', () => sidebar.classList.toggle('open'));
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        await window.sb.auth.signOut();
        redirectToLogin();
      });
    }

    const userLabel = document.getElementById('currentUserLabel');
    if (userLabel && currentUser) {
      userLabel.textContent = currentUser.fullName || currentUser.email;
    }
  }

  function ensureToastStack() {
    let stack = document.getElementById('toastStack');
    if (!stack) {
      stack = document.createElement('div');
      stack.id = 'toastStack';
      stack.className = 'toast-stack';
      document.body.appendChild(stack);
    }
    return stack;
  }

  function toast(message, type = 'success', duration = 3200) {
    const stack = ensureToastStack();
    const el = document.createElement('div');
    el.className = `toast toast-${type === 'error' ? 'error' : 'success'}`;
    el.textContent = message;
    stack.appendChild(el);
    setTimeout(() => el.remove(), duration);
  }

  function confirmAction({ title, message, confirmLabel = 'سڕینەوە', danger = true }) {
    return new Promise((resolve) => {
      const backdrop = document.createElement('div');
      backdrop.className = 'modal-backdrop';
      backdrop.innerHTML = `
        <div class="modal" role="alertdialog" aria-modal="true" aria-labelledby="confirmTitle">
          <h2 id="confirmTitle">${title}</h2>
          <p>${message}</p>
          <div class="modal-actions">
            <button type="button" class="btn btn-ghost" data-action="cancel">پاشگەزبوونەوە</button>
            <button type="button" class="btn ${danger ? 'btn-danger' : ''}" data-action="confirm">${confirmLabel}</button>
          </div>
        </div>
      `;
      document.body.appendChild(backdrop);

      backdrop.addEventListener('click', (e) => {
        const action = e.target?.dataset?.action;
        if (e.target === backdrop || action === 'cancel') {
          backdrop.remove();
          resolve(false);
        } else if (action === 'confirm') {
          backdrop.remove();
          resolve(true);
        }
      });
    });
  }

  function friendlyError(error) {
    if (!error) return 'Unknown error';
    if (error.message) return error.message;
    return String(error);
  }

  /**
   * Client-side image resize/compress before upload, to keep the public
   * menu fast on mobile AND to make every uploaded image of a given kind
   * come out the exact same shape/size (not just visually via CSS, but as
   * the actual stored file).
   *
   * If `aspectRatio` is given (width/height, e.g. 1 for square, 16/9 for a
   * wide banner), the source image is first center-cropped to that ratio,
   * then the whole thing is scaled so its longest side is `maxDimension`.
   * Two photos of totally different original sizes/orientations therefore
   * always produce output files with identical dimensions for the same
   * `{ aspectRatio, maxDimension }` pair.
   */
  function compressImage(file, { maxDimension = 1200, quality = 0.8, aspectRatio = null } = {}) {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        reject(new Error('Selected file is not an image.'));
        return;
      }

      const img = new Image();
      const reader = new FileReader();

      reader.onload = () => {
        img.onload = () => {
          // Source crop rectangle (defaults to the full image).
          let sx = 0;
          let sy = 0;
          let sWidth = img.width;
          let sHeight = img.height;

          if (aspectRatio) {
            const currentRatio = img.width / img.height;
            if (currentRatio > aspectRatio) {
              // Image is wider than target ratio: crop the sides.
              sWidth = Math.round(img.height * aspectRatio);
              sx = Math.round((img.width - sWidth) / 2);
            } else if (currentRatio < aspectRatio) {
              // Image is taller than target ratio: crop top/bottom.
              sHeight = Math.round(img.width / aspectRatio);
              sy = Math.round((img.height - sHeight) / 2);
            }
          }

          // Output size: same aspect as the crop, capped to maxDimension
          // on the longer side — this is what makes every image of the
          // same kind end up an identical width x height.
          let outWidth = sWidth;
          let outHeight = sHeight;
          const longSide = Math.max(outWidth, outHeight);
          if (longSide > maxDimension) {
            const scale = maxDimension / longSide;
            outWidth = Math.round(outWidth * scale);
            outHeight = Math.round(outHeight * scale);
          }

          const canvas = document.createElement('canvas');
          canvas.width = outWidth;
          canvas.height = outHeight;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, outWidth, outHeight);

          canvas.toBlob(
            (blob) => (blob ? resolve(blob) : reject(new Error('Image compression failed.'))),
            'image/jpeg',
            quality
          );
        };
        img.onerror = () => reject(new Error('Could not read image file.'));
        img.src = reader.result;
      };
      reader.onerror = () => reject(new Error('Could not read image file.'));
      reader.readAsDataURL(file);
    });
  }

  async function uploadImage(file, folder, compressOptions = {}) {
    const compressed = await compressImage(file, compressOptions);
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
    const { error: uploadErr } = await window.sb.storage
      .from('menu-images')
      .upload(fileName, compressed, { contentType: 'image/jpeg', upsert: false });
    if (uploadErr) throw uploadErr;
    const { data } = window.sb.storage.from('menu-images').getPublicUrl(fileName);
    return data.publicUrl;
  }

  // Shared presets so every page uses the exact same target size per kind.
  const IMAGE_PRESETS = {
    item: { maxDimension: 800, aspectRatio: 1 }, // square, 800x800
    logo: { maxDimension: 500, aspectRatio: 1 }, // square, 500x500
    background: { maxDimension: 1600, aspectRatio: 16 / 9 }, // wide banner, 1600x900
  };

  return {
    guard,
    toast,
    confirmAction,
    friendlyError,
    compressImage,
    uploadImage,
    IMAGE_PRESETS,
    getCurrentUser: () => currentUser,
  };
})();
