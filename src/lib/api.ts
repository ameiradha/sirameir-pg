import { WebApp, WebsiteSettings } from '../types';
import defaultAppsList from '../data/defaultApps.json';
import { firestoreService } from './firestoreService';
import { cloudSync } from './cloudSync';

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

export function getLocalApps(): WebApp[] {
  try {
    const raw = localStorage.getItem(APPS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
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
    // Try Firestore first
    try {
      const firestoreSettings = await firestoreService.getSettings();
      if (firestoreSettings && firestoreSettings.siteName) {
        saveLocalSettings(firestoreSettings);
        return firestoreSettings;
      }
    } catch {
      // ignore
    }

    try {
      const settings = await fetchJson<WebsiteSettings>('/api/settings');
      saveLocalSettings(settings);
      return settings;
    } catch {
      return getLocalSettings();
    }
  },

  // Get apps: Firebase Firestore -> Cloud Sync -> Local backend -> Local cache
  getApps: async (): Promise<WebApp[]> => {
    // 1. Primary: Firebase Firestore
    try {
      const firestoreApps = await firestoreService.getApps();
      if (Array.isArray(firestoreApps) && firestoreApps.length > 0) {
        saveLocalApps(firestoreApps);
        return firestoreApps;
      }
    } catch (e) {
      console.warn('Firestore fetch failed, checking secondary sources:', e);
    }

    // 2. Secondary: Global Cloud Sync
    try {
      const cloudApps = await cloudSync.fetchFromCloud();
      if (cloudApps && Array.isArray(cloudApps) && cloudApps.length > 0) {
        saveLocalApps(cloudApps);
        firestoreService.saveAllApps(cloudApps).catch(() => {});
        return cloudApps;
      }
    } catch {
      // ignore
    }

    // 3. Tertiary: Local backend
    try {
      const apps = await fetchJson<WebApp[]>('/api/apps');
      if (Array.isArray(apps) && apps.length > 0) {
        saveLocalApps(apps);
        firestoreService.saveAllApps(apps).catch(() => {});
        return apps;
      }
    } catch {
      // ignore
    }

    // 4. Fallback to cached local apps or default catalogue
    const local = getLocalApps();
    if (local.length > 0) {
      firestoreService.saveAllApps(local).catch(() => {});
    }
    return local;
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
        firestoreService.saveApp(item).catch(() => {});
      }
      return { success: true, clicks };
    }
  },

  // Auth: username: admin, password: admin
  login: async (username: string, passcode: string): Promise<{ success: boolean; token: string; user: any }> => {
    const cleanUser = (username || '').trim();
    const cleanPass = (passcode || '').trim();

    try {
      const res = await fetchJson<{ success: boolean; token: string; user: any }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username: cleanUser, passcode: cleanPass }),
      });
      if (res && res.token) {
        authStorage.setToken(res.token);
        return res;
      }
    } catch {
      // Fallback for Vercel/offline
    }

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

  // Admin WebApps CRUD: Persists directly into Firebase Firestore + local + cloudSync
  createApp: async (data: Partial<WebApp>): Promise<WebApp> => {
    const current = getLocalApps();
    const cleanId = 'app-' + Date.now();
    const newApp: WebApp = {
      id: cleanId,
      title: (data.title || '').trim(),
      url: (data.url || '').trim(),
      iconType: data.iconType || 'preset',
      iconName: data.iconName || 'Gamepad2',
      iconColor: data.iconColor || 'red',
      iconUrl: data.iconUrl || '',
      order: current.length + 1,
      clicks: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updated = [...current, newApp];
    saveLocalApps(updated);

    // Save directly to Firebase Firestore
    firestoreService.saveApp(newApp).catch(err => {
      console.warn('Firebase saveApp failed:', err);
    });

    // Secondary backup
    cloudSync.saveToCloud(updated).catch(() => {});

    // Try backend if present
    fetchJson<WebApp>('/api/apps', {
      method: 'POST',
      body: JSON.stringify(newApp),
    }).catch(() => {});

    return newApp;
  },

  updateApp: async (id: string, data: Partial<WebApp>): Promise<WebApp> => {
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

    // Update Firebase Firestore
    firestoreService.saveApp(updated).catch(err => {
      console.warn('Firebase updateApp failed:', err);
    });

    // Secondary backup
    cloudSync.saveToCloud(current).catch(() => {});

    // Try backend if present
    fetchJson<WebApp>(`/api/apps/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updated),
    }).catch(() => {});

    return updated;
  },

  deleteApp: async (id: string): Promise<{ success: boolean; message: string }> => {
    const current = getLocalApps().filter(a => a.id !== id);
    saveLocalApps(current);

    // Delete from Firebase Firestore
    firestoreService.deleteApp(id).catch(err => {
      console.warn('Firebase deleteApp failed:', err);
    });

    // Secondary backup
    cloudSync.saveToCloud(current).catch(() => {});

    // Try backend if present
    fetchJson<{ success: boolean; message: string }>(`/api/apps/${id}`, {
      method: 'DELETE',
    }).catch(() => {});

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

    // Save batch to Firebase Firestore
    firestoreService.saveAllApps(reordered).catch(err => {
      console.warn('Firebase reorder save failed:', err);
    });

    // Secondary backup
    cloudSync.saveToCloud(reordered).catch(() => {});

    // Try backend if present
    fetchJson<{ success: boolean; apps: WebApp[] }>('/api/apps/reorder', {
      method: 'POST',
      body: JSON.stringify({ appIds }),
    }).catch(() => {});

    return { success: true, apps: reordered };
  },

  importApps: async (incomingApps: WebApp[], replace: boolean = true): Promise<WebApp[]> => {
    const current = getLocalApps();
    let finalApps: WebApp[] = [];
    if (replace) {
      finalApps = incomingApps;
    } else {
      const existingIds = new Set(current.map(a => a.id));
      const newItems = incomingApps.filter(a => !existingIds.has(a.id));
      finalApps = [...current, ...newItems];
    }
    // Re-index orders
    finalApps = finalApps.map((item, idx) => ({ ...item, order: idx + 1 }));
    saveLocalApps(finalApps);

    // Batch save all to Firebase Firestore
    firestoreService.saveAllApps(finalApps).catch(err => {
      console.warn('Firebase import save failed:', err);
    });

    cloudSync.saveToCloud(finalApps).catch(() => {});

    fetchJson('/api/backup/import', {
      method: 'POST',
      body: JSON.stringify({ backupData: { apps: finalApps } }),
    }).catch(() => {});

    return finalApps;
  },

  // Manual Trigger to force sync from Firestore
  syncFromCloudNow: async (): Promise<WebApp[]> => {
    try {
      const firestoreApps = await firestoreService.getApps();
      if (Array.isArray(firestoreApps) && firestoreApps.length > 0) {
        saveLocalApps(firestoreApps);
        return firestoreApps;
      }
    } catch {}
    return getLocalApps();
  },

  // Manual Trigger to push to Firestore
  syncToCloudNow: async (apps: WebApp[]): Promise<boolean> => {
    saveLocalApps(apps);
    try {
      await firestoreService.saveAllApps(apps);
      await cloudSync.saveToCloud(apps);
      return true;
    } catch {
      return false;
    }
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

    // Save to Firestore
    firestoreService.saveSettings(updated).catch(() => {});

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
