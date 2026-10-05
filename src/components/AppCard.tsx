import React from 'react';
import { ExternalLink, Edit2, Trash2 } from 'lucide-react';
import { WebApp } from '../types';
import { AppIcon } from '../lib/iconHelper';

interface AppCardProps {
  app: WebApp;
  onLaunch: (app: WebApp) => void;
  isAdmin?: boolean;
  onEdit?: (app: WebApp) => void;
  onDelete?: (id: string) => void;
}

export const AppCard: React.FC<AppCardProps> = ({
  app,
  onLaunch,
  isAdmin,
  onEdit,
  onDelete
}) => {
  return (
    <div className="group relative rounded-3xl bg-white border-2 border-yellow-300 hover:border-red-500 p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col items-center text-center justify-between">
      
      {/* Admin Quick Action Buttons */}
      {isAdmin && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(app);
              }}
              className="p-1.5 rounded-lg bg-yellow-100 hover:bg-yellow-200 text-yellow-900 transition"
              title="Edit WebApp"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Adakah anda pasti mahu memadam "${app.title}"?`)) {
                  onDelete(app.id);
                }
              }}
              className="p-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 transition"
              title="Padam WebApp"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* 1. Logo WebApp */}
      <div className="my-2">
        <AppIcon
          name={app.iconName || 'Gamepad2'}
          color={app.iconColor || 'red'}
          iconType={app.iconType || 'preset'}
          iconUrl={app.iconUrl}
          size="lg"
        />
      </div>

      {/* 2. Tajuk WebApp */}
      <h3 className="text-lg font-extrabold text-slate-900 mt-3 mb-5 line-clamp-2 leading-tight">
        {app.title}
      </h3>

      {/* 3. Butang Buka WebApp (Direct Redirect) */}
      <button
        type="button"
        onClick={() => onLaunch(app)}
        className="w-full py-3 px-5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-sm shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 active:scale-95"
      >
        <span>Buka WebApp</span>
        <ExternalLink className="w-4 h-4" />
      </button>

    </div>
  );
};
