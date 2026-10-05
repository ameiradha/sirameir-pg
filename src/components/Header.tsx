import React from 'react';
import { Gamepad2, Plus, ShieldCheck } from 'lucide-react';
import { AuthState } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  onTitleClick: () => void;
  authState: AuthState;
  onOpenAdmin: () => void;
  onOpenAddApp: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onTitleClick,
  authState,
  onOpenAdmin,
  onOpenAddApp
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b-4 border-red-600 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & 5-Click Secret Title */}
          <button
            type="button"
            onClick={onTitleClick}
            className="group flex items-center gap-3 text-left focus:outline-none select-none cursor-pointer"
            title="Klik 5 kali untuk akses Admin Portal"
          >
            <div className="w-11 h-11 rounded-2xl bg-yellow-400 border-2 border-yellow-500 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <Gamepad2 className="w-6 h-6 text-red-700" />
            </div>
            <div>
              <div className="text-lg sm:text-xl font-black tracking-tight text-red-600 uppercase font-mono leading-none">
                SIR AMEIR
              </div>
              <div className="text-xs sm:text-sm font-black tracking-widest text-yellow-600 uppercase leading-tight">
                PLAYGROUND
              </div>
            </div>
          </button>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2.5">
            <PWAInstallButton />

            {authState.isAuthenticated && (
              <>
                <button
                  onClick={onOpenAddApp}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-yellow-950 font-bold text-xs shadow-sm border border-yellow-500 transition active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Tambah WebApp</span>
                </button>

                <button
                  onClick={onOpenAdmin}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-sm transition active:scale-95"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Admin</span>
                </button>
              </>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
