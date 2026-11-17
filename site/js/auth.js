// Log In (POST /login) and Register (POST /register)
document.addEventListener('DOMContentLoaded', () => {
  const next = new URLSearchParams(location.search).get('next');
  // Only allow redirects to our own pages
  const target = next && /^[\w-]+\.html(\?.*)?$/.test(next) ? next : 'profile.html';
  const error = document.getElementById('form-error');

  // Keep ?next= when switching between login and register
  ['to-register', 'to-login'].forEach((id) => {
    const a = document.getElementById(id);
    if (a && next) a.href += '?next=' + encodeURIComponent(next);
  });

  if (auth.isLoggedIn) { location.replace(target); return; }

  async function submit(form, action) {
    error.textContent = '';
    const btn = form.querySelector('.btn-form');
    btn.disabled = true;
    try {
      const { token } = await action();
      auth.set(token);
      location.href = target;
    } catch (e) {
      error.textContent = e.message;
      btn.disabled = false;
    }
  }

  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = loginForm.email.value.trim();
      const password = loginForm.password.value;
      if (!email || !password) { error.textContent = 'Enter email and password'; return; }
      submit(loginForm, () => api.login(email, password));
    });
  }

  const regForm = document.getElementById('register-form');
  if (regForm) {
    regForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const f = regForm;
      const data = {
        name: f.name.value.trim(),
        surname: f.surname.value.trim(),
        email: f.email.value.trim(),
        phone: f.phone.value.replace(/\D/g, ''),
        password: f.password.value,
      };
      if (!data.name || !data.surname || !data.email || !data.phone || !data.password) {
        error.textContent = 'Fill in all fields'; return;
      }
      if (data.phone.length < 9 || data.phone.length > 15) { error.textContent = 'Phone must have 9–15 digits'; return; }
      if (data.password.length < 4) { error.textContent = 'Password must be at least 4 characters'; return; }
      if (data.password !== f.password2.value) { error.textContent = 'Passwords do not match'; return; }
      submit(f, () => api.register(data));
    });
  }
});
