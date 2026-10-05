import { WebApp } from '../types';

// Global shared cloud endpoint for SIR AMEIR PLAYGROUND (CORS enabled for Vercel, localhost, mobile)
const CLOUD_SYNC_URL = 'https://api.restful-api.dev/objects/ff808181a09d98f701a10c5966c67ea1';

export const cloudSync = {
  // Fetch latest apps from global cloud
  fetchFromCloud: async (): Promise<WebApp[] | null> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(CLOUD_SYNC_URL, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' },
      });
      clearTimeout(timeoutId);

      if (!res.ok) return null;
      const json = await res.json();
      if (json && json.data && Array.isArray(json.data.apps)) {
        return json.data.apps as WebApp[];
      }
    } catch (err) {
      console.warn('Cloud sync fetch skipped or offline:', err);
    }
    return null;
  },

  // Save apps list to global cloud
  saveToCloud: async (apps: WebApp[]): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(CLOUD_SYNC_URL, {
        method: 'PUT',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'sir_ameir_playground_catalog',
          data: {
            apps,
            updatedAt: new Date().toISOString(),
          },
        }),
      });
      clearTimeout(timeoutId);

      return res.ok;
    } catch (err) {
      console.warn('Cloud sync push failed:', err);
      return false;
    }
  },
};
