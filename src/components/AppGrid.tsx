import React from 'react';
import { Plus } from 'lucide-react';
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
    if (isAdmin && onAddNewApp) {
      return (
        <div className="my-8 text-center">
          <button
            onClick={onAddNewApp}
            className="px-6 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-md transition flex items-center gap-2 mx-auto active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah WebApp</span>
          </button>
        </div>
      );
    }
    return null;
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
