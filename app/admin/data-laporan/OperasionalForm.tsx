'use client'
import SpreadsheetForm from './SpreadsheetForm'
import { OPERASIONAL_ROWS, OPERASIONAL_COLORS } from '@/lib/operasional'

export default function OperasionalForm({ year, onMessage }: { year: string, onMessage: (msg: any) => void }) {
  return (
    <SpreadsheetForm
      year={year}
      category="operasional"
      title="Laporan Operasional"
      rows={OPERASIONAL_ROWS}
      colors={OPERASIONAL_COLORS}
      onMessage={onMessage}
    />
  )
}
