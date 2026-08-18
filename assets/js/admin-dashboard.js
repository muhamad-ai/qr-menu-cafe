(async function () {
  const user = await Admin.guard();
  if (!user) return;

  try {
    const [{ count: categoriesCount, error: catErr }, { data: items, error: itemsErr }] = await Promise.all([
      window.sb.from('categories').select('id', { count: 'exact', head: true }),
      window.sb.from('menu_items').select('is_available'),
    ]);

    if (catErr) throw catErr;
    if (itemsErr) throw itemsErr;

    const total = items.length;
    const available = items.filter((i) => i.is_available).length;
    const unavailable = total - available;

    document.getElementById('statCategories').textContent = categoriesCount ?? 0;
    document.getElementById('statItems').textContent = total;
    document.getElementById('statAvailable').textContent = available;
    document.getElementById('statUnavailable').textContent = unavailable;
  } catch (err) {
    console.error(err);
    Admin.toast(Admin.friendlyError(err), 'error');
  }
})();
