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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="relative w-full max-w-md rounded-2xl bg-white border border-neutral-300 shadow-2xl p-6 sm:p-8 text-black">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-black text-white flex items-center justify-center mx-auto mb-3 shadow-sm">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black text-black font-mono uppercase tracking-tight">
            ADMIN PORTAL
          </h2>
          <p className="text-xs text-neutral-500 font-bold mt-1">
            SIR AMEIR PLAYGROUND
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-neutral-100 border border-neutral-300 text-black text-xs flex items-center gap-2 font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0 text-black" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider mb-1.5">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-neutral-50 border border-neutral-300 text-sm font-semibold text-black focus:outline-none focus:border-black focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="password"
                required
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="admin"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-neutral-50 border border-neutral-300 text-sm font-semibold text-black focus:outline-none focus:border-black focus:bg-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-xl bg-black hover:bg-neutral-800 text-white font-bold text-sm shadow-sm transition flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
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
