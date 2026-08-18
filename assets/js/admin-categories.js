(function () {
  let categories = [];

  const listEl = document.getElementById('categoriesList');
  const emptyEl = document.getElementById('categoriesEmpty');
  const modal = document.getElementById('categoryModal');
  const form = document.getElementById('categoryForm');
  const modalTitle = document.getElementById('categoryModalTitle');
  const idInput = document.getElementById('categoryId');
  const nameKuInput = document.getElementById('nameKu');
  const nameArInput = document.getElementById('nameAr');
  const nameEnInput = document.getElementById('nameEn');
  const isActiveInput = document.getElementById('isActive');
  const nameKuError = document.getElementById('nameKuError');
  const saveBtn = document.getElementById('categorySaveBtn');

  function openModal(category) {
    form.reset();
    nameKuError.textContent = '';
    if (category) {
      modalTitle.textContent = 'Edit category';
      idInput.value = category.id;
      nameKuInput.value = category.name_ku || '';
      nameArInput.value = category.name_ar || '';
      nameEnInput.value = category.name_en || '';
      isActiveInput.checked = !!category.is_active;
    } else {
      modalTitle.textContent = 'Add category';
      idInput.value = '';
      isActiveInput.checked = true;
    }
    modal.hidden = false;
    nameKuInput.focus();
  }

  function closeModal() {
    modal.hidden = true;
  }

  function render() {
    listEl.innerHTML = '';
    emptyEl.hidden = categories.length !== 0;

    categories
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .forEach((cat, index) => {
        const row = document.createElement('div');
        row.className = 'data-row';
        row.innerHTML = `
          <div class="sort-controls">
            <button type="button" data-action="up" ${index === 0 ? 'disabled' : ''} aria-label="Move up">▲</button>
            <button type="button" data-action="down" ${index === categories.length - 1 ? 'disabled' : ''} aria-label="Move down">▼</button>
          </div>
          <div class="data-row__main">
            <div class="data-row__title">${escapeHtml(cat.name_ku)}</div>
            <div class="data-row__meta">
              ${escapeHtml(cat.name_en || '')} ${cat.name_ar ? '· ' + escapeHtml(cat.name_ar) : ''}
              &nbsp;·&nbsp;
              <span class="badge ${cat.is_active ? 'badge-success' : 'badge-muted'}">${cat.is_active ? 'Visible' : 'Hidden'}</span>
            </div>
          </div>
          <div class="data-row__actions">
            <button type="button" class="btn btn-ghost" data-action="edit">Edit</button>
            <button type="button" class="btn btn-danger" data-action="delete">Delete</button>
          </div>
        `;

        row.querySelector('[data-action="edit"]').addEventListener('click', () => openModal(cat));
        row.querySelector('[data-action="delete"]').addEventListener('click', () => handleDelete(cat));
        row.querySelector('[data-action="up"]')?.addEventListener('click', () => reorder(cat, -1));
        row.querySelector('[data-action="down"]')?.addEventListener('click', () => reorder(cat, 1));

        listEl.appendChild(row);
      });
  }

  function escapeHtml(str) {
    return String(str || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  async function loadCategories() {
    const { data, error } = await window.sb.from('categories').select('*').order('sort_order');
    if (error) {
      Admin.toast(Admin.friendlyError(error), 'error');
      return;
    }
    categories = data || [];
    render();
  }

  async function reorder(cat, direction) {
    const sorted = categories.slice().sort((a, b) => a.sort_order - b.sort_order);
    const idx = sorted.findIndex((c) => c.id === cat.id);
    const swapIdx = idx + direction;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;

    const a = sorted[idx];
    const b = sorted[swapIdx];
    const aOrder = a.sort_order;
    const bOrder = b.sort_order;

    try {
      await Promise.all([
        window.sb.from('categories').update({ sort_order: bOrder }).eq('id', a.id),
        window.sb.from('categories').update({ sort_order: aOrder }).eq('id', b.id),
      ]);
      await loadCategories();
    } catch (err) {
      Admin.toast(Admin.friendlyError(err), 'error');
    }
  }

  async function handleDelete(cat) {
    const ok = await Admin.confirmAction({
      title: 'Delete category?',
      message: `"${cat.name_ku}" and all of its menu items will be permanently deleted. This cannot be undone.`,
      confirmLabel: 'Delete',
    });
    if (!ok) return;

    try {
      const { error } = await window.sb.from('categories').delete().eq('id', cat.id);
      if (error) throw error;
      Admin.toast('Category deleted.');
      await loadCategories();
    } catch (err) {
      Admin.toast(Admin.friendlyError(err), 'error');
    }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    nameKuError.textContent = '';

    const nameKu = nameKuInput.value.trim();
    if (!nameKu) {
      nameKuError.textContent = 'Kurdish name is required.';
      return;
    }

    const payload = {
      name_ku: nameKu,
      name_ar: nameArInput.value.trim() || null,
      name_en: nameEnInput.value.trim() || null,
      is_active: isActiveInput.checked,
    };

    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    try {
      const id = idInput.value;
      if (id) {
        const { error } = await window.sb.from('categories').update(payload).eq('id', id);
        if (error) throw error;
        Admin.toast('Category updated.');
      } else {
        const maxOrder = categories.reduce((max, c) => Math.max(max, c.sort_order), 0);
        const { error } = await window.sb
          .from('categories')
          .insert({ ...payload, sort_order: maxOrder + 1 });
        if (error) throw error;
        Admin.toast('Category added.');
      }
      closeModal();
      await loadCategories();
    } catch (err) {
      Admin.toast(Admin.friendlyError(err), 'error');
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save';
    }
  });

  document.getElementById('addCategoryBtn').addEventListener('click', () => openModal(null));
  document.getElementById('categoryCancelBtn').addEventListener('click', closeModal);
  document.getElementById('categoryModal').addEventListener('click', (e) => {
    if (e.target.id === 'categoryModal') closeModal();
  });

  (async function init() {
    const user = await Admin.guard();
    if (!user) return;
    await loadCategories();
  })();
})();
