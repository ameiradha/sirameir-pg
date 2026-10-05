import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <aside aria-label="Status Sambungan Rangkaian" className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-red-600 text-white px-3.5 py-2 text-xs font-bold shadow-lg border-2 border-yellow-400 animate-pulse">
      <WifiOff className="w-4 h-4 text-yellow-300 shrink-0" />
      <span>Mod Luar Talian — Data dicache.</span>
    </aside>
  );
};
