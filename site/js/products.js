// Products: catalog with category + price filters (GET /products?category&minPrice&maxPrice)
document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(location.search);
  const state = {
    category: params.get('category') || '',
    min: clamp(Number(params.get('minPrice') ?? 0)),
    max: clamp(Number(params.get('maxPrice') ?? 100)),
  };

  const grid = document.getElementById('grid');
  const title = document.getElementById('catalog-title');
  const catsBox = document.getElementById('filter-cats');
  const minInput = document.getElementById('price-min');
  const maxInput = document.getElementById('price-max');
  const fill = document.getElementById('range-fill');
  const labelMin = document.getElementById('label-min');
  const labelMax = document.getElementById('label-max');
  const THUMB = 20;
  let categories = [];

  function clamp(v) { return Math.min(100, Math.max(0, isNaN(v) ? 0 : v)); }

  // ----- price slider -----
  function thumbCenter(value) {
    const w = minInput.offsetWidth;
    return THUMB / 2 + (value / 100) * (w - THUMB);
  }
  function drawRange() {
    const a = Number(minInput.value), b = Number(maxInput.value);
    const x1 = thumbCenter(a), x2 = thumbCenter(b);
    fill.style.left = x1 + 'px';
    fill.style.width = Math.max(0, x2 - x1) + 'px';
    labelMin.style.left = x1 + 'px';
    labelMax.style.left = x2 + 'px';
    labelMin.textContent = formatPrice(a);
    labelMax.textContent = formatPrice(b);
  }
  minInput.value = state.min;
  maxInput.value = Math.max(state.max, state.min);
  minInput.addEventListener('input', () => {
    if (Number(minInput.value) > Number(maxInput.value)) minInput.value = maxInput.value;
    drawRange();
  });
  maxInput.addEventListener('input', () => {
    if (Number(maxInput.value) < Number(minInput.value)) maxInput.value = minInput.value;
    drawRange();
  });
  window.addEventListener('resize', drawRange);

  // ----- categories -----
  function drawCategories() {
    catsBox.replaceChildren(...categories.map((c) =>
      h('button', {
        class: 'filters__cat' + (state.category === c._id ? ' is-active' : ''),
        type: 'button',
        onclick: () => {
          state.category = state.category === c._id ? '' : c._id;
          drawCategories();
        },
      }, h('span', {}, c.title), h('img', { src: 'assets/icons/chevron.svg', alt: '' }))));
  }

  function updateTitle() {
    const cat = categories.find((c) => c._id === state.category);
    title.textContent = cat ? cat.title : 'All products';
  }

  // ----- products -----
  async function load() {
    grid.classList.add('loading');
    const query = { category: state.category };
    if (state.min > 0) query.minPrice = state.min;
    if (state.max < 100) query.maxPrice = state.max;
    try {
      const products = await fetchAllProducts(query);
      grid.replaceChildren(...(products.length
        ? products.map((p) => productCard(p))
        : [h('p', { class: 'catalog__empty' }, 'No products found')]));
    } catch (e) {
      grid.replaceChildren(statusText(e.message));
    }
    grid.classList.remove('loading');
  }

  document.getElementById('apply-filter').addEventListener('click', () => {
    state.min = Number(minInput.value);
    state.max = Number(maxInput.value);
    const q = new URLSearchParams();
    if (state.category) q.set('category', state.category);
    if (state.min > 0) q.set('minPrice', state.min);
    if (state.max < 100) q.set('maxPrice', state.max);
    history.replaceState(null, '', 'products.html' + (q.toString() ? '?' + q : ''));
    updateTitle();
    closeSheet();
    load();
  });

  // ----- mobile bottom sheet -----
  function openSheet() { document.body.classList.add('sheet-open'); requestAnimationFrame(drawRange); }
  function closeSheet() { document.body.classList.remove('sheet-open'); }
  document.getElementById('filter-open').addEventListener('click', openSheet);
  document.getElementById('sheet-overlay').addEventListener('click', closeSheet);
  document.getElementById('filters-close').addEventListener('click', closeSheet);

  function loadCategories(attempt = 1) {
    getCategories().then((list) => {
      if (!list.length && attempt < 4) { setTimeout(() => loadCategories(attempt + 1), attempt * 3000); return; }
      categories = list;
      drawCategories();
      updateTitle();
    });
  }
  loadCategories();
  drawRange();
  load();
});
