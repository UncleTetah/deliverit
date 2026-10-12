// =====================================================
// DeliverIt — API wrapper
// Auto-detects API host based on how the page was loaded.
// =====================================================

// If the page was served from a LAN IP, use that IP for the API.
// If loaded from localhost/127.0.0.1, keep using localhost.
const API_BASE = `${window.location.protocol}//${window.location.host}/api`;

console.log(`🔌 API base: ${API_BASE}`);;

console.log(`🔌 API base: ${API_BASE}`);

const TOKEN_KEY = 'deliverit_token';
const USER_KEY = 'deliverit_user';

// Health probe
(async function probeServer() {
  try {
    const res = await fetch(`http://${API_HOST}:${API_PORT}/health`, { method: 'GET' });
    if (!res.ok) console.warn(`⚠️ API health check returned ${res.status}`);
  } catch {
    console.error(
      `%c🚨 DeliverIt API is NOT reachable at http://${API_HOST}:${API_PORT}`,
      'color:red;font-weight:bold;font-size:14px'
    );
    console.error(
      '%cIf you are on the host machine, run:  cd server && npm run dev',
      'color:orange;font-size:13px'
    );
  }
})();

window.API = {
  base: API_BASE,

  getToken() { return localStorage.getItem(TOKEN_KEY); },
  setToken(t) { localStorage.setItem(TOKEN_KEY, t); },
  getUser() {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  },
  setUser(u) { localStorage.setItem(USER_KEY, JSON.stringify(u)); },
  clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
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
      res = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (err) {
      throw new Error(
        `Cannot reach API at ${url}. Is the server running and reachable on this network?`
      );
    }

    const text = await res.text();
    let data = {};
    try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }

    if (!res.ok) {
      throw new Error(data?.error?.message || `${res.status} ${res.statusText}`);
    }
    return data;
  },

  get(path, opts) { return this.request(path, { ...opts, method: 'GET' }); },
  post(path, body, opts) { return this.request(path, { ...opts, method: 'POST', body }); },
  patch(path, body, opts) { return this.request(path, { ...opts, method: 'PATCH', body }); },
  put(path, body, opts) { return this.request(path, { ...opts, method: 'PUT', body }); },
  del(path, opts) { return this.request(path, { ...opts, method: 'DELETE' }); },
};