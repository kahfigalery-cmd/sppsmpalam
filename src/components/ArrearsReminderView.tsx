import React, { useState, useMemo } from 'react';
import {
  BellRing,
  Copy,
  Check,
  Send,
  Phone,
  Search,
  Filter,
  AlertTriangle,
  CreditCard,
  MessageSquareQuote
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatRupiah, formatDateIndo } from '../utils/formatters';
import { Student } from '../types';

interface ArrearsReminderViewProps {
  onQuickPayForStudent: (student: Student) => void;
}

export const ArrearsReminderView: React.FC<ArrearsReminderViewProps> = ({ onQuickPayForStudent }) => {
  const { db, currentUser } = useApp();

  const [selectedClass, setSelectedClass] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedStudentId, setCopiedStudentId] = useState<string | null>(null);

  // Group overdue bills by student
  const arrearsList = useMemo(() => {
    // Current academic month threshold: up to Oktober (or bills whose jatuh tempo <= today)
    const overdueMap = new Map<
      string,
      {
        student: Student;
        unpaidBills: typeof db.bills;
        totalArrears: number;
        monthsList: string[];
      }
    >();

    db.students.forEach((student) => {
      if (student.status !== 'aktif') return;

      // Filter unpaid bills for past/current periods (urutanBulan <= 4: Juli, Ags, Sep, Okt)
      const studentUnpaids = db.bills.filter(
        (b) =>
          b.studentId === student.id &&
          b.urutanBulan <= 4 &&
          (b.status === 'belum_bayar' || b.status === 'belum_lunas')
      );

      if (studentUnpaids.length > 0) {
        const total = studentUnpaids.reduce((sum, b) => sum + b.sisaTagihan, 0);
        const months = studentUnpaids.map((b) => `${b.bulan} ${b.tahun}`);

        overdueMap.set(student.id, {
          student,
          unpaidBills: studentUnpaids,
          totalArrears: total,
          monthsList: months
        });
      }
    });

    // Convert map to array and apply filters
    let list = Array.from(overdueMap.values());

    if (selectedClass !== 'all') {
      list = list.filter((item) => item.student.kelasId === selectedClass);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (item) =>
          item.student.nama.toLowerCase().includes(q) ||
          item.student.nis.toLowerCase().includes(q) ||
          item.student.namaWali.toLowerCase().includes(q)
      );
    }

    // Sort by largest arrears first
    return list.sort((a, b) => b.totalArrears - a.totalArrears);
  }, [db.students, db.bills, selectedClass, searchTerm]);

  // Total cumulative arrears for these filtered students
  const totalArrearsSum = useMemo(() => {
    return arrearsList.reduce((acc, item) => acc + item.totalArrears, 0);
  }, [arrearsList]);

  // Generate Islamic polite reminder message
  const generateMessage = (student: Student, months: string[], total: number) => {
    const monthsText = months.join(', ');
    return `Assalamu’alaikum warahmatullahi wabarakatuh.\n\nBapak/Ibu Orang Tua/Wali dari ananda *${student.nama}* (NIS: ${student.nis}),\n\nKami dari bagian administrasi keuangan SMP Alam Excellentia Pamekasan menginformasikan bahwa pembayaran SPP ananda untuk periode *${monthsText}* masih memiliki kewajiban administrasi sebesar *${formatRupiah(total)}*.\n\nMohon berkenan melakukan konfirmasi atau penyelesaian administrasi kepada bagian kasir sekolah / transfer ke rekening resmi:\n*${db.schoolProfile.rekeningInfo}*\n\nTerima kasih atas perhatian, kerja sama, dan kepercayaan Bapak/Ibu kepada SMP Alam Excellentia Pamekasan.\n\nWassalamu’alaikum warahmatullahi wabarakatuh.`;
  };

  const handleCopyMessage = (student: Student, months: string[], total: number) => {
    const msg = generateMessage(student, months, total);
    navigator.clipboard.writeText(msg);
    setCopiedStudentId(student.id);
    setTimeout(() => setCopiedStudentId(null), 3000);
  };

  const handleOpenWhatsApp = (student: Student, months: string[], total: number) => {
    const msg = generateMessage(student, months, total);
    let phone = student.noHpWali.replace(/[^0-9]/g, '');
    if (phone.startsWith('0')) {
      phone = '62' + phone.slice(1);
    }
    const encoded = encodeURIComponent(msg);
    window.open(`https://wa.me/${phone}?text=${encoded}`, '_blank');
  };

  const getClassName = (kelasId: string) => {
    return db.classes.find((c) => c.id === kelasId)?.nama || '-';
  };

  return (
    <div className="space-y-5">
      {/* Overview stats header */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Total Siswa Menunggak</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {arrearsList.length}
            <span className="text-xs font-normal text-slate-500 ml-1">orang</span>
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Periode Berjalan T.A. 2026/2027
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Total Nilai Tunggakan</span>
            <BellRing className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-bold font-mono text-rose-700 tabular-nums">
            {formatRupiah(totalArrearsSum)}
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Belum diselesaikan wali murid
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Jatuh Tempo Bulanan</span>
            <Phone className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-lg font-bold text-slate-800">Tanggal 10 Setiap Bulan</p>
          <span className="text-[11px] text-emerald-700 font-medium mt-1 block">
            Konfirmasi ramah via WhatsApp
          </span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari siswa atau wali..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-xs text-slate-500">Filter Kelas:</span>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-slate-700 font-medium"
          >
            <option value="all">Semua Kelas</option>
            {db.classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nama}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Overdue Students Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 font-mono">NIS</th>
                <th className="py-3 px-4">Nama Siswa</th>
                <th className="py-3 px-4">Kelas</th>
                <th className="py-3 px-4">Wali Murid & Kontak</th>
                <th className="py-3 px-4 text-center">Jml Bulan</th>
                <th className="py-3 px-4">Rincian Periode Tunggakan</th>
                <th className="py-3 px-4 text-right">Total Tunggakan</th>
                <th className="py-3 px-4 text-center">Kirim Notifikasi</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {arrearsList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400">
                    <Check className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">Alhamdulillah, tidak ada tunggakan SPP yang belum diselesaikan!</p>
                  </td>
                </tr>
              ) : (
                arrearsList.map((item) => {
                  const isCopied = copiedStudentId === item.student.id;

                  return (
                    <tr key={item.student.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-slate-900">
                        {item.student.nis}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{item.student.nama}</div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700">
                        {getClassName(item.student.kelasId)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-800 font-medium">{item.student.namaWali}</div>
                        <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{item.student.noHpWali}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                          {item.unpaidBills.length} Bulan
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {item.monthsList.map((m) => (
                            <span
                              key={m}
                              className="bg-amber-50 text-amber-900 border border-amber-200 px-1.5 py-0.2 rounded text-[10px]"
                            >
                              {m}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-rose-700 tabular-nums">
                        {formatRupiah(item.totalArrears)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Copy polite reminder message */}
                          <button
                            onClick={() =>
                              handleCopyMessage(item.student, item.monthsList, item.totalArrears)
                            }
                            title="Salin Pesan Pengingat Santun"
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                              isCopied
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{isCopied ? 'Tersalin' : 'Salin Pesan'}</span>
                          </button>

                          {/* Direct WhatsApp Web Sender */}
                          <button
                            onClick={() =>
                              handleOpenWhatsApp(item.student, item.monthsList, item.totalArrears)
                            }
                            title="Buka WhatsApp Web dengan Pesan Pengingat"
                            className="p-1.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded transition-colors"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {currentUser.role !== 'kepsek' && (
                          <button
                            onClick={() => onQuickPayForStudent(item.student)}
                            title="Bayar Sekarang"
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-[11px] font-semibold transition-colors shadow-2xs"
                          >
                            <CreditCard className="w-3 h-3" />
                            <span>Bayar</span>
                          </button>
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
