"use client"
import SpreadsheetForm from './SpreadsheetForm'
import { NERACA_ROWS, NERACA_COLORS } from '@/lib/neraca'

export default function NeracaForm({ year, onMessage }: { year: string, onMessage: (msg: any) => void }) {
  return (
    <SpreadsheetForm
      year={year}
      category="neraca"
      title="Neraca"
      rows={NERACA_ROWS}
      colors={NERACA_COLORS}
      onMessage={onMessage}
    />
  )
}
