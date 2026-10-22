import React, { useState, useMemo } from 'react';
import {
  Coins,
  Settings,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  Filter,
  CreditCard,
  Upload,
  Receipt,
  Download,
  Image as ImageIcon,
  Edit2,
  X,
  FileSpreadsheet
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AnnualFeeComponent, AnnualFeePayment, PaymentMethod, Student } from '../types';
import { formatRupiah, formatDateIndo } from '../utils/formatters';

interface AnnualFeeViewProps {
  onShowReceipt: (payment: AnnualFeePayment) => void;
}

export const AnnualFeeView: React.FC<AnnualFeeViewProps> = ({ onShowReceipt }) => {
  const {
    db,
    currentUser,
    updateAnnualComponents,
    processAnnualPayment
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'lunas' | 'dicicil' | 'belum_bayar'>('all');

  // Modals
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedStudentForPay, setSelectedStudentForPay] = useState<Student | null>(null);

  // Configuration edit state
  const [editingComponents, setEditingComponents] = useState<AnnualFeeComponent[]>(db.annualFeeComponents);

  // Payment form state
  const [paymentStudentId, setPaymentStudentId] = useState(db.students[0]?.id || '');
  const [paymentAmount, setPaymentAmount] = useState<number>(2700000);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('transfer_bri');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [proofImageBase64, setProofImageBase64] = useState<string>('');
  const [paymentError, setPaymentError] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState('');

  // Active Total Annual Fee
  const totalAnnualFee = useMemo(() => {
    return db.annualFeeComponents.reduce((sum, c) => sum + c.nominal, 0);
  }, [db.annualFeeComponents]);

  // Editing Total
  const editingTotal = useMemo(() => {
    return editingComponents.reduce((sum, c) => sum + c.nominal, 0);
  }, [editingComponents]);

  // Combine students with their annual fee bills
  const studentAnnualData = useMemo(() => {
    return db.students.map((student) => {
      const bill = db.annualFeeBills.find((b) => b.studentId === student.id) || {
        id: `ann-${student.id}`,
        studentId: student.id,
        tahunAjaranId: 'ay-2026-2027',
        totalTagihan: totalAnnualFee,
        nominalTerbayar: 0,
        sisaTagihan: totalAnnualFee,
        status: 'belum_bayar' as const
      };

      const payments = db.annualFeePayments.filter((p) => p.studentId === student.id);

      return {
        student,
        bill,
        payments
      };
    });
  }, [db.students, db.annualFeeBills, db.annualFeePayments, totalAnnualFee]);

  // Filtered rows
  const filteredData = useMemo(() => {
    return studentAnnualData.filter(({ student, bill }) => {
      const matchSearch =
        student.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.nis.toLowerCase().includes(searchTerm.toLowerCase());
      const matchClass = filterClass === 'all' || student.kelasId === filterClass;
      const matchStatus = filterStatus === 'all' || bill.status === filterStatus;
      return matchSearch && matchClass && matchStatus;
    });
  }, [studentAnnualData, searchTerm, filterClass, filterStatus]);

  // Statistics
  const stats = useMemo(() => {
    let totalTarget = 0;
    let totalCollected = 0;
    let lunasCount = 0;
    let cicilCount = 0;
    let belumCount = 0;

    studentAnnualData.forEach(({ bill }) => {
      totalTarget += bill.totalTagihan;
      totalCollected += bill.nominalTerbayar;
      if (bill.status === 'lunas') lunasCount++;
      else if (bill.status === 'dicicil') cicilCount++;
      else belumCount++;
    });

    return {
      totalTarget,
      totalCollected,
      totalArrears: totalTarget - totalCollected,
      lunasCount,
      cicilCount,
      belumCount,
      pct: totalTarget > 0 ? Math.round((totalCollected / totalTarget) * 100) : 0
    };
  }, [studentAnnualData]);

  // Handle open payment modal for specific student
  const handleOpenPayment = (student: Student) => {
    setSelectedStudentForPay(student);
    setPaymentStudentId(student.id);

    const bill = db.annualFeeBills.find((b) => b.studentId === student.id);
    const sisa = bill ? bill.sisaTagihan : totalAnnualFee;
    setPaymentAmount(sisa > 0 ? sisa : totalAnnualFee);
    setPaymentNotes('');
    setProofImageBase64('');
    setPaymentError('');
    setPaymentSuccess('');
    setIsPaymentModalOpen(true);
  };

  // Handle file upload for proof
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran file bukti pembayaran maksimal 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64 = uploadEvent.target?.result as string;
      setProofImageBase64(base64);
    };
    reader.readAsDataURL(file);
  };

  // Submit Annual Fee Payment
  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError('');
    setPaymentSuccess('');

    if (paymentAmount <= 0) {
      setPaymentError('Nominal pembayaran harus lebih besar dari Rp 0');
      return;
    }

    const res = processAnnualPayment({
      studentId: paymentStudentId,
      nominalBayar: paymentAmount,
      metodeBayar: paymentMethod,
      catatan: paymentNotes,
      buktiPembayaranUrl: proofImageBase64 || undefined
    });

    if (!res.success) {
      setPaymentError(res.error || 'Gagal memproses pembayaran');
      return;
    }

    setPaymentSuccess('Pembayaran Uang Tahunan berhasil dicatat!');
    setTimeout(() => {
      setIsPaymentModalOpen(false);
      if (res.payment) {
        onShowReceipt(res.payment);
      }
    }, 600);
  };

  // Save Config Components
  const handleSaveConfig = () => {
    updateAnnualComponents(editingComponents);
    setIsConfigModalOpen(false);
  };

  const getClassName = (kelasId: string) => {
    return db.classes.find((c) => c.id === kelasId)?.nama || '-';
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Stats */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 rounded-xl p-5 text-white shadow-sm border border-emerald-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-400 text-slate-950 rounded uppercase tracking-wider">
              T.A. 2026/2027
            </span>
            <span className="text-xs text-emerald-300">SMP Alam Excellentia Pamekasan</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight">
            Manajemen Uang Tahunan Siswa (Total: {formatRupiah(totalAnnualFee)})
          </h2>
          <p className="text-xs text-emerald-200/90 max-w-2xl mt-1">
            Meliputi ATK (100rb), KBM & Ekstrakurikuler (1,65jt), Buku & Media Pembelajaran (900rb), serta Kalender (50rb). Mendukung pembayaran lunas maupun dicicil berkala.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {currentUser.role === 'admin' && (
            <button
              onClick={() => {
                setEditingComponents([...db.annualFeeComponents]);
                setIsConfigModalOpen(true);
              }}
              className="px-3.5 py-2 bg-emerald-800/80 hover:bg-emerald-800 border border-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Settings className="w-4 h-4 text-emerald-300" />
              <span>Ubah Rincian Komponen</span>
            </button>
          )}

          <button
            onClick={() => {
              const first = db.students[0];
              if (first) handleOpenPayment(first);
            }}
            className="px-4 py-2 bg-white text-emerald-950 hover:bg-emerald-50 rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Coins className="w-4 h-4 text-emerald-700" />
            <span>Bayar Uang Tahunan</span>
          </button>
        </div>
      </div>

      {/* Breakdown Components Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
            Komponen Rincian Uang Tahunan (T.A. 2026/2027)
          </span>
          <span className="font-mono text-xs font-bold text-emerald-800">
            Total Paket: {formatRupiah(totalAnnualFee)}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {db.annualFeeComponents.map((c) => (
            <div key={c.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[11px] text-slate-500 block truncate">{c.nama}</span>
              <p className="text-sm font-bold font-mono text-slate-900 mt-0.5">
                {formatRupiah(c.nominal)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 block font-medium">Total Penerimaan Masuk</span>
          <p className="text-xl font-bold font-mono text-emerald-700 mt-1 tabular-nums">
            {formatRupiah(stats.totalCollected)}
          </p>
          <span className="text-[11px] text-slate-400 block mt-0.5">
            Dari target {formatRupiah(stats.totalTarget)}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 block font-medium">Sisa Belum Terbayar</span>
          <p className="text-xl font-bold font-mono text-rose-700 mt-1 tabular-nums">
            {formatRupiah(stats.totalArrears)}
          </p>
          <span className="text-[11px] text-rose-600 block mt-0.5 font-medium">
            Tunggakan/sisa cicilan siswa
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 block font-medium">Status Kelunasan Siswa</span>
          <div className="flex items-center gap-2 mt-1 font-mono">
            <span className="text-lg font-bold text-emerald-600">{stats.lunasCount} Lunas</span>
            <span className="text-slate-300">·</span>
            <span className="text-lg font-bold text-amber-600">{stats.cicilCount} Dicicil</span>
            <span className="text-slate-300">·</span>
            <span className="text-sm font-bold text-rose-600">{stats.belumCount} Belum</span>
          </div>
          <span className="text-[11px] text-slate-500 block mt-0.5">
            Total {db.students.length} siswa aktif
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 block font-medium">Persentase Capaian</span>
          <p className="text-xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
            {stats.pct}%
          </p>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${stats.pct}%` }} />
          </div>
        </div>
      </div>

      {/* Filter and Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari siswa atau NIS..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-lg py-1.5 px-2.5"
            >
              <option value="all">Semua Rombel (12 Siswa)</option>
              {db.classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nama}
                </option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-lg py-1.5 px-2.5"
            >
              <option value="all">Semua Status</option>
              <option value="lunas">Lunas</option>
              <option value="dicicil">Dicicil Sebagian</option>
              <option value="belum_bayar">Belum Bayar</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 font-mono">NIS</th>
                <th className="py-3 px-4">Nama Siswa</th>
                <th className="py-3 px-4">Kelas</th>
                <th className="py-3 px-4 text-right">Total Tagihan</th>
                <th className="py-3 px-4 text-right">Sudah Dibayar</th>
                <th className="py-3 px-4 text-right">Sisa Tagihan</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Tidak ditemukan data siswa pada filter ini.
                  </td>
                </tr>
              ) : (
                filteredData.map(({ student, bill, payments }) => (
                  <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-slate-900">{student.nis}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{student.nama}</td>
                    <td className="py-3 px-4 text-slate-600">{getClassName(student.kelasId)}</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums">
                      {formatRupiah(bill.totalTagihan)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-800 tabular-nums">
                      {formatRupiah(bill.nominalTerbayar)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-rose-700 tabular-nums">
                      {formatRupiah(bill.sisaTagihan)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          bill.status === 'lunas'
                            ? 'bg-emerald-100 text-emerald-800'
                            : bill.status === 'dicicil'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {bill.status === 'lunas' ? 'LUNAS' : bill.status === 'dicicil' ? 'DICICIL' : 'BELUM BAYAR'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {bill.status !== 'lunas' ? (
                          <button
                            onClick={() => handleOpenPayment(student)}
                            className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-[11px] font-semibold transition-colors flex items-center gap-1"
                          >
                            <Coins className="w-3 h-3" />
                            <span>Bayar / Cicil</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Lunas</span>
                          </span>
                        )}

                        {payments.length > 0 && (
                          <button
                            onClick={() => onShowReceipt(payments[0])}
                            title="Lihat Kuitansi Pembayaran Terakhir"
                            className="p-1 text-slate-500 hover:text-emerald-700 rounded transition-colors"
                          >
                            <Receipt className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Riwayat Pembayaran Uang Tahunan */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h3 className="text-sm font-bold text-slate-900">
            Riwayat Pembayaran Uang Tahunan (Dengan Lampiran Bukti Transfer)
          </h3>
          <p className="text-xs text-slate-500">
            Daftar transaksi kas masuk uang tahunan dan cicilan yang telah diterima
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4 font-mono">No. Transaksi</th>
                <th className="py-2.5 px-4">Tanggal</th>
                <th className="py-2.5 px-4">Nama Siswa</th>
                <th className="py-2.5 px-4">Kelas</th>
                <th className="py-2.5 px-4 text-right">Nominal Bayar</th>
                <th className="py-2.5 px-4 text-right">Sisa Tagihan</th>
                <th className="py-2.5 px-4">Metode</th>
                <th className="py-2.5 px-4 text-center">Bukti Bayar</th>
                <th className="py-2.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {db.annualFeePayments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-6 text-center text-slate-400">
                    Belum ada riwayat pembayaran uang tahunan.
                  </td>
                </tr>
              ) : (
                db.annualFeePayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-mono font-medium text-slate-900">{p.noTransaksi}</td>
                    <td className="py-2.5 px-4 text-slate-600">{formatDateIndo(p.tanggalBayar)}</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900">{p.studentNama}</td>
                    <td className="py-2.5 px-4 text-slate-600">{p.kelasNama}</td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-800 tabular-nums">
                      {formatRupiah(p.nominalBayar)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums text-rose-700">
                      {formatRupiah(p.sisaSetelah)}
                    </td>
                    <td className="py-2.5 px-4 capitalize">{p.metodeBayar.replace('transfer_', 'Bank ').toUpperCase()}</td>
                    <td className="py-2.5 px-4 text-center">
                      {p.buktiPembayaranUrl ? (
                        <button
                          onClick={() => {
                            const win = window.open();
                            win?.document.write(`<img src="${p.buktiPembayaranUrl}" style="max-width:100%; height:auto;" />`);
                          }}
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-[10px] font-semibold border border-blue-200"
                        >
                          <ImageIcon className="w-3 h-3" />
                          <span>Lihat Bukti</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <button
                        onClick={() => onShowReceipt(p)}
                        className="p-1 text-emerald-700 hover:bg-emerald-50 rounded"
                        title="Cetak Kuitansi"
                      >
                        <Receipt className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL BAYAR / CICIL UANG TAHUNAN */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 bg-emerald-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm">Pembayaran Uang Tahunan Siswa</h3>
              </div>
              <button onClick={() => setIsPaymentModalOpen(false)} className="text-slate-300 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitPayment} className="p-5 space-y-4 text-xs">
              {paymentError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{paymentError}</span>
                </div>
              )}
              {paymentSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{paymentSuccess}</span>
                </div>
              )}

              {/* Student Select */}
              <div>
                <label className="font-bold text-slate-800 block mb-1">Pilih Siswa *</label>
                <select
                  value={paymentStudentId}
                  onChange={(e) => {
                    setPaymentStudentId(e.target.value);
                    const s = db.students.find((item) => item.id === e.target.value);
                    if (s) {
                      const b = db.annualFeeBills.find((item) => item.studentId === s.id);
                      setPaymentAmount(b ? b.sisaTagihan : totalAnnualFee);
                    }
                  }}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-800"
                >
                  {db.students.map((s) => {
                    const b = db.annualFeeBills.find((item) => item.studentId === s.id);
                    return (
                      <option key={s.id} value={s.id}>
                        {s.nis} - {s.nama} ({getClassName(s.kelasId)}) - Sisa: {formatRupiah(b?.sisaTagihan || 0)}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Amount input */}
              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Nominal Pembayaran (Rp) * (Bisa Lunas atau Dicicil)
                </label>
                <input
                  type="number"
                  min="10000"
                  step="10000"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-base font-bold text-emerald-800"
                />
                <div className="flex gap-2 mt-1.5">
                  <button
                    type="button"
                    onClick={() => setPaymentAmount(totalAnnualFee)}
                    className="text-[10px] bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded text-slate-700"
                  >
                    Bayar Lunas ({formatRupiah(totalAnnualFee)})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentAmount(1000000)}
                    className="text-[10px] bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded text-slate-700"
                  >
                    Cicil 1 Juta
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentAmount(500000)}
                    className="text-[10px] bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded text-slate-700"
                  >
                    Cicil 500rb
                  </button>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="font-bold text-slate-800 block mb-1">Metode Pembayaran *</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-medium"
                >
                  <option value="transfer_bri">Transfer Bank BRI (No. Rek: 646401042029535 a.n. SHOHIBUL KAHFI)</option>
                  <option value="tunai">Tunai / Kasir Sekolah</option>
                  <option value="transfer_bsi">Transfer BSI</option>
                  <option value="transfer_mandiri">Transfer Mandiri</option>
                  <option value="qris">QRIS Dinamis</option>
                </select>
              </div>

              {/* UPLOAD BUKTI PEMBAYARAN */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <label className="font-bold text-slate-800 block mb-1 flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-emerald-700" />
                  <span>Lampirkan Bukti Transfer / Pembayaran (Foto / Struk)</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-emerald-700 file:text-white hover:file:bg-emerald-800"
                />

                {proofImageBase64 && (
                  <div className="mt-2.5 flex items-center gap-3">
                    <img
                      src={proofImageBase64}
                      alt="Pratinjau Bukti"
                      className="w-16 h-16 object-cover rounded-lg border border-slate-300 shadow-2xs"
                    />
                    <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Bukti transfer berhasil dilampirkan!</span>
                      <button
                        type="button"
                        onClick={() => setProofImageBase64('')}
                        className="ml-2 text-rose-600 hover:underline"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Catatan */}
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Catatan Tambahan (Opsional)</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Contoh: Cicilan tahap 1 via BRI Mobile..."
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs shadow-2xs"
                >
                  Simpan Pembayaran & Buat Kuitansi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL UBAH NOMINAL KOMPONEN UANG TAHUNAN (ADMIN / KEPSEK) */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 bg-emerald-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm">Pengaturan Komponen Uang Tahunan</h3>
              </div>
              <button onClick={() => setIsConfigModalOpen(false)} className="text-slate-300 hover:text-white">
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <p className="text-slate-600">
                Ubah nominal masing-masing komponen uang tahunan sesuai keputusan Yayasan Insan Kamil:
              </p>

              <div className="space-y-3">
                {editingComponents.map((comp, idx) => (
                  <div key={comp.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <span className="font-semibold text-slate-800 block">{comp.nama}</span>
                    </div>
                    <div className="w-44">
                      <input
                        type="number"
                        step="10000"
                        value={comp.nominal}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setEditingComponents((prev) => {
                            const copy = [...prev];
                            copy[idx] = { ...copy[idx], nominal: val };
                            return copy;
                          });
                        }}
                        className="w-full p-1.5 font-mono text-xs font-bold text-emerald-800 bg-white border border-slate-300 rounded text-right"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Summary */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between font-bold text-emerald-900">
                <span>TOTAL UANG TAHUNAN BARU:</span>
                <span className="font-mono text-sm">{formatRupiah(editingTotal)}</span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsConfigModalOpen(false)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveConfig}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs shadow-2xs"
                >
                  Simpan Perubahan Nominal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
