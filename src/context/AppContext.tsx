import React, { createContext, useContext, useEffect, useState } from 'react';
import { DatabaseSchema, INITIAL_USERS, Storage } from '../db/storage';
import {
  AnnualFeeBill,
  AnnualFeeComponent,
  AnnualFeePayment,
  Bill,
  Discount,
  FeeTariff,
  SchoolProfile,
  Student,
  Transaction,
  User,
  UserRole
} from '../types';
import { generateTransactionNo, hashPassword } from '../utils/formatters';

interface AppContextType {
  db: DatabaseSchema;
  currentUser: User;
  setCurrentUser: (user: User) => void;
  switchUserRole: (role: UserRole) => void;
  login: (usernameOrEmail: string, passwordPlain: string) => { success: boolean; message?: string };
  loginWithGoogle: (email?: string, name?: string) => { success: boolean };
  logout: () => void;

  // Student actions
  addStudent: (data: Omit<Student, 'id' | 'createdAt' | 'saldoKredit'>) => { success: boolean; message?: string };
  updateStudent: (id: string, data: Partial<Student>) => { success: boolean; message?: string };
  toggleStudentStatus: (id: string, status: Student['status']) => void;

  // SPP Transaction actions
  processPayment: (payload: {
    studentId: string;
    selectedBillIds: string[];
    nominalBayar: number;
    metodeBayar: Transaction['metodeBayar'];
    catatan?: string;
    useCreditBalance?: boolean;
    buktiPembayaranUrl?: string;
  }) => { success: boolean; transaction?: Transaction; error?: string };
  
  correctTransaction: (
    trxId: string,
    newMetode: Transaction['metodeBayar'],
    newCatatan: string,
    alasan: string
  ) => { success: boolean; error?: string };

  cancelTransaction: (trxId: string, alasan: string) => { success: boolean; error?: string };

  // Annual Fee actions (Uang Tahunan)
  updateAnnualComponents: (components: AnnualFeeComponent[]) => void;
  processAnnualPayment: (payload: {
    studentId: string;
    nominalBayar: number;
    metodeBayar: Transaction['metodeBayar'];
    catatan?: string;
    buktiPembayaranUrl?: string;
  }) => { success: boolean; payment?: AnnualFeePayment; error?: string };

  // Billing and discounts
  addDiscount: (discount: Omit<Discount, 'id'>) => void;
  deleteDiscount: (discountId: string) => void;
  updateTariffs: (tariffs: FeeTariff[]) => void;
  updateSchoolProfile: (profile: Partial<SchoolProfile>) => void;

  // Backup & Maintenance
  exportDatabaseJSON: () => string;
  importDatabaseJSON: (jsonStr: string) => boolean;
  resetDatabase: () => void;
  logAudit: (aksi: string, detail: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [db, setDb] = useState<DatabaseSchema>(() => Storage.get());
  const [currentUser, setCurrentUser] = useState<User>(() => {
    // Default to Shohibul Kahfi (Admin/Kepsek Full Akses)
    return db.users.find((u) => u.role === 'admin') || db.users[0] || INITIAL_USERS[0];
  });

  useEffect(() => {
    Storage.save(db);
  }, [db]);

  const logAudit = (aksi: string, detail: string) => {
    const newLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      userNama: currentUser.fullName,
      role: currentUser.role,
      aksi,
      detail
    };
    setDb((prev) => ({
      ...prev,
      auditLogs: [newLog, ...prev.auditLogs]
    }));
  };

  const switchUserRole = (role: UserRole) => {
    const targetUser = db.users.find((u) => u.role === role);
    if (targetUser) {
      setCurrentUser(targetUser);
      logAudit('Ganti Hak Akses Pengguna', `Beralih ke pengguna: ${targetUser.fullName} (${role === 'admin' ? 'Administrator/Kepsek Full Akses' : 'Bendahara Operasional'})`);
    }
  };

