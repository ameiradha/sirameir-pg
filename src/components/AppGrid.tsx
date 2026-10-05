import React from 'react';
import { Plus, Gamepad2 } from 'lucide-react';
import { WebApp } from '../types';
import { AppCard } from './AppCard';

interface AppGridProps {
  apps: WebApp[];
  onLaunchApp: (app: WebApp) => void;
  isAdmin?: boolean;
  onEditApp?: (app: WebApp) => void;
  onDeleteApp?: (id: string) => void;
  onAddNewApp?: () => void;
}

export const AppGrid: React.FC<AppGridProps> = ({
  apps,
  onLaunchApp,
  isAdmin,
  onEditApp,
  onDeleteApp,
  onAddNewApp
}) => {
  if (apps.length === 0) {
    return (
      <div className="my-8 py-16 text-center rounded-3xl bg-white border-2 border-dashed border-yellow-300 p-8 shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-yellow-100 text-red-600 flex items-center justify-center mx-auto mb-4 border border-yellow-300">
          <Gamepad2 className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">Belum Ada WebApp</h3>
        <p className="text-sm text-slate-600 max-w-md mx-auto mb-6">
          Koleksi webapp masih kosong. Tekan nama tajuk <strong>SIR AMEIR PLAYGROUND</strong> 5 kali untuk membuka portal pentadbir dan menambah webapp anda.
        </p>

        {isAdmin && onAddNewApp && (
          <button
            onClick={onAddNewApp}
            className="px-6 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-md transition flex items-center gap-2 mx-auto active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah WebApp Pertama</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="my-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {apps.map((app) => (
          <AppCard
            key={app.id}
            app={app}
            onLaunch={onLaunchApp}
            isAdmin={isAdmin}
            onEdit={onEditApp}
            onDelete={onDeleteApp}
          />
        ))}
      </div>
    </div>
  );
};
