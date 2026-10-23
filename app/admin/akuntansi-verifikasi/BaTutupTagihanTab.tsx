'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import {
  Save,
  Calendar,
  Trash2,
  Edit3,
  Plus,
  CheckCircle2,
  FileText,
  ArrowRight,
  RotateCcw,
  AlertTriangle,
  ClipboardPaste,
  FileCheck,
  Check,
  X,
  Calculator,
} from 'lucide-react'
import { parseNumber } from '@/lib/neraca'

const NAMA_BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

export interface MonthBaEntry {
  bulan: string
  bulan_num: number
  total_penyedia: number
  belum_dikonfirmasi: number
  proses_penagihan: number
  proses_pembuatan_ba: number
  sudah_terbit_ba: number
  has_data?: boolean
}

function createEmptyBaMonths(): MonthBaEntry[] {
  return NAMA_BULAN.map((bulan, idx) => ({
    bulan,
    bulan_num: idx + 1,
    total_penyedia: 0,
    belum_dikonfirmasi: 0,
    proses_penagihan: 0,
    proses_pembuatan_ba: 0,
    sudah_terbit_ba: 0,
    has_data: false
  }))
}

interface Props {
  onMessage: (msg: { type: 'ok' | 'err'; text: string } | null) => void
}

export default function BaTutupTagihanTab({ onMessage }: Props) {
  const supabase = createClient()
  const currentYear = new Date().getFullYear()

  const [baSelectedYear, setBaSelectedYear] = useState<number>(currentYear)
  const [baAvailableYears, setBaAvailableYears] = useState<number[]>([currentYear])
  const [baNewYearInput, setBaNewYearInput] = useState('')
  const [baExistingRecordId, setBaExistingRecordId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Header Text
  const [baHeaderText, setBaHeaderText] = useState(
    'Layanan Berita Acara (BA) Tutup Tagihan memastikan seluruh proses penagihan dari penyedia/vendor telah terverifikasi, terkonfirmasi, dan diterbitkan dokumen BA resmi untuk penyelesaian administrasi keuangan.'
  )

  // Section 1: Jenis Tagihan
  const [baJudulJenisTagihan, setBaJudulJenisTagihan] = useState('Jenis Tagihan')
  const [baKetJenisTagihan, setBaKetJenisTagihan] = useState(
    'Rekapitulasi proporsi tagihan yang masuk ke RSCM berdasarkan klasifikasi dan kelompok kebutuhan belanja operasional, perbekalan farmasi, serta layanan medis.'
  )
  const [baJenisTagihanItems, setBaJenisTagihanItems] = useState<{ id: string; jenis: string; jumlah?: number; jumlah_penyedia?: number; sudah_terbit_ba?: number }[]>([])
  const [newJenisNama, setNewJenisNama] = useState('')
  const [newJenisJumlahPenyedia, setNewJenisJumlahPenyedia] = useState('')
  const [newJenisSudahTerbitBa, setNewJenisSudahTerbitBa] = useState('')
  const [editingJenisId, setEditingJenisId] = useState<string | null>(null)

  // Section 2: BA Tutup Tagihan (Status Penyedia)
  const [baJudulTabel, setBaJudulTabel] = useState('BA Tutup Tagihan Berdasarkan Proses')
  const [baKet, setBaKet] = useState(
    'Monitoring penyelesaian Berita Acara (BA) Tutup Tagihan bagi penyedia/vendor barang dan jasa di lingkungan RSUPN Dr. Cipto Mangunkusumo.'
  )
  const [baMonthsData, setBaMonthsData] = useState<MonthBaEntry[]>(createEmptyBaMonths())

  // Section 3: Nominal BA Tutup Tagihan (Status Transaksi)
  const [baJudulNominal, setBaJudulNominal] = useState('BA Tutup Tagihan Berdasarkan Nominal (Rp)')
  const [baKetNominal, setBaKetNominal] = useState(
    'Monitoring nominal penyelesaian Berita Acara (BA) Tutup Tagihan berdasarkan total nilai penagihan dari penyedia/vendor barang dan jasa di lingkungan RSUPN Dr. Cipto Mangunkusumo.'
  )
  const [baMonthsNominal, setBaMonthsNominal] = useState<MonthBaEntry[]>(createEmptyBaMonths())

  // Switcher Kategori: 'penyedia' | 'nominal'
  const [baCategory, setBaCategory] = useState<'penyedia' | 'nominal'>('penyedia')

  const getActiveBaTitle = (cat: 'penyedia' | 'nominal') => {
    return cat === 'nominal'
      ? (baJudulNominal || 'Nominal BA Tutup Tagihan (Rp)')
      : (baJudulTabel || 'BA Tutup Tagihan (Penyedia)')
  }

  // Active months array
  const activeMonths = baCategory === 'nominal' ? baMonthsNominal : baMonthsData

  // Fetch available years for BA
  const fetchAvailableBaYears = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('financial_reports_data')
        .select('year')
        .eq('category', 'verifikasi_ba_tutup_tagihan')

      if (error) {
        console.error('Error fetching available BA years:', error)
        return
      }

      const yearsFromDb = (data || []).map((d: any) => d.year)
      const combined = Array.from(new Set([currentYear, ...yearsFromDb])).sort((a, b) => b - a)
      setBaAvailableYears(combined)
    } catch (err) {
      console.error('Error in fetchAvailableBaYears:', err)
    }
  }, [supabase, currentYear])

  useEffect(() => {
    fetchAvailableBaYears()
  }, [fetchAvailableBaYears])

  // Load BA data for selected year
  const loadBaData = useCallback(async (year: number) => {
    try {
      const { data, error } = await supabase
        .from('financial_reports_data')
        .select('*')
        .eq('category', 'verifikasi_ba_tutup_tagihan')
        .eq('year', year)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching BA data:', error)
        return
      }

      if (data && data.data) {
        setBaExistingRecordId(data.id)
        if (data.data.header_text) setBaHeaderText(data.data.header_text)
        if (data.data.judul_jenis_tagihan) setBaJudulJenisTagihan(data.data.judul_jenis_tagihan)
        if (data.data.keterangan_jenis_tagihan) setBaKetJenisTagihan(data.data.keterangan_jenis_tagihan)
        if (Array.isArray(data.data.jenis_tagihan)) {
          setBaJenisTagihanItems(data.data.jenis_tagihan)
        } else {
          setBaJenisTagihanItems([])
        }

        if (data.data.judul_tabel) setBaJudulTabel(data.data.judul_tabel)
        if (data.data.keterangan) setBaKet(data.data.keterangan)
        if (data.data.judul_nominal) setBaJudulNominal(data.data.judul_nominal)
        if (data.data.keterangan_nominal) setBaKetNominal(data.data.keterangan_nominal)

        const parseMonths = (source: any[]) => {
          if (!Array.isArray(source) || source.length === 0) return createEmptyBaMonths()
          return createEmptyBaMonths().map(emptyM => {
            const found = source.find((m: any) => m.bulan === emptyM.bulan)
            if (found) {
              const tot = Number(found.total_penyedia || 0)
              const blm = Number(found.belum_dikonfirmasi || 0)
              const tag = Number(found.proses_penagihan || 0)
              const buat = Number(found.proses_pembuatan_ba || 0)
              const terbit = Number(found.sudah_terbit_ba || 0)
              const has = found.has_data ?? (tot > 0 || blm > 0 || tag > 0 || buat > 0 || terbit > 0)
              return {
                ...found,
                total_penyedia: tot,
                belum_dikonfirmasi: blm,
                proses_penagihan: tag,
                proses_pembuatan_ba: buat,
                sudah_terbit_ba: terbit,
                has_data: has
              }
            }
            return emptyM
          })
        }

        setBaMonthsData(parseMonths(data.data.months))
        setBaMonthsNominal(parseMonths(data.data.months_nominal))
        return
      }

      // Fallback empty
      setBaExistingRecordId(null)
      setBaMonthsData(createEmptyBaMonths())
      setBaMonthsNominal(createEmptyBaMonths())
      setBaJenisTagihanItems([])
    } catch (err: any) {
      console.error(err)
    }
  }, [supabase])

  useEffect(() => {
    loadBaData(baSelectedYear)
  }, [baSelectedYear, loadBaData])

  // Add new year
  const handleAddNewBaYear = () => {
    const val = parseInt(baNewYearInput.trim())
    if (!val || val < 2000 || val > 2100) {
      onMessage({ type: 'err', text: 'Tahun harus berupa 4 digit angka yang valid (2000-2100).' })
      return
    }
    if (!baAvailableYears.includes(val)) {
      const updated = [val, ...baAvailableYears].sort((a, b) => b - a)
      setBaAvailableYears(updated)
    }
    setBaSelectedYear(val)
    setBaNewYearInput('')
    onMessage({ type: 'ok', text: `Tahun ${val} aktif untuk BA Tutup Tagihan! Silakan isi tabel atau paste dari Excel.` })
  }

  // Delete current year
  const handleDeleteBaYear = async () => {
    if (!window.confirm(`Yakin ingin menghapus seluruh data BA Tutup Tagihan tahun ${baSelectedYear}?`)) {
      return
    }

    setLoading(true)
    onMessage(null)

    try {
      if (baExistingRecordId) {
        const { error } = await supabase
          .from('financial_reports_data')
          .delete()
          .eq('id', baExistingRecordId)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('financial_reports_data')
          .delete()
          .eq('category', 'verifikasi_ba_tutup_tagihan')
          .eq('year', baSelectedYear)
        if (error) throw error
      }

      onMessage({ type: 'ok', text: `Data BA Tutup Tagihan tahun ${baSelectedYear} berhasil dihapus!` })
      const filtered = baAvailableYears.filter(y => y !== baSelectedYear)
      const nextYears = filtered.length > 0 ? filtered : [currentYear]
      setBaAvailableYears(nextYears)
      setBaSelectedYear(nextYears[0])
    } catch (err: any) {
      onMessage({ type: 'err', text: 'Gagal menghapus tahun BA: ' + err.message })
    } finally {
      setLoading(false)
    }
  }

  // Reset all 12 months for active BA category
  const handleResetAllBaMonths = () => {
    const activeTitle = getActiveBaTitle(baCategory)
    if (!window.confirm(`Yakin ingin mengosongkan (reset ke 0) semua angka 12 bulan pada kategori ${activeTitle} (${baSelectedYear})?`)) {
      return
    }

    const empty = createEmptyBaMonths()
    if (baCategory === 'nominal') setBaMonthsNominal(empty)
    else setBaMonthsData(empty)

    onMessage({ type: 'ok', text: `Seluruh angka 12 bulan ${activeTitle} telah direset ke 0. Klik 'Simpan Data Tabel' untuk menyimpan.` })
  }

  // Reset single month
  const handleResetBaMonth = (bulan: string) => {
    const updater = (prev: MonthBaEntry[]) =>
      prev.map(m =>
        m.bulan === bulan
          ? {
              ...m,
              total_penyedia: 0,
              belum_dikonfirmasi: 0,
              proses_penagihan: 0,
              proses_pembuatan_ba: 0,
              sudah_terbit_ba: 0,
              has_data: false
            }
          : m
      )

    if (baCategory === 'nominal') setBaMonthsNominal(updater)
    else setBaMonthsData(updater)
  }

  // Auto calculate total for all 12 months
  const handleAutoCalcAllTotals = () => {
    const updater = (prev: MonthBaEntry[]) =>
      prev.map(m => {
        const sum = (m.belum_dikonfirmasi || 0) + (m.proses_penagihan || 0) + (m.proses_pembuatan_ba || 0) + (m.sudah_terbit_ba || 0)
        return {
          ...m,
          total_penyedia: sum,
          has_data: sum > 0
        }
      })

    if (baCategory === 'nominal') setBaMonthsNominal(updater)
    else setBaMonthsData(updater)

    onMessage({ type: 'ok', text: 'Total kolom berhasil dihitung otomatis (Belum + Penagihan + Pembuatan + Terbit).' })
  }

  // Handle cell change
  const handleCellChange = (
    rowIdx: number,
    fieldKey: 'total_penyedia' | 'belum_dikonfirmasi' | 'proses_penagihan' | 'proses_pembuatan_ba' | 'sudah_terbit_ba',
    rawVal: string
  ) => {
    const val = parseNumber(rawVal) ?? 0

    const updater = (prev: MonthBaEntry[]) => {
      return prev.map((m, i) => {
        if (i !== rowIdx) return m
        const updated = { ...m, [fieldKey]: val }
        updated.has_data = (
          (updated.total_penyedia || 0) > 0 ||
          (updated.belum_dikonfirmasi || 0) > 0 ||
          (updated.proses_penagihan || 0) > 0 ||
          (updated.proses_pembuatan_ba || 0) > 0 ||
          (updated.sudah_terbit_ba || 0) > 0
        )
        return updated
      })
    }

    if (baCategory === 'nominal') setBaMonthsNominal(updater)
    else setBaMonthsData(updater)
  }

  // Handle Excel paste
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>, startRow: number, startCol: number) => {
    const text = e.clipboardData.getData('text')
    if (!text.includes('\t') && !text.includes('\n')) return
    e.preventDefault()

    const lines = text.replace(/\r/g, '').split('\n').filter(line => line.trim().length > 0)
    if (lines.length === 0) return

    const matrix = lines.map(line => line.split('\t'))

    const updater = (prev: MonthBaEntry[]) => {
      const next = prev.map(m => ({ ...m }))

      matrix.forEach((cells, rOffset) => {
        const targetRow = startRow + rOffset
        if (targetRow >= next.length) return

        let vals = cells
        // If first column is month name, skip it
        if (startCol === 0 && vals.length > 1 && isNaN(Number(vals[0].trim().replace(/\./g, '').replace(/,/g, '')))) {
          vals = vals.slice(1)
        }

        vals.forEach((rawVal, cOffset) => {
          const targetCol = startCol + cOffset
          const num = parseNumber(rawVal) ?? 0
          if (targetCol === 0) next[targetRow].total_penyedia = num
          else if (targetCol === 1) next[targetRow].belum_dikonfirmasi = num
          else if (targetCol === 2) next[targetRow].proses_penagihan = num
          else if (targetCol === 3) next[targetRow].proses_pembuatan_ba = num
          else if (targetCol === 4) next[targetRow].sudah_terbit_ba = num
        })

        // If user pasted 4 columns starting at col 1 (Belum, Penagihan, Buat BA, Terbit BA), auto sum total if col 0 was not filled
        if (startCol === 1 && vals.length >= 4) {
          next[targetRow].total_penyedia = (
            (next[targetRow].belum_dikonfirmasi || 0) +
            (next[targetRow].proses_penagihan || 0) +
            (next[targetRow].proses_pembuatan_ba || 0) +
            (next[targetRow].sudah_terbit_ba || 0)
          )
        }

        next[targetRow].has_data = (
          (next[targetRow].total_penyedia || 0) > 0 ||
          (next[targetRow].belum_dikonfirmasi || 0) > 0 ||
          (next[targetRow].proses_penagihan || 0) > 0 ||
          (next[targetRow].proses_pembuatan_ba || 0) > 0 ||
          (next[targetRow].sudah_terbit_ba || 0) > 0
        )
      })

      return next
    }

    if (baCategory === 'nominal') setBaMonthsNominal(updater)
    else setBaMonthsData(updater)

    onMessage({ type: 'ok', text: `Data berhasil di-paste dari Excel ke tabel ${getActiveBaTitle(baCategory)}!` })
  }

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, row: number, col: number) => {
    const move = (dr: number) => {
      const nr = row + dr
      if (nr >= 0 && nr < 12) {
        const el = document.getElementById(`ba-cell-${nr}-${col}`) as HTMLInputElement | null
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

  // Save full BA Table
  const handleSaveTable = async () => {
    setLoading(true)
    onMessage(null)

    const payloadData = {
      tahun: baSelectedYear,
      header_text: baHeaderText.trim(),
      judul_jenis_tagihan: baJudulJenisTagihan.trim(),
      keterangan_jenis_tagihan: baKetJenisTagihan.trim(),
      jenis_tagihan: baJenisTagihanItems,
      judul_tabel: baJudulTabel.trim(),
      keterangan: baKet.trim(),
      months: baMonthsData,
      judul_nominal: baJudulNominal.trim(),
      keterangan_nominal: baKetNominal.trim(),
      months_nominal: baMonthsNominal,
    }

    try {
      if (baExistingRecordId) {
        const { error } = await supabase
          .from('financial_reports_data')
          .update({
            data: payloadData,
            year: baSelectedYear
          })
          .eq('id', baExistingRecordId)
        if (error) throw error
      } else {
        const { data: newRec, error } = await supabase
          .from('financial_reports_data')
          .insert({
            category: 'verifikasi_ba_tutup_tagihan',
            year: baSelectedYear,
            item_name: `rekap_ba_${baSelectedYear}`,
            data: payloadData
          })
          .select()
          .single()
        if (error) throw error
        if (newRec) setBaExistingRecordId(newRec.id)
      }

      await fetchAvailableBaYears()
      onMessage({ type: 'ok', text: `Seluruh data tabel BA Tutup Tagihan tahun ${baSelectedYear} berhasil disimpan ke database!` })
    } catch (err: any) {
      onMessage({ type: 'err', text: 'Gagal menyimpan tabel BA: ' + err.message })
    } finally {
      setLoading(false)
    }
  }

  // Save Text Box Settings
  const handleSaveBaTexts = async () => {
    setLoading(true)
    onMessage(null)

    const payloadData = {
      tahun: baSelectedYear,
      header_text: baHeaderText.trim(),
      judul_jenis_tagihan: baJudulJenisTagihan.trim(),
      keterangan_jenis_tagihan: baKetJenisTagihan.trim(),
      jenis_tagihan: baJenisTagihanItems,
      judul_tabel: baJudulTabel.trim(),
      keterangan: baKet.trim(),
      months: baMonthsData,
      judul_nominal: baJudulNominal.trim(),
      keterangan_nominal: baKetNominal.trim(),
      months_nominal: baMonthsNominal,
    }

    try {
      if (baExistingRecordId) {
        const { error } = await supabase
          .from('financial_reports_data')
          .update({ data: payloadData })
          .eq('id', baExistingRecordId)
        if (error) throw error
      } else {
        const { data: newRec, error } = await supabase
          .from('financial_reports_data')
          .insert({
            category: 'verifikasi_ba_tutup_tagihan',
            year: baSelectedYear,
            item_name: `rekap_ba_${baSelectedYear}`,
            data: payloadData
          })
          .select()
          .single()
        if (error) throw error
        if (newRec) setBaExistingRecordId(newRec.id)
      }
      await fetchAvailableBaYears()
      onMessage({ type: 'ok', text: `Judul dan catatan keterangan BA Tutup Tagihan tahun ${baSelectedYear} berhasil disimpan!` })
    } catch (err: any) {
      onMessage({ type: 'err', text: 'Gagal menyimpan teks BA: ' + err.message })
    } finally {
      setLoading(false)
    }
  }

  // Jenis Tagihan handlers
  const handleAddJenisTagihan = () => {
    if (!newJenisNama.trim()) {
      onMessage({ type: 'err', text: 'Nama jenis tagihan tidak boleh kosong.' })
      return
    }
    const jPenyedia = parseInt(newJenisJumlahPenyedia) || 0
    const jTerbit = parseInt(newJenisSudahTerbitBa) || 0

    const newItem = {
      id: `jt_${Date.now()}`,
      jenis: newJenisNama.trim(),
      jumlah: jPenyedia,
      jumlah_penyedia: jPenyedia,
      sudah_terbit_ba: jTerbit,
    }

    setBaJenisTagihanItems(prev => [...prev, newItem])
    setNewJenisNama('')
    setNewJenisJumlahPenyedia('')
    setNewJenisSudahTerbitBa('')
    onMessage({ type: 'ok', text: `Jenis tagihan "${newItem.jenis}" berhasil ditambahkan. Klik 'Simpan Daftar Jenis Tagihan' untuk menyimpan permanen.` })
  }

  const handleDeleteJenisTagihan = (id: string) => {
    setBaJenisTagihanItems(prev => prev.filter(it => it.id !== id))
    onMessage({ type: 'ok', text: 'Item jenis tagihan dihapus dari daftar sementara.' })
  }

  const handleUpdateJenisItem = (id: string, field: 'jenis' | 'jumlah_penyedia' | 'sudah_terbit_ba', val: any) => {
    setBaJenisTagihanItems(prev =>
      prev.map(it => {
        if (it.id !== id) return it
        if (field === 'jenis') return { ...it, jenis: String(val) }
        const num = parseNumber(val) ?? 0
        if (field === 'jumlah_penyedia') return { ...it, jumlah: num, jumlah_penyedia: num }
        return { ...it, sudah_terbit_ba: num }
      })
    )
  }

  return (
    <div className="space-y-6">
      {/* ================= SECTION 1: KELOLA JENIS TAGIHAN ================= */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-gray-100">
          <div>
            <h2 className="font-nav font-bold text-gray-800 text-lg flex items-center gap-2">
              <FileCheck size={20} className="text-[#01bcce]" />
              Section 1: Jenis Tagihan (Tahun {baSelectedYear})
            </h2>
            <p className="font-nav text-xs text-gray-500 mt-0.5">
              Kelola kategori/jenis tagihan yang masuk ke RSCM beserta jumlah penyedia dan dokumen yang sudah terbit BA.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSaveBaTexts}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl font-bold text-xs text-white flex items-center gap-2 transition-all shadow-sm hover:opacity-90 disabled:opacity-50 cursor-pointer self-end sm:self-center"
            style={{ background: '#00282b' }}
          >
            <Save size={15} style={{ color: '#01bcce' }} />
            Simpan Daftar Jenis Tagihan
          </button>
        </div>

        {/* Form Tambah Item */}
        <div className="bg-[#f8fafc] border border-gray-200 rounded-2xl p-4 sm:p-5 mb-5 font-nav">
          <span className="block text-xs font-black text-[#00282b] uppercase mb-3">
            + Tambah Kategori / Jenis Tagihan Baru:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Nama Jenis Tagihan:</label>
              <input
                type="text"
                placeholder="Contoh: Belanja Operasional, Farmasi..."
                value={newJenisNama}
                onChange={e => setNewJenisNama(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:border-[#01bcce]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Total Penyedia:</label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={newJenisJumlahPenyedia}
                onChange={e => setNewJenisJumlahPenyedia(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:border-[#01bcce]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Sudah Terbit BA:</label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={newJenisSudahTerbitBa}
                onChange={e => setNewJenisSudahTerbitBa(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:border-[#01bcce]"
              />
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={handleAddJenisTagihan}
              className="px-4 py-2 text-xs font-bold text-white rounded-xl flex items-center gap-1.5 transition-all shadow-sm hover:opacity-90 cursor-pointer"
              style={{ background: '#00282b' }}
            >
              <Plus size={14} className="text-[#d0db41]" /> Tambahkan ke Daftar
            </button>
          </div>
        </div>

        {/* Tabel Jenis Tagihan */}
        <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-xs bg-white">
          <table className="w-full text-left font-nav text-xs border-collapse">
            <thead style={{ background: '#008080' }}>
              <tr>
                <th style={{ padding: '10px 14px', textAlign: 'left', borderRight: '1px solid rgba(255,255,255,0.2)', color: '#fff', fontWeight: 800 }}>Jenis Tagihan</th>
                <th style={{ padding: '10px 14px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.2)', color: '#fff', fontWeight: 800 }}>Total Penyedia</th>
                <th style={{ padding: '10px 14px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.2)', color: '#d0db41', fontWeight: 800 }}>Sudah Terbit BA</th>
                <th style={{ padding: '10px 14px', textAlign: 'center', color: '#fff', fontWeight: 800, width: 80 }}>Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {baJenisTagihanItems.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-gray-400 font-bold">
                    Belum ada jenis tagihan yang ditambahkan untuk tahun {baSelectedYear}.
                  </td>
                </tr>
              ) : (
                baJenisTagihanItems.map(it => (
                  <tr key={it.id} className="hover:bg-[#f0faf9] transition-colors">
                    <td style={{ padding: '8px 12px', borderRight: '1px solid #eee' }}>
                      <input
                        type="text"
                        value={it.jenis}
                        onChange={e => handleUpdateJenisItem(it.id, 'jenis', e.target.value)}
                        className="w-full px-2 py-1 bg-transparent hover:bg-white focus:bg-white border border-transparent focus:border-[#01bcce] rounded font-bold text-gray-800 outline-none"
                      />
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'center', borderRight: '1px solid #eee' }}>
                      <input
                        type="text"
                        value={it.jumlah_penyedia ?? it.jumlah ?? 0}
                        onChange={e => handleUpdateJenisItem(it.id, 'jumlah_penyedia', e.target.value)}
                        onFocus={e => e.target.select()}
                        className="w-24 text-center px-2 py-1 bg-transparent hover:bg-white focus:bg-white border border-transparent focus:border-[#01bcce] rounded font-bold text-gray-800 outline-none"
                      />
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'center', borderRight: '1px solid #eee' }}>
                      <input
                        type="text"
                        value={it.sudah_terbit_ba ?? 0}
                        onChange={e => handleUpdateJenisItem(it.id, 'sudah_terbit_ba', e.target.value)}
                        onFocus={e => e.target.select()}
                        className="w-24 text-center px-2 py-1 bg-transparent hover:bg-white focus:bg-white border border-transparent focus:border-[#01bcce] rounded font-bold text-[#059669] outline-none"
                      />
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => handleDeleteJenisTagihan(it.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Hapus jenis tagihan ini"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= SECTION 2 & 3: SPREADSHEET TABEL BA TUTUP TAGIHAN (12 BULAN) ================= */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-sm border border-gray-100">
        {/* Header & Year Selector */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-5 pb-4 border-b border-gray-100">
          <div>
            <h2 className="font-nav font-bold text-gray-800 text-lg flex items-center gap-2">
              <ClipboardPaste size={20} className="text-[#01bcce]" />
              Input Tabel: {getActiveBaTitle(baCategory)} — Tahun {baSelectedYear}
            </h2>
            <p className="font-nav text-xs text-gray-500 mt-0.5">
              Input data langsung pada sel tabel atau <strong>copy-paste blok data langsung dari Excel (Ctrl+V)</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Year Selector */}
            <div className="flex items-center gap-2 bg-gray-50 px-3.5 py-1.5 rounded-xl border border-gray-200">
              <Calendar size={15} className="text-[#01bcce]" />
              <span className="font-nav text-xs font-bold text-gray-600">Tahun:</span>
              <select
                value={baSelectedYear}
                onChange={e => setBaSelectedYear(parseInt(e.target.value))}
                className="font-nav text-sm font-black text-[#00282b] bg-transparent outline-none cursor-pointer"
              >
                {baAvailableYears.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            {/* Add New Year */}
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                placeholder="Tahun..."
                value={baNewYearInput}
                onChange={e => setBaNewYearInput(e.target.value)}
                className="w-24 px-2.5 py-1.5 text-xs font-nav font-bold border border-gray-200 rounded-xl outline-none focus:border-[#01bcce]"
              />
              <button
                type="button"
                onClick={handleAddNewBaYear}
                className="px-3 py-1.5 text-xs font-nav font-bold text-white rounded-xl flex items-center gap-1 cursor-pointer transition-all hover:opacity-90"
                style={{ background: '#00282b' }}
              >
                <Plus size={13} /> Tambah
              </button>
            </div>

            {/* Status DB Badge */}
            {baExistingRecordId ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-green-50 text-green-700 border border-green-200">
                <CheckCircle2 size={12} /> Tersimpan di DB
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                <AlertTriangle size={12} /> Belum Ada Data
              </span>
            )}

            {/* Hapus Tahun Button */}
            {(baAvailableYears.length > 1 || baExistingRecordId) && (
              <button
                type="button"
                onClick={handleDeleteBaYear}
                disabled={loading}
                className="px-3 py-1.5 rounded-xl text-xs font-nav font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors cursor-pointer flex items-center gap-1.5"
                title={`Hapus seluruh data BA Tutup Tagihan tahun ${baSelectedYear}`}
              >
                <Trash2 size={13} /> Hapus Tahun {baSelectedYear}
              </button>
            )}
          </div>
        </div>

        {/* Kategori Switcher: Penyedia vs Nominal */}
        <div className="mb-5">
          <label className="block text-[11px] font-black uppercase tracking-wider text-gray-500 mb-2 font-nav">
            Pilih Kategori BA Tutup Tagihan yang Ingin Diedit / Diisi:
          </label>
          <div className="flex items-center gap-2 p-1.5 bg-[#f1f5f9] rounded-2xl border border-gray-200 overflow-x-auto">
            <button
              type="button"
              onClick={() => setBaCategory('penyedia')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-nav text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                baCategory === 'penyedia'
                  ? 'bg-[#00282b] text-[#d0db41] shadow-md shadow-[#00282b]/20 scale-[1.01]'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/70'
              }`}
            >
              <FileCheck size={16} className={baCategory === 'penyedia' ? 'text-[#01bcce]' : 'text-gray-400'} />
              <span>Section 2: BA Berdasarkan Proses ({baJudulTabel || 'Penyedia'})</span>
            </button>

            <button
              type="button"
              onClick={() => setBaCategory('nominal')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-nav text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                baCategory === 'nominal'
                  ? 'bg-[#00282b] text-[#d0db41] shadow-md shadow-[#00282b]/20 scale-[1.01]'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/70'
              }`}
            >
              <FileCheck size={16} className={baCategory === 'nominal' ? 'text-[#01bcce]' : 'text-gray-400'} />
              <span>Section 3: BA Berdasarkan Nominal ({baJudulNominal || 'Rupiah'})</span>
            </button>
          </div>
        </div>

        {/* Toolbar & Excel Tip Banner */}
        <div className="bg-[#f0faf9] border border-[#01bcce]/25 rounded-xl p-3.5 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-nav">
          <div className="flex items-center gap-2.5 text-xs text-[#004d53]">
            <ClipboardPaste size={18} className="text-[#01bcce] flex-shrink-0" />
            <span>
              <strong>Tips Excel:</strong> Anda dapat meng-copy 5 kolom (Total, Belum, Penagihan, Pembuatan, Terbit) atau 4 kolom rincian dari Excel lalu paste (Ctrl+V) langsung ke sel. Gunakan <strong>Up/Down / Enter</strong> untuk navigasi.
            </span>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0 flex-wrap">
            <button
              type="button"
              onClick={handleAutoCalcAllTotals}
              className="px-3 py-1.5 text-xs font-bold text-[#004d53] bg-cyan-50 hover:bg-cyan-100 border border-[#01bcce]/30 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              title="Hitung Total otomatis dari 4 kolom rincian"
            >
              <Calculator size={13} className="text-[#01bcce]" /> Hitung Total Otomatis
            </button>
            <button
              type="button"
              onClick={handleResetAllBaMonths}
              disabled={loading}
              className="px-3 py-1.5 text-xs font-bold text-gray-600 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              title="Reset 12 Bulan ke 0"
            >
              <RotateCcw size={13} /> Reset Kategori Ini (0)
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
          <table className="w-full text-left font-nav text-xs border-collapse min-w-[780px]">
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
                    width: 120
                  }}
                >
                  Periode
                </th>
                <th
                  style={{
                    padding: '12px 12px',
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
                  {baCategory === 'nominal' ? 'Total Nilai (Rp)' : 'Total Penyedia'}
                </th>
                <th
                  style={{
                    padding: '12px 12px',
                    textAlign: 'center',
                    borderRight: '1px solid rgba(255,255,255,0.2)',
                    borderBottom: '2px solid rgba(0,0,0,0.1)',
                    fontFamily: 'Nunito, sans-serif',
                    fontSize: 11,
                    fontWeight: 800,
                    color: '#fda4af',
                    textTransform: 'uppercase'
                  }}
                >
                  Belum Dikonfirmasi
                </th>
                <th
                  style={{
                    padding: '12px 12px',
                    textAlign: 'center',
                    borderRight: '1px solid rgba(255,255,255,0.2)',
                    borderBottom: '2px solid rgba(0,0,0,0.1)',
                    fontFamily: 'Nunito, sans-serif',
                    fontSize: 11,
                    fontWeight: 800,
                    color: '#fed7aa',
                    textTransform: 'uppercase'
                  }}
                >
                  Proses Penagihan
                </th>
                <th
                  style={{
                    padding: '12px 12px',
                    textAlign: 'center',
                    borderRight: '1px solid rgba(255,255,255,0.2)',
                    borderBottom: '2px solid rgba(0,0,0,0.1)',
                    fontFamily: 'Nunito, sans-serif',
                    fontSize: 11,
                    fontWeight: 800,
                    color: '#a5f3fc',
                    textTransform: 'uppercase'
                  }}
                >
                  Proses Pembuatan BA
                </th>
                <th
                  style={{
                    padding: '12px 12px',
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
                  Sudah Terbit BA
                </th>
                <th
                  style={{
                    padding: '12px 12px',
                    textAlign: 'center',
                    borderRight: '1px solid rgba(255,255,255,0.2)',
                    borderBottom: '2px solid rgba(0,0,0,0.1)',
                    fontFamily: 'Nunito, sans-serif',
                    fontSize: 11,
                    fontWeight: 800,
                    color: '#ffffff',
                    textTransform: 'uppercase',
                    width: 100
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
                const isFilled = m.has_data || m.total_penyedia > 0 || m.belum_dikonfirmasi > 0 || m.proses_penagihan > 0 || m.proses_pembuatan_ba > 0 || m.sudah_terbit_ba > 0

                return (
                  <tr key={m.bulan} className={`transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-[#fafbfc]'} hover:bg-[#f0faf9]`}>
                    {/* Bulan Name */}
                    <td style={{ padding: '8px 12px', textAlign: 'left', borderRight: '1px solid #e5e7eb', fontWeight: 800, color: '#00282b' }}>
                      {m.bulan}
                    </td>

                    {/* Total */}
                    <td style={{ padding: '4px', borderRight: '1px solid #e5e7eb' }}>
                      <input
                        id={`ba-cell-${idx}-0`}
                        type="text"
                        value={m.total_penyedia === 0 ? '0' : m.total_penyedia || ''}
                        onChange={e => handleCellChange(idx, 'total_penyedia', e.target.value)}
                        onPaste={e => handlePaste(e, idx, 0)}
                        onKeyDown={e => handleKeyDown(e, idx, 0)}
                        onFocus={e => e.target.select()}
                        className="w-full text-center font-nav text-xs font-black py-1.5 px-1 bg-[#eef9fa]/50 hover:bg-white focus:bg-white border border-transparent hover:border-gray-200 focus:border-[#01bcce] focus:ring-1 focus:ring-[#01bcce] rounded-lg outline-none transition-all text-[#00282b]"
                      />
                    </td>

                    {/* Belum Dikonfirmasi */}
                    <td style={{ padding: '4px', borderRight: '1px solid #e5e7eb' }}>
                      <input
                        id={`ba-cell-${idx}-1`}
                        type="text"
                        value={m.belum_dikonfirmasi === 0 ? '0' : m.belum_dikonfirmasi || ''}
                        onChange={e => handleCellChange(idx, 'belum_dikonfirmasi', e.target.value)}
                        onPaste={e => handlePaste(e, idx, 1)}
                        onKeyDown={e => handleKeyDown(e, idx, 1)}
                        onFocus={e => e.target.select()}
                        className="w-full text-center font-nav text-xs font-bold py-1.5 px-1 bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-gray-200 focus:border-[#01bcce] focus:ring-1 focus:ring-[#01bcce] rounded-lg outline-none transition-all text-[#f43f5e]"
                      />
                    </td>

                    {/* Proses Penagihan */}
                    <td style={{ padding: '4px', borderRight: '1px solid #e5e7eb' }}>
                      <input
                        id={`ba-cell-${idx}-2`}
                        type="text"
                        value={m.proses_penagihan === 0 ? '0' : m.proses_penagihan || ''}
                        onChange={e => handleCellChange(idx, 'proses_penagihan', e.target.value)}
                        onPaste={e => handlePaste(e, idx, 2)}
                        onKeyDown={e => handleKeyDown(e, idx, 2)}
                        onFocus={e => e.target.select()}
                        className="w-full text-center font-nav text-xs font-bold py-1.5 px-1 bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-gray-200 focus:border-[#01bcce] focus:ring-1 focus:ring-[#01bcce] rounded-lg outline-none transition-all text-[#d97706]"
                      />
                    </td>

                    {/* Proses Pembuatan BA */}
                    <td style={{ padding: '4px', borderRight: '1px solid #e5e7eb' }}>
                      <input
                        id={`ba-cell-${idx}-3`}
                        type="text"
                        value={m.proses_pembuatan_ba === 0 ? '0' : m.proses_pembuatan_ba || ''}
                        onChange={e => handleCellChange(idx, 'proses_pembuatan_ba', e.target.value)}
                        onPaste={e => handlePaste(e, idx, 3)}
                        onKeyDown={e => handleKeyDown(e, idx, 3)}
                        onFocus={e => e.target.select()}
                        className="w-full text-center font-nav text-xs font-bold py-1.5 px-1 bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-gray-200 focus:border-[#01bcce] focus:ring-1 focus:ring-[#01bcce] rounded-lg outline-none transition-all text-[#01bcce]"
                      />
                    </td>

                    {/* Sudah Terbit BA */}
                    <td style={{ padding: '4px', borderRight: '1px solid #e5e7eb' }}>
                      <input
                        id={`ba-cell-${idx}-4`}
                        type="text"
                        value={m.sudah_terbit_ba === 0 ? '0' : m.sudah_terbit_ba || ''}
                        onChange={e => handleCellChange(idx, 'sudah_terbit_ba', e.target.value)}
                        onPaste={e => handlePaste(e, idx, 4)}
                        onKeyDown={e => handleKeyDown(e, idx, 4)}
                        onFocus={e => e.target.select()}
                        className="w-full text-center font-nav text-xs font-black py-1.5 px-1 bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-gray-200 focus:border-[#01bcce] focus:ring-1 focus:ring-[#01bcce] rounded-lg outline-none transition-all text-[#059669]"
                      />
                    </td>

                    {/* Status */}
                    <td style={{ padding: '8px 10px', textAlign: 'center', borderRight: '1px solid #e5e7eb' }}>
                      {isFilled ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                          <CheckCircle2 size={10} /> Ada Data
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                          Kosong (0)
                        </span>
                      )}
                    </td>

                    {/* Action: Reset row */}
                    <td style={{ padding: '6px', textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => handleResetBaMonth(m.bulan)}
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
            {loading ? 'Menyimpan...' : `Simpan Seluruh Data Tabel BA (${baSelectedYear})`}
          </button>
        </div>
      </div>

      {/* ================= CARD 3: PENGATURAN TEKS CATATAN BA TUTUP TAGIHAN ================= */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
          <div>
            <h2 className="font-nav font-bold text-gray-800 text-lg flex items-center gap-2">
              <FileText size={20} style={{ color: '#01bcce' }} />
              Pengaturan Judul & Catatan Keterangan BA Tutup Tagihan ({baSelectedYear})
            </h2>
            <p className="font-nav text-xs text-gray-500 mt-0.5">
              Atur penjelasan header, judul tabel, dan kalimat keterangan yang muncul di bawah tabel halaman publik.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSaveBaTexts}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl font-bold text-xs text-white flex items-center gap-2 transition-all shadow-sm hover:opacity-90 disabled:opacity-50 cursor-pointer"
            style={{ background: '#00282b' }}
          >
            <Save size={15} style={{ color: '#01bcce' }} />
            Simpan Pengaturan Judul & Catatan
          </button>
        </div>

        <div className="space-y-6 font-nav">
          {/* Header Penjelasan Singkat */}
          <div className="p-4 rounded-2xl bg-[#f8fafc] border border-gray-200">
            <label className="block text-xs font-black uppercase text-gray-700 mb-1.5">
              Header Penjelasan Singkat BA Tutup Tagihan (Muncul di Box Paling Atas Halaman Publik)
            </label>
            <textarea
              rows={2}
              value={baHeaderText}
              onChange={e => setBaHeaderText(e.target.value)}
              className="w-full p-3 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-800 outline-none focus:border-[#01bcce] transition-colors resize-y"
              placeholder="Masukkan penjelasan singkat BA Tutup Tagihan..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Box 1: Jenis Tagihan */}
            <div className="p-4 rounded-2xl bg-[#fafbfc] border border-gray-200 flex flex-col gap-3">
              <label className="block text-xs font-black uppercase text-gray-700">
                Box 1: Jenis Tagihan
              </label>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Judul Box:</label>
                <input
                  type="text"
                  value={baJudulJenisTagihan}
                  onChange={e => setBaJudulJenisTagihan(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold outline-none focus:border-[#01bcce]"
                />
              </div>
              <div className="flex-1 flex flex-col">
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Catatan Keterangan:</label>
                <textarea
                  rows={4}
                  value={baKetJenisTagihan}
                  onChange={e => setBaKetJenisTagihan(e.target.value)}
                  className="w-full flex-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-[#01bcce] resize-y"
                />
              </div>
            </div>

            {/* Box 2: BA Proses (Penyedia) */}
            <div className="p-4 rounded-2xl bg-[#fafbfc] border border-gray-200 flex flex-col gap-3">
              <label className="block text-xs font-black uppercase text-gray-700">
                Box 2: BA Tutup Tagihan (Proses)
              </label>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Judul Box:</label>
                <input
                  type="text"
                  value={baJudulTabel}
                  onChange={e => setBaJudulTabel(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold outline-none focus:border-[#01bcce]"
                />
              </div>
              <div className="flex-1 flex flex-col">
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Catatan Keterangan:</label>
                <textarea
                  rows={4}
                  value={baKet}
                  onChange={e => setBaKet(e.target.value)}
                  className="w-full flex-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-[#01bcce] resize-y"
                />
              </div>
            </div>

            {/* Box 3: BA Nominal (Nilai) */}
            <div className="p-4 rounded-2xl bg-[#fafbfc] border border-gray-200 flex flex-col gap-3">
              <label className="block text-xs font-black uppercase text-gray-700">
                Box 3: BA Tutup Tagihan (Nominal)
              </label>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Judul Box:</label>
                <input
                  type="text"
                  value={baJudulNominal}
                  onChange={e => setBaJudulNominal(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold outline-none focus:border-[#01bcce]"
                />
              </div>
              <div className="flex-1 flex flex-col">
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Catatan Keterangan:</label>
                <textarea
                  rows={4}
                  value={baKetNominal}
                  onChange={e => setBaKetNominal(e.target.value)}
                  className="w-full flex-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-[#01bcce] resize-y"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