  const loginWithGoogle = (email = 'kahfigalery@gmail.com', name = 'Shohibul Kahfi, M.Pd.'): { success: boolean } => {
    let user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      user = {
        id: `user-google-${Date.now()}`,
        username: email.split('@')[0],
        fullName: name,
        role: 'admin',
        email,
        passwordHash: 'google_oauth_verified',
        active: true,
        loginProvider: 'google',
        lastLogin: new Date().toISOString()
      };
      setDb((prev) => ({
        ...prev,
        users: [...prev.users, user!]
      }));
    } else {
      user = {
        ...user,
        lastLogin: new Date().toISOString(),
        loginProvider: 'google'
      };
      setDb((prev) => ({
        ...prev,
        users: prev.users.map((u) => (u.id === user!.id ? user! : u))
      }));
    }

    setCurrentUser(user);
    logAudit('Login dengan Google Berhasil', `Pengguna ${user.fullName} (${user.email}) masuk melalui Akun Google`);
    return { success: true };
  };

  const login = (usernameOrEmail: string, passwordPlain: string): { success: boolean; message?: string } => {
    const hashed = hashPassword(passwordPlain);
    const found = db.users.find(
      (u) =>
        u.username.toLowerCase() === usernameOrEmail.toLowerCase() ||
        u.email.toLowerCase() === usernameOrEmail.toLowerCase()
    );

    if (!found) {
      return { success: false, message: 'Alamat email atau nama pengguna tidak ditemukan.' };
    }
    if (found.passwordHash !== hashed && found.passwordHash !== 'google_oauth_verified') {
      return { success: false, message: 'Kata sandi tidak sesuai.' };
    }
    if (!found.active) {
      return { success: false, message: 'Akun Anda sedang dinonaktifkan oleh Administrator.' };
    }

    setCurrentUser(found);
    logAudit('Login Email Berhasil', `Pengguna ${found.fullName} (${found.role}) masuk ke sistem.`);
    return { success: true };
  };

  const logout = () => {
    logAudit('Logout', `Pengguna ${currentUser.fullName} keluar.`);
    const fallback = db.users[0];
    if (fallback) setCurrentUser(fallback);
  };

  // Student actions
  const addStudent = (data: Omit<Student, 'id' | 'createdAt' | 'saldoKredit'>) => {
    const exists = db.students.some((s) => s.nis.trim() === data.nis.trim());
    if (exists) {
      return { success: false, message: `Nomor Induk Siswa (NIS) "${data.nis}" sudah terdaftar.` };
    }

    const newStudentId = `std-${Date.now()}`;
    const newStudent: Student = {
      ...data,
      id: newStudentId,
      saldoKredit: 0,
      createdAt: new Date().toISOString().split('T')[0]
    };

    const activeYear = db.academicYears.find((y) => y.aktif) || db.academicYears[0];
    const classObj = db.classes.find((c) => c.id === data.kelasId);
    const baseTariff = data.nominalSppKhusus || 300000;

    // Generate SPP bills
    const newBills: Bill[] = [];
    const months = [
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni'
    ];

    months.forEach((month, idx) => {
      const year = idx < 6 ? 2026 : 2027;
      const monthNum = idx < 6 ? idx + 7 : idx - 5;
      const dueDate = `${year}-${String(monthNum).padStart(2, '0')}-10`;

      newBills.push({
        id: `bill-${newStudentId}-${idx + 1}`,
        studentId: newStudentId,
        tahunAjaranId: activeYear.id,
        bulan: month,
        urutanBulan: idx + 1,
        tahun: year,
        nominalTagihan: baseTariff,
        nominalDiskon: 0,
        nominalTerbayar: 0,
        sisaTagihan: baseTariff,
        status: 'belum_bayar',
        jatuhTempo: dueDate
      });
    });

    // Generate Annual Fee bill
    const totalAnnual = db.annualFeeComponents.reduce((sum, c) => sum + c.nominal, 0);
    const newAnnualBill: AnnualFeeBill = {
      id: `ann-bill-${newStudentId}`,
      studentId: newStudentId,
      tahunAjaranId: activeYear.id,
      totalTagihan: totalAnnual,
      nominalTerbayar: 0,
      sisaTagihan: totalAnnual,
      status: 'belum_bayar'
    };

    setDb((prev) => ({
      ...prev,
      students: [...prev.students, newStudent],
      bills: [...prev.bills, ...newBills],
      annualFeeBills: [...prev.annualFeeBills, newAnnualBill]
    }));

    logAudit('Tambah Siswa', `Menambahkan siswa baru: ${data.nama} (NIS: ${data.nis}, ${classObj?.nama})`);
    return { success: true };
  };

  const updateStudent = (id: string, data: Partial<Student>) => {
    if (data.nis) {
      const exists = db.students.some((s) => s.id !== id && s.nis.trim() === data.nis!.trim());
      if (exists) {
        return { success: false, message: `NIS "${data.nis}" sudah digunakan siswa lain.` };
      }
    }

    setDb((prev) => ({
      ...prev,
      students: prev.students.map((s) => (s.id === id ? { ...s, ...data } : s))
    }));

    logAudit('Ubah Data Siswa', `Memperbarui data siswa ID: ${id}`);
    return { success: true };
  };

  const toggleStudentStatus = (id: string, status: Student['status']) => {
    const student = db.students.find((s) => s.id === id);
    setDb((prev) => ({
      ...prev,
      students: prev.students.map((s) => (s.id === id ? { ...s, status } : s))
    }));
    logAudit('Ubah Status Siswa', `Mengubah status siswa ${student?.nama || id} menjadi "${status}"`);
  };

  // Process SPP Payment
  const processPayment = (payload: {
    studentId: string;
    selectedBillIds: string[];
    nominalBayar: number;
    metodeBayar: Transaction['metodeBayar'];
    catatan?: string;
    useCreditBalance?: boolean;
    buktiPembayaranUrl?: string;
  }): { success: boolean; transaction?: Transaction; error?: string } => {
    const student = db.students.find((s) => s.id === payload.studentId);
    if (!student) return { success: false, error: 'Siswa tidak ditemukan' };

    const classObj = db.classes.find((c) => c.id === student.kelasId);

    const billsToPay = db.bills
      .filter((b) => payload.selectedBillIds.includes(b.id))
      .sort((a, b) => a.urutanBulan - b.urutanBulan);

    if (billsToPay.length === 0) {
      return { success: false, error: 'Pilih minimal satu bulan tagihan yang ingin dibayar' };
    }

    const alreadyPaid = billsToPay.find((b) => b.status === 'lunas');
    if (alreadyPaid) {
      return {
        success: false,
        error: `Peringatan: Tagihan bulan ${alreadyPaid.bulan} ${alreadyPaid.tahun} sudah LUNAS.`
      };
    }

    let creditUsed = 0;
    if (payload.useCreditBalance && student.saldoKredit > 0) {
      creditUsed = Math.min(student.saldoKredit, payload.nominalBayar);
    }

    let remainingToDistribute = payload.nominalBayar;
    const allocations: Transaction['alokasiBulan'] = [];
    const updatedBills = [...db.bills];

    for (const b of billsToPay) {
      if (remainingToDistribute <= 0) break;

      const billIndex = updatedBills.findIndex((item) => item.id === b.id);
      if (billIndex === -1) continue;

      const currentBill = { ...updatedBills[billIndex] };
      const netNeeded = currentBill.sisaTagihan;
      const allocateForThis = Math.min(netNeeded, remainingToDistribute);

      currentBill.nominalTerbayar += allocateForThis;
      currentBill.sisaTagihan = Math.max(0, currentBill.sisaTagihan - allocateForThis);
      currentBill.status = currentBill.sisaTagihan === 0 ? 'lunas' : 'belum_lunas';

      updatedBills[billIndex] = currentBill;

      allocations.push({
        billId: currentBill.id,
        bulan: currentBill.bulan,
        tahun: currentBill.tahun,
        nominalTagihan: currentBill.nominalTagihan - currentBill.nominalDiskon,
        nominalDialokasikan: allocateForThis,
        sisaSetelahAlokasi: currentBill.sisaTagihan,
        statusSetelah: currentBill.status
      });

      remainingToDistribute -= allocateForThis;
    }

    const excessCredit = remainingToDistribute > 0 ? remainingToDistribute : 0;
    const newCreditBalance = Math.max(0, student.saldoKredit - creditUsed) + excessCredit;

    const trxCounter = db.transactions.length + 1;
    const newTransaction: Transaction = {
      id: `trx-${Date.now()}`,
      noTransaksi: generateTransactionNo(trxCounter),
      studentId: student.id,
      nis: student.nis,
      studentNama: student.nama,
      kelasNama: classObj?.nama || '-',
      tanggalBayar: new Date().toISOString().split('T')[0],
      metodeBayar: payload.metodeBayar,
      totalBayar: payload.nominalBayar,
      alokasiBulan: allocations,
      saldoKreditDigunakan: creditUsed,
      saldoKreditDihasilkan: excessCredit,
      buktiPembayaranUrl: payload.buktiPembayaranUrl,
      petugasId: currentUser.id,
      petugasNama: currentUser.fullName,
      status: 'berhasil',
      catatan: payload.catatan || '',
      createdAt: new Date().toISOString()
    };

    setDb((prev) => ({
      ...prev,
      bills: updatedBills,
      students: prev.students.map((s) => (s.id === student.id ? { ...s, saldoKredit: newCreditBalance } : s)),
      transactions: [newTransaction, ...prev.transactions]
    }));

    logAudit(
      'Pembayaran SPP',
      `Transaksi ${newTransaction.noTransaksi} sebesar Rp ${payload.nominalBayar.toLocaleString('id-ID')} untuk ${student.nama} oleh ${currentUser.fullName}${payload.buktiPembayaranUrl ? ' (Bukti Transfer Dilampirkan)' : ''}`
    );

    return { success: true, transaction: newTransaction };
  };

  // Process Annual Fee Payment (Uang Tahunan: bisa lunas atau cicil)
  const processAnnualPayment = (payload: {
    studentId: string;
    nominalBayar: number;
    metodeBayar: Transaction['metodeBayar'];
    catatan?: string;
    buktiPembayaranUrl?: string;
  }): { success: boolean; payment?: AnnualFeePayment; error?: string } => {
    const student = db.students.find((s) => s.id === payload.studentId);
    if (!student) return { success: false, error: 'Siswa tidak ditemukan' };

    const bill = db.annualFeeBills.find((b) => b.studentId === payload.studentId);
    if (!bill) return { success: false, error: 'Tagihan Uang Tahunan siswa tidak ditemukan' };

    if (bill.status === 'lunas') {
      return { success: false, error: 'Uang Tahunan siswa ini sudah LUNAS' };
    }

    if (payload.nominalBayar <= 0) {
      return { success: false, error: 'Nominal pembayaran harus lebih besar dari Rp 0' };
    }

    const classObj = db.classes.find((c) => c.id === student.kelasId);
    const newTerbayar = bill.nominalTerbayar + payload.nominalBayar;
    const newSisa = Math.max(0, bill.totalTagihan - newTerbayar);
    const newStatus: AnnualFeeBill['status'] = newSisa === 0 ? 'lunas' : 'dicicil';

    const newPayment: AnnualFeePayment = {
      id: `ann-pay-${Date.now()}`,
      noTransaksi: `TRX-THN-${Date.now().toString().slice(-6)}`,
      studentId: student.id,
      nis: student.nis,
      studentNama: student.nama,
      kelasNama: classObj?.nama || '-',
      tanggalBayar: new Date().toISOString().split('T')[0],
      nominalBayar: payload.nominalBayar,
      sisaSetelah: newSisa,
      statusSetelah: newStatus,
      metodeBayar: payload.metodeBayar,
      buktiPembayaranUrl: payload.buktiPembayaranUrl,
      petugasId: currentUser.id,
      petugasNama: currentUser.fullName,
      catatan: payload.catatan || (newStatus === 'lunas' ? 'Lunas Uang Tahunan' : 'Cicilan Uang Tahunan'),
      createdAt: new Date().toISOString()
    };

    setDb((prev) => ({
      ...prev,
      annualFeeBills: prev.annualFeeBills.map((b) =>
        b.studentId === payload.studentId
          ? {
              ...b,
              nominalTerbayar: newTerbayar,
              sisaTagihan: newSisa,
              status: newStatus
            }
          : b
      ),
      annualFeePayments: [newPayment, ...prev.annualFeePayments]
    }));

    logAudit(
      'Pembayaran Uang Tahunan',
      `Penerimaan Uang Tahunan ${newPayment.noTransaksi} sebesar Rp ${payload.nominalBayar.toLocaleString('id-ID')} untuk ${student.nama} (${newStatus === 'lunas' ? 'LUNAS' : `Cicilan, sisa Rp ${newSisa.toLocaleString('id-ID')}`})`
    );

    return { success: true, payment: newPayment };
  };

  // Update Annual Components (Administrator / Kepsek)
  const updateAnnualComponents = (components: AnnualFeeComponent[]) => {
    if (currentUser.role !== 'admin') {
      alert('Hanya Administrator / Kepala Sekolah yang berwenang mengubah rincian Uang Tahunan.');
      return;
    }

    const newTotal = components.reduce((sum, c) => sum + c.nominal, 0);

    // Update annual bills for students who haven't paid or update total
    const updatedBills = db.annualFeeBills.map((b) => {
      const sisa = Math.max(0, newTotal - b.nominalTerbayar);
      return {
        ...b,
        totalTagihan: newTotal,
        sisaTagihan: sisa,
        status: sisa === 0 ? ('lunas' as const) : b.nominalTerbayar > 0 ? ('dicicil' as const) : ('belum_bayar' as const)
      };
    });

    setDb((prev) => ({
      ...prev,
      annualFeeComponents: components,
      annualFeeBills: updatedBills
    }));

    logAudit(
      'Ubah Komponen Uang Tahunan',
      `Pembaruan nominal rincian Uang Tahunan menjadi total Rp ${newTotal.toLocaleString('id-ID')} oleh ${currentUser.fullName}`
    );
  };

  // Transaction correction & cancellation
  const correctTransaction = (
    trxId: string,
    newMetode: Transaction['metodeBayar'],
    newCatatan: string,
    alasan: string
  ): { success: boolean; error?: string } => {
    if (currentUser.role !== 'admin') {
      return { success: false, error: 'Hanya Administrator/Kepala Sekolah yang berwenang mengoreksi transaksi.' };
    }

    const trx = db.transactions.find((t) => t.id === trxId);
    if (!trx) return { success: false, error: 'Transaksi tidak ditemukan' };

    const correctionRecord = {
      tanggal: new Date().toISOString(),
      petugasNama: currentUser.fullName,
      alasan,
      detailSebelum: `Metode: ${trx.metodeBayar}, Catatan: ${trx.catatan || '-'}`
    };

    setDb((prev) => ({
      ...prev,
      transactions: prev.transactions.map((t) =>
        t.id === trxId
          ? {
              ...t,
              metodeBayar: newMetode,
              catatan: newCatatan,
              status: 'dikoreksi',
              riwayatKoreksi: [...(t.riwayatKoreksi || []), correctionRecord]
            }
          : t
      )
    }));

    logAudit('Koreksi Transaksi', `Koreksi transaksi ${trx.noTransaksi}. Alasan: "${alasan}"`);
    return { success: true };
  };

  const cancelTransaction = (trxId: string, alasan: string): { success: boolean; error?: string } => {
    if (currentUser.role !== 'admin') {
      return { success: false, error: 'Hanya Administrator/Kepala Sekolah yang berwenang membatalkan transaksi.' };
    }

    const trx = db.transactions.find((t) => t.id === trxId);
    if (!trx) return { success: false, error: 'Transaksi tidak ditemukan' };
    if (trx.status === 'dibatalkan') return { success: false, error: 'Transaksi sudah pernah dibatalkan' };

    const updatedBills = [...db.bills];
    for (const alloc of trx.alokasiBulan) {
      const bIdx = updatedBills.findIndex((b) => b.id === alloc.billId);
      if (bIdx !== -1) {
        const b = { ...updatedBills[bIdx] };
        b.nominalTerbayar = Math.max(0, b.nominalTerbayar - alloc.nominalDialokasikan);
        b.sisaTagihan = (b.nominalTagihan - b.nominalDiskon) - b.nominalTerbayar;
        b.status = b.sisaTagihan === 0 ? 'lunas' : b.nominalTerbayar > 0 ? 'belum_lunas' : 'belum_bayar';
        updatedBills[bIdx] = b;
      }
    }

    const student = db.students.find((s) => s.id === trx.studentId);
    const updatedCredit = student
      ? Math.max(0, student.saldoKredit - (trx.saldoKreditDihasilkan || 0) + (trx.saldoKreditDigunakan || 0))
      : 0;

    const correctionRecord = {
      tanggal: new Date().toISOString(),
      petugasNama: currentUser.fullName,
      alasan: `PEMBATALAN TRANSAKSI: ${alasan}`,
      detailSebelum: `Status sebelumnya: ${trx.status}, Total Bayar: Rp ${trx.totalBayar}`
    };

    setDb((prev) => ({
      ...prev,
      bills: updatedBills,
      students: prev.students.map((s) => (s.id === trx.studentId ? { ...s, saldoKredit: updatedCredit } : s)),
      transactions: prev.transactions.map((t) =>
        t.id === trxId
          ? {
              ...t,
              status: 'dibatalkan',
              riwayatKoreksi: [...(t.riwayatKoreksi || []), correctionRecord]
            }
          : t
      )
    }));

    logAudit('Pembatalan Transaksi', `Pembatalan transaksi ${trx.noTransaksi} senilai Rp ${trx.totalBayar.toLocaleString('id-ID')}. Alasan: "${alasan}"`);
    return { success: true };
  };

  const addDiscount = (discountData: Omit<Discount, 'id'>) => {
    const student = db.students.find((s) => s.id === discountData.studentId);
    const newDisc: Discount = {
      ...discountData,
      id: `disc-${Date.now()}`,
      studentNama: student?.nama
    };

    setDb((prev) => ({
      ...prev,
      discounts: [...prev.discounts, newDisc]
    }));

    logAudit('Tambah Keringanan/Beasiswa', `Pemberian beasiswa ${newDisc.jenis} untuk ${student?.nama || ''}`);
  };

  const deleteDiscount = (discountId: string) => {
    setDb((prev) => ({
      ...prev,
      discounts: prev.discounts.filter((d) => d.id !== discountId)
    }));
  };

  const updateTariffs = (tariffs: FeeTariff[]) => {
    setDb((prev) => ({
      ...prev,
      tariffs
    }));
    logAudit('Ubah Tarif SPP', 'Pembaruan tarif SPP bulanan');
  };

  const updateSchoolProfile = (profile: Partial<SchoolProfile>) => {
    setDb((prev) => ({
      ...prev,
      schoolProfile: { ...prev.schoolProfile, ...profile }
    }));
    logAudit('Ubah Profil Sekolah', 'Memperbarui profil sekolah dan yayasan');
  };

  const exportDatabaseJSON = () => Storage.exportJSON();

  const importDatabaseJSON = (jsonStr: string): boolean => {
    const ok = Storage.importJSON(jsonStr);
    if (ok) {
      setDb(Storage.get());
      return true;
    }
    return false;
  };

  const resetDatabase = () => {
    const fresh = Storage.reset();
    setDb(fresh);
    setCurrentUser(fresh.users[0]);
  };

  return (
    <AppContext.Provider
      value={{
        db,
        currentUser,
        setCurrentUser,
        switchUserRole,
        login,
        loginWithGoogle,
        logout,
        addStudent,
        updateStudent,
        toggleStudentStatus,
        processPayment,
        correctTransaction,
        cancelTransaction,
        updateAnnualComponents,
        processAnnualPayment,
        addDiscount,
        deleteDiscount,
        updateTariffs,
        updateSchoolProfile,
        exportDatabaseJSON,
        importDatabaseJSON,
        resetDatabase,
        logAudit
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
