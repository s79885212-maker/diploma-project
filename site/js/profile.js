// Profile: GET /me, GET /orders, POST /logout
document.addEventListener('DOMContentLoaded', async () => {
  if (!auth.isLoggedIn) { goToLogin(); return; }

  const ordersBox = document.getElementById('orders');

  document.getElementById('logout').addEventListener('click', async () => {
    try { await api.logout(); } catch {}
    auth.clear();
    location.href = 'login.html';
  });

  try {
    const { user } = await api.me();
    document.getElementById('p-name').textContent = `${user.name} ${user.surname}`;
    document.getElementById('p-phone').textContent = formatPhone(user.phone);
    document.getElementById('p-email').textContent = user.email;
  } catch (e) {
    if (e.status === 401) { goToLogin(); return; }
    document.getElementById('p-name').textContent = e.message;
  }

  try {
    const { orders } = await api.orders();
    // Every purchased item from every order (orders come newest first)
    const items = orders.flatMap((o) => o.items);
    ordersBox.replaceChildren(...(items.length
      ? items.map((it) => productCard(it, { showPrice: false, extraClass: 'card--order' }))
      : [h('div', { class: 'bag-empty' }, 'No orders yet')]));
  } catch (e) {
    ordersBox.replaceChildren(statusText(e.message));
  }
});
