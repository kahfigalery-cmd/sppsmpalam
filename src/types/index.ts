/**
 * Type definitions for Sistem Informasi Pembayaran SPP & Uang Tahunan
 * SMP ALAM EXCELLENTIA PAMEKASAN
 */

export type UserRole = 'admin' | 'petugas' | 'kepsek'; // admin: Administrator/Kepsek (Full Akses), petugas: Bendahara (Operasional), kepsek: Kepala Sekolah (Monitoring & Laporan)

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  email: string;
  passwordHash: string;
  lastLogin?: string;
  active: boolean;
  avatarUrl?: string;
  loginProvider?: 'email' | 'google';
}

export type StudentStatus = 'aktif' | 'tidak_aktif' | 'lulus' | 'pindah';
export type Gender = 'L' | 'P';

export interface Student {
  id: string;
  nis: string; // Unique
  nama: string;
  jenisKelamin: Gender;
  kelasId: string;
  tahunMasuk: number;
  namaWali: string;
  noHpWali: string;
  alamat: string;
  nominalSppKhusus?: number;
  status: StudentStatus;
  keterangan?: string;
  saldoKredit: number;
  createdAt: string;
}

export interface ClassRoom {
  id: string;
  nama: string; // e.g. "VII (Al-Khawarizmi)", "VIII (Albatenius)", "IX (Avicena)"
  tingkat: 7 | 8 | 9;
  waliKelas: string;
  kapasitas: number;
}

export interface AcademicYear {
  id: string;
  nama: string; // "2026/2027"
  aktif: boolean;
  tanggalMulai: string;
  tanggalSelesai: string;
}

export interface FeeTariff {
  id: string;
  tahunAjaranId: string;
  tingkat: 7 | 8 | 9;
  nominalDefault: number; // Rp 300.000
  tanggalJatuhTempo: number; // e.g. 10
  berlakuMulai: string;
  keterangan?: string;
}

// Uang Tahunan components
export interface AnnualFeeComponent {
  id: string;
  nama: string; // ATK, KBM dan Ekstrakurikuler, Buku dan Media Pembelajaran, Kalender
  nominal: number;
}

export interface AnnualFeeBill {
  id: string;
  studentId: string;
  tahunAjaranId: string;
  totalTagihan: number; // e.g. 2.700.000
  nominalTerbayar: number;
  sisaTagihan: number;
  status: 'lunas' | 'dicicil' | 'belum_bayar';
}

export interface AnnualFeePayment {
  id: string;
  noTransaksi: string;
  studentId: string;
  nis: string;
  studentNama: string;
  kelasNama: string;
  tanggalBayar: string;
  nominalBayar: number;
  sisaSetelah: number;
  statusSetelah: 'lunas' | 'dicicil';
  metodeBayar: PaymentMethod;
  buktiPembayaranUrl?: string; // Base64 or uploaded image URL
  petugasId: string;
  petugasNama: string;
  catatan?: string;
  createdAt: string;
}

export type BillStatus = 'lunas' | 'belum_lunas' | 'belum_bayar';

export interface Bill {
  id: string;
  studentId: string;
  tahunAjaranId: string;
  bulan: string; // e.g. "Juli", "Agustus"
  urutanBulan: number; // 1 for Juli, 2 for Agustus, ..., 12 for Juni
  tahun: number;
  nominalTagihan: number;
  nominalDiskon: number;
  nominalTerbayar: number;
  sisaTagihan: number;
  status: BillStatus;
  jatuhTempo: string;
}

export type PaymentMethod = 'tunai' | 'transfer_bri' | 'transfer_bsi' | 'transfer_mandiri' | 'qris';

export interface TransactionAllocation {
  billId: string;
  bulan: string;
  tahun: number;
  nominalTagihan: number;
  nominalDialokasikan: number;
  sisaSetelahAlokasi: number;
  statusSetelah: BillStatus;
}

export interface TransactionCorrection {
  tanggal: string;
  petugasNama: string;
  alasan: string;
  detailSebelum: string;
}

export interface Transaction {
  id: string;
  noTransaksi: string; // e.g. TRX-202610-0001
  studentId: string;
  nis: string;
  studentNama: string;
  kelasNama: string;
  tanggalBayar: string;
  metodeBayar: PaymentMethod;
  totalBayar: number;
  alokasiBulan: TransactionAllocation[];
  saldoKreditDigunakan?: number;
  saldoKreditDihasilkan?: number;
  buktiPembayaranUrl?: string; // Uploaded payment proof image
  petugasId: string;
  petugasNama: string;
  status: 'berhasil' | 'dibatalkan' | 'dikoreksi';
  catatan?: string;
  riwayatKoreksi?: TransactionCorrection[];
  createdAt: string;
}

export interface Discount {
  id: string;
  studentId: string;
  studentNama?: string;
  jenis: 'prestasi' | 'yatim_dhuafa' | 'anak_guru' | 'keringanan_khusus';
  tipe: 'persen' | 'nominal';
  nilai: number;
  nomorSk?: string;
  keterangan: string;
  disetujuiOleh: string;
  tanggalMulai: string;
  aktif: boolean;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userNama: string;
  role: UserRole;
  aksi: string;
  detail: string;
  ipAddress?: string;
}

export interface SchoolProfile {
  nama: string;
  yayasan: string;
  npsn: string;
  alamat: string;
  telepon: string;
  email: string;
  website: string;
  kepalaSekolah: string;
  bendahara: string;
  logoUrl: string;
  rekeningInfo: string;
  biayaSppDefault: number;
}
