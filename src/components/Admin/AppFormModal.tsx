import React, { useState, useEffect } from 'react';
import { X, Globe, Type, Palette, Upload, Check, AlertCircle } from 'lucide-react';
import { WebApp } from '../../types';
import { AVAILABLE_ICONS, COLOR_VARIANTS, AppIcon } from '../../lib/iconHelper';

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
  const [iconColor, setIconColor] = useState('black');
  const [iconUrl, setIconUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingApp) {
      setTitle(editingApp.title || '');
      setUrl(editingApp.url || '');
      setIconType(editingApp.iconType || 'preset');
      setIconName(editingApp.iconName || 'Gamepad2');
      setIconColor(editingApp.iconColor || 'black');
      setIconUrl(editingApp.iconUrl || '');
    } else {
      setTitle('');
      setUrl('');
      setIconType('preset');
      setIconName('Gamepad2');
      setIconColor('black');
      setIconUrl('');
    }
    setError(null);
  }, [editingApp, isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError('Saiz fail terlalu besar (maksimum 2MB).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setIconUrl(reader.result as string);
      setIconType('image');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) {
      setError('Tajuk dan URL adalah wajib diisi.');
      return;
    }

    setLoading(true);
    setError(null);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl bg-white border border-neutral-300 shadow-2xl p-6 sm:p-8 text-neutral-900 my-8">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <h2 className="text-xl font-black text-black font-mono uppercase">
            {editingApp ? 'Kemaskini WebApp' : 'Tambah WebApp Baru'}
          </h2>
          <p className="text-xs text-neutral-500 font-bold mt-0.5">
            Tetapkan tajuk, pautan URL & logo webapp anda
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-neutral-100 border border-neutral-300 text-black text-xs flex items-center gap-2 font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0 text-black" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Tajuk WebApp */}
          <div>
            <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider mb-1.5">
              Tajuk WebApp <span className="text-black">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Roda Impian PdP"
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 border border-neutral-300 text-sm font-semibold text-black focus:outline-none focus:border-black focus:bg-white"
            />
          </div>

          {/* URL WebApp */}
          <div>
            <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider mb-1.5">
              Pautan URL WebApp <span className="text-black">*</span>
            </label>
            <div className="relative">
              <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://contoh-webapp.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-neutral-50 border border-neutral-300 text-sm font-semibold text-black focus:outline-none focus:border-black focus:bg-white"
              />
            </div>
          </div>

          {/* Logo & Ikon */}
          <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-black font-mono flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-black" />
                <span>Pilihan Logo / Ikon</span>
              </label>

              <div className="flex items-center gap-1.5 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setIconType('preset')}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                    iconType === 'preset' ? 'bg-black text-white' : 'bg-white text-neutral-700 border border-neutral-300'
                  }`}
                >
                  Ikon
                </button>
                <button
                  type="button"
                  onClick={() => setIconType('image')}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                    iconType === 'image' ? 'bg-black text-white' : 'bg-white text-neutral-700 border border-neutral-300'
                  }`}
                >
                  Gambar Custom
                </button>
              </div>
            </div>

            {iconType === 'preset' ? (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 bg-white rounded-xl border border-neutral-200">
                  {AVAILABLE_ICONS.map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setIconName(name)}
                      className={`p-2 rounded-lg border transition cursor-pointer ${
                        iconName === name ? 'bg-black text-white border-black' : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                      }`}
                    >
                      <AppIcon name={name} size="sm" color={iconName === name ? 'black' : 'neutral'} />
                    </button>
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
                    className="text-xs text-neutral-700 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-black file:text-white hover:file:bg-neutral-800 cursor-pointer"
                  />
                  {iconUrl && (
                    <div className="w-14 h-14 rounded-xl bg-white border border-neutral-300 overflow-hidden shadow-xs shrink-0 p-0 flex items-center justify-center">
                      <img src={iconUrl} alt="Preview" className="w-full h-full object-cover block" />
                    </div>
                  )}
                </div>
                <input
                  type="url"
                  value={iconUrl}
                  onChange={(e) => setIconUrl(e.target.value)}
                  placeholder="Atau masukkan pautan URL imej (https://...)"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-neutral-300 text-xs text-black focus:outline-none focus:border-black"
                />
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-black hover:bg-neutral-800 text-white font-bold text-sm shadow-sm transition flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer mt-4"
          >
            <Check className="w-4 h-4" />
            <span>{loading ? 'Menyimpan...' : editingApp ? 'Kemaskini WebApp' : 'Simpan WebApp'}</span>
          </button>
        </form>

      </div>
    </div>
  );
};
