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
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-yellow-950 border border-yellow-500 text-xs font-bold transition shadow-sm active:scale-95"
      >
        <Download className="w-3.5 h-3.5 text-red-700" />
        <span className="hidden sm:inline">Pasang PWA</span>
      </button>

      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-sm rounded-3xl bg-white border-4 border-yellow-400 p-6 shadow-2xl text-slate-900 relative">
            <button
              onClick={() => setShowIOSGuide(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl bg-yellow-100 hover:bg-yellow-200 text-slate-700 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-red-600 flex items-center justify-center text-white shadow-md">
                <Apple className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Pasang di iPhone / iPad</h3>
                <p className="text-xs text-slate-500 font-bold">SIR AMEIR PLAYGROUND</p>
              </div>
            </div>

            <div className="space-y-3 my-4 text-xs text-slate-700 font-medium">
              <p>1. Buka di <strong>Safari</strong> dan tekan butang <strong>Share (Kongsi)</strong> ⎋.</p>
              <p>2. Pilih <strong>Add to Home Screen</strong> (Tambah ke Skrin Utama).</p>
              <p>3. Tekan <strong>Add</strong> di penjuru atas kanan.</p>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full mt-2 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition shadow-md"
            >
              Faham
            </button>
          </div>
        </div>
      )}
    </>
  );
};
