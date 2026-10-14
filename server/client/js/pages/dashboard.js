if (!Auth.requireAuth('login.html')) throw new Error('redirecting');

const user = Auth.currentUser();
document.getElementById('greeting').textContent = `Hi, ${user.full_name.split(' ')[0]}`;
Auth.bindLogout('#logout');

const els = {
  title: document.getElementById('page-title'),
  subtitle: document.getElementById('page-subtitle'),
  newBtn: document.getElementById('new-delivery-btn'),
  stats: document.getElementById('stats'),
  availSection: document.getElementById('available-section'),
  availList: document.getElementById('available-list'),
  assignedSection: document.getElementById('assigned-section'),
  assignedList: document.getElementById('assigned-list'),
  customerSection: document.getElementById('customer-section'),
  customerList: document.getElementById('customer-list'),
};

if (user.role === 'customer') {
  els.title.textContent = 'Dashboard';
  els.subtitle.textContent = 'Manage your deliveries and track their status.';
  els.newBtn.hidden = false;
  els.customerSection.hidden = false;
  loadCustomerView();
} else if (user.role === 'courier') {
  els.title.textContent = 'Courier Dashboard';
  els.subtitle.textContent = 'Accept jobs and manage your active deliveries.';
  els.availSection.hidden = false;
  els.assignedSection.hidden = false;
  ensureCourierProfileThenLoad();
} else {
  els.title.textContent = 'Admin';
  els.subtitle.textContent = 'All deliveries.';
  els.customerSection.hidden = false;
  loadAdminView();
}

// ---------------- Courier bootstrap ----------------
async function ensureCourierProfileThenLoad() {
  try {
    const { profile } = await API.get('/couriers/me');
    const complete =
      profile &&
      profile.vehicle_type && profile.vehicle_make && profile.vehicle_model &&
      profile.vehicle_color && profile.vehicle_plate && profile.vehicle_capacity_kg &&
      profile.license_class && profile.license_number;

    if (!complete) {
      showProfileBanner();
    }
  } catch {
    // no profile at all — definitely need one
    showProfileBanner();
  }
  loadCourierView();
}

function showProfileBanner() {
  const banner = document.createElement('div');
  banner.className = 'card';
  banner.style.borderLeft = '4px solid var(--color-primary)';
  banner.innerHTML = `
    <strong>Finish your courier profile</strong>
    <p class="muted">Add your vehicle and licence details so you can start accepting jobs.</p>
    <p style="margin-top:.75rem">
      <a class="btn btn-primary" href="courier-profile.html">
        <i class="fa-solid fa-id-card"></i> Complete Profile
      </a>
    </p>
  `;
  els.stats.parentElement.insertBefore(banner, els.stats);
}

// ---------------- Customer view ----------------
async function loadCustomerView() {
  try {
    const { deliveries } = await API.get('/deliveries');
    renderStats(deliveries);
    els.customerList.innerHTML = deliveries.length
      ? deliveries.map(renderCustomerCard).join('')
      : '<p class="muted">No deliveries yet. Create one to get started.</p>';
  } catch (err) {
    els.customerList.innerHTML = `<p class="form-error">${escapeHtml(err.message)}</p>`;
  }
}

function renderCustomerCard(d) {
  return `
    <div class="delivery-card">
      <div>
        <h3>${escapeHtml(d.package_desc || 'Delivery')}</h3>
        <p>
          <i class="fa-solid fa-location-dot"></i> ${escapeHtml(d.pickup_address)}
          <i class="fa-solid fa-arrow-right"></i>
          <i class="fa-solid fa-location-dot"></i> ${escapeHtml(d.dropoff_address)}
        </p>
        <p class="muted">
          ${escapeHtml(d.public_code || '')} · ${formatDate(d.created_at)}
          ${d.courier_name ? ` · Courier: ${escapeHtml(d.courier_name)} (${escapeHtml(d.courier_code || '')})` : ''}
        </p>
      </div>
      <div class="delivery-card-actions">
        <span class="badge badge-${d.status}">${d.status}</span>
        <a href="track.html?id=${d.public_code || d.id}" class="btn btn-outline">
          <i class="fa-solid fa-route"></i> Track
        </a>
      </div>
    </div>
  `;
}

// ---------------- Courier view ----------------
async function loadCourierView() {
  try {
    const [availRes, assignedRes] = await Promise.all([
      API.get('/deliveries?scope=available'),
      API.get('/deliveries'),
    ]);

    renderStats(assignedRes.deliveries);

    els.availList.innerHTML = availRes.deliveries.length
      ? availRes.deliveries.map(renderAvailableCard).join('')
      : '<p class="muted">No jobs available right now. Check back soon.</p>';

    els.assignedList.innerHTML = assignedRes.deliveries.length
      ? assignedRes.deliveries.map(renderAssignedCard).join('')
      : '<p class="muted">You have no active runs.</p>';

    bindCourierActions();
  } catch (err) {
    els.availList.innerHTML = `<p class="form-error">${escapeHtml(err.message)}</p>`;
    els.assignedList.innerHTML = '';
  }
}

