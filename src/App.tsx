import React, { useState, useEffect, useRef } from 'react';
import { WebApp, WebsiteSettings, AuthState } from './types';
import { api, authStorage } from './lib/api';
import { firestoreService } from './lib/firestoreService';
import { Header } from './components/Header';
import { HeroBanner } from './components/HeroBanner';
import { AppGrid } from './components/AppGrid';
import { AdminDashboard } from './components/Admin/AdminDashboard';
import { AppFormModal } from './components/Admin/AppFormModal';
import { LoginModal } from './components/Admin/LoginModal';
import { Footer } from './components/Footer';
import { OfflineIndicator } from './components/OfflineIndicator';
import defaultAppsList from './data/defaultApps.json';

const LOCAL_STORAGE_APPS_KEY = 'sir_ameir_cached_apps';

export default function App() {
  const [apps, setApps] = useState<WebApp[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_APPS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return Array.isArray(defaultAppsList) && defaultAppsList.length > 0
      ? (defaultAppsList as WebApp[])
      : [];
  });

  const [settings, setSettings] = useState<WebsiteSettings>({
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
  });

  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isAppFormOpen, setIsAppFormOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<WebApp | null>(null);

  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    token: null,
    user: null
  });

  const clickCountRef = useRef(0);
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleTitleClick = () => {
    clickCountRef.current += 1;

    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
    }

    if (clickCountRef.current >= 5) {
      clickCountRef.current = 0;
      if (authState.isAuthenticated) {
        setIsAdminOpen(true);
      } else {
        setIsLoginOpen(true);
      }
    } else {
      clickTimerRef.current = setTimeout(() => {
        clickCountRef.current = 0;
      }, 2500);
    }
  };

  const saveAppsState = (newApps: WebApp[]) => {
    setApps(newApps);
    try {
      localStorage.setItem(LOCAL_STORAGE_APPS_KEY, JSON.stringify(newApps));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  };

  const loadData = async () => {
    try {
      const [settingsData, serverApps] = await Promise.all([
        api.getSettings().catch(() => settings),
        api.getApps().catch(() => null)
      ]);

      if (settingsData) setSettings(settingsData);

      if (serverApps && Array.isArray(serverApps)) {
        if (serverApps.length > 0) {
          saveAppsState(serverApps);
        } else {
          // If server returned empty, check if we have cached apps or default apps to restore
          const cached = localStorage.getItem(LOCAL_STORAGE_APPS_KEY);
          if (cached) {
            try {
              const parsed = JSON.parse(cached);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setApps(parsed);
              } else if (Array.isArray(defaultAppsList) && defaultAppsList.length > 0) {
                setApps(defaultAppsList as WebApp[]);
              }
            } catch {
              if (Array.isArray(defaultAppsList) && defaultAppsList.length > 0) {
                setApps(defaultAppsList as WebApp[]);
              }
            }
          } else if (Array.isArray(defaultAppsList) && defaultAppsList.length > 0) {
            setApps(defaultAppsList as WebApp[]);
          }
        }
      }

      const savedToken = authStorage.getToken();
      if (savedToken) {
        try {
          const authRes = await api.verifyAuth();
          if (authRes.isAuthenticated) {
            setAuthState({
              isAuthenticated: true,
              token: savedToken,
              user: authRes.user
            });
          }
        } catch {
          // keep token if offline
        }
      }
    } catch (err) {
      console.error('Error loading data:', err);
    }
  };

  useEffect(() => {
    loadData();
    document.title = 'SIR AMEIR PLAYGROUND';

    // Real-time listener for Firebase Firestore
    const unsubscribe = firestoreService.subscribeToApps((realtimeApps) => {
      if (realtimeApps && Array.isArray(realtimeApps) && realtimeApps.length > 0) {
        saveAppsState(realtimeApps);
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const handleLaunchApp = (app: WebApp) => {
    api.recordClick(app.id).catch(() => {});
    if (app.url) {
      window.open(app.url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleSaveApp = async (appData: Partial<WebApp>) => {
    if (editingApp) {
      try {
        const updated = await api.updateApp(editingApp.id, appData);
        const newApps = apps.map(a => a.id === editingApp.id ? updated : a);
        saveAppsState(newApps);
      } catch {
        const updated: WebApp = {
          ...editingApp,
          ...appData as any,
          updatedAt: new Date().toISOString()
        };
        const newApps = apps.map(a => a.id === editingApp.id ? updated : a);
        saveAppsState(newApps);
      }
    } else {
      try {
        const created = await api.createApp(appData);
        const newApps = [...apps, created];
        saveAppsState(newApps);
      } catch {
        const created: WebApp = {
          id: 'app-' + Date.now(),
          title: appData.title || '',
          url: appData.url || '',
          iconType: appData.iconType || 'preset',
          iconName: appData.iconName || 'Gamepad2',
          iconColor: appData.iconColor || 'red',
          iconUrl: appData.iconUrl,
          order: apps.length + 1,
          createdAt: new Date().toISOString()
        };
        const newApps = [...apps, created];
        saveAppsState(newApps);
      }
    }
  };

  const handleDeleteApp = async (id: string) => {
    try {
      await api.deleteApp(id);
    } catch {}
    const newApps = apps.filter(a => a.id !== id);
    saveAppsState(newApps);
  };

  const handleReorderApps = async (appIds: string[]) => {
    const appMap = new Map(apps.map(a => [a.id, a]));
    const reordered: WebApp[] = [];
    appIds.forEach((id, index) => {
      const item = appMap.get(id);
      if (item) {
        item.order = index + 1;
        reordered.push(item);
        appMap.delete(id);
      }
    });
    appMap.forEach(item => reordered.push(item));
    saveAppsState(reordered);
    try {
      await api.reorderApps(appIds);
    } catch {}
  };

  const handleImportBackup = async (importedApps: WebApp[], replace: boolean = true) => {
    try {
      const finalApps = await api.importApps(importedApps, replace);
      saveAppsState(finalApps);
    } catch (e) {
      console.error('Import error:', e);
      saveAppsState(importedApps);
    }
  };

  const handleSaveSettings = async (newSettings: Partial<WebsiteSettings> & { newPassword?: string }) => {
    try {
      const updated = await api.updateSettings(newSettings);
      setSettings(prev => ({ ...prev, ...updated }));
    } catch {
      setSettings(prev => ({ ...prev, ...newSettings }));
    }
  };

  const handleLogout = async () => {
    await api.logout();
    setAuthState({ isAuthenticated: false, token: null, user: null });
    setIsAdminOpen(false);
  };

  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col selection:bg-black selection:text-white font-sans antialiased">
      
      {/* Header */}
      <Header
        onTitleClick={handleTitleClick}
        authState={authState}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenAddApp={() => {
          setEditingApp(null);
          setIsAppFormOpen(true);
        }}
      />

      {/* Hero Banner */}
      <HeroBanner
        settings={settings}
        onTitleClick={handleTitleClick}
        appsCount={apps.length}
      />

      {/* Main Apps Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6">
        <AppGrid
          apps={apps}
          onLaunchApp={handleLaunchApp}
          isAdmin={authState.isAuthenticated}
          onEditApp={(app) => {
            setEditingApp(app);
            setIsAppFormOpen(true);
          }}
          onDeleteApp={handleDeleteApp}
          onAddNewApp={() => {
            setEditingApp(null);
            setIsAppFormOpen(true);
          }}
        />
      </main>

      {/* Footer */}
      <Footer />

      {/* Offline Indicator */}
      <OfflineIndicator />

      {/* Admin Login Modal (Triggered by 5-clicks on title) */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={(user, token) => {
          setAuthState({ isAuthenticated: true, token, user });
          setIsAdminOpen(true);
        }}
      />

      {/* Admin Dashboard */}
      <AdminDashboard
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        apps={apps}
        settings={settings}
        authState={authState}
        onLogout={handleLogout}
        onOpenAddApp={() => {
          setEditingApp(null);
          setIsAppFormOpen(true);
        }}
        onOpenEditApp={(app) => {
          setEditingApp(app);
          setIsAppFormOpen(true);
        }}
        onDeleteApp={handleDeleteApp}
        onReorderApps={handleReorderApps}
        onSaveSettings={handleSaveSettings}
        onImportBackup={handleImportBackup}
      />

      {/* Add / Edit WebApp Modal */}
      <AppFormModal
        isOpen={isAppFormOpen}
        onClose={() => {
          setIsAppFormOpen(false);
          setEditingApp(null);
        }}
        onSave={handleSaveApp}
        editingApp={editingApp}
      />

    </div>
  );
}
