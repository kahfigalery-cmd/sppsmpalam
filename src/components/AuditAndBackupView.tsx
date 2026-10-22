import React, { useState } from 'react';
import {
  ShieldCheck,
  Download,
  Upload,
  RotateCcw,
  Building,
  Save,
  CheckCircle,
  AlertTriangle,
  History,
  Lock,
  FileCode
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatDateTimeIndo } from '../utils/formatters';

export const AuditAndBackupView: React.FC = () => {
  const {
    db,
    currentUser,
    exportDatabaseJSON,
    importDatabaseJSON,
    resetDatabase,
    updateSchoolProfile
  } = useApp();

  const [schoolForm, setSchoolForm] = useState(db.schoolProfile);
  const [saveProfileSuccess, setSaveProfileSuccess] = useState(false);
  const [restoreJsonInput, setRestoreJsonInput] = useState('');
  const [restoreMessage, setRestoreMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Handle Download JSON
  const handleDownloadBackup = () => {
    const jsonStr = exportDatabaseJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_spp_smp_alam_excellentia_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Handle Restore
  const handleRestoreSubmit = () => {
    if (!restoreJsonInput.trim()) {
      setRestoreMessage({ type: 'error', text: 'Tempelkan data JSON cadangan terlebih dahulu.' });
      return;
    }

    const success = importDatabaseJSON(restoreJsonInput.trim());
    if (success) {
      setRestoreMessage({ type: 'success', text: 'Database berhasil dipulihkan dari berkas cadangan!' });
      setRestoreJsonInput('');
    } else {
      setRestoreMessage({ type: 'error', text: 'Format berkas cadangan tidak valid atau rusak.' });
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateSchoolProfile(schoolForm);
    setSaveProfileSuccess(true);
    setTimeout(() => setSaveProfileSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Backup and Restore Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Backup Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Cadangkan Database (Backup)</h3>
              <p className="text-xs text-slate-500">
                Unduh seluruh data siswa, tagihan, transaksi, dan jejak audit dalam format JSON
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-600">
            Cadangan berkala memastikan data keuangan sekolah terlindungi dari kehilangan dan dapat dipulihkan sewaktu-waktu.
          </p>

          <button
            onClick={handleDownloadBackup}
            className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2 shadow-2xs transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Unduh Cadangan Database (.JSON)</span>
          </button>
        </div>

        {/* Restore Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 text-blue-800 rounded-lg">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Pemulihan Data (Restore)</h3>
              <p className="text-xs text-slate-500">
                Pulihkan sistem dari berkas cadangan JSON yang telah diunduh sebelumnya
              </p>
            </div>
          </div>

          {restoreMessage && (
            <div
              className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                restoreMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {restoreMessage.type === 'success' ? (
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              )}
              <span>{restoreMessage.text}</span>
            </div>
          )}

          <textarea
            rows={2}
            value={restoreJsonInput}
            onChange={(e) => setRestoreJsonInput(e.target.value)}
            placeholder="Tempelkan isi berkas JSON cadangan di sini..."
            className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-blue-500"
          />

          <button
            onClick={handleRestoreSubmit}
            className="w-full py-2 px-4 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg text-xs flex items-center justify-center gap-2 shadow-2xs transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>Pulihkan Database</span>
          </button>
        </div>
      </div>

      {/* School Profile & Kop Surat Settings */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-emerald-700" />
            <h3 className="font-bold text-sm text-slate-900">
              Identitas Sekolah & Kop Surat Resmi
            </h3>
          </div>
          {saveProfileSuccess && (
            <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" />
              Tersimpan!
            </span>
          )}
        </div>

        <form onSubmit={handleSaveProfile} className="p-5 space-y-4 text-xs">
          {/* Logo Preview & Path */}
          <div className="p-3.5 bg-emerald-50/60 border border-emerald-200/80 rounded-xl flex flex-col sm:flex-row items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-white p-1 border border-emerald-300 shadow-xs shrink-0">
              <img
                src={schoolForm.logoUrl}
                alt="Logo Resmi SMP Alam Excellentia"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div className="flex-1 min-w-0 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="font-bold text-slate-900 text-xs">Logo Resmi Sekolah Terpasang</span>
                <span className="px-1.5 py-0.2 rounded bg-emerald-700 text-white text-[10px] font-semibold">Aktif</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Logo ini digunakan pada header, sidebar, kuitansi bukti pembayaran resmi, dan kop laporan keuangan.
              </p>
              <input
                type="text"
                value={schoolForm.logoUrl}
                onChange={(e) => setSchoolForm({ ...schoolForm, logoUrl: e.target.value })}
                className="mt-1.5 w-full p-1.5 bg-white border border-slate-300 rounded font-mono text-[11px] text-slate-700"
                placeholder="Path logo (/assets/...)"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Nama Satuan Pendidikan *</label>
              <input
                type="text"
                required
                value={schoolForm.nama}
                onChange={(e) => setSchoolForm({ ...schoolForm, nama: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Yayasan Penyelenggara *</label>
              <input
                type="text"
                required
                value={schoolForm.yayasan}
                onChange={(e) => setSchoolForm({ ...schoolForm, yayasan: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">NPSN Sekolah *</label>
              <input
                type="text"
                required
                value={schoolForm.npsn}
                onChange={(e) => setSchoolForm({ ...schoolForm, npsn: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Nomor Telepon</label>
              <input
                type="text"
                value={schoolForm.telepon}
                onChange={(e) => setSchoolForm({ ...schoolForm, telepon: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Email Resmi</label>
              <input
                type="email"
                value={schoolForm.email}
                onChange={(e) => setSchoolForm({ ...schoolForm, email: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Alamat Lengkap</label>
            <input
              type="text"
              value={schoolForm.alamat}
              onChange={(e) => setSchoolForm({ ...schoolForm, alamat: e.target.value })}
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Kepala Sekolah</label>
              <input
                type="text"
                value={schoolForm.kepalaSekolah}
                onChange={(e) => setSchoolForm({ ...schoolForm, kepalaSekolah: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Bendahara Sekolah</label>
              <input
                type="text"
                value={schoolForm.bendahara}
                onChange={(e) => setSchoolForm({ ...schoolForm, bendahara: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Rekening Kas Resmi Pembayaran SPP</label>
            <input
              type="text"
              value={schoolForm.rekeningInfo}
              onChange={(e) => setSchoolForm({ ...schoolForm, rekeningInfo: e.target.value })}
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Profil Sekolah</span>
            </button>
          </div>
        </form>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-700" />
            <h3 className="font-bold text-sm text-slate-900">Jejak Audit Aktivitas Pengguna</h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {db.auditLogs.length} Aktivitas Tercatat
          </span>
        </div>

        <div className="overflow-x-auto max-h-80 overflow-y-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <th className="py-2.5 px-4">Waktu</th>
                <th className="py-2.5 px-4">Pengguna</th>
                <th className="py-2.5 px-4">Peran</th>
                <th className="py-2.5 px-4">Aksi</th>
                <th className="py-2.5 px-4">Detail Peristiwa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {db.auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-4 font-mono text-slate-500 whitespace-nowrap">
                    {formatDateTimeIndo(log.timestamp)}
                  </td>
                  <td className="py-2.5 px-4 font-semibold text-slate-900">{log.userNama}</td>
                  <td className="py-2.5 px-4 uppercase text-[10px] font-bold text-slate-600">
                    {log.role}
                  </td>
                  <td className="py-2.5 px-4 font-medium text-emerald-900">{log.aksi}</td>
                  <td className="py-2.5 px-4 text-slate-700">{log.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
