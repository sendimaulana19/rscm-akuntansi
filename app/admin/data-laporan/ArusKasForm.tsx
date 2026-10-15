'use client'
import SpreadsheetForm from './SpreadsheetForm'
import { ARUSKAS_ROWS } from '@/lib/aruskas'
import { OPERASIONAL_COLORS } from '@/lib/operasional'

export default function ArusKasForm({ year, onMessage }: { year: string, onMessage: (msg: any) => void }) {
  return (
    <SpreadsheetForm
      year={year}
      category="arus_kas"
      title="Laporan Arus Kas"
      rows={ARUSKAS_ROWS}
      colors={OPERASIONAL_COLORS}
      redRows={name => name.includes('APBN')}
      onMessage={onMessage}
    />
  )
}
