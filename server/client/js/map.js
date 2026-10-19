// Leaflet helpers — assumes Leaflet is already loaded on the page.
window.DMap = {
  create(elementId, { center = [-17.8252, 31.0335], zoom = 12 } = {}) {
    const el = document.getElementById(elementId);
    if (!el || typeof L === 'undefined') return null;

    const map = L.map(el).setView(center, zoom);
    
    // Using Esri World Street Map - highly reliable, no API key needed for light usage
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012',
      maxZoom: 19
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