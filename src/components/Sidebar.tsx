import React from 'react';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  CalendarDays,
  BellRing,
  BadgePercent,
  FileSpreadsheet,
  ShieldCheck,
  LogOut,
  Sparkles,
  School,
  Coins,
  LogIn
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export type ActiveTab =
  | 'dashboard'
  | 'payment'
  | 'annual'
  | 'students'
  | 'rekap'
  | 'arrears'
  | 'tariffs'
  | 'reports'
  | 'audit';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isOpenMobile: boolean;
  setIsOpenMobile: (open: boolean) => void;
  onOpenLoginModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpenMobile,
  setIsOpenMobile,
  onOpenLoginModal
}) => {
  const { currentUser, db, logout } = useApp();

  // Count active students with overdue bills
  const overdueCount = React.useMemo(() => {
    const studentWithArrears = new Set<string>();
    db.bills.forEach((b) => {
      if ((b.status === 'belum_bayar' || b.status === 'belum_lunas') && b.urutanBulan <= 4) {
        studentWithArrears.add(b.studentId);
      }
    });
    return studentWithArrears.size;
  }, [db.bills]);

  const navItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'Dashboard Utama',
      icon: LayoutDashboard,
      roles: ['admin', 'petugas']
    },
    {
      id: 'payment' as ActiveTab,
      label: 'Pembayaran SPP',
      icon: CreditCard,
      roles: ['admin', 'petugas']
    },
    {
      id: 'annual' as ActiveTab,
      label: 'Uang Tahunan',
      icon: Coins,
      roles: ['admin', 'petugas']
    },
    {
      id: 'students' as ActiveTab,
      label: 'Data Siswa (12 Siswa)',
      icon: Users,
      roles: ['admin', 'petugas']
    },
    {
      id: 'rekap' as ActiveTab,
      label: 'Buku Rekap SPP',
      icon: CalendarDays,
      roles: ['admin', 'petugas']
    },
    {
      id: 'arrears' as ActiveTab,
      label: 'Pengingat Tunggakan',
      icon: BellRing,
      badge: overdueCount > 0 ? overdueCount : undefined,
      roles: ['admin', 'petugas']
    },
    {
      id: 'reports' as ActiveTab,
      label: 'Laporan Keuangan',
      icon: FileSpreadsheet,
      roles: ['admin', 'petugas']
    },
    {
      id: 'tariffs' as ActiveTab,
      label: 'Tarif & Beasiswa',
      icon: BadgePercent,
      roles: ['admin']
    },
    {
      id: 'audit' as ActiveTab,
      label: 'Jejak Audit & Backup',
      icon: ShieldCheck,
      roles: ['admin']
    }
  ];

  const roleNameMap: Record<string, string> = {
    admin: 'Kepsek / Full Akses',
    petugas: 'Bendahara / Operasional'
  };

  const roleBadgeStyle: Record<string, string> = {
    admin: 'bg-emerald-800 text-emerald-200 border-emerald-700',
    petugas: 'bg-amber-900/60 text-amber-200 border-amber-800'
  };

  const handleSelectTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    setIsOpenMobile(false);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
          onClick={() => setIsOpenMobile(false)}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col w-72 bg-emerald-950 text-emerald-50 border-r border-emerald-900/80 transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-emerald-900/80 flex items-center gap-3">
          <div className="relative w-12 h-12 rounded-xl bg-white p-1 shrink-0 shadow-md ring-2 ring-emerald-600/30">
            <img
              src={db.schoolProfile.logoUrl}
              alt="Logo SMP Alam Excellentia"
              className="w-full h-full object-contain"
              onError={(e) => {
                // fallback if image fails
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-base text-white tracking-tight leading-snug truncate">
              SMP ALAM EXCELLENTIA
            </h1>
            <p className="text-xs text-emerald-300/80 font-medium tracking-wide">
              Pamekasan, Madura
            </p>
            <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-emerald-400">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>Sistem Pembayaran SPP</span>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 py-4 px-3 overflow-y-auto space-y-1">
          <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-emerald-400/80 uppercase">
            Menu Utama
          </div>

          {navItems.map((item) => {
            const hasAccess = item.roles.includes(currentUser.role);
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            if (!hasAccess) {
              return null;
            }

            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-700 text-white shadow-sm shadow-emerald-950/40'
                    : 'text-emerald-200/90 hover:bg-emerald-900/60 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-emerald-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-rose-600 text-white shrink-0">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* User Card at bottom */}
        <div className="p-3 border-t border-emerald-900/80 bg-emerald-950/90">
          <div className="p-3 rounded-lg bg-emerald-900/50 border border-emerald-800/60">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">{currentUser.fullName}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span
                    className={`inline-block px-1.5 py-0.5 text-[10px] font-medium rounded border ${
                      roleBadgeStyle[currentUser.role]
                    }`}
                  >
                    {roleNameMap[currentUser.role] || currentUser.role}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {onOpenLoginModal && (
                  <button
                    onClick={onOpenLoginModal}
                    title="Ganti Akun / Masuk dengan Google"
                    className="p-1.5 text-emerald-400 hover:text-white hover:bg-emerald-800 rounded-md transition-colors"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={logout}
                  title="Keluar / Reset Sesi"
                  className="p-1.5 text-emerald-400 hover:text-white hover:bg-emerald-800 rounded-md transition-colors shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between px-1 text-[11px] text-emerald-400/80">
            <span className="flex items-center gap-1 truncate max-w-[140px]">
              <School className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>{db.schoolProfile.yayasan}</span>
            </span>
            <span className="font-mono text-[10px] text-emerald-300 shrink-0">T.A. 2026/2027</span>
          </div>
        </div>
      </aside>
    </>
  );
};
