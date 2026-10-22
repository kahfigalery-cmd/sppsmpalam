import React, { useState, useMemo } from 'react';
import {
  CalendarDays,
  Filter,
  Download,
  CreditCard,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ACADEMIC_MONTHS, formatRupiah } from '../utils/formatters';
import { Student } from '../types';

interface RekapMatrixViewProps {
  onQuickPayForStudent: (student: Student) => void;
}

export const RekapMatrixView: React.FC<RekapMatrixViewProps> = ({ onQuickPayForStudent }) => {
  const { db, currentUser } = useApp();

  const [selectedYear, setSelectedYear] = useState('ay-2026-2027');
  const [selectedClass, setSelectedClass] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'lunas' | 'tunggakan'>('all');

  // Filter students
  const filteredStudents = useMemo(() => {
    return db.students.filter((s) => {
      const matchClass = selectedClass === 'all' || s.kelasId === selectedClass;
      const matchSearch =
        s.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.nis.toLowerCase().includes(searchTerm.toLowerCase());
      return matchClass && matchSearch;
    });
  }, [db.students, selectedClass, searchTerm]);

  // Pre-index bills by studentId and month for instant O(1) lookup
  const billMatrix = useMemo(() => {
    const map = new Map<string, { [month: string]: (typeof db.bills)[0] }>();

    db.bills.forEach((b) => {
      if (b.tahunAjaranId !== selectedYear) return;
      if (!map.has(b.studentId)) {
        map.set(b.studentId, {});
      }
      map.get(b.studentId)![b.bulan] = b;
    });

    return map;
  }, [db.bills, selectedYear]);

  // Export Matrix to CSV
  const handleExportMatrixCSV = () => {
    const headers = ['No', 'NIS', 'Nama Siswa', 'Kelas', ...ACADEMIC_MONTHS];

    const rows = filteredStudents.map((s, idx) => {
      const cls = db.classes.find((c) => c.id === s.kelasId)?.nama || '-';
      const studentBills = billMatrix.get(s.id) || {};

      const monthStatuses = ACADEMIC_MONTHS.map((m) => {
        const b = studentBills[m];
        if (!b) return 'Tidak Berlaku';
        if (s.status !== 'aktif') return 'Non-Aktif';
        if (b.status === 'lunas') return 'Lunas';
        if (b.status === 'belum_lunas') return `Sebagian (${formatRupiah(b.nominalTerbayar)})`;
        return 'Belum Bayar';
      });

      return [idx + 1, `"${s.nis}"`, `"${s.nama}"`, `"${cls}"`, ...monthStatuses].join(',');
    });

    const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encoded = encodeURI(csv);
    const a = document.createElement('a');
    a.href = encoded;
    a.download = `buku_matriks_spp_smp_alam_excellentia_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const getClassName = (kelasId: string) => {
    return db.classes.find((c) => c.id === kelasId)?.nama || '-';
  };

  return (
    <div className="space-y-5">
      {/* Filters and legend toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Buku Matriks Pembayaran SPP Siswa
              </h3>
              <p className="text-xs text-slate-500">
                Pemantauan komprehensif 12 bulan kalender akademik (Juli hingga Juni)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportMatrixCSV}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-emerald-700" />
              <span>Ekspor Matriks CSV</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-100 text-xs">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari NIS atau Nama Siswa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 shrink-0">Kelas:</span>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full py-1.5 px-2 bg-slate-50 border border-slate-300 rounded-lg font-medium"
            >
              <option value="all">Semua Kelas</option>
              {db.classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nama}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 shrink-0">T.A.:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full py-1.5 px-2 bg-slate-50 border border-slate-300 rounded-lg font-medium"
            >
              {db.academicYears.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.nama} {y.aktif ? '(Aktif)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Visual Color Legend */}
        <div className="pt-2 flex flex-wrap items-center gap-4 text-[11px] text-slate-600 border-t border-slate-100">
          <span className="font-semibold text-slate-700">Keterangan Warna:</span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-emerald-500 rounded-xs"></span>
            <span>Hijau: Lunas</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-amber-400 rounded-xs"></span>
            <span>Kuning: Sebagian / Cicilan</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-rose-500 rounded-xs"></span>
            <span>Merah: Belum Bayar / Menunggak</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-slate-300 rounded-xs"></span>
            <span>Abu-abu: Tidak Berlaku / Non-Aktif</span>
          </span>
        </div>
      </div>

      {/* Matrix Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-emerald-950 text-white font-semibold sticky top-0 z-10">
              <tr>
                <th className="py-2.5 px-3 border-r border-emerald-900 w-10 text-center font-mono">No.</th>
                <th className="py-2.5 px-3 border-r border-emerald-900 min-w-[150px]">Nama Siswa</th>
                <th className="py-2.5 px-2.5 border-r border-emerald-900 w-24">Kelas</th>
                {ACADEMIC_MONTHS.map((m) => (
                  <th
                    key={m}
                    className="py-2.5 px-2 border-r border-emerald-900 text-center font-medium min-w-[70px]"
                  >
                    {m.slice(0, 3)}
                  </th>
                ))}
                <th className="py-2.5 px-3 text-center min-w-[90px]">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={16} className="py-8 text-center text-slate-400">
                    Tidak ditemukan data siswa pada filter ini.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student, idx) => {
                  const studentBills = billMatrix.get(student.id) || {};
                  const isInactive = student.status !== 'aktif';

                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      <td className="py-2.5 px-3 text-center font-mono text-slate-500 border-r border-slate-100">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900 border-r border-slate-100">
                        <div>{student.nama}</div>
                        <div className="text-[10px] font-mono text-slate-500">{student.nis}</div>
                      </td>
                      <td className="py-2.5 px-2.5 text-slate-600 border-r border-slate-100">
                        {getClassName(student.kelasId)}
                      </td>

                      {/* 12 Months Cells */}
                      {ACADEMIC_MONTHS.map((month) => {
                        const bill = studentBills[month];

                        if (isInactive) {
                          return (
                            <td
                              key={month}
                              className="py-2 px-1 text-center border-r border-slate-100 bg-slate-100 text-slate-400"
                              title="Siswa Tidak Aktif"
                            >
                              <span className="text-[10px]">-</span>
                            </td>
                          );
                        }

                        if (!bill) {
                          return (
                            <td
                              key={month}
                              className="py-2 px-1 text-center border-r border-slate-100 bg-slate-50 text-slate-400"
                            >
                              <span className="text-[10px]">-</span>
                            </td>
                          );
                        }

                        if (bill.status === 'lunas') {
                          return (
                            <td
                              key={month}
                              className="py-2 px-1 text-center border-r border-slate-100 bg-emerald-50 text-emerald-800"
                              title={`Lunas: ${formatRupiah(bill.nominalTerbayar)}`}
                            >
                              <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white shadow-2xs">
                                Lunas
                              </span>
                            </td>
                          );
                        }

                        if (bill.status === 'belum_lunas') {
                          return (
                            <td
                              key={month}
                              className="py-2 px-1 text-center border-r border-slate-100 bg-amber-50 text-amber-900"
                              title={`Sebagian: Terbayar ${formatRupiah(bill.nominalTerbayar)}, Sisa ${formatRupiah(bill.sisaTagihan)}`}
                            >
                              <span className="inline-block px-1 py-0.5 rounded text-[10px] font-bold bg-amber-400 text-slate-950">
                                Cicil
                              </span>
                            </td>
                          );
                        }

                        // Belum Bayar
                        return (
                          <td
                            key={month}
                            className="py-2 px-1 text-center border-r border-slate-100 bg-rose-50 text-rose-800"
                            title={`Belum Bayar: Tagihan ${formatRupiah(bill.sisaTagihan)}`}
                          >
                            <span className="inline-block px-1 py-0.5 rounded text-[10px] font-medium bg-rose-200 text-rose-900">
                              Belum
                            </span>
                          </td>
                        );
                      })}

                      {/* Quick action button */}
                      <td className="py-2 px-3 text-center">
                        {currentUser.role !== 'kepsek' && !isInactive ? (
                          <button
                            onClick={() => onQuickPayForStudent(student)}
                            title="Bayar SPP Siswa Ini"
                            className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-[10px] font-semibold transition-colors"
                          >
                            <CreditCard className="w-3 h-3" />
                            <span>Bayar</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
