(function () {
  let pendingLogoFile = null;
  let pendingBackgroundFile = null;
  let existingLogoUrl = null;
  let existingBackgroundUrl = null;

  const form = document.getElementById('settingsForm');
  const cafeNameKu = document.getElementById('cafeNameKu');
  const cafeNameKuError = document.getElementById('cafeNameKuError');
  const cafeNameAr = document.getElementById('cafeNameAr');
  const cafeNameEn = document.getElementById('cafeNameEn');
  const logoInput = document.getElementById('logoInput');
  const logoPreview = document.getElementById('logoPreview');
  const backgroundInput = document.getElementById('backgroundInput');
  const backgroundPreview = document.getElementById('backgroundPreview');
  const themePrimary = document.getElementById('themePrimary');
  const themeSecondary = document.getElementById('themeSecondary');
  const currencyCode = document.getElementById('currencyCode');
  const currencySymbol = document.getElementById('currencySymbol');
  const defaultLanguage = document.getElementById('defaultLanguage');
  const saveBtn = document.getElementById('settingsSaveBtn');

  function previewFile(fileInput, previewEl, onSelected) {
    fileInput.addEventListener('change', () => {
      const file = fileInput.files[0];
      if (!file) return;
      onSelected(file);
      const reader = new FileReader();
      reader.onload = () => {
        previewEl.src = reader.result;
        previewEl.hidden = false;
      };
      reader.readAsDataURL(file);
    });
  }

  previewFile(logoInput, logoPreview, (file) => (pendingLogoFile = file));
  previewFile(backgroundInput, backgroundPreview, (file) => (pendingBackgroundFile = file));

  async function loadSettings() {
    try {
      const { data, error } = await window.sb.from('settings').select('*').eq('id', 1).single();
      if (error) throw error;

      cafeNameKu.value = data.cafe_name_ku || '';
      cafeNameAr.value = data.cafe_name_ar || '';
      cafeNameEn.value = data.cafe_name_en || '';
      themePrimary.value = data.theme_primary || '#1f1410';
      themeSecondary.value = data.theme_secondary || '#c9a15a';
      currencyCode.value = data.currency_code || '';
      currencySymbol.value = data.currency_symbol || '';
      defaultLanguage.value = data.default_language || 'ku';

      if (data.logo_url) {
        existingLogoUrl = data.logo_url;
        logoPreview.src = data.logo_url;
        logoPreview.hidden = false;
      }
      if (data.background_url) {
        existingBackgroundUrl = data.background_url;
        backgroundPreview.src = data.background_url;
        backgroundPreview.hidden = false;
      }
    } catch (err) {
      Admin.toast(Admin.friendlyError(err), 'error');
    }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    cafeNameKuError.textContent = '';

    const nameKu = cafeNameKu.value.trim();
    if (!nameKu) {
      cafeNameKuError.textContent = 'ناوی کوردی کافێ پێویستە.';
      return;
    }

    saveBtn.disabled = true;
    saveBtn.textContent = 'پاشەکەوتکردن...';

    try {
      let logoUrl = existingLogoUrl;
      if (pendingLogoFile) {
        logoUrl = await Admin.uploadImage(pendingLogoFile, 'logos', Admin.IMAGE_PRESETS.logo);
      }

      let backgroundUrl = existingBackgroundUrl;
      if (pendingBackgroundFile) {
        backgroundUrl = await Admin.uploadImage(pendingBackgroundFile, 'backgrounds', Admin.IMAGE_PRESETS.background);
      }

      const payload = {
        cafe_name_ku: nameKu,
        cafe_name_ar: cafeNameAr.value.trim() || null,
        cafe_name_en: cafeNameEn.value.trim() || null,
        logo_url: logoUrl || null,
        background_url: backgroundUrl || null,
        theme_primary: themePrimary.value,
        theme_secondary: themeSecondary.value,
        currency_code: currencyCode.value.trim() || 'IQD',
        currency_symbol: currencySymbol.value.trim() || currencyCode.value.trim() || 'IQD',
        default_language: defaultLanguage.value,
      };

      const { error } = await window.sb.from('settings').update(payload).eq('id', 1);
      if (error) throw error;

      Admin.toast('ڕێکخستنەکان پاشەکەوتکران.');
      pendingLogoFile = null;
      pendingBackgroundFile = null;
    } catch (err) {
      Admin.toast(Admin.friendlyError(err), 'error');
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'پاشەکەوتکردنی ڕێکخستنەکان';
    }
  });

  (async function init() {
    const user = await Admin.guard();
    if (!user) return;
    await loadSettings();
  })();
})();
