/**
 * Local Relational Persistence Engine & Data Store
 * SMP ALAM EXCELLENTIA PAMEKASAN
 * Tahun Ajaran 2026/2027 - Yayasan Insan Kamil
 */

import {
  AcademicYear,
  AnnualFeeBill,
  AnnualFeeComponent,
  AnnualFeePayment,
  AuditLog,
  Bill,
  ClassRoom,
  Discount,
  FeeTariff,
  SchoolProfile,
  Student,
  Transaction,
  User
} from '../types';
import { ACADEMIC_MONTHS, generateTransactionNo, hashPassword } from '../utils/formatters';

const STORAGE_KEY = 'smp_alam_excellentia_spp_db_v3_2026_2027';

export interface DatabaseSchema {
  version: string;
  lastUpdated: string;
  isSimulated: boolean;
  schoolProfile: SchoolProfile;
  users: User[];
  classes: ClassRoom[];
  academicYears: AcademicYear[];
  tariffs: FeeTariff[];
  annualFeeComponents: AnnualFeeComponent[];
  annualFeeBills: AnnualFeeBill[];
  annualFeePayments: AnnualFeePayment[];
  discounts: Discount[];
  students: Student[];
  bills: Bill[];
  transactions: Transaction[];
  auditLogs: AuditLog[];
}

export const INITIAL_SCHOOL_PROFILE: SchoolProfile = {
  nama: 'SMP Alam Excellentia Pamekasan',
  yayasan: 'Yayasan Insan Kamil',
  npsn: '69987654',
  alamat: 'Jl. Raya Pamekasan - Sumenep KM 4, Toronan, Pamekasan, Madura, Jawa Timur 69317',
  telepon: '(0324) 321889 / 0812-3456-7890',
  email: 'info@smpalamexcellentia.sch.id',
  website: 'https://smpalamexcellentia.sch.id',
  kepalaSekolah: 'Shohibul Kahfi, M.Pd.',
  bendahara: 'Sitti Noerjannah, S.Pd.',
  logoUrl: '/assets/aistudio/1713909500616_5b14171f.png',
  rekeningInfo: 'Bank BRI No. Rek: 646401042029535 (A/N SHOHIBUL KAHFI)',
  biayaSppDefault: 300000
};

export const INITIAL_USERS: User[] = [
  {
    id: 'user-kepsek-1',
    username: 'kepsek',
    fullName: 'Shohibul Kahfi, M.Pd.',
    role: 'admin', // Full Akses
    email: 'kahfigalery@gmail.com',
    passwordHash: hashPassword('kahfi123'),
    lastLogin: '2026-10-22T08:00:00Z',
    active: true,
    loginProvider: 'google',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
  },
  {
    id: 'user-bendahara-1',
    username: 'bendahara',
    fullName: 'Sitti Noerjannah, S.Pd.',
    role: 'petugas', // Operasional
    email: 'bendahara@smpalamexcellentia.sch.id',
    passwordHash: hashPassword('bendahara123'),
    lastLogin: '2026-10-22T08:15:00Z',
    active: true,
    loginProvider: 'email'
  }
];

export const INITIAL_CLASSES: ClassRoom[] = [
  { id: 'c-7', nama: 'VII (Al-Khawarizmi)', tingkat: 7, waliKelas: 'Ust. M. Ridwan, S.Kom.', kapasitas: 20 },
  { id: 'c-8', nama: 'VIII (Albatenius)', tingkat: 8, waliKelas: 'Usth. Dewi Masitah, M.Pd.', kapasitas: 20 },
  { id: 'c-9', nama: 'IX (Avicena)', tingkat: 9, waliKelas: 'Ust. Lukman Hakim, M.Pd.', kapasitas: 20 }
];

export const INITIAL_YEARS: AcademicYear[] = [
  {
    id: 'ay-2026-2027',
    nama: '2026/2027',
    aktif: true,
    tanggalMulai: '2026-07-01',
    tanggalSelesai: '2027-06-30'
  },
  {
    id: 'ay-2025-2026',
    nama: '2025/2026',
    aktif: false,
    tanggalMulai: '2025-07-01',
    tanggalSelesai: '2026-06-30'
  }
];

