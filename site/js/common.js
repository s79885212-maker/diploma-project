// Shared layout (header, footer) and helpers

function h(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (v === undefined || v === null || v === false) return;
    if (k === 'class') node.className = v;
    else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v === true ? '' : v);
  });
  children.flat().forEach((c) => {
    if (c === null || c === undefined || c === false) return;
    node.append(c instanceof Node ? c : document.createTextNode(String(c)));
  });
  return node;
}

function formatPrice(value) {
  const n = Number(value) || 0;
  return '$' + (Number.isInteger(n) ? String(n) : n.toFixed(2));
}

function formatDate(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return '';
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function formatPhone(phone) {
  const d = String(phone || '').replace(/\D/g, '');
  if (d.length === 12 && d.startsWith('998')) {
    return `+${d.slice(0, 3)} ${d.slice(3, 5)} ${d.slice(5, 8)}-${d.slice(8, 10)}-${d.slice(10)}`;
  }
  return d ? '+' + d : '';
}

function productImage(src, alt) {
  const img = h('img', { src, alt: alt || '', loading: 'lazy' });
  img.addEventListener('error', () => img.remove(), { once: true });
  return img;
}

function productCard(p, { showPrice = true, extraClass = '' } = {}) {
  return h('a', { class: 'card ' + extraClass, href: 'product.html?id=' + encodeURIComponent(p._id || p.productId) },
    h('div', { class: 'card__img' }, productImage(p.image, p.title)),
    h('div', { class: 'card__info t-base' },
      h('span', { class: 'card__title' }, p.title),
      showPrice ? h('span', { class: 'card__price' }, formatPrice(p.price)) : null,
    ),
  );
}

function statusText(text) {
  return h('p', { class: 'status-text' }, text);
}

function goToLogin() {
  const back = location.pathname.split('/').pop() + location.search;
  location.href = 'login.html?next=' + encodeURIComponent(back);
}

// ---------- Header ----------
function renderHeader() {
  const slot = document.getElementById('header');
  if (!slot) return;
  const accountHref = auth.isLoggedIn ? 'profile.html' : 'login.html';
  const mobileNav = h('nav', { class: 'mobile-nav t-base', hidden: true },
    h('a', { href: 'index.html' }, 'Home'),
    h('a', { href: 'products.html' }, 'Products'),
  );
  const menuBtn = h('button', { class: 'header__menu', 'aria-label': 'Menu', onclick: () => { mobileNav.hidden = !mobileNav.hidden; } },
    h('img', { src: 'assets/icons/menu.svg', alt: '' }));

  slot.replaceWith(h('header', { class: 'header' },
    h('div', { class: 'header__inner t-base' },
      h('nav', { class: 'header__nav' },
        h('a', { href: 'index.html' }, 'Home'),
        h('a', { href: 'products.html' }, 'Products'),
      ),
      menuBtn,
      h('a', { class: 'header__logo', href: 'index.html', 'aria-label': 'Home' }, h('img', { src: 'assets/img/logo.png', alt: 'WEPRO' })),
      h('div', { class: 'header__nav' },
        h('a', { class: 'header__account', href: accountHref }, 'Account'),
        h('a', { class: 'header__bag', href: 'bag.html', 'data-bag-count': '' }, 'Bag (0)'),
      ),
      // Mobile copies (absolutely positioned per the 390px layout)
      h('a', { class: 'header__account header__m', href: accountHref }, 'Account'),
      h('a', { class: 'header__bag header__m', href: 'bag.html', 'data-bag-count': '' }, 'Bag (0)'),
    ),
    mobileNav,
  ));
}

function setBagCount(cart) {
  const count = cart ? cart.items.reduce((s, i) => s + i.qty, 0) : 0;
  document.querySelectorAll('[data-bag-count]').forEach((n) => { n.textContent = `Bag (${count})`; });
}

async function refreshBagCount() {
  if (!auth.isLoggedIn) return setBagCount(null);
  try { setBagCount(await api.cart()); } catch { setBagCount(null); }
}

// ---------- Footer ----------
let categoriesPromise = null;
function getCategories() {
  if (!categoriesPromise) {
    categoriesPromise = api.categories().then((d) => d.categories).catch(() => {
      categoriesPromise = null; // don't cache a failure (e.g. 429) — next call retries
      return [];
    });
  }
  return categoriesPromise;
}

function renderFooter() {
  const slot = document.getElementById('footer');
  if (!slot) return;
  const link = (text, href = '#') => h('a', { href }, text);
  const catLinks = ['Creams', 'Serums', 'Lotions'].map((t) => h('a', { href: 'products.html', 'data-cat-title': t }, t));

  slot.replaceWith(h('footer', { class: 'footer t-base' },
    h('div', { class: 'footer__top' },
      h('div', { class: 'footer__col footer__col--logo' },
        h('div', { class: 'footer__logo' }, h('img', { src: 'assets/icons/footer-logo.svg', alt: 'Skin—Clinic' })),
        h('div', { class: 'footer__social' },
          h('a', { href: '#', 'aria-label': 'Instagram' }, h('img', { src: 'assets/icons/instagram.svg', alt: '', width: 13.33, height: 13.33 })),
          h('a', { href: '#', 'aria-label': 'Facebook' }, h('img', { src: 'assets/icons/facebook.svg', alt: '', width: 9.12, height: 16 })),
          h('a', { href: '#', 'aria-label': 'Youtube' }, h('img', { src: 'assets/icons/youtube.svg', alt: '', width: 14.68, height: 10.31 })),
        ),
      ),
      h('div', { class: 'footer__col' },
        h('p', { class: 'footer__title t-sub' }, 'Products'),
        h('div', { class: 'footer__links' }, catLinks, link('Shop all', 'products.html')),
      ),
      h('div', { class: 'footer__col footer__col--support' },
        h('p', { class: 'footer__title t-sub' }, 'Support'),
        h('div', { class: 'footer__links' }, link('FAQs'), link('Return policy'), link('Shipping policy'), link('Start a return')),
      ),
      h('div', { class: 'footer__col footer__col--company' },
        h('p', { class: 'footer__title t-sub' }, 'Company'),
        h('div', { class: 'footer__links' }, link('About us'), link('Journal'), link('Contact us')),
      ),
    ),
    h('div', { class: 'footer__divider' }),
    h('div', { class: 'footer__bottom' },
      h('span', {}, '© 2025 Skin—Clinic'),
      h('div', { class: 'footer__legal' }, link('Terms of service'), link('Privacy policy'), link('Cookies settings')),
    ),
  ));

  // Footer category links point to real category ids from the API
  getCategories().then((cats) => {
    catLinks.forEach((a) => {
      const key = a.dataset.catTitle.toLowerCase().replace(/s$/, '');
      const cat = cats.find((c) => c.title.toLowerCase().replace(/s$/, '') === key);
      if (cat) a.href = 'products.html?category=' + encodeURIComponent(cat._id);
    });
  });
}

// ---------- Thank-you modal (Figma "Thank you!" card) ----------
function showThanks(subtitle, onClose) {
  const modal = h('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true' },
    h('div', { class: 'modal__card modal__card--thanks' },
      h('div', { class: 'thanks__text' },
        h('p', { class: 'thanks__title' }, 'Thank you!'),
        h('p', { class: 'thanks__sub' }, subtitle),
      ),
      h('button', { class: 'thanks__btn', onclick: () => { modal.remove(); if (onClose) onClose(); } }, 'Okey'),
    ),
  );
  document.body.append(modal);
}

document.addEventListener('DOMContentLoaded', () => {
  renderHeader();
  renderFooter();
  refreshBagCount();
});
