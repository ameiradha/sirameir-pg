import React, { useState } from 'react';
import { Download, X, Apple } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      await install();
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  if (!isInstallable && !isIOS) {
    return null;
  }

  return (
    <>
      <button
        onClick={handleInstallClick}
        title="Pasang aplikasi ke telefon / desktop anda"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-black border border-neutral-300 text-xs font-bold transition shadow-xs active:scale-95 cursor-pointer"
      >
        <Download className="w-3.5 h-3.5 text-black" />
        <span className="hidden sm:inline">Pasang PWA</span>
      </button>

      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-sm rounded-2xl bg-white border border-neutral-300 p-6 shadow-2xl text-neutral-900 relative">
            <button
              onClick={() => setShowIOSGuide(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center text-white shadow-xs">
                <Apple className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-black">Pasang di iPhone / iPad</h3>
                <p className="text-xs text-neutral-500 font-bold">SIR AMEIR PLAYGROUND</p>
              </div>
            </div>

            <div className="space-y-3 my-4 text-xs text-neutral-700 font-medium">
              <p>1. Buka di <strong>Safari</strong> dan tekan butang <strong>Share (Kongsi)</strong> ⎋.</p>
              <p>2. Pilih <strong>Add to Home Screen</strong> (Tambah ke Skrin Utama).</p>
              <p>3. Tekan <strong>Add</strong> di penjuru atas kanan.</p>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full mt-2 py-2.5 rounded-xl bg-black hover:bg-neutral-800 text-white font-bold text-xs transition shadow-xs cursor-pointer"
            >
              Faham
            </button>
          </div>
        </div>
      )}
    </>
  );
};
