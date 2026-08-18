/**
 * Minimal i18n helper for the public menu (UI chrome strings only —
 * the actual category/item content comes from the database columns
 * name_ku / name_ar / name_en, description_ku / description_ar / description_en).
 */
const I18N = {
  ku: {
    dir: 'rtl',
    strings: {
      menu_loading: 'مێنیو باردەکرێت...',
      menu_empty: 'هێشتا هیچ بابەتێک زیاد نەکراوە.',
      category_empty: 'هێشتا هیچ بابەتێک لەم بەشەدا نییە.',
      unavailable: 'ئێستا بەردەست نییە',
      search_placeholder: 'گەڕان بۆ خواردنەوە...',
      all_categories: 'هەموو',
      error_loading: 'هەڵەیەک ڕوویدا لە بارکردنی مێنیو. تکایە دووبارە هەوڵ بدەرەوە.',
      retry: 'دووبارە هەوڵبدەرەوە',
      language: 'زمان',
    },
  },
  ar: {
    dir: 'rtl',
    strings: {
      menu_loading: 'جاري تحميل القائمة...',
      menu_empty: 'لم تتم إضافة أي عناصر بعد.',
      category_empty: 'لا توجد عناصر في هذا القسم بعد.',
      unavailable: 'غير متوفر حالياً',
      search_placeholder: 'ابحث عن مشروب أو طبق...',
      all_categories: 'الكل',
      error_loading: 'حدث خطأ أثناء تحميل القائمة. الرجاء المحاولة مرة أخرى.',
      retry: 'إعادة المحاولة',
      language: 'اللغة',
    },
  },
  en: {
    dir: 'ltr',
    strings: {
      menu_loading: 'Loading menu...',
      menu_empty: 'No items have been added yet.',
      category_empty: 'No items in this category yet.',
      unavailable: 'Currently unavailable',
      search_placeholder: 'Search the menu...',
      all_categories: 'All',
      error_loading: 'Something went wrong loading the menu. Please try again.',
      retry: 'Retry',
      language: 'Language',
    },
  },
};

const LANG_STORAGE_KEY = 'qr_menu_lang';

function getStoredLang(defaultLang) {
  try {
    const stored = localStorage.getItem(LANG_STORAGE_KEY);
    if (stored && I18N[stored]) return stored;
  } catch (e) {
    /* localStorage unavailable (private mode etc.) — fall back silently */
  }
  return I18N[defaultLang] ? defaultLang : 'ku';
}

function setStoredLang(lang) {
  try {
    localStorage.setItem(LANG_STORAGE_KEY, lang);
  } catch (e) {
    /* ignore */
  }
}

function t(key, lang) {
  const dict = I18N[lang] || I18N.ku;
  return dict.strings[key] || key;
}

function applyDocumentDirection(lang) {
  const dir = (I18N[lang] || I18N.ku).dir;
  document.documentElement.setAttribute('lang', lang);
  document.documentElement.setAttribute('dir', dir);
}

/** Pick the best available localized field, falling back to Kurdish then any non-empty value. */
function localizedField(row, baseName, lang) {
  const order =
    lang === 'ar' ? ['ar', 'ku', 'en'] : lang === 'en' ? ['en', 'ku', 'ar'] : ['ku', 'ar', 'en'];
  for (const code of order) {
    const val = row[`${baseName}_${code}`];
    if (val && String(val).trim() !== '') return val;
  }
  return '';
}
