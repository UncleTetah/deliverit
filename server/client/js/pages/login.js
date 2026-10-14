const form = document.getElementById('login-form');
const errorEl = document.getElementById('error');

// Already logged in? Skip.
if (Auth.isLoggedIn()) {
  window.location.href = 'dashboard.html';
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorEl.hidden = true;

  const btn = form.querySelector('button[type=submit]');
  btn.disabled = true;

  try {
    const { user, token } = await API.post(
      '/auth/login',
      { email: form.email.value.trim(), password: form.password.value },
      { auth: false }
    );
    API.setToken(token);
    API.setUser(user);
    window.location.href = 'dashboard.html';
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.hidden = false;
  } finally {
    btn.disabled = false;
  }
});