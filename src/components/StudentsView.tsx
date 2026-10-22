import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Download,
  Upload,
  Eye,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  UserCheck,
  CreditCard,
  Phone,
  FileSpreadsheet,
  AlertCircle,
  GraduationCap
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Student, Gender, StudentStatus, Bill } from '../types';
import { formatRupiah, formatDateIndo } from '../utils/formatters';

interface StudentsViewProps {
  onQuickPayForStudent: (student: Student) => void;
}

export const StudentsView: React.FC<StudentsViewProps> = ({ onQuickPayForStudent }) => {
  const { db, currentUser, addStudent, updateStudent, toggleStudentStatus } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('all');
  const [filterStatus, setFilterStatus] = useState<'all' | StudentStatus>('aktif');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [detailStudent, setDetailStudent] = useState<Student | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [formError, setFormError] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    nis: '',
    nama: '',
    jenisKelamin: 'L' as Gender,
    kelasId: db.classes[0]?.id || '',
    tahunMasuk: 2026,
    namaWali: '',
    noHpWali: '',
    alamat: '',
    nominalSppKhusus: 0,
    status: 'aktif' as StudentStatus,
    keterangan: ''
  });

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return db.students.filter((s) => {
      const matchSearch =
        s.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.nis.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.namaWali.toLowerCase().includes(searchTerm.toLowerCase());
      const matchClass = filterClass === 'all' || s.kelasId === filterClass;
      const matchStatus = filterStatus === 'all' || s.status === filterStatus;
      return matchSearch && matchClass && matchStatus;
    });
  }, [db.students, searchTerm, filterClass, filterStatus]);

  const handleOpenAdd = () => {
    const nextNis = `202507${String(db.students.length + 1).padStart(3, '0')}`;
    setFormData({
      nis: nextNis,
      nama: '',
      jenisKelamin: 'L',
      kelasId: db.classes[0]?.id || '',
      tahunMasuk: 2025,
      namaWali: '',
      noHpWali: '',
      alamat: '',
      nominalSppKhusus: 0,
      status: 'aktif',
      keterangan: ''
    });
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      nis: student.nis,
      nama: student.nama,
      jenisKelamin: student.jenisKelamin,
      kelasId: student.kelasId,
      tahunMasuk: student.tahunMasuk,
      namaWali: student.namaWali,
      noHpWali: student.noHpWali,
      alamat: student.alamat,
      nominalSppKhusus: student.nominalSppKhusus || 0,
      status: student.status,
      keterangan: student.keterangan || ''
    });
    setFormError('');
  };

  const handleSubmitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nis.trim() || !formData.nama.trim()) {
      setFormError('NIS dan Nama Siswa wajib diisi.');
      return;
    }

    const res = addStudent({
      nis: formData.nis.trim(),
      nama: formData.nama.trim(),
      jenisKelamin: formData.jenisKelamin,
      kelasId: formData.kelasId,
      tahunMasuk: Number(formData.tahunMasuk) || 2025,
      namaWali: formData.namaWali.trim(),
      noHpWali: formData.noHpWali.trim(),
      alamat: formData.alamat.trim(),
      nominalSppKhusus: formData.nominalSppKhusus > 0 ? Number(formData.nominalSppKhusus) : undefined,
      status: formData.status,
      keterangan: formData.keterangan
    });

    if (!res.success) {
      setFormError(res.message || 'Gagal menambahkan siswa.');
      return;
    }

    setIsAddModalOpen(false);
  };

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    if (!formData.nis.trim() || !formData.nama.trim()) {
      setFormError('NIS dan Nama Siswa wajib diisi.');
      return;
    }

    const res = updateStudent(editingStudent.id, {
      nis: formData.nis.trim(),
      nama: formData.nama.trim(),
      jenisKelamin: formData.jenisKelamin,
      kelasId: formData.kelasId,
      tahunMasuk: Number(formData.tahunMasuk) || 2025,
      namaWali: formData.namaWali.trim(),
      noHpWali: formData.noHpWali.trim(),
      alamat: formData.alamat.trim(),
      nominalSppKhusus: formData.nominalSppKhusus > 0 ? Number(formData.nominalSppKhusus) : undefined,
      status: formData.status,
      keterangan: formData.keterangan
    });

    if (!res.success) {
      setFormError(res.message || 'Gagal memperbarui siswa.');
      return;
    }

    setEditingStudent(null);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'NIS',
      'Nama Siswa',
      'Jenis Kelamin',
      'Kelas',
      'Tahun Masuk',
      'Nama Wali',
      'No HP Wali',
      'Alamat',
      'Status Siswa',
      'Saldo Kredit'
    ];

    const rows = filteredStudents.map((s) => {
      const cls = db.classes.find((c) => c.id === s.kelasId)?.nama || '';
      return [
        `"${s.nis}"`,
        `"${s.nama}"`,
        s.jenisKelamin,
        `"${cls}"`,
        s.tahunMasuk,
        `"${s.namaWali}"`,
        `"${s.noHpWali}"`,
        `"${s.alamat}"`,
        s.status,
        s.saldoKredit || 0
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `data_siswa_smp_alam_excellentia_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle CSV Import
  const handleImportSubmit = () => {
    if (!importText.trim()) return;
    const lines = importText.trim().split('\n');
    let importedCount = 0;
    let failedCount = 0;

    lines.forEach((line, idx) => {
      if (idx === 0 && line.toLowerCase().includes('nis')) return; // skip header
      const parts = line.split(',').map((p) => p.replace(/"/g, '').trim());
      if (parts.length >= 4) {
        const [nis, nama, jk, className, wali, hp, alamat] = parts;
        const matchedClass = db.classes.find((c) => c.nama.toLowerCase().includes(className.toLowerCase())) || db.classes[0];
        const res = addStudent({
          nis: nis || `202507${Math.floor(100 + Math.random() * 900)}`,
          nama: nama || 'Siswa Baru',
          jenisKelamin: jk === 'P' ? 'P' : 'L',
          kelasId: matchedClass.id,
          tahunMasuk: 2025,
          namaWali: wali || 'Orang Tua',
          noHpWali: hp || '081234567890',
          alamat: alamat || 'Pamekasan',
          status: 'aktif'
        });
        if (res.success) importedCount++;
        else failedCount++;
      }
    });

    alert(`Impor selesai: ${importedCount} siswa berhasil ditambahkan, ${failedCount} gagal/duplikat.`);
    setIsImportModalOpen(false);
    setImportText('');
  };

  const getClassName = (kelasId: string) => {
    return db.classes.find((c) => c.id === kelasId)?.nama || '-';
  };

  // Student bills for detail view
  const detailStudentBills = useMemo(() => {
    if (!detailStudent) return [];
    return db.bills
      .filter((b) => b.studentId === detailStudent.id)
      .sort((a, b) => a.urutanBulan - b.urutanBulan);
  }, [db.bills, detailStudent]);

  // Student discounts for detail view
  const detailStudentDiscounts = useMemo(() => {
    if (!detailStudent) return [];
    return db.discounts.filter((d) => d.studentId === detailStudent.id);
  }, [db.discounts, detailStudent]);

  return (
    <div className="space-y-5">
      {/* Action and Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari berdasarkan NIS, Nama Siswa, atau Wali..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
          />
        </div>

        {/* Filter dropdowns & Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-300 rounded-lg py-2 px-2.5 text-slate-700 focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">Semua Kelas</option>
            {db.classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nama}
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="text-xs bg-slate-50 border border-slate-300 rounded-lg py-2 px-2.5 text-slate-700 focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">Semua Status</option>
            <option value="aktif">Aktif</option>
            <option value="tidak_aktif">Tidak Aktif</option>
            <option value="lulus">Lulus</option>
            <option value="pindah">Pindah</option>
          </select>

          {/* Export & Import buttons */}
          <button
            onClick={handleExportCSV}
            title="Ekspor ke Excel / CSV"
            className="px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden md:inline">Ekspor CSV</span>
          </button>

          {currentUser.role === 'admin' && (
            <>
              <button
                onClick={() => setIsImportModalOpen(true)}
                title="Impor Siswa dari CSV"
                className="px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors"
              >
                <Upload className="w-3.5 h-3.5 text-slate-600" />
                <span className="hidden md:inline">Impor CSV</span>
              </button>

              <button
                onClick={handleOpenAdd}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Siswa</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Students Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 font-mono">NIS</th>
                <th className="py-3 px-4">Nama Lengkap</th>
                <th className="py-3 px-3">L/P</th>
                <th className="py-3 px-4">Kelas</th>
                <th className="py-3 px-4">Orang Tua / Wali</th>
                <th className="py-3 px-4">No. HP / WhatsApp</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Saldo Kredit</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Tidak ditemukan data siswa yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-slate-900">{s.nis}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{s.nama}</div>
                      {s.nominalSppKhusus && (
                        <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                          Tarif Khusus: {formatRupiah(s.nominalSppKhusus)}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          s.jenisKelamin === 'L' ? 'bg-blue-50 text-blue-700' : 'bg-pink-50 text-pink-700'
                        }`}
                      >
                        {s.jenisKelamin}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700">{getClassName(s.kelasId)}</td>
                    <td className="py-3 px-4 text-slate-600">{s.namaWali}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{s.noHpWali}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
                          s.status === 'aktif'
                            ? 'bg-emerald-100 text-emerald-800'
                            : s.status === 'lulus'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {s.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums">
                      {s.saldoKredit > 0 ? (
                        <span className="text-emerald-700 font-bold">
                          +{formatRupiah(s.saldoKredit)}
                        </span>
                      ) : (
                        <span className="text-slate-400">Rp 0</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setDetailStudent(s)}
                          title="Lihat Kartu SPP & Detail Siswa"
                          className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {currentUser.role !== 'kepsek' && (
                          <button
                            onClick={() => onQuickPayForStudent(s)}
                            title="Bayar SPP Siswa Ini"
                            className="p-1.5 text-emerald-700 hover:text-white hover:bg-emerald-700 rounded-md transition-colors"
                          >
                            <CreditCard className="w-4 h-4" />
                          </button>
                        )}

                        {currentUser.role === 'admin' && (
                          <>
                            <button
                              onClick={() => handleOpenEdit(s)}
                              title="Edit Data Siswa"
                              className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            {s.status === 'aktif' ? (
                              <button
                                onClick={() => {
                                  if (window.confirm(`Nonaktifkan siswa "${s.nama}"? Data pembayaran lama akan tetap tersimpan.`)) {
                                    toggleStudentStatus(s.id, 'tidak_aktif');
                                  }
                                }}
                                title="Nonaktifkan Siswa"
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => toggleStudentStatus(s.id, 'aktif')}
                                title="Aktifkan Kembali Siswa"
                                className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}
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
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-mono">
          <span>Menampilkan {filteredStudents.length} dari {db.students.length} siswa</span>
          <span>SMP Alam Excellentia Pamekasan</span>
        </div>
      </div>

      {/* MODAL TAMBAH SISWA */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 bg-emerald-950 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Tambah Siswa Baru</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-300 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitAdd} className="p-5 space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-slate-700 block mb-1">
                    Nomor Induk Siswa (NIS) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nis}
                    onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-emerald-500"
                    placeholder="Contoh: 202507025"
                  />
                </div>
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Jenis Kelamin *</label>
                  <select
                    value={formData.jenisKelamin}
                    onChange={(e) => setFormData({ ...formData, jenisKelamin: e.target.value as Gender })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">Nama Lengkap Siswa *</label>
                <input
                  type="text"
                  required
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  placeholder="Nama sesuai akta kelahiran"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Kelas *</label>
                  <select
                    value={formData.kelasId}
                    onChange={(e) => setFormData({ ...formData, kelasId: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  >
                    {db.classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nama}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Tahun Masuk</label>
                  <input
                    type="number"
                    value={formData.tahunMasuk}
                    onChange={(e) => setFormData({ ...formData, tahunMasuk: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Nama Orang Tua / Wali</label>
                  <input
                    type="text"
                    value={formData.namaWali}
                    onChange={(e) => setFormData({ ...formData, namaWali: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    placeholder="Nama ayah / ibu / wali"
                  />
                </div>
                <div>
                  <label className="font-medium text-slate-700 block mb-1">No. HP / WhatsApp</label>
                  <input
                    type="text"
                    value={formData.noHpWali}
                    onChange={(e) => setFormData({ ...formData, noHpWali: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    placeholder="081234567890"
                  />
                </div>
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">Alamat Domisili</label>
                <input
                  type="text"
                  value={formData.alamat}
                  onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  placeholder="Jl. / Desa / Dusun di Pamekasan"
                />
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">
                  Nominal SPP Khusus (Opsional, kosongkan jika ikut tarif reguler)
                </label>
                <input
                  type="number"
                  value={formData.nominalSppKhusus || ''}
                  onChange={(e) => setFormData({ ...formData, nominalSppKhusus: Number(e.target.value) })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  placeholder="Tarif normal kelas"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg"
                >
                  Simpan Siswa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDIT SISWA */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Edit Data Siswa: {editingStudent.nama}</h3>
              <button
                onClick={() => setEditingStudent(null)}
                className="text-slate-300 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitEdit} className="p-5 space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-slate-700 block mb-1">NIS *</label>
                  <input
                    type="text"
                    required
                    value={formData.nis}
                    onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Status Siswa *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as StudentStatus })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="aktif">Aktif</option>
                    <option value="tidak_aktif">Tidak Aktif</option>
                    <option value="lulus">Lulus</option>
                    <option value="pindah">Pindah</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">Nama Lengkap Siswa *</label>
                <input
                  type="text"
                  required
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Kelas *</label>
                  <select
                    value={formData.kelasId}
                    onChange={(e) => setFormData({ ...formData, kelasId: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  >
                    {db.classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nama}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Jenis Kelamin</label>
                  <select
                    value={formData.jenisKelamin}
                    onChange={(e) => setFormData({ ...formData, jenisKelamin: e.target.value as Gender })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Nama Wali</label>
                  <input
                    type="text"
                    value={formData.namaWali}
                    onChange={(e) => setFormData({ ...formData, namaWali: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-medium text-slate-700 block mb-1">No. HP / WA</label>
                  <input
                    type="text"
                    value={formData.noHpWali}
                    onChange={(e) => setFormData({ ...formData, noHpWali: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">Alamat Domisili</label>
                <input
                  type="text"
                  value={formData.alamat}
                  onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">
                  Nominal SPP Khusus (Rp)
                </label>
                <input
                  type="number"
                  value={formData.nominalSppKhusus || ''}
                  onChange={(e) => setFormData({ ...formData, nominalSppKhusus: Number(e.target.value) })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DETAIL SISWA & KARTU SPP */}
      {detailStudent && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="relative w-full max-w-3xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-6">
            <div className="px-5 py-4 bg-emerald-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm">
                  Kartu SPP & Profil Siswa: {detailStudent.nama}
                </h3>
              </div>
              <button
                onClick={() => setDetailStudent(null)}
                className="text-slate-300 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6 text-xs max-h-[80vh] overflow-y-auto">
              {/* Profile summary header */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <span className="text-slate-500 block">NIS</span>
                  <span className="font-bold font-mono text-slate-900 text-sm">{detailStudent.nis}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Kelas</span>
                  <span className="font-bold text-slate-900 text-sm">{getClassName(detailStudent.kelasId)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Wali Murid</span>
                  <span className="font-semibold text-slate-800">{detailStudent.namaWali}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Saldo Kredit</span>
                  <span className="font-mono font-bold text-emerald-700">
                    +{formatRupiah(detailStudent.saldoKredit)}
                  </span>
                </div>
              </div>

              {/* Scholarships/Discounts if any */}
              {detailStudentDiscounts.length > 0 && (
                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                  <h4 className="font-bold text-emerald-900 mb-1 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Penerima Keringanan / Beasiswa:</span>
                  </h4>
                  {detailStudentDiscounts.map((d) => (
                    <div key={d.id} className="text-emerald-800 text-xs">
                      · {d.keterangan} ({d.tipe === 'persen' ? `${d.nilai}%` : formatRupiah(d.nilai)}) - SK: {d.nomorSk || '-'}
                    </div>
                  ))}
                </div>
              )}

              {/* Monthly Bill Ledger (Kartu SPP 12 Bulan) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-slate-900 text-sm">
                    Kartu Pembayaran SPP Tahun Ajaran 2025/2026
                  </h4>
                  {currentUser.role !== 'kepsek' && (
                    <button
                      onClick={() => {
                        const std = detailStudent;
                        setDetailStudent(null);
                        onQuickPayForStudent(std);
                      }}
                      className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-semibold flex items-center gap-1"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Bayar SPP Siswa Ini</span>
                    </button>
                  )}
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3 text-left">Bulan</th>
                        <th className="py-2 px-3 text-right">Tagihan</th>
                        <th className="py-2 px-3 text-right">Diskon</th>
                        <th className="py-2 px-3 text-right">Terbayar</th>
                        <th className="py-2 px-3 text-right">Sisa Tagihan</th>
                        <th className="py-2 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {detailStudentBills.map((b) => (
                        <tr key={b.id} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-semibold text-slate-800">
                            {b.bulan} {b.tahun}
                          </td>
                          <td className="py-2 px-3 text-right font-mono tabular-nums">
                            {formatRupiah(b.nominalTagihan)}
                          </td>
                          <td className="py-2 px-3 text-right font-mono tabular-nums text-emerald-700">
                            {b.nominalDiskon > 0 ? `-${formatRupiah(b.nominalDiskon)}` : '-'}
                          </td>
                          <td className="py-2 px-3 text-right font-mono tabular-nums font-semibold text-slate-900">
                            {formatRupiah(b.nominalTerbayar)}
                          </td>
                          <td className="py-2 px-3 text-right font-mono tabular-nums font-bold text-rose-700">
                            {formatRupiah(b.sisaTagihan)}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                b.status === 'lunas'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : b.status === 'belum_lunas'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {b.status.replace('_', ' ')}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setDetailStudent(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL IMPOR CSV */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 bg-emerald-950 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Impor Data Siswa dari Format CSV</h3>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-300 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <p className="text-slate-600">
                Tempel data CSV di bawah ini dengan urutan kolom:
                <br />
                <code className="bg-slate-100 px-2 py-1 rounded block mt-1 text-[11px] font-mono">
                  NIS, Nama Siswa, L/P, Nama Kelas, Nama Wali, No HP Wali, Alamat
                </code>
              </p>

              <textarea
                rows={6}
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="202507030, Ahmad Fauzan, L, VII A, H. Basri, 081234567899, Jl. Trunojoyo&#10;202507031, Siti Nurhaliza, P, VII B, Supardi, 081234567888, Pademawu"
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-emerald-500"
              />

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setImportText(
                      '202507030, Ahmad Fauzan Mubarak, L, VII A (Al-Biruni), H. Basri, 081234567899, Jl. Trunojoyo No. 10\n202507031, Siti Nurhaliza, P, VII B (Ibnu Sina), Supardi, 081234567888, Pademawu'
                    );
                  }}
                  className="text-emerald-700 hover:underline text-[11px]"
                >
                  Contoh Data Template
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsImportModalOpen(false)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleImportSubmit}
                    className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg"
                  >
                    Proses Impor
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
