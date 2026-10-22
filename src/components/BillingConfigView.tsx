import React, { useState } from 'react';
import {
  BadgePercent,
  Plus,
  Trash2,
  Calendar,
  Save,
  CheckCircle,
  HelpCircle,
  Award,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Discount, FeeTariff } from '../types';
import { formatRupiah, formatDateIndo } from '../utils/formatters';

export const BillingConfigView: React.FC = () => {
  const { db, updateTariffs, addDiscount, deleteDiscount, currentUser } = useApp();

  const [tariffs, setTariffs] = useState<FeeTariff[]>(db.tariffs);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // New scholarship modal state
  const [isAddDiscountModalOpen, setIsAddDiscountModalOpen] = useState(false);
  const [newDiscData, setNewDiscData] = useState({
    studentId: db.students[0]?.id || '',
    jenis: 'prestasi' as Discount['jenis'],
    tipe: 'persen' as Discount['tipe'],
    nilai: 50,
    nomorSk: 'SK-YAYASAN/2025/',
    keterangan: '',
    disetujuiOleh: currentUser.fullName
  });

  const handleTariffChange = (idx: number, field: keyof FeeTariff, val: any) => {
    setTariffs((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  const handleSaveTariffs = () => {
    updateTariffs(tariffs);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleCreateDiscount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDiscData.keterangan.trim()) {
      alert('Keterangan beasiswa / keringanan wajib diisi.');
      return;
    }

    addDiscount({
      studentId: newDiscData.studentId,
      jenis: newDiscData.jenis,
      tipe: newDiscData.tipe,
      nilai: Number(newDiscData.nilai),
      nomorSk: newDiscData.nomorSk.trim(),
      keterangan: newDiscData.keterangan.trim(),
      disetujuiOleh: newDiscData.disetujuiOleh,
      tanggalMulai: new Date().toISOString().split('T')[0],
      aktif: true
    });

    setIsAddDiscountModalOpen(false);
    setNewDiscData({
      studentId: db.students[0]?.id || '',
      jenis: 'prestasi',
      tipe: 'persen',
      nilai: 50,
      nomorSk: 'SK-YAYASAN/2025/',
      keterangan: '',
      disetujuiOleh: currentUser.fullName
    });
  };

  return (
    <div className="space-y-6">
      {/* Tariff Rules Notice */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-900 flex items-start gap-3">
        <HelpCircle className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-sm">Kebijakan Tarif & Integritas Riwayat Keuangan</p>
          <p className="text-emerald-800 mt-0.5">
            Perubahan nominal SPP di bawah ini berlaku untuk penagihan masa depan dan tidak akan merubah transaksi historis yang telah lunas. Seluruh penetapan keringanan & beasiswa harus disertai nomor SK Yayasan yang sah.
          </p>
        </div>
      </div>

      {/* Standard Tariffs per Class Level */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Tarif Standar SPP Bulanan per Jenjang (T.A. 2025/2026)
            </h3>
            <p className="text-xs text-slate-500">
              Tarif dasar reguler per jenjang kelas dan batas tanggal jatuh tempo
            </p>
          </div>

          <button
            onClick={handleSaveTariffs}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Perubahan Tarif</span>
          </button>
        </div>

        {saveSuccess && (
          <div className="p-3 mx-4 my-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>Pembaruan tarif SPP berhasil disimpan dan dicatat dalam jejak audit!</span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Jenjang Kelas</th>
                <th className="py-2.5 px-4">Nominal SPP Bulanan (Rp)</th>
                <th className="py-2.5 px-4">Tanggal Jatuh Tempo</th>
                <th className="py-2.5 px-4">Tanggal Berlaku</th>
                <th className="py-2.5 px-4">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tariffs.map((t, idx) => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-bold text-slate-900">
                    Kelas {t.tingkat} (SMP)
                  </td>
                  <td className="py-3 px-4">
                    <input
                      type="number"
                      step="5000"
                      value={t.nominalDefault}
                      onChange={(e) => handleTariffChange(idx, 'nominalDefault', Number(e.target.value))}
                      className="p-1.5 font-mono text-sm font-bold text-emerald-800 bg-slate-50 border border-slate-300 rounded w-44 focus:ring-2 focus:ring-emerald-500"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500 text-xs">Setiap tgl</span>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={t.tanggalJatuhTempo}
                        onChange={(e) => handleTariffChange(idx, 'tanggalJatuhTempo', Number(e.target.value))}
                        className="p-1.5 font-mono text-xs font-semibold bg-slate-50 border border-slate-300 rounded w-16 text-center"
                      />
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600">{t.berlakuMulai}</td>
                  <td className="py-3 px-4">
                    <input
                      type="text"
                      value={t.keterangan || ''}
                      onChange={(e) => handleTariffChange(idx, 'keterangan', e.target.value)}
                      className="p-1.5 text-xs bg-slate-50 border border-slate-300 rounded w-full max-w-sm"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Scholarship & Discounts Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-700" />
              <span>Daftar Keringanan, Subsidi & Beasiswa Siswa</span>
            </h3>
            <p className="text-xs text-slate-500">
              Keringanan beasiswa tahfidz, yatim dhuafa, dan anak guru/tenaga pendidik
            </p>
          </div>

          <button
            onClick={() => setIsAddDiscountModalOpen(true)}
            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Keringanan / Beasiswa</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Nama Siswa</th>
                <th className="py-2.5 px-4">Jenis Beasiswa</th>
                <th className="py-2.5 px-4">Bentuk Keringanan</th>
                <th className="py-2.5 px-4">Nomor SK Yayasan</th>
                <th className="py-2.5 px-4">Keterangan</th>
                <th className="py-2.5 px-4">Disetujui Oleh</th>
                <th className="py-2.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {db.discounts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400">
                    Belum ada data beasiswa yang tercatat.
                  </td>
                </tr>
              ) : (
                db.discounts.map((d) => {
                  const student = db.students.find((s) => s.id === d.studentId);
                  return (
                    <tr key={d.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {student?.nama || d.studentNama || d.studentId}
                      </td>
                      <td className="py-3 px-4">
                        <span className="capitalize px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold text-[11px]">
                          {d.jenis.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-700 tabular-nums">
                        {d.tipe === 'persen' ? `Diskon ${d.nilai}%` : `Potongan ${formatRupiah(d.nilai)}`}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">{d.nomorSk || '-'}</td>
                      <td className="py-3 px-4 text-slate-700">{d.keterangan}</td>
                      <td className="py-3 px-4 text-slate-600">{d.disetujuiOleh}</td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => {
                            if (window.confirm(`Hapus beasiswa untuk siswa ini?`)) {
                              deleteDiscount(d.id);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                          title="Hapus Keringanan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL TAMBAH BEASISWA */}
      {isAddDiscountModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 bg-emerald-950 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Pemberian Keringanan / Beasiswa SPP</h3>
              <button
                onClick={() => setIsAddDiscountModalOpen(false)}
                className="text-slate-300 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDiscount} className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-medium text-slate-700 block mb-1">Pilih Siswa *</label>
                <select
                  value={newDiscData.studentId}
                  onChange={(e) => setNewDiscData({ ...newDiscData, studentId: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                >
                  {db.students
                    .filter((s) => s.status === 'aktif')
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nis} - {s.nama} ({db.classes.find((c) => c.id === s.kelasId)?.nama})
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Jenis Beasiswa *</label>
                  <select
                    value={newDiscData.jenis}
                    onChange={(e) =>
                      setNewDiscData({ ...newDiscData, jenis: e.target.value as Discount['jenis'] })
                    }
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="prestasi">Prestasi / Tahfidz</option>
                    <option value="yatim_dhuafa">Yatim / Dhuafa</option>
                    <option value="anak_guru">Anak Guru / Pendidik</option>
                    <option value="keringanan_khusus">Keringanan Khusus</option>
                  </select>
                </div>

                <div>
                  <label className="font-medium text-slate-700 block mb-1">Tipe Potongan *</label>
                  <select
                    value={newDiscData.tipe}
                    onChange={(e) =>
                      setNewDiscData({ ...newDiscData, tipe: e.target.value as Discount['tipe'] })
                    }
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="persen">Persentase (%)</option>
                    <option value="nominal">Nominal Tetap (Rp)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">
                  Nilai Potongan ({newDiscData.tipe === 'persen' ? '%' : 'Rp'}) *
                </label>
                <input
                  type="number"
                  required
                  value={newDiscData.nilai}
                  onChange={(e) => setNewDiscData({ ...newDiscData, nilai: Number(e.target.value) })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-sm"
                  placeholder={newDiscData.tipe === 'persen' ? '50' : '100000'}
                />
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">Nomor SK Yayasan *</label>
                <input
                  type="text"
                  required
                  value={newDiscData.nomorSk}
                  onChange={(e) => setNewDiscData({ ...newDiscData, nomorSk: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-xs"
                  placeholder="SK-YAYASAN/2025/..."
                />
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">Alasan / Keterangan *</label>
                <textarea
                  rows={2}
                  required
                  value={newDiscData.keterangan}
                  onChange={(e) => setNewDiscData({ ...newDiscData, keterangan: e.target.value })}
                  placeholder="Contoh: Beasiswa Tahfidz Al-Qur'an 10 Juz bersertifikat..."
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddDiscountModalOpen(false)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg text-xs"
                >
                  Tetapkan Keringanan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
