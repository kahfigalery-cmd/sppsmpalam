import React, { useState, useMemo, useEffect } from 'react';
import {
  CreditCard,
  Search,
  CheckCircle2,
  AlertCircle,
  Receipt,
  User,
  History,
  RotateCcw,
  Edit3,
  Calendar,
  Wallet,
  Coins,
  ShieldAlert,
  ArrowRight,
  Image as ImageIcon,
  X
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Bill, PaymentMethod, Student, Transaction } from '../types';
import { formatRupiah, formatDateIndo, generateTransactionNo } from '../utils/formatters';

interface PaymentViewProps {
  preselectedStudent?: Student | null;
  onShowReceipt: (trx: Transaction) => void;
}

export const PaymentView: React.FC<PaymentViewProps> = ({
  preselectedStudent,
  onShowReceipt
}) => {
  const {
    db,
    currentUser,
    processPayment,
    correctTransaction,
    cancelTransaction
  } = useApp();

  // Student selection state
  const [selectedStudentId, setSelectedStudentId] = useState<string>(preselectedStudent?.id || '');
  const [studentSearch, setStudentSearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Bill selection state
  const [selectedBillIds, setSelectedBillIds] = useState<string[]>([]);
  const [nominalBayar, setNominalBayar] = useState<number>(0);
  const [metodeBayar, setMetodeBayar] = useState<PaymentMethod>('transfer_bri');
  const [catatan, setCatatan] = useState('');
  const [useCredit, setUseCredit] = useState(false);
  const [proofImageBase64, setProofImageBase64] = useState<string>('');

  // Feedback & Validation
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Transaction history filter
  const [historySearch, setHistorySearch] = useState('');
  const [filterMethod, setFilterMethod] = useState('all');

  // Transaction correction & cancellation modal
  const [correctingTrx, setCorrectingTrx] = useState<Transaction | null>(null);
  const [cancellingTrx, setCancellingTrx] = useState<Transaction | null>(null);
  const [reasonText, setReasonText] = useState('');
  const [newCorrectionMethod, setNewCorrectionMethod] = useState<PaymentMethod>('tunai');
  const [newCorrectionNotes, setNewCorrectionNotes] = useState('');
  const [previewProofUrl, setPreviewProofUrl] = useState<string | null>(null);

  // Synchronize if preselectedStudent changed
  useEffect(() => {
    if (preselectedStudent) {
      setSelectedStudentId(preselectedStudent.id);
      setStudentSearch(`${preselectedStudent.nis} - ${preselectedStudent.nama}`);
    }
  }, [preselectedStudent]);

  const selectedStudent = useMemo(() => {
    return db.students.find((s) => s.id === selectedStudentId);
  }, [db.students, selectedStudentId]);

  const selectedStudentClass = useMemo(() => {
    if (!selectedStudent) return '-';
    return db.classes.find((c) => c.id === selectedStudent.kelasId)?.nama || '-';
  }, [db.classes, selectedStudent]);

  // Student bills
  const studentBills = useMemo(() => {
    if (!selectedStudent) return [];
    return db.bills
      .filter((b) => b.studentId === selectedStudent.id)
      .sort((a, b) => a.urutanBulan - b.urutanBulan);
  }, [db.bills, selectedStudent]);

  // Filter students for search dropdown
  const searchedStudents = useMemo(() => {
    if (!studentSearch.trim()) return db.students.filter((s) => s.status === 'aktif').slice(0, 8);
    const q = studentSearch.toLowerCase();
    return db.students
      .filter(
        (s) =>
          s.status === 'aktif' &&
          (s.nama.toLowerCase().includes(q) || s.nis.toLowerCase().includes(q))
      )
      .slice(0, 8);
  }, [db.students, studentSearch]);

  // When student changes, auto-select the earliest unpaid bill
  const handleSelectStudent = (student: Student) => {
    setSelectedStudentId(student.id);
    setStudentSearch(`${student.nis} - ${student.nama}`);
    setIsDropdownOpen(false);
    setErrorMessage('');
    setSuccessMessage('');

    // Find first unpaid bill
    const bills = db.bills
      .filter((b) => b.studentId === student.id && b.status !== 'lunas')
      .sort((a, b) => a.urutanBulan - b.urutanBulan);

    if (bills.length > 0) {
      setSelectedBillIds([bills[0].id]);
      setNominalBayar(bills[0].sisaTagihan);
    } else {
      setSelectedBillIds([]);
      setNominalBayar(0);
    }
  };

  // Toggle bill selection
  const handleToggleBill = (billId: string) => {
    setErrorMessage('');
    setSelectedBillIds((prev) => {
      let next: string[];
      if (prev.includes(billId)) {
        next = prev.filter((id) => id !== billId);
      } else {
        next = [...prev, billId];
      }

      // Calculate total required for selected bills
      const totalRequired = studentBills
        .filter((b) => next.includes(b.id))
        .reduce((sum, b) => sum + b.sisaTagihan, 0);

      setNominalBayar(totalRequired);
      return next;
    });
  };

  // Total required for currently selected bills
  const totalSelectedRequired = useMemo(() => {
    return studentBills
      .filter((b) => selectedBillIds.includes(b.id))
      .reduce((sum, b) => sum + b.sisaTagihan, 0);
  }, [studentBills, selectedBillIds]);

  // Excess payment calculation (Saldo kredit)
  const excessCredit = useMemo(() => {
    if (nominalBayar > totalSelectedRequired && totalSelectedRequired > 0) {
      return nominalBayar - totalSelectedRequired;
    }
    return 0;
  }, [nominalBayar, totalSelectedRequired]);

  // Remainder calculation (Sisa tagihan jika bayar sebagian)
  const remainingShortage = useMemo(() => {
    if (nominalBayar < totalSelectedRequired) {
      return totalSelectedRequired - nominalBayar;
    }
    return 0;
  }, [nominalBayar, totalSelectedRequired]);

  // Handle submit payment
  const handleProcessPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!selectedStudent) {
      setErrorMessage('Pilih siswa terlebih dahulu.');
      return;
    }
    if (selectedBillIds.length === 0) {
      setErrorMessage('Pilih minimal satu bulan tagihan yang ingin dibayar.');
      return;
    }
    if (nominalBayar <= 0) {
      setErrorMessage('Nominal pembayaran harus lebih besar dari Rp 0.');
      return;
    }

    const result = processPayment({
      studentId: selectedStudent.id,
      selectedBillIds,
      nominalBayar,
      metodeBayar,
      catatan,
      useCreditBalance: useCredit,
      buktiPembayaranUrl: proofImageBase64 || undefined
    });

    if (!result.success) {
      setErrorMessage(result.error || 'Gagal memproses pembayaran.');
      return;
    }

    setSuccessMessage(
      `Pembayaran SPP sebesar ${formatRupiah(nominalBayar)} untuk ${selectedStudent.nama} berhasil dicatat!`
    );

    // Reset form for next payment
    setSelectedBillIds([]);
    setNominalBayar(0);
    setCatatan('');
    setProofImageBase64('');

    // Open receipt modal automatically
    if (result.transaction) {
      onShowReceipt(result.transaction);
    }
  };

  // Transaction History filtering
  const filteredTransactions = useMemo(() => {
    return db.transactions.filter((trx) => {
      const matchSearch =
        trx.noTransaksi.toLowerCase().includes(historySearch.toLowerCase()) ||
        trx.studentNama.toLowerCase().includes(historySearch.toLowerCase()) ||
        trx.nis.toLowerCase().includes(historySearch.toLowerCase());
      const matchMethod = filterMethod === 'all' || trx.metodeBayar === filterMethod;
      return matchSearch && matchMethod;
    });
  }, [db.transactions, historySearch, filterMethod]);

  // Handle Correction Submit
  const handleConfirmCorrection = () => {
    if (!correctingTrx) return;
    if (!reasonText.trim()) {
      alert('Alasan koreksi transaksi wajib dicatat.');
      return;
    }

    const res = correctTransaction(
      correctingTrx.id,
      newCorrectionMethod,
      newCorrectionNotes,
      reasonText.trim()
    );

    if (res.success) {
      setCorrectingTrx(null);
      setReasonText('');
    } else {
      alert(res.error);
    }
  };

  // Handle Cancellation Submit
  const handleConfirmCancellation = () => {
    if (!cancellingTrx) return;
    if (!reasonText.trim()) {
      alert('Alasan pembatalan transaksi wajib dicatat untuk jejak audit.');
      return;
    }

    const res = cancelTransaction(cancellingTrx.id, reasonText.trim());
    if (res.success) {
      setCancellingTrx(null);
      setReasonText('');
    } else {
      alert(res.error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Info */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Formulir Penerimaan Kas SPP
              </h3>
              <p className="text-xs text-slate-500">
                Petugas Penerima: <strong className="text-emerald-800">{currentUser.fullName}</strong>
              </p>
            </div>
          </div>
          <span className="text-xs font-mono bg-slate-100 px-2.5 py-1 rounded text-slate-700">
            SMP Alam Excellentia Pamekasan
          </span>
        </div>

        {errorMessage && (
          <div className="p-3 mb-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleProcessPayment} className="space-y-5">
          {/* Step 1: Select Student with Live Autocomplete */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              1. Pilih Siswa (Ketik NIS atau Nama) *
            </label>
            <div className="relative">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Ketik NIS atau nama siswa untuk mencari..."
                  value={studentSearch}
                  onFocus={() => setIsDropdownOpen(true)}
                  onChange={(e) => {
                    setStudentSearch(e.target.value);
                    setIsDropdownOpen(true);
                  }}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Autocomplete Dropdown */}
              {isDropdownOpen && (
                <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-52 overflow-y-auto divide-y divide-slate-100">
                  {searchedStudents.length === 0 ? (
                    <div className="p-3 text-xs text-slate-400 text-center">
                      Siswa tidak ditemukan.
                    </div>
                  ) : (
                    searchedStudents.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleSelectStudent(s)}
                        className="w-full text-left p-2.5 hover:bg-emerald-50 flex items-center justify-between text-xs transition-colors"
                      >
                        <div>
                          <p className="font-semibold text-slate-900">
                            {s.nama} ({s.nis})
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {db.classes.find((c) => c.id === s.kelasId)?.nama} · Wali: {s.namaWali}
                          </p>
                        </div>
                        {s.saldoKredit > 0 && (
                          <span className="text-[11px] font-mono text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                            Saldo: {formatRupiah(s.saldoKredit)}
                          </span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Selected Student Information Panel */}
            {selectedStudent && (
              <div className="mt-2.5 p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-200 text-emerald-900 flex items-center justify-center font-bold">
                    {selectedStudent.nama.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">
                      {selectedStudent.nama} <span className="font-mono font-normal">({selectedStudent.nis})</span>
                    </p>
                    <p className="text-[11px] text-slate-600">
                      Kelas: {selectedStudentClass} · Wali: {selectedStudent.namaWali} ({selectedStudent.noHpWali})
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {selectedStudent.saldoKredit > 0 && (
                    <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded border border-emerald-300 text-[11px]">
                      <Coins className="w-3.5 h-3.5 text-amber-500" />
                      <span>Saldo Lebih: <strong>{formatRupiah(selectedStudent.saldoKredit)}</strong></span>
                      <label className="ml-2 flex items-center gap-1 cursor-pointer font-medium text-emerald-800">
                        <input
                          type="checkbox"
                          checked={useCredit}
                          onChange={(e) => setUseCredit(e.target.checked)}
                          className="rounded text-emerald-600"
                        />
                        <span>Gunakan</span>
                      </label>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Choose Months (Multi-month supported) */}
          {selectedStudent && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-700">
                  2. Pilih Bulan Tagihan yang Ingin Dibayar (Bisa satu atau beberapa bulan sekaligus) *
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const unpaids = studentBills.filter((b) => b.status !== 'lunas').map((b) => b.id);
                      setSelectedBillIds(unpaids);
                      const total = studentBills.filter((b) => unpaids.includes(b.id)).reduce((s, b) => s + b.sisaTagihan, 0);
                      setNominalBayar(total);
                    }}
                    className="text-[11px] text-emerald-700 font-semibold hover:underline"
                  >
                    Pilih Semua Tunggakan
                  </button>
                  <span>·</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBillIds([]);
                      setNominalBayar(0);
                    }}
                    className="text-[11px] text-slate-500 hover:underline"
                  >
                    Batalkan Pilihan
                  </button>
                </div>
              </div>

              {/* Grid of Months */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                {studentBills.map((bill) => {
                  const isSelected = selectedBillIds.includes(bill.id);
                  const isPaid = bill.status === 'lunas';
                  const isPartial = bill.status === 'belum_lunas';

                  return (
                    <div
                      key={bill.id}
                      onClick={() => {
                        if (!isPaid) {
                          handleToggleBill(bill.id);
                        }
                      }}
                      className={`p-3 rounded-lg border text-xs transition-all relative select-none ${
                        isPaid
                          ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed opacity-75'
                          : isSelected
                          ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-950 cursor-pointer shadow-2xs'
                          : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800 cursor-pointer hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold">
                          {bill.bulan} {bill.tahun}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                            isPaid
                              ? 'bg-emerald-100 text-emerald-800'
                              : isPartial
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {isPaid ? 'Lunas' : isPartial ? 'Sebagian' : 'Belum'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between font-mono text-[11px]">
                        <span className="text-slate-500">Tagihan:</span>
                        <span>{formatRupiah(bill.nominalTagihan - bill.nominalDiskon)}</span>
                      </div>

                      {!isPaid && (
                        <div className="flex items-center justify-between font-mono text-[11px] mt-0.5">
                          <span className="text-slate-500">Sisa:</span>
                          <span className="font-bold text-rose-700">{formatRupiah(bill.sisaTagihan)}</span>
                        </div>
                      )}

                      {/* Checkbox indicator */}
                      {!isPaid && (
                        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-600">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            readOnly
                            className="rounded text-emerald-600 focus:ring-0"
                          />
                          <span>Pilih bulan ini</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 3: Payment Amount & Method */}
          {selectedStudent && selectedBillIds.length > 0 && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                3. Rincian dan Metode Pembayaran
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                {/* Total tagihan bulan terpilih */}
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block">Total Tagihan Terpilih:</span>
                  <span className="text-base font-bold font-mono text-slate-900 tabular-nums">
                    {formatRupiah(totalSelectedRequired)}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {selectedBillIds.length} bulan tagihan
                  </span>
                </div>

                {/* Input nominal yang dibayarkan */}
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <label className="text-slate-700 font-semibold block mb-1">
                    Nominal Dibayarkan (Rp) *
                  </label>
                  <input
                    type="number"
                    min="1000"
                    step="1000"
                    required
                    value={nominalBayar || ''}
                    onChange={(e) => setNominalBayar(Number(e.target.value))}
                    className="w-full p-1.5 font-mono text-sm font-bold text-emerald-800 bg-slate-50 border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500"
                  />
                  <div className="flex gap-1.5 mt-1.5">
                    <button
                      type="button"
                      onClick={() => setNominalBayar(totalSelectedRequired)}
                      className="text-[10px] bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded text-slate-700"
                    >
                      Pas ({formatRupiah(totalSelectedRequired)})
                    </button>
                    {totalSelectedRequired > 250000 && (
                      <button
                        type="button"
                        onClick={() => setNominalBayar(250000)}
                        className="text-[10px] bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded text-slate-700"
                      >
                        Cicil 250rb
                      </button>
                    )}
                  </div>
                </div>

                {/* Metode Pembayaran */}
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <label className="text-slate-700 font-semibold block mb-1">Metode Bayar *</label>
                  <select
                    value={metodeBayar}
                    onChange={(e) => setMetodeBayar(e.target.value as PaymentMethod)}
                    className="w-full p-1.5 text-xs bg-slate-50 border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 font-medium"
                  >
                    <option value="transfer_bri">Transfer Bank BRI (646401042029535 a.n. SHOHIBUL KAHFI)</option>
                    <option value="tunai">Tunai / Kasir Sekolah</option>
                    <option value="transfer_bsi">Transfer BSI (Bank Syariah)</option>
                    <option value="transfer_mandiri">Transfer Mandiri</option>
                    <option value="qris">QRIS Dinamis</option>
                  </select>
                </div>

                {/* Status Kalkulasi */}
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block">Status Perhitungan:</span>
                  {nominalBayar === totalSelectedRequired ? (
                    <p className="text-xs font-bold text-emerald-700 flex items-center gap-1 mt-1">
                      <CheckCircle2 className="w-4 h-4" />
                      LUNAS Tepat
                    </p>
                  ) : nominalBayar > totalSelectedRequired ? (
                    <div>
                      <p className="text-xs font-bold text-teal-700">Kelebihan Bayar</p>
                      <p className="text-[11px] text-teal-800 font-mono">
                        +{formatRupiah(excessCredit)} jadi Saldo Kredit
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs font-bold text-amber-700">Pembayaran Sebagian</p>
                      <p className="text-[11px] text-rose-700 font-mono">
                        Sisa tagihan: {formatRupiah(remainingShortage)}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* UPLOAD BUKTI PEMBAYARAN */}
              <div className="p-3 bg-white border border-slate-200 rounded-lg">
                <label className="font-bold text-slate-800 block mb-1">
                  Upload Bukti Pembayaran / Transfer (Foto / Struk Bank)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 2 * 1024 * 1024) {
                      alert('Ukuran berkas bukti maksimal 2MB.');
                      return;
                    }
                    const reader = new FileReader();
                    reader.onload = (uploadEv) => {
                      setProofImageBase64(uploadEv.target?.result as string);
                    };
                    reader.readAsDataURL(file);
                  }}
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-emerald-700 file:text-white hover:file:bg-emerald-800"
                />

                {proofImageBase64 && (
                  <div className="mt-2.5 flex items-center gap-3">
                    <img
                      src={proofImageBase64}
                      alt="Pratinjau Bukti Transfer"
                      className="w-14 h-14 object-cover rounded-lg border border-slate-300 shadow-2xs"
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

              {/* Catatan transaksi */}
              <div>
                <label className="text-xs text-slate-600 block mb-1">
                  Catatan Transaksi (Opsional):
                </label>
                <input
                  type="text"
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  placeholder="Contoh: Transfer via BRI Mobile / ATM..."
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg shadow-sm text-xs flex items-center gap-2 transition-colors"
                >
                  <Receipt className="w-4 h-4" />
                  <span>Simpan Pembayaran & Buat Kuitansi</span>
                </button>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Transaction History Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <History className="w-4 h-4 text-emerald-700" />
              <span>Daftar Riwayat Transaksi Pembayaran</span>
            </h3>
            <p className="text-xs text-slate-500">
              Seluruh transaksi tercatat secara permanen dengan nomor unik dan jejak audit
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari No. TRX / Nama..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>

            <select
              value={filterMethod}
              onChange={(e) => setFilterMethod(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-lg py-1.5 px-2"
            >
              <option value="all">Semua Metode</option>
              <option value="tunai">Tunai</option>
              <option value="transfer_bsi">BSI</option>
              <option value="transfer_mandiri">Mandiri</option>
              <option value="qris">QRIS</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4 font-mono">No. Transaksi</th>
                <th className="py-2.5 px-4">Tanggal</th>
                <th className="py-2.5 px-4">Siswa (NIS)</th>
                <th className="py-2.5 px-4">Kelas</th>
                <th className="py-2.5 px-4">Bulan Dibayar</th>
                <th className="py-2.5 px-4 text-right">Total Bayar</th>
                <th className="py-2.5 px-4">Metode</th>
                <th className="py-2.5 px-4 text-center">Status</th>
                <th className="py-2.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Tidak ditemukan riwayat transaksi yang cocok.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((trx) => (
                  <tr
                    key={trx.id}
                    className={`hover:bg-slate-50 transition-colors ${
                      trx.status === 'dibatalkan' ? 'bg-rose-50/40 text-slate-400' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-mono font-medium text-slate-900">
                      {trx.noTransaksi}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{formatDateIndo(trx.tanggalBayar)}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{trx.studentNama}</div>
                      <div className="text-[10px] font-mono text-slate-500">{trx.nis}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{trx.kelasNama}</td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {trx.alokasiBulan.map((a) => (
                          <span
                            key={a.billId}
                            className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-medium text-slate-700"
                          >
                            {a.bulan}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-800 tabular-nums">
                      {formatRupiah(trx.totalBayar)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="capitalize px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium">
                        {trx.metodeBayar.replace('transfer_', 'Bank ').toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          trx.status === 'berhasil'
                            ? 'bg-emerald-100 text-emerald-800'
                            : trx.status === 'dikoreksi'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800 line-through'
                        }`}
                      >
                        {trx.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {trx.buktiPembayaranUrl && (
                          <button
                            onClick={() => setPreviewProofUrl(trx.buktiPembayaranUrl || null)}
                            title="Lihat Bukti Transfer"
                            className="p-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md transition-colors"
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => onShowReceipt(trx)}
                          title="Cetak Kuitansi"
                          className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-md transition-colors"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                        </button>

                        {/* Admin-only correction and cancellation with audit trail */}
                        {currentUser.role === 'admin' && trx.status !== 'dibatalkan' && (
                          <>
                            <button
                              onClick={() => {
                                setCorrectingTrx(trx);
                                setNewCorrectionMethod(trx.metodeBayar);
                                setNewCorrectionNotes(trx.catatan || '');
                                setReasonText('');
                              }}
                              title="Koreksi Transaksi (Catat Jejak Audit)"
                              className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-md transition-colors"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => {
                                setCancellingTrx(trx);
                                setReasonText('');
                              }}
                              title="Batalkan Transaksi (Kembalikan Tagihan)"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          </>
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

      {/* MODAL KOREKSI TRANSAKSI (ADMIN ONLY) */}
      {correctingTrx && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 bg-amber-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Koreksi Transaksi: {correctingTrx.noTransaksi}</h3>
              <button onClick={() => setCorrectingTrx(null)} className="text-slate-300 hover:text-white">
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <p className="text-slate-600">
                Sesuai aturan audit keuangan, perubahan informasi transaksi akan dicatat dalam riwayat koreksi beserta nama administrator dan tanggal.
              </p>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Metode Pembayaran Baru</label>
                <select
                  value={newCorrectionMethod}
                  onChange={(e) => setNewCorrectionMethod(e.target.value as PaymentMethod)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                >
                  <option value="tunai">Tunai / Kasir Sekolah</option>
                  <option value="transfer_bsi">Transfer BSI</option>
                  <option value="transfer_mandiri">Transfer Mandiri</option>
                  <option value="transfer_bri">Transfer BRI</option>
                  <option value="qris">QRIS</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Catatan Tambahan</label>
                <input
                  type="text"
                  value={newCorrectionNotes}
                  onChange={(e) => setNewCorrectionNotes(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-rose-700 block mb-1">
                  Alasan Koreksi (Wajib Diisi untuk Jejak Audit) *
                </label>
                <textarea
                  rows={3}
                  required
                  value={reasonText}
                  onChange={(e) => setReasonText(e.target.value)}
                  placeholder="Contoh: Koreksi salah pilih metode kasir dari tunai menjadi transfer BSI..."
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setCorrectingTrx(null)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCorrection}
                  className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white font-semibold rounded-lg text-xs"
                >
                  Simpan Koreksi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PEMBATALAN TRANSAKSI (ADMIN ONLY) */}
      {cancellingTrx && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-rose-200 overflow-hidden">
            <div className="px-5 py-4 bg-rose-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-300" />
                <h3 className="font-bold text-sm">Pembatalan Transaksi Keuangan</h3>
              </div>
              <button onClick={() => setCancellingTrx(null)} className="text-slate-300 hover:text-white">
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800">
                <p className="font-bold mb-1">Peringatan Penghapusan Transaksi:</p>
                <p>
                  Membatalkan transaksi <strong>{cancellingTrx.noTransaksi}</strong> senilai{' '}
                  <strong>{formatRupiah(cancellingTrx.totalBayar)}</strong> akan mengembalikan seluruh status tagihan bulan siswa ke kondisi belum bayar / belum lunas.
                </p>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Alasan Pembatalan (Wajib dicatat dalam Audit Log) *
                </label>
                <textarea
                  rows={3}
                  required
                  value={reasonText}
                  onChange={(e) => setReasonText(e.target.value)}
                  placeholder="Contoh: Terjadi kesalahan input ganda oleh petugas kasir..."
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setCancellingTrx(null)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs"
                >
                  Kembali
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCancellation}
                  className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded-lg text-xs"
                >
                  Konfirmasi Batalkan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal Bukti Transfer */}
      {previewProofUrl && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold">Bukti Pembayaran / Struk Transfer</span>
              </div>
              <button
                onClick={() => setPreviewProofUrl(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 bg-slate-100 flex items-center justify-center max-h-[70vh] overflow-auto">
              <img
                src={previewProofUrl}
                alt="Bukti Transfer"
                className="max-w-full h-auto object-contain rounded-lg shadow-sm border border-slate-300"
              />
            </div>
            <div className="p-3 bg-white border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setPreviewProofUrl(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
