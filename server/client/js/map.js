// Leaflet helpers — assumes Leaflet is already loaded on the page.
window.DMap = {
  create(elementId, { center = [-17.8252, 31.0335], zoom = 12 } = {}) {
    const el = document.getElementById(elementId);
    if (!el || typeof L === 'undefined') return null;

    const map = L.map(el).setView(center, zoom);
    
    // Using CartoDB Positron - Highly reliable, full OSM details, AWS hosted
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);

    return map;
  },

  marker(map, lat, lng, { color = '#2563eb', label = '' } = {}) {
    const icon = L.divIcon({
      className: '',
      html: `<div style="
        background:${color};width:16px;height:16px;border-radius:50%;
        border:3px solid #fff;box-shadow:0 0 0 2px ${color};
      "></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });
    const m = L.marker([lat, lng], { icon }).addTo(map);
    if (label) m.bindPopup(label);
    return m;
  },

  line(map, points, { color = '#2563eb' } = {}) {
    return L.polyline(points, { color, weight: 3, opacity: 0.8 }).addTo(map);
  },

  fit(map, points) {
    if (!points.length) return;
    map.fitBounds(L.latLngBounds(points), { padding: [30, 30] });
  },
};