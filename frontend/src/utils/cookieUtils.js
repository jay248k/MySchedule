/**
 * Modern Browser Cookie Management Utilities
 * Used for secure token and session state persistence without cluttering localStorage.
 */

export const cookieUtils = {
  /**
   * Retrieve a cookie by name
   */
  get(name) {
    if (typeof document === 'undefined') return null;
    const key = encodeURIComponent(name);
    const cookies = document.cookie.split(';');
    for (let c of cookies) {
      const trimmed = c.trim();
      if (trimmed.startsWith(key + '=')) {
        try {
          return decodeURIComponent(trimmed.substring(key.length + 1));
        } catch {
          return trimmed.substring(key.length + 1);
        }
      }
    }
    return null;
  },

  /**
   * Set a cookie with an expiration in days
   */
  set(name, value, days = 30) {
    if (typeof document === 'undefined') return;
    let expires = '';
    if (days) {
      const date = new Date();
      date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
      expires = '; expires=' + date.toUTCString();
    }
    const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
    const secureFlag = isHttps ? '; Secure' : '';
    document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value || '')}${expires}; path=/; SameSite=Lax${secureFlag}`;
  },

  /**
   * Delete a cookie by setting expired date
   */
  remove(name) {
    if (typeof document === 'undefined') return;
    document.cookie = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`;
  },

  /**
   * Clear all application cookies
   */
  clearAll() {
    if (typeof document === 'undefined') return;
    const cookies = document.cookie.split(';');
    for (let c of cookies) {
      const eqPos = c.indexOf('=');
      const name = eqPos > -1 ? c.substring(0, eqPos).trim() : c.trim();
      if (name) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`;
      }
    }
  },

  /**
   * Retrieve and parse a JSON cookie
   */
  getJSON(name) {
    const raw = this.get(name);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  /**
   * Store a JSON-serializable object in a cookie
   */
  setJSON(name, obj, days = 30) {
    if (!obj) {
      this.remove(name);
      return;
    }
    try {
      this.set(name, JSON.stringify(obj), days);
    } catch (e) {
      console.warn(`[Cookie] Failed to serialize cookie ${name}:`, e);
    }
  },
};

/**
 * Completely purge browser localStorage so that all data lives exclusively in cookies / Neon DB
 */
export function purgeLegacyLocalStorage() {
  if (typeof window === 'undefined' || !window.localStorage) return;

  try {
    window.localStorage.clear();
  } catch (err) {
    console.warn('[Storage] Could not clear localStorage:', err);
  }
}
