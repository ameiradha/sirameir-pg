import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { WebApp, WebsiteSettings } from '../types';

const APPS_COLLECTION = 'apps';
const SETTINGS_COLLECTION = 'settings';
const GENERAL_SETTINGS_DOC = 'general';

export const firestoreService = {
  // Fetch all apps from Firestore
  getApps: async (): Promise<WebApp[]> => {
    try {
      const q = query(collection(db, APPS_COLLECTION));
      const snapshot = await getDocs(q);
      const apps: WebApp[] = [];
      snapshot.forEach(docSnap => {
        apps.push(docSnap.data() as WebApp);
      });
      return apps.sort((a, b) => (a.order || 0) - (b.order || 0));
    } catch (error) {
      console.warn('Error fetching apps from Firestore, falling back:', error);
      return [];
    }
  },

  // Listen to real-time changes
  subscribeToApps: (
    onUpdate: (apps: WebApp[]) => void,
    onError?: (err: any) => void
  ) => {
    try {
      const q = query(collection(db, APPS_COLLECTION));
      return onSnapshot(
        q,
        (snapshot) => {
          const apps: WebApp[] = [];
          snapshot.forEach(docSnap => {
            apps.push(docSnap.data() as WebApp);
          });
          apps.sort((a, b) => (a.order || 0) - (b.order || 0));
          onUpdate(apps);
        },
        (error) => {
          console.warn('Firestore snapshot error:', error);
          if (onError) onError(error);
          handleFirestoreError(error, OperationType.GET, APPS_COLLECTION);
        }
      );
    } catch (err) {
      console.warn('Failed to attach Firestore snapshot listener:', err);
      return () => {};
    }
  },

  // Save or update an app in Firestore
  saveApp: async (app: WebApp): Promise<void> => {
    const cleanId = app.id.replace(/[^a-zA-Z0-9_\-]/g, '_');
    const path = `${APPS_COLLECTION}/${cleanId}`;
    try {
      await setDoc(doc(db, APPS_COLLECTION, cleanId), {
        ...app,
        id: cleanId,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  // Delete an app from Firestore
  deleteApp: async (appId: string): Promise<void> => {
    const cleanId = appId.replace(/[^a-zA-Z0-9_\-]/g, '_');
    const path = `${APPS_COLLECTION}/${cleanId}`;
    try {
      await deleteDoc(doc(db, APPS_COLLECTION, cleanId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  // Batch save multiple apps (e.g. on reorder or import)
  saveAllApps: async (apps: WebApp[]): Promise<void> => {
    for (let i = 0; i < apps.length; i++) {
      const app = apps[i];
      const cleanId = app.id.replace(/[^a-zA-Z0-9_\-]/g, '_');
      try {
        await setDoc(doc(db, APPS_COLLECTION, cleanId), {
          ...app,
          id: cleanId,
          order: i + 1,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        console.warn(`Failed to sync app ${app.title} to Firestore:`, err);
      }
    }
  },

  // Save settings to Firestore
  saveSettings: async (settings: WebsiteSettings): Promise<void> => {
    const path = `${SETTINGS_COLLECTION}/${GENERAL_SETTINGS_DOC}`;
    try {
      await setDoc(doc(db, SETTINGS_COLLECTION, GENERAL_SETTINGS_DOC), {
        ...settings,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  // Get settings from Firestore
  getSettings: async (): Promise<WebsiteSettings | null> => {
    try {
      const snapshot = await getDocs(collection(db, SETTINGS_COLLECTION));
      let settings: WebsiteSettings | null = null;
      snapshot.forEach(docSnap => {
        if (docSnap.id === GENERAL_SETTINGS_DOC) {
          settings = docSnap.data() as WebsiteSettings;
        }
      });
      return settings;
    } catch (error) {
      console.warn('Error reading settings from Firestore:', error);
      return null;
    }
  }
};
