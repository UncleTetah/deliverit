// =====================================================
// DeliverIt — API wrapper
// =====================================================

const API_BASE = `${window.location.protocol}//${window.location.host}/api`;

(async function probeServer() {
  try {
    const healthUrl = API_BASE.replace('/api', '/health');
    const res = await fetch(healthUrl, { method: 'GET' });
    if (!res.ok) console.warn(`⚠️ API health check returned ${res.status}`);
  } catch {
    console.error(`%c🚨 DeliverIt API is NOT reachable at ${API_BASE}`, 'color:red;font-weight:bold;');
  }
})();

window.API = {
  base: API_BASE,
  getToken() { return localStorage.getItem('deliverit_token'); },
  setToken(t) { localStorage.setItem('deliverit_token', t); },
  getUser() {
    const raw = localStorage.getItem('deliverit_user');
    return raw ? JSON.parse(raw) : null;
  },
  setUser(u) { localStorage.setItem('deliverit_user', JSON.stringify(u)); },
  clearSession() {
    localStorage.removeItem('deliverit_token');
    localStorage.removeItem('deliverit_user');
  },
  async request(path, { method = 'GET', body, auth = true } = {}) {
    const url = `${API_BASE}${path}`;
    const headers = { 'Content-Type': 'application/json' };
    if (auth) {
      const token = this.getToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }
    let res;
    try {
      res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
    } catch (err) {
      throw new Error(`Cannot reach API at ${url}.`);
    }
    const text = await res.text();
    let data = {};
    try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
    if (!res.ok) throw new Error(data?.error?.message || `${res.status} ${res.statusText}`);
    return data;
  },
  get(path, opts) { return this.request(path, { ...opts, method: 'GET' }); },
  post(path, body, opts) { return this.request(path, { ...opts, method: 'POST', body }); },
  patch(path, body, opts) { return this.request(path, { ...opts, method: 'PATCH', body }); },
  put(path, body, opts) { return this.request(path, { ...opts, method: 'PUT', body }); },
  del(path, opts) { return this.request(path, { ...opts, method: 'DELETE' }); },
};