if (!Auth.requireAuth('login.html')) throw new Error('redirecting');

const user = Auth.currentUser();
if (user.role !== 'courier') {
  window.location.href = 'dashboard.html';
}

document.getElementById('greeting').textContent = `Hi, ${user.full_name.split(' ')[0]}`;
Auth.bindLogout('#logout');

const form = document.getElementById('courier-form');
const errorEl = document.getElementById('error');
const successEl = document.getElementById('success');

// Suggested max capacity per vehicle type (kg)
const CAPACITY_SUGGESTIONS = {
  motorbike: 20,
  car: 100,
  van: 500,
  truck: 5000,
};

// Auto-fill capacity when vehicle type changes
form.vehicle_type.addEventListener('change', () => {
  const suggestion = CAPACITY_SUGGESTIONS[form.vehicle_type.value];
  if (suggestion && !form.vehicle_capacity_kg.value) {
    form.vehicle_capacity_kg.value = suggestion;
  }
});

// Load existing profile
(async function load() {
  try {
    const { profile } = await API.get('/couriers/me');
    for (const [k, v] of Object.entries(profile)) {
      const el = form.elements[k];
      if (el && v != null) el.value = v;
    }
  } catch {
    // no profile yet — pre-fill sensible defaults
    form.vehicle_type.value = 'motorbike';
    form.vehicle_capacity_kg.value = CAPACITY_SUGGESTIONS.motorbike;
    form.license_class.value = 'A';
    form.max_active_jobs.value = 1;
  }
})();

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorEl.hidden = true;
  successEl.hidden = true;

  const payload = {
    vehicle_type: form.vehicle_type.value,
    vehicle_make: form.vehicle_make.value.trim(),
    vehicle_model: form.vehicle_model.value.trim(),
    vehicle_color: form.vehicle_color.value.trim(),
    vehicle_plate: form.vehicle_plate.value.trim(),
    vehicle_capacity_kg: Number(form.vehicle_capacity_kg.value),
    license_class: form.license_class.value,
    license_number: form.license_number.value.trim(),
    license_expiry: form.license_expiry.value || undefined,
    max_active_jobs: Number(form.max_active_jobs.value) || 1,
  };

  const btn = form.querySelector('button[type=submit]');
  btn.disabled = true;

  try {
    await API.request('/couriers/me', { method: 'PUT', body: payload });
    successEl.hidden = false;
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.hidden = false;
  } finally {
    btn.disabled = false;
  }
});