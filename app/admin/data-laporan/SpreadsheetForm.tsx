"use client"
import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Save, RotateCcw, Bold, Italic, PaintBucket, Type,
  Indent, Outdent, Eraser, ChevronDown, Plus, Trash2, X
} from 'lucide-react'
import { normName, parseNumber } from '@/lib/neraca'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
const IDX_WITH_SUBTOTAL = [0, 1, 2, 4, 5, 6, 9, 10, 11, 13, 14, 15]

export const DEFAULT_INDIKATOR_TARGETS: Record<string, string> = {
  'ebitda': 'Positif',
  'arus kas bersih': 'Positif',
  'pendapatan operasional': 'Linear RBA',
  'rasio beban pegawai': '≤ 45%',
  'rasio beban persediaan farmasi': '≤ 25%',
  'rasio beban non farmasi': '≤ 5%',
  'margin laba kotor': '≥ 25%',
  'margin laba usaha': '≥ 10%',
  'ebitda margin': '≥ 15%',
  'perputaran piutang': '≤ 40 hari',
  'perputaran persediaan': '≤ 60 hari',
  'perputaran utang': '≤ 60 hari',
}

export type SheetRow = { name: string; style: string }

export const displayName = (name: string) => name.replace(/ \((Operasi|Investasi|Pendanaan|Ranap)\)$/, '')

export interface ColumnDef {
  key: string
  label: string
  isCustom?: boolean
}

export interface SheetRowDef {
  id: string
  name: string
  style: string
  isCustom?: boolean
}

export interface RowStyle {
  customName?: string
  bold?: boolean
  italic?: boolean
  color?: string
  bgColor?: string
  indent?: number
  order?: number
}

export interface CellStyle {
  bold?: boolean
  italic?: boolean
  color?: string
  bgColor?: string
}

interface Props {
  year: string
  category: string
  title: string
  rows: SheetRow[]
  colors: Record<string, string>
  redRows?: (name: string) => boolean
  onMessage: (m: { type: 'ok' | 'err'; text: string } | null) => void
}

const PRESET_FONT_COLORS = [
  { label: 'Hitam', value: '#000000' },
  { label: 'Merah RSCM', value: '#e11d48' },
  { label: 'Biru', value: '#1d4ed8' },
  { label: 'Hijau', value: '#15803d' },
  { label: 'Abu-abu', value: '#475569' },
  { label: 'Putih', value: '#ffffff' },
]

const PRESET_BG_COLORS = [
  { label: 'Putih', value: '#ffffff' },
  { label: 'Kuning Neraca', value: '#ffff00' },
  { label: 'Teal RSCM', value: '#268484' },
  { label: 'Lime RSCM', value: '#d0db41' },
  { label: 'Abu Terang', value: '#f1f5f9' },
  { label: 'Biru Lembut', value: '#e0f2fe' },
  { label: 'Merah Lembut', value: '#fee2e2' },
  { label: 'Hijau Lembut', value: '#dcfce7' },
  { label: 'Transparan', value: 'transparent' },
]

