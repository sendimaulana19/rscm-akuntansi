import { parseNumber } from './neraca'

export type ParsedReportRow = { item_name: string; values: (number | null)[] }

/**
 * Parse data yang ditempel dari Excel (tab-separated) berdasarkan URUTAN baris template.
 * - Kolom nama (teks) di awal baris otomatis diabaikan jika ada.
 * - Mendukung tempel dengan atau tanpa baris kosong pemisah.
 * Nama baris disimpan memakai nama di template agar baris bernama sama tidak bertabrakan.
 */
export function parseByTemplate(
  tsv: string,
  template: { name: string; style: string }[],
): ParsedReportRow[] {
  const lines = tsv.replace(/\r/g, '').split('\n')
  while (lines.length && !lines[lines.length - 1].trim()) lines.pop()

  const full = template
  const nonBlank = template.filter(r => r.style !== 'blank')

  let pairs: { row: { name: string; style: string }; line: string }[] = []
  if (lines.length === full.length) {
    pairs = full.map((row, i) => ({ row, line: lines[i] }))
  } else if (lines.length === nonBlank.length) {
    pairs = nonBlank.map((row, i) => ({ row, line: lines[i] }))
  } else {
    const filled = lines.filter(l => l.trim().length > 0)
    pairs = filled.slice(0, nonBlank.length).map((line, i) => ({ row: nonBlank[i], line }))
  }

  const result: ParsedReportRow[] = []
  for (const { row, line } of pairs) {
    if (row.style === 'blank') continue
    let cells = line.split('\t')
    const first = (cells[0] ?? '').trim()
    if (first && parseNumber(first) === null) cells = cells.slice(1)
    const values = Array.from({ length: 12 }, (_, i) => parseNumber(cells[i]))
    result.push({ item_name: row.name, values })
  }
  return result
}
