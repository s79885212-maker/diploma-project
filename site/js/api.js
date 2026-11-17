// Sandbox Shop API client — all data comes from https://api.wepro.uz/sandbox-shop
const API_BASE = 'https://api.wepro.uz/sandbox-shop';
const TOKEN_KEY = 'sc_token';

const auth = {
  get token() {
    try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
  },
  set(token) {
    try { localStorage.setItem(TOKEN_KEY, token); } catch {}
  },
  clear() {
    try { localStorage.removeItem(TOKEN_KEY); } catch {}
  },
  get isLoggedIn() { return Boolean(this.token); },
};

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, { method = 'GET', body, private: isPrivate = false } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (isPrivate) {
    if (!auth.token) throw new ApiError('Нужно войти в аккаунт', 401);
    headers.Authorization = 'Bearer ' + auth.token;
  }

  let res;
  try {
    res = await fetch(API_BASE + path, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Нет соединения с сервером', 0);
  }

  let data = null;
  try { data = await res.json(); } catch {}

  if (!res.ok) {
    // Token expired or session finished via /logout — forget it
    if (res.status === 401 && isPrivate) auth.clear();
    throw new ApiError((data && data.message) || 'Ошибка ' + res.status, res.status);
  }
  return data;
}

function query(params) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') q.set(k, v);
  });
  const s = q.toString();
  return s ? '?' + s : '';
}

function unwrapCart(data) {
  const cart = data && data.cart ? data.cart : data;
  return { items: (cart && cart.items) || [], total: (cart && cart.total) || 0 };
}

const api = {
  // Account
  register: (data) => request('/register', { method: 'POST', body: data }),
  login: (email, password) => request('/login', { method: 'POST', body: { email, password } }),
  logout: () => request('/logout', { method: 'POST', private: true }),
  me: () => request('/me', { private: true }),

  // Catalog
  products: (params = {}) => request('/products' + query(params)),
  newest: (limit) => request('/products/newest' + query({ limit })),
  bestsellers: (limit) => request('/products/bestsellers' + query({ limit })),
  product: (id) => request('/products/' + encodeURIComponent(id)),
  categories: () => request('/categories'),

  // Cart — the server answers { message, cart: { items, total } }; the docs show { items, total }.
  // unwrapCart accepts both shapes.
  cart: () => request('/cart', { private: true }).then(unwrapCart),
  addToCart: (productId, qty = 1) => request('/cart', { method: 'POST', body: { productId, qty }, private: true }).then(unwrapCart),
  setQty: (productId, qty) => request('/cart/' + encodeURIComponent(productId), { method: 'PATCH', body: { qty }, private: true }).then(unwrapCart),
  removeFromCart: (productId) => request('/cart/' + encodeURIComponent(productId), { method: 'DELETE', private: true }).then(unwrapCart),

  // Orders
  createOrder: () => request('/orders', { method: 'POST', private: true }),
  orders: () => request('/orders', { private: true }),

  // Comments
  addComment: (productId, text) => request('/products/' + encodeURIComponent(productId) + '/comments', { method: 'POST', body: { text }, private: true }),
};

// Loads every page of /products (API max limit is 50 per page)
async function fetchAllProducts(params = {}) {
  const first = await api.products({ ...params, limit: 50, page: 1 });
  let products = first.products;
  for (let page = 2; page <= first.pages; page++) {
    const next = await api.products({ ...params, limit: 50, page });
    products = products.concat(next.products);
  }
  return products;
}