export const INITIAL_TARIFFS: FeeTariff[] = [
  {
    id: 'tariff-7-2627',
    tahunAjaranId: 'ay-2026-2027',
    tingkat: 7,
    nominalDefault: 300000,
    tanggalJatuhTempo: 10,
    berlakuMulai: '2026-07-01',
    keterangan: 'Tarif SPP Bulanan Kelas VII (Al-Khawarizmi)'
  },
  {
    id: 'tariff-8-2627',
    tahunAjaranId: 'ay-2026-2027',
    tingkat: 8,
    nominalDefault: 300000,
    tanggalJatuhTempo: 10,
    berlakuMulai: '2026-07-01',
    keterangan: 'Tarif SPP Bulanan Kelas VIII (Albatenius)'
  },
  {
    id: 'tariff-9-2627',
    tahunAjaranId: 'ay-2026-2027',
    tingkat: 9,
    nominalDefault: 300000,
    tanggalJatuhTempo: 10,
    berlakuMulai: '2026-07-01',
    keterangan: 'Tarif SPP Bulanan Kelas IX (Avicena)'
  }
];

// Initial Annual Fee Components (Total: Rp 2.700.000)
export const INITIAL_ANNUAL_COMPONENTS: AnnualFeeComponent[] = [
  { id: 'comp-atk', nama: 'ATK', nominal: 100000 },
  { id: 'comp-kbm', nama: 'KBM dan Ekstrakurikuler', nominal: 1650000 },
  { id: 'comp-buku', nama: 'Buku dan Media Pembelajaran', nominal: 900000 },
  { id: 'comp-kalender', nama: 'Kalender', nominal: 50000 }
];

