import { WebApp, WebsiteSettings } from '../types';
import defaultAppsList from '../data/defaultApps.json';

const TOKEN_KEY = 'sir_ameir_playground_token';
const APPS_STORAGE_KEY = 'sir_ameir_cached_apps';
const SETTINGS_STORAGE_KEY = 'sir_ameir_cached_settings';
const PASS_STORAGE_KEY = 'sir_ameir_custom_pass';

export const authStorage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clearToken: () => localStorage.removeItem(TOKEN_KEY),
  getStoredPass: () => localStorage.getItem(PASS_STORAGE_KEY) || 'admin',
  setStoredPass: (pass: string) => localStorage.setItem(PASS_STORAGE_KEY, pass),
};

// Helper to get local apps
export function getLocalApps(): WebApp[] {
  try {
    const raw = localStorage.getItem(APPS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return Array.isArray(defaultAppsList) ? (defaultAppsList as WebApp[]) : [];
}

export function saveLocalApps(apps: WebApp[]): void {
  try {
    localStorage.setItem(APPS_STORAGE_KEY, JSON.stringify(apps));
  } catch {
    // ignore
  }
}

export function getLocalSettings(): WebsiteSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // ignore
  }
  return {
    siteName: 'SIR AMEIR PLAYGROUND',
    tagline: 'All my educational and interactive webapps in one place.',
    ownerName: 'Sir Ameir',
    ownerBio: 'Pendidik & Pembangun WebApp',
    ownerAvatar: '',
    announcementText: '',
    announcementActive: false,
    announcementType: 'info',
    maintenanceMode: false,
    footerText: '© SIR AMEIR PLAYGROUND',
    contactEmail: 'AmeirAdha4@gmail.com',
    adminUsername: 'admin'
  };
}

export function saveLocalSettings(settings: WebsiteSettings): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

async function fetchJson<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = authStorage.getToken();
  const headers = new Headers(options.headers || {});
  
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, { ...options, headers });
  
  if (!response.ok) {
    let errorMsg = 'Ralat sambungan pelayan.';
    try {
      const errData = await response.json();
      if (errData && errData.error) errorMsg = errData.error;
    } catch {
      // not JSON (e.g. 404 HTML on Vercel)
    }
    const err = new Error(errorMsg);
    (err as any).status = response.status;
    throw err;
  }

  return response.json();
}