function renderAvailableCard(d) {
  return `
    <div class="delivery-card">
      <div>
        <h3>${escapeHtml(d.package_desc || 'Delivery')} <span class="muted">· ${d.category}</span></h3>
        <p>
          <i class="fa-solid fa-location-dot"></i> ${escapeHtml(d.pickup_address)}
          <i class="fa-solid fa-arrow-right"></i>
          <i class="fa-solid fa-location-dot"></i> ${escapeHtml(d.dropoff_address)}
        </p>
        <p class="muted">
          ${escapeHtml(d.public_code || '')} · ${d.package_weight_kg ? d.package_weight_kg + ' kg' : 'weight n/a'} · From ${escapeHtml(d.customer_name || 'customer')} (${escapeHtml(d.customer_code || '')})
        </p>
      </div>
      <div class="delivery-card-actions">
        <span class="badge badge-${d.status}">${d.status}</span>
        <button class="btn btn-primary" data-action="accept" data-id="${d.id}">
          <i class="fa-solid fa-check"></i> Accept
        </button>
      </div>
    </div>
  `;
}

function renderAssignedCard(d) {
  const nextActions = {
    accepted:  [{ status: 'picked_up',  label: 'Mark Picked Up',  icon: 'fa-box' }],
    picked_up: [{ status: 'in_transit', label: 'Start Transit',   icon: 'fa-truck' }],
    in_transit:[{ status: 'delivered',  label: 'Mark Delivered',  icon: 'fa-circle-check' }],
  }[d.status] || [];

  const actionsHtml = nextActions.map((a) => `
    <button class="btn btn-primary" data-action="status" data-id="${d.id}" data-status="${a.status}">
      <i class="fa-solid ${a.icon}"></i> ${a.label}
    </button>
  `).join('');

  return `
    <div class="delivery-card">
      <div>
        <h3>${escapeHtml(d.package_desc || 'Delivery')}</h3>
        <p>
          <i class="fa-solid fa-location-dot"></i> ${escapeHtml(d.pickup_address)}
          <i class="fa-solid fa-arrow-right"></i>
          <i class="fa-solid fa-location-dot"></i> ${escapeHtml(d.dropoff_address)}
        </p>
        <p class="muted">
          ${escapeHtml(d.public_code || '')} · Customer: ${escapeHtml(d.customer_name || '—')} (${escapeHtml(d.customer_code || '')}) · ${formatDate(d.created_at)}
        </p>
      </div>
      <div class="delivery-card-actions">
        <span class="badge badge-${d.status}">${d.status}</span>
        ${actionsHtml}
        <a href="track.html?id=${d.public_code || d.id}" class="btn btn-outline">
          <i class="fa-solid fa-route"></i> Track
        </a>
      </div>
    </div>
  `;
}

function bindCourierActions() {
  document.querySelectorAll('[data-action="accept"]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      btn.disabled = true;
      btn.textContent = 'Accepting…';
      try {
        await API.post(`/deliveries/${id}/accept`);
        window.location.reload();
      } catch (err) {
        alert(err.message);
        btn.disabled = false;
        btn.textContent = 'Accept';
      }
    });
  });

  document.querySelectorAll('[data-action="status"]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      const status = btn.dataset.status;
      const original = btn.innerHTML;
      btn.disabled = true;
      btn.textContent = 'Updating…';
      try {
        await API.patch(`/deliveries/${id}/status`, { status });
        window.location.reload();
      } catch (err) {
        alert(err.message);
        btn.disabled = false;
        btn.innerHTML = original;
      }
    });
  });
}

// ---------------- Admin view ----------------
async function loadAdminView() {
  try {
    const { deliveries } = await API.get('/deliveries');
    renderStats(deliveries);
    els.customerList.innerHTML = deliveries.length
      ? deliveries.map(renderCustomerCard).join('')
      : '<p class="muted">No deliveries.</p>';
  } catch (err) {
    els.customerList.innerHTML = `<p class="form-error">${escapeHtml(err.message)}</p>`;
  }
}

// ---------------- Shared ----------------
function renderStats(deliveries) {
  const total = deliveries.length;
  const inProgress = deliveries.filter((d) =>
    ['accepted', 'picked_up', 'in_transit'].includes(d.status)
  ).length;
  const delivered = deliveries.filter((d) => d.status === 'delivered').length;

  els.stats.innerHTML = `
    <div class="stat"><div class="stat-num">${total}</div><div class="stat-label">Total</div></div>
    <div class="stat"><div class="stat-num">${inProgress}</div><div class="stat-label">In Progress</div></div>
    <div class="stat"><div class="stat-num">${delivered}</div><div class="stat-label">Delivered</div></div>
  `;
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString();
}

function escapeHtml(s = '') {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[c]);
}