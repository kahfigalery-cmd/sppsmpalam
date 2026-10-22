import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Printer,
  Download,
  Calendar,
  Filter,
  Users,
  CheckCircle2,
  AlertTriangle,
  History,
  Award,
  RotateCcw,
  BookOpen
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ACADEMIC_MONTHS, formatDateIndo, formatRupiah } from '../utils/formatters';

export type ReportType =
  | 'harian'
  | 'bulanan'
  | 'tahunan'
  | 'kelas'
  | 'tunggakan'
  | 'status_siswa'
  | 'siswa_individual'
  | 'beasiswa'
  | 'koreksi_pembatalan';

export const ReportsView: React.FC = () => {
  const { db, currentUser } = useApp();

  const [activeReport, setActiveReport] = useState<ReportType>('bulanan');
  const [filterMonth, setFilterMonth] = useState('Oktober');
  const [filterYear, setFilterYear] = useState('ay-2026-2027');
  const [filterClass, setFilterClass] = useState('all');
  const [filterStartDate, setFilterStartDate] = useState('2026-07-01');
  const [filterEndDate, setFilterEndDate] = useState('2027-06-30');
  const [selectedStudentId, setSelectedStudentId] = useState(db.students[0]?.id || '');

  // 1. Laporan Harian: Transaksi berdasarkan rentang tanggal
  const dailyReportData = useMemo(() => {
    return db.transactions.filter((t) => {
      const matchDate = t.tanggalBayar >= filterStartDate && t.tanggalBayar <= filterEndDate;
      const matchStatus = t.status !== 'dibatalkan';
      return matchDate && matchStatus;
    });
  }, [db.transactions, filterStartDate, filterEndDate]);

  // 2. Laporan Bulanan: Transaksi atau tagihan terbayar pada bulan tertentu
  const monthlyReportData = useMemo(() => {
    const monthBills = db.bills.filter((b) => {
      const matchMonth = b.bulan === filterMonth;
      const matchYear = b.tahunAjaranId === filterYear;
      return matchMonth && matchYear;
    });

    const studentMap = new Map(db.students.map((s) => [s.id, s]));

    return monthBills
      .filter((b) => filterClass === 'all' || studentMap.get(b.studentId)?.kelasId === filterClass)
      .map((b) => ({
        bill: b,
        student: studentMap.get(b.studentId)!
      }));
  }, [db.bills, db.students, filterMonth, filterYear, filterClass]);

  // 3. Laporan Tahunan: Agregat 12 bulan
  const annualReportData = useMemo(() => {
    return ACADEMIC_MONTHS.map((month) => {
      const mBills = db.bills.filter((b) => b.tahunAjaranId === filterYear && b.bulan === month);
      const totalBilled = mBills.reduce((acc, b) => acc + (b.nominalTagihan - b.nominalDiskon), 0);
      const totalCollected = mBills.reduce((acc, b) => acc + b.nominalTerbayar, 0);
      const totalArrears = mBills.reduce((acc, b) => acc + b.sisaTagihan, 0);
      const paidStudents = mBills.filter((b) => b.status === 'lunas').length;
      return {
        month,
        totalBilled,
        totalCollected,
        totalArrears,
        paidStudents,
        totalStudents: mBills.length,
        pct: totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0
      };
    });
  }, [db.bills, filterYear]);

  // 4. Laporan Pembayaran per Kelas
  const classReportData = useMemo(() => {
    return db.classes.map((cls) => {
      const clsStudents = db.students.filter((s) => s.kelasId === cls.id && s.status === 'aktif');
      const clsStudentIds = new Set(clsStudents.map((s) => s.id));

      const clsBills = db.bills.filter(
        (b) =>
          b.tahunAjaranId === filterYear &&
          b.bulan === filterMonth &&
          clsStudentIds.has(b.studentId)
      );

      const target = clsBills.reduce((acc, b) => acc + (b.nominalTagihan - b.nominalDiskon), 0);
      const collected = clsBills.reduce((acc, b) => acc + b.nominalTerbayar, 0);
      const arrears = clsBills.reduce((acc, b) => acc + b.sisaTagihan, 0);
      const lunasCount = clsBills.filter((b) => b.status === 'lunas').length;

      return {
        className: cls.nama,
        studentCount: clsStudents.length,
        target,
        collected,
        arrears,
        lunasCount,
        pct: target > 0 ? Math.round((collected / target) * 100) : 0
      };
    });
  }, [db.classes, db.students, db.bills, filterYear, filterMonth]);

  // 5. Laporan Tunggakan Siswa
  const arrearsReportData = useMemo(() => {
    const list: {
      student: (typeof db.students)[0];
      months: string[];
      totalTunggakan: number;
    }[] = [];

    db.students.forEach((s) => {
      if (s.status !== 'aktif') return;
      if (filterClass !== 'all' && s.kelasId !== filterClass) return;

      const unpaids = db.bills.filter(
        (b) =>
          b.studentId === s.id &&
          b.urutanBulan <= 4 &&
          (b.status === 'belum_bayar' || b.status === 'belum_lunas')
      );

      if (unpaids.length > 0) {
        list.push({
          student: s,
          months: unpaids.map((b) => b.bulan),
          totalTunggakan: unpaids.reduce((sum, b) => sum + b.sisaTagihan, 0)
        });
      }
    });

    return list.sort((a, b) => b.totalTunggakan - a.totalTunggakan);
  }, [db.students, db.bills, filterClass]);

  // 8. Laporan Keringanan & Beasiswa
  const scholarshipReportData = useMemo(() => {
    return db.discounts.map((d) => {
      const student = db.students.find((s) => s.id === d.studentId);
      const cls = db.classes.find((c) => c.id === student?.kelasId)?.nama || '-';
      return {
        ...d,
        studentNama: student?.nama || d.studentNama || '-',
        nis: student?.nis || '-',
        kelas: cls
      };
    });
  }, [db.discounts, db.students, db.classes]);

  // 9. Laporan Koreksi dan Pembatalan
  const correctionReportData = useMemo(() => {
    return db.transactions.filter(
      (t) => (t.status === 'dibatalkan' || t.status === 'dikoreksi')
    );
  }, [db.transactions]);

  // Export current report to CSV
  const handleExportCSV = () => {
    let filename = `laporan_${activeReport}_smp_alam_${new Date().toISOString().slice(0, 10)}.csv`;
    let headers: string[] = [];
    let rows: (string | number)[][] = [];

    if (activeReport === 'harian') {
      headers = ['No Transaksi', 'Tanggal', 'NIS', 'Nama Siswa', 'Kelas', 'Nominal Bayar', 'Metode', 'Petugas'];
      rows = dailyReportData.map((t) => [
        `"${t.noTransaksi}"`,
        t.tanggalBayar,
        `"${t.nis}"`,
        `"${t.studentNama}"`,
        `"${t.kelasNama}"`,
        t.totalBayar,
        t.metodeBayar,
        `"${t.petugasNama}"`
      ]);
    } else if (activeReport === 'bulanan') {
      headers = ['NIS', 'Nama Siswa', 'Kelas', 'Bulan', 'Tagihan', 'Diskon', 'Terbayar', 'Sisa', 'Status'];
      rows = monthlyReportData.map(({ bill, student }) => [
        `"${student.nis}"`,
        `"${student.nama}"`,
        `"${db.classes.find((c) => c.id === student.kelasId)?.nama || '-'}"`,
        bill.bulan,
        bill.nominalTagihan,
        bill.nominalDiskon,
        bill.nominalTerbayar,
        bill.sisaTagihan,
        bill.status
      ]);
    } else if (activeReport === 'tahunan') {
      headers = ['Bulan', 'Target Tagihan', 'Total Diterima', 'Total Tunggakan', 'Siswa Lunas', 'Persentase'];
      rows = annualReportData.map((r) => [
        r.month,
        r.totalBilled,
        r.totalCollected,
        r.totalArrears,
        `${r.paidStudents}/${r.totalStudents}`,
        `${r.pct}%`
      ]);
    } else if (activeReport === 'tunggakan') {
      headers = ['NIS', 'Nama Siswa', 'Kelas', 'Wali Murid', 'No HP', 'Jml Bulan', 'Bulan Menunggak', 'Total Tunggakan'];
      rows = arrearsReportData.map((a) => [
        `"${a.student.nis}"`,
        `"${a.student.nama}"`,
        `"${db.classes.find((c) => c.id === a.student.kelasId)?.nama || '-'}"`,
        `"${a.student.namaWali}"`,
        `"${a.student.noHpWali}"`,
        a.months.length,
        `"${a.months.join(', ')}"`,
        a.totalTunggakan
      ]);
    } else {
      headers = ['Informasi'];
      rows = [['Laporan diekspor secara digital.']];
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintReport = () => {
    window.print();
  };

  const getClassName = (kelasId: string) => {
    return db.classes.find((c) => c.id === kelasId)?.nama || '-';
  };

  return (
    <div className="space-y-6">
      {/* Report Selection Tabs (Hidden in Print) */}
      <div className="no-print bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            Pilih Jenis Laporan Keuangan SPP
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-emerald-700" />
              <span>Ekspor CSV</span>
            </button>
            <button
              onClick={handlePrintReport}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Laporan</span>
            </button>
          </div>
        </div>

        {/* 9 Report Tab Buttons */}
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'harian' as ReportType, label: '1. Kas Harian' },
            { id: 'bulanan' as ReportType, label: '2. Penerimaan Bulanan' },
            { id: 'tahunan' as ReportType, label: '3. Rekap Tahunan' },
            { id: 'kelas' as ReportType, label: '4. Rekap per Kelas' },
            { id: 'tunggakan' as ReportType, label: '5. Daftar Tunggakan' },
            { id: 'status_siswa' as ReportType, label: '6. Kelunasan Siswa' },
            { id: 'siswa_individual' as ReportType, label: '7. Riwayat per Siswa' },
            { id: 'beasiswa' as ReportType, label: '8. Beasiswa / Keringanan' },
            { id: 'koreksi_pembatalan' as ReportType, label: '9. Koreksi & Pembatalan' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveReport(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeReport === tab.id
                  ? 'bg-emerald-800 text-white font-semibold shadow-2xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Bar (Hidden in Print) */}
      <div className="no-print bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-600 font-semibold">
          <Filter className="w-4 h-4 text-emerald-600" />
          <span>Filter Laporan Terpilih:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {(activeReport === 'bulanan' || activeReport === 'kelas' || activeReport === 'status_siswa') && (
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">Bulan:</span>
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="py-1 px-2 bg-slate-50 border border-slate-300 rounded font-medium"
              >
                {ACADEMIC_MONTHS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          )}

          {(activeReport === 'bulanan' || activeReport === 'tahunan' || activeReport === 'kelas') && (
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">Tahun Ajaran:</span>
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="py-1 px-2 bg-slate-50 border border-slate-300 rounded font-medium"
              >
                {db.academicYears.map((y) => (
                  <option key={y.id} value={y.id}>
                    {y.nama}
                  </option>
                ))}
              </select>
            </div>
          )}

          {(activeReport === 'bulanan' || activeReport === 'tunggakan' || activeReport === 'status_siswa') && (
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">Kelas:</span>
              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="py-1 px-2 bg-slate-50 border border-slate-300 rounded font-medium"
              >
                <option value="all">Semua Kelas</option>
                {db.classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nama}
                  </option>
                ))}
              </select>
            </div>
          )}

          {activeReport === 'harian' && (
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Rentang Tanggal:</span>
              <input
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                className="py-1 px-2 bg-slate-50 border border-slate-300 rounded font-mono"
              />
              <span>s/d</span>
              <input
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                className="py-1 px-2 bg-slate-50 border border-slate-300 rounded font-mono"
              />
            </div>
          )}

          {activeReport === 'siswa_individual' && (
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">Pilih Siswa:</span>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="py-1 px-2 bg-slate-50 border border-slate-300 rounded font-medium"
              >
                {db.students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nis} - {s.nama} ({getClassName(s.kelasId)})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* PRINTABLE REPORT DOCUMENT CONTAINER */}
      <div className="print-container bg-white p-6 rounded-xl border border-slate-200 shadow-2xs">
        {/* Kop Surat Sekolah Resmi */}
        <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4 mb-4 gap-4">
          <div className="w-16 h-16 shrink-0">
            <img
              src={db.schoolProfile.logoUrl}
              alt="Logo SMP Alam Excellentia"
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div className="text-center flex-1">
            <p className="text-[11px] uppercase tracking-widest font-bold text-slate-600">
              {db.schoolProfile.yayasan}
            </p>
            <h1 className="text-lg sm:text-xl font-black text-emerald-950 uppercase tracking-tight">
              {db.schoolProfile.nama}
            </h1>
            <p className="text-xs text-slate-600 font-medium">
              NPSN: {db.schoolProfile.npsn} · {db.schoolProfile.alamat}
            </p>
            <p className="text-[10px] text-slate-500 font-mono">
              Telp: {db.schoolProfile.telepon} · Email: {db.schoolProfile.email}
            </p>
          </div>
          <div className="w-16 hidden sm:block shrink-0" />
        </div>

        {/* Report Heading */}
        <div className="text-center mb-6">
          <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-slate-900 inline-block border-b border-slate-400 pb-0.5">
            {activeReport === 'harian' && `Laporan Pembayaran Kas Harian SPP`}
            {activeReport === 'bulanan' && `Laporan Penerimaan SPP Bulan ${filterMonth} (T.A. 2025/2026)`}
            {activeReport === 'tahunan' && `Laporan Rekapitulasi Penerimaan Tahunan (T.A. 2025/2026)`}
            {activeReport === 'kelas' && `Laporan Pembayaran SPP per Rombel Kelas (${filterMonth})`}
            {activeReport === 'tunggakan' && `Laporan Daftar Siswa Menunggak SPP`}
            {activeReport === 'status_siswa' && `Laporan Status Kelunasan Siswa Bulan ${filterMonth}`}
            {activeReport === 'siswa_individual' && `Laporan Rekening & Riwayat Transaksi Siswa`}
            {activeReport === 'beasiswa' && `Laporan Keringanan, Subsidi & Beasiswa Siswa`}
            {activeReport === 'koreksi_pembatalan' && `Laporan Audit Koreksi dan Pembatalan Transaksi`}
          </h2>
          <p className="text-[11px] text-slate-500 mt-1">
            Dicetak pada: {formatDateIndo(new Date().toISOString().split('T')[0])} · Petugas: {currentUser.fullName} ({currentUser.role.toUpperCase()})
          </p>
        </div>

        {/* 1. Laporan Harian */}
        {activeReport === 'harian' && (
          <div className="space-y-4">
            <table className="w-full text-xs text-left border border-slate-200">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3 font-mono">No. TRX</th>
                  <th className="py-2 px-3">Tanggal</th>
                  <th className="py-2 px-3">NIS</th>
                  <th className="py-2 px-3">Nama Siswa</th>
                  <th className="py-2 px-3">Kelas</th>
                  <th className="py-2 px-3">Alokasi Bulan</th>
                  <th className="py-2 px-3 text-right">Nominal Bayar</th>
                  <th className="py-2 px-3">Metode</th>
                  <th className="py-2 px-3">Kasir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dailyReportData.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-6 text-center text-slate-400">
                      Tidak ada transaksi pada rentang tanggal tersebut.
                    </td>
                  </tr>
                ) : (
                  dailyReportData.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-mono font-medium">{t.noTransaksi}</td>
                      <td className="py-2 px-3">{t.tanggalBayar}</td>
                      <td className="py-2 px-3 font-mono">{t.nis}</td>
                      <td className="py-2 px-3 font-semibold text-slate-900">{t.studentNama}</td>
                      <td className="py-2 px-3">{t.kelasNama}</td>
                      <td className="py-2 px-3">{t.alokasiBulan.map((a) => a.bulan).join(', ')}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-emerald-800 tabular-nums">
                        {formatRupiah(t.totalBayar)}
                      </td>
                      <td className="py-2 px-3 uppercase text-[10px]">{t.metodeBayar.replace('transfer_', '')}</td>
                      <td className="py-2 px-3 text-slate-600">{t.petugasNama}</td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 font-bold border-t-2 border-slate-300">
                  <td colSpan={6} className="py-2 px-3 text-right">Total Uang Diterima:</td>
                  <td className="py-2 px-3 text-right font-mono tabular-nums text-emerald-900 text-sm">
                    {formatRupiah(dailyReportData.reduce((acc, t) => acc + t.totalBayar, 0))}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* 2. Laporan Bulanan */}
        {activeReport === 'bulanan' && (
          <div className="space-y-4">
            <table className="w-full text-xs text-left border border-slate-200">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3 font-mono">NIS</th>
                  <th className="py-2 px-3">Nama Siswa</th>
                  <th className="py-2 px-3">Kelas</th>
                  <th className="py-2 px-3 text-right">Tagihan</th>
                  <th className="py-2 px-3 text-right">Diskon</th>
                  <th className="py-2 px-3 text-right">Terbayar</th>
                  <th className="py-2 px-3 text-right">Sisa Tagihan</th>
                  <th className="py-2 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {monthlyReportData.map(({ bill, student }) => (
                  <tr key={bill.id} className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-mono">{student.nis}</td>
                    <td className="py-2 px-3 font-semibold text-slate-900">{student.nama}</td>
                    <td className="py-2 px-3">{getClassName(student.kelasId)}</td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums">{formatRupiah(bill.nominalTagihan)}</td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums text-emerald-700">
                      {bill.nominalDiskon > 0 ? `-${formatRupiah(bill.nominalDiskon)}` : '-'}
                    </td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums font-bold text-slate-900">
                      {formatRupiah(bill.nominalTerbayar)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums font-bold text-rose-700">
                      {formatRupiah(bill.sisaTagihan)}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          bill.status === 'lunas'
                            ? 'bg-emerald-100 text-emerald-800'
                            : bill.status === 'belum_lunas'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {bill.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 font-bold border-t-2 border-slate-300">
                  <td colSpan={3} className="py-2 px-3 text-right">TOTAL KELAS:</td>
                  <td className="py-2 px-3 text-right font-mono tabular-nums">
                    {formatRupiah(monthlyReportData.reduce((acc, m) => acc + m.bill.nominalTagihan, 0))}
                  </td>
                  <td className="py-2 px-3 text-right font-mono tabular-nums text-emerald-700">
                    {formatRupiah(monthlyReportData.reduce((acc, m) => acc + m.bill.nominalDiskon, 0))}
                  </td>
                  <td className="py-2 px-3 text-right font-mono tabular-nums text-emerald-950">
                    {formatRupiah(monthlyReportData.reduce((acc, m) => acc + m.bill.nominalTerbayar, 0))}
                  </td>
                  <td className="py-2 px-3 text-right font-mono tabular-nums text-rose-800">
                    {formatRupiah(monthlyReportData.reduce((acc, m) => acc + m.bill.sisaTagihan, 0))}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* 3. Laporan Tahunan */}
        {activeReport === 'tahunan' && (
          <div className="space-y-4">
            <table className="w-full text-xs text-left border border-slate-200">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Bulan</th>
                  <th className="py-2.5 px-3 text-right">Target Tagihan (Net)</th>
                  <th className="py-2.5 px-3 text-right">Penerimaan Realisasi</th>
                  <th className="py-2.5 px-3 text-right">Sisa Tunggakan</th>
                  <th className="py-2.5 px-3 text-center">Rasio Siswa Lunas</th>
                  <th className="py-2.5 px-3 text-right">Persentase</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {annualReportData.map((r) => (
                  <tr key={r.month} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-bold text-slate-900">{r.month}</td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">{formatRupiah(r.totalBilled)}</td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-emerald-700">
                      {formatRupiah(r.totalCollected)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-rose-700">
                      {formatRupiah(r.totalArrears)}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono">
                      {r.paidStudents} / {r.totalStudents}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">
                      {r.pct}%
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 font-bold border-t-2 border-slate-300">
                  <td className="py-2.5 px-3">TOTAL SATU TAHUN:</td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                    {formatRupiah(annualReportData.reduce((acc, r) => acc + r.totalBilled, 0))}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-emerald-950 text-sm">
                    {formatRupiah(annualReportData.reduce((acc, r) => acc + r.totalCollected, 0))}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-rose-800">
                    {formatRupiah(annualReportData.reduce((acc, r) => acc + r.totalArrears, 0))}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* 4. Laporan per Kelas */}
        {activeReport === 'kelas' && (
          <div className="space-y-4">
            <table className="w-full text-xs text-left border border-slate-200">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Kelas</th>
                  <th className="py-2.5 px-3 text-center">Jml Siswa</th>
                  <th className="py-2.5 px-3 text-right">Target Tagihan</th>
                  <th className="py-2.5 px-3 text-right">Total Terbayar</th>
                  <th className="py-2.5 px-3 text-right">Total Tunggakan</th>
                  <th className="py-2.5 px-3 text-center">Siswa Lunas</th>
                  <th className="py-2.5 px-3 text-right">Persentase</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {classReportData.map((c) => (
                  <tr key={c.className} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-bold text-slate-900">{c.className}</td>
                    <td className="py-2.5 px-3 text-center font-mono">{c.studentCount} Siswa</td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">{formatRupiah(c.target)}</td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-emerald-800">
                      {formatRupiah(c.collected)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-rose-700">
                      {formatRupiah(c.arrears)}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono">
                      {c.lunasCount} / {c.studentCount}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">
                      {c.pct}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 5. Laporan Tunggakan Siswa */}
        {activeReport === 'tunggakan' && (
          <div className="space-y-4">
            <table className="w-full text-xs text-left border border-slate-200">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 font-mono">No.</th>
                  <th className="py-2.5 px-3">NIS</th>
                  <th className="py-2.5 px-3">Nama Siswa</th>
                  <th className="py-2.5 px-3">Kelas</th>
                  <th className="py-2.5 px-3">Wali Murid</th>
                  <th className="py-2.5 px-3">No. Kontak</th>
                  <th className="py-2.5 px-3">Periode Bulan Menunggak</th>
                  <th className="py-2.5 px-3 text-right">Total Tunggakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {arrearsReportData.map((item, idx) => (
                  <tr key={item.student.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-mono">{item.student.nis}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{item.student.nama}</td>
                    <td className="py-2.5 px-3">{getClassName(item.student.kelasId)}</td>
                    <td className="py-2.5 px-3">{item.student.namaWali}</td>
                    <td className="py-2.5 px-3 font-mono">{item.student.noHpWali}</td>
                    <td className="py-2.5 px-3 font-semibold text-amber-900">{item.months.join(', ')}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-700 tabular-nums">
                      {formatRupiah(item.totalTunggakan)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 font-bold border-t-2 border-slate-300">
                  <td colSpan={7} className="py-2.5 px-3 text-right">TOTAL SELURUH TUNGGAKAN:</td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-rose-800 text-sm">
                    {formatRupiah(arrearsReportData.reduce((acc, a) => acc + a.totalTunggakan, 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* 6. Laporan Status Kelunasan Siswa (Siswa Lunas vs Belum Lunas) */}
        {activeReport === 'status_siswa' && (
          <div className="space-y-4">
            <table className="w-full text-xs text-left border border-slate-200">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3">No.</th>
                  <th className="py-2 px-3">NIS</th>
                  <th className="py-2 px-3">Nama Siswa</th>
                  <th className="py-2 px-3">Kelas</th>
                  <th className="py-2 px-3 text-center">Status Kelunasan ({filterMonth})</th>
                  <th className="py-2 px-3 text-right">Jumlah Dibayar</th>
                  <th className="py-2 px-3 text-right">Sisa Tagihan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {monthlyReportData.map(({ bill, student }, idx) => (
                  <tr key={bill.id} className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-mono">{idx + 1}</td>
                    <td className="py-2 px-3 font-mono">{student.nis}</td>
                    <td className="py-2 px-3 font-semibold text-slate-900">{student.nama}</td>
                    <td className="py-2 px-3">{getClassName(student.kelasId)}</td>
                    <td className="py-2 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          bill.status === 'lunas'
                            ? 'bg-emerald-100 text-emerald-800'
                            : bill.status === 'belum_lunas'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {bill.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums">{formatRupiah(bill.nominalTerbayar)}</td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums text-rose-700">{formatRupiah(bill.sisaTagihan)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 7. Riwayat per Siswa */}
        {activeReport === 'siswa_individual' && (
          <div className="space-y-4">
            {(() => {
              const student = db.students.find((s) => s.id === selectedStudentId);
              const studentBills = db.bills.filter((b) => b.studentId === selectedStudentId);
              const studentTrx = db.transactions.filter((t) => t.studentId === selectedStudentId && t.status !== 'dibatalkan');

              return (
                <div className="space-y-4">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 block">Nama Siswa:</span>
                      <strong className="text-slate-900">{student?.nama}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">NIS:</span>
                      <strong className="font-mono text-slate-900">{student?.nis}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Kelas:</span>
                      <strong>{student ? getClassName(student.kelasId) : '-'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Saldo Kredit:</span>
                      <strong className="text-emerald-700">{formatRupiah(student?.saldoKredit || 0)}</strong>
                    </div>
                  </div>

                  <h4 className="font-bold text-slate-900 text-xs">Daftar Transaksi Pembayaran:</h4>
                  <table className="w-full text-xs text-left border border-slate-200">
                    <thead className="bg-slate-100 text-slate-700 font-semibold border-b">
                      <tr>
                        <th className="py-2 px-3">No. Transaksi</th>
                        <th className="py-2 px-3">Tanggal</th>
                        <th className="py-2 px-3">Alokasi Bulan</th>
                        <th className="py-2 px-3 text-right">Nominal</th>
                        <th className="py-2 px-3">Metode</th>
                        <th className="py-2 px-3">Petugas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {studentTrx.map((t) => (
                        <tr key={t.id}>
                          <td className="py-2 px-3 font-mono">{t.noTransaksi}</td>
                          <td className="py-2 px-3">{t.tanggalBayar}</td>
                          <td className="py-2 px-3">{t.alokasiBulan.map((a) => a.bulan).join(', ')}</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-emerald-800">{formatRupiah(t.totalBayar)}</td>
                          <td className="py-2 px-3 capitalize">{t.metodeBayar.replace('transfer_', '')}</td>
                          <td className="py-2 px-3 text-slate-600">{t.petugasNama}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>
        )}

        {/* 8. Laporan Keringanan & Beasiswa */}
        {activeReport === 'beasiswa' && (
          <div className="space-y-4">
            <table className="w-full text-xs text-left border border-slate-200">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">NIS</th>
                  <th className="py-2.5 px-3">Nama Siswa</th>
                  <th className="py-2.5 px-3">Kelas</th>
                  <th className="py-2.5 px-3">Jenis Beasiswa</th>
                  <th className="py-2.5 px-3">Potongan</th>
                  <th className="py-2.5 px-3">Nomor SK Yayasan</th>
                  <th className="py-2.5 px-3">Keterangan</th>
                  <th className="py-2.5 px-3">Persetujuan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {scholarshipReportData.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono">{d.nis}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{d.studentNama}</td>
                    <td className="py-2.5 px-3">{d.kelas}</td>
                    <td className="py-2.5 px-3 capitalize font-semibold text-emerald-800">
                      {d.jenis.replace('_', ' ')}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold">
                      {d.tipe === 'persen' ? `${d.nilai}%` : formatRupiah(d.nilai)}
                    </td>
                    <td className="py-2.5 px-3 font-mono">{d.nomorSk || '-'}</td>
                    <td className="py-2.5 px-3 text-slate-700">{d.keterangan}</td>
                    <td className="py-2.5 px-3 text-slate-600">{d.disetujuiOleh}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 9. Laporan Koreksi dan Pembatalan */}
        {activeReport === 'koreksi_pembatalan' && (
          <div className="space-y-4">
            <table className="w-full text-xs text-left border border-slate-200">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 font-mono">No. Transaksi</th>
                  <th className="py-2.5 px-3">Tanggal Bayar</th>
                  <th className="py-2.5 px-3">Siswa</th>
                  <th className="py-2.5 px-3 text-right">Nominal</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3">Riwayat Koreksi / Alasan Pembatalan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {correctionReportData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400">
                      Tidak ada catatan transaksi yang dibatalkan atau dikoreksi.
                    </td>
                  </tr>
                ) : (
                  correctionReportData.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono font-medium">{t.noTransaksi}</td>
                      <td className="py-2.5 px-3">{t.tanggalBayar}</td>
                      <td className="py-2.5 px-3 font-semibold">{t.studentNama}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold">{formatRupiah(t.totalBayar)}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            t.status === 'dikoreksi'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800 line-through'
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        {t.riwayatKoreksi?.map((k, i) => (
                          <div key={i} className="text-[11px] text-slate-700">
                            <strong>{k.petugasNama}:</strong> "{k.alasan}"
                          </div>
                        ))}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tanda Tangan Laporan Resmi */}
        <div className="grid grid-cols-2 gap-8 text-xs pt-8 text-center">
          <div>
            <p className="text-slate-500 mb-14">Mengetahui,<br />Kepala SMP Alam Excellentia,</p>
            <div className="border-b border-slate-400 w-48 mx-auto mb-1"></div>
            <p className="font-bold text-slate-900">{db.schoolProfile.kepalaSekolah}</p>
            <p className="text-[10px] text-slate-500 font-mono">NIP: 19740512 200003 1 002</p>
          </div>
          <div>
            <p className="text-slate-500 mb-14">
              Pamekasan, {formatDateIndo(new Date().toISOString().split('T')[0])}<br />Bendahara / Petugas Keuangan,
            </p>
            <div className="border-b border-slate-400 w-48 mx-auto mb-1"></div>
            <p className="font-bold text-slate-900">{db.schoolProfile.bendahara}</p>
            <p className="text-[10px] text-slate-500 font-mono">NIP: 19850914 201001 2 015</p>
          </div>
        </div>
      </div>
    </div>
  );
};
