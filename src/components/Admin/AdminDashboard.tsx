import React, { useState } from 'react';
import {
  X,
  Plus,
  ArrowUp,
  ArrowDown,
  Edit2,
  Trash2,
  ExternalLink,
  ShieldCheck,
  LogOut,
  Download,
  Upload,
  Copy,
  Check,
  Gamepad2,
  CheckCircle2,
  Info,
  FileCode,
  ClipboardPaste,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { WebApp, WebsiteSettings, AuthState } from '../../types';
import { AppIcon } from '../../lib/iconHelper';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  apps: WebApp[];
  settings: WebsiteSettings;
  authState: AuthState;
  onLogout: () => void;
  onOpenAddApp: () => void;
  onOpenEditApp: (app: WebApp) => void;
  onDeleteApp: (id: string) => Promise<void>;
  onReorderApps: (appIds: string[]) => Promise<void>;
  onSaveSettings: (settings: Partial<WebsiteSettings> & { newPassword?: string }) => Promise<void>;
  onImportBackup?: (apps: WebApp[], replace?: boolean) => Promise<void>;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  isOpen,
  onClose,
  apps,
  settings,
  authState,
  onLogout,
  onOpenAddApp,
  onOpenEditApp,
  onDeleteApp,
  onReorderApps,
  onSaveSettings,
  onImportBackup
}) => {
  const [activeTab, setActiveTab] = useState<'apps' | 'json' | 'settings'>('apps');
  const [siteTagline, setSiteTagline] = useState(settings.tagline || '');
  const [newPassword, setNewPassword] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // JSON Import States
  const [jsonInput, setJsonInput] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  if (!isOpen) return null;

  const moveApp = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= apps.length) return;

    const newApps = [...apps];
    const [moved] = newApps.splice(index, 1);
    newApps.splice(targetIndex, 0, moved);

    const appIds = newApps.map(a => a.id);
    await onReorderApps(appIds);
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(apps, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `defaultApps.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setNotice('Fail defaultApps.json berjaya dimuat turun!');
    setTimeout(() => setNotice(null), 3000);
  };

  const handleCopyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(apps, null, 2));
    setCopied(true);
    setNotice('Kod JSON webapp disalin ke papan keratan (clipboard)!');
    setTimeout(() => {
      setCopied(false);
      setNotice(null);
    }, 3000);
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setJsonInput(text);
        validateJson(text);
      }
    } catch {
      alert('Sila gunakan pintasan Ctrl+V atau klik kanan untuk Paste ke dalam ruangan.');
    }
  };

  const validateJson = (text: string): WebApp[] | null => {
    if (!text.trim()) {
      setJsonError(null);
      return null;
    }
    try {
      const parsed = JSON.parse(text);
      const list = Array.isArray(parsed) ? parsed : parsed.apps;
      if (!Array.isArray(list)) {
        setJsonError('Format JSON mestilah berbentuk senarai/array [ { ... } ]');
        return null;
      }
      setJsonError(null);
      return list;
    } catch (err: any) {
      setJsonError('Ralat sintaks JSON: ' + err.message);
      return null;
    }
  };

  const handleExecuteImport = async (replaceMode: boolean) => {
    const validList = validateJson(jsonInput);
    if (!validList) {
      if (!jsonInput.trim()) {
        alert('Sila paste atau taip kod JSON terlebih dahulu.');
      }
      return;
    }

    setImporting(true);
    try {
      if (onImportBackup) {
        await onImportBackup(validList, replaceMode);
        setNotice(
          replaceMode
            ? `Berjaya menggantikan senarai dengan ${validList.length} webapp!`
            : `Berjaya menambah ${validList.length} webapp ke senarai sedia ada!`
        );
        setActiveTab('apps');
        setTimeout(() => setNotice(null), 3500);
      }
    } catch (err: any) {
      alert('Ralat semasa import: ' + err.message);
    } finally {
      setImporting(false);
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        setJsonInput(text);
        validateJson(text);
      } catch (err: any) {
        alert('Ralat membaca fail: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const handleSaveSiteSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await onSaveSettings({
        tagline: siteTagline,
        newPassword: newPassword ? newPassword.trim() : undefined
      });
      setNotice('Tetapan berjaya disimpan!');
      setNewPassword('');
      setTimeout(() => setNotice(null), 3000);
    } catch {
      alert('Ralat menyimpan tetapan.');
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-6 animate-fadeIn">
      <div className="relative flex flex-col w-full max-w-4xl h-full max-h-[92vh] rounded-2xl bg-white border border-neutral-300 shadow-2xl overflow-hidden text-neutral-900">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-black text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white text-black flex items-center justify-center font-bold shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black font-mono uppercase tracking-wider">
                ADMIN PORTAL
              </h2>
              <p className="text-[11px] text-neutral-400 font-bold">
                SIR AMEIR PLAYGROUND
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Keluar</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white transition ml-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Buttons & Action Bar */}
        <div className="flex flex-wrap items-center justify-between px-6 py-3 bg-neutral-50 border-b border-neutral-200 gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('apps')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'apps' ? 'bg-black text-white shadow-xs' : 'bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-300'
              }`}
            >
              Senarai WebApp ({apps.length})
            </button>

            <button
              onClick={() => {
                setActiveTab('json');
                if (!jsonInput.trim()) {
                  setJsonInput(JSON.stringify(apps, null, 2));
                }
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'json' ? 'bg-black text-white shadow-xs' : 'bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-300'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Paste & Import JSON</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'settings' ? 'bg-black text-white shadow-xs' : 'bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-300'
              }`}
            >
              Tetapan & Password
            </button>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                setNotice('Sedang menyegerakkan ke cloud...');
                await onReorderApps(apps.map(a => a.id));
                setNotice('Berjaya disegerakkan dengan Vercel & semua peranti!');
                setTimeout(() => setNotice(null), 3500);
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-black hover:bg-neutral-800 text-white text-xs font-bold transition shadow-xs active:scale-95 cursor-pointer"
              title="Segerak senarai aplikasi ke cloud sekarang supaya Vercel & telefon menerima kemaskini"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
              <span>Segerak Cloud</span>
            </button>

            <button
              onClick={handleCopyJSON}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white hover:bg-neutral-100 text-black border border-neutral-300 text-xs font-bold transition shadow-xs cursor-pointer"
              title="Salin JSON senarai webapp untuk Vercel"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-black" /> : <Copy className="w-3.5 h-3.5 text-neutral-700" />}
              <span>{copied ? 'Disalin!' : 'Salin JSON'}</span>
            </button>

            <button
              onClick={handleExport}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white hover:bg-neutral-100 text-black border border-neutral-300 text-xs font-bold transition shadow-xs cursor-pointer"
              title="Muat turun defaultApps.json untuk Vercel / Sandaran"
            >
              <Download className="w-3.5 h-3.5 text-black" />
              <span>Eksport JSON</span>
            </button>
          </div>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-6 bg-white">
          
          {notice && (
            <div className="mb-4 p-3 rounded-xl bg-neutral-100 border border-neutral-300 text-black text-xs font-bold flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-black shrink-0" />
              <span>{notice}</span>
            </div>
          )}

          {/* TAB 1: SENARAI WEBAPP */}
          {activeTab === 'apps' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-600 uppercase tracking-wider font-mono">
                  Koleksi WebApp ({apps.length})
                </span>

                <button
                  onClick={onOpenAddApp}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black hover:bg-neutral-800 text-white font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah WebApp Baru</span>
                </button>
              </div>

              {apps.length === 0 ? (
                <div className="py-12 text-center bg-neutral-50 rounded-xl border border-dashed border-neutral-300 p-6">
                  <Gamepad2 className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                  <p className="text-sm font-bold text-black">Belum ada webapp dalam senarai.</p>
                  <p className="text-xs text-neutral-500 mt-1">
                    Anda boleh tekan "Tambah WebApp Baru" atau guna tab <strong>"Paste & Import JSON"</strong> untuk memuat naik senarai secara pukal.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-neutral-200 bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-xs">
                  {apps.map((app, idx) => (
                    <div key={app.id} className="p-4 flex items-center justify-between gap-4 hover:bg-neutral-50 transition">
                      
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Move Controls */}
                        <div className="flex flex-col items-center gap-0.5 shrink-0">
                          <button
                            disabled={idx === 0}
                            onClick={() => moveApp(idx, 'up')}
                            className="p-1 text-neutral-400 hover:text-black disabled:opacity-20 cursor-pointer"
                            title="Gerak ke atas"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-[10px] font-mono font-bold text-neutral-600">{idx + 1}</span>
                          <button
                            disabled={idx === apps.length - 1}
                            onClick={() => moveApp(idx, 'down')}
                            className="p-1 text-neutral-400 hover:text-black disabled:opacity-20 cursor-pointer"
                            title="Gerak ke bawah"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Logo */}
                        <AppIcon
                          name={app.iconName}
                          color={app.iconColor || 'black'}
                          iconType={app.iconType}
                          iconUrl={app.iconUrl}
                          size="sm"
                        />

                        {/* Title & Link */}
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-black truncate">{app.title}</h4>
                          <p className="text-xs text-neutral-500 truncate max-w-sm font-mono">{app.url}</p>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 shrink-0">
                        <a
                          href={app.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-black border border-neutral-200 transition"
                          title="Buka Pautan WebApp"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>

                        <button
                          onClick={() => onOpenEditApp(app)}
                          className="p-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-black border border-neutral-200 transition cursor-pointer"
                          title="Edit WebApp"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => {
                            if (confirm(`Adakah anda pasti mahu memadam "${app.title}"?`)) {
                              onDeleteApp(app.id);
                            }
                          }}
                          className="p-2 rounded-lg bg-neutral-100 hover:bg-black hover:text-white text-neutral-700 border border-neutral-200 transition cursor-pointer"
                          title="Padam WebApp"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PASTE DAN IMPORT JSON */}
          {activeTab === 'json' && (
            <div className="space-y-4 max-w-3xl mx-auto">
              
              <div className="p-5 rounded-xl bg-white border border-neutral-300 shadow-xs space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-black text-black uppercase font-mono flex items-center gap-2">
                      <FileCode className="w-4 h-4 text-black" />
                      <span>Ruangan Paste & Import JSON WebApp</span>
                    </h3>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Tampal (paste) kod JSON senarai webapp anda di bawah untuk dimuat naik terus.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handlePasteFromClipboard}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-black text-xs font-bold border border-neutral-300 transition cursor-pointer"
                    >
                      <ClipboardPaste className="w-3.5 h-3.5 text-black" />
                      <span>Tampal (Paste)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setJsonInput(JSON.stringify(apps, null, 2));
                        setJsonError(null);
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-black text-xs font-bold border border-neutral-300 transition cursor-pointer"
                      title="Isikan dengan kod JSON aplikasi semasa"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Apps Semasa</span>
                    </button>

                    <label className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white hover:bg-neutral-100 text-black border border-neutral-300 text-xs font-bold transition cursor-pointer">
                      <Upload className="w-3.5 h-3.5 text-black" />
                      <span>Pilih Fail .JSON</span>
                      <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
                    </label>
                  </div>
                </div>

                {/* JSON Textarea */}
                <div className="relative">
                  <textarea
                    rows={12}
                    value={jsonInput}
                    onChange={(e) => {
                      setJsonInput(e.target.value);
                      validateJson(e.target.value);
                    }}
                    placeholder={`[\n  {\n    "id": "app-1",\n    "title": "Kalkulator Interaktif",\n    "url": "https://kalkulator.com",\n    "iconType": "preset",\n    "iconName": "Calculator",\n    "iconColor": "black"\n  }\n]`}
                    className="w-full p-4 rounded-xl bg-neutral-900 text-neutral-100 font-mono text-xs leading-relaxed border border-neutral-700 focus:outline-none focus:ring-1 focus:ring-white selection:bg-white selection:text-black"
                    spellCheck={false}
                  />
                </div>

                {/* Validation / Status Indicator */}
                {jsonError ? (
                  <div className="p-3 rounded-lg bg-neutral-100 border border-neutral-300 text-black text-xs font-bold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-black shrink-0" />
                    <span>{jsonError}</span>
                  </div>
                ) : jsonInput.trim() ? (
                  <div className="p-3 rounded-lg bg-neutral-100 border border-neutral-300 text-black text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-black shrink-0" />
                    <span>Sintaks JSON sah dan bersedia untuk diimport!</span>
                  </div>
                ) : null}

                {/* Import Buttons */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200">
                  <div className="text-xs text-neutral-500 font-medium">
                    Pilih sama ada untuk <strong>menggantikan semua</strong> senarai semasa atau <strong>menggabungkan</strong>.
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={importing || !!jsonError || !jsonInput.trim()}
                      onClick={() => handleExecuteImport(false)}
                      className="px-4 py-2.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-black font-bold text-xs border border-neutral-300 transition shadow-xs disabled:opacity-40 active:scale-95 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Import & Gabungkan (Merge)</span>
                    </button>

                    <button
                      type="button"
                      disabled={importing || !!jsonError || !jsonInput.trim()}
                      onClick={() => {
                        if (apps.length > 0) {
                          if (!confirm(`Tindakan ini akan MENGGANTIKAN SEMUA ${apps.length} webapp sedia ada dengan senarai JSON baru ini. Teruskan?`)) {
                            return;
                          }
                        }
                        handleExecuteImport(true);
                      }}
                      className="px-5 py-2.5 rounded-lg bg-black hover:bg-neutral-800 text-white font-bold text-xs transition shadow-xs disabled:opacity-40 active:scale-95 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>{importing ? 'Mengimport...' : 'Import & Gantikan Semua (Replace)'}</span>
                    </button>
                  </div>
                </div>

              </div>

              {/* Instructions Card */}
              <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-700 space-y-1.5">
                <p className="font-bold text-black uppercase tracking-wider font-mono">
                  Panduan Format JSON:
                </p>
                <ul className="list-disc list-inside space-y-1 text-neutral-600">
                  <li>Setiap entri memerlukan sekurang-kurangnya <code>"title"</code> dan <code>"url"</code>.</li>
                  <li>Untuk logo gambar: gunakan <code>"iconType": "image"</code> dan letakkan URL imej atau Data URL Base64 dalam <code>"iconUrl"</code>.</li>
                  <li>Untuk ikon pratetap: gunakan <code>"iconType": "preset"</code> dan <code>"iconName"</code> (cth: <code>"Gamepad2"</code>, <code>"Calculator"</code>, dll).</li>
                  <li>Semua data akan disegerakkan terus ke Firebase Firestore dan katalog setempat.</li>
                </ul>
              </div>

            </div>
          )}

          {/* TAB 3: TETAPAN & PASSWORD */}
          {activeTab === 'settings' && (
            <form onSubmit={handleSaveSiteSettings} className="space-y-4 max-w-lg bg-white p-6 rounded-xl border border-neutral-200 shadow-xs">
              <div>
                <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider mb-1.5">
                  Tagline Laman
                </label>
                <input
                  type="text"
                  value={siteTagline}
                  onChange={(e) => setSiteTagline(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 border border-neutral-300 text-sm font-semibold text-black focus:outline-none focus:border-black focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider mb-1.5">
                  Tukar Password Admin (Kosongkan jika kekal "admin")
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Password baru..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 border border-neutral-300 text-sm font-semibold text-black focus:outline-none focus:border-black focus:bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={savingSettings}
                className="px-6 py-2.5 rounded-xl bg-black hover:bg-neutral-800 text-white font-bold text-xs shadow-xs transition disabled:opacity-50 active:scale-95 cursor-pointer"
              >
                {savingSettings ? 'Menyimpan...' : 'Simpan Tetapan'}
              </button>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};
