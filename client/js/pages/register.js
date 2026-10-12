const form = document.getElementById('register-form');
const errorEl = document.getElementById('error');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorEl.hidden = true;

  const payload = {
    full_name: form.full_name.value.trim(),
    email: form.email.value.trim(),
    phone: form.phone.value.trim() || undefined,
    password: form.password.value,
    role: form.querySelector('input[name="role"]:checked').value,
  };

  const btn = form.querySelector('button[type=submit]');
  btn.disabled = true;

  try {
    const { user, token } = await API.post('/auth/register', payload, { auth: false });
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