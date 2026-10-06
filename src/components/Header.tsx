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
    <header className="sticky top-0 z-40 w-full bg-white border-b border-neutral-200 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & 5-Click Secret Title */}
          <button
            type="button"
            onClick={onTitleClick}
            className="group flex items-center gap-3 text-left focus:outline-none select-none cursor-pointer"
            title="Klik 5 kali untuk akses Admin Portal"
          >
            <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <Gamepad2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-base sm:text-lg font-black tracking-tight text-black uppercase font-mono leading-none">
                SIR AMEIR
              </div>
              <div className="text-[11px] sm:text-xs font-bold tracking-widest text-neutral-500 uppercase leading-tight mt-0.5">
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
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-black font-bold text-xs border border-neutral-300 transition active:scale-95"
                >
                  <Plus className="w-4 h-4 text-black" />
                  <span className="hidden sm:inline">Tambah WebApp</span>
                </button>

                <button
                  onClick={onOpenAdmin}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-black hover:bg-neutral-800 text-white font-bold text-xs shadow-sm transition active:scale-95"
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