// EXACTLY 12 ACTIVE STUDENTS:
// VII (Al-Khawarizmi): 1 siswa
// VIII (Albatenius): 5 siswa
// IX (Avicena): 6 siswa
export const INITIAL_STUDENTS: Student[] = [
  // Kelas VII (Al-Khawarizmi) - 1 siswa
  {
    id: 'std-001',
    nis: '202607001',
    nama: 'Achmad Dani Ramadhan',
    jenisKelamin: 'L',
    kelasId: 'c-7',
    tahunMasuk: 2026,
    namaWali: 'H. Moh. Zaini',
    noHpWali: '081234567801',
    alamat: 'Jl. Trunojoyo No. 45, Pamekasan',
    status: 'aktif',
    saldoKredit: 0,
    createdAt: '2026-07-01'
  },

  // Kelas VIII (Albatenius) - 5 siswa
  {
    id: 'std-002',
    nis: '202507002',
    nama: 'Fatimah Az-Zahra',
    jenisKelamin: 'P',
    kelasId: 'c-8',
    tahunMasuk: 2025,
    namaWali: 'Drs. Supriyadi',
    noHpWali: '081234567802',
    alamat: 'Desa Ceguk, Tlanakan, Pamekasan',
    status: 'aktif',
    saldoKredit: 0,
    createdAt: '2025-07-01'
  },
  {
    id: 'std-003',
    nis: '202507003',
    nama: 'Muhammad Alif Bahtiar',
    jenisKelamin: 'L',
    kelasId: 'c-8',
    tahunMasuk: 2025,
    namaWali: 'Bambang Irawan',
    noHpWali: '081234567803',
    alamat: 'Jl. Kabupaten No. 12, Pamekasan',
    status: 'aktif',
    saldoKredit: 0,
    createdAt: '2025-07-01'
  },
  {
    id: 'std-004',
    nis: '202507004',
    nama: 'Nur Aisyah Wardani',
    jenisKelamin: 'P',
    kelasId: 'c-8',
    tahunMasuk: 2025,
    namaWali: 'Hj. Maisaroh',
    noHpWali: '081234567804',
    alamat: 'Jl. Amin Jakfar No. 18, Gladak Anyar',
    status: 'aktif',
    saldoKredit: 0,
    createdAt: '2025-07-01'
  },
  {
    id: 'std-005',
    nis: '202507005',
    nama: 'Bilal Habibi',
    jenisKelamin: 'L',
    kelasId: 'c-8',
    tahunMasuk: 2025,
    namaWali: 'Ust. Syamsul Arifin',
    noHpWali: '081234567805',
    alamat: 'Kecamatan Pademawu, Pamekasan',
    status: 'aktif',
    saldoKredit: 0,
    createdAt: '2025-07-01'
  },
  {
    id: 'std-006',
    nis: '202507006',
    nama: 'Khadijah Salsabila',
    jenisKelamin: 'P',
    kelasId: 'c-8',
    tahunMasuk: 2025,
    namaWali: 'Imam Ghozali',
    noHpWali: '081234567806',
    alamat: 'Desa Buddagan, Pademawu',
    status: 'aktif',
    saldoKredit: 0,
    createdAt: '2025-07-01'
  },

  // Kelas IX (Avicena) - 6 siswa
  {
    id: 'std-007',
    nis: '202407007',
    nama: 'Rayhan Akbar Maulana',
    jenisKelamin: 'L',
    kelasId: 'c-9',
    tahunMasuk: 2024,
    namaWali: 'Subhan Santoso',
    noHpWali: '081234567807',
    alamat: 'Jl. R. Abd. Aziz No. 8, Pamekasan',
    status: 'aktif',
    saldoKredit: 0,
    createdAt: '2024-07-01'
  },
  {
    id: 'std-008',
    nis: '202407008',
    nama: 'Naila Fauziyah',
    jenisKelamin: 'P',
    kelasId: 'c-9',
    tahunMasuk: 2024,
    namaWali: 'Moh. Saleh',
    noHpWali: '081234567808',
    alamat: 'Jl. Niaga No. 22, Pamekasan',
    status: 'aktif',
    saldoKredit: 0,
    createdAt: '2024-07-01'
  },
  {
    id: 'std-009',
    nis: '202407009',
    nama: 'Faris Farhan As-Sidqi',
    jenisKelamin: 'L',
    kelasId: 'c-9',
    tahunMasuk: 2024,
    namaWali: 'H. Mansyur',
    noHpWali: '081234567809',
    alamat: 'Desa Panempan, Pamekasan',
    status: 'aktif',
    saldoKredit: 0,
    createdAt: '2024-07-01'
  },
  {
    id: 'std-010',
    nis: '202407010',
    nama: 'Zahra Amelia Putri',
    jenisKelamin: 'P',
    kelasId: 'c-9',
    tahunMasuk: 2024,
    namaWali: 'Sunarto, S.E.',
    noHpWali: '081234567810',
    alamat: 'Jl. Pintu Gerbang No. 70, Pamekasan',
    status: 'aktif',
    saldoKredit: 0,
    createdAt: '2024-07-01'
  },
  {
    id: 'std-011',
    nis: '202407011',
    nama: 'Rizqy Pratama Hidayat',
    jenisKelamin: 'L',
    kelasId: 'c-9',
    tahunMasuk: 2024,
    namaWali: 'Drs. H. Mulyadi',
    noHpWali: '081234567811',
    alamat: 'Jl. Jokotole No. 101, Pamekasan',
    status: 'aktif',
    saldoKredit: 0,
    createdAt: '2024-07-01'
  },
  {
    id: 'std-012',
    nis: '202407012',
    nama: 'Safira Salma Azzahra',
    jenisKelamin: 'P',
    kelasId: 'c-9',
    tahunMasuk: 2024,
    namaWali: 'Ir. Ahmad Baihaqi',
    noHpWali: '081234567812',
    alamat: 'Kecamatan Proppo, Pamekasan',
    status: 'aktif',
    saldoKredit: 0,
    createdAt: '2024-07-01'
  }
];

export const INITIAL_DISCOUNTS: Discount[] = [];

