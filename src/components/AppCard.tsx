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
    <div className="group relative rounded-2xl bg-white border border-neutral-200 hover:border-black p-6 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col items-center text-center justify-between">
      
      {/* Admin Quick Action Buttons */}
      {isAdmin && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(app);
              }}
              className="p-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-black border border-neutral-200 transition"
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
              className="p-1.5 rounded-lg bg-neutral-100 hover:bg-black hover:text-white text-neutral-700 border border-neutral-200 transition"
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
          color={app.iconColor || 'black'}
          iconType={app.iconType || 'preset'}
          iconUrl={app.iconUrl}
          size="lg"
        />
      </div>

      {/* 2. Tajuk WebApp */}
      <h3 className="text-base sm:text-lg font-bold text-black mt-3 mb-5 line-clamp-2 leading-tight">
        {app.title}
      </h3>

      {/* 3. Butang Buka WebApp */}
      <button
        type="button"
        onClick={() => onLaunch(app)}
        className="w-full py-2.5 px-4 rounded-xl bg-black hover:bg-neutral-800 text-white font-bold text-sm shadow-xs hover:shadow transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
      >
        <span>Buka WebApp</span>
        <ExternalLink className="w-4 h-4" />
      </button>

    </div>
  );
};
