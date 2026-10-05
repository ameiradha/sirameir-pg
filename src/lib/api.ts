import { WebApp, WebsiteSettings, AuthState } from '../types';

const TOKEN_KEY = 'sir_ameir_playground_token';

export const authStorage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clearToken: () => localStorage.removeItem(TOKEN_KEY),
};

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
    let errorMsg = 'Ralat sambungan atau akses ditolak.';
    try {
      const errData = await response.json();
      if (errData.error) errorMsg = errData.error;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

export const api = {
  getSettings: () => fetchJson<WebsiteSettings>('/api/settings'),
  getApps: () => fetchJson<WebApp[]>('/api/apps'),
  recordClick: (id: string) => fetchJson<{ success: boolean; clicks: number }>(`/api/apps/${id}/click`, { method: 'POST' }),

  // Auth: username: admin, password: admin
  login: (username: string, passcode: string) => fetchJson<{ success: boolean; token: string; user: any }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, passcode }),
  }),
  verifyAuth: () => fetchJson<{ isAuthenticated: boolean; user?: any }>('/api/auth/verify'),
  logout: async () => {
    try {
      await fetchJson('/api/auth/logout', { method: 'POST' });
    } finally {
      authStorage.clearToken();
    }
  },

  // Admin WebApps CRUD
  createApp: (data: Partial<WebApp>) => fetchJson<WebApp>('/api/apps', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateApp: (id: string, data: Partial<WebApp>) => fetchJson<WebApp>(`/api/apps/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteApp: (id: string) => fetchJson<{ success: boolean; message: string }>(`/api/apps/${id}`, {
    method: 'DELETE',
  }),
  reorderApps: (appIds: string[]) => fetchJson<{ success: boolean; apps: WebApp[] }>('/api/apps/reorder', {
    method: 'POST',
    body: JSON.stringify({ appIds }),
  }),

  // Admin Settings
  updateSettings: (settings: Partial<WebsiteSettings> & { newPassword?: string }) => fetchJson<WebsiteSettings>('/api/settings', {
    method: 'PUT',
    body: JSON.stringify(settings),
  }),
};
