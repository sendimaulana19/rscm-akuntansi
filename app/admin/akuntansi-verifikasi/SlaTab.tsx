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
  TrendingUp,
  FileDown,
  FileUp,
} from 'lucide-react'
import { parseNumber } from '@/lib/neraca'

const NAMA_BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

export interface MonthSlaEntry {
  bulan: string
  bulan_num: number
  internal: number
  eksternal: number
  keseluruhan: number
  has_data?: boolean
}

function createEmptySlaMonths(): MonthSlaEntry[] {
  return NAMA_BULAN.map((bulan, idx) => ({
    bulan,
    bulan_num: idx + 1,
    internal: 0,
    eksternal: 0,
    keseluruhan: 0,
    has_data: false
  }))
}

interface Props {
  onMessage: (msg: { type: 'ok' | 'err'; text: string } | null) => void
}

export default function SlaTab({ onMessage }: Props) {
  const supabase = createClient()
  const currentYear = new Date().getFullYear()

  const [slaSelectedYear, setSlaSelectedYear] = useState<number>(currentYear)
  const [slaAvailableYears, setSlaAvailableYears] = useState<number[]>([currentYear])
  const [slaNewYearInput, setSlaNewYearInput] = useState('')
  const [slaExistingRecordId, setSlaExistingRecordId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Active SLA Category: 'capaian' (Verifikasi) | 'pengambilan' | 'pengembalian'
  const [slaCategory, setSlaCategory] = useState<'capaian' | 'pengambilan' | 'pengembalian'>('capaian')

  // Header & Descriptions
  const [slaHeaderText, setSlaHeaderText] = useState(
    'Service Level Agreement (SLA) Verifikasi Dokumen Tagihan mengukur ketepatan waktu dan efektivitas proses verifikasi tagihan internal maupun eksternal sesuai standar layanan operasional RSCM.'
  )
  const [slaJudulInternal, setSlaJudulInternal] = useState('SLA Dokumen Internal')
  const [slaKetInternal, setSlaKetInternal] = useState(
    'Pencapaian Service Level Agreement (SLA) untuk dokumen tagihan internal mencakup kepatuhan terhadap standar waktu proses verifikasi, waktu pengambilan dokumen oleh unit kerja, dan waktu pengembalian berkas administrasi di lingkungan RSCM.'
  )
  const [slaJudulEksternal, setSlaJudulEksternal] = useState('SLA Dokumen Eksternal')
  const [slaKetEksternal, setSlaKetEksternal] = useState(
    'Pencapaian Service Level Agreement (SLA) untuk dokumen tagihan eksternal mencakup kepatuhan terhadap standar waktu proses verifikasi tagihan rekanan/vendor, waktu pengambilan dokumen, serta penyelesaian pengembalian dokumen administrasi penyedia pihak ketiga.'
  )

  // Category 1: SLA Verifikasi (DB key: months)
  const [slaJudulTabel, setSlaJudulTabel] = useState('SLA Verifikasi')
  const [slaKetCapaian, setSlaKetCapaian] = useState(
    'Capaian persentase SLA verifikasi dokumen tagihan mencerminkan kepatuhan terhadap standar waktu layanan verifikasi. Tingkat capaian yang konsisten mendukung kelancaran arus kas dan kepuasan mitra kerja sama.'
  )
  const [slaMonthsData, setSlaMonthsData] = useState<MonthSlaEntry[]>(createEmptySlaMonths())

  // Category 2: SLA Pengambilan (DB key: months_pengambilan)
  const [slaJudulPengambilan, setSlaJudulPengambilan] = useState('SLA Pengambilan')
  const [slaKetPengambilan, setSlaKetPengambilan] = useState(
    'Capaian persentase SLA pengambilan dokumen tagihan mengukur efektivitas waktu pengambilan berkas tagihan oleh unit pengusul atau vendor sesuai ketentuan operasional RSCM.'
  )
  const [slaMonthsPengambilan, setSlaMonthsPengambilan] = useState<MonthSlaEntry[]>(createEmptySlaMonths())

  // Category 3: SLA Pengembalian (DB key: months_pengembalian)
  const [slaJudulPengembalian, setSlaJudulPengembalian] = useState('SLA Pengembalian')
  const [slaKetPengembalian, setSlaKetPengembalian] = useState(
    'Capaian persentase SLA pengembalian dokumen tagihan mengukur ketepatan waktu pengembalian berkas tagihan yang belum lengkap atau memerlukan perbaikan ke unit terkait.'
  )
  const [slaMonthsPengembalian, setSlaMonthsPengembalian] = useState<MonthSlaEntry[]>(createEmptySlaMonths())

  const getActiveSlaTitle = (cat: 'capaian' | 'pengambilan' | 'pengembalian') => {
    if (cat === 'pengambilan') return slaJudulPengambilan || 'SLA Pengambilan'
    if (cat === 'pengembalian') return slaJudulPengembalian || 'SLA Pengembalian'
    return slaJudulTabel || 'SLA Verifikasi'
  }

  // Active months array based on active category
  const activeMonths = slaCategory === 'pengambilan'
    ? slaMonthsPengambilan
    : slaCategory === 'pengembalian'
    ? slaMonthsPengembalian
    : slaMonthsData

  // Fetch available years for SLA
  const fetchAvailableSlaYears = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('financial_reports_data')
        .select('year')
        .eq('category', 'verifikasi_sla')

      if (error) {
        console.error('Error fetching available SLA years:', error)
        return
      }

      const yearsFromDb = (data || []).map((d: any) => d.year)
      const combined = Array.from(new Set([currentYear, ...yearsFromDb])).sort((a, b) => b - a)
      setSlaAvailableYears(combined)
    } catch (err) {
      console.error('Error in fetchAvailableSlaYears:', err)
    }
  }, [supabase, currentYear])

  useEffect(() => {
    fetchAvailableSlaYears()
  }, [fetchAvailableSlaYears])

  // Load SLA data for selected year
  const loadSlaData = useCallback(async (year: number) => {
    try {
      const { data, error } = await supabase
        .from('financial_reports_data')
        .select('*')
        .eq('category', 'verifikasi_sla')
        .eq('year', year)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching SLA data:', error)
        return
      }

      if (data && data.data) {
        setSlaExistingRecordId(data.id)
        if (data.data.header_text) setSlaHeaderText(data.data.header_text)
        if (data.data.judul_text_internal) setSlaJudulInternal(data.data.judul_text_internal)
        if (data.data.keterangan_internal) setSlaKetInternal(data.data.keterangan_internal)
        if (data.data.judul_text_eksternal) setSlaJudulEksternal(data.data.judul_text_eksternal)
        if (data.data.keterangan_eksternal) setSlaKetEksternal(data.data.keterangan_eksternal)

        if (data.data.judul_tabel) setSlaJudulTabel(data.data.judul_tabel)
        if (data.data.keterangan_capaian) setSlaKetCapaian(data.data.keterangan_capaian)
        if (data.data.judul_pengambilan) setSlaJudulPengambilan(data.data.judul_pengambilan)
        if (data.data.keterangan_pengambilan) setSlaKetPengambilan(data.data.keterangan_pengambilan)
        if (data.data.judul_pengembalian) setSlaJudulPengembalian(data.data.judul_pengembalian)
        if (data.data.keterangan_pengembalian) setSlaKetPengembalian(data.data.keterangan_pengembalian)

        const parseMonths = (source: any[]) => {
          if (!Array.isArray(source) || source.length === 0) return createEmptySlaMonths()
          return createEmptySlaMonths().map(emptyM => {
            const found = source.find((m: any) => m.bulan === emptyM.bulan)
            if (found) {
              const intVal = Number(found.internal || 0)
              const eksVal = Number(found.eksternal || 0)
              const allVal = Number(found.keseluruhan || 0)
              const has = found.has_data ?? (intVal > 0 || eksVal > 0 || allVal > 0)
              return {
                ...found,
                internal: intVal,
                eksternal: eksVal,
                keseluruhan: allVal,
                has_data: has
              }
            }
            return emptyM
          })
        }

        setSlaMonthsData(parseMonths(data.data.months))
        setSlaMonthsPengambilan(parseMonths(data.data.months_pengambilan))
        setSlaMonthsPengembalian(parseMonths(data.data.months_pengembalian))
        return
      }

      // Fallback empty
      setSlaExistingRecordId(null)
      setSlaMonthsData(createEmptySlaMonths())
      setSlaMonthsPengambilan(createEmptySlaMonths())
      setSlaMonthsPengembalian(createEmptySlaMonths())
    } catch (err: any) {
      console.error(err)
    }
  }, [supabase])

  useEffect(() => {
    loadSlaData(slaSelectedYear)
  }, [slaSelectedYear, loadSlaData])

  // Add new year
  const handleAddNewSlaYear = () => {
    const val = parseInt(slaNewYearInput.trim())
    if (!val || val < 2000 || val > 2100) {
      onMessage({ type: 'err', text: 'Tahun harus berupa 4 digit angka yang valid (2000-2100).' })
      return
    }
    if (!slaAvailableYears.includes(val)) {
      const updated = [val, ...slaAvailableYears].sort((a, b) => b - a)
      setSlaAvailableYears(updated)
    }
    setSlaSelectedYear(val)
    setSlaNewYearInput('')
    onMessage({ type: 'ok', text: `Tahun ${val} aktif untuk SLA! Silakan isi tabel atau paste dari Excel.` })
  }

  // Delete current year
  const handleDeleteSlaYear = async () => {
    if (!window.confirm(`Yakin ingin menghapus seluruh data SLA tahun ${slaSelectedYear}?`)) {
      return
    }

    setLoading(true)
    onMessage(null)

    try {
      if (slaExistingRecordId) {
        const { error } = await supabase
          .from('financial_reports_data')
          .delete()
          .eq('id', slaExistingRecordId)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('financial_reports_data')
          .delete()
          .eq('category', 'verifikasi_sla')
          .eq('year', slaSelectedYear)
        if (error) throw error
      }

      onMessage({ type: 'ok', text: `Data SLA tahun ${slaSelectedYear} berhasil dihapus!` })
      const filtered = slaAvailableYears.filter(y => y !== slaSelectedYear)
      const nextYears = filtered.length > 0 ? filtered : [currentYear]
      setSlaAvailableYears(nextYears)
      setSlaSelectedYear(nextYears[0])
    } catch (err: any) {
      onMessage({ type: 'err', text: 'Gagal menghapus tahun SLA: ' + err.message })
    } finally {
      setLoading(false)
    }
  }

  // Reset all 12 months for active SLA category
  const handleResetAllSlaMonths = () => {
    const activeTitle = getActiveSlaTitle(slaCategory)
    if (!window.confirm(`Yakin ingin mengosongkan (reset ke 0) semua angka 12 bulan pada kategori ${activeTitle} (${slaSelectedYear})?`)) {
      return
    }

    const empty = createEmptySlaMonths()
    if (slaCategory === 'pengambilan') setSlaMonthsPengambilan(empty)
    else if (slaCategory === 'pengembalian') setSlaMonthsPengembalian(empty)
    else setSlaMonthsData(empty)

    onMessage({ type: 'ok', text: `Seluruh angka 12 bulan ${activeTitle} telah direset ke 0. Klik 'Simpan Data Tabel' untuk menyimpan.` })
  }

  // Reset single month
  const handleResetSlaMonth = (bulan: string) => {
    const updater = (prev: MonthSlaEntry[]) =>
      prev.map(m =>
        m.bulan === bulan
          ? { ...m, internal: 0, eksternal: 0, keseluruhan: 0, has_data: false }
          : m
      )

    if (slaCategory === 'pengambilan') setSlaMonthsPengambilan(updater)
    else if (slaCategory === 'pengembalian') setSlaMonthsPengembalian(updater)
    else setSlaMonthsData(updater)
  }

  // Handle direct cell change
  const handleCellChange = (rowIdx: number, fieldKey: 'internal' | 'eksternal' | 'keseluruhan', rawVal: string) => {
    const val = parseNumber(rawVal) ?? 0

    const updater = (prev: MonthSlaEntry[]) => {
      return prev.map((m, i) => {
        if (i !== rowIdx) return m
        const updated = { ...m, [fieldKey]: val }
        updated.has_data = (updated.internal > 0 || updated.eksternal > 0 || updated.keseluruhan > 0)
        return updated
      })
    }

    if (slaCategory === 'pengambilan') setSlaMonthsPengambilan(updater)
    else if (slaCategory === 'pengembalian') setSlaMonthsPengembalian(updater)
    else setSlaMonthsData(updater)
  }

  // Handle Excel paste
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>, startRow: number, startCol: number) => {
    const text = e.clipboardData.getData('text')
    if (!text.includes('\t') && !text.includes('\n')) return
    e.preventDefault()

    const lines = text.replace(/\r/g, '').split('\n').filter(line => line.trim().length > 0)
    if (lines.length === 0) return

    const matrix = lines.map(line => line.split('\t'))

    const updater = (prev: MonthSlaEntry[]) => {
      const next = prev.map(m => ({ ...m }))

      matrix.forEach((cells, rOffset) => {
        const targetRow = startRow + rOffset
        if (targetRow >= next.length) return

        let vals = cells
        // If first column is month name, skip it
        if (startCol === 0 && vals.length > 1 && isNaN(Number(vals[0].trim().replace(/%/g, '').replace(/\./g, '').replace(/,/g, '')))) {
          vals = vals.slice(1)
        }

        vals.forEach((rawVal, cOffset) => {
          const targetCol = startCol + cOffset
          const num = parseNumber(rawVal) ?? 0
          if (targetCol === 0) next[targetRow].internal = num
          else if (targetCol === 1) next[targetRow].eksternal = num
          else if (targetCol === 2) next[targetRow].keseluruhan = num
        })

        // If only internal and eksternal were pasted (length 2) and col 2 wasn't supplied:
        if (vals.length === 2 && startCol === 0) {
          const intVal = next[targetRow].internal
          const eksVal = next[targetRow].eksternal
          if (intVal > 0 && eksVal > 0) next[targetRow].keseluruhan = Number(((intVal + eksVal) / 2).toFixed(1))
          else if (intVal > 0) next[targetRow].keseluruhan = intVal
          else if (eksVal > 0) next[targetRow].keseluruhan = eksVal
        }

        next[targetRow].has_data = (
          next[targetRow].internal > 0 ||
          next[targetRow].eksternal > 0 ||
          next[targetRow].keseluruhan > 0
        )
      })

      return next
    }

    if (slaCategory === 'pengambilan') setSlaMonthsPengambilan(updater)
    else if (slaCategory === 'pengembalian') setSlaMonthsPengembalian(updater)
    else setSlaMonthsData(updater)

    onMessage({ type: 'ok', text: `Data berhasil di-paste dari Excel ke tabel ${getActiveSlaTitle(slaCategory)}!` })
  }

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, row: number, col: number) => {
    const move = (dr: number) => {
      const nr = row + dr
      if (nr >= 0 && nr < 12) {
        const el = document.getElementById(`sla-cell-${nr}-${col}`) as HTMLInputElement | null
        if (el) {
          e.preventDefault()
          el.focus()
          el.select()
        }
      }
    }

    if (e.key === 'Enter' || e.key === 'ArrowDown') move(1)
    else if (e.key === 'ArrowUp') move(-1)
  }

  // Save SLA Table
  const handleSaveTable = async () => {
    setLoading(true)
    onMessage(null)

    const payloadData = {
      tahun: slaSelectedYear,
      header_text: slaHeaderText.trim(),
      judul_text_internal: slaJudulInternal.trim(),
      keterangan_internal: slaKetInternal.trim(),
      judul_text_eksternal: slaJudulEksternal.trim(),
      keterangan_eksternal: slaKetEksternal.trim(),
      judul_tabel: slaJudulTabel.trim(),
      keterangan_capaian: slaKetCapaian.trim(),
      judul_pengambilan: slaJudulPengambilan.trim(),
      keterangan_pengambilan: slaKetPengambilan.trim(),
      judul_pengembalian: slaJudulPengembalian.trim(),
      keterangan_pengembalian: slaKetPengembalian.trim(),
      months: slaMonthsData,
      months_pengambilan: slaMonthsPengambilan,
      months_pengembalian: slaMonthsPengembalian,
    }

    try {
      if (slaExistingRecordId) {
        const { error } = await supabase
          .from('financial_reports_data')
          .update({
            data: payloadData,
            year: slaSelectedYear
          })
          .eq('id', slaExistingRecordId)
        if (error) throw error
      } else {
        const { data: newRec, error } = await supabase
          .from('financial_reports_data')
          .insert({
            category: 'verifikasi_sla',
            year: slaSelectedYear,
            item_name: `rekap_sla_${slaSelectedYear}`,
            data: payloadData
          })
          .select()
          .single()
        if (error) throw error
        if (newRec) setSlaExistingRecordId(newRec.id)
      }

      await fetchAvailableSlaYears()
      onMessage({ type: 'ok', text: `Seluruh data tabel SLA tahun ${slaSelectedYear} berhasil disimpan ke database!` })
    } catch (err: any) {
      onMessage({ type: 'err', text: 'Gagal menyimpan tabel SLA: ' + err.message })
    } finally {
      setLoading(false)
    }
  }

  // Save Text Box SLA
  const handleSaveSlaTexts = async () => {
    setLoading(true)
    onMessage(null)

    const payloadData = {
      tahun: slaSelectedYear,
      header_text: slaHeaderText.trim(),
      judul_text_internal: slaJudulInternal.trim(),
      keterangan_internal: slaKetInternal.trim(),
      judul_text_eksternal: slaJudulEksternal.trim(),
      keterangan_eksternal: slaKetEksternal.trim(),
      judul_tabel: slaJudulTabel.trim(),
      keterangan_capaian: slaKetCapaian.trim(),
      judul_pengambilan: slaJudulPengambilan.trim(),
      keterangan_pengambilan: slaKetPengambilan.trim(),
      judul_pengembalian: slaJudulPengembalian.trim(),
      keterangan_pengembalian: slaKetPengembalian.trim(),
      months: slaMonthsData,
      months_pengambilan: slaMonthsPengambilan,
      months_pengembalian: slaMonthsPengembalian,
    }

    try {
      if (slaExistingRecordId) {
        const { error } = await supabase
          .from('financial_reports_data')
          .update({ data: payloadData })
          .eq('id', slaExistingRecordId)
        if (error) throw error
      } else {
        const { data: newRec, error } = await supabase
          .from('financial_reports_data')
          .insert({
            category: 'verifikasi_sla',
            year: slaSelectedYear,
            item_name: `rekap_sla_${slaSelectedYear}`,
            data: payloadData
          })
          .select()
          .single()
        if (error) throw error
        if (newRec) setSlaExistingRecordId(newRec.id)
      }
      await fetchAvailableSlaYears()
      onMessage({ type: 'ok', text: `Judul dan catatan keterangan SLA tahun ${slaSelectedYear} berhasil disimpan!` })
    } catch (err: any) {
      onMessage({ type: 'err', text: 'Gagal menyimpan teks SLA: ' + err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* ================= CARD 1: SPREADSHEET TABEL SLA (12 BULAN) ================= */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-sm border border-gray-100">
        {/* Header & Year Selector */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-5 pb-4 border-b border-gray-100">
          <div>
            <h2 className="font-nav font-bold text-gray-800 text-lg flex items-center gap-2">
              <ClipboardPaste size={20} className="text-[#01bcce]" />
              Input Tabel SLA: {getActiveSlaTitle(slaCategory)} (%) — Tahun {slaSelectedYear}
            </h2>
            <p className="font-nav text-xs text-gray-500 mt-0.5">
              Input persentase langsung pada sel tabel atau <strong>copy-paste blok data langsung dari Excel (Ctrl+V)</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Year Selector */}
            <div className="flex items-center gap-2 bg-gray-50 px-3.5 py-1.5 rounded-xl border border-gray-200">
              <Calendar size={15} className="text-[#01bcce]" />
              <span className="font-nav text-xs font-bold text-gray-600">Tahun:</span>
              <select
                value={slaSelectedYear}
                onChange={e => setSlaSelectedYear(parseInt(e.target.value))}
                className="font-nav text-sm font-black text-[#00282b] bg-transparent outline-none cursor-pointer"
              >
                {slaAvailableYears.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            {/* Add New Year */}
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                placeholder="Tahun..."
                value={slaNewYearInput}
                onChange={e => setSlaNewYearInput(e.target.value)}
                className="w-24 px-2.5 py-1.5 text-xs font-nav font-bold border border-gray-200 rounded-xl outline-none focus:border-[#01bcce]"
              />
              <button
                type="button"
                onClick={handleAddNewSlaYear}
                className="px-3 py-1.5 text-xs font-nav font-bold text-white rounded-xl flex items-center gap-1 cursor-pointer transition-all hover:opacity-90"
                style={{ background: '#00282b' }}
              >
                <Plus size={13} /> Tambah
              </button>
            </div>

            {/* Status DB Badge */}
            {slaExistingRecordId ? (
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

        {/* Kategori Switcher: Capaian, Pengambilan, Pengembalian */}
        <div className="mb-5">
          <label className="block text-[11px] font-black uppercase tracking-wider text-gray-500 mb-2 font-nav">
            Pilih Kategori SLA yang Ingin Diedit / Diisi:
          </label>
          <div className="flex items-center gap-2 p-1.5 bg-[#f1f5f9] rounded-2xl border border-gray-200 overflow-x-auto">
            {[
              { id: 'capaian', label: '1. SLA Verifikasi', icon: TrendingUp },
              { id: 'pengambilan', label: '2. SLA Pengambilan Dokumen', icon: FileDown },
              { id: 'pengembalian', label: '3. SLA Pengembalian Dokumen', icon: FileUp },
            ].map(cat => {
              const Icon = cat.icon
              const isActive = slaCategory === cat.id
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSlaCategory(cat.id as 'capaian' | 'pengambilan' | 'pengembalian')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-nav text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-[#00282b] text-[#d0db41] shadow-md shadow-[#00282b]/20 scale-[1.01]'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/70'
                  }`}
                >
                  <Icon size={15} className={isActive ? 'text-[#01bcce]' : 'text-gray-400'} />
                  <span>{cat.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Toolbar & Excel Tip Banner */}
        <div className="bg-[#f0faf9] border border-[#01bcce]/25 rounded-xl p-3.5 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-nav">
          <div className="flex items-center gap-2.5 text-xs text-[#004d53]">
            <ClipboardPaste size={18} className="text-[#01bcce] flex-shrink-0" />
            <span>
              <strong>Tips Excel:</strong> Anda dapat meng-copy 2 atau 3 kolom persentase dari Excel lalu paste (Ctrl+V) langsung ke sel. Gunakan tombol panah <strong>Up / Down</strong> atau <strong>Enter</strong> untuk navigasi.
            </span>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
            <button
              type="button"
              onClick={handleResetAllSlaMonths}
              disabled={loading}
              className="px-3 py-1.5 text-xs font-bold text-gray-600 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              title="Reset 12 Bulan ke 0"
            >
              <RotateCcw size={13} /> Reset Kategori Ini (0%)
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
          <table className="w-full text-left font-nav text-xs border-collapse min-w-[700px]">
            <thead style={{ background: '#008080' }}>
              <tr>
                <th
                  style={{
                    padding: '12px 14px',
                    textAlign: 'center',
                    borderRight: '1px solid rgba(255,255,255,0.2)',
                    borderBottom: '2px solid rgba(0,0,0,0.1)',
                    fontFamily: 'Nunito, sans-serif',
                    fontSize: 11,
                    fontWeight: 800,
                    color: '#ffffff',
                    textTransform: 'uppercase',
                    width: 130
                  }}
                >
                  Bulan
                </th>
                <th
                  style={{
                    padding: '12px 14px',
                    textAlign: 'center',
                    borderRight: '1px solid rgba(255,255,255,0.2)',
                    borderBottom: '2px solid rgba(0,0,0,0.1)',
                    fontFamily: 'Nunito, sans-serif',
                    fontSize: 11,
                    fontWeight: 800,
                    color: '#ffffff',
                    textTransform: 'uppercase'
                  }}
                >
                  Internal (%)
                </th>
                <th
                  style={{
                    padding: '12px 14px',
                    textAlign: 'center',
                    borderRight: '1px solid rgba(255,255,255,0.2)',
                    borderBottom: '2px solid rgba(0,0,0,0.1)',
                    fontFamily: 'Nunito, sans-serif',
                    fontSize: 11,
                    fontWeight: 800,
                    color: '#ffffff',
                    textTransform: 'uppercase'
                  }}
                >
                  Eksternal (%)
                </th>
                <th
                  style={{
                    padding: '12px 14px',
                    textAlign: 'center',
                    borderRight: '1px solid rgba(255,255,255,0.2)',
                    borderBottom: '2px solid rgba(0,0,0,0.1)',
                    fontFamily: 'Nunito, sans-serif',
                    fontSize: 11,
                    fontWeight: 800,
                    color: '#d0db41',
                    textTransform: 'uppercase'
                  }}
                >
                  Keseluruhan (%)
                </th>
                <th
                  style={{
                    padding: '12px 14px',
                    textAlign: 'center',
                    borderRight: '1px solid rgba(255,255,255,0.2)',
                    borderBottom: '2px solid rgba(0,0,0,0.1)',
                    fontFamily: 'Nunito, sans-serif',
                    fontSize: 11,
                    fontWeight: 800,
                    color: '#ffffff',
                    textTransform: 'uppercase',
                    width: 110
                  }}
                >
                  Status
                </th>
                <th
                  style={{
                    padding: '12px 10px',
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
            </thead>
            <tbody className="divide-y divide-gray-100">
              {activeMonths.map((m, idx) => {
                const isFilled = m.has_data || m.internal > 0 || m.eksternal > 0 || m.keseluruhan > 0

                return (
                  <tr key={m.bulan} className={`transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-[#fafbfc]'} hover:bg-[#f0faf9]`}>
                    {/* Bulan Name */}
                    <td style={{ padding: '8px 14px', textAlign: 'left', borderRight: '1px solid #e5e7eb', fontWeight: 800, color: '#00282b' }}>
                      {m.bulan}
                    </td>

                    {/* Internal (%) */}
                    <td style={{ padding: '4px', borderRight: '1px solid #e5e7eb' }}>
                      <input
                        id={`sla-cell-${idx}-0`}
                        type="text"
                        value={m.internal === 0 ? '0' : m.internal || ''}
                        onChange={e => handleCellChange(idx, 'internal', e.target.value)}
                        onPaste={e => handlePaste(e, idx, 0)}
                        onKeyDown={e => handleKeyDown(e, idx, 0)}
                        onFocus={e => e.target.select()}
                        className="w-full text-center font-nav text-xs font-bold py-1.5 px-1 bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-gray-200 focus:border-[#01bcce] focus:ring-1 focus:ring-[#01bcce] rounded-lg outline-none transition-all text-[#01bcce]"
                      />
                    </td>

                    {/* Eksternal (%) */}
                    <td style={{ padding: '4px', borderRight: '1px solid #e5e7eb' }}>
                      <input
                        id={`sla-cell-${idx}-1`}
                        type="text"
                        value={m.eksternal === 0 ? '0' : m.eksternal || ''}
                        onChange={e => handleCellChange(idx, 'eksternal', e.target.value)}
                        onPaste={e => handlePaste(e, idx, 1)}
                        onKeyDown={e => handleKeyDown(e, idx, 1)}
                        onFocus={e => e.target.select()}
                        className="w-full text-center font-nav text-xs font-bold py-1.5 px-1 bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-gray-200 focus:border-[#01bcce] focus:ring-1 focus:ring-[#01bcce] rounded-lg outline-none transition-all text-gray-800"
                      />
                    </td>

                    {/* Keseluruhan (%) */}
                    <td style={{ padding: '4px', borderRight: '1px solid #e5e7eb' }}>
                      <input
                        id={`sla-cell-${idx}-2`}
                        type="text"
                        value={m.keseluruhan === 0 ? '0' : m.keseluruhan || ''}
                        onChange={e => handleCellChange(idx, 'keseluruhan', e.target.value)}
                        onPaste={e => handlePaste(e, idx, 2)}
                        onKeyDown={e => handleKeyDown(e, idx, 2)}
                        onFocus={e => e.target.select()}
                        className="w-full text-center font-nav text-xs font-black py-1.5 px-1 bg-[#eef9fa]/50 hover:bg-white focus:bg-white border border-transparent hover:border-gray-200 focus:border-[#01bcce] focus:ring-1 focus:ring-[#01bcce] rounded-lg outline-none transition-all text-[#00282b]"
                      />
                    </td>

                    {/* Status Badge */}
                    <td style={{ padding: '8px 10px', textAlign: 'center', borderRight: '1px solid #e5e7eb' }}>
                      {isFilled ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                          <CheckCircle2 size={10} /> Ada Data
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                          Kosong (0%)
                        </span>
                      )}
                    </td>

                    {/* Action: Reset row */}
                    <td style={{ padding: '6px', textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => handleResetSlaMonth(m.bulan)}
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
            {loading ? 'Menyimpan...' : `Simpan Seluruh Data Tabel SLA (${slaSelectedYear})`}
          </button>
        </div>
      </div>

      {/* ================= CARD 2: PENGATURAN TEKS CATATAN & JUDUL KATEGORI SLA ================= */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
          <div>
            <h2 className="font-nav font-bold text-gray-800 text-lg flex items-center gap-2">
              <FileText size={20} style={{ color: '#01bcce' }} />
              Pengaturan Judul Kategori & Catatan SLA Tahun {slaSelectedYear}
            </h2>
            <p className="font-nav text-xs text-gray-500 mt-0.5">
              Atur teks penjelasan header serta judul section/kategori dan isi catatan keterangan masing-masing kategori SLA.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSaveSlaTexts}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl font-bold text-xs text-white flex items-center gap-2 transition-all shadow-sm hover:opacity-90 disabled:opacity-50 cursor-pointer"
            style={{ background: '#00282b' }}
          >
            <Save size={15} style={{ color: '#01bcce' }} />
            Simpan Judul & Catatan SLA
          </button>
        </div>

        <div className="space-y-6 font-nav">
          {/* Header Penjelasan Singkat */}
          <div className="p-4 rounded-2xl bg-[#f8fafc] border border-gray-200">
            <label className="block text-xs font-black uppercase text-gray-700 mb-1.5">
              Header Penjelasan Singkat SLA (Muncul di Box Paling Atas Halaman Publik)
            </label>
            <textarea
              rows={2}
              value={slaHeaderText}
              onChange={(e) => setSlaHeaderText(e.target.value)}
              className="w-full p-3 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-800 outline-none focus:border-[#01bcce] transition-colors resize-y"
              placeholder="Masukkan penjelasan singkat SLA..."
            />
          </div>

          {/* Section 1 & 2: SLA Dokumen Internal & Eksternal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Section 1: Internal */}
            <div className="p-4 rounded-2xl bg-[#eef9fa]/50 border border-[#01bcce]/30 flex flex-col gap-3">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                <span className="w-3 h-3 rounded-full bg-[#01bcce]" />
                <span className="font-nav font-bold text-xs text-[#00282b] uppercase tracking-wider">
                  Section 1: SLA Dokumen Internal
                </span>
              </div>
              <div>
                <label className="font-nav text-[11px] font-bold text-gray-500 uppercase block mb-1">
                  Judul Section 1:
                </label>
                <input
                  type="text"
                  value={slaJudulInternal}
                  onChange={(e) => setSlaJudulInternal(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:border-[#01bcce] transition-colors"
                  placeholder="SLA Dokumen Internal"
                />
              </div>
              <div className="flex-1 flex flex-col">
                <label className="font-nav text-[11px] font-bold text-gray-500 uppercase block mb-1">
                  Catatan Keterangan Section 1 (Internal):
                </label>
                <textarea
                  rows={5}
                  value={slaKetInternal}
                  onChange={(e) => setSlaKetInternal(e.target.value)}
                  className="w-full flex-1 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-700 outline-none focus:border-[#01bcce] transition-colors resize-y leading-relaxed"
                  placeholder="Masukkan catatan SLA dokumen internal..."
                />
              </div>
            </div>

            {/* Section 2: Eksternal */}
            <div className="p-4 rounded-2xl bg-[#fbfcfa] border border-[#268484]/30 flex flex-col gap-3">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                <span className="w-3 h-3 rounded-full bg-[#268484]" />
                <span className="font-nav font-bold text-xs text-[#00282b] uppercase tracking-wider">
                  Section 2: SLA Dokumen Eksternal
                </span>
              </div>
              <div>
                <label className="font-nav text-[11px] font-bold text-gray-500 uppercase block mb-1">
                  Judul Section 2:
                </label>
                <input
                  type="text"
                  value={slaJudulEksternal}
                  onChange={(e) => setSlaJudulEksternal(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:border-[#268484] transition-colors"
                  placeholder="SLA Dokumen Eksternal"
                />
              </div>
              <div className="flex-1 flex flex-col">
                <label className="font-nav text-[11px] font-bold text-gray-500 uppercase block mb-1">
                  Catatan Keterangan Section 2 (Eksternal):
                </label>
                <textarea
                  rows={5}
                  value={slaKetEksternal}
                  onChange={(e) => setSlaKetEksternal(e.target.value)}
                  className="w-full flex-1 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-700 outline-none focus:border-[#268484] transition-colors resize-y leading-relaxed"
                  placeholder="Masukkan catatan SLA dokumen eksternal..."
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
