import React from 'react';
import {
  Menu,
  UserCheck,
  ShieldAlert,
  Calendar,
  PlusCircle,
  RotateCcw
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import { ActiveTab } from './Sidebar';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onToggleMobileMenu: () => void;
  onOpenQuickPayment?: () => void;
  onOpenLoginModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onToggleMobileMenu,
  onOpenQuickPayment,
  onOpenLoginModal
}) => {
  const { currentUser, switchUserRole, resetDatabase } = useApp();

  const titleMap: Record<ActiveTab, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Dashboard Administrasi SPP & Uang Tahunan',
      subtitle: 'Ringkasan penerimaan, statistik kelunasan, dan status tunggakan 12 siswa'
    },
    payment: {
      title: 'Pencatatan Pembayaran SPP',
      subtitle: 'Input kas SPP bulanan, multi-bulan, cicilan, dan lampiran bukti transfer'
    },
    annual: {
      title: 'Manajemen Uang Tahunan',
      subtitle: 'Rincian ATK, KBM, Buku, Kalender (Rp 2.700.000) & Pembayaran Cicilan'
    },
    students: {
      title: 'Manajemen Data Siswa (12 Siswa Aktif)',
      subtitle: 'VII (Al-Khawarizmi), VIII (Albatenius), IX (Avicena) · T.A. 2026/2027'
    },
    rekap: {
      title: 'Buku Matriks Rekap Pembayaran',
      subtitle: 'Tabel status kelunasan SPP bulanan per kelas (Juli 2026 - Juni 2027)'
    },
    arrears: {
      title: 'Pemantauan & Pengingat Tunggakan',
      subtitle: 'Daftar siswa menunggak dan generator pesan konfirmasi WhatsApp'
    },
    tariffs: {
      title: 'Pengaturan Tarif & Beasiswa',
      subtitle: 'Tarif SPP Rp 300.000/bln, keringanan, dan T.A. 2026/2027'
    },
    reports: {
      title: 'Laporan Keuangan & Kas',
      subtitle: 'Rekapitulasi SPP & Uang Tahunan, serta ekspor format resmi'
    },
    audit: {
      title: 'Jejak Audit & Cadangan Data',
      subtitle: 'Log aktivitas pengguna, identitas Yayasan Insan Kamil & backup JSON'
    }
  };

  const currentInfo = titleMap[activeTab] || {
    title: 'Sistem Informasi SPP & Uang Tahunan',
    subtitle: 'SMP Alam Excellentia Pamekasan'
  };

  const todayStr = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    switchUserRole(e.target.value as UserRole);
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-6 py-3.5 shadow-2xs">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Left Zone: Mobile trigger & Page Titles */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onToggleMobileMenu}
            className="p-2 -ml-1 text-slate-600 hover:text-slate-900 rounded-lg md:hidden focus:outline-hidden hover:bg-slate-100"
            aria-label="Buka menu navigasi"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight truncate">
                {currentInfo.title}
              </h2>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 rounded-md">
                T.A. 2026/2027
              </span>
            </div>
            <p className="text-xs text-slate-500 truncate hidden sm:block">
              {currentInfo.subtitle}
            </p>
          </div>
        </div>

        {/* Right Zone: Role Switcher & Action controls */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 self-end md:self-auto">
          {/* Today's Date indicator */}
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-500 font-medium bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
            <span>{todayStr}</span>
          </div>

          {/* Login / Switch Account Button */}
          {onOpenLoginModal && (
            <button
              onClick={onOpenLoginModal}
              className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg flex items-center gap-1.5 transition-colors"
              title="Masuk dengan Google atau Email"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
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
              <span className="hidden sm:inline">Masuk Google / Email</span>
            </button>
          )}

          {/* Quick Role Switcher for seamless testing */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <span className="text-[11px] font-medium text-slate-600 px-1.5 hidden sm:inline flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-slate-500" />
              Peran:
            </span>
            <select
              value={currentUser.role}
              onChange={handleRoleChange}
              className="text-xs font-semibold bg-white text-slate-800 py-1 px-2 rounded-md border border-slate-300 shadow-2xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              title="Ganti peran pengguna untuk menguji izin akses"
            >
              <option value="admin">Shohibul Kahfi (Kepsek/Admin - Full Akses)</option>
              <option value="petugas">Sitti Noerjannah (Bendahara - Operasional)</option>
            </select>
          </div>

          {/* Quick action button for Payment */}
          {activeTab !== 'payment' && (
            <button
              onClick={() => {
                if (onOpenQuickPayment) {
                  onOpenQuickPayment();
                } else {
                  setActiveTab('payment');
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 rounded-lg shadow-2xs transition-colors shrink-0"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Bayar SPP</span>
            </button>
          )}

          {/* Simulation reset shortcut */}
          <button
            onClick={() => {
              if (window.confirm('Muat ulang data simulasi awal SMP Alam Excellentia T.A. 2026/2027? Seluruh data 12 siswa dan konfigurasi Yayasan Insan Kamil akan dimuat ulang.')) {
                resetDatabase();
              }
            }}
            title="Reset ke data T.A. 2026/2027 default"
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
