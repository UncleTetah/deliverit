// =========================================================
// DeliverIt — auth.js
// Session helpers shared across pages.
// =========================================================

window.Auth = {
  isLoggedIn() { return !!API.getToken(); },
  currentUser() { return API.getUser(); },

  requireAuth(redirect = 'login.html') {
    if (!this.isLoggedIn()) {
      window.location.href = redirect;
      return false;
    }
    return true;
  },

  requireGuest(redirect = 'dashboard.html') {
    if (this.isLoggedIn()) {
      window.location.href = redirect;
      return false;
    }
    return true;
  },

  logout(redirect = '../index.html') {
    API.clearSession();
    window.location.href = redirect;
  },

  bindLogout(selector = '#logout') {
    const btn = document.querySelector(selector);
    if (btn) btn.addEventListener('click', () => this.logout());
  },
};