export function seedInitialData(): DatabaseSchema {
  const bills: Bill[] = [];
  const transactions: Transaction[] = [];
  const annualFeeBills: AnnualFeeBill[] = [];
  const annualFeePayments: AnnualFeePayment[] = [];
  const auditLogs: AuditLog[] = [];

  const totalAnnualFee = INITIAL_ANNUAL_COMPONENTS.reduce((sum, c) => sum + c.nominal, 0); // 2.700.000

  // Generate 12 months SPP bills and Annual Fee bills for 2026/2027
  INITIAL_STUDENTS.forEach((student) => {
    // 1. SPP Bills
    ACADEMIC_MONTHS.forEach((month, idx) => {
      const year = idx < 6 ? 2026 : 2027;
      const monthNum = idx < 6 ? idx + 7 : idx - 5;
      const dueDate = `${year}-${String(monthNum).padStart(2, '0')}-10`;

      bills.push({
        id: `bill-${student.id}-${idx + 1}`,
        studentId: student.id,
        tahunAjaranId: 'ay-2026-2027',
        bulan: month,
        urutanBulan: idx + 1,
        tahun: year,
        nominalTagihan: 300000,
        nominalDiskon: 0,
        nominalTerbayar: 0,
        sisaTagihan: 300000,
        status: 'belum_bayar',
        jatuhTempo: dueDate
      });
    });

    // 2. Annual Fee Bill (Uang Tahunan)
    annualFeeBills.push({
      id: `ann-bill-${student.id}`,
      studentId: student.id,
      tahunAjaranId: 'ay-2026-2027',
      totalTagihan: totalAnnualFee,
      nominalTerbayar: 0,
      sisaTagihan: totalAnnualFee,
      status: 'belum_bayar'
    });
  });

  // Seed sample realistic payments for T.A. 2026/2027 up to October 2026
  let trxCount = 1;

  function paySpp(studentId: string, monthIdxs: number[], method: any, date: string, partialLast: number = 0) {
    const student = INITIAL_STUDENTS.find((s) => s.id === studentId)!;
    const cls = INITIAL_CLASSES.find((c) => c.id === student.kelasId);
    let total = 0;
    const allocs: Transaction['alokasiBulan'] = [];

    monthIdxs.forEach((mIdx, i) => {
      const b = bills.find((item) => item.studentId === studentId && item.urutanBulan === mIdx + 1);
      if (!b) return;
      const isLast = i === monthIdxs.length - 1;
      const amount = isLast && partialLast > 0 ? partialLast : b.sisaTagihan;

      b.nominalTerbayar += amount;
      b.sisaTagihan = Math.max(0, b.nominalTagihan - b.nominalTerbayar);
      b.status = b.sisaTagihan === 0 ? 'lunas' : 'belum_lunas';

      allocs.push({
        billId: b.id,
        bulan: b.bulan,
        tahun: b.tahun,
        nominalTagihan: b.nominalTagihan,
        nominalDialokasikan: amount,
        sisaSetelahAlokasi: b.sisaTagihan,
        statusSetelah: b.status
      });
      total += amount;
    });

    transactions.push({
      id: `trx-${trxCount}`,
      noTransaksi: generateTransactionNo(trxCount),
      studentId: student.id,
      nis: student.nis,
      studentNama: student.nama,
      kelasNama: cls?.nama || '-',
      tanggalBayar: date,
      metodeBayar: method,
      totalBayar: total,
      alokasiBulan: allocs,
      saldoKreditDigunakan: 0,
      saldoKreditDihasilkan: 0,
      petugasId: 'user-bendahara-1',
      petugasNama: 'Sitti Noerjannah, S.Pd.',
      status: 'berhasil',
      catatan: 'Pembayaran SPP',
      createdAt: date
    });
    trxCount++;
  }

  // Seed Annual Fee payments
  function payAnnual(studentId: string, amount: number, method: any, date: string) {
    const student = INITIAL_STUDENTS.find((s) => s.id === studentId)!;
    const cls = INITIAL_CLASSES.find((c) => c.id === student.kelasId);
    const b = annualFeeBills.find((item) => item.studentId === studentId);
    if (!b) return;

    b.nominalTerbayar += amount;
    b.sisaTagihan = Math.max(0, b.totalTagihan - b.nominalTerbayar);
    b.status = b.sisaTagihan === 0 ? 'lunas' : b.nominalTerbayar > 0 ? 'dicicil' : 'belum_bayar';

    annualFeePayments.push({
      id: `ann-pay-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      noTransaksi: `TRX-THN-${Date.now().toString().slice(-6)}`,
      studentId: student.id,
      nis: student.nis,
      studentNama: student.nama,
      kelasNama: cls?.nama || '-',
      tanggalBayar: date,
      nominalBayar: amount,
      sisaSetelah: b.sisaTagihan,
      statusSetelah: b.status as any,
      metodeBayar: method,
      petugasId: 'user-bendahara-1',
      petugasNama: 'Sitti Noerjannah, S.Pd.',
      catatan: amount === totalAnnualFee ? 'Lunas Uang Tahunan 2026/2027' : 'Cicilan Uang Tahunan',
      createdAt: date
    });
  }

  // Seed SPP payments
  // Dani (VII): Juli, Agustus, September, Oktober
  paySpp('std-001', [0, 1, 2, 3], 'transfer_bri', '2026-10-05');
  // Fatimah (VIII): Juli, Agustus, September, Oktober
  paySpp('std-002', [0, 1, 2, 3], 'transfer_bri', '2026-10-06');
  // Alif (VIII): Juli, Agustus
  paySpp('std-003', [0, 1], 'tunai', '2026-08-10');
  // Nur Aisyah (VIII): Juli, Agustus, September (Oktober cicil 150rb)
  paySpp('std-004', [0, 1, 2], 'transfer_bri', '2026-09-08');
  paySpp('std-004', [3], 'tunai', '2026-10-09', 150000);
  // Rayhan (IX): Juli, Agustus, September, Oktober
  paySpp('std-007', [0, 1, 2, 3], 'transfer_bri', '2026-10-08');
  // Naila (IX): Juli, Agustus, September, Oktober
  paySpp('std-008', [0, 1, 2, 3], 'qris', '2026-10-07');
  // Rizqy (IX): Juli, Agustus, September, Oktober, plus November
  paySpp('std-011', [0, 1, 2, 3, 4], 'transfer_bri', '2026-10-09');

  // Seed Uang Tahunan payments (some lunas, some cicilan)
  payAnnual('std-001', 2700000, 'transfer_bri', '2026-07-10'); // Lunas
  payAnnual('std-002', 2700000, 'transfer_bri', '2026-07-12'); // Lunas
  payAnnual('std-003', 1000000, 'tunai', '2026-07-15'); // Cicilan 1 jt
  payAnnual('std-004', 1500000, 'transfer_bri', '2026-07-18'); // Cicilan 1.5 jt
  payAnnual('std-007', 2700000, 'transfer_bri', '2026-07-08'); // Lunas
  payAnnual('std-008', 2000000, 'qris', '2026-07-14'); // Cicilan 2 jt

  // Initial audit log
  auditLogs.push(
    {
      id: 'log-init-01',
      timestamp: '2026-07-01T08:00:00Z',
      userId: 'user-kepsek-1',
      userNama: 'Shohibul Kahfi, M.Pd.',
      role: 'admin',
      aksi: 'Inisialisasi Tahun Ajaran',
      detail: 'Inisialisasi T.A. 2026/2027, SPP Rp 300.000, Uang Tahunan Rp 2.700.000 Yayasan Insan Kamil'
    },
    {
      id: 'log-init-02',
      timestamp: '2026-07-01T08:30:00Z',
      userId: 'user-bendahara-1',
      userNama: 'Sitti Noerjannah, S.Pd.',
      role: 'petugas',
      aksi: 'Konfigurasi Rekening Kas',
      detail: 'Pencatatan rekening resmi Bank BRI 646401042029535 a.n. SHOHIBUL KAHFI'
    }
  );

  return {
    version: '3.0.0',
    lastUpdated: new Date().toISOString(),
    isSimulated: true,
    schoolProfile: INITIAL_SCHOOL_PROFILE,
    users: INITIAL_USERS,
    classes: INITIAL_CLASSES,
    academicYears: INITIAL_YEARS,
    tariffs: INITIAL_TARIFFS,
    annualFeeComponents: INITIAL_ANNUAL_COMPONENTS,
    annualFeeBills,
    annualFeePayments,
    discounts: INITIAL_DISCOUNTS,
    students: INITIAL_STUDENTS,
    bills,
    transactions,
    auditLogs
  };
}

export const Storage = {
  get(): DatabaseSchema {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        const seeded = seedInitialData();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
        return seeded;
      }
      const parsed: DatabaseSchema = JSON.parse(data);
      // Ensure logo, profile, and annual fees exist
      if (
        !parsed.annualFeeComponents ||
        !parsed.schoolProfile ||
        parsed.schoolProfile.kepalaSekolah !== 'Shohibul Kahfi, M.Pd.' ||
        parsed.students.length !== 12
      ) {
        const fresh = seedInitialData();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
        return fresh;
      }
      return parsed;
    } catch (err) {
      console.error('Failed to read from localStorage:', err);
      const seeded = seedInitialData();
      return seeded;
    }
  },

  save(db: DatabaseSchema) {
    try {
      db.lastUpdated = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    } catch (err) {
      console.error('Failed to save to localStorage:', err);
    }
  },

  reset(): DatabaseSchema {
    const fresh = seedInitialData();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    return fresh;
  },

  exportJSON(): string {
    const db = this.get();
    return JSON.stringify(db, null, 2);
  },

  importJSON(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.users || !parsed.students || !parsed.bills) {
        throw new Error('Format database JSON tidak valid');
      }
      parsed.lastUpdated = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      return true;
    } catch (err) {
      console.error('Failed to import DB JSON:', err);
      return false;
    }
  }
};
