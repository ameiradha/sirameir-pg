import React, { useState } from 'react';
import { X, Lock, KeyRound, User, AlertCircle, ArrowRight } from 'lucide-react';
import { api, authStorage } from '../../lib/api';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: any, token: string) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess
}) => {
  const [username, setUsername] = useState('admin');
  const [passcode, setPasscode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.login(username, passcode);
      if (res.success) {
        authStorage.setToken(res.token);
        onLoginSuccess(res.user, res.token);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Username atau password tidak tepat.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="relative w-full max-w-md rounded-3xl bg-white border-4 border-yellow-400 shadow-2xl p-6 sm:p-8 text-slate-900">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-xl bg-yellow-100 hover:bg-yellow-200 text-slate-700 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-red-600 text-yellow-300 flex items-center justify-center mx-auto mb-3 shadow-md">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black text-red-600 font-mono uppercase">
            ADMIN PORTAL
          </h2>
          <p className="text-xs text-slate-600 font-bold mt-1">
            SIR AMEIR PLAYGROUND
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-red-100 border border-red-300 text-red-800 text-xs flex items-center gap-2 font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border-2 border-yellow-300 text-sm font-semibold text-slate-900 focus:outline-none focus:border-red-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="admin"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border-2 border-yellow-300 text-sm font-semibold text-slate-900 focus:outline-none focus:border-red-600"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-sm shadow-md transition flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
          >
            {loading ? <span>Mengesahkan...</span> : (
              <>
                <span>Log Masuk Pentadbir</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
};
