"use client"
import SpreadsheetForm, { SheetRow } from './SpreadsheetForm'

export const INDIKATOR_ROWS: SheetRow[] = [
  { name: 'EBITDA', style: 'white' },
  { name: 'Arus Kas Bersih', style: 'white' },
  { name: 'Pendapatan Operasional', style: 'white' },
  { name: 'Rasio Beban Pegawai', style: 'white' },
  { name: 'Rasio Beban Persediaan Farmasi', style: 'white' },
  { name: 'Rasio Beban Non Farmasi', style: 'white' },
  { name: 'Margin Laba Kotor', style: 'white' },
  { name: 'Margin Laba Usaha', style: 'white' },
  { name: 'EBITDA Margin', style: 'white' },
  { name: 'Perputaran Piutang', style: 'white' },
  { name: 'Perputaran Persediaan', style: 'white' },
  { name: 'Perputaran Utang', style: 'white' },
]

export default function IndikatorForm({ year, onMessage }: { year: string, onMessage: (msg: any) => void }) {
  return (
    <SpreadsheetForm
      year={year}
      category="12_indikator"
      title="12 Indikator Kinerja"
      rows={INDIKATOR_ROWS}
      colors={{ white: '#ffffff' }}
      onMessage={onMessage}
    />
  )
}
