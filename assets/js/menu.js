/**
 * Public menu logic — VIEW ONLY.
 * No cart, no ordering, no accounts. Just: settings + categories + items.
 */
(function () {
  const els = {
    hero: document.getElementById('menuHero'),
    logo: document.getElementById('cafeLogo'),
    name: document.getElementById('cafeName'),
    tagline: document.getElementById('cafeTagline'),
    search: document.getElementById('menuSearch'),
    tabs: document.getElementById('categoryTabs'),
    loading: document.getElementById('loadingState'),
    loadingText: document.getElementById('loadingText'),
    error: document.getElementById('errorState'),
    errorText: document.getElementById('errorText'),
    retryBtn: document.getElementById('retryBtn'),
    empty: document.getElementById('emptyState'),
    emptyText: document.getElementById('emptyText'),
    container: document.getElementById('categoriesContainer'),
    footerText: document.getElementById('footerText'),
    langButtons: document.querySelectorAll('.lang-switch button'),
  };

  let state = {
    lang: 'ku',
    settings: null,
    categories: [],
    items: [],
    activeCategory: 'all',
    searchTerm: '',
  };

  function money(value, settings, lang) {
    const num = Number(value || 0);
    const formatted = num.toLocaleString(undefined, { maximumFractionDigits: 2 });
    // English readers see the plain number with no currency symbol; Kurdish
    // and Arabic keep the configured symbol (e.g. "د.ع").
    if (lang === 'en') return formatted;
    const symbol = settings?.currency_symbol || settings?.currency_code || '';
    return `${formatted} ${symbol}`.trim();
  }

  function setLoading(isLoading) {
    els.loading.hidden = !isLoading;
    if (isLoading) {
      els.error.hidden = true;
      els.empty.hidden = true;
      els.container.hidden = true;
    }
  }

  function setError(message) {
    els.loading.hidden = true;
    els.empty.hidden = true;
    els.container.hidden = true;
    els.error.hidden = false;
    els.errorText.textContent = message;
  }

  function setEmpty(message) {
    els.loading.hidden = true;
    els.error.hidden = true;
    els.container.hidden = true;
    els.empty.hidden = false;
    els.emptyText.textContent = message;
  }

  function applyStaticText() {
    const lang = state.lang;
    els.loadingText.textContent = t('menu_loading', lang);
    els.errorText.textContent = t('error_loading', lang);
    els.retryBtn.textContent = t('retry', lang);
    els.emptyText.textContent = t('menu_empty', lang);
    els.search.placeholder = t('search_placeholder', lang);
    els.footerText.textContent = '';
    applyDocumentDirection(lang);
    els.langButtons.forEach((btn) => {
      btn.setAttribute('aria-pressed', String(btn.dataset.lang === lang));
    });
  }

  function applySettingsToHero() {
    const s = state.settings;
    if (!s) return;

    document.documentElement.style.setProperty('--theme-primary', s.theme_primary || '#1f1410');
    document.documentElement.style.setProperty('--theme-secondary', s.theme_secondary || '#c9a15a');

    const cafeName = localizedField(
      { name_ku: s.cafe_name_ku, name_ar: s.cafe_name_ar, name_en: s.cafe_name_en },
      'name',
      state.lang
    );
    els.name.textContent = cafeName || '';
    document.title = cafeName || 'Menu';

    if (s.logo_url) {
      els.logo.src = s.logo_url;
      els.logo.alt = cafeName ? `${cafeName} logo` : 'logo';
      els.logo.hidden = false;
    } else {
      els.logo.hidden = true;
    }

    if (s.background_url) {
      // Applied to <body> (fixed, full-page) rather than just the hero, so
      // the café photo stays visible behind the whole menu while scrolling.
      document.body.style.backgroundImage = `url('${s.background_url}')`;
    }
  }

  function renderCategoryTabs() {
    const lang = state.lang;
    els.tabs.innerHTML = '';

    const allBtn = document.createElement('button');
    allBtn.type = 'button';
    allBtn.textContent = t('all_categories', lang);
    allBtn.setAttribute('aria-pressed', String(state.activeCategory === 'all'));
    allBtn.addEventListener('click', () => {
      state.activeCategory = 'all';
      renderCategoryTabs();
      renderItems();
    });
    els.tabs.appendChild(allBtn);

    state.categories
      .filter((c) => c.is_active)
      .sort((a, b) => a.sort_order - b.sort_order)
      .forEach((cat) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = localizedField(cat, 'name', lang);
        btn.setAttribute('aria-pressed', String(state.activeCategory === cat.id));
        btn.addEventListener('click', () => {
          state.activeCategory = cat.id;
          renderCategoryTabs();
          renderItems();
        });
        els.tabs.appendChild(btn);
      });
  }

  function itemMatchesSearch(item, lang, term) {
    if (!term) return true;
    const haystack = [
      localizedField(item, 'name', lang),
      localizedField(item, 'description', lang),
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(term.toLowerCase());
  }

  function renderItemCard(item, lang) {
    const card = document.createElement('article');
    card.className = 'menu-item' + (item.is_available ? '' : ' menu-item--unavailable');

    const imgWrap = document.createElement('div');
    imgWrap.className = 'menu-item__image-wrap' + (item.image_url ? '' : ' menu-item__image-wrap--placeholder');
    if (item.image_url) {
      const img = document.createElement('img');
      img.src = item.image_url;
      img.alt = localizedField(item, 'name', lang);
      img.loading = 'lazy';
      img.decoding = 'async';
      imgWrap.appendChild(img);
    } else {
      imgWrap.textContent = '☕';
      imgWrap.setAttribute('aria-hidden', 'true');
    }
    card.appendChild(imgWrap);

    const body = document.createElement('div');
    body.className = 'menu-item__body';

    const top = document.createElement('div');
    top.className = 'menu-item__top';
    const name = document.createElement('h3');
    name.className = 'menu-item__name';
    name.textContent = localizedField(item, 'name', lang);
    const price = document.createElement('span');
    price.className = 'menu-item__price';
    price.textContent = money(item.price, state.settings, lang);
    top.appendChild(name);
    top.appendChild(price);
    body.appendChild(top);

    const desc = localizedField(item, 'description', lang);
    if (desc) {
      const descEl = document.createElement('p');
      descEl.className = 'menu-item__desc';
      descEl.textContent = desc;
      body.appendChild(descEl);
    }

    if (!item.is_available) {
      const badge = document.createElement('span');
      badge.className = 'menu-item__badge';
      badge.textContent = t('unavailable', lang);
      body.appendChild(badge);
    }

    card.appendChild(body);
    return card;
  }

  function renderItems() {
    const lang = state.lang;
    const term = state.searchTerm.trim();
    els.container.innerHTML = '';

    const activeCategories = state.categories
      .filter((c) => c.is_active)
      .filter((c) => state.activeCategory === 'all' || c.id === state.activeCategory)
      .sort((a, b) => a.sort_order - b.sort_order);

    let totalVisible = 0;

    activeCategories.forEach((cat) => {
      const items = state.items
        .filter((it) => it.category_id === cat.id)
        .filter((it) => itemMatchesSearch(it, lang, term))
        .sort((a, b) => a.sort_order - b.sort_order);

      if (items.length === 0 && term) return; // hide empty categories while searching

      const section = document.createElement('section');
      section.className = 'menu-category';

      const title = document.createElement('h2');
      title.className = 'menu-category__title';
      title.textContent = localizedField(cat, 'name', lang);
      section.appendChild(title);

      if (items.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'menu-category__empty';
        empty.textContent = t('category_empty', lang);
        section.appendChild(empty);
      } else {
        const grid = document.createElement('div');
        grid.className = 'menu-items';
        items.forEach((item) => grid.appendChild(renderItemCard(item, lang)));
        section.appendChild(grid);
        totalVisible += items.length;
      }

      els.container.appendChild(section);
    });

    if (totalVisible === 0) {
      setEmpty(term ? t('category_empty', lang) : t('menu_empty', lang));
    } else {
      els.loading.hidden = true;
      els.error.hidden = true;
      els.empty.hidden = true;
      els.container.hidden = false;
    }
  }

  function renderAll() {
    applyStaticText();
    applySettingsToHero();
    renderCategoryTabs();
    renderItems();
  }

  async function fetchData() {
    setLoading(true);
    try {
      const [settingsRes, categoriesRes, itemsRes] = await Promise.all([
        window.sb.from('settings').select('*').eq('id', 1).single(),
        window.sb.from('categories').select('*').eq('is_active', true).order('sort_order'),
        window.sb.from('menu_items').select('*').order('sort_order'),
      ]);

      if (settingsRes.error) throw settingsRes.error;
      if (categoriesRes.error) throw categoriesRes.error;
      if (itemsRes.error) throw itemsRes.error;

      state.settings = settingsRes.data;
      state.categories = categoriesRes.data || [];
      state.items = itemsRes.data || [];

      if (!state.lang) {
        state.lang = getStoredLang(state.settings?.default_language || 'ku');
      }

      renderAll();
    } catch (err) {
      console.error('[menu] fetch failed', err);
      setError(t('error_loading', state.lang));
    }
  }

  function init() {
    // Determine initial language before first paint of static strings.
    state.lang = getStoredLang('ku');
    applyStaticText();

    els.retryBtn.addEventListener('click', fetchData);

    els.search.addEventListener('input', (e) => {
      state.searchTerm = e.target.value;
      renderItems();
    });

    els.langButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        state.lang = btn.dataset.lang;
        setStoredLang(state.lang);
        renderAll();
      });
    });

    fetchData();

    // Optional live refresh: if the admin changes something while a
    // customer has the menu open, quietly pull fresh data.
    try {
      window.sb
        .channel('public-menu-live')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, fetchData)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, fetchData)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, fetchData)
        .subscribe();
    } catch (e) {
      console.warn('[menu] realtime subscription unavailable', e);
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
