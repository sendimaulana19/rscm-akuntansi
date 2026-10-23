'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import {
  Save,
  Calendar,
  Trash2,
  Plus,
  CheckCircle2,
  FileText,
  ArrowRight,
  RotateCcw,
  AlertTriangle,
  ClipboardPaste,
} from 'lucide-react'
import { parseNumber } from '@/lib/neraca'

const NAMA_BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

export interface MonthEntry {
  bulan: string
  bulan_num: number
  internal: {
    jumlah_dokumen: number
    proses: number
    lolos: number
  }
  eksternal: {
    jumlah_dokumen: number
    proses: number
    lolos: number
  }
  keseluruhan?: {
    jumlah_dokumen: number
    proses: number
    lolos: number
  }
}

function createEmptyMonths(): MonthEntry[] {
  return NAMA_BULAN.map((bulan, idx) => ({
    bulan,
    bulan_num: idx + 1,
    internal: { jumlah_dokumen: 0, proses: 0, lolos: 0 },
    eksternal: { jumlah_dokumen: 0, proses: 0, lolos: 0 },
    keseluruhan: { jumlah_dokumen: 0, proses: 0, lolos: 0 }
  }))
}

interface Props {
  onMessage: (msg: { type: 'ok' | 'err'; text: string } | null) => void
}

