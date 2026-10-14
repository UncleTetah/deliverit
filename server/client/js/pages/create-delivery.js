if (!Auth.requireAuth('login.html')) throw new Error('redirecting');

const form = document.getElementById('delivery-form');
const errorEl = document.getElementById('error');

const map = DMap.create('map');
let pickupMarker = null;
let dropoffMarker = null;
let dropoffLine = null;

if (map) {
  map.on('click', (e) => {
    const { lat, lng } = e.latlng;

    // If pickup isn't set yet → set pickup. Otherwise set dropoff.
    const hasPickup = form.pickup_lat.value && form.pickup_lng.value;

    if (!hasPickup) {
      if (pickupMarker) map.removeLayer(pickupMarker);
      pickupMarker = DMap.marker(map, lat, lng, { color: '#16a34a', label: 'Pickup' });
      form.pickup_lat.value = lat.toFixed(6);
      form.pickup_lng.value = lng.toFixed(6);
    } else {
      if (dropoffMarker) map.removeLayer(dropoffMarker);
      if (dropoffLine) map.removeLayer(dropoffLine);

      dropoffMarker = DMap.marker(map, lat, lng, { color: '#dc2626', label: 'Dropoff' });
      form.dropoff_lat.value = lat.toFixed(6);
      form.dropoff_lng.value = lng.toFixed(6);

      const p = pickupMarker.getLatLng();
      dropoffLine = DMap.line(map, [[p.lat, p.lng], [lat, lng]]);
    }
  });
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorEl.hidden = true;

  const payload = {
    pickup_address:  form.pickup_address.value.trim(),
    pickup_lat:      Number(form.pickup_lat.value),
    pickup_lng:      Number(form.pickup_lng.value),
    pickup_contact:  form.pickup_contact.value.trim() || undefined,
    dropoff_address: form.dropoff_address.value.trim(),
    dropoff_lat:     Number(form.dropoff_lat.value),
    dropoff_lng:     Number(form.dropoff_lng.value),
    dropoff_contact: form.dropoff_contact.value.trim() || undefined,
    package_desc:    form.package_desc.value.trim() || undefined,
    package_weight_kg: form.package_weight_kg.value
      ? Number(form.package_weight_kg.value)
      : undefined,
  };

  const btn = form.querySelector('button[type=submit]');
  btn.disabled = true;

  try {
    const { delivery } = await API.post('/deliveries', payload);
    window.location.href = `track.html?id=${delivery.id}`;
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.hidden = false;
  } finally {
    btn.disabled = false;
  }
});