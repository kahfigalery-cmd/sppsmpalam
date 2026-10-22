import React from 'react';
import { Printer, X, Download, CheckCircle2, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { Transaction, AnnualFeePayment } from '../types';
import { useApp } from '../context/AppContext';
import { formatDateIndo, formatRupiah, terbilang } from '../utils/formatters';

interface ReceiptModalProps {
  transaction: Transaction | AnnualFeePayment | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ transaction, onClose }) => {
  const { db } = useApp();

  if (!transaction) return null;

  const isAnnualFee = !('alokasiBulan' in transaction);
  const student = db.students.find((s) => s.id === transaction.studentId);
  const school = db.schoolProfile;

  const handlePrint = () => {
    window.print();
  };

  const methodNameMap: Record<string, string> = {
    tunai: 'Tunai / Kasir Sekolah',
    transfer_bri: 'Transfer Bank BRI (646401042029535 a.n. SHOHIBUL KAHFI)',
    transfer_bsi: 'Transfer Bank Syariah Indonesia (BSI)',
    transfer_mandiri: 'Transfer Bank Mandiri',
    qris: 'QRIS Dinamis'
  };

  const totalBayar = isAnnualFee
    ? (transaction as AnnualFeePayment).nominalBayar
    : (transaction as Transaction).totalBayar;

  const sisaBayar = isAnnualFee
    ? (transaction as AnnualFeePayment).sisaSetelah
    : (transaction as Transaction).alokasiBulan.reduce((sum, item) => sum + item.sisaSetelahAlokasi, 0);

  const proofUrl = transaction.buktiPembayaranUrl;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      {/* Container */}
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Modal Top Actions (Hidden in Print) */}
        <div className="no-print flex items-center justify-between px-5 py-3.5 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <h3 className="font-semibold text-sm">
              {isAnnualFee ? 'Bukti Kuitansi Pembayaran Uang Tahunan' : 'Bukti Kuitansi Pembayaran SPP Bulanan'}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Kuitansi</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              aria-label="Tutup kuitansi"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE RECEIPT CONTENT */}
        <div className="print-container p-6 sm:p-8 bg-white text-slate-800 font-sans">
          {/* School Kop Surat */}
          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4 mb-4 gap-4">
            <div className="w-20 h-20 shrink-0">
              <img
                src={school.logoUrl}
                alt="Logo SMP Alam Excellentia"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div className="text-center flex-1">
              <p className="text-xs uppercase tracking-widest font-bold text-slate-600">
                {school.yayasan}
              </p>
              <h1 className="text-xl sm:text-2xl font-black text-emerald-950 uppercase tracking-tight">
                {school.nama}
              </h1>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                NPSN: {school.npsn} · {school.alamat}
              </p>
              <p className="text-[11px] text-slate-500">
                Telp: {school.telepon} · Email: {school.email} · {school.rekeningInfo}
              </p>
            </div>
            <div className="w-20 hidden sm:block shrink-0" />
          </div>

          {/* Receipt Title & Meta */}
          <div className="text-center mb-6">
            <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-slate-900 inline-block border-b-2 border-emerald-700 pb-0.5">
              {isAnnualFee ? 'Kuitansi Pembayaran Uang Tahunan' : 'Kuitansi Pembayaran SPP'}
            </h2>
            <div className="flex items-center justify-center gap-4 mt-2 text-xs font-mono text-slate-600">
              <span>No. Kuitansi: <strong className="text-slate-900">{transaction.noTransaksi}</strong></span>
              <span>·</span>
              <span>Tahun Ajaran: <strong className="text-slate-900">2026/2027</strong></span>
              <span>·</span>
              <span>Tanggal: <strong className="text-slate-900">{formatDateIndo(transaction.tanggalBayar)}</strong></span>
            </div>
          </div>

          {/* Student Info Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 mb-5 text-xs">
            <div className="grid grid-cols-2 gap-y-2 gap-x-4">
              <div>
                <span className="text-slate-500">Nomor Induk Siswa (NIS):</span>
                <p className="font-bold text-slate-900 font-mono text-sm">{transaction.nis}</p>
              </div>
              <div>
                <span className="text-slate-500">Nama Lengkap Siswa:</span>
                <p className="font-bold text-slate-900 text-sm">{transaction.studentNama}</p>
              </div>
              <div>
                <span className="text-slate-500">Kelas:</span>
                <p className="font-semibold text-slate-900">{transaction.kelasNama}</p>
              </div>
              <div>
                <span className="text-slate-500">Nama Orang Tua / Wali:</span>
                <p className="font-semibold text-slate-900">{student?.namaWali || '-'}</p>
              </div>
            </div>
          </div>

          {/* Itemized Table */}
          {isAnnualFee ? (
            /* Uang Tahunan Component Details */
            <div className="space-y-3 mb-4">
              <table className="w-full text-xs border border-slate-300 rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-emerald-950 text-white text-left font-semibold">
                    <th className="py-2.5 px-3">No.</th>
                    <th className="py-2.5 px-3">Komponen Rincian Uang Tahunan</th>
                    <th className="py-2.5 px-3 text-right">Biaya Satuan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {db.annualFeeComponents.map((c, i) => (
                    <tr key={c.id}>
                      <td className="py-2 px-3 font-mono">{i + 1}</td>
                      <td className="py-2 px-3 font-medium">{c.nama}</td>
                      <td className="py-2 px-3 text-right font-mono tabular-nums">{formatRupiah(c.nominal)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-semibold border-t border-slate-300">
                    <td colSpan={2} className="py-2 px-3 text-right">Total Paket Uang Tahunan:</td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums font-bold">
                      {formatRupiah(db.annualFeeComponents.reduce((s, c) => s + c.nominal, 0))}
                    </td>
                  </tr>
                  <tr className="bg-emerald-50 border-t border-slate-300">
                    <td colSpan={2} className="py-2 px-3 text-right font-bold text-emerald-900 uppercase">
                      Nominal Pembayaran Diterima:
                    </td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums font-bold text-emerald-950 text-sm">
                      {formatRupiah(totalBayar)}
                    </td>
                  </tr>
                  {sisaBayar > 0 && (
                    <tr className="bg-rose-50 border-t border-slate-200">
                      <td colSpan={2} className="py-2 px-3 text-right font-bold text-rose-800">
                        Sisa Tagihan yang Belum Dibayar:
                      </td>
                      <td className="py-2 px-3 text-right font-mono tabular-nums font-bold text-rose-800">
                        {formatRupiah(sisaBayar)}
                      </td>
                    </tr>
                  )}
                </tfoot>
              </table>
            </div>
          ) : (
            /* SPP Monthly Details */
            <table className="w-full text-xs border border-slate-300 rounded-lg overflow-hidden mb-4">
              <thead>
                <tr className="bg-emerald-950 text-white text-left font-semibold">
                  <th className="py-2.5 px-3">No.</th>
                  <th className="py-2.5 px-3">Uraian Pembayaran SPP</th>
                  <th className="py-2.5 px-3">Tahun</th>
                  <th className="py-2.5 px-3 text-right">Tagihan</th>
                  <th className="py-2.5 px-3 text-right">Jumlah Dibayar</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {(transaction as Transaction).alokasiBulan.map((item, idx) => (
                  <tr key={item.billId} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-medium">SPP Bulan {item.bulan}</td>
                    <td className="py-2.5 px-3 font-mono">{item.tahun}</td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">{formatRupiah(item.nominalTagihan)}</td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-emerald-800">
                      {formatRupiah(item.nominalDialokasikan)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          item.statusSetelah === 'lunas'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {item.statusSetelah === 'lunas' ? 'Lunas' : 'Sebagian'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                {(transaction as Transaction).saldoKreditDihasilkan ? (
                  <tr className="bg-emerald-50/70 border-t border-slate-300">
                    <td colSpan={4} className="py-2 px-3 text-right font-medium text-emerald-900">
                      Kelebihan Bayar (Dicatat Saldo Kredit):
                    </td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums font-bold text-emerald-900">
                      +{formatRupiah((transaction as Transaction).saldoKreditDihasilkan)}
                    </td>
                    <td></td>
                  </tr>
                ) : null}
                <tr className="bg-slate-100 font-bold border-t-2 border-slate-400">
                  <td colSpan={4} className="py-2.5 px-3 text-right text-slate-900 uppercase">
                    Total Pembayaran Diterima:
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-sm text-emerald-950">
                    {formatRupiah(totalBayar)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          )}

          {/* Terbilang block */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs mb-4">
            <span className="text-slate-500 font-semibold block mb-0.5">Terbilang:</span>
            <p className="font-semibold italic text-slate-800 font-serif">
              "{terbilang(totalBayar)}"
            </p>
          </div>

          {/* Payment Notes & Remainder */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-slate-600 mb-6 bg-slate-50/50 p-2.5 rounded border border-slate-200">
            <div>
              <span>Metode Pembayaran: </span>
              <strong className="text-slate-800">{methodNameMap[transaction.metodeBayar] || transaction.metodeBayar}</strong>
              {transaction.catatan && (
                <p className="mt-0.5 text-slate-500">Catatan: {transaction.catatan}</p>
              )}
            </div>
            {sisaBayar > 0 && (
              <div className="text-amber-800 font-medium flex items-center gap-1">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Sisa Kewajiban: <strong>{formatRupiah(sisaBayar)}</strong></span>
              </div>
            )}
          </div>

          {/* Attached Proof Image if available */}
          {proofUrl && (
            <div className="mb-6 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
              <span className="font-bold text-slate-700 block mb-2 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-emerald-700" />
                <span>Lampiran Bukti Transfer / Pembayaran:</span>
              </span>
              <img
                src={proofUrl}
                alt="Bukti Transfer"
                className="max-h-48 rounded border border-slate-300 object-contain mx-auto"
              />
            </div>
          )}

          {/* Signature Zone */}
          <div className="grid grid-cols-2 gap-8 text-xs pt-4 text-center">
            <div>
              <p className="text-slate-500 mb-16">Wali Murid / Pembayar,</p>
              <div className="border-b border-slate-400 w-44 mx-auto mb-1"></div>
              <p className="font-semibold text-slate-800">{student?.namaWali || '( ................................... )'}</p>
            </div>
            <div>
              <p className="text-slate-500 mb-1">
                Pamekasan, {formatDateIndo(transaction.tanggalBayar)}
              </p>
              <p className="text-slate-500 mb-14">Bendahara / Petugas Penerima,</p>
              <div className="border-b border-slate-400 w-44 mx-auto mb-1"></div>
              <p className="font-bold text-slate-900">{transaction.petugasNama}</p>
              <p className="text-[10px] text-slate-500 font-mono">{school.yayasan}</p>
            </div>
          </div>

          {/* Footer note */}
          <div className="mt-8 pt-3 border-t border-slate-200 text-center text-[10px] text-slate-400">
            <p>Simpanlah kuitansi ini sebagai bukti pembayaran yang sah. Dicetak secara digital melalui Sistem Informasi Keuangan SMP Alam Excellentia Pamekasan.</p>
          </div>
        </div>

        {/* Modal Bottom (Hidden in Print) */}
        <div className="no-print p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Tip: Gunakan "Simpan sebagai PDF" pada dialog cetak untuk mengunduh kuitansi.
          </span>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Kuitansi</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
