'use client'
import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { FileCheck, Clock, FileText, Info, Filter, Sparkles, RotateCcw, ChevronDown, Check, X, Search, Calendar, ArrowRightLeft, BarChart3, TrendingUp, FileDown, FileUp } from 'lucide-react'
import { VerifikasiPieChart, VerifikasiLineChart, VerifikasiBarChart, VerifikasiColumnComparisonChart, VerifikasiHorizontalBarComparisonChart, SlaLineChart, SlaSectionLineChart, SlaPieChart, BaTutupTagihanLineChart, BaTutupTagihanPieChart, JenisTagihanPieChart, BaJenisTagihanColumnChart, BaProgressLineChart, JenisTagihanItem, JENIS_TAGIHAN_PALETTE, formatPeriodeLabel, formatBulanDanTahun } from './VerifikasiCharts'

const NAMA_BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

const BULAN_SINGKAT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'
]

const BULAN_TABEL_SLA = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
]

export interface MonthData {
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

export interface YearVerificationData {
  tahun: number
  header_text?: string
  judul_text_keseluruhan?: string
  keterangan_keseluruhan?: string
  judul_text_internal?: string
  keterangan_internal?: string
  judul_text_eksternal?: string
  keterangan_eksternal?: string
  months: MonthData[]
}

export interface MonthSlaData {
  bulan: string
  bulan_num: number
  internal: number
  eksternal: number
  keseluruhan: number
  has_data?: boolean
}

export interface YearSlaData {
  tahun: number
  header_text?: string
  judul_internal?: string
  keterangan_internal?: string
  judul_eksternal?: string
  keterangan_eksternal?: string
  judul_tabel?: string
  keterangan_capaian?: string
  months: MonthSlaData[]
  judul_pengambilan?: string
  keterangan_pengambilan?: string
  months_pengambilan?: MonthSlaData[]
  judul_pengembalian?: string
  keterangan_pengembalian?: string
  months_pengembalian?: MonthSlaData[]
}

export interface MonthBaTutupTagihanData {
  bulan: string
  bulan_num: number
  total_penyedia: number
  belum_dikonfirmasi: number
  proses_penagihan: number
  proses_pembuatan_ba: number
  sudah_terbit_ba: number
  has_data?: boolean
}

export interface YearBaTutupTagihanData {
  tahun: number
  header_text?: string
  judul_jenis_tagihan?: string
  jenis_tagihan_items?: JenisTagihanItem[]
  keterangan_jenis_tagihan?: string
  judul_tabel?: string
  keterangan?: string
  months: MonthBaTutupTagihanData[]
  judul_nominal?: string
  keterangan_nominal?: string
  months_nominal?: MonthBaTutupTagihanData[]
}

const defaultJenisTagihanItems: JenisTagihanItem[] = []

const defaultBaHeader = 'Berita Acara (BA) Tutup Tagihan memantau rekapitulasi proses penyelesaian administrasi dan penerbitan BA tagihan penyedia di RSUPN Dr. Cipto Mangunkusumo.'
const defaultJudulJenisTagihan = 'Jenis Tagihan'
const defaultKetJenisTagihan = 'Rekapitulasi proporsi tagihan yang masuk ke RSCM berdasarkan klasifikasi dan kelompok kebutuhan belanja operasional, perbekalan farmasi, serta layanan medis.'
const defaultBaJudul = 'BA Tutup Tagihan Berdasarkan Proses'
const defaultBaKet = 'Rekapitulasi status BA Tutup Tagihan mencakup pemantauan konfirmasi penyedia, tahapan penagihan, proses penerbitan Berita Acara, hingga realisasi penerbitan BA untuk memastikan ketertiban administrasi keuangan RSCM.'
const defaultJudulNominal = 'BA Tutup Tagihan Berdasarkan Nominal (Rp)'
const defaultKetNominal = 'Monitoring nominal penyelesaian Berita Acara (BA) Tutup Tagihan berdasarkan total nilai penagihan dari penyedia/vendor barang dan jasa di lingkungan RSUPN Dr. Cipto Mangunkusumo.'


const defaultJudulKeseluruhan = 'Catatan Dokumen Tagihan Keseluruhan'
const defaultJudulInternal = 'Catatan Dokumen Tagihan Internal'
const defaultJudulEksternal = 'Catatan Dokumen Tagihan Eksternal'

const defaultKetKeseluruhan = 'Rekapitulasi seluruh dokumen tagihan masuk baik internal maupun eksternal yang diproses melalui sistem verifikasi keuangan RSCM guna memastikan akurasi dan kepatuhan administrasi sebelum proses pembayaran.'
const defaultKetInternal = 'Verifikasi dokumen tagihan dari unit kerja internal RSCM yang meliputi pengajuan operasional, belanja modal, dan pertanggungjawaban kegiatan kerja sama operasional.'
const defaultKetEksternal = 'Verifikasi dokumen tagihan dari pihak ketiga atau vendor eksternal penyedia barang dan jasa medis maupun non-medis di lingkungan RSUPN Dr. Cipto Mangunkusumo.'

const sel: React.CSSProperties = {
  padding: '8px 18px',
  borderRadius: 10,
  border: '1px solid #e2e8f0',
  fontFamily: 'Nunito, sans-serif',
  fontSize: 13,
  fontWeight: 700,
  color: '#00282b',
  background: '#f8fafc',
  outline: 'none',
  cursor: 'pointer',
  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
}

interface Props {
  initialDataList: YearVerificationData[]
  initialSlaDataList?: YearSlaData[]
  initialBaDataList?: YearBaTutupTagihanData[]
  globalPerbandinganInternal?: string
  globalPerbandinganEksternal?: string
}

// Data default (kosong/0) jika belum ada input atau data dihapus
const defaultMonthsData: MonthData[] = NAMA_BULAN.map((bulan, idx) => ({
  bulan,
  bulan_num: idx + 1,
  internal: {
    jumlah_dokumen: 0,
    proses: 0,
    lolos: 0,
  },
  eksternal: {
    jumlah_dokumen: 0,
    proses: 0,
    lolos: 0,
  },
  keseluruhan: {
    jumlah_dokumen: 0,
    proses: 0,
    lolos: 0,
  }
}))

// Komponen Excel-Style Header Filter dengan Checklist Multi-Bulan
interface ExcelPeriodFilterHeaderProps {
  selectedMonths: string[]
  onChange: (months: string[]) => void
  onApplyToAll?: () => void
  tableName?: string
}

function ExcelPeriodFilterHeader({
  selectedMonths,
  onChange,
  onApplyToAll,
  tableName,
}: ExcelPeriodFilterHeaderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [mounted, setMounted] = useState(false)
  const [coords, setCoords] = useState<{ top: number; left: number; placeAbove: boolean } | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Hitung posisi dropdown secara dinamis terhadap tombol
  const updateCoords = useCallback(() => {
    if (!buttonRef.current) return
    const rect = buttonRef.current.getBoundingClientRect()
    const popoverWidth = 264

    // Posisi horizontal: sejajar sisi kiri tombol, tetap aman di dalam layar
    let left = rect.left
    if (left + popoverWidth > window.innerWidth - 12) {
      left = Math.max(12, window.innerWidth - popoverWidth - 12)
    }
    if (left < 12) left = 12

    // Ruang atas dan bawah di viewport
    const spaceBelow = window.innerHeight - rect.bottom
    const spaceAbove = rect.top

    let placeAbove = false
    let top = rect.bottom + 6

    // Jika ruang di bawah kurang dari 350px dan ruang di atas lebih lapang, posisikan di atas tombol
    if (spaceBelow < 350 && spaceAbove > spaceBelow) {
      placeAbove = true
      top = rect.top - 6
    }

    setCoords({ top, left, placeAbove })
  }, [])

  // Reposisi saat buka, scroll, atau resize jendela
  useEffect(() => {
    if (!isOpen) return
    updateCoords()

    const handleScroll = (e: Event) => {
      // Jika user sedang scroll di dalam list bulan popover, jangan ubah posisi
      if (popoverRef.current && popoverRef.current.contains(e.target as Node)) {
        return
      }
      // Jika tombol sudah scroll keluar dari layar, tutup popover
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect()
        if (rect.bottom < 0 || rect.top > window.innerHeight) {
          setIsOpen(false)
          return
        }
      }
      updateCoords()
    }

    const handleResize = () => {
      updateCoords()
    }

    window.addEventListener('scroll', handleScroll, true)
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('scroll', handleScroll, true)
      window.removeEventListener('resize', handleResize)
    }
  }, [isOpen, updateCoords])

  // Tutup dropdown saat klik di luar area
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      if (
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Tutup dropdown saat tekan tombol Escape
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const isAllSelected = selectedMonths.length === NAMA_BULAN.length
  const isFiltered = !isAllSelected

  // Filter bulan sesuai pencarian teks
  const filteredMonths = useMemo(() => {
    if (!search.trim()) return NAMA_BULAN
    const q = search.toLowerCase().trim()
    return NAMA_BULAN.filter(m => m.toLowerCase().includes(q))
  }, [search])

  const toggleMonth = (m: string) => {
    if (selectedMonths.includes(m)) {
      onChange(selectedMonths.filter(x => x !== m))
    } else {
      const next = [...selectedMonths, m].sort((a, b) => NAMA_BULAN.indexOf(a) - NAMA_BULAN.indexOf(b))
      onChange(next)
    }
  }

  const toggleAll = () => {
    if (isAllSelected) {
      onChange([])
    } else {
      onChange([...NAMA_BULAN])
    }
  }

  const selectPreset = (months: string[]) => {
    onChange(months)
  }

  return (
    <div className="relative inline-block text-left">
      {/* Tombol Filter di Header Kolom ala Excel */}
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          if (!isOpen) {
            updateCoords()
          }
          setIsOpen(!isOpen)
        }}
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs font-bold transition-all cursor-pointer border ${
          isFiltered
            ? 'bg-[#00282b] text-[#01bcce] border-[#00282b] shadow-xs ring-2 ring-[#01bcce]/30'
            : 'bg-white/20 text-white border-white/40 hover:bg-white/30 hover:border-white/60'
        }`}
        title={
          isFiltered
            ? `Filter aktif: ${selectedMonths.length} bulan terpilih (Klik untuk ubah ceklis)`
            : 'Filter Periode (Pilih Bulan - Ala Excel)'
        }
      >
        <Filter size={11} className={isFiltered ? 'text-[#01bcce] fill-[#01bcce]' : 'text-white'} />
        {isFiltered ? (
          <span className="text-[10px] font-black bg-[#01bcce] text-[#00282b] px-1 rounded-sm leading-none py-0.5">
            {selectedMonths.length}
          </span>
        ) : (
          <ChevronDown size={10} className="text-white/80" />
        )}
      </button>

      {/* Popover Dropdown Filter Ala Excel - Dirender via React Portal ke document.body agar tidak terpotong container tabel */}
      {isOpen && mounted && typeof document !== 'undefined' && coords && createPortal(
        <div
          ref={popoverRef}
          onClick={(e) => e.stopPropagation()}
          className="fixed z-[99999] w-64 bg-white rounded-2xl shadow-2xl border border-gray-200 p-3 text-left font-nav flex flex-col"
          style={{
            top: coords.placeAbove ? undefined : `${coords.top}px`,
            bottom: coords.placeAbove ? `${Math.max(8, window.innerHeight - coords.top)}px` : undefined,
            left: `${coords.left}px`,
            minWidth: 260,
            maxHeight: 'calc(100vh - 24px)',
          }}
        >
          {/* Header Popover */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100">
            <div className="flex items-center gap-1.5">
              <Filter size={13} className="text-[#01bcce]" />
              <span className="text-xs font-black text-[#00282b]">
                {tableName ? `Filter Periode (${tableName})` : 'Filter Periode'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 cursor-pointer transition-colors"
            >
              <X size={13} />
            </button>
          </div>

          {/* Search Box */}
          <div className="relative mb-2">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari bulan..."
              className="w-full pl-7 pr-2.5 py-1 text-xs rounded-lg border border-gray-200 focus:border-[#01bcce] focus:outline-none bg-gray-50 focus:bg-white text-gray-800"
            />
          </div>

          {/* Master Checkbox: (Pilih Semua) */}
          <div className="mb-1.5">
            <label className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-gray-50/80 hover:bg-gray-100 cursor-pointer select-none text-xs font-bold text-[#00282b] border border-gray-200/80 transition-colors">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={el => {
                    if (el) {
                      el.indeterminate = selectedMonths.length > 0 && selectedMonths.length < NAMA_BULAN.length
                    }
                  }}
                  onChange={toggleAll}
                  className="w-4 h-4 rounded text-[#01bcce] accent-[#01bcce] border-gray-300 cursor-pointer"
                />
                <span>(Pilih Semua)</span>
              </div>
              <span className="text-[10px] text-gray-400 font-bold">
                {selectedMonths.length}/12
              </span>
            </label>
          </div>

          {/* Quick Presets (Kuartal / Semester) */}
          <div className="flex items-center gap-1 flex-wrap mb-2 pb-2 border-b border-gray-100">
            <span className="text-[10px] text-gray-400 font-bold mr-0.5">Preset:</span>
            {[
              { label: 'Q1', months: ['Januari', 'Februari', 'Maret'] },
              { label: 'Q2', months: ['April', 'Mei', 'Juni'] },
              { label: 'Q3', months: ['Juli', 'Agustus', 'September'] },
              { label: 'Q4', months: ['Oktober', 'November', 'Desember'] },
              { label: 'Sem 1', months: ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni'] },
              { label: 'Sem 2', months: ['Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'] },
            ].map(preset => {
              const isActive =
                selectedMonths.length === preset.months.length &&
                preset.months.every(m => selectedMonths.includes(m))
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => selectPreset(preset.months)}
                  className={`text-[10px] px-1.5 py-0.5 rounded font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#00282b] text-[#01bcce]'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {preset.label}
                </button>
              )
            })}
          </div>

          {/* List Ceklis 12 Bulan (Ala Excel) */}
          <div className="max-h-48 overflow-y-auto space-y-0.5 p-1 bg-gray-50/50 rounded-xl border border-gray-100">
            {filteredMonths.length === 0 ? (
              <div className="py-3 text-center text-xs text-gray-400 font-semibold">
                Bulan tidak ditemukan
              </div>
            ) : (
              filteredMonths.map(bulan => {
                const checked = selectedMonths.includes(bulan)
                const monthIdx = NAMA_BULAN.indexOf(bulan)
                return (
                  <label
                    key={bulan}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer select-none transition-colors ${
                      checked
                        ? 'bg-white text-[#00282b] font-bold shadow-xs'
                        : 'text-gray-600 hover:bg-white/80'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleMonth(bulan)}
                        className="w-4 h-4 rounded text-[#01bcce] accent-[#01bcce] border-gray-300 cursor-pointer"
                      />
                      <span>{bulan}</span>
                    </div>
                    <span className="text-[10px] text-gray-400 font-mono font-semibold">
                      {BULAN_SINGKAT[monthIdx]}
                    </span>
                  </label>
                )
              })
            )}
          </div>

          {/* Footer Popover & Quick Actions */}
          <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between gap-1 flex-wrap">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onChange([...NAMA_BULAN])}
                className="text-[10px] text-gray-500 hover:text-gray-800 font-bold hover:underline cursor-pointer"
              >
                Pilih Semua
              </button>
              <span className="text-gray-300">•</span>
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-[10px] text-gray-400 hover:text-red-500 font-bold hover:underline cursor-pointer"
              >
                Kosongkan
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              {onApplyToAll && (
                <button
                  type="button"
                  onClick={onApplyToAll}
                  title="Terapkan filter bulan ini ke semua tabel"
                  className="text-[10px] text-[#01bcce] hover:underline font-bold flex items-center gap-0.5 cursor-pointer"
                >
                  <Sparkles size={10} />
                  Semua Tabel
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-2.5 py-1 bg-[#00282b] text-[#01bcce] text-xs font-bold rounded-lg hover:opacity-90 cursor-pointer transition-opacity"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

// Komponen Filter Preset Cepat (Tahunan, Kuartal, Semester) yang tetap berada di atas tabel
interface PeriodePresetFilterProps {
  selectedMonths: string[]
  onChange: (months: string[]) => void
  onApplyToAll?: () => void
}

function PeriodePresetFilter({ selectedMonths, onChange, onApplyToAll }: PeriodePresetFilterProps) {
  // Toggle 12 Bulan (Tahunan): jika saat ini 12 bulan terpilih, klik lagi untuk hilangkan/kosongkan
  const toggle12Months = () => {
    if (selectedMonths.length === 12) {
      onChange([])
    } else {
      onChange([...NAMA_BULAN])
    }
  }

  // Toggle Preset (Q1, Q2, Q3, Q4, Sem 1, Sem 2)
  const togglePreset = (months: string[]) => {
    const isCurrent =
      selectedMonths.length === months.length &&
      months.every(m => selectedMonths.includes(m))
    if (isCurrent) {
      onChange([])
    } else {
      onChange(months)
    }
  }

  const isPresetActive = (months: string[]) => {
    return selectedMonths.length === months.length && months.every(m => selectedMonths.includes(m))
  }

  const clearAll = () => onChange([])

  return (
    <div className="bg-white p-3 sm:p-3.5 rounded-2xl border border-gray-200 shadow-sm mb-5 font-nav">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-black uppercase text-gray-500 tracking-wider mr-1">
            Pilih Periode:
          </span>
          <button
            type="button"
            onClick={toggle12Months}
            title={selectedMonths.length === 12 ? 'Klik untuk hilangkan pilihan 12 bulan (kosongkan filter)' : 'Klik untuk memilih semua 12 bulan'}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedMonths.length === 12
                ? 'bg-[#00282b] text-[#01bcce] shadow-sm ring-1 ring-[#01bcce]/40'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span>{selectedMonths.length === 12 ? '✓ Semua (12 Bulan)' : 'Semua (12 Bulan)'}</span>
          </button>
          <button
            type="button"
            onClick={() => togglePreset(['Januari', 'Februari', 'Maret'])}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              isPresetActive(['Januari', 'Februari', 'Maret'])
                ? 'bg-[#00282b] text-[#01bcce] shadow-sm ring-1 ring-[#01bcce]/40'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
            }`}
          >
            Q1 (Jan-Mar)
          </button>
          <button
            type="button"
            onClick={() => togglePreset(['April', 'Mei', 'Juni'])}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              isPresetActive(['April', 'Mei', 'Juni'])
                ? 'bg-[#00282b] text-[#01bcce] shadow-sm ring-1 ring-[#01bcce]/40'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
            }`}
          >
            Q2 (Apr-Jun)
          </button>
          <button
            type="button"
            onClick={() => togglePreset(['Juli', 'Agustus', 'September'])}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              isPresetActive(['Juli', 'Agustus', 'September'])
                ? 'bg-[#00282b] text-[#01bcce] shadow-sm ring-1 ring-[#01bcce]/40'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
            }`}
          >
            Q3 (Jul-Sep)
          </button>
          <button
            type="button"
            onClick={() => togglePreset(['Oktober', 'November', 'Desember'])}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              isPresetActive(['Oktober', 'November', 'Desember'])
                ? 'bg-[#00282b] text-[#01bcce] shadow-sm ring-1 ring-[#01bcce]/40'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
            }`}
          >
            Q4 (Okt-Des)
          </button>
          <button
            type="button"
            onClick={() => togglePreset(['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni'])}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              isPresetActive(['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni'])
                ? 'bg-[#00282b] text-[#01bcce] shadow-sm ring-1 ring-[#01bcce]/40'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
            }`}
          >
            Sem. 1
          </button>
          <button
            type="button"
            onClick={() => togglePreset(['Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'])}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              isPresetActive(['Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'])
                ? 'bg-[#00282b] text-[#01bcce] shadow-sm ring-1 ring-[#01bcce]/40'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
            }`}
          >
            Sem. 2
          </button>
        </div>

        <div className="flex items-center gap-2">
          {onApplyToAll && (
            <button
              type="button"
              onClick={onApplyToAll}
              title="Terapkan kombinasi periode ini ke semua tabel"
              className="text-[11px] font-bold text-[#01bcce] hover:underline cursor-pointer flex items-center gap-1"
            >
              <Sparkles size={12} />
              Terapkan ke Semua Tabel
            </button>
          )}
          {selectedMonths.length > 0 && selectedMonths.length < 12 && (
            <button
              type="button"
              onClick={clearAll}
              title="Kosongkan pilihan periode"
              className="text-[11px] font-bold text-gray-400 hover:text-red-500 cursor-pointer flex items-center gap-1"
            >
              <RotateCcw size={11} />
              Kosongkan
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

interface ComparisonDropdownPickerProps {
  label?: string
  year: number
  onYearChange: (y: number) => void
  months: string[]
  onMonthsChange: (m: string[]) => void
  availableYears: number[]
}

function ComparisonDropdownPicker({
  label,
  year,
  onYearChange,
  months,
  onMonthsChange,
  availableYears,
}: ComparisonDropdownPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const toggleMonth = (m: string) => {
    if (months.includes(m)) {
      onMonthsChange(months.filter(x => x !== m))
    } else {
      const next = [...months, m].sort((a, b) => NAMA_BULAN.indexOf(a) - NAMA_BULAN.indexOf(b))
      onMonthsChange(next)
    }
  }

  const selectPreset = (presetMonths: string[]) => {
    onMonthsChange(presetMonths)
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 relative font-nav" ref={dropdownRef}>
      {/* Badge Label Periode (Hanya tampil jika label diberikan) */}
      {label && label.trim().length > 0 && (
        <span className="text-[11px] font-black uppercase tracking-wider text-[#00282b] bg-white px-2.5 py-1.5 rounded-xl border border-gray-200 shadow-xs">
          {label}
        </span>
      )}

      {/* Selector Tahun */}
      <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-gray-200 shadow-xs">
        <Calendar size={13} className="text-[#01bcce]" />
        <span className="text-[11px] font-bold text-gray-500 uppercase">Tahun:</span>
        <select
          value={year}
          onChange={e => onYearChange(parseInt(e.target.value))}
          className="font-nav font-black text-xs text-[#00282b] bg-transparent outline-none cursor-pointer"
        >
          {availableYears.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* Button Dropdown Bulan (Bisa pilih beberapa bulan) */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border shadow-xs ${
            isOpen
              ? 'bg-[#00282b] text-white border-[#00282b]'
              : 'bg-white text-gray-800 border-gray-200 hover:border-[#01bcce]'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Filter size={12} className={isOpen ? 'text-[#01bcce]' : 'text-[#008080]'} />
            <span className="truncate max-w-[130px]">
              {months.length === 0 ? 'Pilih Bulan' : formatPeriodeLabel(months)}
            </span>
          </div>
          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
            isOpen ? 'bg-[#01bcce] text-[#00282b]' : 'bg-gray-100 text-gray-600'
          }`}>
            {months.length}
          </span>
          <ChevronDown size={12} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Popover Checklist Pemilihan Bulan */}
        {isOpen && (
          <div className="absolute top-full left-0 sm:left-auto sm:right-0 mt-2 z-50 w-72 bg-white rounded-2xl shadow-2xl border border-gray-200 p-3.5 text-left font-nav">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100">
              <div className="flex items-center gap-1.5">
                <Filter size={13} className="text-[#01bcce]" />
                <span className="text-xs font-black text-[#00282b]">Pilih Bulan ({year})</span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 cursor-pointer"
              >
                <X size={13} />
              </button>
            </div>

            {/* Quick Presets */}
            <div className="grid grid-cols-4 gap-1 mb-2.5">
              <button
                type="button"
                onClick={() => selectPreset([...NAMA_BULAN])}
                className="px-1.5 py-1 text-[10px] font-bold rounded-lg bg-gray-50 hover:bg-[#00282b] hover:text-[#01bcce] border border-gray-200 text-gray-700 transition-colors cursor-pointer text-center"
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => selectPreset(['Januari', 'Februari', 'Maret'])}
                className="px-1.5 py-1 text-[10px] font-bold rounded-lg bg-gray-50 hover:bg-[#00282b] hover:text-[#01bcce] border border-gray-200 text-gray-700 transition-colors cursor-pointer text-center"
              >
                Q1 (Jan-Mar)
              </button>
              <button
                type="button"
                onClick={() => selectPreset(['April', 'Mei', 'Juni'])}
                className="px-1.5 py-1 text-[10px] font-bold rounded-lg bg-gray-50 hover:bg-[#00282b] hover:text-[#01bcce] border border-gray-200 text-gray-700 transition-colors cursor-pointer text-center"
              >
                Q2 (Apr-Jun)
              </button>
              <button
                type="button"
                onClick={() => selectPreset(['Juli', 'Agustus', 'September'])}
                className="px-1.5 py-1 text-[10px] font-bold rounded-lg bg-gray-50 hover:bg-[#00282b] hover:text-[#01bcce] border border-gray-200 text-gray-700 transition-colors cursor-pointer text-center"
              >
                Q3 (Jul-Sep)
              </button>
              <button
                type="button"
                onClick={() => selectPreset(['Oktober', 'November', 'Desember'])}
                className="px-1.5 py-1 text-[10px] font-bold rounded-lg bg-gray-50 hover:bg-[#00282b] hover:text-[#01bcce] border border-gray-200 text-gray-700 transition-colors cursor-pointer text-center"
              >
                Q4 (Okt-Des)
              </button>
              <button
                type="button"
                onClick={() => selectPreset(NAMA_BULAN.slice(0, 6))}
                className="px-1.5 py-1 text-[10px] font-bold rounded-lg bg-gray-50 hover:bg-[#00282b] hover:text-[#01bcce] border border-gray-200 text-gray-700 transition-colors cursor-pointer text-center"
              >
                Sem 1
              </button>
              <button
                type="button"
                onClick={() => selectPreset(NAMA_BULAN.slice(6, 12))}
                className="px-1.5 py-1 text-[10px] font-bold rounded-lg bg-gray-50 hover:bg-[#00282b] hover:text-[#01bcce] border border-gray-200 text-gray-700 transition-colors cursor-pointer text-center"
              >
                Sem 2
              </button>
              <button
                type="button"
                onClick={() => selectPreset([])}
                className="px-1.5 py-1 text-[10px] font-bold rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-colors cursor-pointer text-center"
              >
                Reset
              </button>
            </div>

            {/* Checklist 12 Bulan */}
            <div className="grid grid-cols-2 gap-1 max-h-48 overflow-y-auto pr-1">
              {NAMA_BULAN.map((bln, idx) => {
                const isChecked = months.includes(bln)
                return (
                  <label
                    key={bln}
                    onClick={() => toggleMonth(bln)}
                    className={`flex items-center gap-2 px-2 py-1 rounded-lg text-xs cursor-pointer select-none transition-colors ${
                      isChecked
                        ? 'bg-cyan-50 font-bold text-[#00282b]'
                        : 'hover:bg-gray-50 text-gray-600'
                    }`}
                  >
                    <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-all ${
                      isChecked
                        ? 'bg-[#00282b] border-[#00282b] text-[#01bcce]'
                        : 'border-gray-300 bg-white'
                    }`}>
                      {isChecked && <Check size={10} strokeWidth={3} />}
                    </div>
                    <span className="text-[11px]">{BULAN_SINGKAT[idx]} ({bln.slice(0, 3)})</span>
                  </label>
                )
              })}
            </div>

            <div className="pt-2 mt-2 border-t border-gray-100 flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-400">
                {months.length} dari 12 bulan terpilih
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3 py-1 rounded-lg text-[11px] font-bold bg-[#00282b] text-[#01bcce] hover:opacity-90 transition-opacity cursor-pointer"
              >
                Selesai
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AkuntansiVerifikasiClient({
  initialDataList,
  initialSlaDataList = [],
  initialBaDataList = [],
  globalPerbandinganInternal = '',
  globalPerbandinganEksternal = ''
}: Props) {
  const [activeTab, setActiveTab] = useState<'dokumen_tagihan' | 'sla' | 'ba_tutup_tagihan'>('dokumen_tagihan')

  // Available years
  const availableYears = useMemo(() => {
    const years = initialDataList.map(d => d.tahun)
    if (!years.includes(new Date().getFullYear())) {
      years.push(new Date().getFullYear())
    }
    return Array.from(new Set(years)).sort((a, b) => b - a)
  }, [initialDataList])

  const [selectedYear, setSelectedYear] = useState<number>(availableYears[0] || new Date().getFullYear())

  // Helper untuk mengambil data per tahun secara independen
  const getYearData = (year: number) => {
    const found = initialDataList.find(d => d.tahun === year)
    if (found && found.months && found.months.length > 0) {
      const months = found.months.map(m => ({
        ...m,
        keseluruhan: m.keseluruhan || {
          jumlah_dokumen: (m.internal?.jumlah_dokumen || 0) + (m.eksternal?.jumlah_dokumen || 0),
          proses: (m.internal?.proses || 0) + (m.eksternal?.proses || 0),
          lolos: (m.internal?.lolos || 0) + (m.eksternal?.lolos || 0),
        }
      }))
      return {
        ...found,
        header_text: found.header_text || 'Layanan verifikasi dokumen tagihan keuangan RSCM memastikan kelengkapan, keabsahan, dan kepatuhan administrasi tagihan internal maupun eksternal sebelum dilakukan proses pembayaran.',
        judul_text_keseluruhan: found.judul_text_keseluruhan || defaultJudulKeseluruhan,
        keterangan_keseluruhan: found.keterangan_keseluruhan || defaultKetKeseluruhan,
        judul_text_internal: found.judul_text_internal || defaultJudulInternal,
        keterangan_internal: found.keterangan_internal || defaultKetInternal,
        judul_text_eksternal: found.judul_text_eksternal || defaultJudulEksternal,
        keterangan_eksternal: found.keterangan_eksternal || defaultKetEksternal,
        months
      }
    }
    return {
      tahun: year,
      header_text: found?.header_text || 'Layanan verifikasi dokumen tagihan keuangan RSCM memastikan kelengkapan, keabsahan, dan kepatuhan administrasi tagihan internal maupun eksternal sebelum dilakukan proses pembayaran.',
      judul_text_keseluruhan: found?.judul_text_keseluruhan || defaultJudulKeseluruhan,
      keterangan_keseluruhan: found?.keterangan_keseluruhan || defaultKetKeseluruhan,
      judul_text_internal: found?.judul_text_internal || defaultJudulInternal,
      keterangan_internal: found?.keterangan_internal || defaultKetInternal,
      judul_text_eksternal: found?.judul_text_eksternal || defaultJudulEksternal,
      keterangan_eksternal: found?.keterangan_eksternal || defaultKetEksternal,
      months: []
    }
  }

  // Data dokumen tagihan terpadu untuk tahun yang dipilih (sinkron untuk Box 1, 2, dan 3)
  const yearData = useMemo(() => getYearData(selectedYear), [initialDataList, selectedYear])

  // MULTI-MONTH FILTERS STATE (Default: All 12 Months)
  const [selectedMonthsKeseluruhan, setSelectedMonthsKeseluruhan] = useState<string[]>(NAMA_BULAN)
  const [selectedMonthsInternal, setSelectedMonthsInternal] = useState<string[]>(NAMA_BULAN)
  const [selectedMonthsEksternal, setSelectedMonthsEksternal] = useState<string[]>(NAMA_BULAN)

  // Quick apply filter to all tables
  const applyKeseluruhanToAll = () => {
    setSelectedMonthsInternal([...selectedMonthsKeseluruhan])
    setSelectedMonthsEksternal([...selectedMonthsKeseluruhan])
  }

  const applyInternalToAll = () => {
    setSelectedMonthsKeseluruhan([...selectedMonthsInternal])
    setSelectedMonthsEksternal([...selectedMonthsInternal])
  }

  const applyEksternalToAll = () => {
    setSelectedMonthsKeseluruhan([...selectedMonthsEksternal])
    setSelectedMonthsInternal([...selectedMonthsEksternal])
  }

  // 1. DATA KESELURUHAN (Hanya tampilkan bulan yang ADA DATA yang diinput!)
  const keseluruhanTableData = useMemo(() => {
    return yearData.months
      .filter(m => selectedMonthsKeseluruhan.includes(m.bulan))
      .filter(m => {
        const jml = m.keseluruhan?.jumlah_dokumen ?? ((m.internal?.jumlah_dokumen || 0) + (m.eksternal?.jumlah_dokumen || 0))
        const pros = m.keseluruhan?.proses ?? ((m.internal?.proses || 0) + (m.eksternal?.proses || 0))
        const lolos = m.keseluruhan?.lolos ?? ((m.internal?.lolos || 0) + (m.eksternal?.lolos || 0))
        return jml > 0 || pros > 0 || lolos > 0
      })
      .map(m => ({
        bulan: m.bulan,
        bulan_num: m.bulan_num,
        jumlah_dokumen: m.keseluruhan?.jumlah_dokumen ?? ((m.internal?.jumlah_dokumen || 0) + (m.eksternal?.jumlah_dokumen || 0)),
        proses: m.keseluruhan?.proses ?? ((m.internal?.proses || 0) + (m.eksternal?.proses || 0)),
        lolos: m.keseluruhan?.lolos ?? ((m.internal?.lolos || 0) + (m.eksternal?.lolos || 0)),
      }))
  }, [yearData, selectedMonthsKeseluruhan])

  const keseluruhanTotal = useMemo(() => {
    return keseluruhanTableData.reduce((acc, curr) => ({
      jumlah_dokumen: acc.jumlah_dokumen + curr.jumlah_dokumen,
      proses: acc.proses + curr.proses,
      lolos: acc.lolos + curr.lolos,
    }), { jumlah_dokumen: 0, proses: 0, lolos: 0 })
  }, [keseluruhanTableData])

  const keseluruhanLineChartData = useMemo(() => {
    return keseluruhanTableData.map(m => ({
      bulan: m.bulan,
      bulanSingkat: BULAN_SINGKAT[m.bulan_num - 1] || m.bulan.substring(0, 3),
      jumlah_dokumen: m.jumlah_dokumen,
      proses: m.proses,
      lolos: m.lolos,
    }))
  }, [keseluruhanTableData])

  // 2. DATA INTERNAL (Hanya tampilkan bulan yang ADA DATA yang diinput!)
  const internalTableData = useMemo(() => {
    return yearData.months
      .filter(m => selectedMonthsInternal.includes(m.bulan))
      .filter(m => (m.internal?.jumlah_dokumen || 0) > 0 || (m.internal?.proses || 0) > 0 || (m.internal?.lolos || 0) > 0)
      .map(m => ({
        bulan: m.bulan,
        bulan_num: m.bulan_num,
        jumlah_dokumen: m.internal?.jumlah_dokumen || 0,
        proses: m.internal?.proses || 0,
        lolos: m.internal?.lolos || 0,
      }))
  }, [yearData, selectedMonthsInternal])

  const internalTotal = useMemo(() => {
    return internalTableData.reduce((acc, curr) => ({
      jumlah_dokumen: acc.jumlah_dokumen + curr.jumlah_dokumen,
      proses: acc.proses + curr.proses,
      lolos: acc.lolos + curr.lolos,
    }), { jumlah_dokumen: 0, proses: 0, lolos: 0 })
  }, [internalTableData])

  const internalLineChartData = useMemo(() => {
    return internalTableData.map(m => ({
      bulan: m.bulan,
      bulanSingkat: BULAN_SINGKAT[m.bulan_num - 1] || m.bulan.substring(0, 3),
      jumlah_dokumen: m.jumlah_dokumen,
      proses: m.proses,
      lolos: m.lolos,
    }))
  }, [internalTableData])

  // 3. DATA EKSTERNAL (Hanya tampilkan bulan yang ADA DATA yang diinput!)
  const eksternalTableData = useMemo(() => {
    return yearData.months
      .filter(m => selectedMonthsEksternal.includes(m.bulan))
      .filter(m => (m.eksternal?.jumlah_dokumen || 0) > 0 || (m.eksternal?.proses || 0) > 0 || (m.eksternal?.lolos || 0) > 0)
      .map(m => ({
        bulan: m.bulan,
        bulan_num: m.bulan_num,
        jumlah_dokumen: m.eksternal?.jumlah_dokumen || 0,
        proses: m.eksternal?.proses || 0,
        lolos: m.eksternal?.lolos || 0,
      }))
  }, [yearData, selectedMonthsEksternal])

  const eksternalTotal = useMemo(() => {
    return eksternalTableData.reduce((acc, curr) => ({
      jumlah_dokumen: acc.jumlah_dokumen + curr.jumlah_dokumen,
      proses: acc.proses + curr.proses,
      lolos: acc.lolos + curr.lolos,
    }), { jumlah_dokumen: 0, proses: 0, lolos: 0 })
  }, [eksternalTableData])

  const eksternalLineChartData = useMemo(() => {
    return eksternalTableData.map(m => ({
      bulan: m.bulan,
      bulanSingkat: BULAN_SINGKAT[m.bulan_num - 1] || m.bulan.substring(0, 3),
      jumlah_dokumen: m.jumlah_dokumen,
      proses: m.proses,
      lolos: m.lolos,
    }))
  }, [eksternalTableData])

  // ================= 4. PERBANDINGAN DOKUMEN TAGIHAN =================
  const [compYearA, setCompYearA] = useState<number>(availableYears[0] || new Date().getFullYear())
  const [compMonthsA, setCompMonthsA] = useState<string[]>(['Januari', 'Februari', 'Maret'])

  const [compYearB, setCompYearB] = useState<number>(availableYears[1] || availableYears[0] || new Date().getFullYear())
  const [compMonthsB, setCompMonthsB] = useState<string[]>(['Januari', 'Februari', 'Maret'])

  const compDataA = useMemo(() => getYearData(compYearA), [initialDataList, compYearA])
  const compDataB = useMemo(() => getYearData(compYearB), [initialDataList, compYearB])

  const labelA = useMemo(() => formatBulanDanTahun(compMonthsA, compYearA), [compMonthsA, compYearA])
  const labelB = useMemo(() => formatBulanDanTahun(compMonthsB, compYearB), [compMonthsB, compYearB])

  const handleResetComparison = () => {
    const defaultYearA = availableYears[0] || new Date().getFullYear()
    const defaultYearB = availableYears[1] || availableYears[0] || new Date().getFullYear()
    setCompYearA(defaultYearA)
    setCompMonthsA([])
    setCompYearB(defaultYearB)
    setCompMonthsB([])
  }

  // Unified Comparison Data (Internal, Eksternal & Keseluruhan)
  const comparisonItems = useMemo(() => {
    const allMonths = Array.from(new Set([...compMonthsA, ...compMonthsB])).sort(
      (a, b) => NAMA_BULAN.indexOf(a) - NAMA_BULAN.indexOf(b)
    )

    return allMonths.map(bulan => {
      const isIncludedA = compMonthsA.includes(bulan)
      const isIncludedB = compMonthsB.includes(bulan)

      const mA = compDataA.months.find(m => m.bulan === bulan)
      const mB = compDataB.months.find(m => m.bulan === bulan)

      const internalA = isIncludedA ? (mA?.internal?.jumlah_dokumen || 0) : 0
      const eksternalA = isIncludedA ? (mA?.eksternal?.jumlah_dokumen || 0) : 0
      const keseluruhanA = internalA + eksternalA

      const internalB = isIncludedB ? (mB?.internal?.jumlah_dokumen || 0) : 0
      const eksternalB = isIncludedB ? (mB?.eksternal?.jumlah_dokumen || 0) : 0
      const keseluruhanB = internalB + eksternalB

      return {
        bulan,
        bulanSingkat: BULAN_SINGKAT[NAMA_BULAN.indexOf(bulan)] || bulan.substring(0, 3),
        internalA,
        eksternalA,
        keseluruhanA,
        internalB,
        eksternalB,
        keseluruhanB,
        isIncludedA,
        isIncludedB,
      }
    })
  }, [compDataA, compDataB, compMonthsA, compMonthsB])

  const totalCompInternalA = useMemo(() => {
    return compDataA.months
      .filter(m => compMonthsA.includes(m.bulan))
      .reduce((sum, m) => sum + (m.internal?.jumlah_dokumen || 0), 0)
  }, [compDataA, compMonthsA])

  const totalCompEksternalA = useMemo(() => {
    return compDataA.months
      .filter(m => compMonthsA.includes(m.bulan))
      .reduce((sum, m) => sum + (m.eksternal?.jumlah_dokumen || 0), 0)
  }, [compDataA, compMonthsA])

  const totalCompKeseluruhanA = totalCompInternalA + totalCompEksternalA

  const totalCompInternalB = useMemo(() => {
    return compDataB.months
      .filter(m => compMonthsB.includes(m.bulan))
      .reduce((sum, m) => sum + (m.internal?.jumlah_dokumen || 0), 0)
  }, [compDataB, compMonthsB])

  const totalCompEksternalB = useMemo(() => {
    return compDataB.months
      .filter(m => compMonthsB.includes(m.bulan))
      .reduce((sum, m) => sum + (m.eksternal?.jumlah_dokumen || 0), 0)
  }, [compDataB, compMonthsB])

  const totalCompKeseluruhanB = totalCompInternalB + totalCompEksternalB

  // ================= 5. STATE & DATA SLA (CAPAIAN) =================
  const availableSlaYears = useMemo(() => {
    const years = (initialSlaDataList || []).map(d => d.tahun)
    if (!years.includes(new Date().getFullYear())) {
      years.push(new Date().getFullYear())
    }
    return Array.from(new Set(years)).sort((a, b) => b - a)
  }, [initialSlaDataList])

  const [selectedYearSla, setSelectedYearSla] = useState<number>(availableSlaYears[0] || new Date().getFullYear())
  const [selectedMonthsSlaInternal, setSelectedMonthsSlaInternal] = useState<string[]>(NAMA_BULAN)
  const [selectedMonthsSlaEksternal, setSelectedMonthsSlaEksternal] = useState<string[]>(NAMA_BULAN)

  const applySlaInternalToAll = () => {
    setSelectedMonthsSlaEksternal(selectedMonthsSlaInternal)
  }
  const applySlaEksternalToAll = () => {
    setSelectedMonthsSlaInternal(selectedMonthsSlaEksternal)
  }

  const defaultSlaHeader = 'Service Level Agreement (SLA) Verifikasi Dokumen Tagihan mengukur ketepatan waktu dan efektivitas proses verifikasi tagihan internal maupun eksternal sesuai standar layanan operasional RSCM.'
  const defaultSlaJudulInternal = 'SLA Dokumen Internal'
  const defaultSlaKetInternal = 'Pencapaian Service Level Agreement (SLA) untuk dokumen tagihan internal mencakup kepatuhan terhadap standar waktu proses verifikasi, waktu pengambilan dokumen oleh unit kerja, dan waktu pengembalian berkas administrasi di lingkungan RSCM.'
  const defaultSlaJudulEksternal = 'SLA Dokumen Eksternal'
  const defaultSlaKetEksternal = 'Pencapaian Service Level Agreement (SLA) untuk dokumen tagihan eksternal mencakup kepatuhan terhadap standar waktu proses verifikasi tagihan rekanan/vendor, waktu pengambilan dokumen, serta penyelesaian pengembalian dokumen administrasi penyedia pihak ketiga.'

  const getSlaYearData = (year: number): YearSlaData => {
    const found = (initialSlaDataList || []).find(d => d.tahun === year)
    if (found) {
      return {
        ...found,
        header_text: found.header_text || defaultSlaHeader,
        judul_internal: found.judul_internal || defaultSlaJudulInternal,
        keterangan_internal: found.keterangan_internal || found.keterangan_capaian || defaultSlaKetInternal,
        judul_eksternal: found.judul_eksternal || defaultSlaJudulEksternal,
        keterangan_eksternal: found.keterangan_eksternal || found.keterangan_pengambilan || defaultSlaKetEksternal,
        months: found.months || [],
        months_pengambilan: found.months_pengambilan || [],
        months_pengembalian: found.months_pengembalian || [],
      }
    }
    return {
      tahun: year,
      header_text: defaultSlaHeader,
      judul_internal: defaultSlaJudulInternal,
      keterangan_internal: defaultSlaKetInternal,
      judul_eksternal: defaultSlaJudulEksternal,
      keterangan_eksternal: defaultSlaKetEksternal,
      months: [],
      months_pengambilan: [],
      months_pengembalian: [],
    }
  }

  const yearSlaData = useMemo(() => getSlaYearData(selectedYearSla), [initialSlaDataList, selectedYearSla])

  // 1. DATA SLA DOKUMEN INTERNAL
  const slaInternalChartData = useMemo(() => {
    return selectedMonthsSlaInternal
      .map(bulan => {
        const idx = NAMA_BULAN.indexOf(bulan)
        const mVer = (yearSlaData.months || []).find(m => m.bulan === bulan)
        const mPeng = (yearSlaData.months_pengambilan || []).find(m => m.bulan === bulan)
        const mKem = (yearSlaData.months_pengembalian || []).find(m => m.bulan === bulan)

        const verifikasi = mVer ? mVer.internal : 0
        const pengambilan = mPeng ? mPeng.internal : 0
        const pengembalian = mKem ? mKem.internal : 0
        const has_data = Boolean(
          (mVer?.has_data && verifikasi > 0) ||
          (mPeng?.has_data && pengambilan > 0) ||
          (mKem?.has_data && pengembalian > 0) ||
          verifikasi > 0 ||
          pengambilan > 0 ||
          pengembalian > 0
        )

        return {
          bulan,
          bulanSingkat: BULAN_TABEL_SLA[idx] || bulan.substring(0, 3),
          verifikasi,
          pengambilan,
          pengembalian,
          has_data,
        }
      })
      .filter(d => d.has_data)
  }, [yearSlaData, selectedMonthsSlaInternal])

  const slaInternalRowVerifikasi = useMemo(() => {
    const values = NAMA_BULAN.map(bulan => {
      const m = (yearSlaData.months || []).find(x => x.bulan === bulan)
      return m ? m.internal : 0
    })
    const selectedValues = values.filter((v, idx) => selectedMonthsSlaInternal.includes(NAMA_BULAN[idx]) && v > 0)
    const avg = selectedValues.length > 0 ? selectedValues.reduce((a, b) => a + b, 0) / selectedValues.length : 0
    return { name: 'SLA Verifikasi', color: '#01bcce', values, avg }
  }, [yearSlaData.months, selectedMonthsSlaInternal])

  const slaInternalRowPengambilan = useMemo(() => {
    const values = NAMA_BULAN.map(bulan => {
      const m = (yearSlaData.months_pengambilan || []).find(x => x.bulan === bulan)
      return m ? m.internal : 0
    })
    const selectedValues = values.filter((v, idx) => selectedMonthsSlaInternal.includes(NAMA_BULAN[idx]) && v > 0)
    const avg = selectedValues.length > 0 ? selectedValues.reduce((a, b) => a + b, 0) / selectedValues.length : 0
    return { name: 'SLA Pengambilan', color: '#268484', values, avg }
  }, [yearSlaData.months_pengambilan, selectedMonthsSlaInternal])

  const slaInternalRowPengembalian = useMemo(() => {
    const values = NAMA_BULAN.map(bulan => {
      const m = (yearSlaData.months_pengembalian || []).find(x => x.bulan === bulan)
      return m ? m.internal : 0
    })
    const selectedValues = values.filter((v, idx) => selectedMonthsSlaInternal.includes(NAMA_BULAN[idx]) && v > 0)
    const avg = selectedValues.length > 0 ? selectedValues.reduce((a, b) => a + b, 0) / selectedValues.length : 0
    return { name: 'SLA Pengembalian', color: '#d0db41', values, avg }
  }, [yearSlaData.months_pengembalian, selectedMonthsSlaInternal])

  // 2. DATA SLA DOKUMEN EKSTERNAL
  const slaEksternalChartData = useMemo(() => {
    return selectedMonthsSlaEksternal
      .map(bulan => {
        const idx = NAMA_BULAN.indexOf(bulan)
        const mVer = (yearSlaData.months || []).find(m => m.bulan === bulan)
        const mPeng = (yearSlaData.months_pengambilan || []).find(m => m.bulan === bulan)
        const mKem = (yearSlaData.months_pengembalian || []).find(m => m.bulan === bulan)

        const verifikasi = mVer ? mVer.eksternal : 0
        const pengambilan = mPeng ? mPeng.eksternal : 0
        const pengembalian = mKem ? mKem.eksternal : 0
        const has_data = Boolean(
          (mVer?.has_data && verifikasi > 0) ||
          (mPeng?.has_data && pengambilan > 0) ||
          (mKem?.has_data && pengembalian > 0) ||
          verifikasi > 0 ||
          pengambilan > 0 ||
          pengembalian > 0
        )

        return {
          bulan,
          bulanSingkat: BULAN_TABEL_SLA[idx] || bulan.substring(0, 3),
          verifikasi,
          pengambilan,
          pengembalian,
          has_data,
        }
      })
      .filter(d => d.has_data)
  }, [yearSlaData, selectedMonthsSlaEksternal])

  const slaEksternalRowVerifikasi = useMemo(() => {
    const values = NAMA_BULAN.map(bulan => {
      const m = (yearSlaData.months || []).find(x => x.bulan === bulan)
      return m ? m.eksternal : 0
    })
    const selectedValues = values.filter((v, idx) => selectedMonthsSlaEksternal.includes(NAMA_BULAN[idx]) && v > 0)
    const avg = selectedValues.length > 0 ? selectedValues.reduce((a, b) => a + b, 0) / selectedValues.length : 0
    return { name: 'SLA Verifikasi', color: '#01bcce', values, avg }
  }, [yearSlaData.months, selectedMonthsSlaEksternal])

  const slaEksternalRowPengambilan = useMemo(() => {
    const values = NAMA_BULAN.map(bulan => {
      const m = (yearSlaData.months_pengambilan || []).find(x => x.bulan === bulan)
      return m ? m.eksternal : 0
    })
    const selectedValues = values.filter((v, idx) => selectedMonthsSlaEksternal.includes(NAMA_BULAN[idx]) && v > 0)
    const avg = selectedValues.length > 0 ? selectedValues.reduce((a, b) => a + b, 0) / selectedValues.length : 0
    return { name: 'SLA Pengambilan', color: '#268484', values, avg }
  }, [yearSlaData.months_pengambilan, selectedMonthsSlaEksternal])

  const slaEksternalRowPengembalian = useMemo(() => {
    const values = NAMA_BULAN.map(bulan => {
      const m = (yearSlaData.months_pengembalian || []).find(x => x.bulan === bulan)
      return m ? m.eksternal : 0
    })
    const selectedValues = values.filter((v, idx) => selectedMonthsSlaEksternal.includes(NAMA_BULAN[idx]) && v > 0)
    const avg = selectedValues.length > 0 ? selectedValues.reduce((a, b) => a + b, 0) / selectedValues.length : 0
    return { name: 'SLA Pengembalian', color: '#d0db41', values, avg }
  }, [yearSlaData.months_pengembalian, selectedMonthsSlaEksternal])

  // ================= 6. STATE & DATA BA TUTUP TAGIHAN =================
  const availableBaYears = useMemo(() => {
    const years = (initialBaDataList || []).map(d => d.tahun)
    if (!years.includes(new Date().getFullYear())) {
      years.push(new Date().getFullYear())
    }
    return Array.from(new Set(years)).sort((a, b) => b - a)
  }, [initialBaDataList])

  const [selectedYearBa, setSelectedYearBa] = useState<number>(availableBaYears[0] || new Date().getFullYear())
  const [selectedMonthsBa, setSelectedMonthsBa] = useState<string[]>(NAMA_BULAN)
  const [selectedMonthsNominal, setSelectedMonthsNominal] = useState<string[]>(NAMA_BULAN)

  const getBaYearData = (year: number): YearBaTutupTagihanData => {
    const found = (initialBaDataList || []).find(d => d.tahun === year)
    if (found) {
      const rawJudulTabel = found.judul_tabel
      const normalizedJudulTabel = (!rawJudulTabel || rawJudulTabel === 'BA Tutup Tagihan')
        ? defaultBaJudul
        : rawJudulTabel

      const rawJudulNominal = found.judul_nominal
      const normalizedJudulNominal = (!rawJudulNominal || rawJudulNominal === 'Nominal BA Tutup Tagihan')
        ? defaultJudulNominal
        : rawJudulNominal

      return {
        ...found,
        header_text: found.header_text || defaultBaHeader,
        judul_jenis_tagihan: found.judul_jenis_tagihan || defaultJudulJenisTagihan,
        jenis_tagihan_items: found.jenis_tagihan_items !== undefined ? found.jenis_tagihan_items : [],
        keterangan_jenis_tagihan: found.keterangan_jenis_tagihan || defaultKetJenisTagihan,
        judul_tabel: normalizedJudulTabel,
        keterangan: found.keterangan || defaultBaKet,
        months: found.months || [],
        judul_nominal: normalizedJudulNominal,
        keterangan_nominal: found.keterangan_nominal || defaultKetNominal,
        months_nominal: found.months_nominal || []
      }
    }
    return {
      tahun: year,
      header_text: defaultBaHeader,
      judul_jenis_tagihan: defaultJudulJenisTagihan,
      jenis_tagihan_items: [],
      keterangan_jenis_tagihan: defaultKetJenisTagihan,
      judul_tabel: defaultBaJudul,
      keterangan: defaultBaKet,
      months: [],
      judul_nominal: defaultJudulNominal,
      keterangan_nominal: defaultKetNominal,
      months_nominal: []
    }
  }

  const yearBaData = useMemo(() => getBaYearData(selectedYearBa), [initialBaDataList, selectedYearBa])

  // ================= DATA SECTION 1: JENIS TAGIHAN =================
  const jenisTagihanItems = useMemo(() => {
    return (yearBaData.jenis_tagihan_items !== undefined)
      ? yearBaData.jenis_tagihan_items
      : []
  }, [yearBaData])

  const totalJenisTagihanPenyedia = useMemo(() => {
    return jenisTagihanItems.reduce((acc, it) => acc + (it.jumlah_penyedia ?? it.jumlah ?? 0), 0)
  }, [jenisTagihanItems])

  const totalJenisTagihanTerbitBa = useMemo(() => {
    return jenisTagihanItems.reduce((acc, it) => acc + (it.sudah_terbit_ba ?? 0), 0)
  }, [jenisTagihanItems])

  const totalJenisTagihan = totalJenisTagihanPenyedia

  // ================= DATA SECTION 2: BA TUTUP TAGIHAN (PENYEDIA) =================
  const baTableData = useMemo(() => {
    return yearBaData.months
      .filter(m => selectedMonthsBa.includes(m.bulan))
      .filter(m => m.has_data || m.total_penyedia > 0 || m.belum_dikonfirmasi > 0 || m.proses_penagihan > 0 || m.proses_pembuatan_ba > 0 || m.sudah_terbit_ba > 0)
  }, [yearBaData, selectedMonthsBa])

  const [selectedBaMonthRow, setSelectedBaMonthRow] = useState<string | null>(null)

  // Periode aktif untuk highlight dan tampilan pie chart (secara default adalah periode terakhir/terbaru yang diinput)
  const activeBaRow = useMemo(() => {
    if (!baTableData || baTableData.length === 0) return null
    if (selectedBaMonthRow) {
      const found = baTableData.find(r => r.bulan === selectedBaMonthRow)
      if (found) return found
    }
    return baTableData[baTableData.length - 1]
  }, [baTableData, selectedBaMonthRow])

  const baTotals = useMemo(() => {
    if (baTableData.length === 0) {
      return {
        total_penyedia: 0,
        belum_dikonfirmasi: 0,
        proses_penagihan: 0,
        proses_pembuatan_ba: 0,
        sudah_terbit_ba: 0,
      }
    }
    return baTableData.reduce((acc, m) => ({
      total_penyedia: acc.total_penyedia + (m.total_penyedia || 0),
      belum_dikonfirmasi: acc.belum_dikonfirmasi + (m.belum_dikonfirmasi || 0),
      proses_penagihan: acc.proses_penagihan + (m.proses_penagihan || 0),
      proses_pembuatan_ba: acc.proses_pembuatan_ba + (m.proses_pembuatan_ba || 0),
      sudah_terbit_ba: acc.sudah_terbit_ba + (m.sudah_terbit_ba || 0),
    }), {
      total_penyedia: 0,
      belum_dikonfirmasi: 0,
      proses_penagihan: 0,
      proses_pembuatan_ba: 0,
      sudah_terbit_ba: 0,
    })
  }, [baTableData])

  const baLineChartData = useMemo(() => {
    return baTableData.map(m => ({
      bulan: m.bulan,
      bulanSingkat: BULAN_SINGKAT[m.bulan_num - 1] || m.bulan.substring(0, 3),
      total_penyedia: m.total_penyedia || 0,
      belum_dikonfirmasi: m.belum_dikonfirmasi || 0,
      proses_penagihan: m.proses_penagihan || 0,
      proses_pembuatan_ba: m.proses_pembuatan_ba || 0,
      sudah_terbit_ba: m.sudah_terbit_ba || 0,
    }))
  }, [baTableData])

  // Section 2: Line Chart Progres Persentase (Target 100%)
  const baProgressLineChartData = useMemo(() => {
    return baTableData.map(m => {
      const total = m.total_penyedia || 0
      const terbit = m.sudah_terbit_ba || 0
      const pct = total > 0 ? (terbit / total) * 100 : 0
      return {
        bulan: m.bulan,
        bulanSingkat: BULAN_SINGKAT[m.bulan_num - 1] || m.bulan.substring(0, 3),
        totalRaw: total,
        terbitRaw: terbit,
        totalPct: 100,
        terbitPct: Number(pct.toFixed(1)),
      }
    })
  }, [baTableData])

  // ================= DATA SECTION 3: NOMINAL BA TUTUP TAGIHAN (TRANSAKSI) =================
  const [selectedNominalMonthRow, setSelectedNominalMonthRow] = useState<string | null>(null)

  const nominalTableData = useMemo(() => {
    return (yearBaData.months_nominal || [])
      .filter(m => selectedMonthsNominal.includes(m.bulan))
      .filter(m => m.has_data || m.total_penyedia > 0 || m.belum_dikonfirmasi > 0 || m.proses_penagihan > 0 || m.proses_pembuatan_ba > 0 || m.sudah_terbit_ba > 0)
  }, [yearBaData, selectedMonthsNominal])

  const activeNominalRow = useMemo(() => {
    if (!nominalTableData || nominalTableData.length === 0) return null
    if (selectedNominalMonthRow) {
      const found = nominalTableData.find(r => r.bulan === selectedNominalMonthRow)
      if (found) return found
    }
    return nominalTableData[nominalTableData.length - 1]
  }, [nominalTableData, selectedNominalMonthRow])

  const nominalTotals = useMemo(() => {
    if (nominalTableData.length === 0) {
      return {
        total_penyedia: 0,
        belum_dikonfirmasi: 0,
        proses_penagihan: 0,
        proses_pembuatan_ba: 0,
        sudah_terbit_ba: 0,
      }
    }
    return nominalTableData.reduce((acc, m) => ({
      total_penyedia: acc.total_penyedia + (m.total_penyedia || 0),
      belum_dikonfirmasi: acc.belum_dikonfirmasi + (m.belum_dikonfirmasi || 0),
      proses_penagihan: acc.proses_penagihan + (m.proses_penagihan || 0),
      proses_pembuatan_ba: acc.proses_pembuatan_ba + (m.proses_pembuatan_ba || 0),
      sudah_terbit_ba: acc.sudah_terbit_ba + (m.sudah_terbit_ba || 0),
    }), {
      total_penyedia: 0,
      belum_dikonfirmasi: 0,
      proses_penagihan: 0,
      proses_pembuatan_ba: 0,
      sudah_terbit_ba: 0,
    })
  }, [nominalTableData])

  const nominalLineChartData = useMemo(() => {
    return nominalTableData.map(m => ({
      bulan: m.bulan,
      bulanSingkat: BULAN_SINGKAT[m.bulan_num - 1] || m.bulan.substring(0, 3),
      total_penyedia: m.total_penyedia || 0,
      belum_dikonfirmasi: m.belum_dikonfirmasi || 0,
      proses_penagihan: m.proses_penagihan || 0,
      proses_pembuatan_ba: m.proses_pembuatan_ba || 0,
      sudah_terbit_ba: m.sudah_terbit_ba || 0,
    }))
  }, [nominalTableData])

  // Section 3: Line Chart Progres Persentase Nominal (Target 100%)
  const nominalProgressLineChartData = useMemo(() => {
    return nominalTableData.map(m => {
      const total = m.total_penyedia || 0
      const terbit = m.sudah_terbit_ba || 0
      const pct = total > 0 ? (terbit / total) * 100 : 0
      return {
        bulan: m.bulan,
        bulanSingkat: BULAN_SINGKAT[m.bulan_num - 1] || m.bulan.substring(0, 3),
        totalRaw: total,
        terbitRaw: terbit,
        totalPct: 100,
        terbitPct: Number(pct.toFixed(1)),
      }
    })
  }, [nominalTableData])


  return (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes fadeSlideUp { from { opacity:0; transform: translateY(15px) } to { opacity:1; transform: translateY(0) } }
        .aFadeIn { animation: fadeIn 0.6s ease both }
        .animate-fadeSlideUp { animation: fadeSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards }
        .rowHover { transition: background .15s }
        .rowHover:hover { background: #eef9fa !important }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#f4f6f8', fontFamily: '"TeX Gyre Bonum", Georgia, serif' }}>
        {/* Hero Header */}
        <div style={{
          position: 'relative', height: 280,
          background: 'linear-gradient(135deg, #00282b 0%, #015a61 100%)',
          overflow: 'hidden',
        }}>
          {/* Watermark Ornamen Mandala (Kanan Atas) */}
          <img
            src="/ornament-mandala.png"
            alt=""
            className="absolute -top-10 -right-10 w-48 h-48 object-contain pointer-events-none select-none z-0"
            style={{ opacity: 0.15 }}
          />

          {/* Watermark Ornamen Sisi Kiri */}
          <img
            src="/ornament-side.png"
            alt=""
            className="absolute -left-6 sm:-left-8 top-0 bottom-0 h-full w-32 sm:w-44 object-cover object-left pointer-events-none select-none z-0 opacity-[0.08]"
            style={{ filter: 'brightness(0) invert(1)' }}
          />
          <div style={{ position: 'relative', zIndex: 1, maxWidth: 1260, margin: '0 auto', height: '100%', display: 'flex', alignItems: 'center' }} className="px-6 sm:px-10 lg:px-14">
            <div>
              <h1 style={{ fontSize: 42, fontWeight: 900, color: '#fff', lineHeight: 1.1, margin: 0, fontFamily: 'Nunito, sans-serif' }}>
                Akuntansi Verifikasi
              </h1>
              <div style={{ width: 70, height: 4, background: '#d0db41', borderRadius: 2, marginTop: 16 }} />
            </div>
          </div>
        </div>

        {/* Main Section */}
        <div style={{ maxWidth: 1260, margin: '0 auto', position: 'relative', top: -40, zIndex: 20 }} className="px-6 sm:px-10 lg:px-14">
          
          {/* Category Tabs Switcher (Dokumen Tagihan, SLA, BA Tutup Tagihan) */}
          <div className="flex justify-center mb-8 relative z-30">
            <div className="bg-white p-2 sm:p-2.5 rounded-2xl shadow-xl border border-gray-200 flex items-center gap-2 flex-wrap relative z-30">
              {[
                { id: 'dokumen_tagihan', label: 'Dokumen Tagihan', icon: FileCheck },
                { id: 'sla', label: 'SLA', icon: Clock },
                { id: 'ba_tutup_tagihan', label: 'BA Tutup Tagihan', icon: FileText },
              ].map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`group flex items-center gap-2.5 px-6 sm:px-7 py-3 sm:py-3.5 rounded-xl font-nav font-bold text-sm sm:text-base transition-all duration-200 cursor-pointer select-none relative z-10 ${
                      isActive
                        ? 'text-white shadow-md scale-[1.02]'
                        : 'text-gray-600 hover:text-[#00282b] hover:bg-gray-100 active:scale-95'
                    }`}
                    style={isActive ? { background: '#00282b' } : {}}
                  >
                    <Icon size={18} className="transition-transform duration-200 group-hover:scale-110" style={{ color: isActive ? '#01bcce' : '#64748b' }} />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* ================= SECTION: DOKUMEN TAGIHAN ================= */}
          {activeTab === 'dokumen_tagihan' && (
            <div className="space-y-8 pb-16">
              
              {/* POINT 1: Header Text Box (Penjelasan Singkat) */}
              <div style={{
                background: 'linear-gradient(135deg, #00282b 0%, #015a61 100%)', borderRadius: 20, padding: '24px 28px',
                boxShadow: '0 12px 40px rgba(0,40,43,.25)', border: '1px solid rgba(1,188,206,0.3)',
                marginBottom: 28, position: 'relative', overflow: 'hidden'
              }}>
                <img
                  src="/ornament-mandala.png"
                  alt=""
                  className="absolute -top-10 -right-10 w-40 h-40 object-contain pointer-events-none select-none z-0"
                  style={{ opacity: 0.15 }}
                />
                <div className="relative z-10 flex items-start gap-4">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                       style={{ background: 'rgba(208,219,65,0.18)', color: '#d0db41' }}>
                    <Info size={22} />
                  </div>
                  <div>
                    <h3 className="font-nav font-black text-base" style={{ color: '#d0db41' }}>
                      Verifikasi Dokumen Tagihan RSCM
                    </h3>
                    <p className="font-nav text-xs sm:text-sm text-white/90 mt-1 leading-relaxed">
                      {yearData.header_text || 'Layanan verifikasi dokumen tagihan keuangan RSCM memastikan kelengkapan, keabsahan, dan kepatuhan administrasi tagihan internal maupun eksternal sebelum dilakukan proses pembayaran.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* BOX 1: DOKUMEN TAGIHAN KESELURUHAN */}
              <div style={{
                background: 'linear-gradient(135deg, #00282b 0%, #015a61 100%)', borderRadius: 20, padding: '32px 32px',
                boxShadow: '0 12px 40px rgba(0,40,43,.25)', border: '1px solid rgba(1,188,206,0.3)',
                marginBottom: 32, position: 'relative', overflow: 'hidden'
              }}>
                {/* Watermark Ornamen Mandala (Kanan Atas) */}
                <img
                  src="/ornament-mandala.png"
                  alt=""
                  className="absolute -top-12 -right-12 w-52 h-52 object-contain pointer-events-none select-none z-0"
                  style={{ opacity: 0.15 }}
                />

                {/* Watermark Ornamen Sisi Kiri (Diperbesar) */}
                <img
                  src="/ornament-side.png"
                  alt=""
                  className="absolute -left-6 sm:-left-7 md:-left-8 top-0 bottom-0 h-full w-36 sm:w-44 md:w-52 object-cover object-left opacity-[0.08] pointer-events-none select-none z-0"
                  style={{ filter: 'brightness(0) invert(1)' }}
                />

                <div className="relative z-10">
                  {/* Header: Judul di Tengah & Periode Tahun di Ujung Kanan */}
                  <div className="relative mb-6">
                    <div className="text-center">
                      <div style={{ width: 40, height: 3.5, background: '#d0db41', borderRadius: 2, margin: '0 auto 6px' }} />
                      <h2 style={{ fontFamily: 'Nunito, sans-serif', fontSize: 24, fontWeight: 900, color: '#d0db41', margin: 0, letterSpacing: '-0.3px', lineHeight: 1.2, textShadow: '0 2px 10px rgba(208,219,65,0.25)' }}>
                        Dokumen Tagihan Keseluruhan
                      </h2>
                    </div>
                    {/* Filter Tahun di Ujung Kanan */}
                    <div className="sm:absolute sm:right-0 sm:top-1/2 sm:-translate-y-1/2 mt-3 sm:mt-0 flex justify-center">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, ...sel, background: '#ffffff', borderColor: '#e2e8f0' }}>
                        <Calendar size={15} style={{ color: '#268484' }} />
                        <span style={{ fontSize: 12, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Tahun:</span>
                        <select
                          value={selectedYear}
                          onChange={e => setSelectedYear(parseInt(e.target.value))}
                          style={{ background: 'transparent', border: 'none', outline: 'none', fontWeight: 800, color: '#00282b', cursor: 'pointer', fontFamily: 'Nunito, sans-serif', fontSize: 13 }}
                        >
                          {availableYears.map(y => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* FILTER PERIODE TAHUNAN, KUARTAL, DAN SEMESTER */}
                  <PeriodePresetFilter
                    selectedMonths={selectedMonthsKeseluruhan}
                    onChange={setSelectedMonthsKeseluruhan}
                    onApplyToAll={applyKeseluruhanToAll}
                  />

                  {/* 2-Column Grid: Tabel & Textbox di Kiri, Pie Chart di Kanan */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Kolom Kiri: Tabel + Text Box di Bawahnya (6 Kolom) */}
                    <div className="lg:col-span-6 flex flex-col gap-4">
                      {/* Tabel Dokumen Tagihan Keseluruhan */}
                      <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm bg-white">
                        <table className="w-full text-left font-nav text-xs sm:text-sm border-collapse">
                          {/* Row Header Sesuai Desain #008080 */}
                          <thead style={{ background: '#008080' }}>
                            <tr>
                              <th style={{ padding: '12px 14px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.2)', borderBottom: '2px solid rgba(0,0,0,0.1)', fontFamily: 'Nunito, sans-serif', fontSize: 11, fontWeight: 800, color: '#ffffff', textTransform: 'uppercase' }}>
                                <div className="inline-flex items-center justify-center gap-1.5 text-white">
                                  <span>Periode</span>
                                  <ExcelPeriodFilterHeader
                                    selectedMonths={selectedMonthsKeseluruhan}
                                    onChange={setSelectedMonthsKeseluruhan}
                                    onApplyToAll={applyKeseluruhanToAll}
                                    tableName="Dokumen Keseluruhan"
                                  />
                                </div>
                              </th>
                              <th style={{ padding: '12px 14px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.2)', borderBottom: '2px solid rgba(0,0,0,0.1)', fontFamily: 'Nunito, sans-serif', fontSize: 11, fontWeight: 800, color: '#ffffff', textTransform: 'uppercase' }}>
                                Jumlah Dokumen
                              </th>
                              <th style={{ padding: '12px 14px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.2)', borderBottom: '2px solid rgba(0,0,0,0.1)', fontFamily: 'Nunito, sans-serif', fontSize: 11, fontWeight: 800, color: '#ffffff', textTransform: 'uppercase' }}>
                                Proses Verifikasi
                              </th>
                              <th style={{ padding: '12px 14px', textAlign: 'center', borderBottom: '2px solid rgba(0,0,0,0.1)', fontFamily: 'Nunito, sans-serif', fontSize: 11, fontWeight: 800, color: '#ffffff', textTransform: 'uppercase' }}>
                                Lolos Verifikasi
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {keseluruhanTableData.length === 0 ? (
                              <tr>
                                <td colSpan={4} className="py-8 text-center text-gray-400 font-bold text-xs">
                                  Belum ada data dokumen tagihan yang diinput untuk tahun ini.
                                </td>
                              </tr>
                            ) : (
                              keseluruhanTableData.map((row, idx) => (
                                <tr key={row.bulan} className="rowHover" style={{ background: idx % 2 === 0 ? '#ffffff' : '#fafbfc' }}>
                                  <td style={{ padding: '3px 12px', textAlign: 'left', borderRight: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0', fontFamily: 'Nunito, sans-serif', fontSize: 12, fontWeight: 700, color: '#00282b', lineHeight: 1.25 }}>
                                    {row.bulan}
                                  </td>
                                  <td style={{ padding: '3px 12px', textAlign: 'center', borderRight: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0', fontFamily: 'Nunito, sans-serif', fontSize: 12, fontWeight: 700, color: '#00282b', lineHeight: 1.25 }}>
                                    {row.jumlah_dokumen.toLocaleString('id-ID')}
                                  </td>
                                  <td style={{ padding: '3px 12px', textAlign: 'center', borderRight: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0', fontFamily: 'Nunito, sans-serif', fontSize: 12, fontWeight: 700, color: '#00282b', lineHeight: 1.25 }}>
                                    {row.proses.toLocaleString('id-ID')}
                                  </td>
                                  <td style={{ padding: '3px 12px', textAlign: 'center', borderBottom: '1px solid #f0f0f0', fontFamily: 'Nunito, sans-serif', fontSize: 12, fontWeight: 700, color: '#00282b', lineHeight: 1.25 }}>
                                    {row.lolos.toLocaleString('id-ID')}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                          {/* Row Jumlah */}
                          {keseluruhanTableData.length > 0 && (
                            <tfoot style={{ background: '#f8fafc', borderTop: '2px solid #00282b', fontWeight: 800 }}>
                              <tr>
                                <td style={{ padding: '6px 12px', textAlign: 'center', borderRight: '1px solid #eee', color: '#00282b', fontWeight: 900, textTransform: 'uppercase', fontSize: 12 }}>
                                  Jumlah
                                </td>
                                <td style={{ padding: '6px 12px', textAlign: 'center', borderRight: '1px solid #eee', color: '#00282b', fontWeight: 900, fontSize: 13 }}>
                                  {keseluruhanTotal.jumlah_dokumen.toLocaleString('id-ID')}
                                </td>
                                <td style={{ padding: '6px 12px', textAlign: 'center', borderRight: '1px solid #eee', color: '#00282b', fontWeight: 900, fontSize: 13 }}>
                                  {keseluruhanTotal.proses.toLocaleString('id-ID')}
                                </td>
                                <td style={{ padding: '6px 12px', textAlign: 'center', color: '#00282b', fontWeight: 900, fontSize: 13 }}>
                                  {keseluruhanTotal.lolos.toLocaleString('id-ID')}
                                </td>
                              </tr>
                            </tfoot>
                          )}
                        </table>
                      </div>

                      {/* Text Box Catatan di Bawah Tabel (Format Sebelumnya: Tanpa Judul, Sesuai Panjang Kalimat) */}
                      <div className="w-full bg-white rounded-2xl p-3.5 sm:p-4 border border-gray-200 shadow-xs font-nav flex items-start gap-3 transition-all">
                        <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                             style={{ background: 'rgba(38,132,132,0.12)', color: '#268484' }}>
                          <FileText size={15} />
                        </div>
                        <div className="flex-1">
                          <p className="font-nav text-xs sm:text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                            {yearData.keterangan_keseluruhan}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Kolom Kanan: Line Chart (6 Kolom, h-full agar simetris sempurna) */}
                    <div className="lg:col-span-6 h-full flex flex-col justify-between">
                      <VerifikasiLineChart
                        data={keseluruhanLineChartData}
                        title="Tren Dokumen Tagihan Keseluruhan"
                        periodeLabel={formatPeriodeLabel(selectedMonthsKeseluruhan)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* BOX 2: DOKUMEN TAGIHAN INTERNAL */}
              <div style={{
                background: 'linear-gradient(135deg, #00282b 0%, #015a61 100%)', borderRadius: 20, padding: '32px 32px',
                boxShadow: '0 12px 40px rgba(0,40,43,.25)', border: '1px solid rgba(1,188,206,0.3)',
                marginBottom: 32, position: 'relative', overflow: 'hidden'
              }}>
                {/* Watermark Ornamen Mandala (Kanan Atas) */}
                <img
                  src="/ornament-mandala.png"
                  alt=""
                  className="absolute -top-12 -right-12 w-52 h-52 object-contain pointer-events-none select-none z-0"
                  style={{ opacity: 0.15 }}
                />

                {/* Watermark Ornamen Sisi Kiri (Diperbesar) */}
                <img
                  src="/ornament-side.png"
                  alt=""
                  className="absolute -left-6 sm:-left-7 md:-left-8 top-0 bottom-0 h-full w-36 sm:w-44 md:w-52 object-cover object-left opacity-[0.08] pointer-events-none select-none z-0"
                  style={{ filter: 'brightness(0) invert(1)' }}
                />

                <div className="relative z-10">
                  {/* Header: Judul di Tengah & Periode Tahun di Ujung Kanan */}
                  <div className="relative mb-6">
                    <div className="text-center">
                      <div style={{ width: 40, height: 3.5, background: '#d0db41', borderRadius: 2, margin: '0 auto 6px' }} />
                      <h2 style={{ fontFamily: 'Nunito, sans-serif', fontSize: 24, fontWeight: 900, color: '#d0db41', margin: 0, letterSpacing: '-0.3px', lineHeight: 1.2, textShadow: '0 2px 10px rgba(208,219,65,0.25)' }}>
                        Dokumen Tagihan Internal
                      </h2>
                    </div>
                    {/* Filter Tahun di Ujung Kanan */}
                    <div className="sm:absolute sm:right-0 sm:top-1/2 sm:-translate-y-1/2 mt-3 sm:mt-0 flex justify-center">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, ...sel, background: '#ffffff', borderColor: '#e2e8f0' }}>
                        <Calendar size={15} style={{ color: '#d0db41' }} />
                        <span style={{ fontSize: 12, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Tahun:</span>
                        <select
                          value={selectedYear}
                          onChange={e => setSelectedYear(parseInt(e.target.value))}
                          style={{ background: 'transparent', border: 'none', outline: 'none', fontWeight: 800, color: '#00282b', cursor: 'pointer', fontFamily: 'Nunito, sans-serif', fontSize: 13 }}
                        >
                          {availableYears.map(y => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* FILTER PERIODE TAHUNAN, KUARTAL, DAN SEMESTER */}
                  <PeriodePresetFilter
                    selectedMonths={selectedMonthsInternal}
                    onChange={setSelectedMonthsInternal}
                    onApplyToAll={applyInternalToAll}
                  />

                  {/* 2-Column Grid: Tabel & Textbox di Kiri, Line Chart di Kanan */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Kolom Kiri: Tabel + Text Box di Bawahnya (6 Kolom) */}
                    <div className="lg:col-span-6 flex flex-col gap-4">
                      {/* Tabel Dokumen Tagihan Internal */}
                      <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm bg-white">
                        <table className="w-full text-left font-nav text-xs sm:text-sm border-collapse">
                          {/* Row Header Sesuai Desain #008080 */}
                          <thead style={{ background: '#008080' }}>
                            <tr>
                              <th style={{ padding: '12px 14px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.2)', borderBottom: '2px solid rgba(0,0,0,0.1)', fontFamily: 'Nunito, sans-serif', fontSize: 11, fontWeight: 800, color: '#ffffff', textTransform: 'uppercase' }}>
                                <div className="inline-flex items-center justify-center gap-1.5 text-white">
                                  <span>Periode</span>
                                  <ExcelPeriodFilterHeader
                                    selectedMonths={selectedMonthsInternal}
                                    onChange={setSelectedMonthsInternal}
                                    onApplyToAll={applyInternalToAll}
                                    tableName="Dokumen Internal"
                                  />
                                </div>
                              </th>
                              <th style={{ padding: '12px 14px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.2)', borderBottom: '2px solid rgba(0,0,0,0.1)', fontFamily: 'Nunito, sans-serif', fontSize: 11, fontWeight: 800, color: '#ffffff', textTransform: 'uppercase' }}>
                                Jumlah Dokumen
                              </th>
                              <th style={{ padding: '12px 14px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.2)', borderBottom: '2px solid rgba(0,0,0,0.1)', fontFamily: 'Nunito, sans-serif', fontSize: 11, fontWeight: 800, color: '#ffffff', textTransform: 'uppercase' }}>
                                Proses Verifikasi
                              </th>
                              <th style={{ padding: '12px 14px', textAlign: 'center', borderBottom: '2px solid rgba(0,0,0,0.1)', fontFamily: 'Nunito, sans-serif', fontSize: 11, fontWeight: 800, color: '#ffffff', textTransform: 'uppercase' }}>
                                Lolos Verifikasi
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {internalTableData.length === 0 ? (
                              <tr>
                                <td colSpan={4} className="py-8 text-center text-gray-400 font-bold text-xs">
                                  Belum ada data dokumen tagihan internal yang diinput untuk tahun ini.
                                </td>
                              </tr>
                            ) : (
                              internalTableData.map((row, idx) => (
                                <tr key={row.bulan} className="rowHover" style={{ background: idx % 2 === 0 ? '#ffffff' : '#fafbfc' }}>
                                  <td style={{ padding: '3px 12px', textAlign: 'left', borderRight: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0', fontFamily: 'Nunito, sans-serif', fontSize: 12, fontWeight: 700, color: '#00282b', lineHeight: 1.25 }}>
                                    {row.bulan}
                                  </td>
                                  <td style={{ padding: '3px 12px', textAlign: 'center', borderRight: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0', fontFamily: 'Nunito, sans-serif', fontSize: 12, fontWeight: 700, color: '#00282b', lineHeight: 1.25 }}>
                                    {row.jumlah_dokumen.toLocaleString('id-ID')}
                                  </td>
                                  <td style={{ padding: '3px 12px', textAlign: 'center', borderRight: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0', fontFamily: 'Nunito, sans-serif', fontSize: 12, fontWeight: 700, color: '#00282b', lineHeight: 1.25 }}>
                                    {row.proses.toLocaleString('id-ID')}
                                  </td>
                                  <td style={{ padding: '3px 12px', textAlign: 'center', borderBottom: '1px solid #f0f0f0', fontFamily: 'Nunito, sans-serif', fontSize: 12, fontWeight: 700, color: '#00282b', lineHeight: 1.25 }}>
                                    {row.lolos.toLocaleString('id-ID')}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                          {/* Row Jumlah */}
                          {internalTableData.length > 0 && (
                            <tfoot style={{ background: '#f8fafc', borderTop: '2px solid #00282b', fontWeight: 800 }}>
                              <tr>
                                <td style={{ padding: '6px 12px', textAlign: 'center', borderRight: '1px solid #eee', color: '#00282b', fontWeight: 900, textTransform: 'uppercase', fontSize: 12 }}>
                                  Jumlah
                                </td>
                                <td style={{ padding: '6px 12px', textAlign: 'center', borderRight: '1px solid #eee', color: '#00282b', fontWeight: 900, fontSize: 13 }}>
                                  {internalTotal.jumlah_dokumen.toLocaleString('id-ID')}
                                </td>
                                <td style={{ padding: '6px 12px', textAlign: 'center', borderRight: '1px solid #eee', color: '#00282b', fontWeight: 900, fontSize: 13 }}>
                                  {internalTotal.proses.toLocaleString('id-ID')}
                                </td>
                                <td style={{ padding: '6px 12px', textAlign: 'center', color: '#00282b', fontWeight: 900, fontSize: 13 }}>
                                  {internalTotal.lolos.toLocaleString('id-ID')}
                                </td>
                              </tr>
                            </tfoot>
                          )}
                        </table>
                      </div>

                      {/* Text Box Catatan di Bawah Tabel (Format Sebelumnya: Tanpa Judul, Sesuai Panjang Kalimat) */}
                      <div className="w-full bg-white rounded-2xl p-3.5 sm:p-4 border border-gray-200 shadow-xs font-nav flex items-start gap-3 transition-all">
                        <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                             style={{ background: 'rgba(208,219,65,0.2)', color: '#00282b' }}>
                          <FileText size={15} />
                        </div>
                        <div className="flex-1">
                          <p className="font-nav text-xs sm:text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                            {yearData.keterangan_internal}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Kolom Kanan: Line Chart (6 Kolom, h-full agar simetris sempurna) */}
                    <div className="lg:col-span-6 h-full flex flex-col justify-between">
                      <VerifikasiLineChart
                        data={internalLineChartData}
                        title="Tren Dokumen Tagihan Internal"
                        periodeLabel={formatPeriodeLabel(selectedMonthsInternal)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* BOX 3: DOKUMEN TAGIHAN EKSTERNAL */}
              <div style={{
                background: 'linear-gradient(135deg, #00282b 0%, #015a61 100%)', borderRadius: 20, padding: '32px 32px',
                boxShadow: '0 12px 40px rgba(0,40,43,.25)', border: '1px solid rgba(1,188,206,0.3)',
                marginBottom: 32, position: 'relative', overflow: 'hidden'
              }}>
                {/* Watermark Ornamen Mandala (Kanan Atas) */}
                <img
                  src="/ornament-mandala.png"
                  alt=""
                  className="absolute -top-12 -right-12 w-52 h-52 object-contain pointer-events-none select-none z-0"
                  style={{ opacity: 0.15 }}
                />

                {/* Watermark Ornamen Sisi Kiri (Diperbesar) */}
                <img
                  src="/ornament-side.png"
                  alt=""
                  className="absolute -left-6 sm:-left-7 md:-left-8 top-0 bottom-0 h-full w-36 sm:w-44 md:w-52 object-cover object-left opacity-[0.08] pointer-events-none select-none z-0"
                  style={{ filter: 'brightness(0) invert(1)' }}
                />

                <div className="relative z-10">
                  {/* Header: Judul di Tengah & Periode Tahun di Ujung Kanan */}
                  <div className="relative mb-6">
                    <div className="text-center">
                      <div style={{ width: 40, height: 3.5, background: '#d0db41', borderRadius: 2, margin: '0 auto 6px' }} />
                      <h2 style={{ fontFamily: 'Nunito, sans-serif', fontSize: 24, fontWeight: 900, color: '#d0db41', margin: 0, letterSpacing: '-0.3px', lineHeight: 1.2, textShadow: '0 2px 10px rgba(208,219,65,0.25)' }}>
                        Dokumen Tagihan Eksternal
                      </h2>
                    </div>
                    {/* Filter Tahun di Ujung Kanan */}
                    <div className="sm:absolute sm:right-0 sm:top-1/2 sm:-translate-y-1/2 mt-3 sm:mt-0 flex justify-center">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, ...sel, background: '#ffffff', borderColor: '#e2e8f0' }}>
                        <Calendar size={15} style={{ color: '#268484' }} />
                        <span style={{ fontSize: 12, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Tahun:</span>
                        <select
                          value={selectedYear}
                          onChange={e => setSelectedYear(parseInt(e.target.value))}
                          style={{ background: 'transparent', border: 'none', outline: 'none', fontWeight: 800, color: '#00282b', cursor: 'pointer', fontFamily: 'Nunito, sans-serif', fontSize: 13 }}
                        >
                          {availableYears.map(y => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* FILTER PERIODE TAHUNAN, KUARTAL, DAN SEMESTER */}
                  <PeriodePresetFilter
                    selectedMonths={selectedMonthsEksternal}
                    onChange={setSelectedMonthsEksternal}
                    onApplyToAll={applyEksternalToAll}
                  />

                  {/* 2-Column Grid: Tabel & Textbox di Kiri, Line Chart di Kanan */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Kolom Kiri: Tabel + Text Box di Bawahnya (6 Kolom) */}
                    <div className="lg:col-span-6 flex flex-col gap-4">
                      {/* Tabel Dokumen Tagihan Eksternal */}
                      <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm bg-white">
                        <table className="w-full text-left font-nav text-xs sm:text-sm border-collapse">
                          {/* Row Header Sesuai Desain #008080 */}
                          <thead style={{ background: '#008080' }}>
                            <tr>
                              <th style={{ padding: '12px 14px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.2)', borderBottom: '2px solid rgba(0,0,0,0.1)', fontFamily: 'Nunito, sans-serif', fontSize: 11, fontWeight: 800, color: '#ffffff', textTransform: 'uppercase' }}>
                                <div className="inline-flex items-center justify-center gap-1.5 text-white">
                                  <span>Periode</span>
                                  <ExcelPeriodFilterHeader
                                    selectedMonths={selectedMonthsEksternal}
                                    onChange={setSelectedMonthsEksternal}
                                    onApplyToAll={applyEksternalToAll}
                                    tableName="Dokumen Eksternal"
                                  />
                                </div>
                              </th>
                              <th style={{ padding: '12px 14px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.2)', borderBottom: '2px solid rgba(0,0,0,0.1)', fontFamily: 'Nunito, sans-serif', fontSize: 11, fontWeight: 800, color: '#ffffff', textTransform: 'uppercase' }}>
                                Jumlah Dokumen
                              </th>
                              <th style={{ padding: '12px 14px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.2)', borderBottom: '2px solid rgba(0,0,0,0.1)', fontFamily: 'Nunito, sans-serif', fontSize: 11, fontWeight: 800, color: '#ffffff', textTransform: 'uppercase' }}>
                                Proses Verifikasi
                              </th>
                              <th style={{ padding: '12px 14px', textAlign: 'center', borderBottom: '2px solid rgba(0,0,0,0.1)', fontFamily: 'Nunito, sans-serif', fontSize: 11, fontWeight: 800, color: '#ffffff', textTransform: 'uppercase' }}>
                                Lolos Verifikasi
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {eksternalTableData.length === 0 ? (
                              <tr>
                                <td colSpan={4} className="py-8 text-center text-gray-400 font-bold text-xs">
                                  Belum ada data dokumen tagihan eksternal yang diinput untuk tahun ini.
                                </td>
                              </tr>
                            ) : (
                              eksternalTableData.map((row, idx) => (
                                <tr key={row.bulan} className="rowHover" style={{ background: idx % 2 === 0 ? '#ffffff' : '#fafbfc' }}>
                                  <td style={{ padding: '3px 12px', textAlign: 'left', borderRight: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0', fontFamily: 'Nunito, sans-serif', fontSize: 12, fontWeight: 700, color: '#00282b', lineHeight: 1.25 }}>
                                    {row.bulan}
                                  </td>
                                  <td style={{ padding: '3px 12px', textAlign: 'center', borderRight: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0', fontFamily: 'Nunito, sans-serif', fontSize: 12, fontWeight: 700, color: '#00282b', lineHeight: 1.25 }}>
                                    {row.jumlah_dokumen.toLocaleString('id-ID')}
                                  </td>
                                  <td style={{ padding: '3px 12px', textAlign: 'center', borderRight: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0', fontFamily: 'Nunito, sans-serif', fontSize: 12, fontWeight: 700, color: '#00282b', lineHeight: 1.25 }}>
                                    {row.proses.toLocaleString('id-ID')}
                                  </td>
                                  <td style={{ padding: '3px 12px', textAlign: 'center', borderBottom: '1px solid #f0f0f0', fontFamily: 'Nunito, sans-serif', fontSize: 12, fontWeight: 700, color: '#00282b', lineHeight: 1.25 }}>
                                    {row.lolos.toLocaleString('id-ID')}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                          {/* Row Jumlah */}
                          {eksternalTableData.length > 0 && (
                            <tfoot style={{ background: '#f8fafc', borderTop: '2px solid #00282b', fontWeight: 800 }}>
                              <tr>
                                <td style={{ padding: '6px 12px', textAlign: 'center', borderRight: '1px solid #eee', color: '#00282b', fontWeight: 900, textTransform: 'uppercase', fontSize: 12 }}>
                                  Jumlah
                                </td>
                                <td style={{ padding: '6px 12px', textAlign: 'center', borderRight: '1px solid #eee', color: '#00282b', fontWeight: 900, fontSize: 13 }}>
                                  {eksternalTotal.jumlah_dokumen.toLocaleString('id-ID')}
                                </td>
                                <td style={{ padding: '6px 12px', textAlign: 'center', borderRight: '1px solid #eee', color: '#00282b', fontWeight: 900, fontSize: 13 }}>
                                  {eksternalTotal.proses.toLocaleString('id-ID')}
                                </td>
                                <td style={{ padding: '6px 12px', textAlign: 'center', color: '#00282b', fontWeight: 900, fontSize: 13 }}>
                                  {eksternalTotal.lolos.toLocaleString('id-ID')}
                                </td>
                              </tr>
                            </tfoot>
                          )}
                        </table>
                      </div>

                      {/* Text Box Catatan di Bawah Tabel (Format Sebelumnya: Tanpa Judul, Sesuai Panjang Kalimat) */}
                      <div className="w-full bg-white rounded-2xl p-3.5 sm:p-4 border border-gray-200 shadow-xs font-nav flex items-start gap-3 transition-all">
                        <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                             style={{ background: 'rgba(38,132,132,0.12)', color: '#268484' }}>
                          <FileText size={15} />
                        </div>
                        <div className="flex-1">
                          <p className="font-nav text-xs sm:text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                            {yearData.keterangan_eksternal}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Kolom Kanan: Line Chart (6 Kolom, h-full agar simetris sempurna) */}
                    <div className="lg:col-span-6 h-full flex flex-col justify-between">
                      <VerifikasiLineChart
                        data={eksternalLineChartData}
                        title="Tren Dokumen Tagihan Eksternal"
                        periodeLabel={formatPeriodeLabel(selectedMonthsEksternal)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* BOX 4: PERBANDINGAN DOKUMEN TAGIHAN */}
              <div style={{
                background: 'linear-gradient(135deg, #00282b 0%, #015a61 100%)', borderRadius: 20, padding: '28px 30px',
                boxShadow: '0 12px 40px rgba(0,40,43,.25)', border: '1px solid rgba(1,188,206,0.3)',
                marginBottom: 32, position: 'relative', overflow: 'hidden'
              }}>
                {/* Watermark Ornamen Mandala (Kanan Atas) */}
                <img
                  src="/ornament-mandala.png"
                  alt=""
                  className="absolute -top-12 -right-12 w-52 h-52 object-contain pointer-events-none select-none z-0"
                  style={{ opacity: 0.15 }}
                />

                {/* Watermark Ornamen Sisi Kiri (Diperbesar) */}
                <img
                  src="/ornament-side.png"
                  alt=""
                  className="absolute -left-6 sm:-left-7 md:-left-8 top-0 bottom-0 h-full w-36 sm:w-44 md:w-52 object-cover object-left opacity-[0.08] pointer-events-none select-none z-0"
                  style={{ filter: 'brightness(0) invert(1)' }}
                />

                <div className="relative z-10">
                  {/* Header: Judul di Tengah (Spasi Lebih Sempit & Rapat) */}
                  <div className="relative mb-3.5 text-center">
                    <div style={{ width: 40, height: 3.5, background: '#d0db41', borderRadius: 2, margin: '0 auto 5px' }} />
                    <h2 style={{ fontFamily: 'Nunito, sans-serif', fontSize: 21, fontWeight: 900, color: '#d0db41', margin: 0, letterSpacing: '-0.3px', lineHeight: 1.15, textShadow: '0 2px 10px rgba(208,219,65,0.25)' }}>
                      Perbandingan Dokumen Tagihan
                    </h2>
                  </div>

                  {/* FILTER DROPDOWN: BULAN & TAHUN (Tanpa Label Periode 1 & Periode 2) */}
                  <div className="bg-white rounded-2xl py-2 px-4 sm:px-5 border border-gray-200 mb-5 shadow-xs font-nav">
                    <div className="flex flex-col lg:flex-row items-center justify-center gap-3 sm:gap-4 flex-wrap">
                      {/* Dropdown List Bulan dan Tahun Periode A */}
                      <ComparisonDropdownPicker
                        year={compYearA}
                        onYearChange={setCompYearA}
                        months={compMonthsA}
                        onMonthsChange={setCompMonthsA}
                        availableYears={availableYears}
                      />

                      {/* Tulisan / Badge "Bandingkan" */}
                      <div className="flex items-center justify-center py-0.5 sm:py-0">
                        <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#00282b] text-[#01bcce] shadow-sm border border-[#01bcce]/30 select-none">
                          <ArrowRightLeft size={13} className="text-[#d0db41]" />
                          <span className="font-nav font-black text-[11px] uppercase tracking-wider text-white">
                            Bandingkan
                          </span>
                        </div>
                      </div>

                      {/* Dropdown List Bulan dan Tahun Periode B */}
                      <ComparisonDropdownPicker
                        year={compYearB}
                        onYearChange={setCompYearB}
                        months={compMonthsB}
                        onMonthsChange={setCompMonthsB}
                        availableYears={availableYears}
                      />

                      {/* Tombol Reset Perbandingan (Termasuk Tahun & Bulan) */}
                      <div className="flex items-center justify-center">
                        <button
                          type="button"
                          onClick={handleResetComparison}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-nav font-bold text-gray-600 hover:text-red-600 bg-gray-50 hover:bg-red-50 border border-gray-200 hover:border-red-200 transition-all cursor-pointer shadow-2xs"
                          title="Reset pilihan tahun dan bulan perbandingan ke kondisi awal"
                        >
                          <RotateCcw size={13} className="text-gray-400 group-hover:text-red-500" />
                          <span>Reset</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 2 CHARTS: ATAS-BAWAH (COLUMN CHART BULANAN & HORIZONTAL BAR CHART TOTAL) */}
                  <div className="flex flex-col gap-6 mb-6">
                    {/* Chart 1: Column Chart (1 Bar = Internal + Eksternal = Keseluruhan, Periode Bersampingan, Angka Internal & Eksternal di dalam bar) */}
                    <div className="w-full">
                      <VerifikasiColumnComparisonChart
                        title="Perbandingan Dokumen Tagihan"
                        labelA={labelA}
                        labelB={labelB}
                        yearA={compYearA}
                        yearB={compYearB}
                        items={comparisonItems}
                        colorInternal="#01bcce"
                        colorEksternal="#268484"
                      />
                    </div>

                    {/* Chart 2: Horizontal Bar Chart (2 Bar Stacked: Internal + Eksternal = Keseluruhan per Periode, Lebih Lebar) */}
                    <div className="w-full">
                      <VerifikasiHorizontalBarComparisonChart
                        title="Perbandingan Total Dokumen Tagihan"
                        labelA={labelA}
                        labelB={labelB}
                        internalA={totalCompInternalA}
                        eksternalA={totalCompEksternalA}
                        keseluruhanA={totalCompKeseluruhanA}
                        internalB={totalCompInternalB}
                        eksternalB={totalCompEksternalB}
                        keseluruhanB={totalCompKeseluruhanB}
                        colorInternal="#01bcce"
                        colorEksternal="#268484"
                      />
                    </div>
                  </div>

                  {/* TABEL PERBANDINGAN 8 KOLOM (SESUAI GAMBAR CONTOH) */}
                  <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-xs mb-4 font-nav">
                    <div className="pb-2.5 mb-3 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <h3 className="font-nav font-black text-sm sm:text-base text-[#00282b] leading-tight">
                          Tabel Perbandingan Dokumen Tagihan
                        </h3>
                        {labelA && labelB ? (
                          <p className="font-nav text-xs font-bold text-gray-400 mt-0.5">
                            {labelA} <span className="font-normal text-gray-300">vs</span> {labelB}
                          </p>
                        ) : labelA || labelB ? (
                          <p className="font-nav text-xs font-bold text-gray-400 mt-0.5">
                            {labelA || labelB}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-xs bg-white">
                      <table className="w-full text-left font-nav text-xs border-collapse">
                        {/* Header 8 Kolom: 4 Kolom Periode A + 4 Kolom Periode B */}
                        <thead style={{ background: '#008080' }}>
                          <tr>
                            <th style={{ padding: '11px 14px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.2)', borderBottom: '2px solid rgba(0,0,0,0.1)', fontFamily: 'Nunito, sans-serif', fontSize: 11, fontWeight: 800, color: '#ffffff', textTransform: 'uppercase' }}>
                              Periode
                            </th>
                            <th style={{ padding: '11px 14px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.2)', borderBottom: '2px solid rgba(0,0,0,0.1)', fontFamily: 'Nunito, sans-serif', fontSize: 11, fontWeight: 800, color: '#ffffff', textTransform: 'uppercase' }}>
                              Internal
                            </th>
                            <th style={{ padding: '11px 14px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.2)', borderBottom: '2px solid rgba(0,0,0,0.1)', fontFamily: 'Nunito, sans-serif', fontSize: 11, fontWeight: 800, color: '#ffffff', textTransform: 'uppercase' }}>
                              Eksternal
                            </th>
                            <th style={{ padding: '11px 14px', textAlign: 'center', borderRight: '2px solid #00282b', borderBottom: '2px solid rgba(0,0,0,0.1)', fontFamily: 'Nunito, sans-serif', fontSize: 11, fontWeight: 800, color: '#ffffff', textTransform: 'uppercase' }}>
                              Keseluruhan
                            </th>
                            <th style={{ padding: '11px 14px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.2)', borderBottom: '2px solid rgba(0,0,0,0.1)', fontFamily: 'Nunito, sans-serif', fontSize: 11, fontWeight: 800, color: '#ffffff', textTransform: 'uppercase' }}>
                              Periode
                            </th>
                            <th style={{ padding: '11px 14px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.2)', borderBottom: '2px solid rgba(0,0,0,0.1)', fontFamily: 'Nunito, sans-serif', fontSize: 11, fontWeight: 800, color: '#ffffff', textTransform: 'uppercase' }}>
                              Internal
                            </th>
                            <th style={{ padding: '11px 14px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.2)', borderBottom: '2px solid rgba(0,0,0,0.1)', fontFamily: 'Nunito, sans-serif', fontSize: 11, fontWeight: 800, color: '#ffffff', textTransform: 'uppercase' }}>
                              Eksternal
                            </th>
                            <th style={{ padding: '11px 14px', textAlign: 'center', borderBottom: '2px solid rgba(0,0,0,0.1)', fontFamily: 'Nunito, sans-serif', fontSize: 11, fontWeight: 800, color: '#ffffff', textTransform: 'uppercase' }}>
                              Keseluruhan
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {(!compMonthsA.length && !compMonthsB.length) ? (
                            <tr>
                              <td colSpan={8} className="py-6 text-center text-gray-400 font-bold text-xs">
                                Silakan pilih bulan pada periode perbandingan di atas untuk menampilkan data.
                              </td>
                            </tr>
                          ) : comparisonItems.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="py-6 text-center text-gray-400 font-bold text-xs">
                                Belum ada data dokumen tagihan yang diinput untuk periode ini.
                              </td>
                            </tr>
                          ) : (
                            comparisonItems.map((row, idx) => (
                              <tr key={row.bulan} className="rowHover" style={{ background: idx % 2 === 0 ? '#ffffff' : '#fafbfc' }}>
                                {/* Periode A */}
                                <td style={{ padding: '5px 14px', textAlign: 'left', borderRight: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0', fontFamily: 'Nunito, sans-serif', fontSize: 12, fontWeight: 700, color: '#00282b' }}>
                                  {row.isIncludedA ? `${row.bulanSingkat} ${compYearA}` : '-'}
                                </td>
                                <td style={{ padding: '5px 14px', textAlign: 'center', borderRight: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0', fontFamily: 'Nunito, sans-serif', fontSize: 12, fontWeight: 700, color: '#00282b' }}>
                                  {row.isIncludedA ? row.internalA.toLocaleString('id-ID') : '-'}
                                </td>
                                <td style={{ padding: '5px 14px', textAlign: 'center', borderRight: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0', fontFamily: 'Nunito, sans-serif', fontSize: 12, fontWeight: 700, color: '#00282b' }}>
                                  {row.isIncludedA ? row.eksternalA.toLocaleString('id-ID') : '-'}
                                </td>
                                <td style={{ padding: '5px 14px', textAlign: 'center', borderRight: '2px solid #00282b', borderBottom: '1px solid #f0f0f0', fontFamily: 'Nunito, sans-serif', fontSize: 12, fontWeight: 800, color: '#00282b', background: idx % 2 === 0 ? '#f0fdfa' : '#e6fffa' }}>
                                  {row.isIncludedA ? row.keseluruhanA.toLocaleString('id-ID') : '-'}
                                </td>

                                {/* Periode B */}
                                <td style={{ padding: '5px 14px', textAlign: 'left', borderRight: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0', fontFamily: 'Nunito, sans-serif', fontSize: 12, fontWeight: 700, color: '#00282b' }}>
                                  {row.isIncludedB ? `${row.bulanSingkat} ${compYearB}` : '-'}
                                </td>
                                <td style={{ padding: '5px 14px', textAlign: 'center', borderRight: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0', fontFamily: 'Nunito, sans-serif', fontSize: 12, fontWeight: 700, color: '#00282b' }}>
                                  {row.isIncludedB ? row.internalB.toLocaleString('id-ID') : '-'}
                                </td>
                                <td style={{ padding: '5px 14px', textAlign: 'center', borderRight: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0', fontFamily: 'Nunito, sans-serif', fontSize: 12, fontWeight: 700, color: '#00282b' }}>
                                  {row.isIncludedB ? row.eksternalB.toLocaleString('id-ID') : '-'}
                                </td>
                                <td style={{ padding: '5px 14px', textAlign: 'center', borderBottom: '1px solid #f0f0f0', fontFamily: 'Nunito, sans-serif', fontSize: 12, fontWeight: 800, color: '#00282b', background: idx % 2 === 0 ? '#f0fdfa' : '#e6fffa' }}>
                                  {row.isIncludedB ? row.keseluruhanB.toLocaleString('id-ID') : '-'}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                        {(totalCompInternalA > 0 || totalCompEksternalA > 0 || totalCompInternalB > 0 || totalCompEksternalB > 0) && (
                          <tfoot style={{ background: '#f8fafc', borderTop: '2px solid #00282b', fontWeight: 800 }}>
                            <tr>
                              <td style={{ padding: '8px 14px', textAlign: 'left', borderRight: '1px solid #eee', color: '#00282b', fontWeight: 900, fontSize: 12 }}>
                                Total
                              </td>
                              <td style={{ padding: '8px 14px', textAlign: 'center', borderRight: '1px solid #eee', color: '#01bcce', fontWeight: 900, fontSize: 13 }}>
                                {totalCompInternalA.toLocaleString('id-ID')}
                              </td>
                              <td style={{ padding: '8px 14px', textAlign: 'center', borderRight: '1px solid #eee', color: '#268484', fontWeight: 900, fontSize: 13 }}>
                                {totalCompEksternalA.toLocaleString('id-ID')}
                              </td>
                              <td style={{ padding: '8px 14px', textAlign: 'center', borderRight: '2px solid #00282b', color: '#00282b', fontWeight: 900, fontSize: 13, background: '#e6fffa' }}>
                                {totalCompKeseluruhanA.toLocaleString('id-ID')}
                              </td>
                              <td style={{ padding: '8px 14px', textAlign: 'left', borderRight: '1px solid #eee', color: '#00282b', fontWeight: 900, fontSize: 12 }}>
                                Total
                              </td>
                              <td style={{ padding: '8px 14px', textAlign: 'center', borderRight: '1px solid #eee', color: '#01bcce', fontWeight: 900, fontSize: 13 }}>
                                {totalCompInternalB.toLocaleString('id-ID')}
                              </td>
                              <td style={{ padding: '8px 14px', textAlign: 'center', borderRight: '1px solid #eee', color: '#268484', fontWeight: 900, fontSize: 13 }}>
                                {totalCompEksternalB.toLocaleString('id-ID')}
                              </td>
                              <td style={{ padding: '8px 14px', textAlign: 'center', color: '#00282b', fontWeight: 900, fontSize: 13, background: '#e6fffa' }}>
                                {totalCompKeseluruhanB.toLocaleString('id-ID')}
                              </td>
                            </tr>
                          </tfoot>
                        )}
                      </table>
                    </div>
                  </div>

                  {/* Catatan di Bawah Tabel Perbandingan (Hanya jika ada catatan yang diisi) */}
                  {(globalPerbandinganInternal?.trim() || globalPerbandinganEksternal?.trim()) && (
                    <div className="w-full bg-white rounded-2xl p-3.5 sm:p-4 border border-gray-200 shadow-xs font-nav flex items-start gap-3 transition-all mt-1">
                      <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                            style={{ background: 'rgba(208,219,65,0.2)', color: '#00282b' }}>
                        <FileText size={15} />
                      </div>
                      <div className="flex-1 space-y-2">
                        {globalPerbandinganInternal?.trim() && (
                          <p className="font-nav text-xs sm:text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                            {globalPerbandinganInternal}
                          </p>
                        )}
                        {globalPerbandinganEksternal?.trim() && (
                          <p className="font-nav text-xs sm:text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                            {globalPerbandinganEksternal}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

        {/* ================= SECTION: SLA (SERVICE LEVEL AGREEMENT) ================= */}
        {activeTab === 'sla' && (
          <div className="space-y-8 pb-16 animate-fadeSlideUp">
            {/* Header Text Box (Penjelasan Singkat SLA) */}
            <div style={{
              background: 'linear-gradient(135deg, #00282b 0%, #015a61 100%)', borderRadius: 20, padding: '24px 28px',
              boxShadow: '0 12px 40px rgba(0,40,43,.25)', border: '1px solid rgba(1,188,206,0.3)',
              marginBottom: 28, position: 'relative', overflow: 'hidden'
            }}>
              <img
                src="/ornament-mandala.png"
                alt=""
                className="absolute -top-10 -right-10 w-40 h-40 object-contain pointer-events-none select-none z-0"
                style={{ opacity: 0.15 }}
              />
              <div className="relative z-10 flex items-start gap-4">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                     style={{ background: 'rgba(208,219,65,0.15)', color: '#d0db41' }}>
                  <Clock size={22} />
                </div>
                <div>
                  <h3 className="font-nav font-black text-base" style={{ color: '#d0db41', textShadow: '0 2px 10px rgba(208,219,65,0.25)' }}>
                    Service Level Agreement (SLA) Verifikasi Dokumen
                  </h3>
                  <p className="font-nav text-xs sm:text-sm text-white/90 mt-1 leading-relaxed">
                    {yearSlaData.header_text || 'Service Level Agreement (SLA) Verifikasi Dokumen Tagihan mengukur ketepatan waktu dan efektivitas proses verifikasi tagihan internal maupun eksternal sesuai standar layanan operasional RSCM.'}
                  </p>
                </div>
              </div>
            </div>

            {/* ================= SECTION 1: SLA DOKUMEN INTERNAL ================= */}
            <div style={{
              background: 'linear-gradient(135deg, #00282b 0%, #015a61 100%)', borderRadius: 20, padding: '32px 32px',
              boxShadow: '0 12px 40px rgba(0,40,43,.25)', border: '1px solid rgba(1,188,206,0.3)',
              marginBottom: 32, position: 'relative', overflow: 'hidden'
            }}>
              {/* Watermark Ornamen Mandala (Kanan Atas) */}
              <img
                src="/ornament-mandala.png"
                alt=""
                className="absolute -top-12 -right-12 w-52 h-52 object-contain pointer-events-none select-none z-0"
                style={{ opacity: 0.15 }}
              />

              {/* Watermark Ornamen Sisi Kiri */}
              <img
                src="/ornament-side.png"
                alt=""
                className="absolute -left-6 sm:-left-7 md:-left-8 top-0 bottom-0 h-full w-36 sm:w-44 md:w-52 object-cover object-left opacity-[0.08] pointer-events-none select-none z-0"
                style={{ filter: 'brightness(0) invert(1)' }}
              />

              <div className="relative z-10">
                {/* Header: Judul di Tengah & Filter Tahun di Kanan */}
                <div className="relative mb-6">
                  <div className="text-center">
                    <div style={{ width: 40, height: 3.5, background: '#d0db41', borderRadius: 2, margin: '0 auto 6px' }} />
                    <h2 style={{ fontFamily: 'Nunito, sans-serif', fontSize: 24, fontWeight: 900, color: '#d0db41', margin: 0, letterSpacing: '-0.3px', lineHeight: 1.2, textShadow: '0 2px 10px rgba(208,219,65,0.25)' }}>
                      {yearSlaData.judul_internal || defaultSlaJudulInternal}
                    </h2>
                  </div>
                  {/* Filter Tahun di Ujung Kanan */}
                  <div className="sm:absolute sm:right-0 sm:top-1/2 sm:-translate-y-1/2 mt-3 sm:mt-0 flex justify-center">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, ...sel, background: '#ffffff', borderColor: '#e2e8f0' }}>
                      <Calendar size={15} style={{ color: '#268484' }} />
                      <span style={{ fontSize: 12, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Tahun:</span>
                      <select
                        value={selectedYearSla}
                        onChange={e => setSelectedYearSla(parseInt(e.target.value))}
                        style={{ background: 'transparent', border: 'none', outline: 'none', fontWeight: 800, color: '#00282b', cursor: 'pointer', fontFamily: 'Nunito, sans-serif', fontSize: 13 }}
                      >
                        {availableSlaYears.map(y => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* FILTER PRESET PERIODE */}
                <PeriodePresetFilter
                  selectedMonths={selectedMonthsSlaInternal}
                  onChange={setSelectedMonthsSlaInternal}
                  onApplyToAll={applySlaInternalToAll}
                />

                {/* 1. LINE CHART DI BAGIAN ATAS (3 LINES) */}
                <div className="w-full mb-6">
                  <SlaSectionLineChart
                    data={slaInternalChartData}
                    title={`Tren ${yearSlaData.judul_internal || defaultSlaJudulInternal}`}
                    periodeLabel={formatPeriodeLabel(selectedMonthsSlaInternal)}
                  />
                </div>

                {/* 2. TABEL DI BAGIAN TENGAH (Format Sesuai Gambar: Kategori, Jan..Des Tanpa Rata-rata) */}
                <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-xs bg-white mb-6">
                  <table className="w-full text-left font-nav text-xs sm:text-sm border-collapse">
                    <thead style={{ background: '#008080' }}>
                      <tr>
                        <th style={{ padding: '12px 14px', textAlign: 'left', borderRight: '1px solid rgba(255,255,255,0.2)', borderBottom: '2px solid rgba(0,0,0,0.1)', fontFamily: 'Nunito, sans-serif', fontSize: 11, fontWeight: 800, color: '#ffffff', textTransform: 'uppercase', minWidth: 160 }}>
                          <div className="inline-flex items-center gap-1.5 text-white">
                            <span>Kategori</span>
                            <ExcelPeriodFilterHeader
                              selectedMonths={selectedMonthsSlaInternal}
                              onChange={setSelectedMonthsSlaInternal}
                              onApplyToAll={applySlaInternalToAll}
                              tableName={yearSlaData.judul_internal || defaultSlaJudulInternal}
                            />
                          </div>
                        </th>
                        {BULAN_TABEL_SLA.map((bln, idx) => (
                          <th
                            key={bln}
                            style={{
                              padding: '12px 8px',
                              textAlign: 'center',
                              borderRight: idx === BULAN_TABEL_SLA.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.2)',
                              borderBottom: '2px solid rgba(0,0,0,0.1)',
                              fontFamily: 'Nunito, sans-serif',
                              fontSize: 11,
                              fontWeight: 800,
                              color: '#ffffff',
                              textTransform: 'uppercase',
                              minWidth: 48,
                              opacity: selectedMonthsSlaInternal.includes(NAMA_BULAN[idx]) ? 1 : 0.65
                            }}
                          >
                            {bln}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {[slaInternalRowVerifikasi, slaInternalRowPengambilan, slaInternalRowPengembalian].map((row, rIdx) => (
                        <tr key={row.name} className="rowHover" style={{ background: rIdx % 2 === 0 ? '#ffffff' : '#fafbfc' }}>
                          <td style={{ padding: '9px 14px', textAlign: 'left', borderRight: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0', fontFamily: 'Nunito, sans-serif', fontSize: 12, fontWeight: 700, color: '#00282b' }}>
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: row.color }} />
                              <span className="font-extrabold text-[#00282b]">{row.name}</span>
                            </div>
                          </td>
                          {row.values.map((val, mIdx) => {
                            const isSelected = selectedMonthsSlaInternal.includes(NAMA_BULAN[mIdx])
                            return (
                              <td
                                key={mIdx}
                                style={{
                                  padding: '9px 6px',
                                  textAlign: 'center',
                                  borderRight: mIdx === row.values.length - 1 ? 'none' : '1px solid #f0f0f0',
                                  borderBottom: '1px solid #f0f0f0',
                                  fontFamily: 'Nunito, sans-serif',
                                  fontSize: 12,
                                  fontWeight: isSelected && val > 0 ? 800 : 600,
                                  color: !isSelected ? '#cbd5e1' : val > 0 ? '#00282b' : '#94a3b8',
                                  background: isSelected && val > 0 ? 'transparent' : !isSelected ? '#f8fafc' : 'transparent',
                                }}
                              >
                                {val > 0 ? `${val.toFixed(1)}%` : '-'}
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 3. TEXT BOX UNTUK CATATAN DI BAGIAN BAWAH */}
                <div className="w-full bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-xs font-nav flex items-start gap-3.5 transition-all">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                       style={{ background: 'rgba(1,188,206,0.12)', color: '#01bcce' }}>
                    <FileText size={16} />
                  </div>
                  <div className="flex-1">
                    <p className="font-nav text-xs sm:text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                      {yearSlaData.keterangan_internal || defaultSlaKetInternal}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ================= SECTION 2: SLA DOKUMEN EKSTERNAL ================= */}
            <div style={{
              background: 'linear-gradient(135deg, #00282b 0%, #015a61 100%)', borderRadius: 20, padding: '32px 32px',
              boxShadow: '0 12px 40px rgba(0,40,43,.25)', border: '1px solid rgba(1,188,206,0.3)',
              marginBottom: 32, position: 'relative', overflow: 'hidden'
            }}>
              {/* Watermark Ornamen Mandala (Kanan Atas) */}
              <img
                src="/ornament-mandala.png"
                alt=""
                className="absolute -top-12 -right-12 w-52 h-52 object-contain pointer-events-none select-none z-0"
                style={{ opacity: 0.15 }}
              />

              {/* Watermark Ornamen Sisi Kiri */}
              <img
                src="/ornament-side.png"
                alt=""
                className="absolute -left-6 sm:-left-7 md:-left-8 top-0 bottom-0 h-full w-36 sm:w-44 md:w-52 object-cover object-left opacity-[0.08] pointer-events-none select-none z-0"
                style={{ filter: 'brightness(0) invert(1)' }}
              />

              <div className="relative z-10">
                {/* Header: Judul di Tengah & Filter Tahun di Kanan */}
                <div className="relative mb-6">
                  <div className="text-center">
                    <div style={{ width: 40, height: 3.5, background: '#d0db41', borderRadius: 2, margin: '0 auto 6px' }} />
                    <h2 style={{ fontFamily: 'Nunito, sans-serif', fontSize: 24, fontWeight: 900, color: '#d0db41', margin: 0, letterSpacing: '-0.3px', lineHeight: 1.2, textShadow: '0 2px 10px rgba(208,219,65,0.25)' }}>
                      {yearSlaData.judul_eksternal || defaultSlaJudulEksternal}
                    </h2>
                  </div>
                  {/* Filter Tahun di Ujung Kanan */}
                  <div className="sm:absolute sm:right-0 sm:top-1/2 sm:-translate-y-1/2 mt-3 sm:mt-0 flex justify-center">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, ...sel, background: '#ffffff', borderColor: '#e2e8f0' }}>
                      <Calendar size={15} style={{ color: '#268484' }} />
                      <span style={{ fontSize: 12, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Tahun:</span>
                      <select
                        value={selectedYearSla}
                        onChange={e => setSelectedYearSla(parseInt(e.target.value))}
                        style={{ background: 'transparent', border: 'none', outline: 'none', fontWeight: 800, color: '#00282b', cursor: 'pointer', fontFamily: 'Nunito, sans-serif', fontSize: 13 }}
                      >
                        {availableSlaYears.map(y => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* FILTER PRESET PERIODE */}
                <PeriodePresetFilter
                  selectedMonths={selectedMonthsSlaEksternal}
                  onChange={setSelectedMonthsSlaEksternal}
                  onApplyToAll={applySlaEksternalToAll}
                />

                {/* 1. LINE CHART DI BAGIAN ATAS (3 LINES) */}
                <div className="w-full mb-6">
                  <SlaSectionLineChart
                    data={slaEksternalChartData}
                    title={`Tren ${yearSlaData.judul_eksternal || defaultSlaJudulEksternal}`}
                    periodeLabel={formatPeriodeLabel(selectedMonthsSlaEksternal)}
                  />
                </div>

                {/* 2. TABEL DI BAGIAN TENGAH (Format Sesuai Gambar: Kategori, Jan..Des Tanpa Rata-rata) */}
                <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-xs bg-white mb-6">
                  <table className="w-full text-left font-nav text-xs sm:text-sm border-collapse">
                    <thead style={{ background: '#008080' }}>
                      <tr>
                        <th style={{ padding: '12px 14px', textAlign: 'left', borderRight: '1px solid rgba(255,255,255,0.2)', borderBottom: '2px solid rgba(0,0,0,0.1)', fontFamily: 'Nunito, sans-serif', fontSize: 11, fontWeight: 800, color: '#ffffff', textTransform: 'uppercase', minWidth: 160 }}>
                          <div className="inline-flex items-center gap-1.5 text-white">
                            <span>Kategori</span>
                            <ExcelPeriodFilterHeader
                              selectedMonths={selectedMonthsSlaEksternal}
                              onChange={setSelectedMonthsSlaEksternal}
                              onApplyToAll={applySlaEksternalToAll}
                              tableName={yearSlaData.judul_eksternal || defaultSlaJudulEksternal}
                            />
                          </div>
                        </th>
                        {BULAN_TABEL_SLA.map((bln, idx) => (
                          <th
                            key={bln}
                            style={{
                              padding: '12px 8px',
                              textAlign: 'center',
                              borderRight: idx === BULAN_TABEL_SLA.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.2)',
                              borderBottom: '2px solid rgba(0,0,0,0.1)',
                              fontFamily: 'Nunito, sans-serif',
                              fontSize: 11,
                              fontWeight: 800,
                              color: '#ffffff',
                              textTransform: 'uppercase',
                              minWidth: 48,
                              opacity: selectedMonthsSlaEksternal.includes(NAMA_BULAN[idx]) ? 1 : 0.65
                            }}
                          >
                            {bln}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {[slaEksternalRowVerifikasi, slaEksternalRowPengambilan, slaEksternalRowPengembalian].map((row, rIdx) => (
                        <tr key={row.name} className="rowHover" style={{ background: rIdx % 2 === 0 ? '#ffffff' : '#fafbfc' }}>
                          <td style={{ padding: '9px 14px', textAlign: 'left', borderRight: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0', fontFamily: 'Nunito, sans-serif', fontSize: 12, fontWeight: 700, color: '#00282b' }}>
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: row.color }} />
                              <span className="font-extrabold text-[#00282b]">{row.name}</span>
                            </div>
                          </td>
                          {row.values.map((val, mIdx) => {
                            const isSelected = selectedMonthsSlaEksternal.includes(NAMA_BULAN[mIdx])
                            return (
                              <td
                                key={mIdx}
                                style={{
                                  padding: '9px 6px',
                                  textAlign: 'center',
                                  borderRight: mIdx === row.values.length - 1 ? 'none' : '1px solid #f0f0f0',
                                  borderBottom: '1px solid #f0f0f0',
                                  fontFamily: 'Nunito, sans-serif',
                                  fontSize: 12,
                                  fontWeight: isSelected && val > 0 ? 800 : 600,
                                  color: !isSelected ? '#cbd5e1' : val > 0 ? '#00282b' : '#94a3b8',
                                  background: isSelected && val > 0 ? 'transparent' : !isSelected ? '#f8fafc' : 'transparent',
                                }}
                              >
                                {val > 0 ? `${val.toFixed(1)}%` : '-'}
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 3. TEXT BOX UNTUK CATATAN DI BAGIAN BAWAH */}
                <div className="w-full bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-xs font-nav flex items-start gap-3.5 transition-all">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                       style={{ background: 'rgba(38,132,132,0.12)', color: '#268484' }}>
                    <FileText size={16} />
                  </div>
                  <div className="flex-1">
                    <p className="font-nav text-xs sm:text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                      {yearSlaData.keterangan_eksternal || defaultSlaKetEksternal}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= SECTION: BA TUTUP TAGIHAN ================= */}
        {activeTab === 'ba_tutup_tagihan' && (
          <div className="space-y-8 pb-16 aFadeIn">
            {/* Header Text Box Banner */}
            <div style={{
              background: 'linear-gradient(135deg, #00282b 0%, #015a61 100%)', borderRadius: 20, padding: '24px 28px',
              boxShadow: '0 12px 40px rgba(0,40,43,.25)', border: '1px solid rgba(1,188,206,0.3)',
              marginBottom: 28, position: 'relative', overflow: 'hidden'
            }}>
              <img
                src="/ornament-mandala.png"
                alt=""
                className="absolute -top-10 -right-10 w-40 h-40 object-contain pointer-events-none select-none z-0"
                style={{ opacity: 0.15 }}
              />
              <div className="relative z-10 flex items-start gap-4">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                     style={{ background: 'rgba(208,219,65,0.15)', color: '#d0db41' }}>
                  <FileText size={22} />
                </div>
                <div>
                  <h3 className="font-nav font-black text-base" style={{ color: '#d0db41', textShadow: '0 2px 10px rgba(208,219,65,0.25)' }}>
                    Berita Acara (BA) Tutup Tagihan
                  </h3>
                  <p className="font-nav text-xs sm:text-sm text-white/90 mt-1 leading-relaxed">
                    {yearBaData.header_text || 'Berita Acara (BA) Tutup Tagihan memantau rekapitulasi proses penyelesaian administrasi dan penerbitan BA tagihan penyedia di RSUPN Dr. Cipto Mangunkusumo.'}
                  </p>
                </div>
              </div>
            </div>

            {/* ================= BOX 1: JENIS TAGIHAN ================= */}
            <div style={{
              background: 'linear-gradient(135deg, #00282b 0%, #015a61 100%)', borderRadius: 20, padding: '32px 32px',
              boxShadow: '0 12px 40px rgba(0,40,43,.25)', border: '1px solid rgba(1,188,206,0.3)',
              marginBottom: 32, position: 'relative', overflow: 'hidden'
            }}>
              {/* Watermark Ornamen Mandala (Kanan Atas) */}
              <img
                src="/ornament-mandala.png"
                alt=""
                className="absolute -top-12 -right-12 w-52 h-52 object-contain pointer-events-none select-none z-0"
                style={{ opacity: 0.15 }}
              />

              {/* Watermark Ornamen Sisi Kiri (Diperbesar) */}
              <img
                src="/ornament-side.png"
                alt=""
                className="absolute -left-6 sm:-left-7 md:-left-8 top-0 bottom-0 h-full w-36 sm:w-44 md:w-52 object-cover object-left opacity-[0.08] pointer-events-none select-none z-0"
                style={{ filter: 'brightness(0) invert(1)' }}
              />

              <div className="relative z-10">
                {/* Header Box 1: Judul di Tengah & Filter Tahun di Kanan */}
                <div className="relative mb-6">
                  <div className="text-center">
                    <div style={{ width: 40, height: 3.5, background: '#d0db41', borderRadius: 2, margin: '0 auto 6px' }} />
                    <h2 style={{ fontFamily: 'Nunito, sans-serif', fontSize: 24, fontWeight: 900, color: '#d0db41', margin: 0, letterSpacing: '-0.3px', lineHeight: 1.2, textShadow: '0 2px 10px rgba(208,219,65,0.25)' }}>
                      {yearBaData.judul_jenis_tagihan || 'Jenis Tagihan'}
                    </h2>
                  </div>
                  {/* Filter Tahun di Ujung Kanan */}
                  <div className="sm:absolute sm:right-0 sm:top-1/2 sm:-translate-y-1/2 mt-3 sm:mt-0 flex justify-center">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, ...sel, background: '#ffffff', borderColor: '#e2e8f0' }}>
                      <Calendar size={15} style={{ color: '#268484' }} />
                      <span style={{ fontSize: 12, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Tahun:</span>
                      <select
                        value={selectedYearBa}
                        onChange={e => setSelectedYearBa(parseInt(e.target.value))}
                        style={{ background: 'transparent', border: 'none', outline: 'none', fontWeight: 800, color: '#00282b', cursor: 'pointer', fontFamily: 'Nunito, sans-serif', fontSize: 13 }}
                      >
                        {availableBaYears.map(y => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* CONTENT BOX 1: TABEL JENIS TAGIHAN DI KIRI & COLUMN CHART DI KANAN */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                  {/* Kolom Kiri: Tabel Jenis Tagihan (6 Kolom) */}
                  <div className="lg:col-span-6 flex flex-col justify-between gap-4">
                    <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-xs bg-white">
                      <table className="w-full text-left font-nav text-xs sm:text-sm border-collapse">
                        <thead style={{ background: '#008080' }}>
                          <tr>
                            <th style={{ padding: '12px 14px', textAlign: 'center', width: 50, borderRight: '1px solid rgba(255,255,255,0.2)', borderBottom: '2px solid rgba(0,0,0,0.1)', fontFamily: 'Nunito, sans-serif', fontSize: 11, fontWeight: 800, color: '#ffffff', textTransform: 'uppercase' }}>
                              No
                            </th>
                            <th style={{ padding: '12px 16px', textAlign: 'left', borderRight: '1px solid rgba(255,255,255,0.2)', borderBottom: '2px solid rgba(0,0,0,0.1)', fontFamily: 'Nunito, sans-serif', fontSize: 11, fontWeight: 800, color: '#ffffff', textTransform: 'uppercase' }}>
                              Jenis Tagihan
                            </th>
                            <th style={{ padding: '12px 16px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.2)', borderBottom: '2px solid rgba(0,0,0,0.1)', fontFamily: 'Nunito, sans-serif', fontSize: 11, fontWeight: 800, color: '#ffffff', textTransform: 'uppercase' }}>
                              Jumlah Penyedia
                            </th>
                            <th style={{ padding: '12px 16px', textAlign: 'center', borderBottom: '2px solid rgba(0,0,0,0.1)', fontFamily: 'Nunito, sans-serif', fontSize: 11, fontWeight: 800, color: '#ffffff', textTransform: 'uppercase' }}>
                              Sudah Terbit BA
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {jenisTagihanItems.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="py-8 text-center text-gray-400 font-bold text-xs">
                                Belum ada data jenis tagihan yang diinput untuk tahun ini.
                              </td>
                            </tr>
                          ) : (
                            jenisTagihanItems.map((item, idx) => {
                              const bulletColor = JENIS_TAGIHAN_PALETTE[idx % JENIS_TAGIHAN_PALETTE.length]
                              const penyediaVal = item.jumlah_penyedia ?? item.jumlah ?? 0
                              const terbitVal = item.sudah_terbit_ba ?? 0
                              return (
                                <tr key={item.id || idx} className="rowHover" style={{ background: idx % 2 === 0 ? '#ffffff' : '#fafbfc' }}>
                                  <td style={{ padding: '8px 14px', textAlign: 'center', borderRight: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0', fontFamily: 'Nunito, sans-serif', fontSize: 12, fontWeight: 800, color: '#64748b' }}>
                                    {idx + 1}
                                  </td>
                                  <td style={{ padding: '8px 16px', textAlign: 'left', borderRight: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0', fontFamily: 'Nunito, sans-serif', fontSize: 12.5, fontWeight: 700, color: '#00282b', lineHeight: 1.3 }}>
                                    <div className="flex items-center gap-2.5">
                                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: bulletColor }} />
                                      <span>{item.jenis}</span>
                                    </div>
                                  </td>
                                  <td style={{ padding: '8px 16px', textAlign: 'center', borderRight: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0', fontFamily: 'Nunito, sans-serif', fontSize: 13, fontWeight: 800, color: '#268484', lineHeight: 1.3 }}>
                                    {penyediaVal.toLocaleString('id-ID')}
                                  </td>
                                  <td style={{ padding: '8px 16px', textAlign: 'center', borderBottom: '1px solid #f0f0f0', fontFamily: 'Nunito, sans-serif', fontSize: 13, fontWeight: 800, color: '#566000', lineHeight: 1.3 }}>
                                    {terbitVal.toLocaleString('id-ID')}
                                  </td>
                                </tr>
                              )
                            })
                          )}
                        </tbody>
                        {/* Tfoot: Total Jumlah */}
                        {jenisTagihanItems.length > 0 && (
                          <tfoot style={{ background: '#f8fafc', borderTop: '2px solid #00282b', fontWeight: 800 }}>
                            <tr>
                              <td colSpan={2} style={{ padding: '10px 16px', textAlign: 'left', borderRight: '1px solid #eee', color: '#00282b', fontWeight: 900, textTransform: 'uppercase', fontSize: 12 }}>
                                Total Tagihan
                              </td>
                              <td style={{ padding: '10px 16px', textAlign: 'center', borderRight: '1px solid #eee', color: '#268484', fontWeight: 900, fontSize: 13.5 }}>
                                {totalJenisTagihanPenyedia.toLocaleString('id-ID')}
                              </td>
                              <td style={{ padding: '10px 16px', textAlign: 'center', color: '#566000', fontWeight: 900, fontSize: 13.5 }}>
                                {totalJenisTagihanTerbitBa.toLocaleString('id-ID')}
                              </td>
                            </tr>
                          </tfoot>
                        )}
                      </table>
                    </div>

                    {/* Text Box Catatan Keterangan Jenis Tagihan */}
                    <div className="w-full bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-xs font-nav flex items-start gap-3.5 transition-all">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                           style={{ background: 'rgba(38,132,132,0.12)', color: '#268484' }}>
                        <FileText size={16} />
                      </div>
                      <div className="flex-1">
                        <p className="font-nav text-xs sm:text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                          {yearBaData.keterangan_jenis_tagihan || defaultKetJenisTagihan}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Kolom Kanan: Column Chart Bersebelahan Jumlah Penyedia & Sudah Terbit BA (6 Kolom) */}
                  <div className="lg:col-span-6 h-full flex flex-col justify-between">
                    <BaJenisTagihanColumnChart
                      items={jenisTagihanItems}
                      title={`Perbandingan ${yearBaData.judul_jenis_tagihan || 'Jenis Tagihan'}`}
                      periodeLabel={`Tahun ${selectedYearBa}`}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ================= BOX 2: BA TUTUP TAGIHAN BERDASARKAN PROSES ================= */}
            <div style={{
              background: 'linear-gradient(135deg, #00282b 0%, #015a61 100%)', borderRadius: 20, padding: '32px 32px',
              boxShadow: '0 12px 40px rgba(0,40,43,.25)', border: '1px solid rgba(1,188,206,0.3)',
              marginBottom: 32, position: 'relative', overflow: 'hidden'
            }}>
              {/* Watermark Ornamen Mandala (Kanan Atas) */}
              <img
                src="/ornament-mandala.png"
                alt=""
                className="absolute -top-12 -right-12 w-52 h-52 object-contain pointer-events-none select-none z-0"
                style={{ opacity: 0.15 }}
              />

              {/* Watermark Ornamen Sisi Kiri (Diperbesar) */}
              <img
                src="/ornament-side.png"
                alt=""
                className="absolute -left-6 sm:-left-7 md:-left-8 top-0 bottom-0 h-full w-36 sm:w-44 md:w-52 object-cover object-left opacity-[0.08] pointer-events-none select-none z-0"
                style={{ filter: 'brightness(0) invert(1)' }}
              />

              <div className="relative z-10">
                {/* Header Box 2: Judul di Tengah & Filter Tahun di Kanan */}
                <div className="relative mb-6">
                  <div className="text-center">
                    <div style={{ width: 40, height: 3.5, background: '#d0db41', borderRadius: 2, margin: '0 auto 6px' }} />
                    <h2 style={{ fontFamily: 'Nunito, sans-serif', fontSize: 24, fontWeight: 900, color: '#d0db41', margin: 0, letterSpacing: '-0.3px', lineHeight: 1.2, textShadow: '0 2px 10px rgba(208,219,65,0.25)' }}>
                      {yearBaData.judul_tabel || 'BA Tutup Tagihan Berdasarkan Proses'}
                    </h2>
                  </div>
                  {/* Filter Tahun di Ujung Kanan */}
                  <div className="sm:absolute sm:right-0 sm:top-1/2 sm:-translate-y-1/2 mt-3 sm:mt-0 flex justify-center">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, ...sel, background: '#ffffff', borderColor: '#e2e8f0' }}>
                      <Calendar size={15} style={{ color: '#268484' }} />
                      <span style={{ fontSize: 12, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Tahun:</span>
                      <select
                        value={selectedYearBa}
                        onChange={e => {
                          setSelectedYearBa(parseInt(e.target.value))
                          setSelectedBaMonthRow(null)
                        }}
                        style={{ background: 'transparent', border: 'none', outline: 'none', fontWeight: 800, color: '#00282b', cursor: 'pointer', fontFamily: 'Nunito, sans-serif', fontSize: 13 }}
                      >
                        {availableBaYears.map(y => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* LINE CHART TREN CAPAIAN PERSENTASE (Target 100% Total Penyedia) */}
                <div className="w-full mb-6">
                  <BaProgressLineChart
                    data={baProgressLineChartData}
                    title={`Tren Capaian ${yearBaData.judul_tabel || 'BA Tutup Tagihan Berdasarkan Proses'}`}
                    periodeLabel={formatPeriodeLabel(selectedMonthsBa)}
                    totalLabel="Total Penyedia"
                    terbitLabel="Sudah Terbit BA"
                    colorTotal="#268484"
                    colorTerbit="#d0db41"
                  />
                </div>

                {/* BARIS BAWAH: TABEL LEBAR (FULL WIDTH) & CATATAN DI BAWAH TABEL */}
                <div className="space-y-4 pt-4 border-t border-gray-200">
                  {/* 1. Tabel BA Tutup Tagihan (Diperbesar & Full Width) */}
                  <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-xs bg-white">
                    <table className="w-full text-left font-nav text-sm border-collapse">
                      <thead style={{ background: '#008080' }}>
                        <tr>
                          <th style={{ padding: '14px 18px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.2)', borderBottom: '2px solid rgba(0,0,0,0.1)', fontFamily: 'Nunito, sans-serif', fontSize: 13, fontWeight: 800, color: '#ffffff', textTransform: 'uppercase' }}>
                            <div className="inline-flex items-center justify-center gap-1.5 text-white">
                              <span>Periode</span>
                              <ExcelPeriodFilterHeader
                                selectedMonths={selectedMonthsBa}
                                onChange={setSelectedMonthsBa}
                                tableName={yearBaData.judul_tabel || 'BA Tutup Tagihan Berdasarkan Proses'}
                              />
                            </div>
                          </th>
                          <th style={{ padding: '14px 16px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.2)', borderBottom: '2px solid rgba(0,0,0,0.1)', fontFamily: 'Nunito, sans-serif', fontSize: 13, fontWeight: 800, color: '#ffffff', textTransform: 'uppercase' }}>
                            Total Penyedia
                          </th>
                          <th style={{ padding: '14px 16px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.2)', borderBottom: '2px solid rgba(0,0,0,0.1)', fontFamily: 'Nunito, sans-serif', fontSize: 13, fontWeight: 800, color: '#ffffff', textTransform: 'uppercase' }}>
                            Belum Dikonfirmasi
                          </th>
                          <th style={{ padding: '14px 16px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.2)', borderBottom: '2px solid rgba(0,0,0,0.1)', fontFamily: 'Nunito, sans-serif', fontSize: 13, fontWeight: 800, color: '#ffffff', textTransform: 'uppercase' }}>
                            Proses Penagihan
                          </th>
                          <th style={{ padding: '14px 16px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.2)', borderBottom: '2px solid rgba(0,0,0,0.1)', fontFamily: 'Nunito, sans-serif', fontSize: 13, fontWeight: 800, color: '#ffffff', textTransform: 'uppercase' }}>
                            Proses Pembuatan BA
                          </th>
                          <th style={{ padding: '14px 16px', textAlign: 'center', borderBottom: '2px solid rgba(0,0,0,0.1)', fontFamily: 'Nunito, sans-serif', fontSize: 13, fontWeight: 800, color: '#ffffff', textTransform: 'uppercase' }}>
                            Sudah Terbit BA
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {baTableData.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-10 text-center text-gray-400 font-bold text-sm">
                              Belum ada data {(yearBaData.judul_tabel || 'BA Tutup Tagihan Berdasarkan Proses').toLowerCase()} yang diinput untuk tahun ini.
                            </td>
                          </tr>
                        ) : (
                          baTableData.map((row, idx) => {
                            const isHighlighted = activeBaRow?.bulan === row.bulan
                            const rowBg = isHighlighted ? '#cbf0f3' : (idx % 2 === 0 ? '#ffffff' : '#fafbfc')
                            return (
                              <tr
                                key={row.bulan}
                                onClick={() => setSelectedBaMonthRow(row.bulan)}
                                className={`transition-colors cursor-pointer select-none ${
                                  isHighlighted ? '' : 'hover:bg-[#f0faf9]'
                                }`}
                                style={{ background: rowBg }}
                                title={`Baris periode ${row.bulan}`}
                              >
                                <td style={{ padding: '11px 18px', textAlign: 'left', borderRight: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0', fontFamily: 'Nunito, sans-serif', fontSize: 13.5, fontWeight: isHighlighted ? 900 : 700, color: isHighlighted ? '#004d53' : '#00282b', backgroundColor: rowBg }}>
                                  {row.bulan}
                                </td>
                                <td style={{ padding: '11px 16px', textAlign: 'center', borderRight: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0', fontFamily: 'Nunito, sans-serif', fontSize: 13.5, fontWeight: isHighlighted ? 900 : 700, color: '#00282b', backgroundColor: rowBg }}>
                                  {row.total_penyedia.toLocaleString('id-ID')}
                                </td>
                                <td style={{ padding: '11px 16px', textAlign: 'center', borderRight: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0', fontFamily: 'Nunito, sans-serif', fontSize: 13.5, fontWeight: isHighlighted ? 900 : 700, color: '#f43f5e', backgroundColor: rowBg }}>
                                  {row.belum_dikonfirmasi.toLocaleString('id-ID')}
                                </td>
                                <td style={{ padding: '11px 16px', textAlign: 'center', borderRight: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0', fontFamily: 'Nunito, sans-serif', fontSize: 13.5, fontWeight: isHighlighted ? 900 : 700, color: '#268484', backgroundColor: rowBg }}>
                                  {row.proses_penagihan.toLocaleString('id-ID')}
                                </td>
                                <td style={{ padding: '11px 16px', textAlign: 'center', borderRight: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0', fontFamily: 'Nunito, sans-serif', fontSize: 13.5, fontWeight: isHighlighted ? 900 : 700, color: '#01bcce', backgroundColor: rowBg }}>
                                  {row.proses_pembuatan_ba.toLocaleString('id-ID')}
                                </td>
                                <td style={{ padding: '11px 16px', textAlign: 'center', borderBottom: '1px solid #f0f0f0', fontFamily: 'Nunito, sans-serif', fontSize: 13.5, fontWeight: isHighlighted ? 900 : 800, color: '#566000', backgroundColor: rowBg }}>
                                  {row.sudah_terbit_ba.toLocaleString('id-ID')}
                                </td>
                              </tr>
                            )
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* 2. Text Box Catatan di Bawah Tabel */}
                  <div className="w-full bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-xs font-nav flex items-start gap-3.5 transition-all">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                         style={{ background: 'rgba(38,132,132,0.12)', color: '#268484' }}>
                      <FileText size={16} />
                    </div>
                    <div className="flex-1">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-[#268484] block mb-1">Catatan:</span>
                      <p className="font-nav text-xs sm:text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                        {yearBaData.keterangan || defaultBaKet}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ================= BOX 3: BA TUTUP TAGIHAN BERDASARKAN NOMINAL (RP) ================= */}
            <div style={{
              background: 'linear-gradient(135deg, #00282b 0%, #015a61 100%)', borderRadius: 20, padding: '32px 32px',
              boxShadow: '0 12px 40px rgba(0,40,43,.25)', border: '1px solid rgba(1,188,206,0.3)',
              marginBottom: 32, position: 'relative', overflow: 'hidden'
            }}>
              {/* Watermark Ornamen Mandala (Kanan Atas) */}
              <img
                src="/ornament-mandala.png"
                alt=""
                className="absolute -top-12 -right-12 w-52 h-52 object-contain pointer-events-none select-none z-0"
                style={{ opacity: 0.15 }}
              />

              {/* Watermark Ornamen Sisi Kiri (Diperbesar) */}
              <img
                src="/ornament-side.png"
                alt=""
                className="absolute -left-6 sm:-left-7 md:-left-8 top-0 bottom-0 h-full w-36 sm:w-44 md:w-52 object-cover object-left opacity-[0.08] pointer-events-none select-none z-0"
                style={{ filter: 'brightness(0) invert(1)' }}
              />

              <div className="relative z-10">
                {/* Header Box 3: Judul di Tengah & Filter Tahun di Kanan */}
                <div className="relative mb-6">
                  <div className="text-center">
                    <div style={{ width: 40, height: 3.5, background: '#d0db41', borderRadius: 2, margin: '0 auto 6px' }} />
                    <h2 style={{ fontFamily: 'Nunito, sans-serif', fontSize: 24, fontWeight: 900, color: '#d0db41', margin: 0, letterSpacing: '-0.3px', lineHeight: 1.2, textShadow: '0 2px 10px rgba(208,219,65,0.25)' }}>
                      {yearBaData.judul_nominal || 'BA Tutup Tagihan Berdasarkan Nominal (Rp)'}
                    </h2>
                  </div>
                  {/* Filter Tahun di Ujung Kanan */}
                  <div className="sm:absolute sm:right-0 sm:top-1/2 sm:-translate-y-1/2 mt-3 sm:mt-0 flex justify-center">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, ...sel, background: '#ffffff', borderColor: '#e2e8f0' }}>
                      <Calendar size={15} style={{ color: '#268484' }} />
                      <span style={{ fontSize: 12, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Tahun:</span>
                      <select
                        value={selectedYearBa}
                        onChange={e => {
                          setSelectedYearBa(parseInt(e.target.value))
                          setSelectedNominalMonthRow(null)
                        }}
                        style={{ background: 'transparent', border: 'none', outline: 'none', fontWeight: 800, color: '#00282b', cursor: 'pointer', fontFamily: 'Nunito, sans-serif', fontSize: 13 }}
                      >
                        {availableBaYears.map(y => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* LINE CHART TREN CAPAIAN PERSENTASE NOMINAL (Target 100% Total Nilai) */}
                <div className="w-full mb-6">
                  <BaProgressLineChart
                    data={nominalProgressLineChartData}
                    title={`Tren Capaian ${yearBaData.judul_nominal || 'BA Tutup Tagihan Berdasarkan Nominal (Rp)'}`}
                    periodeLabel={formatPeriodeLabel(selectedMonthsNominal)}
                    totalLabel="Total Nilai"
                    terbitLabel="Sudah Terbit BA"
                    isCurrency={true}
                    colorTotal="#268484"
                    colorTerbit="#01bcce"
                  />
                </div>

                {/* BARIS BAWAH: TABEL LEBAR (FULL WIDTH) & CATATAN DI BAWAH TABEL */}
                <div className="space-y-4 pt-4 border-t border-gray-200">
                  {/* 1. Tabel Nominal BA Tutup Tagihan (Diperbesar & Full Width, dengan judul kolom 'Total Nilai') */}
                  <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-xs bg-white">
                    <table className="w-full text-left font-nav text-sm border-collapse">
                      <thead style={{ background: '#008080' }}>
                        <tr>
                          <th style={{ padding: '14px 18px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.2)', borderBottom: '2px solid rgba(0,0,0,0.1)', fontFamily: 'Nunito, sans-serif', fontSize: 13, fontWeight: 800, color: '#ffffff', textTransform: 'uppercase' }}>
                            <div className="inline-flex items-center justify-center gap-1.5 text-white">
                              <span>Periode</span>
                              <ExcelPeriodFilterHeader
                                selectedMonths={selectedMonthsNominal}
                                onChange={setSelectedMonthsNominal}
                                tableName={yearBaData.judul_nominal || 'BA Tutup Tagihan Berdasarkan Nominal (Rp)'}
                              />
                            </div>
                          </th>
                          <th style={{ padding: '14px 16px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.2)', borderBottom: '2px solid rgba(0,0,0,0.1)', fontFamily: 'Nunito, sans-serif', fontSize: 13, fontWeight: 800, color: '#ffffff', textTransform: 'uppercase' }}>
                            Total Nilai
                          </th>
                          <th style={{ padding: '14px 16px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.2)', borderBottom: '2px solid rgba(0,0,0,0.1)', fontFamily: 'Nunito, sans-serif', fontSize: 13, fontWeight: 800, color: '#ffffff', textTransform: 'uppercase' }}>
                            Belum Dikonfirmasi
                          </th>
                          <th style={{ padding: '14px 16px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.2)', borderBottom: '2px solid rgba(0,0,0,0.1)', fontFamily: 'Nunito, sans-serif', fontSize: 13, fontWeight: 800, color: '#ffffff', textTransform: 'uppercase' }}>
                            Proses Penagihan
                          </th>
                          <th style={{ padding: '14px 16px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.2)', borderBottom: '2px solid rgba(0,0,0,0.1)', fontFamily: 'Nunito, sans-serif', fontSize: 13, fontWeight: 800, color: '#ffffff', textTransform: 'uppercase' }}>
                            Proses Pembuatan BA
                          </th>
                          <th style={{ padding: '14px 16px', textAlign: 'center', borderBottom: '2px solid rgba(0,0,0,0.1)', fontFamily: 'Nunito, sans-serif', fontSize: 13, fontWeight: 800, color: '#ffffff', textTransform: 'uppercase' }}>
                            Sudah Terbit BA
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {nominalTableData.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-10 text-center text-gray-400 font-bold text-sm">
                              Belum ada data {(yearBaData.judul_nominal || 'BA Tutup Tagihan Berdasarkan Nominal (Rp)').toLowerCase()} yang diinput untuk tahun ini.
                            </td>
                          </tr>
                        ) : (
                          nominalTableData.map((row, idx) => {
                            const isHighlighted = activeNominalRow?.bulan === row.bulan
                            const rowBg = isHighlighted ? '#cbf0f3' : (idx % 2 === 0 ? '#ffffff' : '#fafbfc')
                            return (
                              <tr
                                key={row.bulan}
                                onClick={() => setSelectedNominalMonthRow(row.bulan)}
                                className={`transition-colors cursor-pointer select-none ${
                                  isHighlighted ? '' : 'hover:bg-[#f0faf9]'
                                }`}
                                style={{ background: rowBg }}
                                title={`Baris periode ${row.bulan}`}
                              >
                                <td style={{ padding: '11px 18px', textAlign: 'left', borderRight: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0', fontFamily: 'Nunito, sans-serif', fontSize: 13.5, fontWeight: isHighlighted ? 900 : 700, color: isHighlighted ? '#004d53' : '#00282b', backgroundColor: rowBg }}>
                                  {row.bulan}
                                </td>
                                <td style={{ padding: '11px 16px', textAlign: 'center', borderRight: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0', fontFamily: 'Nunito, sans-serif', fontSize: 13.5, fontWeight: isHighlighted ? 900 : 700, color: '#00282b', backgroundColor: rowBg }}>
                                  {row.total_penyedia.toLocaleString('id-ID')}
                                </td>
                                <td style={{ padding: '11px 16px', textAlign: 'center', borderRight: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0', fontFamily: 'Nunito, sans-serif', fontSize: 13.5, fontWeight: isHighlighted ? 900 : 700, color: '#f43f5e', backgroundColor: rowBg }}>
                                  {row.belum_dikonfirmasi.toLocaleString('id-ID')}
                                </td>
                                <td style={{ padding: '11px 16px', textAlign: 'center', borderRight: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0', fontFamily: 'Nunito, sans-serif', fontSize: 13.5, fontWeight: isHighlighted ? 900 : 700, color: '#268484', backgroundColor: rowBg }}>
                                  {row.proses_penagihan.toLocaleString('id-ID')}
                                </td>
                                <td style={{ padding: '11px 16px', textAlign: 'center', borderRight: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0', fontFamily: 'Nunito, sans-serif', fontSize: 13.5, fontWeight: isHighlighted ? 900 : 700, color: '#01bcce', backgroundColor: rowBg }}>
                                  {row.proses_pembuatan_ba.toLocaleString('id-ID')}
                                </td>
                                <td style={{ padding: '11px 16px', textAlign: 'center', borderBottom: '1px solid #f0f0f0', fontFamily: 'Nunito, sans-serif', fontSize: 13.5, fontWeight: isHighlighted ? 900 : 800, color: '#566000', backgroundColor: rowBg }}>
                                  {row.sudah_terbit_ba.toLocaleString('id-ID')}
                                </td>
                              </tr>
                            )
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* 2. Text Box Catatan di Bawah Tabel */}
                  <div className="w-full bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-xs font-nav flex items-start gap-3.5 transition-all">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                         style={{ background: 'rgba(38,132,132,0.12)', color: '#268484' }}>
                      <FileText size={16} />
                    </div>
                    <div className="flex-1">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-[#268484] block mb-1">Catatan:</span>
                      <p className="font-nav text-xs sm:text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                        {yearBaData.keterangan_nominal || defaultKetNominal}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  </>
)
}
