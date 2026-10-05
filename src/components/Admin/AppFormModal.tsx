import React, { useState, useEffect } from 'react';
import {
  X,
  Upload,
  Link,
  Palette,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { WebApp } from '../../types';
import { AppIcon, AVAILABLE_ICONS } from '../../lib/iconHelper';

interface AppFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (appData: Partial<WebApp>) => Promise<void>;
  editingApp: WebApp | null;
}

export const AppFormModal: React.FC<AppFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingApp
}) => {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [iconType, setIconType] = useState<'preset' | 'image' | 'emoji'>('preset');
  const [iconName, setIconName] = useState('Gamepad2');
  const [iconColor, setIconColor] = useState('red');
  const [iconUrl, setIconUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingApp) {
      setTitle(editingApp.title || '');
      setUrl(editingApp.url || '');
      setIconType(editingApp.iconType || 'preset');
      setIconName(editingApp.iconName || 'Gamepad2');
      setIconColor(editingApp.iconColor || 'red');
      setIconUrl(editingApp.iconUrl || '');
    } else {
      setTitle('');
      setUrl('https://');
      setIconType('preset');
      setIconName('Gamepad2');
      setIconColor('red');
      setIconUrl('');
    }
  }, [editingApp, isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setIconUrl(base64);
      setIconType('image');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) {
      setError('Tajuk WebApp dan URL adalah medan wajib.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await onSave({
        title: title.trim(),
        url: url.trim(),
        iconType,
        iconName,
        iconColor,
        iconUrl
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan maklumat WebApp.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl bg-white border-4 border-yellow-400 shadow-2xl p-6 sm:p-8 text-slate-900 my-8">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-xl bg-yellow-100 hover:bg-yellow-200 text-slate-700 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <h2 className="text-xl font-black text-red-600 font-mono uppercase">
            {editingApp ? 'Kemaskini WebApp' : 'Tambah WebApp Baru'}
          </h2>
          <p className="text-xs text-slate-600 font-bold">
            Tetapkan tajuk, pautan URL & logo webapp anda
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-red-100 border border-red-300 text-red-800 text-xs flex items-center gap-2 font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Tajuk WebApp */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
              Tajuk WebApp <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Roda Impian PdP"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border-2 border-yellow-300 text-sm font-semibold text-slate-900 focus:outline-none focus:border-red-600"
            />
          </div>

          {/* URL WebApp */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
              Link URL WebApp (Redirect Link) <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <Link className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://contoh-webapp.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border-2 border-yellow-300 text-sm font-semibold text-slate-900 focus:outline-none focus:border-red-600"
              />
            </div>
          </div>

          {/* Logo & Ikon */}
          <div className="p-4 rounded-2xl bg-amber-50 border-2 border-yellow-300 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-900 font-mono flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-red-600" />
                <span>Pilihan Logo / Ikon</span>
              </label>

              <div className="flex items-center gap-1.5 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setIconType('preset')}
                  className={`px-3 py-1 rounded-lg transition ${
                    iconType === 'preset' ? 'bg-red-600 text-white' : 'bg-white text-slate-700 border border-yellow-300'
                  }`}
                >
                  Ikon
                </button>
                <button
                  type="button"
                  onClick={() => setIconType('image')}
                  className={`px-3 py-1 rounded-lg transition ${
                    iconType === 'image' ? 'bg-red-600 text-white' : 'bg-white text-slate-700 border border-yellow-300'
                  }`}
                >
                  Muat Naik Logo
                </button>
              </div>
            </div>

            {iconType === 'preset' ? (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 bg-white rounded-xl border border-yellow-200">
                  {AVAILABLE_ICONS.map((iName) => (
                    <button
                      key={iName}
                      type="button"
                      onClick={() => setIconName(iName)}
                      className={`p-2 rounded-xl flex items-center justify-center transition ${
                        iconName === iName
                          ? 'bg-red-600 text-white ring-2 ring-yellow-400'
                          : 'bg-yellow-50 text-slate-700 hover:bg-yellow-100'
                      }`}
                    >
                      <AppIcon name={iName} color={iconColor} size="sm" />
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">Warna Ikon:</span>
                  {(['red', 'yellow', 'amber', 'rose'] as const).map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setIconColor(col)}
                      className={`w-6 h-6 rounded-full border-2 transition ${
                        iconColor === col ? 'border-slate-900 scale-110' : 'border-transparent'
                      } ${
                        col === 'red' ? 'bg-red-600' :
                        col === 'yellow' ? 'bg-yellow-400' :
                        col === 'amber' ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="text-xs text-slate-700 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-red-600 file:text-white hover:file:bg-red-700 cursor-pointer"
                  />
                  {iconUrl && (
                    <div className="w-14 h-14 rounded-2xl bg-white border-2 border-yellow-400 overflow-hidden shadow-sm shrink-0 p-0 flex items-center justify-center">
                      <img src={iconUrl} alt="Preview" className="w-full h-full object-cover block" />
                    </div>
                  )}
                </div>
                <input
                  type="url"
                  value={iconUrl}
                  onChange={(e) => setIconUrl(e.target.value)}
                  placeholder="Atau masukkan URL imej logo (https://...)"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-yellow-300 text-xs text-slate-900"
                />
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs shadow-md transition disabled:opacity-50 active:scale-95"
            >
              {loading ? 'Menyimpan...' : editingApp ? 'Simpan Perubahan' : 'Tambah WebApp'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
