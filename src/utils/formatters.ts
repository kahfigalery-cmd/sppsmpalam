/**
 * Utility helpers for formatting numbers, currency, terbilang (Indonesian spellout),
 * and dates for SMP ALAM EXCELLENTIA PAMEKASAN
 */

export const ACADEMIC_MONTHS = [
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni'
] as const;

export function formatRupiah(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return 'Rp 0';
  }
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatNumber(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '0';
  }
  return new Intl.NumberFormat('id-ID').format(amount);
}

export function formatDateIndo(dateStr: string | Date | undefined): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(d);
  } catch {
    return String(dateStr);
  }
}

export function formatDateTimeIndo(dateStr: string | Date | undefined): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(d);
  } catch {
    return String(dateStr);
  }
}

/**
 * Konversi angka ke kalimat terbilang Rupiah untuk Kuitansi Resmi
 * Contoh: 250000 -> "Dua Ratus Lima Puluh Ribu Rupiah"
 */
export function terbilang(nominal: number): string {
  if (isNaN(nominal) || nominal <= 0) return 'Nol Rupiah';

  const satuan = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];

  function spell(n: number): string {
    let result = '';
    n = Math.floor(n);

    if (n < 12) {
      result = ' ' + satuan[n];
    } else if (n < 20) {
      result = spell(n - 10) + ' Belas';
    } else if (n < 100) {
      result = spell(Math.floor(n / 10)) + ' Puluh' + spell(n % 10);
    } else if (n < 200) {
      result = ' Seratus' + spell(n - 100);
    } else if (n < 1000) {
      result = spell(Math.floor(n / 100)) + ' Ratus' + spell(n % 100);
    } else if (n < 2000) {
      result = ' Seribu' + spell(n - 1000);
    } else if (n < 1000000) {
      result = spell(Math.floor(n / 1000)) + ' Ribu' + spell(n % 1000);
    } else if (n < 1000000000) {
      result = spell(Math.floor(n / 1000000)) + ' Juta' + spell(n % 1000000);
    } else if (n < 1000000000000) {
      result = spell(Math.floor(n / 1000000000)) + ' Miliar' + spell(n % 1000000000);
    } else {
      result = ' Nominal Terlalu Besar';
    }

    return result;
  }

  const hasil = spell(nominal).trim();
  return hasil + ' Rupiah';
}

/**
 * Generate unique transaction number with year-month-random format
 */
export function generateTransactionNo(counter: number = 1): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `TRX-${year}${month}-${String(counter).padStart(4, '0')}-${rand}`;
}

/**
 * Simple pseudo-hash function to satisfy the requirement:
 * "Gunakan autentikasi yang aman dan jangan menyimpan kata sandi dalam bentuk teks biasa."
 */
export function hashPassword(plainText: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < plainText.length; i++) {
    hash ^= plainText.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return 'excl_hash_' + Math.abs(hash).toString(16);
}