export default function SpreadsheetForm({ year, category, title, rows: initialTemplateRows, colors, redRows, onMessage }: Props) {
  const supabase = createClient()

  // Columns definition (defaults to 12 months Jan-Des, plus Target column if 12_indikator)
  const defaultColumns = useCallback((): ColumnDef[] => {
    if (category === '12_indikator') {
      return [
        { key: 'target', label: 'Target', isCustom: false },
        ...MONTHS.map((m, i) => ({ key: 'm' + (i + 1), label: m, isCustom: false }))
      ]
    }
    return MONTHS.map((m, i) => ({ key: 'm' + (i + 1), label: m, isCustom: false }))
  }, [category])

  const [columns, setColumns] = useState<ColumnDef[]>(defaultColumns)
  
  // Rows definition (template rows + custom added rows)
  const [sheetRows, setSheetRows] = useState<SheetRowDef[]>(() =>
    initialTemplateRows.map((r, i) => ({
      id: `row-${i}-${r.name}`,
      name: r.name,
      style: r.style,
      isCustom: false
    }))
  )
  
  const [grid, setGrid] = useState<string[][]>(() => {
    const cols = category === '12_indikator'
      ? [{ key: 'target', label: 'Target', isCustom: false }, ...MONTHS.map((m, i) => ({ key: 'm' + (i + 1), label: m, isCustom: false }))]
      : MONTHS.map((m, i) => ({ key: 'm' + (i + 1), label: m, isCustom: false }))
    return initialTemplateRows.map(r => cols.map(col => {
      if (col.key === 'target') return DEFAULT_INDIKATOR_TARGETS[normName(r.name)] || ''
      return ''
    }))
  })
  const [rowNames, setRowNames] = useState<string[]>([])
  const [rowStyles, setRowStyles] = useState<Record<number, RowStyle>>({})
  const [cellStyles, setCellStyles] = useState<Record<string, CellStyle>>({})
  const [deletedItemNames, setDeletedItemNames] = useState<string[]>([])

  const [activeRow, setActiveRow] = useState<number | null>(0)
  const [activeCol, setActiveCol] = useState<number | null>(null)
  const [scope, setScope] = useState<'row' | 'cell'>('row')
  
  const [showFontColorMenu, setShowFontColorMenu] = useState(false)
  const [showBgColorMenu, setShowBgColorMenu] = useState(false)
  
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)

  const fontColorRef = useRef<HTMLDivElement>(null)
  const bgColorRef = useRef<HTMLDivElement>(null)

  // Default template style generator
  const getDefaultRowStyle = useCallback((row: SheetRowDef): RowStyle => {
    return {
      bold: row.style !== 'white',
      italic: false,
      color: redRows?.(row.name) ? '#e11d48' : '#000000',
      bgColor: colors[row.style] ?? '#ffffff',
      indent: row.style === 'white' ? 1 : 0
    }
  }, [colors, redRows])

  // Click outside to close color menus
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (fontColorRef.current && !fontColorRef.current.contains(e.target as Node)) {
        setShowFontColorMenu(false)
      }
      if (bgColorRef.current && !bgColorRef.current.contains(e.target as Node)) {
        setShowBgColorMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const load = useCallback(async () => {
    const y = parseInt(year)
    if (!y) {
      const defCols = defaultColumns()
      setColumns(defCols)
      setSheetRows(initialTemplateRows.map((r, i) => ({ id: `row-${i}-${r.name}`, name: r.name, style: r.style, isCustom: false })))
      setGrid(initialTemplateRows.map(r => defCols.map(col => {
        if (col.key === 'target') return DEFAULT_INDIKATOR_TARGETS[normName(r.name)] || ''
        return ''
      })))
      setRowNames(initialTemplateRows.map(r => displayName(r.name)))
      setRowStyles({})
      setCellStyles({})
      setDeletedItemNames([])
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('financial_reports_data')
        .select('item_name, data')
        .eq('category', category)
        .eq('year', y)
      setLoading(false)

      if (error) {
        onMessage({ type: 'err', text: 'Gagal memuat data: ' + error.message })
        return
      }

      // 1. Resolve columns (detect any custom columns saved in database)
      let loadedColumns = defaultColumns()
      const firstWithColumns = (data ?? []).find((d: any) => d.data?._columns && Array.isArray(d.data._columns))
      if (firstWithColumns && firstWithColumns.data._columns.length > 0) {
        loadedColumns = firstWithColumns.data._columns
        // If 12_indikator and 'target' column is not in saved _columns, insert Target at index 0
        if (category === '12_indikator' && !loadedColumns.some((c: any) => c.key === 'target')) {
          loadedColumns = [{ key: 'target', label: 'Target', isCustom: false }, ...loadedColumns]
        }
      }
      setColumns(loadedColumns)

      // 2. Resolve rows
      let byName = new Map((data ?? []).map((d: any) => [normName(d.item_name), d.data ?? {}]))

      // If 12_indikator and no data in financial_reports_data, fallback to kinerja_keuangan table
      if (category === '12_indikator' && (!data || data.length === 0)) {
        try {
          const { data: kk } = await supabase
            .from('kinerja_keuangan')
            .select('*')
            .eq('tahun', y)

          if (kk && kk.length > 0) {
            const mapMetric: Record<string, string> = {
              'ebitda': 'EBITDA',
              'arus_kas_bersih': 'Arus Kas Bersih',
              'pendapatan_operasional': 'Pendapatan Operasional',
              'rasio_beban_pegawai': 'Rasio Beban Pegawai',
              'rasio_beban_persediaan_farmasi': 'Rasio Beban Persediaan Farmasi',
              'rasio_beban_persediaan_non_farmasi': 'Rasio Beban Non Farmasi',
              'margin_laba_kotor': 'Margin Laba Kotor',
              'margin_laba_usaha': 'Margin Laba Usaha',
              'ebitda_margin': 'EBITDA Margin',
              'perputaran_piutang': 'Perputaran Piutang',
              'perputaran_persediaan': 'Perputaran Persediaan',
              'perputaran_utang': 'Perputaran Utang',
            }

            const kkDataByName: Record<string, Record<string, any>> = {}
            Object.values(mapMetric).forEach(label => {
              kkDataByName[normName(label)] = {}
            })

            kk.forEach((row: any) => {
              const mKey = 'm' + row.bulan
              Object.entries(mapMetric).forEach(([dbCol, label]) => {
                const val = row[dbCol]
                if (val !== null && val !== undefined) {
                  const nKey = normName(label)
                  if (!kkDataByName[nKey]) kkDataByName[nKey] = {}
                  kkDataByName[nKey][mKey] = val
                }
              })
            })

            byName = new Map(Object.entries(kkDataByName))
          }
        } catch (e) {
          console.warn('Fallback kinerja_keuangan check failed:', e)
        }
      }

      // Template rows
      const resolvedRows: SheetRowDef[] = initialTemplateRows.map((tr, i) => ({
      id: `tmpl-${i}-${tr.name}`,
      name: tr.name,
      style: tr.style,
      isCustom: false
    }))

    // Check if there are custom added rows in database
    const templateNameSet = new Set(initialTemplateRows.map(tr => normName(tr.name)))
    const customDbRows: SheetRowDef[] = (data ?? [])
      .filter((d: any) => !templateNameSet.has(normName(d.item_name)))
      .map((d: any, i: number) => ({
        id: `custom-db-${i}-${d.item_name}`,
        name: d.item_name,
        style: 'white',
        isCustom: true
      }))

    // Combine and sort by saved order if available
    const combinedRows = [...resolvedRows, ...customDbRows].sort((a, b) => {
      const orderA = byName.get(normName(a.name))?._style?.order
      const orderB = byName.get(normName(b.name))?._style?.order
      if (orderA !== undefined && orderB !== undefined) return orderA - orderB
      return 0
    })

    setSheetRows(combinedRows)

    // 3. Resolve grid values & styles
    const loadedGrid: string[][] = []
    const loadedRowNames: string[] = []
    const loadedRowStyles: Record<number, RowStyle> = {}
    const loadedCellStyles: Record<string, CellStyle> = {}

    combinedRows.forEach((row, r) => {
      const d: any = byName.get(normName(row.name)) ?? {}
      
      // Values for each column
      const rowVals = loadedColumns.map(col => {
        if (col.key === 'target') {
          if (d.target !== undefined && d.target !== null && d.target !== '') {
            return String(d.target)
          }
          if (d['target'] !== undefined && d['target'] !== null && d['target'] !== '') {
            return String(d['target'])
          }
          return DEFAULT_INDIKATOR_TARGETS[normName(row.name)] || ''
        }
        return d[col.key] != null ? String(d[col.key]) : ''
      })
      loadedGrid.push(rowVals)

      // Names & styles
      const defaultSt = getDefaultRowStyle(row)
      const savedName = d._style?.customName || displayName(row.name)
      loadedRowNames.push(savedName)

      if (d._style) {
        loadedRowStyles[r] = {
          customName: savedName,
          bold: d._style.bold !== undefined ? d._style.bold : defaultSt.bold,
          italic: d._style.italic !== undefined ? d._style.italic : defaultSt.italic,
          color: d._style.color !== undefined ? d._style.color : defaultSt.color,
          bgColor: d._style.bgColor !== undefined ? d._style.bgColor : defaultSt.bgColor,
          indent: d._style.indent !== undefined ? d._style.indent : defaultSt.indent,
          order: d._style.order !== undefined ? d._style.order : r,
        }
      } else {
        loadedRowStyles[r] = { ...defaultSt, customName: savedName, order: r }
      }

      if (d._cellStyles) {
        loadedColumns.forEach((col, c) => {
          if (d._cellStyles[col.key]) {
            loadedCellStyles[`${r}-${c}`] = d._cellStyles[col.key]
          }
        })
      }
    })

    setGrid(loadedGrid)
    setRowNames(loadedRowNames)
    setRowStyles(loadedRowStyles)
    setCellStyles(loadedCellStyles)
    setDeletedItemNames([])
  } catch (err: any) {
    setLoading(false)
    console.warn('Gagal memuat data:', err)
    onMessage({ type: 'err', text: 'Gagal memuat data: ' + (err?.message || 'Terjadi gangguan jaringan') })
  }
}, [supabase, year, category, initialTemplateRows, defaultColumns, onMessage, getDefaultRowStyle])

  useEffect(() => { load() }, [load])

  const setCell = (r: number, c: number, v: string) =>
    setGrid(g => g.map((row, i) => i === r ? row.map((x, j) => j === c ? v : x) : row))

  // ════════════ ROW & COLUMN MANIPULATION ════════════
  const addRow = (targetIdx?: number) => {
    const insertAt = targetIdx !== undefined ? targetIdx + 1 : (activeRow !== null ? activeRow + 1 : sheetRows.length)
    const newId = `new-row-${Date.now()}`
    const newRowDef: SheetRowDef = {
      id: newId,
      name: `Baris Baru ${sheetRows.length + 1}`,
      style: 'white',
      isCustom: true
    }

    setSheetRows(prev => {
      const next = [...prev]
      next.splice(insertAt, 0, newRowDef)
      return next
    })

    setGrid(prev => {
      const next = [...prev]
      next.splice(insertAt, 0, Array<string>(columns.length).fill(''))
      return next
    })

    setRowNames(prev => {
      const next = [...prev]
      next.splice(insertAt, 0, newRowDef.name)
      return next
    })

    setRowStyles(prev => {
      const next: Record<number, RowStyle> = {}
      Object.entries(prev).forEach(([key, val]) => {
        const k = Number(key)
        if (k < insertAt) next[k] = val
        else next[k + 1] = val
      })
      next[insertAt] = {
        customName: newRowDef.name,
        bold: false,
        italic: false,
        color: '#000000',
        bgColor: '#ffffff',
        indent: 1,
        order: insertAt
      }
      return next
    })

    setActiveRow(insertAt)
    setActiveCol(null)
  }

  const deleteRow = (r: number) => {
    if (sheetRows.length <= 1) {
      alert('Tidak dapat menghapus semua baris.')
      return
    }
    const targetRow = sheetRows[r]
    const rowTitle = rowNames[r] || displayName(targetRow.name)
    if (!confirm(`Hapus baris "${rowTitle}"?`)) return

    // Track for deletion from database
    setDeletedItemNames(prev => [...prev, targetRow.name, targetRow.isCustom ? rowTitle : ''])

    setSheetRows(prev => prev.filter((_, i) => i !== r))
    setGrid(prev => prev.filter((_, i) => i !== r))
    setRowNames(prev => prev.filter((_, i) => i !== r))

    setRowStyles(prev => {
      const next: Record<number, RowStyle> = {}
      Object.entries(prev).forEach(([key, val]) => {
        const k = Number(key)
        if (k < r) next[k] = val
        else if (k > r) next[k - 1] = val
      })
      return next
    })

    setCellStyles(prev => {
      const next: Record<string, CellStyle> = {}
      Object.entries(prev).forEach(([key, val]) => {
        const [rowStr, colStr] = key.split('-')
        const rowNum = Number(rowStr)
        if (rowNum < r) next[key] = val
        else if (rowNum > r) next[`${rowNum - 1}-${colStr}`] = val
      })
      return next
    })

    setActiveRow(r > 0 ? r - 1 : 0)
    setActiveCol(null)
  }

  const addColumn = (targetIdx?: number) => {
    const insertAt = targetIdx !== undefined ? targetIdx + 1 : (activeCol !== null ? activeCol + 1 : columns.length)
    const colKey = `c_${Date.now()}`
    const colLabel = `Kolom ${columns.length + 1}`
    const newCol: ColumnDef = { key: colKey, label: colLabel, isCustom: true }

    setColumns(prev => {
      const next = [...prev]
      next.splice(insertAt, 0, newCol)
      return next
    })

    setGrid(prev => prev.map(row => {
      const next = [...row]
      next.splice(insertAt, 0, '')
      return next
    }))

    setCellStyles(prev => {
      const next: Record<string, CellStyle> = {}
      Object.entries(prev).forEach(([key, val]) => {
        const [rowStr, colStr] = key.split('-')
        const colNum = Number(colStr)
        if (colNum < insertAt) next[key] = val
        else next[`${rowStr}-${colNum + 1}`] = val
      })
      return next
    })

    setActiveCol(insertAt)
  }

  const deleteColumn = (c: number) => {
    if (columns.length <= 1) {
      alert('Tidak dapat menghapus semua kolom.')
      return
    }
    const col = columns[c]
    if (col.key === 'target') {
      alert('Kolom Target tidak dapat dihapus.')
      return
    }
    if (!confirm(`Hapus kolom "${col.label}"?`)) return

    setColumns(prev => prev.filter((_, idx) => idx !== c))
    setGrid(prev => prev.map(row => row.filter((_, idx) => idx !== c)))

    setCellStyles(prev => {
      const next: Record<string, CellStyle> = {}
      Object.entries(prev).forEach(([key, val]) => {
        const [rowStr, colStr] = key.split('-')
        const colNum = Number(colStr)
        if (colNum < c) next[key] = val
        else if (colNum > c) next[`${rowStr}-${colNum - 1}`] = val
      })
      return next
    })

    if (activeCol === c) setActiveCol(null)
    else if (activeCol !== null && activeCol > c) setActiveCol(activeCol - 1)
  }

  const setColumnLabel = (c: number, label: string) => {
    setColumns(prev => prev.map((col, idx) => idx === c ? { ...col, label } : col))
  }

  // ════════════ FORMATTING CONTROLS ════════════
  const currentTargetStyle = (): { bold: boolean; italic: boolean; color: string; bgColor: string; indent: number } => {
    if (activeRow === null || activeRow >= sheetRows.length) {
      return { bold: false, italic: false, color: '#000000', bgColor: '#ffffff', indent: 0 }
    }
    const rSt = rowStyles[activeRow] || getDefaultRowStyle(sheetRows[activeRow])
    if (scope === 'cell' && activeCol !== null) {
      const cSt = cellStyles[`${activeRow}-${activeCol}`]
      return {
        bold: cSt?.bold !== undefined ? cSt.bold : (rSt.bold ?? false),
        italic: cSt?.italic !== undefined ? cSt.italic : (rSt.italic ?? false),
        color: cSt?.color || (rSt.color ?? '#000000'),
        bgColor: cSt?.bgColor || (rSt.bgColor ?? '#ffffff'),
        indent: rSt.indent ?? 0,
      }
    }
    return {
      bold: rSt.bold ?? false,
      italic: rSt.italic ?? false,
      color: rSt.color ?? '#000000',
      bgColor: rSt.bgColor ?? '#ffffff',
      indent: rSt.indent ?? 0,
    }
  }

  const toggleBold = () => {
    if (activeRow === null) return
    const cur = currentTargetStyle().bold
    if (scope === 'cell' && activeCol !== null) {
      const key = `${activeRow}-${activeCol}`
      setCellStyles(prev => ({ ...prev, [key]: { ...prev[key], bold: !cur } }))
    } else {
      setRowStyles(prev => ({
        ...prev,
        [activeRow]: { ...prev[activeRow], bold: !cur }
      }))
    }
  }

  const toggleItalic = () => {
    if (activeRow === null) return
    const cur = currentTargetStyle().italic
    if (scope === 'cell' && activeCol !== null) {
      const key = `${activeRow}-${activeCol}`
      setCellStyles(prev => ({ ...prev, [key]: { ...prev[key], italic: !cur } }))
    } else {
      setRowStyles(prev => ({
        ...prev,
        [activeRow]: { ...prev[activeRow], italic: !cur }
      }))
    }
  }

  const applyFontColor = (color: string) => {
    if (activeRow === null) return
    if (scope === 'cell' && activeCol !== null) {
      const key = `${activeRow}-${activeCol}`
      setCellStyles(prev => ({ ...prev, [key]: { ...prev[key], color } }))
    } else {
      setRowStyles(prev => ({
        ...prev,
        [activeRow]: { ...prev[activeRow], color }
      }))
    }
    setShowFontColorMenu(false)
  }

  const applyBgColor = (bgColor: string) => {
    if (activeRow === null) return
    if (scope === 'cell' && activeCol !== null) {
      const key = `${activeRow}-${activeCol}`
      setCellStyles(prev => ({ ...prev, [key]: { ...prev[key], bgColor } }))
    } else {
      setRowStyles(prev => ({
        ...prev,
        [activeRow]: { ...prev[activeRow], bgColor }
      }))
    }
    setShowBgColorMenu(false)
  }

  const changeIndent = (delta: number) => {
    if (activeRow === null) return
    const cur = rowStyles[activeRow]?.indent ?? getDefaultRowStyle(sheetRows[activeRow]).indent ?? 0
    const next = Math.max(0, Math.min(6, cur + delta))
    setRowStyles(prev => ({
      ...prev,
      [activeRow]: { ...prev[activeRow], indent: next }
    }))
  }

  const resetCurrentFormat = () => {
    if (activeRow === null) return
    const def = getDefaultRowStyle(sheetRows[activeRow])
    const defaultName = displayName(sheetRows[activeRow].name)
    setRowStyles(prev => ({ ...prev, [activeRow]: { ...def, customName: defaultName } }))
    setRowNames(prev => prev.map((n, i) => i === activeRow ? defaultName : n))
    setCellStyles(prev => {
      const next = { ...prev }
      for (let c = 0; c < columns.length; c++) {
        delete next[`${activeRow}-${c}`]
      }
      return next
    })
  }

  // Handle Excel block paste
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>, r0: number, c0: number) => {
    const text = e.clipboardData.getData('text')
    if (!text.includes('\t') && !text.includes('\n')) return
    e.preventDefault()
    const lines = text.replace(/\r/g, '').split('\n')
    if (lines.length && lines[lines.length - 1] === '') lines.pop()
    const matrix = lines.map(l => l.split('\t'))

    const hasLabels = matrix.some(row => row[0]?.trim() && parseNumber(row[0]) === null && /[A-Za-z]/.test(row[0]))

    setGrid(prev => {
      const next = prev.map(row => [...row])
      let cursor = 0
      matrix.forEach((cells, i) => {
        let rowIdx = r0 + i
        let vals = cells
        if (hasLabels) {
          const label = normName(cells[0] ?? '')
          if (!label) return
          let idx = sheetRows.findIndex((row, k) => k >= cursor && normName(rowNames[k] || displayName(row.name)) === label)
          if (idx === -1) idx = sheetRows.findIndex((row, k) => normName(rowNames[k] || displayName(row.name)) === label)
          if (idx === -1) return
          rowIdx = idx
          cursor = idx + 1
          vals = cells.slice(1)
        }
        if (rowIdx >= sheetRows.length || sheetRows[rowIdx].style === 'blank') return
        let startCol = hasLabels ? 0 : c0
        if (category === '12_indikator' && columns[0]?.key === 'target' && hasLabels) {
          const firstIsMonthNumber = parseNumber(vals[0]) !== null
          if (vals.length === 12 || (vals.length >= 13 && firstIsMonthNumber)) {
            startCol = 1
          }
        }
        if (vals.length >= 16 && (startCol === 0 || (category === '12_indikator' && startCol === 1))) {
          vals = IDX_WITH_SUBTOTAL.map(k => vals[k] ?? '')
        }
        vals.forEach((v, j) => {
          const col = startCol + j
          if (col < columns.length) next[rowIdx][col] = v.trim()
        })
      })
      return next
    })
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, r: number, c: number) => {
    const move = (dr: number) => {
      let nr = r + dr
      while (sheetRows[nr] && sheetRows[nr].style === 'blank') nr += dr
      const el = document.getElementById(`${category}-${nr}-${c}`) as HTMLInputElement | null
      if (el) { e.preventDefault(); el.focus(); el.select() }
    }
    if (e.key === 'Enter' || e.key === 'ArrowDown') move(1)
    else if (e.key === 'ArrowUp') move(-1)
  }

  // ════════════ SAVE TO DATABASE ════════════
  const save = async () => {
    const y = parseInt(year)
    if (!y) { onMessage({ type: 'err', text: 'Tahun tidak valid.' }); return }
    
    setSaving(true)
    onMessage(null)

    // 1. Delete rows marked for deletion from Supabase
    const toDelete = deletedItemNames.filter(Boolean)
    if (toDelete.length > 0) {
      await supabase.from('financial_reports_data')
        .delete()
        .eq('category', category)
        .eq('year', y)
        .in('item_name', toDelete)
      setDeletedItemNames([])
    }

    // 2. Prepare payload
    const payload = sheetRows.map((row, i) => {
      if (row.style === 'blank') return null
      
      const rowName = (rowNames[i] || displayName(row.name)).trim() || `Baris ${i + 1}`
      const st: RowStyle = { ...(rowStyles[i] || {}) }
      st.customName = rowName
      st.order = i

      const rowData: Record<string, any> = {
        _style: st,
        _columns: columns.map(c => ({ key: c.key, label: c.label, isCustom: c.isCustom || false }))
      }

      // Column values
      columns.forEach((col, c) => {
        const v = grid[i]?.[c]
        if (v !== undefined && v !== '') {
          if (col.key === 'target') {
            const trimmed = String(v).trim()
            rowData[col.key] = trimmed
            rowData.target = trimmed
          } else {
            const num = parseNumber(v)
            rowData[col.key] = num !== null ? num : v
          }
        } else {
          rowData[col.key] = null
          if (col.key === 'target') {
            rowData.target = null
          }
        }
      })

      // Cell styles
      const rowCellStyles: Record<string, any> = {}
      columns.forEach((col, c) => {
        const key = `${i}-${c}`
        if (cellStyles[key]) {
          rowCellStyles[col.key] = cellStyles[key]
        }
      })
      if (Object.keys(rowCellStyles).length > 0) {
        rowData._cellStyles = rowCellStyles
      }

      return {
        category,
        year: y,
        item_name: row.isCustom ? rowName : row.name,
        data: rowData,
      }
    }).filter(Boolean) as any[]

    if (payload.length === 0) {
      setSaving(false)
      onMessage({ type: 'err', text: 'Belum ada data atau baris yang diatur.' })
      return
    }

    try {
      const { error } = await supabase.from('financial_reports_data')
        .upsert(payload, { onConflict: 'category,year,item_name' })
      
      // Auto-sync 12 Indikator to kinerja_keuangan table for monthly cards/metrics
      if (category === '12_indikator' && !error) {
        try {
          const mapMetricToCol: Record<string, string> = {
            'ebitda': 'ebitda',
            'arus kas bersih': 'arus_kas_bersih',
            'pendapatan operasional': 'pendapatan_operasional',
            'rasio beban pegawai': 'rasio_beban_pegawai',
            'rasio beban persediaan farmasi': 'rasio_beban_persediaan_farmasi',
            'rasio beban non farmasi': 'rasio_beban_persediaan_non_farmasi',
            'margin laba kotor': 'margin_laba_kotor',
            'margin laba usaha': 'margin_laba_usaha',
            'ebitda margin': 'ebitda_margin',
            'perputaran piutang': 'perputaran_piutang',
            'perputaran persediaan': 'perputaran_persediaan',
            'perputaran utang': 'perputaran_utang',
          }

          const kkRecords: any[] = []
          for (let b = 1; b <= 12; b++) {
            const mKey = 'm' + b
            const colIdx = columns.findIndex(col => col.key === mKey)
            if (colIdx < 0) continue

            const record: Record<string, any> = { bulan: b, tahun: y }
            let hasAnyValue = false

            sheetRows.forEach((row, r) => {
              const norm = normName(row.name)
              const dbField = mapMetricToCol[norm]
              if (dbField) {
                const val = grid[r]?.[colIdx]
                if (val !== undefined && val !== '' && val !== null) {
                  const num = parseNumber(val)
                  record[dbField] = num !== null ? num : null
                  if (num !== null) hasAnyValue = true
                } else {
                  record[dbField] = null
                }
              }
            })

            if (hasAnyValue) {
              kkRecords.push(record)
            }
          }

          if (kkRecords.length > 0) {
            const filledMonths = kkRecords.map(r => r.bulan)
            await supabase.from('kinerja_keuangan')
              .delete()
              .eq('tahun', y)
              .not('bulan', 'in', `(${filledMonths.join(',')})`)

            await supabase.from('kinerja_keuangan').upsert(kkRecords, { onConflict: 'bulan,tahun' })
          } else {
            await supabase.from('kinerja_keuangan').delete().eq('tahun', y)
          }
        } catch (syncErr) {
          console.warn('Sync to kinerja_keuangan warning:', syncErr)
        }
      }

      setSaving(false)
      
      if (error) {
        onMessage({ type: 'err', text: 'Gagal menyimpan: ' + error.message })
      } else {
        onMessage({ type: 'ok', text: `${title} ${y}: Berhasil menyimpan ${payload.length} baris dan ${columns.length} kolom.` })
      }
    } catch (err: any) {
      setSaving(false)
      onMessage({ type: 'err', text: 'Gagal menyimpan: ' + (err?.message || 'Terjadi gangguan jaringan') })
    }
  }

  const activeFormat = currentTargetStyle()
  const activeRowObj = activeRow !== null ? sheetRows[activeRow] : null

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <p className="font-nav text-xs text-gray-500">
          Klik baris/sel untuk memilih, format tampilan, atau tambah/hapus baris & kolom secara fleksibel.
        </p>
        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-gray-100 p-1 rounded-lg text-xs font-nav font-bold">
          <span className="text-gray-500 px-1">Terapkan ke:</span>
          <button
            type="button"
            onClick={() => setScope('row')}
            className={`px-2.5 py-1 rounded transition-all ${scope === 'row' ? 'bg-white shadow text-[#00282b]' : 'text-gray-600 hover:text-black'}`}
          >
            Baris
          </button>
          <button
            type="button"
            onClick={() => setScope('cell')}
            className={`px-2.5 py-1 rounded transition-all ${scope === 'cell' ? 'bg-white shadow text-[#00282b]' : 'text-gray-600 hover:text-black'}`}
          >
            Sel
          </button>
        </div>
      </div>

      {/* ═══════ SPREADSHEET TOOLBAR ═══════ */}
      <div className="sticky top-0 z-40 bg-white border border-gray-200 rounded-xl p-2.5 mb-3 shadow-sm flex flex-wrap items-center justify-between gap-3">
        {/* Left: Format & Structure buttons */}
        <div className="flex items-center flex-wrap gap-1.5">
          {/* Bold */}
          <button
            type="button"
            title="Tebal (Bold)"
            onClick={toggleBold}
            disabled={activeRow === null}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
              activeFormat.bold
                ? 'bg-[#00282b] text-[#d0db41] shadow-sm'
                : 'text-gray-700 hover:bg-gray-100 border border-transparent'
            } disabled:opacity-30`}
          >
            <Bold size={16} strokeWidth={2.8} />
          </button>

          {/* Italic */}
          <button
            type="button"
            title="Miring (Italic)"
            onClick={toggleItalic}
            disabled={activeRow === null}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
              activeFormat.italic
                ? 'bg-[#00282b] text-[#d0db41] shadow-sm'
                : 'text-gray-700 hover:bg-gray-100 border border-transparent'
            } disabled:opacity-30`}
          >
            <Italic size={16} strokeWidth={2.8} />
          </button>

          <div className="w-[1px] h-6 bg-gray-200 mx-1" />

          {/* Font Color */}
          <div className="relative" ref={fontColorRef}>
            <button
              type="button"
              title="Warna Font"
              onClick={() => { setShowFontColorMenu(!showFontColorMenu); setShowBgColorMenu(false) }}
              disabled={activeRow === null}
              className="px-2.5 h-9 rounded-lg flex items-center gap-1.5 text-gray-700 hover:bg-gray-100 border border-gray-200 transition-all disabled:opacity-30"
            >
              <div className="flex flex-col items-center">
                <Type size={15} />
                <div className="w-4 h-1 rounded-full mt-0.5" style={{ background: activeFormat.color }} />
              </div>
              <ChevronDown size={12} className="text-gray-400" />
            </button>

            {showFontColorMenu && (
              <div className="absolute top-full left-0 mt-1.5 bg-white rounded-xl shadow-xl border border-gray-200 p-3 z-50 w-52 animate-fadeSlideUp">
                <p className="font-nav text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Pilih Warna Font</p>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {PRESET_FONT_COLORS.map(c => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => applyFontColor(c.value)}
                      className="flex items-center gap-1.5 p-1.5 rounded-lg border border-gray-100 hover:border-gray-300 transition-all text-left"
                    >
                      <span className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0" style={{ background: c.value }} />
                      <span className="text-[10px] font-nav text-gray-700 truncate">{c.label}</span>
                    </button>
                  ))}
                </div>
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs font-nav">
                  <span className="text-gray-600">Kustom:</span>
                  <input
                    type="color"
                    value={activeFormat.color.startsWith('#') ? activeFormat.color : '#000000'}
                    onChange={e => applyFontColor(e.target.value)}
                    className="w-8 h-8 rounded border-none cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Fill Color */}
          <div className="relative" ref={bgColorRef}>
            <button
              type="button"
              title="Fill Color (Latar Belakang)"
              onClick={() => { setShowBgColorMenu(!showBgColorMenu); setShowFontColorMenu(false) }}
              disabled={activeRow === null}
              className="px-2.5 h-9 rounded-lg flex items-center gap-1.5 text-gray-700 hover:bg-gray-100 border border-gray-200 transition-all disabled:opacity-30"
            >
              <div className="flex flex-col items-center">
                <PaintBucket size={15} />
                <div className="w-4 h-1 rounded-full mt-0.5" style={{ background: activeFormat.bgColor === 'transparent' ? '#ffffff' : activeFormat.bgColor }} />
              </div>
              <ChevronDown size={12} className="text-gray-400" />
            </button>

            {showBgColorMenu && (
              <div className="absolute top-full left-0 mt-1.5 bg-white rounded-xl shadow-xl border border-gray-200 p-3 z-50 w-56 animate-fadeSlideUp">
                <p className="font-nav text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Pilih Warna Latar</p>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {PRESET_BG_COLORS.map(c => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => applyBgColor(c.value)}
                      className="flex items-center gap-1.5 p-1.5 rounded-lg border border-gray-100 hover:border-gray-300 transition-all text-left"
                    >
                      <span className="w-4 h-4 rounded-md border border-gray-300 flex-shrink-0" style={{ background: c.value === 'transparent' ? '#f3f4f6' : c.value }} />
                      <span className="text-[10px] font-nav text-gray-700 truncate">{c.label}</span>
                    </button>
                  ))}
                </div>
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs font-nav">
                  <span className="text-gray-600">Kustom:</span>
                  <input
                    type="color"
                    value={activeFormat.bgColor.startsWith('#') ? activeFormat.bgColor : '#ffffff'}
                    onChange={e => applyBgColor(e.target.value)}
                    className="w-8 h-8 rounded border-none cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="w-[1px] h-6 bg-gray-200 mx-1" />

          {/* Decrease Indent */}
          <button
            type="button"
            title="Decrease Indent (Kurangi Indentasi)"
            onClick={() => changeIndent(-1)}
            disabled={activeRow === null || (activeFormat.indent ?? 0) <= 0}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-700 hover:bg-gray-100 border border-transparent transition-all disabled:opacity-30"
          >
            <Outdent size={16} />
          </button>

          {/* Increase Indent */}
          <button
            type="button"
            title="Increase Indent (Tambah Indentasi)"
            onClick={() => changeIndent(1)}
            disabled={activeRow === null || (activeFormat.indent ?? 0) >= 6}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-700 hover:bg-gray-100 border border-transparent transition-all disabled:opacity-30"
          >
            <Indent size={16} />
          </button>

          <div className="w-[1px] h-6 bg-gray-200 mx-1" />

          {/* Reset Format */}
          <button
            type="button"
            title="Kembalikan Format Bawaan Baris Ini"
            onClick={resetCurrentFormat}
            disabled={activeRow === null}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-500 hover:text-red-600 hover:bg-red-50 border border-transparent transition-all disabled:opacity-30"
          >
            <Eraser size={16} />
          </button>

          <div className="w-[1px] h-6 bg-gray-200 mx-1" />

          {/* ═══════ STRUCTURAL BUTTONS (ADD/DELETE ROWS & COLS) ═══════ */}
          {/* Add Row */}
          <button
            type="button"
            title="Tambah Baris Baru di Bawah Baris Aktif"
            onClick={() => addRow()}
            className="px-2.5 h-9 rounded-lg flex items-center gap-1.5 text-xs font-nav font-bold text-[#00282b] bg-[#eef9fa] hover:bg-[#d8f4f7] border border-[#01bcce]/30 transition-all shadow-sm"
          >
            <Plus size={14} className="text-[#01bcce]" />
            <span>+ Baris</span>
          </button>

          {/* Delete Row */}
          <button
            type="button"
            title="Hapus Baris Aktif"
            onClick={() => activeRow !== null && deleteRow(activeRow)}
            disabled={activeRow === null}
            className="px-2.5 h-9 rounded-lg flex items-center gap-1.5 text-xs font-nav font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-all disabled:opacity-30 shadow-sm"
          >
            <Trash2 size={14} />
            <span>Hapus Baris</span>
          </button>

          {/* Add Column */}
          <button
            type="button"
            title={activeCol !== null && columns[activeCol] ? `Tambah Kolom Baru di Samping Kanan "${columns[activeCol].label}"` : "Tambah Kolom Baru di Paling Kanan"}
            onClick={() => addColumn(activeCol !== null ? activeCol : undefined)}
            className="px-2.5 h-9 rounded-lg flex items-center gap-1.5 text-xs font-nav font-bold text-[#00282b] bg-[#f8fafc] hover:bg-gray-100 border border-gray-300 transition-all shadow-sm"
          >
            <Plus size={14} className="text-[#00282b]" />
            <span>+ Kolom</span>
          </button>

          {/* Delete Column */}
          <button
            type="button"
            title="Hapus Kolom Aktif"
            onClick={() => activeCol !== null && deleteColumn(activeCol)}
            disabled={activeCol === null}
            className="px-2.5 h-9 rounded-lg flex items-center gap-1.5 text-xs font-nav font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-all disabled:opacity-30 shadow-sm"
          >
            <Trash2 size={14} />
            <span>Hapus Kolom</span>
          </button>
        </div>

        {/* Right: Active context indicator */}
        <div className="flex items-center gap-2 text-xs font-nav text-gray-500">
          {activeRowObj ? (
            <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
              <span className="w-2 h-2 rounded-full bg-[#01bcce]" />
              <span>Target:</span>
              <strong className="text-gray-800 truncate max-w-[180px]">{rowNames[activeRow] || displayName(activeRowObj.name)}</strong>
              {activeCol !== null && columns[activeCol] && (
                <span className="text-[#01bcce] font-bold">Kolom: {columns[activeCol].label}</span>
              )}
            </div>
          ) : (
            <span className="italic text-gray-400">Pilih baris atau kolom pada tabel</span>
          )}
        </div>
      </div>

      {/* ═══════ THE SPREADSHEET TABLE ═══════ */}
      <div className="overflow-x-auto border border-gray-200 rounded-xl shadow-sm" style={{ maxHeight: '68vh' }}>
        <table className="border-collapse" style={{ minWidth: 1200 }}>
          <thead>
            <tr>
              <th className="font-nav text-[11px] font-extrabold p-2.5 text-center sticky left-0 top-0 z-30 shadow-[2px_0_4px_rgba(0,0,0,0.1)]" style={{ background: '#00282b', color: '#fff', minWidth: 320 }}>
                {title}
              </th>
              {columns.map((col, c) => {
                const isTargetCol = col.key === 'target'
                return (
                  <th
                    key={col.key}
                    onClick={() => { setActiveCol(c) }}
                    className={`font-nav text-[11px] font-extrabold p-1 text-center sticky top-0 z-20 transition-all group/col ${
                      activeCol === c ? 'ring-2 ring-inset ring-[#01bcce] shadow-sm' : ''
                    }`}
                    style={{ background: '#00282b', color: '#fff', minWidth: isTargetCol ? 130 : 104, width: isTargetCol ? 140 : undefined }}
                  >
                    <div className="flex items-center justify-between gap-0.5 w-full px-1">
                      <input
                        type="text"
                        value={col.label}
                        onChange={e => setColumnLabel(c, e.target.value)}
                        onFocus={() => setActiveCol(c)}
                        disabled={isTargetCol}
                        className={`bg-transparent text-white font-bold text-[11px] text-center px-1 py-1 rounded outline-none border border-transparent ${
                          isTargetCol ? 'cursor-default text-[#d0db41]' : 'hover:border-white/20 focus:border-[#d0db41] focus:bg-white/10'
                        } w-full transition-all`}
                        title={isTargetCol ? 'Kolom Target Kinerja' : 'Klik untuk mengubah nama kolom'}
                      />

                      {/* Quick column action buttons on hover */}
                      {!isTargetCol && (
                        <div className="opacity-0 group-hover/col:opacity-100 flex items-center gap-0.5 transition-opacity">
                          <button
                            type="button"
                            onClick={e => { e.stopPropagation(); addColumn(c) }}
                            title="Sisipkan kolom baru di samping kanan"
                            className="p-1 rounded text-white/70 hover:text-[#d0db41] hover:bg-white/10 transition-colors"
                          >
                            <Plus size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={e => { e.stopPropagation(); deleteColumn(c) }}
                            title="Hapus kolom ini"
                            className="p-1 rounded text-white/70 hover:text-red-400 hover:bg-white/10 transition-colors"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {sheetRows.map((row, r) => {
              if (row.style === 'blank') {
                return (
                  <tr key={row.id}>
                    <td colSpan={columns.length + 1} className="border border-gray-300" style={{ height: 16, background: '#f8fafc' }} />
                  </tr>
                )
              }

              const rSt = rowStyles[r] || getDefaultRowStyle(row)
              const bg = rSt.bgColor ?? '#ffffff'
              const bold = rSt.bold ?? false
              const italic = rSt.italic ?? false
              const color = rSt.color ?? '#000000'
              const indent = rSt.indent ?? 0
              const isSelectedRow = activeRow === r

              return (
                <tr key={row.id} className="transition-colors group">
                  {/* Row Label Header (Editable) */}
                  <td
                    onClick={() => { setActiveRow(r); setActiveCol(null) }}
                    className={`font-nav text-xs p-1 sticky left-0 z-10 border border-gray-300 transition-all ${
                      isSelectedRow ? 'ring-2 ring-inset ring-[#01bcce] shadow-[4px_0_8px_rgba(0,0,0,0.06)]' : ''
                    }`}
                    style={{
                      background: bg,
                      paddingLeft: `${8 + indent * 16}px`,
                      minWidth: 320,
                    }}
                  >
                    <div className="flex items-center justify-between gap-1 w-full">
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        {isSelectedRow && <span className="w-1.5 h-1.5 rounded-full bg-[#01bcce] flex-shrink-0" />}
                        <input
                          type="text"
                          value={rowNames[r] ?? displayName(row.name)}
                          onChange={e => {
                            const val = e.target.value
                            setRowNames(prev => prev.map((n, i) => i === r ? val : n))
                            setRowStyles(prev => ({
                              ...prev,
                              [r]: { ...prev[r], customName: val }
                            }))
                          }}
                          onFocus={() => { setActiveRow(r); setActiveCol(null) }}
                          className="w-full bg-transparent outline-none font-nav text-xs px-1.5 py-1 rounded transition-colors focus:bg-white/80 focus:ring-1 focus:ring-[#01bcce]"
                          style={{
                            color,
                            fontWeight: bold ? 800 : 500,
                            fontStyle: italic ? 'italic' : 'normal',
                          }}
                          placeholder={displayName(row.name)}
                        />
                      </div>

                      {/* Quick row action buttons on hover/select */}
                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity px-1">
                        <button
                          type="button"
                          title="Sisipkan baris baru di bawah"
                          onClick={e => { e.stopPropagation(); addRow(r) }}
                          className="p-1 rounded text-gray-400 hover:text-[#01bcce] hover:bg-white transition-colors"
                        >
                          <Plus size={13} />
                        </button>
                        <button
                          type="button"
                          title="Hapus baris ini"
                          onClick={e => { e.stopPropagation(); deleteRow(r) }}
                          className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-white transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </td>

                  {/* Input Cells for All Columns */}
                  {columns.map((col, c) => {
                    const isTargetCol = col.key === 'target'
                    const cellKey = `${r}-${c}`
                    const cSt = cellStyles[cellKey]
                    const cellBg = cSt?.bgColor || bg
                    const cellBold = cSt?.bold !== undefined ? cSt.bold : bold
                    const cellItalic = cSt?.italic !== undefined ? cSt.italic : italic
                    const cellColor = cSt?.color || color
                    const isSelectedCell = activeRow === r && activeCol === c
                    const v = grid[r]?.[c] ?? ''

                    return (
                      <td
                        key={col.key}
                        className={`border border-gray-300 p-0 transition-all ${
                          isSelectedCell ? 'ring-2 ring-inset ring-[#01bcce]' : ''
                        }`}
                        style={{ background: cellBg }}
                      >
                        <input
                          id={`${category}-${r}-${c}`}
                          value={v}
                          inputMode={isTargetCol ? 'text' : 'decimal'}
                          onFocus={() => { setActiveRow(r); setActiveCol(c) }}
                          onChange={e => setCell(r, c, e.target.value)}
                          onPaste={e => handlePaste(e, r, c)}
                          onKeyDown={e => onKeyDown(e, r, c)}
                          placeholder={isTargetCol ? 'Target' : ''}
                          className={`w-full font-nav text-[11px] px-2 py-1.5 outline-none bg-transparent focus:bg-white/80 transition-colors ${
                            isTargetCol ? 'text-center font-bold text-[#00282b]' : 'text-right'
                          }`}
                          style={{
                            color: cellColor,
                            fontWeight: isTargetCol ? 700 : (cellBold ? 700 : 400),
                            fontStyle: cellItalic ? 'italic' : 'normal',
                          }}
                        />
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ═══════ BOTTOM ACTIONS ═══════ */}
      <div className="flex flex-wrap items-center gap-3 mt-4">
        <button
          type="button"
          onClick={save}
          disabled={saving || loading}
          className="inline-flex items-center gap-2 font-nav text-sm font-bold text-white rounded-xl px-6 py-3 transition-all hover:opacity-90 disabled:opacity-40 shadow-sm"
          style={{ background: '#00282b' }}
        >
          <Save size={16} />
          {saving ? 'Menyimpan...' : `Simpan ${title} & Format ${year}`}
        </button>

        <button
          type="button"
          onClick={() => {
            if (confirm('Yakin ingin mengosongkan seluruh angka di form ini?')) {
              setGrid(sheetRows.map((r, i) => columns.map(col => {
                if (col.key === 'target') {
                  const targetColIdx = columns.findIndex(c => c.key === 'target')
                  return (targetColIdx >= 0 ? grid[i]?.[targetColIdx] : null) || DEFAULT_INDIKATOR_TARGETS[normName(r.name)] || ''
                }
                return ''
              })))
            }
          }}
          className="inline-flex items-center gap-2 font-nav text-sm font-bold rounded-xl px-5 py-3 border border-gray-300 text-gray-600 hover:bg-gray-50 transition-all"
        >
          <RotateCcw size={16} /> Kosongkan Angka
        </button>
      </div>
    </div>
  )
}
