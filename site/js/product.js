// Product page: GET /products/{id}, add to cart, comments
document.addEventListener('DOMContentLoaded', async () => {
  const id = new URLSearchParams(location.search).get('id');
  const msg = document.getElementById('pdp-msg');
  const qtyValue = document.getElementById('qty-value');
  const minus = document.getElementById('qty-minus');
  const plus = document.getElementById('qty-plus');
  const modal = document.getElementById('comment-modal');
  const form = document.getElementById('comment-form');
  const formError = document.getElementById('comment-error');
  let qty = 1;

  if (!id) { location.replace('products.html'); return; }

  function drawQty() {
    qtyValue.textContent = qty;
    minus.disabled = qty <= 1;
    plus.disabled = qty >= 20;
  }
  minus.addEventListener('click', () => { if (qty > 1) { qty--; drawQty(); } });
  plus.addEventListener('click', () => { if (qty < 20) { qty++; drawQty(); } });
  drawQty();

  function drawReviews(product) {
    const comments = product.comments || [];
    document.getElementById('reviews-count').textContent = `(${comments.length})`;
    const box = document.getElementById('reviews');
    if (!comments.length) {
      box.replaceChildren(h('p', { class: 'reviews__empty' }, 'No reviews yet'));
      return;
    }
    box.replaceChildren(...comments.map((c) =>
      h('article', { class: 'review' },
        h('div', { class: 'review__main' },
          h('p', { class: 'review__name' }, h('span', {}, c.author), h('img', { src: 'assets/icons/check.svg', alt: '' })),
          h('p', { class: 'review__text' }, c.text),
        ),
        h('p', { class: 'review__date' }, 'Posted on ' + formatDate(c.at)),
      )));
  }

  async function load() {
    const { product } = await api.product(id);
    document.title = product.title + ' — Skin—Clinic';
    document.getElementById('pdp-img').replaceChildren(productImage(product.image, product.title));
    document.getElementById('pdp-title').textContent = product.title;
    document.getElementById('pdp-price').textContent = formatPrice(product.price);
    drawReviews(product);
  }

  try {
    await load();
  } catch (e) {
    document.getElementById('pdp').replaceChildren(statusText(e.status === 404 ? 'Product not found' : e.message));
    return;
  }

  document.getElementById('add-to-cart').addEventListener('click', async (ev) => {
    if (!auth.isLoggedIn) return goToLogin();
    const btn = ev.currentTarget;
    btn.disabled = true;
    try {
      setBagCount(await api.addToCart(id, qty));
      msg.textContent = 'Added to your bag';
    } catch (e) {
      if (e.status === 401) return goToLogin();
      msg.textContent = e.message;
    }
    btn.disabled = false;
  });

  // ----- comment modal -----
  document.getElementById('write-review').addEventListener('click', () => {
    if (!auth.isLoggedIn) return goToLogin();
    formError.textContent = '';
    form.reset();
    modal.hidden = false;
    form.text.focus();
  });
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.hidden = true; });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') modal.hidden = true; });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = form.text.value.trim();
    if (text.length < 2) { formError.textContent = 'Comment must be 2–300 characters'; return; }
    const btn = form.querySelector('button');
    btn.disabled = true;
    try {
      await api.addComment(id, text);
      modal.hidden = true;
      showThanks('You left new comment');
      await load();
    } catch (err) {
      if (err.status === 401) return goToLogin();
      formError.textContent = err.message;
    }
    btn.disabled = false;
  });
});
