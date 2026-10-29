export interface KpiRow {
  id: string
  no: number | string
  poin_penilaian: string
  periode?: string
  target: string
  m1: string | number | null
  m2: string | number | null
  m3: string | number | null
  m4: string | number | null
  m5: string | number | null
  m6: string | number | null
  m7: string | number | null
  m8: string | number | null
  m9: string | number | null
  m10: string | number | null
  m11: string | number | null
  m12: string | number | null
  rata_rata?: string | number | null
  analisis: string
  rencana_tindak_lanjut: string
}

export interface IsoLikeRow {
  id: string
  no: number | string
  poin_penilaian: string
  target: string
  capaian: string
  nilai: string
}

export interface RscmAwardRow {
  id: string
  no: number | string
  poin_penilaian: string
  target: string
  capaian: string
  nilai: string
  rencana_tindak_lanjut: string
  deadline: string
}

export const MONTH_KEYS = ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8', 'm9', 'm10', 'm11', 'm12'] as const
export const MONTH_NAMES_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
export const MONTH_NAMES_FULL = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

export function parseNum(raw: any): number | null {
  if (raw === null || raw === undefined || raw === '') return null
  if (typeof raw === 'number') return isNaN(raw) ? null : raw
  const s = String(raw).trim().replace(/\s/g, '').replace(/^Rp/i, '').replace(/%$/, '')
  if (!s || s === '-' || s === '–') return null
  const clean = s.includes(',') && !s.includes('.') ? s.replace(',', '.') : s.replace(/,/g, '')
  const n = parseFloat(clean)
  return isNaN(n) ? null : n
}

export function calculateAverageKpi(row: KpiRow): string {
  const vals: number[] = []
  for (let i = 1; i <= 12; i++) {
    const val = (row as any)[`m${i}`]
    const parsed = parseNum(val)
    if (parsed !== null) vals.push(parsed)
  }
  if (vals.length === 0) return '—'
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length
  return avg.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 2 }) + '%'
}

export const DEFAULT_KPI_ROWS: KpiRow[] = []
export const DEFAULT_ISO_LIKE_ROWS: IsoLikeRow[] = []
export const DEFAULT_RSCM_AWARD_ROWS: RscmAwardRow[] = []
