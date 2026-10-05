import React, { useState, useEffect, useRef } from 'react';
import { WebApp, WebsiteSettings, AuthState } from './types';
import { api, authStorage } from './lib/api';
import { Header } from './components/Header';
import { HeroBanner } from './components/HeroBanner';
import { AppGrid } from './components/AppGrid';
import { AdminDashboard } from './components/Admin/AdminDashboard';
import { AppFormModal } from './components/Admin/AppFormModal';
import { LoginModal } from './components/Admin/LoginModal';
import { Footer } from './components/Footer';
import { OfflineIndicator } from './components/OfflineIndicator';

export default function App() {
  // Data States (Clean initial state - no auto-filled webapps)
  const [apps, setApps] = useState<WebApp[]>([]);
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

  // Modal States
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isAppFormOpen, setIsAppFormOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<WebApp | null>(null);

  // Auth State
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    token: null,
    user: null
  });

  // 5-Click Secret Admin Counter
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

  const loadData = async () => {
    try {
      const [settingsData, appsData] = await Promise.all([
        api.getSettings(),
        api.getApps()
      ]);
      setSettings(settingsData);
      setApps(appsData);

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
          } else {
            authStorage.clearToken();
          }
        } catch {
          authStorage.clearToken();
        }
      }
    } catch (err) {
      console.error('Error loading data:', err);
    }
  };

  useEffect(() => {
    loadData();
    document.title = 'SIR AMEIR PLAYGROUND';
  }, []);

  // Launch App -> Direct Redirect
  const handleLaunchApp = (app: WebApp) => {
    api.recordClick(app.id).catch(() => {});
    if (app.url) {
      window.open(app.url, '_blank', 'noopener,noreferrer');
    }
  };

  // Admin Mutations
  const handleSaveApp = async (appData: Partial<WebApp>) => {
    if (editingApp) {
      const updated = await api.updateApp(editingApp.id, appData);
      setApps(prev => prev.map(a => a.id === editingApp.id ? updated : a));
    } else {
      const created = await api.createApp(appData);
      setApps(prev => [...prev, created]);
    }
  };

  const handleDeleteApp = async (id: string) => {
    await api.deleteApp(id);
    setApps(prev => prev.filter(a => a.id !== id));
  };

  const handleReorderApps = async (appIds: string[]) => {
    const res = await api.reorderApps(appIds);
    if (res.success) {
      setApps(res.apps);
    }
  };

  const handleSaveSettings = async (newSettings: Partial<WebsiteSettings> & { newPassword?: string }) => {
    const updated = await api.updateSettings(newSettings);
    setSettings(prev => ({ ...prev, ...updated }));
  };

  const handleLogout = async () => {
    await api.logout();
    setAuthState({ isAuthenticated: false, token: null, user: null });
    setIsAdminOpen(false);
  };

  return (
    <div className="min-h-screen bg-amber-50/30 text-slate-900 flex flex-col selection:bg-yellow-400 selection:text-red-950 font-sans">
      
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

      {/* Admin Login Modal (Triggered after 5 clicks on title) */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={(user, token) => {
          setAuthState({ isAuthenticated: true, token, user });
          setIsAdminOpen(true);
        }}
      />

      {/* Admin Management Dashboard */}
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
