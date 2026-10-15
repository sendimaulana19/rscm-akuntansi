export type NeracaStyle = 'yellow' | 'teal' | 'white'

export interface NeracaRow { name: string; style: NeracaStyle }

export const NERACA_COLORS: Record<NeracaStyle, string> = {
  yellow: '#ffff00',
  teal: '#268484',
  white: '#ffffff',
}

const Y = 'yellow', T = 'teal', W = 'white'
const r = (name: string, style: NeracaStyle): NeracaRow => ({ name, style })

// Urutan dan warna baris tabel Neraca (font hitam semua)
export const NERACA_ROWS: NeracaRow[] = [
  r('Aset', Y),
  r('Aset Lancar', T),
  r('Kas dan Setara Kas', W),
  r('Belanja Dibayar Dimuka dan Uang Muka', W),
  r('Piutang', W),
  r('Persediaan', W),
  r('Pendapatan Yang Masih Harus Diterima', W),
  r('Investasi Keuangan Jangka Pendek', W),
  r('Aset Lancar Lainnya', W),
  r('Bagian Lancar Piutang Jangka Panjang', W),
  r('Aset Tidak Lancar', T),
  r('Piutang Jangka Panjang', W),
  r('Investasi Jangka Panjang', W),
  r('Properti Investasi', W),
  r('Aset Tetap', W),
  r('Aset Tak Berwujud', W),
  r('Uang Muka Belanja Modal', W),
  r('Aset Tidak Lancar Lainnya', W),
  r('Kewajiban dan Ekuitas', Y),
  r('Kewajiban', Y),
  r('Kewajiban Jangka Pendek', T),
  r('Utang kepada Pihak Ketiga', W),
  r('Biaya yang masih Harus Dibayar', W),
  r('Pendapatan Diterima Dimuka', W),
  r('Utang Bank Jangka Pendek', W),
  r('Utang Pajak (sebagai WAPU)', W),
  r('Kewajiban Jangka Pendek Lainnya', W),
  r('Bagian Lancar Kewajiban Jangka Panjang', W),
  r('Kewajiban Jangka Panjang', Y),
  r('Pinjaman Bank', W),
  r('Pinjaman Pihak Ketiga Lainnya', W),
  r('Kewajiban Pasca Kerja', W),
  r('Ekuitas', Y),
  r('Saldo awal', T),
  r('Surplus/Defisit Tahun Berjalan', T),
  r('Koreksi Kenaikan (penurunan) Ekuitas', T),
  r('Penyesuaian Nilai Aset', W),
  r('Transaksi Antar Entitas', W),
  r('Jumlah Kewajiban dan Ekuitas', Y),
]

// Kartu grid Neraca: judul kartu -> nama baris sumber data
export const NERACA_GRID: { label: string; source: string }[] = [
  { label: 'Kas', source: 'Kas dan Setara Kas' },
  { label: 'Piutang (Neto)', source: 'Piutang' },
  { label: 'Persediaan', source: 'Persediaan' },
  { label: 'Aset (Neto)', source: 'Aset' },
  { label: 'Kewajiban Jangka Pendek', source: 'Kewajiban Jangka Pendek' },
  { label: 'Ekuitas', source: 'Ekuitas' },
]

export const normName = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim()

export function parseNumber(raw: string | undefined | null): number | null {
  if (raw == null) return null
  let s = String(raw).trim().replace(/\s/g, '').replace(/^Rp/i, '')
  if (!s) return null
  if (s === '-' || s === '–') return 0
  let neg = false
  if (/^\(.*\)$/.test(s)) { neg = true; s = s.slice(1, -1) }
  if (s.startsWith('-')) { neg = true; s = s.slice(1) }
  s = s.replace(/%$/, '')
  const hasComma = s.includes(','), hasDot = s.includes('.')
  if (hasComma && hasDot) {
    if (s.lastIndexOf(',') > s.lastIndexOf('.')) s = s.replace(/\./g, '').replace(',', '.')
    else s = s.replace(/,/g, '')
  } else if (hasComma) {
    s = /^\d{1,3}(,\d{3})+$/.test(s) ? s.replace(/,/g, '') : s.replace(',', '.')
  } else if (hasDot) {
    s = /^\d{1,3}(\.\d{3})+$/.test(s) ? s.replace(/\./g, '') : s
  }
  const n = parseFloat(s)
  if (isNaN(n)) return null
  return neg ? -n : n
}
