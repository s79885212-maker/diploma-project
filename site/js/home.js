// Home: best sellers, categories, featured products (newest) — all from the sandbox API
document.addEventListener('DOMContentLoaded', async () => {
  const best = document.getElementById('bestsellers');
  const cats = document.getElementById('categories');
  const featured = document.getElementById('featured');

  api.bestsellers(4)
    .then((d) => best.replaceChildren(...d.products.map((p) => productCard(p))))
    .catch((e) => best.replaceChildren(statusText(e.message)));

  function loadCategories(attempt = 1) {
    getCategories().then((list) => {
      if (!list.length && attempt < 4) { setTimeout(() => loadCategories(attempt + 1), attempt * 3000); return; }
      cats.replaceChildren(...list.slice(0, 3).map((c) =>
        h('a', { class: 'category', href: 'products.html?category=' + encodeURIComponent(c._id) },
          h('img', { src: c.image, alt: c.title }),
          h('span', { class: 'btn-glass t-base' }, c.title),
        )));
    });
  }
  loadCategories();

  api.newest(12)
    .then((d) => featured.replaceChildren(...d.products.map((p) => productCard(p))))
    .catch((e) => featured.replaceChildren(statusText(e.message)));
});
