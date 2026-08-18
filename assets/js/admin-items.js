(function () {
  let items = [];
  let categories = [];
  let pendingImageFile = null;
  let existingImageUrl = null;

  const listEl = document.getElementById('itemsList');
  const emptyEl = document.getElementById('itemsEmpty');
  const filterSelect = document.getElementById('filterCategory');

  const modal = document.getElementById('itemModal');
  const form = document.getElementById('itemForm');
  const modalTitle = document.getElementById('itemModalTitle');

  const idInput = document.getElementById('itemId');
  const categorySelect = document.getElementById('itemCategory');
  const categoryError = document.getElementById('itemCategoryError');
  const nameKuInput = document.getElementById('itemNameKu');
  const nameKuError = document.getElementById('itemNameKuError');
  const nameArInput = document.getElementById('itemNameAr');
  const nameEnInput = document.getElementById('itemNameEn');
  const descKuInput = document.getElementById('itemDescKu');
  const descArInput = document.getElementById('itemDescAr');
  const descEnInput = document.getElementById('itemDescEn');
  const priceInput = document.getElementById('itemPrice');
  const priceError = document.getElementById('itemPriceError');
  const imageInput = document.getElementById('itemImage');
  const imagePreview = document.getElementById('itemImagePreview');
  const availableInput = document.getElementById('itemAvailable');
  const saveBtn = document.getElementById('itemSaveBtn');

  function escapeHtml(str) {
    return String(str || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function categoryName(id) {
    const cat = categories.find((c) => c.id === id);
    return cat ? cat.name_ku : '—';
  }

  function populateCategorySelects() {
    const sorted = categories.slice().sort((a, b) => a.sort_order - b.sort_order);

    filterSelect.innerHTML = '<option value="all">هەموو بەشەکان</option>' +
      sorted.map((c) => `<option value="${c.id}">${escapeHtml(c.name_ku)}</option>`).join('');

    categorySelect.innerHTML = sorted.map((c) => `<option value="${c.id}">${escapeHtml(c.name_ku)}</option>`).join('');
  }

  function openModal(item) {
    form.reset();
    [nameKuError, categoryError, priceError].forEach((el) => (el.textContent = ''));
    imagePreview.hidden = true;
    pendingImageFile = null;
    existingImageUrl = null;

    if (categories.length === 0) {
      Admin.toast('سەرەتا بەشێک دروست بکە.', 'error');
      return;
    }

    if (item) {
      modalTitle.textContent = 'دەستکاریکردنی خواردنەوە';
      idInput.value = item.id;
      categorySelect.value = item.category_id;
      nameKuInput.value = item.name_ku || '';
      nameArInput.value = item.name_ar || '';
      nameEnInput.value = item.name_en || '';
      descKuInput.value = item.description_ku || '';
      descArInput.value = item.description_ar || '';
      descEnInput.value = item.description_en || '';
      priceInput.value = item.price;
      availableInput.checked = !!item.is_available;
      if (item.image_url) {
        existingImageUrl = item.image_url;
        imagePreview.src = item.image_url;
        imagePreview.hidden = false;
      }
    } else {
      modalTitle.textContent = 'زیادکردنی خواردنەوە';
      idInput.value = '';
      categorySelect.value = filterSelect.value !== 'all' ? filterSelect.value : categories[0].id;
      availableInput.checked = true;
    }

    modal.hidden = false;
    nameKuInput.focus();
  }

  function closeModal() {
    modal.hidden = true;
  }

  imageInput.addEventListener('change', () => {
    const file = imageInput.files[0];
    if (!file) return;
    pendingImageFile = file;
    const reader = new FileReader();
    reader.onload = () => {
      imagePreview.src = reader.result;
      imagePreview.hidden = false;
    };
    reader.readAsDataURL(file);
  });

  function render() {
    const filter = filterSelect.value;
    const filtered = items.filter((it) => filter === 'all' || it.category_id === filter);

    listEl.innerHTML = '';
    emptyEl.hidden = filtered.length !== 0;

    filtered
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .forEach((item) => {
        const row = document.createElement('div');
        row.className = 'data-row';
        row.innerHTML = `
          ${item.image_url
            ? `<img class="data-row__thumb" src="${item.image_url}" alt="" loading="lazy" />`
            : `<div class="data-row__thumb" aria-hidden="true"></div>`}
          <div class="data-row__main">
            <div class="data-row__title">${escapeHtml(item.name_ku)} — ${Number(item.price).toLocaleString()}</div>
            <div class="data-row__meta">
              ${escapeHtml(categoryName(item.category_id))}
              &nbsp;·&nbsp;
              <span class="badge ${item.is_available ? 'badge-success' : 'badge-muted'}">${item.is_available ? 'بەردەستە' : 'نەبەردەستە'}</span>
            </div>
          </div>
          <div class="data-row__actions">
            <button type="button" class="btn btn-ghost" data-action="toggle">${item.is_available ? 'وەک نەبەردەست دیاری بکە' : 'وەک بەردەست دیاری بکە'}</button>
            <button type="button" class="btn btn-ghost" data-action="edit">دەستکاری</button>
            <button type="button" class="btn btn-danger" data-action="delete">سڕینەوە</button>
          </div>
        `;

        row.querySelector('[data-action="edit"]').addEventListener('click', () => openModal(item));
        row.querySelector('[data-action="delete"]').addEventListener('click', () => handleDelete(item));
        row.querySelector('[data-action="toggle"]').addEventListener('click', () => toggleAvailability(item));

        listEl.appendChild(row);
      });
  }

  async function loadData() {
    try {
      const [catRes, itemRes] = await Promise.all([
        window.sb.from('categories').select('*').order('sort_order'),
        window.sb.from('menu_items').select('*').order('sort_order'),
      ]);
      if (catRes.error) throw catRes.error;
      if (itemRes.error) throw itemRes.error;

      categories = catRes.data || [];
      items = itemRes.data || [];
      populateCategorySelects();
      render();
    } catch (err) {
      Admin.toast(Admin.friendlyError(err), 'error');
    }
  }

  async function toggleAvailability(item) {
    try {
      const { error } = await window.sb
        .from('menu_items')
        .update({ is_available: !item.is_available })
        .eq('id', item.id);
      if (error) throw error;
      await loadData();
    } catch (err) {
      Admin.toast(Admin.friendlyError(err), 'error');
    }
  }

  async function handleDelete(item) {
    const ok = await Admin.confirmAction({
      title: 'خواردنەوەکە بسڕدرێتەوە؟',
      message: `"${item.name_ku}" بۆ هەمیشە دەسڕدرێتەوە. ناتوانرێت پاشگەز بکرێتەوە.`,
      confirmLabel: 'سڕینەوە',
    });
    if (!ok) return;

    try {
      const { error } = await window.sb.from('menu_items').delete().eq('id', item.id);
      if (error) throw error;
      Admin.toast('خواردنەوەکە سڕایەوە.');
      await loadData();
    } catch (err) {
      Admin.toast(Admin.friendlyError(err), 'error');
    }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    nameKuError.textContent = '';
    categoryError.textContent = '';
    priceError.textContent = '';

    const nameKu = nameKuInput.value.trim();
    const categoryId = categorySelect.value;
    const price = parseFloat(priceInput.value);

    let hasError = false;
    if (!nameKu) {
      nameKuError.textContent = 'ناوی کوردی پێویستە.';
      hasError = true;
    }
    if (!categoryId) {
      categoryError.textContent = 'تکایە بەشێک هەڵبژێرە.';
      hasError = true;
    }
    if (isNaN(price) || price < 0) {
      priceError.textContent = 'نرخێکی دروست بنووسە.';
      hasError = true;
    }
    if (hasError) return;

    saveBtn.disabled = true;
    saveBtn.textContent = 'پاشەکەوتکردن...';

    try {
      let imageUrl = existingImageUrl;
      if (pendingImageFile) {
        imageUrl = await Admin.uploadImage(pendingImageFile, 'items', Admin.IMAGE_PRESETS.item);
      }

      const payload = {
        category_id: categoryId,
        name_ku: nameKu,
        name_ar: nameArInput.value.trim() || null,
        name_en: nameEnInput.value.trim() || null,
        description_ku: descKuInput.value.trim() || null,
        description_ar: descArInput.value.trim() || null,
        description_en: descEnInput.value.trim() || null,
        price,
        image_url: imageUrl || null,
        is_available: availableInput.checked,
      };

      const id = idInput.value;
      if (id) {
        const { error } = await window.sb.from('menu_items').update(payload).eq('id', id);
        if (error) throw error;
        Admin.toast('خواردنەوەکە نوێکرایەوە.');
      } else {
        const maxOrder = items
          .filter((it) => it.category_id === categoryId)
          .reduce((max, it) => Math.max(max, it.sort_order), 0);
        const { error } = await window.sb.from('menu_items').insert({ ...payload, sort_order: maxOrder + 1 });
        if (error) throw error;
        Admin.toast('خواردنەوەکە زیادکرا.');
      }

      closeModal();
      await loadData();
    } catch (err) {
      Admin.toast(Admin.friendlyError(err), 'error');
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'پاشەکەوتکردن';
    }
  });

  document.getElementById('addItemBtn').addEventListener('click', () => openModal(null));
  document.getElementById('itemCancelBtn').addEventListener('click', closeModal);
  document.getElementById('itemModal').addEventListener('click', (e) => {
    if (e.target.id === 'itemModal') closeModal();
  });
  filterSelect.addEventListener('change', render);

  (async function init() {
    const user = await Admin.guard();
    if (!user) return;
    await loadData();
  })();
})();
