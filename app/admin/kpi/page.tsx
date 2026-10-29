'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  Save,
  Plus,
  Trash2,
  Calendar,
  Target,
  ShieldCheck,
  Award,
  ArrowUp,
  ArrowDown,
  Eye,
  X,
  FileSpreadsheet,
} from 'lucide-react'
import {
  KpiRow,
  IsoLikeRow,
  RscmAwardRow,
  DEFAULT_KPI_ROWS,
  DEFAULT_ISO_LIKE_ROWS,
  DEFAULT_RSCM_AWARD_ROWS,
  MONTH_NAMES_SHORT,
  calculateAverageKpi,
  parseNum,
} from '@/lib/kpi-types'

// ============================================================================
// KOMPONEN TEXTAREA FLEKSIBEL (OTOMATIS MENYESUAIKAN TINGGI KALIMAT TANPA BATAS)
// ============================================================================
interface AutoTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string
}

function AutoTextarea({ value, className, onChange, onPaste, ...rest }: AutoTextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null)

  const adjustHeight = useCallback(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.max(38, el.scrollHeight)}px`
  }, [])

  useEffect(() => {
    adjustHeight()
  }, [value, adjustHeight])

  useEffect(() => {
    window.addEventListener('resize', adjustHeight)
    return () => window.removeEventListener('resize', adjustHeight)
  }, [adjustHeight])

  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      onChange={(e) => {
        adjustHeight()
        onChange?.(e)
      }}
      onPaste={onPaste}
      className={className}
      style={{ overflow: 'hidden' }}
      {...rest}
    />
  )
}

// ============================================================================
// PARSER CLIPBOARD EXCEL (MENDUKUNG MULTI-KOLOM, MULTI-BARIS & ALT+ENTER)
// ============================================================================
function parseExcelClipboard(raw: string): string[][] {
  const text = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const rows: string[][] = []
  let currentRow: string[] = []
  let currentCell = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    const nextCh = text[i + 1]

    if (inQuotes) {
      if (ch === '"' && nextCh === '"') {
        currentCell += '"'
        i++
      } else if (ch === '"') {
        inQuotes = false
      } else {
        currentCell += ch
      }
    } else {
      if (ch === '"' && currentCell.length === 0) {
        inQuotes = true
      } else if (ch === '\t') {
        currentRow.push(currentCell.trim())
        currentCell = ''
      } else if (ch === '\n') {
        currentRow.push(currentCell.trim())
        rows.push(currentRow)
        currentRow = []
        currentCell = ''
      } else {
        currentCell += ch
      }
    }
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim())
    rows.push(currentRow)
  }

  // Hapus baris kosong paling akhir jika ada trailing newline dari Excel
  while (rows.length > 0 && rows[rows.length - 1].every((c) => c === '')) {
    rows.pop()
  }

  return rows
}

export default function AdminKpiPage() {
  const supabase = createClient()
  const currentYear = new Date().getFullYear()

  // Tab & Year states
  const [activeTab, setActiveTab] = useState<'kpi' | 'iso_like' | 'rscm_award'>('kpi')
  const [selectedYear, setSelectedYear] = useState<number>(currentYear)
  const [availableYears, setAvailableYears] = useState<number[]>([currentYear])
  const [newYearInput, setNewYearInput] = useState('')
  const [showAddYearModal, setShowAddYearModal] = useState(false)

  // Status & Flash Messages
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  // Row Data States per Kategori (kosong secara default jika belum ada data di database)
  const [kpiRows, setKpiRows] = useState<KpiRow[]>([])
  const [isoRows, setIsoRows] = useState<IsoLikeRow[]>([])
  const [awardRows, setAwardRows] = useState<RscmAwardRow[]>([])

  // Existing DB record IDs
  const [kpiRecordId, setKpiRecordId] = useState<string | null>(null)
  const [isoRecordId, setIsoRecordId] = useState<string | null>(null)
  const [awardRecordId, setAwardRecordId] = useState<string | null>(null)

  const showToast = (type: 'ok' | 'err', text: string) => {
    setMessage({ type, text })
    setTimeout(() => {
      setMessage((prev) => (prev?.text === text ? null : prev))
    }, 6000)
  }

  // Bersihkan link eksternal lama (kenari) di halaman_profil jika masih ada
  useEffect(() => {
    supabase
      .from('halaman_profil')
      .select('konten')
      .eq('slug', 'kpi')
      .maybeSingle()
      .then(({ data }) => {
        if (data?.konten && (data.konten.includes('kenari') || data.konten.startsWith('http'))) {
          supabase
            .from('halaman_profil')
            .update({ konten: '', updated_at: new Date().toISOString() })
            .eq('slug', 'kpi')
            .then(() => {})
        }
      })
  }, [supabase])

  // 1. Fetch available years
  const fetchAvailableYears = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('financial_reports_data')
        .select('year')
        .in('category', ['kpi_utama', 'kpi_iso_like', 'kpi_rscm_award'])

      if (error) {
        console.error('Error fetching KPI available years:', error)
        return
      }

      const yearsFromDb = (data || [])
        .map((d: any) => d.year)
        .filter((y: any) => typeof y === 'number' && y > 1900)
      const combined = Array.from(new Set([currentYear, ...yearsFromDb])).sort((a, b) => b - a)
      setAvailableYears(combined)
    } catch (err) {
      console.error('fetchAvailableYears error:', err)
    }
  }, [supabase, currentYear])

  // 2. Fetch data for selected year
  const fetchDataForYear = useCallback(
    async (year: number) => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('financial_reports_data')
          .select('*')
          .in('category', ['kpi_utama', 'kpi_iso_like', 'kpi_rscm_award'])
          .eq('year', year)

        if (error) {
          console.error('Error fetching data for year:', error)
          showToast('err', 'Gagal memuat data dari database: ' + error.message)
          return
        }

        const records = data || []

        // 1. KPI Utama
        const kpiRec = records.find((r) => r.category === 'kpi_utama')
        if (kpiRec && Array.isArray(kpiRec.data?.rows)) {
          setKpiRecordId(kpiRec.id)
          setKpiRows(
            kpiRec.data.rows.map((r: KpiRow) => ({
              ...r,
              periode: r.periode ?? 'Bulanan',
            }))
          )
        } else {
          setKpiRecordId(null)
          setKpiRows([])
        }

        // 2. ISO Like
        const isoRec = records.find((r) => r.category === 'kpi_iso_like')
        if (isoRec && Array.isArray(isoRec.data?.rows)) {
          setIsoRecordId(isoRec.id)
          setIsoRows(isoRec.data.rows)
        } else {
          setIsoRecordId(null)
          setIsoRows([])
        }

        // 3. RSCM Award
        const awardRec = records.find((r) => r.category === 'kpi_rscm_award')
        if (awardRec && Array.isArray(awardRec.data?.rows)) {
          setAwardRecordId(awardRec.id)
          setAwardRows(awardRec.data.rows)
        } else {
          setAwardRecordId(null)
          setAwardRows([])
        }
      } catch (err: any) {
        console.error('Error in fetchDataForYear:', err)
        showToast('err', 'Terjadi kesalahan saat memuat data: ' + err.message)
      } finally {
        setLoading(false)
      }
    },
    [supabase]
  )

  useEffect(() => {
    fetchAvailableYears()
  }, [fetchAvailableYears])

  useEffect(() => {
    fetchDataForYear(selectedYear)
  }, [selectedYear, fetchDataForYear])

  // =========================================================
  // ACTIONS: TAMBAH & HAPUS BARIS
  // =========================================================
  const handleAddKpiRow = () => {
    const nextNo = kpiRows.length + 1
    const newRow: KpiRow = {
      id: 'kpi-' + Date.now(),
      no: nextNo,
      poin_penilaian: '',
      periode: 'Bulanan',
      target: '',
      m1: null,
      m2: null,
      m3: null,
      m4: null,
      m5: null,
      m6: null,
      m7: null,
      m8: null,
      m9: null,
      m10: null,
      m11: null,
      m12: null,
      rata_rata: '',
      analisis: '',
      rencana_tindak_lanjut: '',
    }
    setKpiRows([...kpiRows, newRow])
  }

  const handleDeleteKpiRow = (index: number) => {
    if (!confirm(`Hapus baris nomor ${kpiRows[index]?.no || index + 1}?`)) return
    const updated = kpiRows.filter((_, i) => i !== index).map((r, i) => ({ ...r, no: i + 1 }))
    setKpiRows(updated)
  }

  const handleAddIsoRow = () => {
    const nextNo = isoRows.length + 1
    const newRow: IsoLikeRow = {
      id: 'iso-' + Date.now(),
      no: nextNo,
      poin_penilaian: '',
      target: '',
      capaian: '',
      nilai: '',
    }
    setIsoRows([...isoRows, newRow])
  }

  const handleDeleteIsoRow = (index: number) => {
    if (!confirm(`Hapus baris nomor ${isoRows[index]?.no || index + 1}?`)) return
    const updated = isoRows.filter((_, i) => i !== index).map((r, i) => ({ ...r, no: i + 1 }))
    setIsoRows(updated)
  }

  const handleAddAwardRow = () => {
    const nextNo = awardRows.length + 1
    const newRow: RscmAwardRow = {
      id: 'award-' + Date.now(),
      no: nextNo,
      poin_penilaian: '',
      target: '',
      capaian: '',
      nilai: '',
      rencana_tindak_lanjut: '',
      deadline: '',
    }
    setAwardRows([...awardRows, newRow])
  }

  const handleDeleteAwardRow = (index: number) => {
    if (!confirm(`Hapus baris nomor ${awardRows[index]?.no || index + 1}?`)) return
    const updated = awardRows.filter((_, i) => i !== index).map((r, i) => ({ ...r, no: i + 1 }))
    setAwardRows(updated)
  }

  // Move row up/down
  const handleMoveRow = (type: 'kpi' | 'iso' | 'award', index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1
    if (type === 'kpi') {
      if (targetIdx < 0 || targetIdx >= kpiRows.length) return
      const list = [...kpiRows]
      const [moved] = list.splice(index, 1)
      list.splice(targetIdx, 0, moved)
      setKpiRows(list.map((r, i) => ({ ...r, no: i + 1 })))
    } else if (type === 'iso') {
      if (targetIdx < 0 || targetIdx >= isoRows.length) return
      const list = [...isoRows]
      const [moved] = list.splice(index, 1)
      list.splice(targetIdx, 0, moved)
      setIsoRows(list.map((r, i) => ({ ...r, no: i + 1 })))
    } else {
      if (targetIdx < 0 || targetIdx >= awardRows.length) return
      const list = [...awardRows]
      const [moved] = list.splice(index, 1)
      list.splice(targetIdx, 0, moved)
      setAwardRows(list.map((r, i) => ({ ...r, no: i + 1 })))
    }
  }

  // =========================================================
  // DIRECT PASTE DARI EXCEL LANGSUNG DI SEL TABEL (CTRL + V)
  // =========================================================
  // Urutan Kolom KPI:
  // 0: no, 1: poin_penilaian, 2: periode, 3: target, 4..15: m1..m12, 16: rata_rata, 17: analisis, 18: rencana_tindak_lanjut
  const handleKpiCellPaste = (
    e: React.ClipboardEvent<HTMLInputElement | HTMLTextAreaElement>,
    startRow: number,
    startCol: number
  ) => {
    const raw = e.clipboardData.getData('text/plain')
    if (!raw) return

    const matrix = parseExcelClipboard(raw)
    // Jika hanya 1 sel biasa tanpa tab/baris baru, biarkan paste standar
    if (matrix.length <= 1 && (matrix[0]?.length ?? 0) <= 1) return

    e.preventDefault()

    // Filter baris header jika user ikut menyalin judul kolom dari Excel
    const dataMatrix = matrix.filter((cols, idx) => {
      if (idx === 0 && startCol <= 1) {
        const joined = cols.join(' ').toLowerCase()
        if (
          joined.includes('poin penilaian') ||
          (joined.includes('indikator') && joined.includes('target'))
        ) {
          return false
        }
      }
      return true
    })

    if (dataMatrix.length === 0) return

    setKpiRows((prev) => {
      const next = prev.map((r) => ({ ...r }))

      dataMatrix.forEach((cells, rOffset) => {
        const targetRow = startRow + rOffset
        while (next.length <= targetRow) {
          next.push({
            id: `kpi-${Date.now()}-${next.length}`,
            no: next.length + 1,
            poin_penilaian: '',
            periode: 'Bulanan',
            target: '',
            m1: null,
            m2: null,
            m3: null,
            m4: null,
            m5: null,
            m6: null,
            m7: null,
            m8: null,
            m9: null,
            m10: null,
            m11: null,
            m12: null,
            rata_rata: '',
            analisis: '',
            rencana_tindak_lanjut: '',
          })
        }

        const rowObj = next[targetRow]
        cells.forEach((val, cOffset) => {
          const targetCol = startCol + cOffset
          if (targetCol === 0) rowObj.no = val || targetRow + 1
          else if (targetCol === 1) rowObj.poin_penilaian = val
          else if (targetCol === 2) rowObj.periode = val
          else if (targetCol === 3) rowObj.target = val
          else if (targetCol >= 4 && targetCol <= 15) {
            const mKey = `m${targetCol - 3}` as keyof KpiRow
            const parsed = parseNum(val)
            ;(rowObj as any)[mKey] = val === '' || val === '-' ? null : parsed !== null ? parsed : val
          } else if (targetCol === 16) rowObj.rata_rata = val
          else if (targetCol === 17) rowObj.analisis = val
          else if (targetCol === 18) rowObj.rencana_tindak_lanjut = val
        })
      })

      return next
    })

    showToast('ok', `Berhasil menempelkan ${dataMatrix.length} baris data KPI dari Excel!`)
  }

  // Urutan Kolom ISO Like:
  // 0: no, 1: poin_penilaian, 2: target, 3: capaian, 4: nilai
  const handleIsoCellPaste = (
    e: React.ClipboardEvent<HTMLInputElement | HTMLTextAreaElement>,
    startRow: number,
    startCol: number
  ) => {
    const raw = e.clipboardData.getData('text/plain')
    if (!raw) return

    const matrix = parseExcelClipboard(raw)
    if (matrix.length <= 1 && (matrix[0]?.length ?? 0) <= 1) return

    e.preventDefault()

    const dataMatrix = matrix.filter((cols, idx) => {
      if (idx === 0 && startCol <= 1) {
        const joined = cols.join(' ').toLowerCase()
        if (joined.includes('poin penilaian') || (joined.includes('target') && joined.includes('capaian'))) {
          return false
        }
      }
      return true
    })

    if (dataMatrix.length === 0) return

    setIsoRows((prev) => {
      const next = prev.map((r) => ({ ...r }))

      dataMatrix.forEach((cells, rOffset) => {
        const targetRow = startRow + rOffset
        while (next.length <= targetRow) {
          next.push({
            id: `iso-${Date.now()}-${next.length}`,
            no: next.length + 1,
            poin_penilaian: '',
            target: '',
            capaian: '',
            nilai: '',
          })
        }

        const rowObj = next[targetRow]
        cells.forEach((val, cOffset) => {
          const targetCol = startCol + cOffset
          if (targetCol === 0) rowObj.no = val || targetRow + 1
          else if (targetCol === 1) rowObj.poin_penilaian = val
          else if (targetCol === 2) rowObj.target = val
          else if (targetCol === 3) rowObj.capaian = val
          else if (targetCol === 4) rowObj.nilai = val
        })
      })

      return next
    })

    showToast('ok', `Berhasil menempelkan ${dataMatrix.length} baris data ISO Like dari Excel!`)
  }

  // Urutan Kolom RSCM Award:
  // 0: no, 1: poin_penilaian, 2: target, 3: capaian, 4: nilai, 5: rencana_tindak_lanjut, 6: deadline
  const handleAwardCellPaste = (
    e: React.ClipboardEvent<HTMLInputElement | HTMLTextAreaElement>,
    startRow: number,
    startCol: number
  ) => {
    const raw = e.clipboardData.getData('text/plain')
    if (!raw) return

    const matrix = parseExcelClipboard(raw)
    if (matrix.length <= 1 && (matrix[0]?.length ?? 0) <= 1) return

    e.preventDefault()

    const dataMatrix = matrix.filter((cols, idx) => {
      if (idx === 0 && startCol <= 1) {
        const joined = cols.join(' ').toLowerCase()
        if (joined.includes('poin penilaian') || (joined.includes('target') && joined.includes('deadline'))) {
          return false
        }
      }
      return true
    })

    if (dataMatrix.length === 0) return

    setAwardRows((prev) => {
      const next = prev.map((r) => ({ ...r }))

      dataMatrix.forEach((cells, rOffset) => {
        const targetRow = startRow + rOffset
        while (next.length <= targetRow) {
          next.push({
            id: `award-${Date.now()}-${next.length}`,
            no: next.length + 1,
            poin_penilaian: '',
            target: '',
            capaian: '',
            nilai: '',
            rencana_tindak_lanjut: '',
            deadline: '',
          })
        }

        const rowObj = next[targetRow]
        cells.forEach((val, cOffset) => {
          const targetCol = startCol + cOffset
          if (targetCol === 0) rowObj.no = val || targetRow + 1
          else if (targetCol === 1) rowObj.poin_penilaian = val
          else if (targetCol === 2) rowObj.target = val
          else if (targetCol === 3) rowObj.capaian = val
          else if (targetCol === 4) rowObj.nilai = val
          else if (targetCol === 5) rowObj.rencana_tindak_lanjut = val
          else if (targetCol === 6) rowObj.deadline = val
        })
      })

      return next
    })

    showToast('ok', `Berhasil menempelkan ${dataMatrix.length} baris data RSCM Award dari Excel!`)
  }

  // =========================================================
  // ACTIONS: SIMPAN DATA KE SUPABASE
  // =========================================================
  const handleSaveActiveTab = async () => {
    setSaving(true)
    setMessage(null)

    try {
      if (activeTab === 'kpi') {
        const payload = {
          category: 'kpi_utama',
          year: selectedYear,
          item_name: `kpi_utama_${selectedYear}`,
          data: {
            rows: kpiRows,
            updated_at: new Date().toISOString(),
          },
        }

        if (kpiRecordId) {
          const { error } = await supabase
            .from('financial_reports_data')
            .update({ data: payload.data, year: selectedYear })
            .eq('id', kpiRecordId)
          if (error) throw error
        } else {
          const { data: newRec, error } = await supabase
            .from('financial_reports_data')
            .insert(payload)
            .select()
            .single()
          if (error) throw error
          if (newRec) setKpiRecordId(newRec.id)
        }
        showToast('ok', `Data tabel KPI tahun ${selectedYear} berhasil disimpan!`)
      } else if (activeTab === 'iso_like') {
        const payload = {
          category: 'kpi_iso_like',
          year: selectedYear,
          item_name: `kpi_iso_like_${selectedYear}`,
          data: {
            rows: isoRows,
            updated_at: new Date().toISOString(),
          },
        }

        if (isoRecordId) {
          const { error } = await supabase
            .from('financial_reports_data')
            .update({ data: payload.data, year: selectedYear })
            .eq('id', isoRecordId)
          if (error) throw error
        } else {
          const { data: newRec, error } = await supabase
            .from('financial_reports_data')
            .insert(payload)
            .select()
            .single()
          if (error) throw error
          if (newRec) setIsoRecordId(newRec.id)
        }
        showToast('ok', `Data tabel ISO Like tahun ${selectedYear} berhasil disimpan!`)
      } else {
        const payload = {
          category: 'kpi_rscm_award',
          year: selectedYear,
          item_name: `kpi_rscm_award_${selectedYear}`,
          data: {
            rows: awardRows,
            updated_at: new Date().toISOString(),
          },
        }

        if (awardRecordId) {
          const { error } = await supabase
            .from('financial_reports_data')
            .update({ data: payload.data, year: selectedYear })
            .eq('id', awardRecordId)
          if (error) throw error
        } else {
          const { data: newRec, error } = await supabase
            .from('financial_reports_data')
            .insert(payload)
            .select()
            .single()
          if (error) throw error
          if (newRec) setAwardRecordId(newRec.id)
        }
        showToast('ok', `Data tabel RSCM Award tahun ${selectedYear} berhasil disimpan!`)
      }

      await fetchAvailableYears()
    } catch (err: any) {
      console.error('Error saving data:', err)
      showToast('err', 'Gagal menyimpan data: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  // =========================================================
  // ACTIONS: TAMBAH & HAPUS TAHUN
  // =========================================================
  const handleAddNewYear = () => {
    const yr = parseInt(newYearInput.trim(), 10)
    if (isNaN(yr) || yr < 2000 || yr > 2100) {
      alert('Masukkan tahun yang valid (antara 2000 - 2100).')
      return
    }
    if (availableYears.includes(yr)) {
      alert(`Tahun ${yr} sudah ada dalam daftar.`)
      setSelectedYear(yr)
      setShowAddYearModal(false)
      setNewYearInput('')
      return
    }

    const nextYears = Array.from(new Set([yr, ...availableYears])).sort((a, b) => b - a)
    setAvailableYears(nextYears)
    setSelectedYear(yr)
    setShowAddYearModal(false)
    setNewYearInput('')
    showToast('ok', `Tahun ${yr} berhasil ditambahkan. Silakan isi data dan klik Simpan Data.`)
  }

  const handleDeleteCurrentYear = async () => {
    if (!confirm(`HAPUS SELURUH DATA KPI/ISO/AWARD TAHUN ${selectedYear}?\nTindakan ini tidak dapat dibatalkan.`)) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('financial_reports_data')
        .delete()
        .in('category', ['kpi_utama', 'kpi_iso_like', 'kpi_rscm_award'])
        .eq('year', selectedYear)

      if (error) throw error

      // Kosongkan state di halaman admin secara langsung
      setKpiRecordId(null)
      setIsoRecordId(null)
      setAwardRecordId(null)
      setKpiRows([])
      setIsoRows([])
      setAwardRows([])

      showToast('ok', `Seluruh data KPI tahun ${selectedYear} berhasil dihapus dari database!`)

      const filtered = availableYears.filter((y) => y !== selectedYear)
      const nextYears = filtered.length > 0 ? filtered : [currentYear]
      setAvailableYears(nextYears)
      setSelectedYear(nextYears[0])
      await fetchDataForYear(nextYears[0])
    } catch (err: any) {
      console.error('Error deleting year:', err)
      showToast('err', 'Gagal menghapus tahun: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: '#f0f4f5' }}>
      {/* Top Header Bar dengan Ornamen */}
      <div
        style={{ background: 'linear-gradient(135deg, #00282b 0%, #015a61 100%)' }}
        className="px-4 sm:px-6 py-6 border-b border-white/10 shadow-sm relative overflow-hidden"
      >
        <img
          src="/ornament-mandala.png"
          alt=""
          className="absolute -top-10 -right-10 w-40 h-40 object-contain pointer-events-none select-none z-0"
          style={{ opacity: 0.14 }}
        />
        <img
          src="/ornament-side.png"
          alt=""
          className="absolute -left-6 top-0 bottom-0 h-full w-28 object-cover object-left pointer-events-none select-none z-0 opacity-[0.08]"
          style={{ filter: 'brightness(0) invert(1)' }}
        />

        <div className="max-w-7xl mx-auto relative z-10">
          <p className="font-nav text-xs text-white/50 mb-1">
            <Link href="/admin/dashboard" className="hover:text-white transition-colors">
              ← Dashboard Admin
            </Link>
          </p>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="font-nav font-bold text-white text-xl flex items-center gap-2">
                <Target size={22} className="text-[#01bcce]" />
                Kelola Key Performance Indicator (KPI)
              </h1>
              <p className="font-nav text-xs text-white/70 mt-0.5">
                Input data langsung pada tabel atau klik sel lalu tekan <strong>Ctrl + V</strong> untuk copy-paste langsung dari Excel. Tinggi kalimat otomatis menyesuaikan panjang teks.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <Link
                href="/profil/kpi"
                target="_blank"
                className="px-4 py-2 rounded-xl text-xs font-nav font-bold text-[#00282b] bg-[#d0db41] hover:bg-[#c2cc36] transition-all flex items-center gap-1.5 shadow-sm"
              >
                <Eye size={14} />
                Lihat Halaman Publik →
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Flash Message Banner */}
        {message && (
          <div
            className="font-nav text-sm rounded-xl px-4 py-3 shadow-xs transition-all flex items-center justify-between"
            style={
              message.type === 'ok'
                ? { background: '#e6f7ee', color: '#0a7a3d', border: '1px solid #b7e4c7' }
                : { background: '#fdecec', color: '#b42318', border: '1px solid #f5c2c0' }
            }
          >
            <span>
              {message.type === 'ok' ? '✅ ' : '❌ '}
              {message.text}
            </span>
            <button onClick={() => setMessage(null)} className="text-gray-400 hover:text-gray-600">
              <X size={15} />
            </button>
          </div>
        )}

        {/* 3 Main Admin Tabs */}
        <div className="flex items-center gap-2 p-1.5 bg-white rounded-2xl border border-gray-200 shadow-xs overflow-x-auto">
          {[
            { id: 'kpi', label: 'KPI', icon: Target },
            { id: 'iso_like', label: 'ISO Like', icon: ShieldCheck },
            { id: 'rscm_award', label: 'RSCM Award', icon: Award },
          ].map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as 'kpi' | 'iso_like' | 'rscm_award')}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-nav text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-[#00282b] text-[#d0db41] shadow-md shadow-[#00282b]/20 scale-[1.01]'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Icon size={16} className={isActive ? 'text-[#01bcce]' : 'text-gray-400'} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Bar Pengaturan Tahun & Kontrol Simpan */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Year Selector */}
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3.5 py-2 rounded-xl">
              <Calendar size={16} className="text-[#01bcce]" />
              <span className="font-nav text-xs font-bold text-gray-600">Tahun Aktif:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-transparent font-nav font-black text-sm text-[#00282b] outline-none cursor-pointer"
              >
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            {/* Tambah Tahun Button */}
            <button
              type="button"
              onClick={() => setShowAddYearModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-nav text-xs font-bold text-white bg-[#015a61] hover:bg-[#00282b] transition-all cursor-pointer shadow-xs"
            >
              <Plus size={14} />
              Tambah Tahun
            </button>

            {/* Hapus Tahun Button */}
            <button
              type="button"
              onClick={handleDeleteCurrentYear}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-nav text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-all cursor-pointer"
              title={`Hapus seluruh data tahun ${selectedYear}`}
            >
              <Trash2 size={13} />
              Hapus Tahun {selectedYear}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50/80 border border-teal-200/70 text-[#015a61] font-nav text-xs font-semibold">
              <FileSpreadsheet size={14} className="text-[#01bcce] shrink-0" />
              <span>Copy blok sel dari Excel lalu tekan <strong>Ctrl + V</strong> langsung di sel tabel</span>
            </div>

            {/* Simpan Data Button */}
            <button
              type="button"
              onClick={handleSaveActiveTab}
              disabled={saving || loading}
              className="flex items-center gap-2 px-5 py-2 rounded-xl font-nav text-xs font-bold text-white bg-[#0a7a3d] hover:bg-[#086331] disabled:opacity-50 transition-all shadow-md cursor-pointer"
            >
              <Save size={15} />
              {saving ? 'Menyimpan...' : 'Simpan Data'}
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* TABEL ADMIN 1: KPI (DENGAN KOLOM PERIODE & PASTE LANGSUNG)*/}
        {/* ========================================================= */}
        {activeTab === 'kpi' && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5 space-y-4 relative overflow-hidden">
            <img
              src="/ornament-mandala.png"
              alt=""
              className="absolute -top-12 -right-12 w-48 h-48 object-contain pointer-events-none select-none z-0"
              style={{ opacity: 0.05 }}
            />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 relative z-10">
              <div>
                <h2 className="font-nav font-bold text-base text-[#00282b] flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#01bcce]" />
                  Tabel Pengisian Data KPI (Tahun {selectedYear})
                </h2>
                <p className="font-nav text-xs text-gray-500 mt-0.5">
                  Klik sel mana saja dan tekan <strong>Ctrl + V</strong> untuk menempelkan data langsung dari Excel. Tinggi baris otomatis fleksibel mengikuti panjang kalimat.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddKpiRow}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-nav text-xs font-bold text-[#00282b] bg-[#d0db41] hover:bg-[#c2cc36] transition-all cursor-pointer self-start sm:self-auto shadow-xs"
              >
                <Plus size={15} />
                Tambah Baris Indikator
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-2xs relative z-10">
              <table className="w-full text-left border-collapse min-w-[1560px]">
                <thead>
                  <tr
                    className="text-white text-xs uppercase tracking-wider font-bold"
                    style={{ background: '#00282b', fontFamily: '"VAG Rounded Next", "VAGRounded BT", "Nunito", sans-serif' }}
                  >
                    <th rowSpan={2} className="px-2 py-3 text-center border-r border-white/10 w-12 sticky left-0 z-20 bg-[#00282b]">
                      No
                    </th>
                    <th rowSpan={2} className="px-3 py-3 border-r border-white/10 w-[300px] min-w-[280px] sticky left-12 z-20 bg-[#00282b]">
                      Poin Penilaian (Indikator)
                    </th>
                    <th rowSpan={2} className="px-3 py-3 border-r border-white/10 w-[135px] min-w-[125px] text-center">
                      Periode
                    </th>
                    <th rowSpan={2} className="px-3 py-3 border-r border-white/10 w-[140px] min-w-[130px] text-center">
                      Target
                    </th>
                    <th colSpan={12} className="px-2 py-2 text-center border-b border-r border-white/10 bg-[#014146] text-[#d0db41]">
                      Capaian Bulanan (%)
                    </th>
                    <th rowSpan={2} className="px-3 py-3 border-r border-white/10 w-[100px] min-w-[90px] text-center bg-[#015a61] text-[#d0db41]">
                      Rata-Rata
                    </th>
                    <th rowSpan={2} className="px-3 py-3 border-r border-white/10 w-[280px] min-w-[260px]">
                      Analisis
                    </th>
                    <th rowSpan={2} className="px-3 py-3 border-r border-white/10 w-[280px] min-w-[260px]">
                      Rencana Tindak Lanjut
                    </th>
                    <th rowSpan={2} className="px-2 py-3 text-center w-16">
                      Aksi
                    </th>
                  </tr>
                  <tr
                    className="text-white/90 text-[11px] font-semibold"
                    style={{ background: '#014146', fontFamily: '"VAG Rounded Next", "VAGRounded BT", "Nunito", sans-serif' }}
                  >
                    {MONTH_NAMES_SHORT.map((bln, bIdx) => (
                      <th
                        key={bln}
                        className={`px-1 py-1.5 text-center w-[65px] min-w-[60px] ${
                          bIdx < 11 ? 'border-r border-white/10' : 'border-r border-white/20'
                        }`}
                      >
                        {bln}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-xs text-gray-800 bg-white">
                  {kpiRows.length === 0 ? (
                    <tr>
                      <td colSpan={20} className="py-10 text-center text-gray-400 font-sans">
                        Belum ada baris indikator. Klik tombol <strong>+ Tambah Baris Indikator</strong>.
                      </td>
                    </tr>
                  ) : (
                    kpiRows.map((row, idx) => {
                      const calculatedAvg = calculateAverageKpi(row)
                      const isEven = idx % 2 === 1

                      return (
                        <tr
                          key={row.id || idx}
                          className={`transition-colors hover:bg-teal-50/40 align-top ${isEven ? 'bg-gray-50/40' : 'bg-white'}`}
                        >
                          {/* Col 0: No */}
                          <td
                            className="px-2 py-2 text-center font-bold text-gray-600 border-r border-gray-200 sticky left-0 z-10"
                            style={{ background: isEven ? '#f9fafb' : '#ffffff' }}
                          >
                            <input
                              type="text"
                              value={row.no}
                              onPaste={(e) => handleKpiCellPaste(e, idx, 0)}
                              onChange={(e) => {
                                const val = e.target.value
                                setKpiRows(kpiRows.map((r, i) => (i === idx ? { ...r, no: val } : r)))
                              }}
                              className="w-8 text-center font-bold p-1.5 rounded border border-gray-200 outline-none focus:border-[#01bcce] bg-white"
                            />
                          </td>

                          {/* Col 1: Poin Penilaian (Indikator) - Fleksibel Otomatis */}
                          <td
                            className="px-2.5 py-2 border-r border-gray-200 w-[300px] min-w-[280px] sticky left-12 z-10"
                            style={{ background: isEven ? '#f9fafb' : '#ffffff' }}
                          >
                            <AutoTextarea
                              value={row.poin_penilaian}
                              onPaste={(e) => handleKpiCellPaste(e, idx, 1)}
                              onChange={(e) => {
                                const val = e.target.value
                                setKpiRows(kpiRows.map((r, i) => (i === idx ? { ...r, poin_penilaian: val } : r)))
                              }}
                              placeholder="Masukkan uraian poin penilaian / indikator..."
                              className="w-full text-xs font-semibold text-[#00282b] p-2 rounded-lg border border-gray-200 focus:border-[#01bcce] focus:ring-1 focus:ring-[#01bcce] outline-none break-words whitespace-pre-wrap leading-relaxed bg-white"
                            />
                          </td>

                          {/* Col 2: Periode (Di samping Indikator) */}
                          <td className="px-2 py-2 border-r border-gray-200 w-[135px] min-w-[125px]">
                            <AutoTextarea
                              value={row.periode ?? 'Bulanan'}
                              onPaste={(e) => handleKpiCellPaste(e, idx, 2)}
                              onChange={(e) => {
                                const val = e.target.value
                                setKpiRows(kpiRows.map((r, i) => (i === idx ? { ...r, periode: val } : r)))
                              }}
                              placeholder="Misal: Bulanan"
                              className="w-full text-xs text-center font-semibold text-[#015a61] p-2 rounded-lg border border-gray-200 focus:border-[#01bcce] outline-none break-words whitespace-pre-wrap leading-relaxed bg-white"
                            />
                          </td>

                          {/* Col 3: Target */}
                          <td className="px-2 py-2 border-r border-gray-200 w-[140px] min-w-[130px]">
                            <AutoTextarea
                              value={row.target}
                              onPaste={(e) => handleKpiCellPaste(e, idx, 3)}
                              onChange={(e) => {
                                const val = e.target.value
                                setKpiRows(kpiRows.map((r, i) => (i === idx ? { ...r, target: val } : r)))
                              }}
                              placeholder="Contoh: 100%"
                              className="w-full text-xs text-center p-2 rounded-lg border border-gray-200 focus:border-[#01bcce] outline-none break-words whitespace-pre-wrap leading-relaxed bg-white"
                            />
                          </td>

                          {/* Col 4..15: 12 Bulan Capaian */}
                          {(
                            ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8', 'm9', 'm10', 'm11', 'm12'] as const
                          ).map((mKey, mIdx) => {
                            const val = row[mKey]
                            const colIdx = 4 + mIdx
                            return (
                              <td
                                key={mKey}
                                className={`px-1 py-2 text-center w-[65px] min-w-[60px] ${
                                  mIdx < 11 ? 'border-r border-gray-200' : 'border-r border-gray-300'
                                }`}
                              >
                                <input
                                  type="text"
                                  value={val === null || val === undefined ? '' : String(val)}
                                  onPaste={(e) => handleKpiCellPaste(e, idx, colIdx)}
                                  onChange={(e) => {
                                    const raw = e.target.value
                                    const parsed = parseNum(raw)
                                    const finalVal = raw === '' ? null : parsed !== null ? parsed : raw
                                    setKpiRows(
                                      kpiRows.map((r, i) =>
                                        i === idx ? { ...r, [mKey]: finalVal } : r
                                      )
                                    )
                                  }}
                                  placeholder="—"
                                  className="w-full text-center text-xs p-2 rounded border border-gray-200 focus:border-[#01bcce] outline-none bg-white font-medium"
                                />
                              </td>
                            )
                          })}

                          {/* Col 16: Rata-Rata Capaian */}
                          <td className="px-2 py-2 text-center border-r border-gray-200 w-[100px] min-w-[90px] bg-teal-50/20">
                            <input
                              type="text"
                              value={row.rata_rata || calculatedAvg}
                              onPaste={(e) => handleKpiCellPaste(e, idx, 16)}
                              onChange={(e) => {
                                const val = e.target.value
                                setKpiRows(kpiRows.map((r, i) => (i === idx ? { ...r, rata_rata: val } : r)))
                              }}
                              title="Terhitung otomatis dari rata-rata bulan yang terisi, atau Anda dapat menyesuaikannya manual"
                              className="w-full text-center text-xs font-black text-[#00282b] p-2 rounded border border-[#01bcce]/40 bg-[#01bcce]/10 outline-none"
                            />
                          </td>

                          {/* Col 17: Analisis - Fleksibel Otomatis */}
                          <td className="px-2.5 py-2 border-r border-gray-200 w-[280px] min-w-[260px]">
                            <AutoTextarea
                              value={row.analisis}
                              onPaste={(e) => handleKpiCellPaste(e, idx, 17)}
                              onChange={(e) => {
                                const val = e.target.value
                                setKpiRows(kpiRows.map((r, i) => (i === idx ? { ...r, analisis: val } : r)))
                              }}
                              placeholder="Masukkan analisis capaian indikator..."
                              className="w-full text-xs text-gray-700 p-2 rounded-lg border border-gray-200 focus:border-[#01bcce] focus:ring-1 focus:ring-[#01bcce] outline-none break-words whitespace-pre-wrap leading-relaxed bg-white"
                            />
                          </td>

                          {/* Col 18: Rencana Tindak Lanjut - Fleksibel Otomatis */}
                          <td className="px-2.5 py-2 border-r border-gray-200 w-[280px] min-w-[260px]">
                            <AutoTextarea
                              value={row.rencana_tindak_lanjut}
                              onPaste={(e) => handleKpiCellPaste(e, idx, 18)}
                              onChange={(e) => {
                                const val = e.target.value
                                setKpiRows(kpiRows.map((r, i) => (i === idx ? { ...r, rencana_tindak_lanjut: val } : r)))
                              }}
                              placeholder="Masukkan rencana tindak lanjut perbaikan..."
                              className="w-full text-xs text-gray-700 p-2 rounded-lg border border-gray-200 focus:border-[#01bcce] focus:ring-1 focus:ring-[#01bcce] outline-none break-words whitespace-pre-wrap leading-relaxed bg-white"
                            />
                          </td>

                          {/* Aksi Baris */}
                          <td className="px-2 py-2 text-center w-16">
                            <div className="flex items-center justify-center gap-1 pt-1">
                              <button
                                type="button"
                                onClick={() => handleMoveRow('kpi', idx, 'up')}
                                disabled={idx === 0}
                                title="Pindah ke atas"
                                className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-20 cursor-pointer"
                              >
                                <ArrowUp size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveRow('kpi', idx, 'down')}
                                disabled={idx === kpiRows.length - 1}
                                title="Pindah ke bawah"
                                className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-20 cursor-pointer"
                              >
                                <ArrowDown size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteKpiRow(idx)}
                                title="Hapus baris"
                                className="p-1 rounded text-red-500 hover:bg-red-50 cursor-pointer"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-2 relative z-10">
              <button
                type="button"
                onClick={handleAddKpiRow}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-nav text-xs font-bold text-[#00282b] bg-gray-100 hover:bg-gray-200 transition-all cursor-pointer"
              >
                <Plus size={14} />
                Tambah Baris Baru
              </button>

              <button
                type="button"
                onClick={handleSaveActiveTab}
                disabled={saving || loading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-nav text-xs font-bold text-white bg-[#0a7a3d] hover:bg-[#086331] disabled:opacity-50 transition-all shadow-md cursor-pointer"
              >
                <Save size={15} />
                {saving ? 'Menyimpan...' : 'Simpan Perubahan KPI'}
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TABEL ADMIN 2: ISO LIKE (SASARAN MUTU)                    */}
        {/* ========================================================= */}
        {activeTab === 'iso_like' && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5 space-y-4 relative overflow-hidden">
            <img
              src="/ornament-mandala.png"
              alt=""
              className="absolute -top-12 -right-12 w-48 h-48 object-contain pointer-events-none select-none z-0"
              style={{ opacity: 0.05 }}
            />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 relative z-10">
              <div>
                <h2 className="font-nav font-bold text-base text-[#00282b] flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#01bcce]" />
                  Tabel Pengisian Data ISO Like (Tahun {selectedYear})
                </h2>
                <p className="font-nav text-xs text-gray-500 mt-0.5">
                  Klik sel mana saja lalu tekan <strong>Ctrl + V</strong> untuk copy-paste langsung dari Excel.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddIsoRow}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-nav text-xs font-bold text-[#00282b] bg-[#d0db41] hover:bg-[#c2cc36] transition-all cursor-pointer self-start sm:self-auto shadow-xs"
              >
                <Plus size={15} />
                Tambah Baris ISO Like
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-2xs relative z-10">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr
                    className="text-white text-xs uppercase tracking-wider font-bold"
                    style={{ background: '#00282b', fontFamily: '"VAG Rounded Next", "VAGRounded BT", "Nunito", sans-serif' }}
                  >
                    <th className="px-3 py-3 text-center border-r border-white/10 w-14">No</th>
                    <th className="px-4 py-3 border-r border-white/10 min-w-[340px]">
                      Poin Penilaian
                    </th>
                    <th className="px-3 py-3 text-center border-r border-white/10 w-[160px] min-w-[140px]">
                      Target
                    </th>
                    <th className="px-3 py-3 text-center border-r border-white/10 w-[160px] min-w-[140px]">
                      Capaian
                    </th>
                    <th className="px-3 py-3 text-center border-r border-white/10 w-[160px] min-w-[140px] bg-[#015a61] text-[#d0db41]">
                      Nilai
                    </th>
                    <th className="px-3 py-3 text-center w-20">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-xs text-gray-800 bg-white">
                  {isoRows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-gray-400 font-sans">
                        Belum ada data ISO Like. Klik <strong>+ Tambah Baris ISO Like</strong>.
                      </td>
                    </tr>
                  ) : (
                    isoRows.map((row, idx) => {
                      const isEven = idx % 2 === 1
                      return (
                        <tr
                          key={row.id || idx}
                          className={`transition-colors hover:bg-teal-50/40 align-top ${isEven ? 'bg-gray-50/40' : 'bg-white'}`}
                        >
                          {/* Col 0: No */}
                          <td className="px-3 py-2.5 text-center font-bold text-gray-600 border-r border-gray-200">
                            <input
                              type="text"
                              value={row.no}
                              onPaste={(e) => handleIsoCellPaste(e, idx, 0)}
                              onChange={(e) => {
                                const val = e.target.value
                                setIsoRows(isoRows.map((r, i) => (i === idx ? { ...r, no: val } : r)))
                              }}
                              className="w-10 text-center font-bold p-1.5 rounded border border-gray-200 outline-none bg-white"
                            />
                          </td>

                          {/* Col 1: Poin Penilaian - Fleksibel Otomatis */}
                          <td className="px-3 py-2.5 border-r border-gray-200 min-w-[340px]">
                            <AutoTextarea
                              value={row.poin_penilaian}
                              onPaste={(e) => handleIsoCellPaste(e, idx, 1)}
                              onChange={(e) => {
                                const val = e.target.value
                                setIsoRows(isoRows.map((r, i) => (i === idx ? { ...r, poin_penilaian: val } : r)))
                              }}
                              placeholder="Masukkan poin penilaian ISO Like..."
                              className="w-full text-xs font-semibold text-[#00282b] p-2 rounded-lg border border-gray-200 focus:border-[#01bcce] outline-none break-words whitespace-pre-wrap leading-relaxed bg-white"
                            />
                          </td>

                          {/* Col 2: Target */}
                          <td className="px-3 py-2.5 text-center border-r border-gray-200 w-[160px] min-w-[140px]">
                            <AutoTextarea
                              value={row.target}
                              onPaste={(e) => handleIsoCellPaste(e, idx, 2)}
                              onChange={(e) => {
                                const val = e.target.value
                                setIsoRows(isoRows.map((r, i) => (i === idx ? { ...r, target: val } : r)))
                              }}
                              placeholder="Target (misal: 100%)"
                              className="w-full text-xs text-center p-2 rounded-lg border border-gray-200 focus:border-[#01bcce] outline-none break-words whitespace-pre-wrap leading-relaxed bg-white"
                            />
                          </td>

                          {/* Col 3: Capaian */}
                          <td className="px-3 py-2.5 text-center border-r border-gray-200 w-[160px] min-w-[140px]">
                            <AutoTextarea
                              value={row.capaian}
                              onPaste={(e) => handleIsoCellPaste(e, idx, 3)}
                              onChange={(e) => {
                                const val = e.target.value
                                setIsoRows(isoRows.map((r, i) => (i === idx ? { ...r, capaian: val } : r)))
                              }}
                              placeholder="Capaian realisasi"
                              className="w-full text-xs text-center font-bold text-[#00282b] p-2 rounded-lg border border-gray-200 focus:border-[#01bcce] outline-none break-words whitespace-pre-wrap leading-relaxed bg-white"
                            />
                          </td>

                          {/* Col 4: Nilai */}
                          <td className="px-3 py-2.5 text-center border-r border-gray-200 w-[160px] min-w-[140px]">
                            <AutoTextarea
                              value={row.nilai}
                              onPaste={(e) => handleIsoCellPaste(e, idx, 4)}
                              onChange={(e) => {
                                const val = e.target.value
                                setIsoRows(isoRows.map((r, i) => (i === idx ? { ...r, nilai: val } : r)))
                              }}
                              placeholder="Nilai (misal: Sangat Baik / A)"
                              className="w-full text-xs text-center font-bold text-[#0a7a3d] p-2 rounded-lg border border-green-200 bg-green-50/50 focus:border-green-400 outline-none break-words whitespace-pre-wrap leading-relaxed"
                            />
                          </td>

                          {/* Aksi */}
                          <td className="px-2 py-2.5 text-center w-20">
                            <div className="flex items-center justify-center gap-1 pt-1">
                              <button
                                type="button"
                                onClick={() => handleMoveRow('iso', idx, 'up')}
                                disabled={idx === 0}
                                title="Pindah ke atas"
                                className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-20 cursor-pointer"
                              >
                                <ArrowUp size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveRow('iso', idx, 'down')}
                                disabled={idx === isoRows.length - 1}
                                title="Pindah ke bawah"
                                className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-20 cursor-pointer"
                              >
                                <ArrowDown size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteIsoRow(idx)}
                                title="Hapus baris"
                                className="p-1 rounded text-red-500 hover:bg-red-50 cursor-pointer"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-2 relative z-10">
              <button
                type="button"
                onClick={handleAddIsoRow}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-nav text-xs font-bold text-[#00282b] bg-gray-100 hover:bg-gray-200 transition-all cursor-pointer"
              >
                <Plus size={14} />
                Tambah Baris Baru
              </button>

              <button
                type="button"
                onClick={handleSaveActiveTab}
                disabled={saving || loading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-nav text-xs font-bold text-white bg-[#0a7a3d] hover:bg-[#086331] disabled:opacity-50 transition-all shadow-md cursor-pointer"
              >
                <Save size={15} />
                {saving ? 'Menyimpan...' : 'Simpan Perubahan ISO Like'}
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TABEL ADMIN 3: RSCM AWARD                                 */}
        {/* ========================================================= */}
        {activeTab === 'rscm_award' && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5 space-y-4 relative overflow-hidden">
            <img
              src="/ornament-mandala.png"
              alt=""
              className="absolute -top-12 -right-12 w-48 h-48 object-contain pointer-events-none select-none z-0"
              style={{ opacity: 0.05 }}
            />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 relative z-10">
              <div>
                <h2 className="font-nav font-bold text-base text-[#00282b] flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#01bcce]" />
                  Tabel Pengisian Data RSCM Award (Tahun {selectedYear})
                </h2>
                <p className="font-nav text-xs text-gray-500 mt-0.5">
                  Klik sel mana saja lalu tekan <strong>Ctrl + V</strong> untuk copy-paste langsung dari Excel.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddAwardRow}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-nav text-xs font-bold text-[#00282b] bg-[#d0db41] hover:bg-[#c2cc36] transition-all cursor-pointer self-start sm:self-auto shadow-xs"
              >
                <Plus size={15} />
                Tambah Baris RSCM Award
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-2xs relative z-10">
              <table className="w-full text-left border-collapse min-w-[1200px]">
                <thead>
                  <tr
                    className="text-white text-xs uppercase tracking-wider font-bold"
                    style={{ background: '#00282b', fontFamily: '"VAG Rounded Next", "VAGRounded BT", "Nunito", sans-serif' }}
                  >
                    <th className="px-3 py-3 text-center border-r border-white/10 w-14">No</th>
                    <th className="px-4 py-3 border-r border-white/10 min-w-[300px]">
                      Poin Penilaian
                    </th>
                    <th className="px-3 py-3 text-center border-r border-white/10 w-[140px] min-w-[130px]">
                      Target
                    </th>
                    <th className="px-3 py-3 text-center border-r border-white/10 w-[140px] min-w-[130px]">
                      Capaian
                    </th>
                    <th className="px-3 py-3 text-center border-r border-white/10 w-[110px] min-w-[100px] bg-[#015a61] text-[#d0db41]">
                      Nilai
                    </th>
                    <th className="px-4 py-3 border-r border-white/10 min-w-[280px]">
                      Rencana Tindak Lanjut
                    </th>
                    <th className="px-3 py-3 text-center border-r border-white/10 w-[150px] min-w-[130px]">
                      Deadline
                    </th>
                    <th className="px-3 py-3 text-center w-20">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-xs text-gray-800 bg-white">
                  {awardRows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-gray-400 font-sans">
                        Belum ada data penilaian RSCM Award. Klik <strong>+ Tambah Baris RSCM Award</strong>.
                      </td>
                    </tr>
                  ) : (
                    awardRows.map((row, idx) => {
                      const isEven = idx % 2 === 1
                      return (
                        <tr
                          key={row.id || idx}
                          className={`transition-colors hover:bg-teal-50/40 align-top ${isEven ? 'bg-gray-50/40' : 'bg-white'}`}
                        >
                          {/* Col 0: No */}
                          <td className="px-3 py-2.5 text-center font-bold text-gray-600 border-r border-gray-200">
                            <input
                              type="text"
                              value={row.no}
                              onPaste={(e) => handleAwardCellPaste(e, idx, 0)}
                              onChange={(e) => {
                                const val = e.target.value
                                setAwardRows(awardRows.map((r, i) => (i === idx ? { ...r, no: val } : r)))
                              }}
                              className="w-10 text-center font-bold p-1.5 rounded border border-gray-200 outline-none bg-white"
                            />
                          </td>

                          {/* Col 1: Poin Penilaian - Fleksibel Otomatis */}
                          <td className="px-3 py-2.5 border-r border-gray-200 min-w-[300px]">
                            <AutoTextarea
                              value={row.poin_penilaian}
                              onPaste={(e) => handleAwardCellPaste(e, idx, 1)}
                              onChange={(e) => {
                                const val = e.target.value
                                setAwardRows(awardRows.map((r, i) => (i === idx ? { ...r, poin_penilaian: val } : r)))
                              }}
                              placeholder="Masukkan uraian poin penilaian RSCM Award..."
                              className="w-full text-xs font-semibold text-[#00282b] p-2 rounded-lg border border-gray-200 focus:border-[#01bcce] outline-none break-words whitespace-pre-wrap leading-relaxed bg-white"
                            />
                          </td>

                          {/* Col 2: Target */}
                          <td className="px-3 py-2.5 text-center border-r border-gray-200 w-[140px] min-w-[130px]">
                            <AutoTextarea
                              value={row.target}
                              onPaste={(e) => handleAwardCellPaste(e, idx, 2)}
                              onChange={(e) => {
                                const val = e.target.value
                                setAwardRows(awardRows.map((r, i) => (i === idx ? { ...r, target: val } : r)))
                              }}
                              placeholder="Target"
                              className="w-full text-xs text-center p-2 rounded-lg border border-gray-200 focus:border-[#01bcce] outline-none break-words whitespace-pre-wrap leading-relaxed bg-white"
                            />
                          </td>

                          {/* Col 3: Capaian */}
                          <td className="px-3 py-2.5 text-center border-r border-gray-200 w-[140px] min-w-[130px]">
                            <AutoTextarea
                              value={row.capaian}
                              onPaste={(e) => handleAwardCellPaste(e, idx, 3)}
                              onChange={(e) => {
                                const val = e.target.value
                                setAwardRows(awardRows.map((r, i) => (i === idx ? { ...r, capaian: val } : r)))
                              }}
                              placeholder="Capaian"
                              className="w-full text-xs text-center font-bold text-[#00282b] p-2 rounded-lg border border-gray-200 focus:border-[#01bcce] outline-none break-words whitespace-pre-wrap leading-relaxed bg-white"
                            />
                          </td>

                          {/* Col 4: Nilai */}
                          <td className="px-3 py-2.5 text-center border-r border-gray-200 w-[110px] min-w-[100px]">
                            <input
                              type="text"
                              value={row.nilai}
                              onPaste={(e) => handleAwardCellPaste(e, idx, 4)}
                              onChange={(e) => {
                                const val = e.target.value
                                setAwardRows(awardRows.map((r, i) => (i === idx ? { ...r, nilai: val } : r)))
                              }}
                              placeholder="Nilai"
                              className="w-full text-xs text-center font-black text-[#015a61] p-2 rounded-lg border border-teal-200 bg-teal-50/50 outline-none"
                            />
                          </td>

                          {/* Col 5: Rencana Tindak Lanjut - Fleksibel Otomatis */}
                          <td className="px-3 py-2.5 border-r border-gray-200 min-w-[280px]">
                            <AutoTextarea
                              value={row.rencana_tindak_lanjut}
                              onPaste={(e) => handleAwardCellPaste(e, idx, 5)}
                              onChange={(e) => {
                                const val = e.target.value
                                setAwardRows(awardRows.map((r, i) => (i === idx ? { ...r, rencana_tindak_lanjut: val } : r)))
                              }}
                              placeholder="Rencana tindak lanjut..."
                              className="w-full text-xs text-gray-700 p-2 rounded-lg border border-gray-200 focus:border-[#01bcce] outline-none break-words whitespace-pre-wrap leading-relaxed bg-white"
                            />
                          </td>

                          {/* Col 6: Deadline */}
                          <td className="px-3 py-2.5 text-center border-r border-gray-200 w-[150px] min-w-[130px]">
                            <AutoTextarea
                              value={row.deadline}
                              onPaste={(e) => handleAwardCellPaste(e, idx, 6)}
                              onChange={(e) => {
                                const val = e.target.value
                                setAwardRows(awardRows.map((r, i) => (i === idx ? { ...r, deadline: val } : r)))
                              }}
                              placeholder="Misal: 31 Des 2026"
                              className="w-full text-xs text-center font-semibold text-gray-700 p-2 rounded-lg border border-gray-200 outline-none break-words whitespace-pre-wrap leading-relaxed bg-white"
                            />
                          </td>

                          {/* Aksi */}
                          <td className="px-2 py-2.5 text-center w-20">
                            <div className="flex items-center justify-center gap-1 pt-1">
                              <button
                                type="button"
                                onClick={() => handleMoveRow('award', idx, 'up')}
                                disabled={idx === 0}
                                title="Pindah ke atas"
                                className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-20 cursor-pointer"
                              >
                                <ArrowUp size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveRow('award', idx, 'down')}
                                disabled={idx === awardRows.length - 1}
                                title="Pindah ke bawah"
                                className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-20 cursor-pointer"
                              >
                                <ArrowDown size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteAwardRow(idx)}
                                title="Hapus baris"
                                className="p-1 rounded text-red-500 hover:bg-red-50 cursor-pointer"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-2 relative z-10">
              <button
                type="button"
                onClick={handleAddAwardRow}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-nav text-xs font-bold text-[#00282b] bg-gray-100 hover:bg-gray-200 transition-all cursor-pointer"
              >
                <Plus size={14} />
                Tambah Baris Baru
              </button>

              <button
                type="button"
                onClick={handleSaveActiveTab}
                disabled={saving || loading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-nav text-xs font-bold text-white bg-[#0a7a3d] hover:bg-[#086331] disabled:opacity-50 transition-all shadow-md cursor-pointer"
              >
                <Save size={15} />
                {saving ? 'Menyimpan...' : 'Simpan Perubahan RSCM Award'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* MODAL: TAMBAH TAHUN BARU                                  */}
      {/* ========================================================= */}
      {showAddYearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-nav font-bold text-base text-[#00282b] flex items-center gap-2">
                <Calendar size={18} className="text-[#01bcce]" />
                Tambah Tahun Evaluasi
              </h3>
              <button onClick={() => setShowAddYearModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <p className="font-nav text-xs text-gray-500">
              Masukkan angka tahun yang ingin ditambahkan ke sistem (contoh: 2027).
            </p>

            <input
              type="number"
              value={newYearInput}
              onChange={(e) => setNewYearInput(e.target.value)}
              placeholder="Contoh: 2027"
              className="w-full px-3.5 py-2.5 text-sm font-nav font-bold rounded-xl border border-gray-200 focus:border-[#01bcce] outline-none"
              autoFocus
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddYearModal(false)}
                className="px-4 py-2 text-xs font-nav font-bold text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleAddNewYear}
                className="px-4 py-2 text-xs font-nav font-bold text-white bg-[#015a61] hover:bg-[#00282b] rounded-xl cursor-pointer"
              >
                Tambahkan Tahun
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
