import React, { useState } from 'react';
import {
  LogIn,
  X,
  Mail,
  Lock,
  UserCheck,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  Building
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { login, loginWithGoogle, currentUser, db } = useApp();

  const [authMode, setAuthMode] = useState<'google' | 'email'>('google');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const handleGoogleSignIn = () => {
    setErrorMessage('');
    loginWithGoogle('kahfigalery@gmail.com', 'Shohibul Kahfi, M.Pd.');
    setSuccessMessage('Berhasil masuk dengan Akun Google (Shohibul Kahfi, M.Pd. - Administrator / Kepala Sekolah Full Akses)!');
    setTimeout(() => {
      onClose();
    }, 800);
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!emailInput.trim() || !passwordInput) {
      setErrorMessage('Email/Username dan kata sandi wajib diisi.');
      return;
    }

    const res = login(emailInput.trim(), passwordInput);
    if (!res.success) {
      setErrorMessage(res.message || 'Gagal masuk.');
      return;
    }

    setSuccessMessage('Login berhasil!');
    setTimeout(() => {
      onClose();
    }, 600);
  };

  const handleQuickLogin = (role: 'admin' | 'petugas') => {
    if (role === 'admin') {
      loginWithGoogle('kahfigalery@gmail.com', 'Shohibul Kahfi, M.Pd.');
    } else {
      login('bendahara', 'bendahara123');
    }
    setSuccessMessage('Login berhasil!');
    setTimeout(() => {
      onClose();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header with School Branding */}
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-950 to-teal-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white p-1 shrink-0 shadow-xs">
              <img
                src={db.schoolProfile.logoUrl}
                alt="Logo Sekolah"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight">Portal Masuk Pengguna</h3>
              <p className="text-[11px] text-emerald-300">SMP Alam Excellentia Pamekasan</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-xs">
          {/* Current active user status */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-slate-500 block text-[11px]">Sesi Aktif Saat Ini:</span>
              <strong className="text-slate-900 font-semibold">{currentUser.fullName}</strong>
            </div>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                currentUser.role === 'admin'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {currentUser.role === 'admin' ? 'Kepsek / Full Akses' : 'Bendahara / Operasional'}
            </span>
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Opsi 1: Google Sign-In */}
          <div className="space-y-2">
            <span className="font-bold text-slate-800 block text-xs">
              Masuk Cepat Menggunakan Akun Google:
            </span>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-800 font-semibold rounded-xl border border-slate-300 shadow-2xs flex items-center justify-center gap-3 transition-colors text-xs"
            >
              {/* Google G SVG Icon */}
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Masuk dengan Google (kahfigalery@gmail.com)</span>
            </button>
            <p className="text-[10px] text-slate-500 text-center">
              Login otomatis sebagai <strong>Shohibul Kahfi, M.Pd.</strong> (Administrator / Kepsek - Full Akses)
            </p>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="grow border-t border-slate-200"></div>
            <span className="shrink mx-3 text-slate-400 text-[10px] uppercase font-bold">atau masuk dengan kredensial</span>
            <div className="grow border-t border-slate-200"></div>
          </div>

          {/* Quick Selection Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('admin')}
              className="p-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-200 rounded-xl text-left transition-colors"
            >
              <div className="font-bold text-[11px]">Shohibul Kahfi, M.Pd.</div>
              <div className="text-[10px] text-emerald-700 font-medium">Kepala Sekolah (Full Akses)</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('petugas')}
              className="p-2.5 bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-200 rounded-xl text-left transition-colors"
            >
              <div className="font-bold text-[11px]">Sitti Noerjannah, S.Pd.</div>
              <div className="text-[10px] text-amber-700 font-medium">Bendahara (Operasional)</div>
            </button>
          </div>

          {/* Form Login Email Manual */}
          <form onSubmit={handleEmailSubmit} className="space-y-3 pt-1">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Email atau Username</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="admin@smpalamexcellentia.sch.id"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Kata Sandi</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-2xs transition-colors flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Masuk dengan Email</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