export default function DokumenTagihanTab({ onMessage }: Props) {
  const supabase = createClient()
  const currentYear = new Date().getFullYear()

  const [selectedYear, setSelectedYear] = useState<number>(currentYear)
  const [availableYears, setAvailableYears] = useState<number[]>([currentYear])
  const [newYearInput, setNewYearInput] = useState('')
  const [existingRecordId, setExistingRecordId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Header & Keterangan Text Box States
  const [headerText, setHeaderText] = useState(
    'Layanan verifikasi dokumen tagihan keuangan RSCM memastikan kelengkapan, keabsahan, dan kepatuhan administrasi tagihan internal maupun eksternal sebelum dilakukan proses pembayaran.'
  )
  const [judulKeseluruhan, setJudulKeseluruhan] = useState('Catatan Dokumen Tagihan Keseluruhan')
  const [ketKeseluruhan, setKetKeseluruhan] = useState(
    'Rekapitulasi seluruh dokumen tagihan masuk baik internal maupun eksternal yang diverifikasi secara berkala untuk memastikan kelengkapan berkas, validitas transaksi, dan kepatuhan administrasi sebelum proses pembayaran.'
  )
  const [judulInternal, setJudulInternal] = useState('Catatan Dokumen Tagihan Internal')
  const [ketInternal, setKetInternal] = useState(
    'Verifikasi dokumen tagihan dari unit kerja internal RSCM yang meliputi pengajuan operasional, belanja modal, dan pertanggungjawaban kegiatan kerja sama operasional.'
  )
  const [judulEksternal, setJudulEksternal] = useState('Catatan Dokumen Tagihan Eksternal')
  const [ketEksternal, setKetEksternal] = useState(
    'Verifikasi dokumen tagihan dari pihak ketiga atau vendor eksternal penyedia barang dan jasa medis maupun non-medis di lingkungan RSUPN Dr. Cipto Mangunkusumo.'
  )
  const [ketPerbandinganInternal, setKetPerbandinganInternal] = useState('')
  const [ketPerbandinganEksternal, setKetPerbandinganEksternal] = useState('')

  // State Data 12 Bulan
  const [monthsData, setMonthsData] = useState<MonthEntry[]>(createEmptyMonths())

  // Fetch available years
  const fetchAvailableYears = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('financial_reports_data')
        .select('year')
        .eq('category', 'verifikasi_dokumen_tagihan')

      if (error) {
        console.error('Error fetching available years:', error)
        return
      }

      const yearsFromDb = (data || []).map((d: any) => d.year)
      const combined = Array.from(new Set([currentYear, ...yearsFromDb])).sort((a, b) => b - a)
      setAvailableYears(combined)
    } catch (err) {
      console.error('Error in fetchAvailableYears:', err)
    }
  }, [supabase, currentYear])

  useEffect(() => {
    fetchAvailableYears()
  }, [fetchAvailableYears])

  // Load data for a specific year
  const loadData = useCallback(async (year: number) => {
    try {
      const { data, error } = await supabase
        .from('financial_reports_data')
        .select('*')
        .eq('category', 'verifikasi_dokumen_tagihan')
        .eq('year', year)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching data for year:', year, error)
        return
      }

      if (data && data.data) {
        setExistingRecordId(data.id)
        if (data.data.header_text) setHeaderText(data.data.header_text)
        if (data.data.judul_text_keseluruhan) setJudulKeseluruhan(data.data.judul_text_keseluruhan)
        if (data.data.keterangan_keseluruhan) setKetKeseluruhan(data.data.keterangan_keseluruhan)
        if (data.data.judul_text_internal) setJudulInternal(data.data.judul_text_internal)
        if (data.data.keterangan_internal) setKetInternal(data.data.keterangan_internal)
        if (data.data.judul_text_eksternal) setJudulEksternal(data.data.judul_text_eksternal)
        if (data.data.keterangan_eksternal) setKetEksternal(data.data.keterangan_eksternal)

        if (Array.isArray(data.data.months) && data.data.months.length > 0) {
          const filled = createEmptyMonths().map(emptyM => {
            const found = data.data.months.find((m: MonthEntry) => m.bulan === emptyM.bulan)
            if (found) {
              const intJml = found.internal?.jumlah_dokumen ?? 0
              const intPros = found.internal?.proses ?? 0
              const intLolos = found.internal?.lolos ?? 0
              const eksJml = found.eksternal?.jumlah_dokumen ?? 0
              const eksPros = found.eksternal?.proses ?? 0
              const eksLolos = found.eksternal?.lolos ?? 0
              return {
                ...found,
                internal: { jumlah_dokumen: intJml, proses: intPros, lolos: intLolos },
                eksternal: { jumlah_dokumen: eksJml, proses: eksPros, lolos: eksLolos },
                keseluruhan: {
                  jumlah_dokumen: intJml + eksJml,
                  proses: intPros + eksPros,
                  lolos: intLolos + eksLolos,
                }
              }
            }
            return emptyM
          })
          setMonthsData(filled)
          return
        }
      }

      // Fallback empty data
      setExistingRecordId(null)
      setMonthsData(createEmptyMonths())
    } catch (err: any) {
      console.error(err)
    }
  }, [supabase])

  // Load global perbandingan text
  const loadGlobalPerbandingan = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('financial_reports_data')
        .select('*')
        .eq('category', 'verifikasi_dokumen_tagihan_global')
        .eq('item_name', 'perbandingan_keterangan')
        .maybeSingle()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching global perbandingan text:', error)
        return
      }

      if (data && data.data) {
        if (data.data.keterangan_internal !== undefined) setKetPerbandinganInternal(data.data.keterangan_internal)
        if (data.data.keterangan_eksternal !== undefined) setKetPerbandinganEksternal(data.data.keterangan_eksternal)
      }
    } catch (err: any) {
      console.error(err)
    }
  }, [supabase])

  useEffect(() => {
    loadData(selectedYear)
  }, [selectedYear, loadData])

  useEffect(() => {
    loadGlobalPerbandingan()
  }, [loadGlobalPerbandingan])

  // Add new year
  const handleAddNewYear = () => {
    const val = parseInt(newYearInput.trim())
    if (!val || val < 2000 || val > 2100) {
      onMessage({ type: 'err', text: 'Tahun harus berupa 4 digit angka yang valid (2000-2100).' })
      return
    }
    if (!availableYears.includes(val)) {
      const updated = [val, ...availableYears].sort((a, b) => b - a)
      setAvailableYears(updated)
    }
    setSelectedYear(val)
    setNewYearInput('')
    onMessage({ type: 'ok', text: `Tahun ${val} aktif! Silakan isi tabel atau paste dari Excel.` })
  }

  // Delete current year
  const handleDeleteYear = async () => {
    if (!window.confirm(`Yakin ingin menghapus seluruh data Dokumen Tagihan tahun ${selectedYear}? Data yang dihapus tidak dapat dikembalikan.`)) {
      return
    }

    setLoading(true)
    onMessage(null)

    try {
      if (existingRecordId) {
        const { error } = await supabase
          .from('financial_reports_data')
          .delete()
          .eq('id', existingRecordId)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('financial_reports_data')
          .delete()
          .eq('category', 'verifikasi_dokumen_tagihan')
          .eq('year', selectedYear)

        if (error) throw error
      }

      onMessage({ type: 'ok', text: `Data Dokumen Tagihan tahun ${selectedYear} berhasil dihapus!` })

      const filtered = availableYears.filter(y => y !== selectedYear)
      const nextYears = filtered.length > 0 ? filtered : [currentYear]
      setAvailableYears(nextYears)
      setSelectedYear(nextYears[0])
    } catch (err: any) {
      onMessage({ type: 'err', text: 'Gagal menghapus tahun: ' + err.message })
    } finally {
      setLoading(false)
    }
  }

  // Reset 12 months to 0
  const handleResetAllMonths = () => {
    if (!window.confirm(`Yakin ingin mengosongkan (reset ke 0) semua angka 12 bulan pada tahun ${selectedYear}?`)) {
      return
    }
    setMonthsData(createEmptyMonths())
    onMessage({ type: 'ok', text: `Seluruh angka 12 bulan telah direset ke 0. Jangan lupa klik 'Simpan Data Tabel' untuk menyimpan ke database.` })
  }

  // Reset single month to 0
  const handleResetMonth = (bulan: string) => {
    setMonthsData(prev =>
      prev.map(m =>
        m.bulan === bulan
          ? {
              ...m,
              internal: { jumlah_dokumen: 0, proses: 0, lolos: 0 },
              eksternal: { jumlah_dokumen: 0, proses: 0, lolos: 0 },
              keseluruhan: { jumlah_dokumen: 0, proses: 0, lolos: 0 }
            }
          : m
      )
    )
  }

  // Handle direct cell change
  const handleCellChange = (
    rowIdx: number,
    fieldKey: 'intJml' | 'intPros' | 'intLolos' | 'eksJml' | 'eksPros' | 'eksLolos',
    rawVal: string
  ) => {
    const val = parseNumber(rawVal) ?? 0
    setMonthsData(prev => {
      return prev.map((m, i) => {
        if (i !== rowIdx) return m
        const internal = { ...m.internal }
        const eksternal = { ...m.eksternal }

        if (fieldKey === 'intJml') internal.jumlah_dokumen = val
        else if (fieldKey === 'intPros') internal.proses = val
        else if (fieldKey === 'intLolos') internal.lolos = val
        else if (fieldKey === 'eksJml') eksternal.jumlah_dokumen = val
        else if (fieldKey === 'eksPros') eksternal.proses = val
        else if (fieldKey === 'eksLolos') eksternal.lolos = val

        const kesJml = (internal.jumlah_dokumen || 0) + (eksternal.jumlah_dokumen || 0)
        const kesPros = (internal.proses || 0) + (eksternal.proses || 0)
        const kesLolos = (internal.lolos || 0) + (eksternal.lolos || 0)

        return {
          ...m,
          internal,
          eksternal,
          keseluruhan: {
            jumlah_dokumen: kesJml,
            proses: kesPros,
            lolos: kesLolos
          }
        }
      })
    })
  }

  // Handle Excel paste
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>, startRow: number, startCol: number) => {
    const text = e.clipboardData.getData('text')
    if (!text.includes('\t') && !text.includes('\n')) return // normal single-value typing
    e.preventDefault()

    const lines = text.replace(/\r/g, '').split('\n').filter(line => line.trim().length > 0)
    if (lines.length === 0) return

    const matrix = lines.map(line => line.split('\t'))

    setMonthsData(prev => {
      const next = prev.map(m => ({
        ...m,
        internal: { ...m.internal },
        eksternal: { ...m.eksternal },
        keseluruhan: { ...(m.keseluruhan || { jumlah_dokumen: 0, proses: 0, lolos: 0 }) }
      }))

      matrix.forEach((cells, rOffset) => {
        const targetRow = startRow + rOffset
        if (targetRow >= next.length) return

        let vals = cells
        // If first column is a month name / non-number text, skip it
        if (startCol === 0 && vals.length > 1 && isNaN(Number(vals[0].trim().replace(/\./g, '').replace(/,/g, '')))) {
          vals = vals.slice(1)
        }

        vals.forEach((rawVal, cOffset) => {
          const targetCol = startCol + cOffset
          const num = parseNumber(rawVal) ?? 0
          if (targetCol === 0) next[targetRow].internal.jumlah_dokumen = num
          else if (targetCol === 1) next[targetRow].internal.proses = num
          else if (targetCol === 2) next[targetRow].internal.lolos = num
          else if (targetCol === 3) next[targetRow].eksternal.jumlah_dokumen = num
          else if (targetCol === 4) next[targetRow].eksternal.proses = num
          else if (targetCol === 5) next[targetRow].eksternal.lolos = num
        })

        const intJ = next[targetRow].internal.jumlah_dokumen || 0
        const intP = next[targetRow].internal.proses || 0
        const intL = next[targetRow].internal.lolos || 0
        const eksJ = next[targetRow].eksternal.jumlah_dokumen || 0
        const eksP = next[targetRow].eksternal.proses || 0
        const eksL = next[targetRow].eksternal.lolos || 0

        next[targetRow].keseluruhan = {
          jumlah_dokumen: intJ + eksJ,
          proses: intP + eksP,
          lolos: intL + eksL
        }
      })

      return next
    })

    onMessage({ type: 'ok', text: `Data berhasil di-paste dari Excel ke tabel Dokumen Tagihan!` })
  }

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, row: number, col: number) => {
    const move = (dr: number, dc: number = 0) => {
      const nr = row + dr
      const nc = col + dc
      if (nr >= 0 && nr < 12 && nc >= 0 && nc < 6) {
        const el = document.getElementById(`dok-cell-${nr}-${nc}`) as HTMLInputElement | null
        if (el) {
          e.preventDefault()
          el.focus()
          el.select()
        }
      }
    }

    if (e.key === 'Enter' || e.key === 'ArrowDown') move(1, 0)
    else if (e.key === 'ArrowUp') move(-1, 0)
  }

  // Save full table to Supabase
  const handleSaveTable = async () => {
    setLoading(true)
    onMessage(null)

    // Recalculate keseluruhan
    const updatedMonths = monthsData.map(m => {
      const intJ = m.internal.jumlah_dokumen || 0
      const intP = m.internal.proses || 0
      const intL = m.internal.lolos || 0
      const eksJ = m.eksternal.jumlah_dokumen || 0
      const eksP = m.eksternal.proses || 0
      const eksL = m.eksternal.lolos || 0
      return {
        ...m,
        keseluruhan: {
          jumlah_dokumen: intJ + eksJ,
          proses: intP + eksP,
          lolos: intL + eksL
        }
      }
    })

    setMonthsData(updatedMonths)

    const payloadData = {
      tahun: selectedYear,
      header_text: headerText.trim(),
      judul_text_keseluruhan: judulKeseluruhan.trim(),
      keterangan_keseluruhan: ketKeseluruhan.trim(),
      judul_text_internal: judulInternal.trim(),
      keterangan_internal: ketInternal.trim(),
      judul_text_eksternal: judulEksternal.trim(),
      keterangan_eksternal: ketEksternal.trim(),
      months: updatedMonths
    }

    try {
      if (existingRecordId) {
        const { error } = await supabase
          .from('financial_reports_data')
          .update({
            data: payloadData,
            year: selectedYear
          })
          .eq('id', existingRecordId)

        if (error) throw error
      } else {
        const { data: newRec, error } = await supabase
          .from('financial_reports_data')
          .insert({
            category: 'verifikasi_dokumen_tagihan',
            year: selectedYear,
            item_name: `rekap_${selectedYear}`,
            data: payloadData
          })
          .select()
          .single()

        if (error) throw error
        if (newRec) setExistingRecordId(newRec.id)
      }

      await fetchAvailableYears()
      onMessage({ type: 'ok', text: `Seluruh data tabel Dokumen Tagihan tahun ${selectedYear} berhasil disimpan ke database!` })
    } catch (err: any) {
      onMessage({ type: 'err', text: 'Gagal menyimpan tabel: ' + err.message })
    } finally {
      setLoading(false)
    }
  }

  // Save Text Box Penjelasan
  const handleSaveKeterangan = async () => {
    setLoading(true)
    onMessage(null)

    const payloadData = {
      tahun: selectedYear,
      header_text: headerText.trim(),
      judul_text_keseluruhan: judulKeseluruhan.trim(),
      keterangan_keseluruhan: ketKeseluruhan.trim(),
      judul_text_internal: judulInternal.trim(),
      keterangan_internal: ketInternal.trim(),
      judul_text_eksternal: judulEksternal.trim(),
      keterangan_eksternal: ketEksternal.trim(),
      months: monthsData
    }

    try {
      if (existingRecordId) {
        const { error } = await supabase
          .from('financial_reports_data')
          .update({ data: payloadData })
          .eq('id', existingRecordId)
        if (error) throw error
      } else {
        const { data: newRec, error } = await supabase
          .from('financial_reports_data')
          .insert({
            category: 'verifikasi_dokumen_tagihan',
            year: selectedYear,
            item_name: `rekap_${selectedYear}`,
            data: payloadData
          })
          .select()
          .single()
        if (error) throw error
        if (newRec) setExistingRecordId(newRec.id)
      }
      await fetchAvailableYears()
      onMessage({ type: 'ok', text: `Semua catatan dan penjelasan tahun ${selectedYear} berhasil disimpan!` })
    } catch (err: any) {
      onMessage({ type: 'err', text: 'Gagal menyimpan catatan: ' + err.message })
    } finally {
      setLoading(false)
    }
  }

  // Save Perbandingan Text Box
  const handleSavePerbandinganKet = async () => {
    setLoading(true)
    onMessage(null)

    const payloadData = {
      keterangan_internal: ketPerbandinganInternal.trim(),
      keterangan_eksternal: ketPerbandinganEksternal.trim(),
      updated_at: new Date().toISOString()
    }

    try {
      const { data: existing } = await supabase
        .from('financial_reports_data')
        .select('id')
        .eq('category', 'verifikasi_dokumen_tagihan_global')
        .eq('item_name', 'perbandingan_keterangan')
        .maybeSingle()

      if (existing) {
        const { error } = await supabase
          .from('financial_reports_data')
          .update({ data: payloadData })
          .eq('id', existing.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('financial_reports_data')
          .insert({
            category: 'verifikasi_dokumen_tagihan_global',
            year: 0,
            item_name: 'perbandingan_keterangan',
            data: payloadData
          })
        if (error) throw error
      }
      onMessage({ type: 'ok', text: 'Catatan penjelasan perbandingan dokumen berhasil disimpan!' })
    } catch (err: any) {
      onMessage({ type: 'err', text: 'Gagal menyimpan catatan perbandingan: ' + err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* ================= CARD 1: INPUT SPREADSHEET TABEL (12 BULAN) ================= */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-sm border border-gray-100">
        {/* Top Header & Year Selector */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-5 pb-4 border-b border-gray-100">
          <div>
            <h2 className="font-nav font-bold text-gray-800 text-lg flex items-center gap-2">
              <ClipboardPaste size={20} className="text-[#01bcce]" />
              Input Tabel Dokumen Tagihan (Tahun {selectedYear})
            </h2>
            <p className="font-nav text-xs text-gray-500 mt-0.5">
              Input data langsung pada sel tabel di bawah atau <strong>copy-paste blok data langsung dari Excel (Ctrl+V)</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Year Selector */}
            <div className="flex items-center gap-2 bg-gray-50 px-3.5 py-1.5 rounded-xl border border-gray-200">
              <Calendar size={15} className="text-[#01bcce]" />
              <span className="font-nav text-xs font-bold text-gray-600">Tahun:</span>
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(parseInt(e.target.value))}
                className="font-nav text-sm font-black text-[#00282b] bg-transparent outline-none cursor-pointer"
              >
                {availableYears.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            {/* Add New Year */}
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                placeholder="Tahun..."
                value={newYearInput}
                onChange={e => setNewYearInput(e.target.value)}
                className="w-24 px-2.5 py-1.5 text-xs font-nav font-bold border border-gray-200 rounded-xl outline-none focus:border-[#01bcce]"
              />
              <button
                type="button"
                onClick={handleAddNewYear}
                className="px-3 py-1.5 text-xs font-nav font-bold text-white rounded-xl flex items-center gap-1 cursor-pointer transition-all hover:opacity-90"
                style={{ background: '#00282b' }}
              >
                <Plus size={13} /> Tambah
              </button>
            </div>

            {/* Status DB Badge */}
            {existingRecordId ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-green-50 text-green-700 border border-green-200">
                <CheckCircle2 size={12} /> Tersimpan di DB
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                <AlertTriangle size={12} /> Belum Ada Data
              </span>
            )}
          </div>
        </div>

        {/* Toolbar & Excel Tip Banner */}
        <div className="bg-[#f0faf9] border border-[#01bcce]/25 rounded-xl p-3.5 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-nav">
          <div className="flex items-center gap-2.5 text-xs text-[#004d53]">
            <ClipboardPaste size={18} className="text-[#01bcce] flex-shrink-0" />
            <span>
              <strong>Tips Excel:</strong> Anda dapat meng-copy 6 kolom (atau 3 kolom) dari Excel lalu paste (Ctrl+V) langsung ke sel. Gunakan tombol panah <strong>Up / Down</strong> atau <strong>Enter</strong> untuk navigasi.
            </span>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
            <button
              type="button"
              onClick={handleResetAllMonths}
              disabled={loading}
              className="px-3 py-1.5 text-xs font-bold text-gray-600 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              title="Reset 12 Bulan ke 0"
            >
              <RotateCcw size={13} /> Reset Semua (0)
            </button>
            <button
              type="button"
              onClick={handleSaveTable}
              disabled={loading}
              className="px-4 py-1.5 text-xs font-bold text-white rounded-lg flex items-center gap-1.5 transition-all shadow-sm hover:opacity-90 disabled:opacity-50 cursor-pointer"
              style={{ background: '#00282b' }}
            >
              <Save size={14} className="text-[#d0db41]" />
              {loading ? 'Menyimpan...' : 'Simpan Data Tabel'}
            </button>
          </div>
        </div>

        {/* Spreadsheet Table (12 Bulan) */}
        <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-xs bg-white">
          <table className="w-full text-left font-nav text-xs border-collapse min-w-[840px]">
            <thead style={{ background: '#008080' }}>
              <tr>
                <th
                  rowSpan={2}
                  style={{
                    padding: '10px 14px',
                    textAlign: 'center',
                    borderRight: '1px solid rgba(255,255,255,0.2)',
                    borderBottom: '2px solid rgba(0,0,0,0.1)',
                    fontFamily: 'Nunito, sans-serif',
                    fontSize: 12,
                    fontWeight: 800,
                    color: '#ffffff',
                    textTransform: 'uppercase',
                    width: 120
                  }}
                >
                  Periode
                </th>
                <th
                  colSpan={3}
                  style={{
                    padding: '8px 12px',
                    textAlign: 'center',
                    borderRight: '1px solid rgba(255,255,255,0.2)',
                    borderBottom: '1px solid rgba(255,255,255,0.2)',
                    fontFamily: 'Nunito, sans-serif',
                    fontSize: 11,
                    fontWeight: 800,
                    color: '#ffffff',
                    textTransform: 'uppercase',
                    background: '#006666'
                  }}
                >
                  Tagihan Internal (Input)
                </th>
                <th
                  colSpan={3}
                  style={{
                    padding: '8px 12px',
                    textAlign: 'center',
                    borderRight: '1px solid rgba(255,255,255,0.2)',
                    borderBottom: '1px solid rgba(255,255,255,0.2)',
                    fontFamily: 'Nunito, sans-serif',
                    fontSize: 11,
                    fontWeight: 800,
                    color: '#ffffff',
                    textTransform: 'uppercase',
                    background: '#005959'
                  }}
                >
                  Tagihan Eksternal (Input)
                </th>
                <th
                  colSpan={3}
                  style={{
                    padding: '8px 12px',
                    textAlign: 'center',
                    borderRight: '1px solid rgba(255,255,255,0.2)',
                    borderBottom: '1px solid rgba(255,255,255,0.2)',
                    fontFamily: 'Nunito, sans-serif',
                    fontSize: 11,
                    fontWeight: 800,
                    color: '#d0db41',
                    textTransform: 'uppercase',
                    background: '#004d4d'
                  }}
                >
                  Keseluruhan (Otomatis)
                </th>
                <th
                  rowSpan={2}
                  style={{
                    padding: '10px 10px',
                    textAlign: 'center',
                    borderBottom: '2px solid rgba(0,0,0,0.1)',
                    fontFamily: 'Nunito, sans-serif',
                    fontSize: 11,
                    fontWeight: 800,
                    color: '#ffffff',
                    textTransform: 'uppercase',
                    width: 60
                  }}
                >
                  Aksi
                </th>
              </tr>
              <tr style={{ background: '#004d4d', color: '#ffffff', fontSize: 10, fontWeight: 700 }}>
                {/* Internal Columns */}
                <th style={{ padding: '6px 8px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.15)' }}>Jml Dok</th>
                <th style={{ padding: '6px 8px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.15)', color: '#01bcce' }}>Proses</th>
                <th style={{ padding: '6px 8px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.2)', color: '#a7f3d0' }}>Lolos</th>
                {/* Eksternal Columns */}
                <th style={{ padding: '6px 8px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.15)' }}>Jml Dok</th>
                <th style={{ padding: '6px 8px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.15)', color: '#01bcce' }}>Proses</th>
                <th style={{ padding: '6px 8px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.2)', color: '#a7f3d0' }}>Lolos</th>
                {/* Keseluruhan Columns */}
                <th style={{ padding: '6px 8px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.15)', color: '#ffffff' }}>Jml Dok</th>
                <th style={{ padding: '6px 8px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.15)', color: '#01bcce' }}>Proses</th>
                <th style={{ padding: '6px 8px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.2)', color: '#d0db41' }}>Lolos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {monthsData.map((m, idx) => {
                const kesJml = (m.internal.jumlah_dokumen || 0) + (m.eksternal.jumlah_dokumen || 0)
                const kesPros = (m.internal.proses || 0) + (m.eksternal.proses || 0)
                const kesLolos = (m.internal.lolos || 0) + (m.eksternal.lolos || 0)

                return (
                  <tr key={m.bulan} className={`transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-[#fafbfc]'} hover:bg-[#f0faf9]`}>
                    {/* Bulan Name */}
                    <td style={{ padding: '8px 12px', textAlign: 'left', borderRight: '1px solid #e5e7eb', fontWeight: 800, color: '#00282b' }}>
                      {m.bulan}
                    </td>

                    {/* Internal: Jml */}
                    <td style={{ padding: '4px', borderRight: '1px solid #e5e7eb' }}>
                      <input
                        id={`dok-cell-${idx}-0`}
                        type="text"
                        value={m.internal.jumlah_dokumen === 0 ? '0' : m.internal.jumlah_dokumen || ''}
                        onChange={e => handleCellChange(idx, 'intJml', e.target.value)}
                        onPaste={e => handlePaste(e, idx, 0)}
                        onKeyDown={e => handleKeyDown(e, idx, 0)}
                        onFocus={e => e.target.select()}
                        className="w-full text-center font-nav text-xs font-bold py-1.5 px-1 bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-gray-200 focus:border-[#01bcce] focus:ring-1 focus:ring-[#01bcce] rounded-lg outline-none transition-all text-gray-800"
                      />
                    </td>

                    {/* Internal: Proses */}
                    <td style={{ padding: '4px', borderRight: '1px solid #e5e7eb' }}>
                      <input
                        id={`dok-cell-${idx}-1`}
                        type="text"
                        value={m.internal.proses === 0 ? '0' : m.internal.proses || ''}
                        onChange={e => handleCellChange(idx, 'intPros', e.target.value)}
                        onPaste={e => handlePaste(e, idx, 1)}
                        onKeyDown={e => handleKeyDown(e, idx, 1)}
                        onFocus={e => e.target.select()}
                        className="w-full text-center font-nav text-xs font-bold py-1.5 px-1 bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-gray-200 focus:border-[#01bcce] focus:ring-1 focus:ring-[#01bcce] rounded-lg outline-none transition-all text-[#01bcce]"
                      />
                    </td>

                    {/* Internal: Lolos */}
                    <td style={{ padding: '4px', borderRight: '1px solid #cbd5e1' }}>
                      <input
                        id={`dok-cell-${idx}-2`}
                        type="text"
                        value={m.internal.lolos === 0 ? '0' : m.internal.lolos || ''}
                        onChange={e => handleCellChange(idx, 'intLolos', e.target.value)}
                        onPaste={e => handlePaste(e, idx, 2)}
                        onKeyDown={e => handleKeyDown(e, idx, 2)}
                        onFocus={e => e.target.select()}
                        className="w-full text-center font-nav text-xs font-bold py-1.5 px-1 bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-gray-200 focus:border-[#01bcce] focus:ring-1 focus:ring-[#01bcce] rounded-lg outline-none transition-all text-[#10b981]"
                      />
                    </td>

                    {/* Eksternal: Jml */}
                    <td style={{ padding: '4px', borderRight: '1px solid #e5e7eb' }}>
                      <input
                        id={`dok-cell-${idx}-3`}
                        type="text"
                        value={m.eksternal.jumlah_dokumen === 0 ? '0' : m.eksternal.jumlah_dokumen || ''}
                        onChange={e => handleCellChange(idx, 'eksJml', e.target.value)}
                        onPaste={e => handlePaste(e, idx, 3)}
                        onKeyDown={e => handleKeyDown(e, idx, 3)}
                        onFocus={e => e.target.select()}
                        className="w-full text-center font-nav text-xs font-bold py-1.5 px-1 bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-gray-200 focus:border-[#01bcce] focus:ring-1 focus:ring-[#01bcce] rounded-lg outline-none transition-all text-gray-800"
                      />
                    </td>

                    {/* Eksternal: Proses */}
                    <td style={{ padding: '4px', borderRight: '1px solid #e5e7eb' }}>
                      <input
                        id={`dok-cell-${idx}-4`}
                        type="text"
                        value={m.eksternal.proses === 0 ? '0' : m.eksternal.proses || ''}
                        onChange={e => handleCellChange(idx, 'eksPros', e.target.value)}
                        onPaste={e => handlePaste(e, idx, 4)}
                        onKeyDown={e => handleKeyDown(e, idx, 4)}
                        onFocus={e => e.target.select()}
                        className="w-full text-center font-nav text-xs font-bold py-1.5 px-1 bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-gray-200 focus:border-[#01bcce] focus:ring-1 focus:ring-[#01bcce] rounded-lg outline-none transition-all text-[#01bcce]"
                      />
                    </td>

                    {/* Eksternal: Lolos */}
                    <td style={{ padding: '4px', borderRight: '1px solid #cbd5e1' }}>
                      <input
                        id={`dok-cell-${idx}-5`}
                        type="text"
                        value={m.eksternal.lolos === 0 ? '0' : m.eksternal.lolos || ''}
                        onChange={e => handleCellChange(idx, 'eksLolos', e.target.value)}
                        onPaste={e => handlePaste(e, idx, 5)}
                        onKeyDown={e => handleKeyDown(e, idx, 5)}
                        onFocus={e => e.target.select()}
                        className="w-full text-center font-nav text-xs font-bold py-1.5 px-1 bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-gray-200 focus:border-[#01bcce] focus:ring-1 focus:ring-[#01bcce] rounded-lg outline-none transition-all text-[#10b981]"
                      />
                    </td>

                    {/* Keseluruhan (Otomatis): Jml */}
                    <td style={{ padding: '8px 6px', textAlign: 'center', borderRight: '1px solid #e5e7eb', background: 'rgba(1,188,206,0.06)', fontWeight: 800, color: '#00282b' }}>
                      {kesJml.toLocaleString('id-ID')}
                    </td>

                    {/* Keseluruhan (Otomatis): Proses */}
                    <td style={{ padding: '8px 6px', textAlign: 'center', borderRight: '1px solid #e5e7eb', background: 'rgba(1,188,206,0.06)', fontWeight: 800, color: '#01bcce' }}>
                      {kesPros.toLocaleString('id-ID')}
                    </td>

                    {/* Keseluruhan (Otomatis): Lolos */}
                    <td style={{ padding: '8px 6px', textAlign: 'center', borderRight: '1px solid #cbd5e1', background: 'rgba(1,188,206,0.06)', fontWeight: 900, color: '#059669' }}>
                      {kesLolos.toLocaleString('id-ID')}
                    </td>

                    {/* Action: Reset row */}
                    <td style={{ padding: '6px', textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => handleResetMonth(m.bulan)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                        title={`Reset angka bulan ${m.bulan} ke 0`}
                      >
                        <RotateCcw size={13} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Bottom Save Button & Public Link */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-5 mt-4 border-t border-gray-100">
          <Link
            href="/akuntansi-verifikasi"
            target="_blank"
            className="font-nav text-xs font-bold text-[#01bcce] hover:underline flex items-center gap-1"
          >
            Lihat Halaman Publik <ArrowRight size={13} />
          </Link>

          <button
            type="button"
            onClick={handleSaveTable}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-nav font-bold text-sm text-white disabled:opacity-50 hover:opacity-90 transition-all duration-200 cursor-pointer shadow-sm"
            style={{ background: '#00282b' }}
          >
            <Save size={16} className="text-[#d0db41]" />
            {loading ? 'Menyimpan...' : `Simpan Seluruh Data Tabel (${selectedYear})`}
          </button>
        </div>
      </div>

      {/* ================= CARD 2: KELOLA TEXT BOX PENJELASAN DOKUMEN ================= */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-gray-100 mb-6">
          <div>
            <h2 className="font-nav font-bold text-gray-800 text-base sm:text-lg flex items-center gap-2">
              <FileText size={20} style={{ color: '#01bcce' }} />
              Kelola Text Box Penjelasan Dokumen (Tahun {selectedYear})
            </h2>
            <p className="font-nav text-xs text-gray-500 mt-1">
              Atur isi kalimat penjelasan untuk masing-masing text box di bawah tabel di halaman publik.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSaveKeterangan}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl text-xs font-nav font-bold text-white transition-all cursor-pointer flex items-center gap-2 shadow-sm hover:opacity-90 disabled:opacity-50 self-end sm:self-center flex-shrink-0"
            style={{ background: '#00282b' }}
          >
            <Save size={14} style={{ color: '#01bcce' }} />
            Simpan Text Box ({selectedYear})
          </button>
        </div>

        {/* Header Text */}
        <div className="mb-6 pb-6 border-b border-gray-100">
          <label className="font-nav text-xs font-bold text-gray-600 uppercase tracking-wider block mb-1.5">
            Penjelasan Singkat di Header Halaman Publik (Tahun {selectedYear})
          </label>
          <textarea
            rows={2}
            value={headerText}
            onChange={e => setHeaderText(e.target.value)}
            placeholder="Masukkan penjelasan singkat mengenai verifikasi dokumen tagihan..."
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 font-nav text-sm outline-none focus:border-[#01bcce] focus:ring-1 focus:ring-[#01bcce] transition-all bg-[#fafbfc]"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Keseluruhan */}
          <div className="p-4 rounded-xl border border-gray-200 bg-[#fafbfc] flex flex-col justify-between">
            <div>
              <span className="w-3 h-3 rounded-full bg-[#01bcce] inline-block mb-2" />
              <label className="font-nav text-xs font-bold text-gray-700 uppercase block mb-1">
                Judul Box Keseluruhan
              </label>
              <input
                type="text"
                value={judulKeseluruhan}
                onChange={e => setJudulKeseluruhan(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-gray-200 font-nav text-xs font-bold mb-3 outline-none focus:border-[#01bcce]"
              />
              <label className="font-nav text-xs font-bold text-gray-700 uppercase block mb-1">
                Isi Keterangan Keseluruhan
              </label>
              <textarea
                rows={5}
                value={ketKeseluruhan}
                onChange={e => setKetKeseluruhan(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 font-nav text-xs outline-none focus:border-[#01bcce]"
              />
            </div>
          </div>

          {/* Internal */}
          <div className="p-4 rounded-xl border border-gray-200 bg-[#fafbfc] flex flex-col justify-between">
            <div>
              <span className="w-3 h-3 rounded-full bg-[#d0db41] inline-block mb-2" />
              <label className="font-nav text-xs font-bold text-gray-700 uppercase block mb-1">
                Judul Box Internal
              </label>
              <input
                type="text"
                value={judulInternal}
                onChange={e => setJudulInternal(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-gray-200 font-nav text-xs font-bold mb-3 outline-none focus:border-[#01bcce]"
              />
              <label className="font-nav text-xs font-bold text-gray-700 uppercase block mb-1">
                Isi Keterangan Internal
              </label>
              <textarea
                rows={5}
                value={ketInternal}
                onChange={e => setKetInternal(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 font-nav text-xs outline-none focus:border-[#01bcce]"
              />
            </div>
          </div>

          {/* Eksternal */}
          <div className="p-4 rounded-xl border border-gray-200 bg-[#fafbfc] flex flex-col justify-between">
            <div>
              <span className="w-3 h-3 rounded-full bg-[#00282b] inline-block mb-2" />
              <label className="font-nav text-xs font-bold text-gray-700 uppercase block mb-1">
                Judul Box Eksternal
              </label>
              <input
                type="text"
                value={judulEksternal}
                onChange={e => setJudulEksternal(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-gray-200 font-nav text-xs font-bold mb-3 outline-none focus:border-[#01bcce]"
              />
              <label className="font-nav text-xs font-bold text-gray-700 uppercase block mb-1">
                Isi Keterangan Eksternal
              </label>
              <textarea
                rows={5}
                value={ketEksternal}
                onChange={e => setKetEksternal(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 font-nav text-xs outline-none focus:border-[#01bcce]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ================= CARD 3: CATATAN PENJELASAN PERBANDINGAN ================= */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-gray-100 mb-6">
          <div>
            <h2 className="font-nav font-bold text-gray-800 text-base sm:text-lg flex items-center gap-2">
              <FileText size={20} style={{ color: '#01bcce' }} />
              Catatan Penjelasan Khusus Tab Perbandingan Dokumen
            </h2>
            <p className="font-nav text-xs text-gray-500 mt-1">
              Catatan ini berlaku global di Tab Perbandingan Dokumen Tagihan (tampil di bawah tabel perbandingan).
            </p>
          </div>
          <button
            type="button"
            onClick={handleSavePerbandinganKet}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl text-xs font-nav font-bold text-white transition-all cursor-pointer flex items-center gap-2 shadow-sm hover:opacity-90 disabled:opacity-50 self-end sm:self-center flex-shrink-0"
            style={{ background: '#00282b' }}
          >
            <Save size={14} style={{ color: '#01bcce' }} />
            Simpan Catatan Perbandingan
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Perbandingan Internal */}
          <div className="p-4 rounded-xl border border-gray-200 bg-[#fafbfc]">
            <label className="font-nav text-xs font-bold text-gray-700 uppercase block mb-1">
              Catatan Text Box Tagihan Internal (Tab Perbandingan)
            </label>
            <textarea
              rows={4}
              value={ketPerbandinganInternal}
              onChange={e => setKetPerbandinganInternal(e.target.value)}
              placeholder="Masukkan penjelasan mengenai tren perbandingan dokumen internal..."
              className="w-full px-3 py-2 rounded-lg border border-gray-200 font-nav text-xs outline-none focus:border-[#01bcce]"
            />
          </div>

          {/* Perbandingan Eksternal */}
          <div className="p-4 rounded-xl border border-gray-200 bg-[#fafbfc]">
            <label className="font-nav text-xs font-bold text-gray-700 uppercase block mb-1">
              Catatan Text Box Tagihan Eksternal (Tab Perbandingan)
            </label>
            <textarea
              rows={4}
              value={ketPerbandinganEksternal}
              onChange={e => setKetPerbandinganEksternal(e.target.value)}
              placeholder="Masukkan penjelasan mengenai tren perbandingan dokumen eksternal..."
              className="w-full px-3 py-2 rounded-lg border border-gray-200 font-nav text-xs outline-none focus:border-[#01bcce]"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