export const api = {
  getSettings: async (): Promise<WebsiteSettings> => {
    try {
      const settings = await fetchJson<WebsiteSettings>('/api/settings');
      saveLocalSettings(settings);
      return settings;
    } catch {
      return getLocalSettings();
    }
  },

  getApps: async (): Promise<WebApp[]> => {
    try {
      const apps = await fetchJson<WebApp[]>('/api/apps');
      if (Array.isArray(apps)) {
        // If server responded with apps, save local cache
        if (apps.length > 0) {
          saveLocalApps(apps);
          return apps;
        } else {
          // If server is clean empty, check if we have local saved apps
          const local = getLocalApps();
          if (local.length > 0) return local;
          return [];
        }
      }
      return getLocalApps();
    } catch {
      // Offline / Vercel fallback
      return getLocalApps();
    }
  },

  recordClick: async (id: string): Promise<{ success: boolean; clicks: number }> => {
    try {
      return await fetchJson<{ success: boolean; clicks: number }>(`/api/apps/${id}/click`, { method: 'POST' });
    } catch {
      const current = getLocalApps();
      const item = current.find(a => a.id === id);
      const clicks = ((item?.clicks) || 0) + 1;
      if (item) {
        item.clicks = clicks;
        saveLocalApps(current);
      }
      return { success: true, clicks };
    }
  },

  // Auth: username: admin, password: admin
  login: async (username: string, passcode: string): Promise<{ success: boolean; token: string; user: any }> => {
    const cleanUser = (username || '').trim();
    const cleanPass = (passcode || '').trim();

    // 1. Try server endpoint first
    try {
      const res = await fetchJson<{ success: boolean; token: string; user: any }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username: cleanUser, passcode: cleanPass }),
      });
      if (res && res.token) {
        authStorage.setToken(res.token);
        return res;
      }
    } catch (err: any) {
      // If server explicitly said invalid password (status 401 with JSON message), check local
      console.warn('Server login attempt failed or endpoint unreachable, validating locally:', err?.message);
    }

    // 2. Resilient Fallback (Guaranteed to work on Vercel, offline, or standalone static deployment)
    const validUser = cleanUser.toLowerCase() === 'admin';
    const storedPass = authStorage.getStoredPass();
    const validPass = cleanPass === 'admin' || cleanPass === storedPass;

    if (validUser && validPass) {
      const localToken = 'admin_session_' + Date.now();
      authStorage.setToken(localToken);
      return {
        success: true,
        token: localToken,
        user: {
          username: 'admin',
          role: 'admin',
          name: 'Sir Ameir'
        }
      };
    }

    throw new Error('Username atau password pentadbir tidak tepat. Sila gunakan admin / admin.');
  },

  verifyAuth: async (): Promise<{ isAuthenticated: boolean; user?: any }> => {
    const token = authStorage.getToken();
    if (!token) return { isAuthenticated: false };

    try {
      const res = await fetchJson<{ isAuthenticated: boolean; user?: any }>('/api/auth/verify');
      if (res && res.isAuthenticated) return res;
    } catch {
      // Vercel / serverless fallback: if valid session token exists
      if (token.startsWith('admin_session_') || token.length >= 10) {
        return {
          isAuthenticated: true,
          user: {
            username: 'admin',
            role: 'admin',
            name: 'Sir Ameir'
          }
        };
      }
    }

    return { isAuthenticated: false };
  },

  logout: async (): Promise<void> => {
    try {
      await fetchJson('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    } finally {
      authStorage.clearToken();
    }
  },

  // Admin WebApps CRUD with seamless Vercel fallback
  createApp: async (data: Partial<WebApp>): Promise<WebApp> => {
    try {
      const created = await fetchJson<WebApp>('/api/apps', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      const current = getLocalApps();
      const updated = [...current, created];
      saveLocalApps(updated);
      return created;
    } catch {
      // Vercel local fallback
      const current = getLocalApps();
      const newApp: WebApp = {
        id: 'app-' + Date.now(),
        title: (data.title || '').trim(),
        url: (data.url || '').trim(),
        iconType: data.iconType || 'preset',
        iconName: data.iconName || 'Gamepad2',
        iconColor: data.iconColor || 'red',
        iconUrl: data.iconUrl,
        order: current.length + 1,
        clicks: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const updated = [...current, newApp];
      saveLocalApps(updated);
      return newApp;
    }
  },

  updateApp: async (id: string, data: Partial<WebApp>): Promise<WebApp> => {
    try {
      const updated = await fetchJson<WebApp>(`/api/apps/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      const current = getLocalApps();
      const index = current.findIndex(a => a.id === id);
      if (index !== -1) {
        current[index] = updated;
        saveLocalApps(current);
      }
      return updated;
    } catch {
      const current = getLocalApps();
      const index = current.findIndex(a => a.id === id);
      if (index === -1) throw new Error('WebApp tidak dijumpai.');
      const updated: WebApp = {
        ...current[index],
        ...data,
        id,
        updatedAt: new Date().toISOString()
      };
      current[index] = updated;
      saveLocalApps(current);
      return updated;
    }
  },

  deleteApp: async (id: string): Promise<{ success: boolean; message: string }> => {
    try {
      await fetchJson<{ success: boolean; message: string }>(`/api/apps/${id}`, {
        method: 'DELETE',
      });
    } catch {
      // ignore
    }
    const current = getLocalApps().filter(a => a.id !== id);
    saveLocalApps(current);
    return { success: true, message: 'Berjaya dipadam.' };
  },

  reorderApps: async (appIds: string[]): Promise<{ success: boolean; apps: WebApp[] }> => {
    const current = getLocalApps();
    const appMap = new Map(current.map(a => [a.id, a]));
    const reordered: WebApp[] = [];
    appIds.forEach((id, idx) => {
      const item = appMap.get(id);
      if (item) {
        item.order = idx + 1;
        reordered.push(item);
        appMap.delete(id);
      }
    });
    appMap.forEach(item => reordered.push(item));
    saveLocalApps(reordered);

    try {
      await fetchJson<{ success: boolean; apps: WebApp[] }>('/api/apps/reorder', {
        method: 'POST',
        body: JSON.stringify({ appIds }),
      });
    } catch {
      // ignore
    }

    return { success: true, apps: reordered };
  },

  updateSettings: async (settings: Partial<WebsiteSettings> & { newPassword?: string }): Promise<WebsiteSettings> => {
    if (settings.newPassword && settings.newPassword.trim()) {
      authStorage.setStoredPass(settings.newPassword.trim());
    }

    const current = getLocalSettings();
    const updated: WebsiteSettings = {
      ...current,
      ...settings
    };
    saveLocalSettings(updated);

    try {
      return await fetchJson<WebsiteSettings>('/api/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
    } catch {
      return updated;
    }
  },
};
