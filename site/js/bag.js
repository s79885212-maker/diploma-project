// Bag: GET/PATCH/DELETE /cart, POST /orders
document.addEventListener('DOMContentLoaded', async () => {
  const list = document.getElementById('bag-list');
  const total = document.getElementById('sum-total');
  const subtotal = document.getElementById('sum-subtotal');
  const checkout = document.getElementById('checkout');
  let busy = false;

  function draw(cart) {
    const items = cart ? cart.items : [];
    setBagCount(cart);
    document.body.classList.toggle('page-bag--empty', items.length === 0);
    const t = cart && items.length ? formatPrice(cart.total) : '0';
    total.textContent = t;
    subtotal.textContent = t;

    if (!items.length) {
      list.replaceChildren(h('div', { class: 'bag-empty' }, 'No products in your bag'));
      return;
    }
    list.replaceChildren(...items.map((item) => {
      const minus = h('button', { type: 'button', 'aria-label': 'Decrease', disabled: item.qty <= 1, onclick: () => update(() => api.setQty(item.productId, item.qty - 1)) },
        h('img', { src: 'assets/icons/minus.svg', alt: '' }));
      const plus = h('button', { type: 'button', 'aria-label': 'Increase', disabled: item.qty >= 20, onclick: () => update(() => api.setQty(item.productId, item.qty + 1)) },
        h('img', { src: 'assets/icons/plus.svg', alt: '' }));
      const href = 'product.html?id=' + encodeURIComponent(item.productId);
      return h('div', { class: 'bag-item' },
        h('a', { class: 'bag-item__img', href }, productImage(item.image, item.title)),
        h('div', { class: 'bag-item__body t-base' },
          h('a', { class: 'bag-item__title', href }, item.title),
          h('p', { class: 'bag-item__price' }, formatPrice(item.price)),
          h('button', { class: 'bag-item__remove', type: 'button', 'aria-label': 'Remove', onclick: () => update(() => api.removeFromCart(item.productId)) },
            h('img', { src: 'assets/icons/trash.svg', alt: '' })),
          h('div', { class: 'qty' }, minus, h('span', { class: 'qty__value' }, item.qty), plus),
        ),
      );
    }));
  }

  async function update(action) {
    if (busy) return;
    busy = true;
    list.classList.add('loading');
    try {
      draw(await action());
    } catch (e) {
      if (e.status === 401) return goToLogin();
      alert(e.message);
    }
    list.classList.remove('loading');
    busy = false;
  }

  checkout.addEventListener('click', async () => {
    if (!auth.isLoggedIn) return goToLogin();
    if (busy) return;
    busy = true;
    checkout.disabled = true;
    try {
      await api.createOrder();
      draw({ items: [], total: 0 });
      showThanks('Your order has been placed', () => { location.href = 'profile.html'; });
    } catch (e) {
      if (e.status === 401) return goToLogin();
      alert(e.status === 400 ? 'Your bag is empty' : e.message);
    }
    checkout.disabled = false;
    busy = false;
  });

  if (!auth.isLoggedIn) { draw(null); return; }
  try {
    draw(await api.cart());
  } catch (e) {
    if (e.status === 401) { draw(null); return; }
    list.replaceChildren(statusText(e.message));
  }
});
