const form = document.getElementById('track-form');
const input = document.getElementById('delivery-id');
const timelineEl = document.getElementById('timeline');

const map = DMap.create('map');
let pickupMarker, dropoffMarker, courierMarker, routeLine;

// Load from ?id= if present
const params = new URLSearchParams(window.location.search);
if (params.get('id')) {
  input.value = params.get('id');
  loadDelivery(params.get('id'));
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const id = input.value.trim();
  if (id) loadDelivery(id);
});

async function loadDelivery(id) {
  timelineEl.innerHTML = '<p class="muted">Loading…</p>';
  try {
    const [{ delivery }, { events }] = await Promise.all([
      API.get(`/deliveries/${id}`),
      API.get(`/deliveries/${id}/track`),
    ]);
    renderMap(delivery, events);
    renderTimeline(events);
  } catch (err) {
    timelineEl.innerHTML = `<div class="alert alert-danger">${escapeHtml(err.message)}</div>`;
  }
}

function renderMap(d, events) {
  if (!map) return;

  [pickupMarker, dropoffMarker, courierMarker, routeLine]
    .filter(Boolean)
    .forEach((layer) => map.removeLayer(layer));

  pickupMarker = DMap.marker(map, d.pickup_lat, d.pickup_lng, {
    color: '#16a34a', label: 'Pickup',
  });
  dropoffMarker = DMap.marker(map, d.dropoff_lat, d.dropoff_lng, {
    color: '#dc2626', label: 'Dropoff',
  });

  routeLine = DMap.line(map, [
    [d.pickup_lat, d.pickup_lng],
    [d.dropoff_lat, d.dropoff_lng],
  ]);

  const last = events.find((e) => e.lat && e.lng);
  if (last) {
    courierMarker = DMap.marker(map, last.lat, last.lng, {
      color: '#2563eb', label: 'Courier',
    });
  }

  DMap.fit(map, [
    [d.pickup_lat, d.pickup_lng],
    [d.dropoff_lat, d.dropoff_lng],
  ]);
}

function renderTimeline(events) {
  if (!events.length) {
    timelineEl.innerHTML = '<p class="muted">No tracking events yet.</p>';
    return;
  }
  timelineEl.innerHTML = events.map((e) => `
    <div class="timeline-item">
      <strong>${e.status.replace('_',' ')}</strong>
      ${e.note ? `— ${escapeHtml(e.note)}` : ''}
      <small>${new Date(e.created_at).toLocaleString()}</small>
    </div>
  `).join('');
}

function escapeHtml(s = '') {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[c]);
}