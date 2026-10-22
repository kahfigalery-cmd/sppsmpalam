import React, { useMemo, useState } from 'react';
import {
  Users,
  Wallet,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Percent,
  Receipt,
  ArrowUpRight,
  Filter,
  CreditCard,
  FileText,
  Calendar
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ACADEMIC_MONTHS, formatNumber, formatRupiah } from '../utils/formatters';
import { Transaction } from '../types';

interface DashboardViewProps {
  onNavigateToPayment: () => void;
  onNavigateToArrears: () => void;
  onNavigateToReports: () => void;
  onShowReceipt: (trx: Transaction) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateToPayment,
  onNavigateToArrears,
  onNavigateToReports,
  onShowReceipt
}) => {
  const { db, currentUser } = useApp();

  // Filters
  const [selectedYear, setSelectedYear] = useState('ay-2026-2027');
  const [selectedMonth, setSelectedMonth] = useState('Oktober');
  const [selectedClass, setSelectedClass] = useState('all');

  // Month index for selected month (1 for Juli, 4 for Oktober, etc.)
  const selectedMonthIndex = useMemo(() => {
    const idx = ACADEMIC_MONTHS.indexOf(selectedMonth as any);
    return idx !== -1 ? idx + 1 : 4;
  }, [selectedMonth]);

  // Active students filtered by class
  const filteredStudents = useMemo(() => {
    return db.students.filter((s) => {
      const matchStatus = s.status === 'aktif';
      const matchClass = selectedClass === 'all' || s.kelasId === selectedClass;
      return matchStatus && matchClass;
    });
  }, [db.students, selectedClass]);

  const studentIds = useMemo(() => new Set(filteredStudents.map((s) => s.id)), [filteredStudents]);

  // Statistics for selected month and class
  const stats = useMemo(() => {
    const totalActiveStudents = filteredStudents.length;

    // Bills for the selected month
    const targetBills = db.bills.filter(
      (b) =>
        b.tahunAjaranId === selectedYear &&
        b.bulan === selectedMonth &&
        studentIds.has(b.studentId)
    );

    let totalBillAmount = 0;
    let totalReceivedThisMonth = 0;
    let paidCount = 0;
    let partialCount = 0;
    let unpaidCount = 0;

    targetBills.forEach((b) => {
      const netBill = b.nominalTagihan - b.nominalDiskon;
      totalBillAmount += netBill;
      totalReceivedThisMonth += b.nominalTerbayar;
      if (b.status === 'lunas') {
        paidCount++;
      } else if (b.status === 'belum_lunas') {
        partialCount++;
      } else {
        unpaidCount++;
      }
    });

    // Cumulative arrears for past months up to selected month
    let cumulativeArrears = 0;
    db.bills.forEach((b) => {
      if (
        b.tahunAjaranId === selectedYear &&
        b.urutanBulan <= selectedMonthIndex &&
        studentIds.has(b.studentId)
      ) {
        cumulativeArrears += b.sisaTagihan;
      }
    });

    const completionRate =
      totalBillAmount > 0
        ? Math.min(100, Math.round((totalReceivedThisMonth / totalBillAmount) * 100))
        : 0;

    return {
      totalActiveStudents,
      totalReceivedThisMonth,
      paidCount,
      partialCount,
      unpaidCount,
      cumulativeArrears,
      completionRate,
      totalBillAmount
    };
  }, [db.bills, selectedYear, selectedMonth, selectedMonthIndex, studentIds, filteredStudents]);

  // Monthly revenue trend (Juli to Juni)
  const monthlyTrend = useMemo(() => {
    return ACADEMIC_MONTHS.map((month, idx) => {
      const monthBills = db.bills.filter(
        (b) =>
          b.tahunAjaranId === selectedYear &&
          b.bulan === month &&
          studentIds.has(b.studentId)
      );

      const target = monthBills.reduce((acc, b) => acc + (b.nominalTagihan - b.nominalDiskon), 0);
      const received = monthBills.reduce((acc, b) => acc + b.nominalTerbayar, 0);
      const pct = target > 0 ? Math.round((received / target) * 100) : 0;

      return {
        month,
        index: idx + 1,
        target,
        received,
        pct
      };
    });
  }, [db.bills, selectedYear, studentIds]);

  // Class comparison
  const classBreakdown = useMemo(() => {
    return db.classes.map((cls) => {
      const clsStudents = db.students.filter((s) => s.status === 'aktif' && s.kelasId === cls.id);
      const ids = new Set(clsStudents.map((s) => s.id));

      const clsBills = db.bills.filter(
        (b) =>
          b.tahunAjaranId === selectedYear &&
          b.bulan === selectedMonth &&
          ids.has(b.studentId)
      );

      const lunasCount = clsBills.filter((b) => b.status === 'lunas').length;
      const totalStudents = clsStudents.length;
      const pct = totalStudents > 0 ? Math.round((lunasCount / totalStudents) * 100) : 0;

      return {
        className: cls.nama,
        total: totalStudents,
        lunas: lunasCount,
        menunggak: totalStudents - lunasCount,
        pct
      };
    });
  }, [db.classes, db.students, db.bills, selectedYear, selectedMonth]);

  // Recent transactions
  const recentTransactions = useMemo(() => {
    return db.transactions
      .filter((t) => t.status === 'berhasil')
      .slice(0, 5);
  }, [db.transactions]);

  return (
    <div className="space-y-6">
      {/* Simulation Info Card */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 rounded-xl p-5 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-emerald-700/50">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[11px] font-bold bg-amber-400 text-slate-950 rounded-sm uppercase tracking-wider">
              Data Simulasi Resmi
            </span>
            <span className="text-xs text-emerald-200">
              Sistem Informasi Keuangan SMP Alam Excellentia Pamekasan
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight">
            Selamat Datang, {currentUser.fullName}
          </h2>
          <p className="text-xs text-emerald-100/90 max-w-2xl">
            Sistem aktif mengelola tagihan SPP, pencatatan kas, buku matriks kelunasan, kuitansi digital, serta pemantauan tunggakan secara transparan dan akuntabel.
          </p>
        </div>

        {/* Quick actions in hero */}
        <div className="flex items-center gap-2 shrink-0">
          {currentUser.role !== 'kepsek' && (
            <button
              onClick={onNavigateToPayment}
              className="px-3.5 py-2 bg-white text-emerald-900 hover:bg-emerald-50 rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <CreditCard className="w-4 h-4 text-emerald-700" />
              <span>Input Pembayaran</span>
            </button>
          )}
          <button
            onClick={onNavigateToReports}
            className="px-3.5 py-2 bg-emerald-700/80 hover:bg-emerald-700 text-white border border-emerald-600/50 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <FileText className="w-4 h-4" />
            <span>Lihat Laporan</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <Filter className="w-4 h-4 text-emerald-600" />
          <span>Filter Tampilan:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Year selector */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-slate-500">Tahun Ajaran:</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg py-1.5 px-2.5 text-slate-800 focus:ring-2 focus:ring-emerald-500"
            >
              {db.academicYears.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.nama} {y.aktif ? '(Aktif)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Month selector */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-slate-500">Bulan:</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg py-1.5 px-2.5 text-slate-800 focus:ring-2 focus:ring-emerald-500"
            >
              {ACADEMIC_MONTHS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Class selector */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-slate-500">Kelas:</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg py-1.5 px-2.5 text-slate-800 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Semua Kelas (VII, VIII, IX)</option>
              {db.classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nama}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 6 Key Performance Indicators (Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* Card 1: Total Siswa */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Siswa Aktif</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {stats.totalActiveStudents}
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {selectedClass === 'all' ? 'Seluruh jenjang kelas' : 'Pada kelas terpilih'}
          </span>
        </div>

        {/* Card 2: Penerimaan Bulan Ini */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Diterima ({selectedMonth})</span>
            <Wallet className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl font-bold text-emerald-700 font-mono tabular-nums truncate">
            {formatRupiah(stats.totalReceivedThisMonth)}
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Target: {formatRupiah(stats.totalBillAmount)}
          </span>
        </div>

        {/* Card 3: Siswa Lunas Bulan Ini */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Lunas ({selectedMonth})</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-600 font-mono tabular-nums">
            {stats.paidCount}
            <span className="text-xs font-normal text-slate-500 ml-1">siswa</span>
          </p>
          <span className="text-[11px] text-emerald-700 font-medium mt-1 block">
            {stats.totalActiveStudents > 0
              ? `${Math.round((stats.paidCount / stats.totalActiveStudents) * 100)}% dari total siswa`
              : '0%'}
          </span>
        </div>

        {/* Card 4: Siswa Belum Bayar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Belum Lunas ({selectedMonth})</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-bold text-rose-600 font-mono tabular-nums">
            {stats.unpaidCount + stats.partialCount}
            <span className="text-xs font-normal text-slate-500 ml-1">siswa</span>
          </p>
          <span className="text-[11px] text-rose-600 mt-1 block">
            {stats.partialCount > 0 ? `(${stats.partialCount} cicilan sebagian)` : 'Belum ada pembayaran'}
          </span>
        </div>

        {/* Card 5: Total Tunggakan Kumulatif */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Total Tunggakan</span>
            <TrendingUp className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-xl font-bold text-amber-700 font-mono tabular-nums truncate">
            {formatRupiah(stats.cumulativeArrears)}
          </p>
          <button
            onClick={onNavigateToArrears}
            className="text-[11px] text-amber-800 font-semibold hover:underline flex items-center gap-0.5 mt-1"
          >
            <span>Lihat rincian</span>
            <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>

        {/* Card 6: Persentase Capaian */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Capaian Bulan Ini</span>
            <Percent className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {stats.completionRate}%
          </p>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-emerald-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${stats.completionRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Charts & Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Monthly Collection Bar Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Tren Penerimaan SPP per Bulan (T.A. 2025/2026)
              </h3>
              <p className="text-xs text-slate-500">
                Perbandingan uang yang telah diterima dengan target tagihan
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-emerald-600 rounded-xs"></span>
                <span>Diterima</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-slate-200 rounded-xs"></span>
                <span>Target Tagihan</span>
              </span>
            </div>
          </div>

          {/* Bar Chart Visualization */}
          <div className="pt-6">
            <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 sm:gap-3 items-end h-56 pb-2 border-b border-slate-200">
              {monthlyTrend.map((m) => {
                const maxVal = Math.max(...monthlyTrend.map((t) => t.target)) || 1;
                const receivedHeight = Math.min(100, (m.received / maxVal) * 100);
                const isCurrent = m.month === selectedMonth;

                return (
                  <div key={m.month} className="flex flex-col items-center h-full justify-end group">
                    {/* Tooltip on hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] bg-slate-900 text-white rounded px-1.5 py-0.5 absolute -translate-y-16 pointer-events-none whitespace-nowrap z-10 font-mono">
                      {m.month}: {formatRupiah(m.received)} ({m.pct}%)
                    </div>

                    <div className="w-full max-w-[28px] bg-slate-100 rounded-t-sm h-full flex items-end relative overflow-hidden">
                      <div
                        className={`w-full rounded-t-sm transition-all duration-300 ${
                          isCurrent
                            ? 'bg-emerald-600 ring-2 ring-emerald-400'
                            : m.received > 0
                            ? 'bg-emerald-500 hover:bg-emerald-600'
                            : 'bg-slate-200'
                        }`}
                        style={{ height: `${receivedHeight}%` }}
                      />
                    </div>
                    <span
                      className={`text-[10px] mt-2 font-medium truncate ${
                        isCurrent ? 'font-bold text-emerald-800' : 'text-slate-500'
                      }`}
                    >
                      {m.month.slice(0, 3)}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500 font-mono">
              <span>Semester Ganjil (Juli - Des 2025)</span>
              <span>Semester Genap (Jan - Jun 2026)</span>
            </div>
          </div>
        </div>

        {/* Right Col: Per-Class Payment Ratio */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-bold text-slate-900">
                Kelunasan per Kelas ({selectedMonth})
              </h3>
              <p className="text-xs text-slate-500">
                Persentase siswa yang telah melunasi SPP
              </p>
            </div>

            <div className="space-y-3.5">
              {classBreakdown.map((c) => (
                <div key={c.className} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{c.className}</span>
                    <span className="font-mono text-slate-600 text-[11px]">
                      {c.lunas}/{c.total} Siswa ({c.pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex">
                    <div
                      className="bg-emerald-600 h-full transition-all duration-300"
                      style={{ width: `${c.pct}%` }}
                    />
                    <div
                      className="bg-rose-400 h-full transition-all duration-300"
                      style={{ width: `${100 - c.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Keterangan:</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-[11px] text-emerald-700">
                <span className="w-2 h-2 bg-emerald-600 rounded-full"></span>
                Lunas
              </span>
              <span className="flex items-center gap-1 text-[11px] text-rose-600">
                <span className="w-2 h-2 bg-rose-400 rounded-full"></span>
                Belum Lunas
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions List & Quick Overview */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Transaksi Pembayaran Terakhir</h3>
            <p className="text-xs text-slate-500">
              5 pencatatan transaksi kas SPP terbaru yang berhasil disimpan
            </p>
          </div>
          <button
            onClick={onNavigateToPayment}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            <span>Semua Transaksi</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">No. Transaksi</th>
                <th className="py-2.5 px-4">Tanggal</th>
                <th className="py-2.5 px-4">Siswa</th>
                <th className="py-2.5 px-4">Kelas</th>
                <th className="py-2.5 px-4">Alokasi Bulan</th>
                <th className="py-2.5 px-4 text-right">Nominal</th>
                <th className="py-2.5 px-4">Metode</th>
                <th className="py-2.5 px-4">Petugas</th>
                <th className="py-2.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentTransactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-6 text-center text-slate-400">
                    Belum ada transaksi pembayaran yang dicatat.
                  </td>
                </tr>
              ) : (
                recentTransactions.map((trx) => (
                  <tr key={trx.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-slate-900">
                      {trx.noTransaksi}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{trx.tanggalBayar}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{trx.studentNama}</td>
                    <td className="py-3 px-4 text-slate-600">{trx.kelasNama}</td>
                    <td className="py-3 px-4 text-slate-700">
                      {trx.alokasiBulan.map((a) => a.bulan).join(', ')}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700 tabular-nums">
                      {formatRupiah(trx.totalBayar)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="capitalize px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium">
                        {trx.metodeBayar.replace('transfer_', 'Bank ').toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{trx.petugasNama}</td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => onShowReceipt(trx)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded text-[11px] font-semibold border border-emerald-200 transition-colors"
                      >
                        <Receipt className="w-3 h-3" />
                        <span>Kuitansi</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
