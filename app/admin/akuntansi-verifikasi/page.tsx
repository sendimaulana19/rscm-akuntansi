'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Save, Calendar, Trash2, Edit3, Plus, CheckCircle2, FileText, ArrowRight, RotateCcw, AlertTriangle, ArrowRightLeft, Clock, FileCheck, TrendingUp, FileDown, FileUp, BarChart3, Check, X } from 'lucide-react'

const NAMA_BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

interface MonthEntry {
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

// Data awal (0/kosong) jika database masih baru atau data dihapus
function createEmptyMonths(): MonthEntry[] {
  return NAMA_BULAN.map((bulan, idx) => ({
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
}

interface MonthSlaEntry {
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

interface MonthBaEntry {
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

export default function AdminAkuntansiVerifikasi() {
  const supabase = createClient()

  // Tab Admin Switcher: 'dokumen_tagihan' | 'sla' | 'ba_tutup_tagihan'
  const [activeAdminTab, setActiveAdminTab] = useState<'dokumen_tagihan' | 'sla' | 'ba_tutup_tagihan'>('dokumen_tagihan')

  // State Tahun & Header Dokumen Tagihan
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState<number>(currentYear)
  const [availableYears, setAvailableYears] = useState<number[]>([currentYear])
  const [newYearInput, setNewYearInput] = useState('')

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

  // State Data 12 Bulan Dokumen Tagihan
  const [monthsData, setMonthsData] = useState<MonthEntry[]>(createEmptyMonths())
  const [existingRecordId, setExistingRecordId] = useState<string | null>(null)

  // State Form Input Bulan Dokumen Tagihan
  const [editBulan, setEditBulan] = useState<string>('Januari')

  // Internal inputs Dokumen Tagihan
  const [intJml, setIntJml] = useState<string>('0')
  const [intPros, setIntPros] = useState<string>('0')
  const [intLolos, setIntLolos] = useState<string>('0')

  // Eksternal inputs Dokumen Tagihan
  const [eksJml, setEksJml] = useState<string>('0')
  const [eksPros, setEksPros] = useState<string>('0')
  const [eksLolos, setEksLolos] = useState<string>('0')

  // ===================== SLA STATES =====================
  const [slaSelectedYear, setSlaSelectedYear] = useState<number>(currentYear)
  const [slaAvailableYears, setSlaAvailableYears] = useState<number[]>([currentYear])
  const [slaNewYearInput, setSlaNewYearInput] = useState('')
  const [slaExistingRecordId, setSlaExistingRecordId] = useState<string | null>(null)

  const [slaHeaderText, setSlaHeaderText] = useState(
    'Service Level Agreement (SLA) Verifikasi Dokumen Tagihan mengukur ketepatan waktu dan efektivitas proses verifikasi tagihan internal maupun eksternal sesuai standar layanan operasional RSCM.'
  )
  // Kategori SLA Aktif di Admin: 'capaian' (SLA Verifikasi) | 'pengambilan' (SLA Pengambilan) | 'pengembalian' (SLA Pengembalian)
  const [slaCategory, setSlaCategory] = useState<'capaian' | 'pengambilan' | 'pengembalian'>('capaian')

  // Section 1: SLA Dokumen Internal
  const [slaJudulInternal, setSlaJudulInternal] = useState('SLA Dokumen Internal')
  const [slaKetInternal, setSlaKetInternal] = useState(
    'Pencapaian Service Level Agreement (SLA) untuk dokumen tagihan internal mencakup kepatuhan terhadap standar waktu proses verifikasi, waktu pengambilan dokumen oleh unit kerja, dan waktu pengembalian berkas administrasi di lingkungan RSCM.'
  )

  // Section 2: SLA Dokumen Eksternal
  const [slaJudulEksternal, setSlaJudulEksternal] = useState('SLA Dokumen Eksternal')
  const [slaKetEksternal, setSlaKetEksternal] = useState(
    'Pencapaian Service Level Agreement (SLA) untuk dokumen tagihan eksternal mencakup kepatuhan terhadap standar waktu proses verifikasi tagihan rekanan/vendor, waktu pengambilan dokumen, serta penyelesaian pengembalian dokumen administrasi penyedia pihak ketiga.'
  )

  // Kategori 1: SLA Verifikasi (DB key: months)
  const [slaJudulTabel, setSlaJudulTabel] = useState('SLA Verifikasi')
  const [slaKetCapaian, setSlaKetCapaian] = useState(
    'Capaian persentase SLA verifikasi dokumen tagihan mencerminkan kepatuhan terhadap standar waktu layanan verifikasi. Tingkat capaian yang konsisten mendukung kelancaran arus kas dan kepuasan mitra kerja sama.'
  )
  const [slaMonthsData, setSlaMonthsData] = useState<MonthSlaEntry[]>(createEmptySlaMonths())

  // Kategori 2: SLA Pengambilan (DB key: months_pengambilan)
  const [slaJudulPengambilan, setSlaJudulPengambilan] = useState('SLA Pengambilan')
  const [slaKetPengambilan, setSlaKetPengambilan] = useState(
    'Capaian persentase SLA pengambilan dokumen tagihan mengukur efektivitas waktu pengambilan berkas tagihan oleh unit pengusul atau vendor sesuai ketentuan operasional RSCM.'
  )
  const [slaMonthsPengambilan, setSlaMonthsPengambilan] = useState<MonthSlaEntry[]>(createEmptySlaMonths())

  // Kategori 3: SLA Pengembalian (DB key: months_pengembalian)
  const [slaJudulPengembalian, setSlaJudulPengembalian] = useState('SLA Pengembalian')
  const [slaKetPengembalian, setSlaKetPengembalian] = useState(
    'Capaian persentase SLA pengembalian dokumen tagihan mengukur ketepatan waktu pengembalian berkas tagihan yang belum lengkap atau memerlukan perbaikan ke unit terkait.'
  )
  const [slaMonthsPengembalian, setSlaMonthsPengembalian] = useState<MonthSlaEntry[]>(createEmptySlaMonths())

  const [slaEditBulan, setSlaEditBulan] = useState<string>('Januari')

  const [slaIntPct, setSlaIntPct] = useState<string>('0')
  const [slaEksPct, setSlaEksPct] = useState<string>('0')
  const [slaAllPct, setSlaAllPct] = useState<string>('0')
  const [slaAutoCalc, setSlaAutoCalc] = useState<boolean>(true)

  // ===================== BA TUTUP TAGIHAN STATES =====================
  const [baSelectedYear, setBaSelectedYear] = useState<number>(currentYear)
  const [baAvailableYears, setBaAvailableYears] = useState<number[]>([currentYear])
  const [baNewYearInput, setBaNewYearInput] = useState('')
  const [baExistingRecordId, setBaExistingRecordId] = useState<string | null>(null)

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

  // Switcher Kategori 12 Bulan: 'penyedia' | 'nominal'
  const [baCategory, setBaCategory] = useState<'penyedia' | 'nominal'>('penyedia')

  const [baEditBulan, setBaEditBulan] = useState<string>('Januari')
  const [baTotalPenyedia, setBaTotalPenyedia] = useState<string>('0')
  const [baBelumKonfirmasi, setBaBelumKonfirmasi] = useState<string>('0')
  const [baProsesPenagihan, setBaProsesPenagihan] = useState<string>('0')
  const [baProsesPembuatanBa, setBaProsesPembuatanBa] = useState<string>('0')
  const [baSudahTerbitBa, setBaSudahTerbitBa] = useState<string>('0')
  const [baAutoCalcTotal, setBaAutoCalcTotal] = useState<boolean>(true)


  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  // Fetch available years from Supabase
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

  // Load month data into form fields
  const loadMonthToForm = useCallback((data: MonthEntry[], targetBulan: string) => {
    const found = data.find(m => m.bulan === targetBulan)
    if (found) {
      setIntJml(String(found.internal.jumlah_dokumen ?? 0))
      setIntPros(String(found.internal.proses ?? 0))
      setIntLolos(String(found.internal.lolos ?? 0))

      setEksJml(String(found.eksternal.jumlah_dokumen ?? 0))
      setEksPros(String(found.eksternal.proses ?? 0))
      setEksLolos(String(found.eksternal.lolos ?? 0))
    } else {
      setIntJml('0'); setIntPros('0'); setIntLolos('0')
      setEksJml('0'); setEksPros('0'); setEksLolos('0')
    }
  }, [])

  // Load data for a specific year from Supabase
  const loadData = useCallback(async (year: number) => {
    try {
      const { data, error } = await supabase
        .from('financial_reports_data')
        .select('*')
        .eq('category', 'verifikasi_dokumen_tagihan')
        .eq('year', year)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading verifikasi data:', error)
        return
      }

      if (data && data.data) {
        setExistingRecordId(data.id)
        setHeaderText(data.data.header_text || '')
        setJudulKeseluruhan(data.data.judul_text_keseluruhan || 'Catatan Dokumen Tagihan Keseluruhan')
        setKetKeseluruhan(data.data.keterangan_keseluruhan || '')
        setJudulInternal(data.data.judul_text_internal || 'Catatan Dokumen Tagihan Internal')
        setKetInternal(data.data.keterangan_internal || '')
        setJudulEksternal(data.data.judul_text_eksternal || 'Catatan Dokumen Tagihan Eksternal')
        setKetEksternal(data.data.keterangan_eksternal || '')

        if (data.data.months && Array.isArray(data.data.months) && data.data.months.length > 0) {
          setMonthsData(data.data.months)
          loadMonthToForm(data.data.months, editBulan)
          return
        }
      }

      // If no record exists for this year, start clean with empty values
      setExistingRecordId(null)
      setHeaderText('')
      setJudulKeseluruhan('Catatan Dokumen Tagihan Keseluruhan')
      setKetKeseluruhan('')
      setJudulInternal('Catatan Dokumen Tagihan Internal')
      setKetInternal('')
      setJudulEksternal('Catatan Dokumen Tagihan Eksternal')
      setKetEksternal('')
      const empty = createEmptyMonths()
      setMonthsData(empty)
      loadMonthToForm(empty, editBulan)
    } catch (err: any) {
      console.error(err)
    }
  }, [supabase, editBulan, loadMonthToForm])

  // Load global perbandingan text (tidak terikat periode tahun)
  const loadGlobalPerbandingan = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('financial_reports_data')
        .select('*')
        .eq('category', 'verifikasi_dokumen_tagihan_global')
        .eq('item_name', 'perbandingan_keterangan')
        .maybeSingle()

      if (data?.data) {
        setKetPerbandinganInternal(data.data.keterangan_perbandingan_internal || '')
        setKetPerbandinganEksternal(data.data.keterangan_perbandingan_eksternal || '')
      }
    } catch (err: any) {
      console.error('Error fetching global perbandingan:', err)
    }
  }, [supabase])

  useEffect(() => {
    loadData(selectedYear)
  }, [selectedYear, loadData])

  useEffect(() => {
    loadGlobalPerbandingan()
  }, [loadGlobalPerbandingan])

  // ===================== SLA DATA HANDLERS =====================
  // Fetch available SLA years from Supabase
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

  // Helper title for active SLA category
  const getActiveSlaTitle = useCallback((cat: 'capaian' | 'pengambilan' | 'pengembalian') => {
    if (cat === 'pengambilan') return 'SLA Pengambilan'
    if (cat === 'pengembalian') return 'SLA Pengembalian'
    return 'SLA Verifikasi'
  }, [])

  // Load SLA month to form
  const loadSlaMonthToForm = useCallback((data: MonthSlaEntry[], targetBulan: string) => {
    const found = data.find(m => m.bulan === targetBulan)
    if (found && (found.has_data || found.internal > 0 || found.eksternal > 0 || found.keseluruhan > 0)) {
      setSlaIntPct(String(found.internal))
      setSlaEksPct(String(found.eksternal))
      setSlaAllPct(String(found.keseluruhan))
    } else {
      setSlaIntPct('0')
      setSlaEksPct('0')
      setSlaAllPct('0')
    }
  }, [])

  // Switch active SLA category in admin form & table
  const handleSwitchSlaCategory = (cat: 'capaian' | 'pengambilan' | 'pengembalian') => {
    setSlaCategory(cat)
    const targetMonths = cat === 'pengambilan'
      ? slaMonthsPengambilan
      : cat === 'pengembalian'
        ? slaMonthsPengembalian
        : slaMonthsData
    loadSlaMonthToForm(targetMonths, slaEditBulan)
  }

  // Load SLA data for a year
  const loadSlaData = useCallback(async (year: number) => {
    try {
      const { data, error } = await supabase
        .from('financial_reports_data')
        .select('*')
        .eq('category', 'verifikasi_sla')
        .eq('year', year)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading SLA data:', error)
        return
      }

      if (data && data.data) {
        setSlaExistingRecordId(data.id)
        setSlaHeaderText(data.data.header_text || 'Service Level Agreement (SLA) Verifikasi Dokumen Tagihan mengukur ketepatan waktu dan efektivitas proses verifikasi tagihan internal maupun eksternal sesuai standar layanan operasional RSCM.')

        // Section 1 & Section 2 Texts
        setSlaJudulInternal(data.data.judul_internal || 'SLA Dokumen Internal')
        setSlaKetInternal(data.data.keterangan_internal || data.data.keterangan_capaian || 'Pencapaian Service Level Agreement (SLA) untuk dokumen tagihan internal mencakup kepatuhan terhadap standar waktu proses verifikasi, waktu pengambilan dokumen oleh unit kerja, dan waktu pengembalian berkas administrasi di lingkungan RSCM.')

        setSlaJudulEksternal(data.data.judul_eksternal || 'SLA Dokumen Eksternal')
        setSlaKetEksternal(data.data.keterangan_eksternal || data.data.keterangan_pengambilan || 'Pencapaian Service Level Agreement (SLA) untuk dokumen tagihan eksternal mencakup kepatuhan terhadap standar waktu proses verifikasi tagihan rekanan/vendor, waktu pengambilan dokumen, serta penyelesaian pengembalian dokumen administrasi penyedia pihak ketiga.')

        // 1. SLA Verifikasi (DB key: months)
        setSlaJudulTabel(data.data.judul_tabel || 'SLA Verifikasi')
        setSlaKetCapaian(data.data.keterangan_capaian || 'Capaian persentase SLA verifikasi dokumen tagihan mencerminkan kepatuhan terhadap standar waktu layanan verifikasi. Tingkat capaian yang konsisten mendukung kelancaran arus kas dan kepuasan mitra kerja sama.')
        const mCapaian = (data.data.months && Array.isArray(data.data.months) && data.data.months.length > 0)
          ? data.data.months
          : createEmptySlaMonths()
        setSlaMonthsData(mCapaian)

        // 2. SLA Pengambilan (DB key: months_pengambilan)
        setSlaJudulPengambilan(data.data.judul_pengambilan || 'SLA Pengambilan')
        setSlaKetPengambilan(data.data.keterangan_pengambilan || 'Capaian persentase SLA pengambilan dokumen tagihan mengukur efektivitas waktu pengambilan berkas tagihan oleh unit pengusul atau vendor sesuai ketentuan operasional RSCM.')
        const mPengambilan = (data.data.months_pengambilan && Array.isArray(data.data.months_pengambilan) && data.data.months_pengambilan.length > 0)
          ? data.data.months_pengambilan
          : createEmptySlaMonths()
        setSlaMonthsPengambilan(mPengambilan)

        // 3. SLA Pengembalian (DB key: months_pengembalian)
        setSlaJudulPengembalian(data.data.judul_pengembalian || 'SLA Pengembalian')
        setSlaKetPengembalian(data.data.keterangan_pengembalian || 'Capaian persentase SLA pengembalian dokumen tagihan mengukur ketepatan waktu pengembalian berkas tagihan yang belum lengkap atau memerlukan perbaikan ke unit terkait.')
        const mPengembalian = (data.data.months_pengembalian && Array.isArray(data.data.months_pengembalian) && data.data.months_pengembalian.length > 0)
          ? data.data.months_pengembalian
          : createEmptySlaMonths()
        setSlaMonthsPengembalian(mPengembalian)

        const activeMonths = slaCategory === 'pengambilan' ? mPengambilan : slaCategory === 'pengembalian' ? mPengembalian : mCapaian
        loadSlaMonthToForm(activeMonths, slaEditBulan)
        return
      }

      setSlaExistingRecordId(null)
      setSlaHeaderText('Service Level Agreement (SLA) Verifikasi Dokumen Tagihan mengukur ketepatan waktu dan efektivitas proses verifikasi tagihan internal maupun eksternal sesuai standar layanan operasional RSCM.')

      setSlaJudulInternal('SLA Dokumen Internal')
      setSlaKetInternal('Pencapaian Service Level Agreement (SLA) untuk dokumen tagihan internal mencakup kepatuhan terhadap standar waktu proses verifikasi, waktu pengambilan dokumen oleh unit kerja, dan waktu pengembalian berkas administrasi di lingkungan RSCM.')

      setSlaJudulEksternal('SLA Dokumen Eksternal')
      setSlaKetEksternal('Pencapaian Service Level Agreement (SLA) untuk dokumen tagihan eksternal mencakup kepatuhan terhadap standar waktu proses verifikasi tagihan rekanan/vendor, waktu pengambilan dokumen, serta penyelesaian pengembalian dokumen administrasi penyedia pihak ketiga.')

      setSlaJudulTabel('SLA Verifikasi')
      setSlaKetCapaian('Capaian persentase SLA verifikasi dokumen tagihan mencerminkan kepatuhan terhadap standar waktu layanan verifikasi. Tingkat capaian yang konsisten mendukung kelancaran arus kas dan kepuasan mitra kerja sama.')
      const empty1 = createEmptySlaMonths()
      setSlaMonthsData(empty1)

      setSlaJudulPengambilan('SLA Pengambilan')
      setSlaKetPengambilan('Capaian persentase SLA pengambilan dokumen tagihan mengukur efektivitas waktu pengambilan berkas tagihan oleh unit pengusul atau vendor sesuai ketentuan operasional RSCM.')
      const empty2 = createEmptySlaMonths()
      setSlaMonthsPengambilan(empty2)

      setSlaJudulPengembalian('SLA Pengembalian')
      setSlaKetPengembalian('Capaian persentase SLA pengembalian dokumen tagihan mengukur ketepatan waktu pengembalian berkas tagihan yang belum lengkap atau memerlukan perbaikan ke unit terkait.')
      const empty3 = createEmptySlaMonths()
      setSlaMonthsPengembalian(empty3)

      loadSlaMonthToForm(empty1, slaEditBulan)
    } catch (err: any) {
      console.error(err)
    }
  }, [supabase, slaEditBulan, slaCategory, loadSlaMonthToForm])

  useEffect(() => {
    loadSlaData(slaSelectedYear)
  }, [slaSelectedYear, loadSlaData])

  const handleSelectSlaBulan = (bulan: string) => {
    setSlaEditBulan(bulan)
    const targetMonths = slaCategory === 'pengambilan'
      ? slaMonthsPengambilan
      : slaCategory === 'pengembalian'
        ? slaMonthsPengembalian
        : slaMonthsData
    loadSlaMonthToForm(targetMonths, bulan)
  }

  const handleSlaIntChange = (val: string) => {
    setSlaIntPct(val)
    if (slaAutoCalc) {
      const i = parseFloat(val) || 0
      const e = parseFloat(slaEksPct) || 0
      const avg = Number(((i + e) / 2).toFixed(2))
      setSlaAllPct(String(avg))
    }
  }

  const handleSlaEksChange = (val: string) => {
    setSlaEksPct(val)
    if (slaAutoCalc) {
      const i = parseFloat(slaIntPct) || 0
      const e = parseFloat(val) || 0
      const avg = Number(((i + e) / 2).toFixed(2))
      setSlaAllPct(String(avg))
    }
  }

  const handleSaveSlaMonth = async () => {
    setLoading(true)
    setMessage(null)

    const intVal = parseFloat(slaIntPct) || 0
    const eksVal = parseFloat(slaEksPct) || 0
    const allVal = parseFloat(slaAllPct) || 0

    const currentMonths = slaCategory === 'pengambilan'
      ? slaMonthsPengambilan
      : slaCategory === 'pengembalian'
        ? slaMonthsPengembalian
        : slaMonthsData

    const updatedMonths = currentMonths.map(m => {
      if (m.bulan === slaEditBulan) {
        return {
          ...m,
          internal: intVal,
          eksternal: eksVal,
          keseluruhan: allVal,
          has_data: true
        }
      }
      return m
    })

    const payloadData = {
      tahun: slaSelectedYear,
      header_text: slaHeaderText.trim(),
      judul_internal: slaJudulInternal.trim() || 'SLA Dokumen Internal',
      keterangan_internal: slaKetInternal.trim(),
      judul_eksternal: slaJudulEksternal.trim() || 'SLA Dokumen Eksternal',
      keterangan_eksternal: slaKetEksternal.trim(),
      judul_tabel: slaJudulTabel.trim() || 'SLA Verifikasi',
      keterangan_capaian: slaKetCapaian.trim(),
      months: slaCategory === 'capaian' ? updatedMonths : slaMonthsData,
      judul_pengambilan: slaJudulPengambilan.trim() || 'SLA Pengambilan',
      keterangan_pengambilan: slaKetPengambilan.trim(),
      months_pengambilan: slaCategory === 'pengambilan' ? updatedMonths : slaMonthsPengambilan,
      judul_pengembalian: slaJudulPengembalian.trim() || 'SLA Pengembalian',
      keterangan_pengembalian: slaKetPengembalian.trim(),
      months_pengembalian: slaCategory === 'pengembalian' ? updatedMonths : slaMonthsPengembalian,
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
            item_name: `sla_${slaSelectedYear}`,
            data: payloadData
          })
          .select()
          .single()

        if (error) throw error
        if (newRec) setSlaExistingRecordId(newRec.id)
      }

      if (slaCategory === 'pengambilan') {
        setSlaMonthsPengambilan(updatedMonths)
      } else if (slaCategory === 'pengembalian') {
        setSlaMonthsPengembalian(updatedMonths)
      } else {
        setSlaMonthsData(updatedMonths)
      }

      if (!slaAvailableYears.includes(slaSelectedYear)) {
        setSlaAvailableYears(prev => Array.from(new Set([...prev, slaSelectedYear])).sort((a, b) => b - a))
      }

      const activeTitle = getActiveSlaTitle(slaCategory)
      setMessage({ type: 'ok', text: `Data ${activeTitle} bulan ${slaEditBulan} tahun ${slaSelectedYear} berhasil disimpan!` })
    } catch (err: any) {
      setMessage({ type: 'err', text: 'Gagal menyimpan SLA: ' + err.message })
    } finally {
      setLoading(false)
      setTimeout(() => setMessage(null), 3500)
    }
  }

  const handleSaveSlaTexts = async () => {
    setLoading(true)
    setMessage(null)

    const payloadData = {
      tahun: slaSelectedYear,
      header_text: slaHeaderText.trim(),
      judul_internal: slaJudulInternal.trim() || 'SLA Dokumen Internal',
      keterangan_internal: slaKetInternal.trim(),
      judul_eksternal: slaJudulEksternal.trim() || 'SLA Dokumen Eksternal',
      keterangan_eksternal: slaKetEksternal.trim(),
      judul_tabel: slaJudulTabel.trim() || 'SLA Verifikasi',
      keterangan_capaian: slaKetCapaian.trim(),
      months: slaMonthsData,
      judul_pengambilan: slaJudulPengambilan.trim() || 'SLA Pengambilan',
      keterangan_pengambilan: slaKetPengambilan.trim(),
      months_pengambilan: slaMonthsPengambilan,
      judul_pengembalian: slaJudulPengembalian.trim() || 'SLA Pengembalian',
      keterangan_pengembalian: slaKetPengembalian.trim(),
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
            item_name: `sla_${slaSelectedYear}`,
            data: payloadData
          })
          .select()
          .single()

        if (error) throw error
        if (newRec) setSlaExistingRecordId(newRec.id)
      }

      setMessage({ type: 'ok', text: `Teks judul dan catatan SLA tahun ${slaSelectedYear} berhasil disimpan!` })
    } catch (err: any) {
      setMessage({ type: 'err', text: 'Gagal menyimpan teks SLA: ' + err.message })
    } finally {
      setLoading(false)
      setTimeout(() => setMessage(null), 3500)
    }
  }

  const handleResetSlaMonth = async (bulan: string) => {
    const activeTitle = getActiveSlaTitle(slaCategory)
    if (!confirm(`Reset data ${activeTitle} bulan ${bulan} tahun ${slaSelectedYear} menjadi 0%?`)) return

    const currentMonths = slaCategory === 'pengambilan'
      ? slaMonthsPengambilan
      : slaCategory === 'pengembalian'
        ? slaMonthsPengembalian
        : slaMonthsData

    const updatedMonths = currentMonths.map(m => {
      if (m.bulan === bulan) {
        return {
          ...m,
          internal: 0,
          eksternal: 0,
          keseluruhan: 0,
          has_data: false
        }
      }
      return m
    })

    if (slaCategory === 'pengambilan') {
      setSlaMonthsPengambilan(updatedMonths)
    } else if (slaCategory === 'pengembalian') {
      setSlaMonthsPengembalian(updatedMonths)
    } else {
      setSlaMonthsData(updatedMonths)
    }

    if (slaEditBulan === bulan) {
      setSlaIntPct('0')
      setSlaEksPct('0')
      setSlaAllPct('0')
    }

    if (slaExistingRecordId) {
      const payloadData = {
        tahun: slaSelectedYear,
        header_text: slaHeaderText.trim(),
        judul_tabel: slaJudulTabel.trim() || 'Capaian',
        keterangan_capaian: slaKetCapaian.trim(),
        months: slaCategory === 'capaian' ? updatedMonths : slaMonthsData,
        judul_pengambilan: slaJudulPengambilan.trim() || 'Pengambilan Dokumen',
        keterangan_pengambilan: slaKetPengambilan.trim(),
        months_pengambilan: slaCategory === 'pengambilan' ? updatedMonths : slaMonthsPengambilan,
        judul_pengembalian: slaJudulPengembalian.trim() || 'Pengembalian Dokumen',
        keterangan_pengembalian: slaKetPengembalian.trim(),
        months_pengembalian: slaCategory === 'pengembalian' ? updatedMonths : slaMonthsPengembalian,
      }

      await supabase
        .from('financial_reports_data')
        .update({ data: payloadData })
        .eq('id', slaExistingRecordId)
    }

    setMessage({ type: 'ok', text: `Data ${activeTitle} bulan ${bulan} telah direset menjadi 0%.` })
    setTimeout(() => setMessage(null), 3000)
  }

  const handleResetAllSlaMonths = async () => {
    const activeTitle = getActiveSlaTitle(slaCategory)
    if (!confirm(`YAKIN ingin mereset SEMUA bulan data ${activeTitle} tahun ${slaSelectedYear} menjadi 0%?`)) return

    setLoading(true)
    const empty = createEmptySlaMonths()

    if (slaCategory === 'pengambilan') {
      setSlaMonthsPengambilan(empty)
    } else if (slaCategory === 'pengembalian') {
      setSlaMonthsPengembalian(empty)
    } else {
      setSlaMonthsData(empty)
    }

    loadSlaMonthToForm(empty, slaEditBulan)

    if (slaExistingRecordId) {
      const payloadData = {
        tahun: slaSelectedYear,
        header_text: slaHeaderText.trim(),
        judul_tabel: slaJudulTabel.trim() || 'Capaian',
        keterangan_capaian: slaKetCapaian.trim(),
        months: slaCategory === 'capaian' ? empty : slaMonthsData,
        judul_pengambilan: slaJudulPengambilan.trim() || 'Pengambilan Dokumen',
        keterangan_pengambilan: slaKetPengambilan.trim(),
        months_pengambilan: slaCategory === 'pengambilan' ? empty : slaMonthsPengambilan,
        judul_pengembalian: slaJudulPengembalian.trim() || 'Pengembalian Dokumen',
        keterangan_pengembalian: slaKetPengembalian.trim(),
        months_pengembalian: slaCategory === 'pengembalian' ? empty : slaMonthsPengembalian,
      }

      try {
        await supabase
          .from('financial_reports_data')
          .update({ data: payloadData })
          .eq('id', slaExistingRecordId)

        setMessage({ type: 'ok', text: `Semua bulan data ${activeTitle} tahun ${slaSelectedYear} telah direset menjadi 0%.` })
      } catch (err: any) {
        setMessage({ type: 'err', text: 'Gagal mereset SLA: ' + err.message })
      } finally {
        setLoading(false)
        setTimeout(() => setMessage(null), 3000)
      }
    } else {
      setLoading(false)
      setMessage({ type: 'ok', text: `Semua bulan data ${activeTitle} tahun ${slaSelectedYear} telah direset menjadi 0%.` })
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const handleAddNewSlaYear = () => {
    const y = parseInt(slaNewYearInput)
    if (y && !slaAvailableYears.includes(y)) {
      const nextYears = [...slaAvailableYears, y].sort((a, b) => b - a)
      setSlaAvailableYears(nextYears)
      setSlaSelectedYear(y)
      setSlaNewYearInput('')
      setMessage({ type: 'ok', text: `Tahun ${y} berhasil ditambahkan! Silakan input data SLA.` })
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const handleDeleteSlaYear = async () => {
    if (!confirm(`Apakah Anda yakin ingin MENGHAPUS TAHUN ${slaSelectedYear} dari verifikasi SLA? Seluruh data SLA tahun ini akan dihapus permanen dari database.`)) {
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      if (slaExistingRecordId) {
        const { error } = await supabase
          .from('financial_reports_data')
          .delete()
          .eq('category', 'verifikasi_sla')
          .eq('year', slaSelectedYear)

        if (error) throw error
      }

      setSlaExistingRecordId(null)
      const remainingYears = slaAvailableYears.filter(y => y !== slaSelectedYear)
      const nextYear = remainingYears.length > 0 ? remainingYears[0] : currentYear
      const updatedYears = remainingYears.length > 0 ? remainingYears : [currentYear]
      setSlaAvailableYears(updatedYears)
      setSlaSelectedYear(nextYear)
      loadSlaData(nextYear)

      setMessage({ type: 'ok', text: `Tahun ${slaSelectedYear} telah berhasil dihapus dari SLA!` })
      await fetchAvailableSlaYears()
    } catch (err: any) {
      setMessage({ type: 'err', text: 'Gagal menghapus tahun SLA: ' + err.message })
    } finally {
      setLoading(false)
      setTimeout(() => setMessage(null), 4000)
    }
  }

  const handleQuickEditSla = (bulan: string) => {
    handleSelectSlaBulan(bulan)
    window.scrollTo({ top: 350, behavior: 'smooth' })
  }

  // ===================== BA TUTUP TAGIHAN DATA HANDLERS =====================
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

  const loadBaMonthToForm = useCallback((data: MonthBaEntry[], targetBulan: string) => {
    const found = data.find(m => m.bulan === targetBulan)
    if (found && (found.has_data || found.total_penyedia > 0 || found.belum_dikonfirmasi > 0 || found.proses_penagihan > 0 || found.proses_pembuatan_ba > 0 || found.sudah_terbit_ba > 0)) {
      setBaTotalPenyedia(String(found.total_penyedia))
      setBaBelumKonfirmasi(String(found.belum_dikonfirmasi))
      setBaProsesPenagihan(String(found.proses_penagihan))
      setBaProsesPembuatanBa(String(found.proses_pembuatan_ba))
      setBaSudahTerbitBa(String(found.sudah_terbit_ba))
    } else {
      setBaTotalPenyedia('0')
      setBaBelumKonfirmasi('0')
      setBaProsesPenagihan('0')
      setBaProsesPembuatanBa('0')
      setBaSudahTerbitBa('0')
    }
  }, [])

  const getActiveBaTitle = (cat: 'penyedia' | 'nominal') => {
    return cat === 'nominal' ? (baJudulNominal || 'Nominal BA Tutup Tagihan') : (baJudulTabel || 'BA Tutup Tagihan')
  }

  const handleSwitchBaCategory = (cat: 'penyedia' | 'nominal') => {
    setBaCategory(cat)
    const targetMonths = cat === 'nominal' ? baMonthsNominal : baMonthsData
    loadBaMonthToForm(targetMonths, baEditBulan)
  }

  const loadBaData = useCallback(async (year: number) => {
    try {
      const { data, error } = await supabase
        .from('financial_reports_data')
        .select('*')
        .eq('category', 'verifikasi_ba_tutup_tagihan')
        .eq('year', year)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading BA data:', error)
        return
      }

      if (data && data.data) {
        setBaExistingRecordId(data.id)
        setBaHeaderText(data.data.header_text || 'Layanan Berita Acara (BA) Tutup Tagihan memastikan seluruh proses penagihan dari penyedia/vendor telah terverifikasi, terkonfirmasi, dan diterbitkan dokumen BA resmi untuk penyelesaian administrasi keuangan.')

        // Section 1: Jenis Tagihan
        setBaJudulJenisTagihan(data.data.judul_jenis_tagihan || 'Jenis Tagihan')
        setBaKetJenisTagihan(data.data.keterangan_jenis_tagihan || 'Rekapitulasi proporsi tagihan yang masuk ke RSCM berdasarkan klasifikasi dan kelompok kebutuhan belanja operasional, perbekalan farmasi, serta layanan medis.')
        const rawSavedItems = (data.data.jenis_tagihan_items !== undefined && Array.isArray(data.data.jenis_tagihan_items))
          ? data.data.jenis_tagihan_items
          : []
        const normalizedSavedItems = rawSavedItems.map((it: any) => ({
          ...it,
          jumlah_penyedia: it.jumlah_penyedia ?? it.jumlah ?? 0,
          sudah_terbit_ba: it.sudah_terbit_ba ?? 0,
          jumlah: it.jumlah_penyedia ?? it.jumlah ?? 0,
        }))
        setBaJenisTagihanItems(normalizedSavedItems)

        // Section 2: BA Tutup Tagihan Berdasarkan Proses
        const rawJudulTabel = data.data.judul_tabel
        const normalizedJudulTabel = (!rawJudulTabel || rawJudulTabel === 'BA Tutup Tagihan')
          ? 'BA Tutup Tagihan Berdasarkan Proses'
          : rawJudulTabel
        setBaJudulTabel(normalizedJudulTabel)
        setBaKet(data.data.keterangan || 'Monitoring penyelesaian Berita Acara (BA) Tutup Tagihan bagi penyedia/vendor barang dan jasa di lingkungan RSUPN Dr. Cipto Mangunkusumo.')
        const mPenyedia = (data.data.months && Array.isArray(data.data.months) && data.data.months.length > 0)
          ? data.data.months
          : createEmptyBaMonths()
        setBaMonthsData(mPenyedia)

        // Section 3: Nominal BA Tutup Tagihan Berdasarkan Nominal (Rp)
        const rawJudulNominal = data.data.judul_nominal
        const normalizedJudulNominal = (!rawJudulNominal || rawJudulNominal === 'Nominal BA Tutup Tagihan')
          ? 'BA Tutup Tagihan Berdasarkan Nominal (Rp)'
          : rawJudulNominal
        setBaJudulNominal(normalizedJudulNominal)
        setBaKetNominal(data.data.keterangan_nominal || 'Monitoring nominal penyelesaian Berita Acara (BA) Tutup Tagihan berdasarkan total nilai penagihan dari penyedia/vendor barang dan jasa di lingkungan RSUPN Dr. Cipto Mangunkusumo.')
        const mNominal = (data.data.months_nominal && Array.isArray(data.data.months_nominal) && data.data.months_nominal.length > 0)
          ? data.data.months_nominal
          : createEmptyBaMonths()
        setBaMonthsNominal(mNominal)

        const activeTarget = baCategory === 'nominal' ? mNominal : mPenyedia
        loadBaMonthToForm(activeTarget, baEditBulan)
        return
      }

      setBaExistingRecordId(null)
      setBaHeaderText('Layanan Berita Acara (BA) Tutup Tagihan memastikan seluruh proses penagihan dari penyedia/vendor telah terverifikasi, terkonfirmasi, dan diterbitkan dokumen BA resmi untuk penyelesaian administrasi keuangan.')

      setBaJudulJenisTagihan('Jenis Tagihan')
      setBaKetJenisTagihan('Rekapitulasi proporsi tagihan yang masuk ke RSCM berdasarkan klasifikasi dan kelompok kebutuhan belanja operasional, perbekalan farmasi, serta layanan medis.')
      setBaJenisTagihanItems([])

      setBaJudulTabel('BA Tutup Tagihan Berdasarkan Proses')
      setBaKet('Monitoring penyelesaian Berita Acara (BA) Tutup Tagihan bagi penyedia/vendor barang dan jasa di lingkungan RSUPN Dr. Cipto Mangunkusumo.')
      const empty1 = createEmptyBaMonths()
      setBaMonthsData(empty1)

      setBaJudulNominal('BA Tutup Tagihan Berdasarkan Nominal (Rp)')
      setBaKetNominal('Monitoring nominal penyelesaian Berita Acara (BA) Tutup Tagihan berdasarkan total nilai penagihan dari penyedia/vendor barang dan jasa di lingkungan RSUPN Dr. Cipto Mangunkusumo.')
      const empty2 = createEmptyBaMonths()
      setBaMonthsNominal(empty2)

      loadBaMonthToForm(empty1, baEditBulan)
    } catch (err: any) {
      console.error(err)
    }
  }, [supabase, baEditBulan, baCategory, loadBaMonthToForm])

  useEffect(() => {
    loadBaData(baSelectedYear)
  }, [baSelectedYear, loadBaData])

  const handleSelectBaBulan = (bulan: string) => {
    setBaEditBulan(bulan)
    const targetMonths = baCategory === 'nominal' ? baMonthsNominal : baMonthsData
    loadBaMonthToForm(targetMonths, bulan)
  }

  const updateBaTotalIfAuto = (belum: string, penagihan: string, buatBa: string, terbitBa: string) => {
    if (baAutoCalcTotal) {
      const b = parseInt(belum) || 0
      const p = parseInt(penagihan) || 0
      const m = parseInt(buatBa) || 0
      const t = parseInt(terbitBa) || 0
      setBaTotalPenyedia(String(b + p + m + t))
    }
  }

  const handleBaBelumChange = (val: string) => {
    setBaBelumKonfirmasi(val)
    updateBaTotalIfAuto(val, baProsesPenagihan, baProsesPembuatanBa, baSudahTerbitBa)
  }

  const handleBaPenagihanChange = (val: string) => {
    setBaProsesPenagihan(val)
    updateBaTotalIfAuto(baBelumKonfirmasi, val, baProsesPembuatanBa, baSudahTerbitBa)
  }

  const handleBaBuatBaChange = (val: string) => {
    setBaProsesPembuatanBa(val)
    updateBaTotalIfAuto(baBelumKonfirmasi, baProsesPenagihan, val, baSudahTerbitBa)
  }

  const handleBaTerbitBaChange = (val: string) => {
    setBaSudahTerbitBa(val)
    updateBaTotalIfAuto(baBelumKonfirmasi, baProsesPenagihan, baProsesPembuatanBa, val)
  }

  const handleSaveBaMonth = async () => {
    setLoading(true)
    setMessage(null)

    const totalVal = parseInt(baTotalPenyedia) || 0
    const belumVal = parseInt(baBelumKonfirmasi) || 0
    const penagihanVal = parseInt(baProsesPenagihan) || 0
    const buatBaVal = parseInt(baProsesPembuatanBa) || 0
    const terbitBaVal = parseInt(baSudahTerbitBa) || 0

    const currentMonths = baCategory === 'nominal' ? baMonthsNominal : baMonthsData
    const updatedMonths = currentMonths.map(m => {
      if (m.bulan === baEditBulan) {
        return {
          ...m,
          total_penyedia: totalVal,
          belum_dikonfirmasi: belumVal,
          proses_penagihan: penagihanVal,
          proses_pembuatan_ba: buatBaVal,
          sudah_terbit_ba: terbitBaVal,
          has_data: true
        }
      }
      return m
    })

    const payloadData = {
      tahun: baSelectedYear,
      header_text: baHeaderText.trim(),
      judul_jenis_tagihan: baJudulJenisTagihan.trim() || 'Jenis Tagihan',
      keterangan_jenis_tagihan: baKetJenisTagihan.trim(),
      jenis_tagihan_items: baJenisTagihanItems,
      judul_tabel: baJudulTabel.trim() || 'BA Tutup Tagihan',
      keterangan: baKet.trim(),
      months: baCategory === 'penyedia' ? updatedMonths : baMonthsData,
      judul_nominal: baJudulNominal.trim() || 'Nominal BA Tutup Tagihan',
      keterangan_nominal: baKetNominal.trim(),
      months_nominal: baCategory === 'nominal' ? updatedMonths : baMonthsNominal,
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
            item_name: `ba_${baSelectedYear}`,
            data: payloadData
          })
          .select()
          .single()

        if (error) throw error
        if (newRec) setBaExistingRecordId(newRec.id)
      }

      if (baCategory === 'nominal') {
        setBaMonthsNominal(updatedMonths)
      } else {
        setBaMonthsData(updatedMonths)
      }

      if (!baAvailableYears.includes(baSelectedYear)) {
        setBaAvailableYears(prev => Array.from(new Set([...prev, baSelectedYear])).sort((a, b) => b - a))
      }

      const activeTitle = getActiveBaTitle(baCategory)
      setMessage({ type: 'ok', text: `Data ${activeTitle} bulan ${baEditBulan} tahun ${baSelectedYear} berhasil disimpan!` })
    } catch (err: any) {
      setMessage({ type: 'err', text: 'Gagal menyimpan BA Tutup Tagihan: ' + err.message })
    } finally {
      setLoading(false)
      setTimeout(() => setMessage(null), 3500)
    }
  }

  const handleSaveBaTexts = async () => {
    setLoading(true)
    setMessage(null)

    const payloadData = {
      tahun: baSelectedYear,
      header_text: baHeaderText.trim(),
      judul_jenis_tagihan: baJudulJenisTagihan.trim() || 'Jenis Tagihan',
      keterangan_jenis_tagihan: baKetJenisTagihan.trim(),
      jenis_tagihan_items: baJenisTagihanItems,
      judul_tabel: baJudulTabel.trim() || 'BA Tutup Tagihan',
      keterangan: baKet.trim(),
      months: baMonthsData,
      judul_nominal: baJudulNominal.trim() || 'Nominal BA Tutup Tagihan',
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
            item_name: `ba_${baSelectedYear}`,
            data: payloadData
          })
          .select()
          .single()

        if (error) throw error
        if (newRec) setBaExistingRecordId(newRec.id)
      }

      setMessage({ type: 'ok', text: `Teks judul & catatan BA Tutup Tagihan tahun ${baSelectedYear} berhasil disimpan!` })
    } catch (err: any) {
      setMessage({ type: 'err', text: 'Gagal menyimpan teks BA: ' + err.message })
    } finally {
      setLoading(false)
      setTimeout(() => setMessage(null), 3500)
    }
  }

  // ================= HANDLERS MANAGEMENT JENIS TAGIHAN =================
  const handleAddOrUpdateJenisItem = () => {
    if (!newJenisNama.trim()) {
      alert('Nama jenis tagihan tidak boleh kosong.')
      return
    }
    const penyediaNum = parseInt(newJenisJumlahPenyedia) || 0
    const terbitNum = parseInt(newJenisSudahTerbitBa) || 0

    let updatedList: typeof baJenisTagihanItems = []
    if (editingJenisId) {
      // Update item yang ada
      updatedList = baJenisTagihanItems.map(item => {
        if (item.id === editingJenisId) {
          return {
            ...item,
            jenis: newJenisNama.trim(),
            jumlah_penyedia: penyediaNum,
            sudah_terbit_ba: terbitNum,
            jumlah: penyediaNum,
          }
        }
        return item
      })
      setEditingJenisId(null)
    } else {
      // Tambah item baru
      const newItem = {
        id: Date.now().toString(),
        jenis: newJenisNama.trim(),
        jumlah_penyedia: penyediaNum,
        sudah_terbit_ba: terbitNum,
        jumlah: penyediaNum,
      }
      updatedList = [...baJenisTagihanItems, newItem]
    }
    setBaJenisTagihanItems(updatedList)
    setNewJenisNama('')
    setNewJenisJumlahPenyedia('')
    setNewJenisSudahTerbitBa('')

    saveJenisTagihanItemsToDb(updatedList).then(ok => {
      if (ok) {
        setMessage({ type: 'ok', text: 'Data jenis tagihan berhasil disimpan ke database!' })
        setTimeout(() => setMessage(null), 3000)
      }
    })
  }

  const handleEditJenisItem = (item: { id: string; jenis: string; jumlah?: number; jumlah_penyedia?: number; sudah_terbit_ba?: number }) => {
    setEditingJenisId(item.id)
    setNewJenisNama(item.jenis)
    setNewJenisJumlahPenyedia(String(item.jumlah_penyedia ?? item.jumlah ?? 0))
    setNewJenisSudahTerbitBa(String(item.sudah_terbit_ba ?? 0))
  }

  const handleCancelEditJenis = () => {
    setEditingJenisId(null)
    setNewJenisNama('')
    setNewJenisJumlahPenyedia('')
    setNewJenisSudahTerbitBa('')
  }

  const saveJenisTagihanItemsToDb = async (itemsToSave: typeof baJenisTagihanItems) => {
    setLoading(true)
    const payloadData = {
      tahun: baSelectedYear,
      header_text: baHeaderText.trim(),
      judul_jenis_tagihan: baJudulJenisTagihan.trim() || 'Jenis Tagihan',
      keterangan_jenis_tagihan: baKetJenisTagihan.trim(),
      jenis_tagihan_items: itemsToSave,
      judul_tabel: baJudulTabel.trim() || 'BA Tutup Tagihan Berdasarkan Proses',
      keterangan: baKet.trim(),
      months: baMonthsData,
      judul_nominal: baJudulNominal.trim() || 'BA Tutup Tagihan Berdasarkan Nominal (Rp)',
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
            item_name: `ba_${baSelectedYear}`,
            data: payloadData
          })
          .select()
          .single()

        if (error) throw error
        if (newRec) setBaExistingRecordId(newRec.id)
      }
      return true
    } catch (err: any) {
      console.error('Error saving jenis tagihan to db:', err)
      setMessage({ type: 'err', text: 'Gagal menyimpan perubahan ke database: ' + err.message })
      return false
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteJenisItem = async (id: string) => {
    if (!confirm('Hapus jenis tagihan ini? Data di database akan langsung diperbarui.')) return
    const updated = baJenisTagihanItems.filter(item => item.id !== id)
    setBaJenisTagihanItems(updated)
    if (editingJenisId === id) {
      handleCancelEditJenis()
    }
    const ok = await saveJenisTagihanItemsToDb(updated)
    if (ok) {
      setMessage({ type: 'ok', text: 'Item jenis tagihan berhasil dihapus dari database!' })
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const handleClearAllJenisTagihan = async () => {
    if (!confirm(`Yakin ingin MENGHAPUS SEMUA item jenis tagihan untuk tahun ${baSelectedYear}?`)) return
    setBaJenisTagihanItems([])
    if (editingJenisId) {
      handleCancelEditJenis()
    }
    const ok = await saveJenisTagihanItemsToDb([])
    if (ok) {
      setMessage({ type: 'ok', text: `Semua item jenis tagihan tahun ${baSelectedYear} berhasil dikosongkan!` })
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const handleSaveJenisTagihanList = async () => {
    const ok = await saveJenisTagihanItemsToDb(baJenisTagihanItems)
    if (ok) {
      setMessage({ type: 'ok', text: `Daftar Jenis Tagihan tahun ${baSelectedYear} berhasil disimpan!` })
      setTimeout(() => setMessage(null), 3500)
    }
  }

  const handleResetBaMonth = async (bulan: string) => {
    const activeTitle = getActiveBaTitle(baCategory)
    if (!confirm(`Reset data ${activeTitle} bulan ${bulan} tahun ${baSelectedYear} menjadi 0?`)) return

    const currentMonths = baCategory === 'nominal' ? baMonthsNominal : baMonthsData
    const updatedMonths = currentMonths.map(m => {
      if (m.bulan === bulan) {
        return {
          ...m,
          total_penyedia: 0,
          belum_dikonfirmasi: 0,
          proses_penagihan: 0,
          proses_pembuatan_ba: 0,
          sudah_terbit_ba: 0,
          has_data: false
        }
      }
      return m
    })

    if (baCategory === 'nominal') {
      setBaMonthsNominal(updatedMonths)
    } else {
      setBaMonthsData(updatedMonths)
    }

    if (baEditBulan === bulan) {
      setBaTotalPenyedia('0')
      setBaBelumKonfirmasi('0')
      setBaProsesPenagihan('0')
      setBaProsesPembuatanBa('0')
      setBaSudahTerbitBa('0')
    }

    if (baExistingRecordId) {
      const payloadData = {
        tahun: baSelectedYear,
        header_text: baHeaderText.trim(),
        judul_jenis_tagihan: baJudulJenisTagihan.trim() || 'Jenis Tagihan',
        keterangan_jenis_tagihan: baKetJenisTagihan.trim(),
        jenis_tagihan_items: baJenisTagihanItems,
        judul_tabel: baJudulTabel.trim() || 'BA Tutup Tagihan',
        keterangan: baKet.trim(),
        months: baCategory === 'penyedia' ? updatedMonths : baMonthsData,
        judul_nominal: baJudulNominal.trim() || 'Nominal BA Tutup Tagihan',
        keterangan_nominal: baKetNominal.trim(),
        months_nominal: baCategory === 'nominal' ? updatedMonths : baMonthsNominal,
      }

      await supabase
        .from('financial_reports_data')
        .update({ data: payloadData })
        .eq('id', baExistingRecordId)
    }

    setMessage({ type: 'ok', text: `Data ${activeTitle} bulan ${bulan} telah direset menjadi 0.` })
    setTimeout(() => setMessage(null), 3000)
  }

  const handleResetAllBaMonths = async () => {
    const activeTitle = getActiveBaTitle(baCategory)
    if (!confirm(`YAKIN ingin mereset SEMUA bulan data ${activeTitle} tahun ${baSelectedYear} menjadi 0?`)) return

    setLoading(true)
    const empty = createEmptyBaMonths()
    if (baCategory === 'nominal') {
      setBaMonthsNominal(empty)
    } else {
      setBaMonthsData(empty)
    }
    loadBaMonthToForm(empty, baEditBulan)

    if (baExistingRecordId) {
      const payloadData = {
        tahun: baSelectedYear,
        header_text: baHeaderText.trim(),
        judul_jenis_tagihan: baJudulJenisTagihan.trim() || 'Jenis Tagihan',
        keterangan_jenis_tagihan: baKetJenisTagihan.trim(),
        jenis_tagihan_items: baJenisTagihanItems,
        judul_tabel: baJudulTabel.trim() || 'BA Tutup Tagihan',
        keterangan: baKet.trim(),
        months: baCategory === 'penyedia' ? empty : baMonthsData,
        judul_nominal: baJudulNominal.trim() || 'Nominal BA Tutup Tagihan',
        keterangan_nominal: baKetNominal.trim(),
        months_nominal: baCategory === 'nominal' ? empty : baMonthsNominal,
      }

      try {
        await supabase
          .from('financial_reports_data')
          .update({ data: payloadData })
          .eq('id', baExistingRecordId)

        setMessage({ type: 'ok', text: `Semua bulan data ${activeTitle} tahun ${baSelectedYear} telah direset menjadi 0.` })
      } catch (err: any) {
        setMessage({ type: 'err', text: 'Gagal mereset BA: ' + err.message })
      } finally {
        setLoading(false)
        setTimeout(() => setMessage(null), 3000)
      }
    } else {
      setLoading(false)
      setMessage({ type: 'ok', text: `Semua bulan data ${activeTitle} tahun ${baSelectedYear} telah direset menjadi 0.` })
      setTimeout(() => setMessage(null), 3000)
    }
  }


  const handleAddNewBaYear = () => {
    const y = parseInt(baNewYearInput)
    if (y && !baAvailableYears.includes(y)) {
      const nextYears = [...baAvailableYears, y].sort((a, b) => b - a)
      setBaAvailableYears(nextYears)
      setBaSelectedYear(y)
      setBaNewYearInput('')
      setMessage({ type: 'ok', text: `Tahun ${y} berhasil ditambahkan! Silakan input data BA Tutup Tagihan.` })
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const handleDeleteBaYear = async () => {
    if (!confirm(`Apakah Anda yakin ingin MENGHAPUS TAHUN ${baSelectedYear} dari verifikasi BA Tutup Tagihan? Seluruh data BA tahun ini akan dihapus permanen dari database.`)) {
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      if (baExistingRecordId) {
        const { error } = await supabase
          .from('financial_reports_data')
          .delete()
          .eq('category', 'verifikasi_ba_tutup_tagihan')
          .eq('year', baSelectedYear)

        if (error) throw error
      }

      setBaExistingRecordId(null)
      const remainingYears = baAvailableYears.filter(y => y !== baSelectedYear)
      const nextYear = remainingYears.length > 0 ? remainingYears[0] : currentYear
      const updatedYears = remainingYears.length > 0 ? remainingYears : [currentYear]
      setBaAvailableYears(updatedYears)
      setBaSelectedYear(nextYear)
      loadBaData(nextYear)

      setMessage({ type: 'ok', text: `Tahun ${baSelectedYear} telah berhasil dihapus dari BA Tutup Tagihan!` })
      await fetchAvailableBaYears()
    } catch (err: any) {
      setMessage({ type: 'err', text: 'Gagal menghapus tahun BA Tutup Tagihan: ' + err.message })
    } finally {
      setLoading(false)
      setTimeout(() => setMessage(null), 4000)
    }
  }

  const handleQuickEditBa = (bulan: string) => {
    handleSelectBaBulan(bulan)
    window.scrollTo({ top: 350, behavior: 'smooth' })
  }

  // Handle change month dropdown in form
  const handleSelectBulan = (bulan: string) => {
    setEditBulan(bulan)
    loadMonthToForm(monthsData, bulan)
  }

  // Auto-calc lolos when jumlah or proses changes
  const handleIntJmlChange = (val: string) => {
    setIntJml(val)
    const j = parseInt(val) || 0
    const p = parseInt(intPros) || 0
    if (j >= p) setIntLolos(String(j - p))
  }

  const handleIntProsChange = (val: string) => {
    setIntPros(val)
    const j = parseInt(intJml) || 0
    const p = parseInt(val) || 0
    if (j >= p) setIntLolos(String(j - p))
  }

  const handleEksJmlChange = (val: string) => {
    setEksJml(val)
    const j = parseInt(val) || 0
    const p = parseInt(eksPros) || 0
    if (j >= p) setEksLolos(String(j - p))
  }

  const handleEksProsChange = (val: string) => {
    setEksPros(val)
    const j = parseInt(eksJml) || 0
    const p = parseInt(val) || 0
    if (j >= p) setEksLolos(String(j - p))
  }

  // Save current month & full year data to Supabase
  const handleSaveMonth = async () => {
    setLoading(true)
    setMessage(null)

    const internalJmlNum = parseInt(intJml) || 0
    const internalProsNum = parseInt(intPros) || 0
    const internalLolosNum = parseInt(intLolos) || 0

    const eksternalJmlNum = parseInt(eksJml) || 0
    const eksternalProsNum = parseInt(eksPros) || 0
    const eksternalLolosNum = parseInt(eksLolos) || 0

    // Update monthsData array
    const updatedMonths = monthsData.map(m => {
      if (m.bulan === editBulan) {
        return {
          ...m,
          internal: {
            jumlah_dokumen: internalJmlNum,
            proses: internalProsNum,
            lolos: internalLolosNum,
          },
          eksternal: {
            jumlah_dokumen: eksternalJmlNum,
            proses: eksternalProsNum,
            lolos: eksternalLolosNum,
          },
          keseluruhan: {
            jumlah_dokumen: internalJmlNum + eksternalJmlNum,
            proses: internalProsNum + eksternalProsNum,
            lolos: internalLolosNum + eksternalLolosNum,
          }
        }
      }
      return m
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
      setMessage({ type: 'ok', text: `Data bulan ${editBulan} tahun ${selectedYear} berhasil disimpan ke database!` })
    } catch (err: any) {
      setMessage({ type: 'err', text: 'Gagal menyimpan: ' + err.message })
    } finally {
      setLoading(false)
      setTimeout(() => setMessage(null), 4000)
    }
  }

  // Save Header Text & Textbox Catatan
  const handleSaveKeterangan = async () => {
    setLoading(true)
    setMessage(null)

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
      setMessage({ type: 'ok', text: `Semua catatan dan penjelasan tahun ${selectedYear} berhasil disimpan!` })
    } catch (err: any) {
      setMessage({ type: 'err', text: 'Gagal menyimpan catatan: ' + err.message })
    } finally {
      setLoading(false)
      setTimeout(() => setMessage(null), 4000)
    }
  }

  // Save Text Box Section Perbandingan (Global / Bebas Periode Tahun)
  const handleSavePerbandingan = async () => {
    setLoading(true)
    setMessage(null)
    try {
      const { data: existing } = await supabase
        .from('financial_reports_data')
        .select('id')
        .eq('category', 'verifikasi_dokumen_tagihan_global')
        .eq('item_name', 'perbandingan_keterangan')
        .maybeSingle()

      const payloadData = {
        keterangan_perbandingan_internal: ketPerbandinganInternal.trim(),
        keterangan_perbandingan_eksternal: ketPerbandinganEksternal.trim(),
      }

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
            data: payloadData,
          })
        if (error) throw error
      }

      setMessage({ type: 'ok', text: 'Text box section perbandingan berhasil disimpan ke database!' })
    } catch (err: any) {
      setMessage({ type: 'err', text: 'Gagal menyimpan text box perbandingan: ' + err.message })
    } finally {
      setLoading(false)
      setTimeout(() => setMessage(null), 4000)
    }
  }

  // Add new year
  const handleAddNewYear = () => {
    const y = parseInt(newYearInput)
    if (y && !availableYears.includes(y)) {
      const nextYears = [...availableYears, y].sort((a, b) => b - a)
      setAvailableYears(nextYears)
      setSelectedYear(y)
      setNewYearInput('')
      setMessage({ type: 'ok', text: `Tahun ${y} dipilih. Silakan masukkan data untuk tahun ${y}.` })
      setTimeout(() => setMessage(null), 3000)
    } else if (y && availableYears.includes(y)) {
      setSelectedYear(y)
      setNewYearInput('')
    }
  }

  // Hapus tahun aktif dari database
  const handleDeleteYear = async () => {
    if (!confirm(`Apakah Anda yakin ingin MENGHAPUS TAHUN ${selectedYear}? Tahun ini dan seluruh datanya akan dihapus permanen dari verifikasi dokumen tagihan.`)) {
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      if (existingRecordId) {
        const { error } = await supabase
          .from('financial_reports_data')
          .delete()
          .eq('category', 'verifikasi_dokumen_tagihan')
          .eq('year', selectedYear)

        if (error) throw error
      }

      setExistingRecordId(null)
      const empty = createEmptyMonths()
      setMonthsData(empty)
      loadMonthToForm(empty, editBulan)

      const remainingYears = availableYears.filter(y => y !== selectedYear)
      const nextYear = remainingYears.length > 0 ? remainingYears[0] : currentYear
      const updatedYears = remainingYears.length > 0 ? remainingYears : [currentYear]
      setAvailableYears(updatedYears)
      setSelectedYear(nextYear)
      loadData(nextYear)

      setMessage({ type: 'ok', text: `Tahun ${selectedYear} telah berhasil dihapus!` })
      await fetchAvailableYears()
    } catch (err: any) {
      setMessage({ type: 'err', text: 'Gagal menghapus tahun: ' + err.message })
    } finally {
      setLoading(false)
      setTimeout(() => setMessage(null), 4000)
    }
  }

  // Reset semua 12 bulan menjadi 0
  const handleResetAllMonths = async () => {
    if (!confirm(`Reset seluruh angka 12 bulan pada tahun ${selectedYear} menjadi 0?`)) {
      return
    }

    setLoading(true)
    const empty = createEmptyMonths()
    setMonthsData(empty)
    loadMonthToForm(empty, editBulan)

    if (existingRecordId) {
      const payloadData = {
        tahun: selectedYear,
        header_text: headerText.trim(),
        judul_text_keseluruhan: judulKeseluruhan.trim(),
        keterangan_keseluruhan: ketKeseluruhan.trim(),
        judul_text_internal: judulInternal.trim(),
        keterangan_internal: ketInternal.trim(),
        judul_text_eksternal: judulEksternal.trim(),
        keterangan_eksternal: ketEksternal.trim(),
        months: empty
      }

      try {
        await supabase
          .from('financial_reports_data')
          .update({ data: payloadData })
          .eq('id', existingRecordId)

        setMessage({ type: 'ok', text: `Semua bulan tahun ${selectedYear} telah direset menjadi 0.` })
      } catch (err: any) {
        setMessage({ type: 'err', text: 'Gagal mereset: ' + err.message })
      } finally {
        setLoading(false)
        setTimeout(() => setMessage(null), 3000)
      }
    } else {
      setLoading(false)
      setMessage({ type: 'ok', text: `Semua bulan tahun ${selectedYear} telah direset menjadi 0.` })
      setTimeout(() => setMessage(null), 3000)
    }
  }

  // Quick edit button in table
  const handleQuickEdit = (bulan: string) => {
    handleSelectBulan(bulan)
    window.scrollTo({ top: 400, behavior: 'smooth' })
  }

  // Reset single month values to 0
  const handleResetMonth = async (bulan: string) => {
    if (!confirm(`Reset data bulan ${bulan} menjadi 0?`)) return

    const updatedMonths = monthsData.map(m => {
      if (m.bulan === bulan) {
        return {
          ...m,
          internal: { jumlah_dokumen: 0, proses: 0, lolos: 0 },
          eksternal: { jumlah_dokumen: 0, proses: 0, lolos: 0 },
          keseluruhan: { jumlah_dokumen: 0, proses: 0, lolos: 0 },
        }
      }
      return m
    })

    setMonthsData(updatedMonths)

    if (editBulan === bulan) {
      setIntJml('0'); setIntPros('0'); setIntLolos('0')
      setEksJml('0'); setEksPros('0'); setEksLolos('0')
    }

    if (existingRecordId) {
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

      await supabase
        .from('financial_reports_data')
        .update({ data: payloadData })
        .eq('id', existingRecordId)
    }

    setMessage({ type: 'ok', text: `Data bulan ${bulan} telah direset menjadi 0.` })
    setTimeout(() => setMessage(null), 3000)
  }

  return (
    <div className="min-h-screen" style={{ background: '#f0f4f5' }}>
      {/* Top Header */}
      <div style={{ background: '#00282b' }} className="px-4 sm:px-6 py-6">
        <div className="max-w-6xl mx-auto">
          <p className="font-nav text-xs text-white/50 mb-1">
            <Link href="/admin/dashboard" className="hover:text-white transition-colors">← Dashboard</Link>
          </p>
          <h1 className="font-nav font-bold text-white text-xl">Kelola Akuntansi Verifikasi</h1>
          <p className="font-nav text-xs text-white/70 mt-0.5">
            Kelola data Dokumen Tagihan (Internal, Eksternal & Keseluruhan) per periode tahun dan bulan
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Alert Notification */}
        {message && (
          <div className={`p-4 rounded-2xl font-nav text-sm border flex items-center gap-2 ${
            message.type === 'ok' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'
          }`}>
            <CheckCircle2 size={18} />
            <span>{message.text}</span>
          </div>
        )}

        {/* ================= TAB SWITCHER (DOKUMEN TAGIHAN vs SLA vs BA TUTUP TAGIHAN) ================= */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveAdminTab('dokumen_tagihan')}
            className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl font-nav font-bold text-sm transition-all cursor-pointer shadow-xs ${
              activeAdminTab === 'dokumen_tagihan'
                ? 'bg-[#00282b] text-white ring-2 ring-[#01bcce]/50'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <FileText size={17} className={activeAdminTab === 'dokumen_tagihan' ? 'text-[#01bcce]' : 'text-gray-400'} />
            Dokumen Tagihan
          </button>

          <button
            type="button"
            onClick={() => setActiveAdminTab('sla')}
            className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl font-nav font-bold text-sm transition-all cursor-pointer shadow-xs ${
              activeAdminTab === 'sla'
                ? 'bg-[#00282b] text-white ring-2 ring-[#01bcce]/50'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <Clock size={17} className={activeAdminTab === 'sla' ? 'text-[#01bcce]' : 'text-gray-400'} />
            SLA (Capaian)
          </button>

          <button
            type="button"
            onClick={() => setActiveAdminTab('ba_tutup_tagihan')}
            className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl font-nav font-bold text-sm transition-all cursor-pointer shadow-xs ${
              activeAdminTab === 'ba_tutup_tagihan'
                ? 'bg-[#00282b] text-white ring-2 ring-[#01bcce]/50'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <FileCheck size={17} className={activeAdminTab === 'ba_tutup_tagihan' ? 'text-[#01bcce]' : 'text-gray-400'} />
            BA Tutup Tagihan
          </button>
        </div>

        {/* ================= TAB 1: DOKUMEN TAGIHAN ================= */}
        {activeAdminTab === 'dokumen_tagihan' && (
          <div className="space-y-6">
            {/* ================= CARD 1: FORM INPUT DOKUMEN PER TAHUN & BULAN ================= */}
            <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-sm border border-gray-100">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-100">
            <div>
              <h2 className="font-nav font-bold text-gray-800 text-lg flex items-center gap-2">
                <Plus size={20} style={{ color: '#01bcce' }} />
                Form Input Dokumen Tagihan
              </h2>
              <p className="font-nav text-xs text-gray-500 mt-0.5">
                Pilih Tahun dan Bulan yang ingin diisi/diedit, lalu masukkan angka dokumen tagihan internal & eksternal.
              </p>
            </div>

            {/* Indikator Status Database */}
            <div className="flex items-center gap-2 flex-wrap">
              {existingRecordId ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200">
                  <CheckCircle2 size={13} /> Data Tahun {selectedYear} Tersimpan di DB
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  <AlertTriangle size={13} /> Data Tahun {selectedYear} Belum Tersimpan (Kosong)
                </span>
              )}
            </div>
          </div>

          {/* BARIS PILIH TAHUN & BULAN (JELAS DAN LENGKAP) */}
          <div className="bg-[#f8fafc] rounded-2xl p-4 sm:p-5 border border-gray-200 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              {/* Kolom Tahun */}
              <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-gray-200 shadow-xs">
                <Calendar size={16} className="text-[#01bcce]" />
                <span className="font-nav text-xs font-black text-gray-700 uppercase">Tahun:</span>
                <select
                  value={selectedYear}
                  onChange={e => setSelectedYear(parseInt(e.target.value))}
                  className="font-nav font-black text-sm text-[#00282b] bg-transparent outline-none cursor-pointer"
                >
                  {availableYears.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              {/* Tambah Tahun Baru */}
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  placeholder="Thn baru..."
                  value={newYearInput}
                  onChange={e => setNewYearInput(e.target.value)}
                  className="w-24 px-3 py-2 rounded-xl border border-gray-200 font-nav text-xs outline-none focus:border-[#01bcce] bg-white shadow-xs"
                />
                <button
                  type="button"
                  onClick={handleAddNewYear}
                  className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-nav font-bold text-xs transition-colors cursor-pointer shadow-xs"
                >
                  + Tambah Tahun
                </button>
              </div>

              {/* Kolom Bulan */}
              <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-[#01bcce]/40 shadow-xs ring-2 ring-[#01bcce]/15">
                <span className="font-nav text-xs font-black text-[#00282b] uppercase">Bulan:</span>
                <select
                  value={editBulan}
                  onChange={e => handleSelectBulan(e.target.value)}
                  className="font-nav font-black text-sm text-[#00282b] bg-transparent outline-none cursor-pointer"
                >
                  {NAMA_BULAN.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tombol Aksi Hapus / Reset Tahun */}
            <div className="flex items-center gap-2 flex-wrap">
              {(availableYears.length > 1 || existingRecordId) && (
                <button
                  type="button"
                  onClick={handleDeleteYear}
                  disabled={loading}
                  className="px-3.5 py-2 rounded-xl text-xs font-nav font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors cursor-pointer flex items-center gap-1.5"
                  title={`Hapus tahun ${selectedYear} dari verifikasi dokumen tagihan`}
                >
                  <Trash2 size={13} />
                  Hapus Tahun {selectedYear}
                </button>
              )}
              <button
                type="button"
                onClick={handleResetAllMonths}
                disabled={loading}
                className="px-3 py-2 rounded-xl text-xs font-nav font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 border border-gray-200 transition-colors cursor-pointer flex items-center gap-1.5"
                title="Reset seluruh angka 12 bulan menjadi 0"
              >
                <RotateCcw size={13} />
                Reset 12 Bulan (0)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Box Input Internal */}
            <div className="p-5 rounded-2xl border border-gray-200 bg-[#fbfdfd]">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                <span className="w-3 h-3 rounded-full bg-[#d0db41]" />
                <h3 className="font-nav font-bold text-sm text-[#00282b]">
                  Dokumen Tagihan Internal ({editBulan} {selectedYear})
                </h3>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="font-nav text-xs font-bold text-gray-500 uppercase block mb-1">
                    Jumlah Dokumen
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={intJml}
                    onChange={e => handleIntJmlChange(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 font-nav text-sm font-bold text-gray-800 outline-none focus:border-[#01bcce]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-nav text-xs font-bold text-[#01bcce] uppercase block mb-1">
                      Proses Verifikasi
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={intPros}
                      onChange={e => handleIntProsChange(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-200 font-nav text-sm font-bold text-[#01bcce] outline-none focus:border-[#01bcce]"
                    />
                  </div>
                  <div>
                    <label className="font-nav text-xs font-bold text-[#10b981] uppercase block mb-1">
                      Lolos Verifikasi
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={intLolos}
                      onChange={e => setIntLolos(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-200 font-nav text-sm font-bold text-[#10b981] outline-none focus:border-[#01bcce]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Box Input Eksternal */}
            <div className="p-5 rounded-2xl border border-gray-200 bg-[#fbfdfd]">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                <span className="w-3 h-3 rounded-full bg-[#00282b]" />
                <h3 className="font-nav font-bold text-sm text-[#00282b]">
                  Dokumen Tagihan Eksternal ({editBulan} {selectedYear})
                </h3>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="font-nav text-xs font-bold text-gray-500 uppercase block mb-1">
                    Jumlah Dokumen
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={eksJml}
                    onChange={e => handleEksJmlChange(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 font-nav text-sm font-bold text-gray-800 outline-none focus:border-[#01bcce]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-nav text-xs font-bold text-[#01bcce] uppercase block mb-1">
                      Proses Verifikasi
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={eksPros}
                      onChange={e => handleEksProsChange(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-200 font-nav text-sm font-bold text-[#01bcce] outline-none focus:border-[#01bcce]"
                    />
                  </div>
                  <div>
                    <label className="font-nav text-xs font-bold text-[#10b981] uppercase block mb-1">
                      Lolos Verifikasi
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={eksLolos}
                      onChange={e => setEksLolos(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-200 font-nav text-sm font-bold text-[#10b981] outline-none focus:border-[#01bcce]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Auto Preview Keseluruhan */}
          <div className="p-4 rounded-xl bg-[#eef9fa] border border-[#01bcce]/20 mb-6 flex items-center justify-between flex-wrap gap-4 font-nav">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#01bcce]" />
              <span className="text-xs font-bold text-[#00282b] uppercase">
                Otomatis Terhitung Keseluruhan ({editBulan} {selectedYear}):
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold">
              <span>Jumlah: <strong className="text-gray-800">{(parseInt(intJml) || 0) + (parseInt(eksJml) || 0)}</strong></span>
              <span>Proses: <strong className="text-[#01bcce]">{(parseInt(intPros) || 0) + (parseInt(eksPros) || 0)}</strong></span>
              <span>Lolos: <strong className="text-[#10b981]">{(parseInt(intLolos) || 0) + (parseInt(eksLolos) || 0)}</strong></span>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSaveMonth}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-nav font-bold text-sm text-white disabled:opacity-50 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer shadow-sm"
              style={{ background: '#00282b' }}
            >
              <Save size={16} />
              {loading ? 'Menyimpan...' : `Simpan Data ${editBulan} ${selectedYear}`}
            </button>
          </div>
        </div>

        {/* ================= CARD 2: KELOLA TEXT BOX & CATATAN PENJELASAN ================= */}
        <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-sm border border-gray-100">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-gray-100 mb-6">
            <div>
              <h2 className="font-nav font-bold text-gray-800 text-base sm:text-lg flex items-center gap-2">
                <FileText size={20} style={{ color: '#01bcce' }} />
                Kelola Text Box Penjelasan Dokumen (Tahun {selectedYear})
              </h2>
              <p className="font-nav text-xs text-gray-500 mt-1">
                Atur isi kalimat penjelasan untuk masing-masing text box di bawah tabel (tampil tanpa judul di halaman publik). Ukuran text box di halaman publik akan otomatis menyesuaikan dengan panjangnya kalimat.
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
              Simpan Text Box (Tahun {selectedYear})
            </button>
          </div>

          {/* Penjelasan Singkat Header */}
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
            {/* Text Box 1: Keseluruhan */}
            <div className="p-4 rounded-2xl bg-[#f8fafc] border border-[#01bcce]/25 flex flex-col gap-3">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                <span className="w-3 h-3 rounded-full bg-[#01bcce]" />
                <span className="font-nav font-bold text-xs text-[#00282b] uppercase tracking-wider">
                  Text Box Dokumen Keseluruhan
                </span>
              </div>
              <div className="flex-1 flex flex-col">
                <label className="font-nav text-[11px] font-bold text-gray-500 uppercase block mb-1">
                  Isi Kalimat Penjelasan:
                </label>
                <textarea
                  rows={6}
                  value={ketKeseluruhan}
                  onChange={e => setKetKeseluruhan(e.target.value)}
                  placeholder="Tulis kalimat penjelasan dokumen keseluruhan di sini..."
                  className="w-full flex-1 px-3 py-2 rounded-xl border border-gray-200 font-nav text-xs text-gray-700 bg-white outline-none focus:border-[#01bcce] leading-relaxed"
                />
              </div>
              <p className="text-[10px] text-gray-400 font-semibold italic">
                * Tampil di bawah tabel tanpa judul. Panjang box otomatis menyesuaikan kalimat.
              </p>
            </div>

            {/* Text Box 2: Internal */}
            <div className="p-4 rounded-2xl bg-[#fbfcfa] border border-[#d0db41]/40 flex flex-col gap-3">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                <span className="w-3 h-3 rounded-full bg-[#d0db41]" />
                <span className="font-nav font-bold text-xs text-[#00282b] uppercase tracking-wider">
                  Text Box Dokumen Internal
                </span>
              </div>
              <div className="flex-1 flex flex-col">
                <label className="font-nav text-[11px] font-bold text-gray-500 uppercase block mb-1">
                  Isi Kalimat Penjelasan:
                </label>
                <textarea
                  rows={6}
                  value={ketInternal}
                  onChange={e => setKetInternal(e.target.value)}
                  placeholder="Tulis kalimat penjelasan dokumen internal di sini..."
                  className="w-full flex-1 px-3 py-2 rounded-xl border border-gray-200 font-nav text-xs text-gray-700 bg-white outline-none focus:border-[#d0db41] leading-relaxed"
                />
              </div>
              <p className="text-[10px] text-gray-400 font-semibold italic">
                * Tampil di bawah tabel tanpa judul. Panjang box otomatis menyesuaikan kalimat.
              </p>
            </div>

            {/* Text Box 3: Eksternal */}
            <div className="p-4 rounded-2xl bg-[#f8fafc] border border-[#00282b]/25 flex flex-col gap-3">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                <span className="w-3 h-3 rounded-full bg-[#00282b]" />
                <span className="font-nav font-bold text-xs text-[#00282b] uppercase tracking-wider">
                  Text Box Dokumen Eksternal
                </span>
              </div>
              <div className="flex-1 flex flex-col">
                <label className="font-nav text-[11px] font-bold text-gray-500 uppercase block mb-1">
                  Isi Kalimat Penjelasan:
                </label>
                <textarea
                  rows={6}
                  value={ketEksternal}
                  onChange={e => setKetEksternal(e.target.value)}
                  placeholder="Tulis kalimat penjelasan dokumen eksternal di sini..."
                  className="w-full flex-1 px-3 py-2 rounded-xl border border-gray-200 font-nav text-xs text-gray-700 bg-white outline-none focus:border-[#00282b] leading-relaxed"
                />
              </div>
              <p className="text-[10px] text-gray-400 font-semibold italic">
                * Tampil di bawah tabel tanpa judul. Panjang box otomatis menyesuaikan kalimat.
              </p>
            </div>
          </div>
        </div>

        {/* ================= CARD 3: TEXT BOX SECTION PERBANDINGAN (BEBAS PERIODE TAHUN) ================= */}
        <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-sm border border-gray-100">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-100">
            <div>
              <h2 className="font-nav font-bold text-gray-800 text-base sm:text-lg flex items-center gap-2">
                <ArrowRightLeft size={18} style={{ color: '#01bcce' }} />
                Text Box Section Perbandingan Dokumen Tagihan
              </h2>
              <p className="font-nav text-xs text-gray-500 mt-1 max-w-2xl leading-relaxed">
                Catatan text box section perbandingan bersifat umum (<strong>tidak terikat periode tahun dan tidak menyimpan riwayat tahunan</strong>).
                Kotak <strong>hanya akan tampil di halaman publik jika ada kalimat yang diisi</strong>. Jika dikosongkan, kotak tidak akan muncul di halaman publik.
              </p>
            </div>

            <div className="flex items-center gap-2.5 self-end sm:self-center flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  setKetPerbandinganInternal('')
                  setKetPerbandinganEksternal('')
                }}
                disabled={loading}
                className="px-3.5 py-2.5 rounded-xl text-xs font-nav font-bold text-gray-500 hover:text-red-600 hover:bg-red-50 border border-gray-200 transition-all cursor-pointer"
                title="Hapus teks agar kotak tidak tampil di halaman publik"
              >
                Kosongkan
              </button>
              <button
                type="button"
                onClick={handleSavePerbandingan}
                disabled={loading}
                className="px-5 py-2.5 rounded-xl text-xs font-nav font-bold text-white transition-all cursor-pointer flex items-center gap-2 shadow-sm hover:opacity-90 disabled:opacity-50"
                style={{ background: '#00282b' }}
              >
                <Save size={14} style={{ color: '#01bcce' }} />
                Simpan Text Box Perbandingan
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Text Box Perbandingan Internal */}
            <div className="p-4 rounded-2xl bg-[#fbfcfa] border border-[#d0db41]/40 flex flex-col gap-3">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                <span className="w-3 h-3 rounded-full bg-[#d0db41]" />
                <span className="font-nav font-bold text-xs text-[#00282b] uppercase tracking-wider">
                  Text Box Perbandingan Internal
                </span>
              </div>
              <div className="flex-1 flex flex-col">
                <label className="font-nav text-[11px] font-bold text-gray-500 uppercase block mb-1">
                  Isi Kalimat Penjelasan:
                </label>
                <textarea
                  rows={4}
                  value={ketPerbandinganInternal}
                  onChange={e => setKetPerbandinganInternal(e.target.value)}
                  placeholder="Tulis kalimat penjelasan perbandingan internal di sini (kosongkan jika tidak ingin menampilkan kotak)..."
                  className="w-full flex-1 px-3 py-2 rounded-xl border border-gray-200 font-nav text-xs text-gray-700 bg-white outline-none focus:border-[#d0db41] leading-relaxed"
                />
              </div>
              <p className="text-[10px] text-gray-400 font-semibold italic">
                * Tampil di bawah tabel perbandingan internal tanpa judul. Jika kosong, kotak tidak tampil.
              </p>
            </div>

            {/* Text Box Perbandingan Eksternal */}
            <div className="p-4 rounded-2xl bg-[#f8fafc] border border-[#00282b]/25 flex flex-col gap-3">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                <span className="w-3 h-3 rounded-full bg-[#00282b]" />
                <span className="font-nav font-bold text-xs text-[#00282b] uppercase tracking-wider">
                  Text Box Perbandingan Eksternal
                </span>
              </div>
              <div className="flex-1 flex flex-col">
                <label className="font-nav text-[11px] font-bold text-gray-500 uppercase block mb-1">
                  Isi Kalimat Penjelasan:
                </label>
                <textarea
                  rows={4}
                  value={ketPerbandinganEksternal}
                  onChange={e => setKetPerbandinganEksternal(e.target.value)}
                  placeholder="Tulis kalimat penjelasan perbandingan eksternal di sini (kosongkan jika tidak ingin menampilkan kotak)..."
                  className="w-full flex-1 px-3 py-2 rounded-xl border border-gray-200 font-nav text-xs text-gray-700 bg-white outline-none focus:border-[#00282b] leading-relaxed"
                />
              </div>
              <p className="text-[10px] text-gray-400 font-semibold italic">
                * Tampil di bawah tabel perbandingan eksternal tanpa judul. Jika kosong, kotak tidak tampil.
              </p>
            </div>
          </div>
        </div>

        {/* ================= CARD 4: TABEL REKAPITULASI 12 BULAN ================= */}
        <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div>
              <h2 className="font-nav font-bold text-gray-800 text-base">
                Ringkasan Data Dokumen Tagihan (Tahun {selectedYear})
              </h2>
              <p className="font-nav text-xs text-gray-400 mt-0.5">
                Daftar data 12 bulan yang tampil di halaman publik Akuntansi Verifikasi
              </p>
            </div>
            <Link
              href="/akuntansi-verifikasi"
              target="_blank"
              className="font-nav text-xs font-bold text-[#01bcce] hover:underline flex items-center gap-1"
            >
              Lihat Halaman Publik <ArrowRight size={13} />
            </Link>
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full text-left font-nav text-xs">
              <thead className="bg-[#f8fafa] border-b border-gray-100 text-gray-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-3 text-center">Periode</th>
                  <th className="py-3 px-3 text-center bg-gray-50/70" colSpan={3}>Tagihan Internal</th>
                  <th className="py-3 px-3 text-center bg-gray-100/50" colSpan={3}>Tagihan Eksternal</th>
                  <th className="py-3 px-3 text-center bg-[#eef9fa]" colSpan={3}>Keseluruhan</th>
                  <th className="py-3 px-3 text-center">Aksi</th>
                </tr>
                <tr className="border-t border-gray-100 text-[10px] text-gray-400">
                  <th className="py-1 px-3"></th>
                  <th className="py-1 px-2 text-center">Jml</th>
                  <th className="py-1 px-2 text-center text-[#01bcce]">Pros</th>
                  <th className="py-1 px-2 text-center text-[#10b981]">Lolos</th>
                  <th className="py-1 px-2 text-center">Jml</th>
                  <th className="py-1 px-2 text-center text-[#01bcce]">Pros</th>
                  <th className="py-1 px-2 text-center text-[#10b981]">Lolos</th>
                  <th className="py-1 px-2 text-center">Jml</th>
                  <th className="py-1 px-2 text-center text-[#01bcce]">Pros</th>
                  <th className="py-1 px-2 text-center text-[#10b981]">Lolos</th>
                  <th className="py-1 px-2 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {monthsData.map((m) => {
                  const kesJml = m.keseluruhan?.jumlah_dokumen ?? (m.internal.jumlah_dokumen + m.eksternal.jumlah_dokumen)
                  const kesPros = m.keseluruhan?.proses ?? (m.internal.proses + m.eksternal.proses)
                  const kesLolos = m.keseluruhan?.lolos ?? (m.internal.lolos + m.eksternal.lolos)

                  return (
                    <tr key={m.bulan} className={`hover:bg-gray-50/80 transition-colors ${editBulan === m.bulan ? 'bg-[#eef9fa]/40 font-bold' : ''}`}>
                      <td className="py-2.5 px-3 font-bold text-gray-800">
                        {m.bulan}
                      </td>

                      {/* Internal */}
                      <td className="py-2.5 px-2 text-center text-gray-700">{m.internal.jumlah_dokumen}</td>
                      <td className="py-2.5 px-2 text-center text-[#01bcce]">{m.internal.proses}</td>
                      <td className="py-2.5 px-2 text-center text-[#10b981]">{m.internal.lolos}</td>

                      {/* Eksternal */}
                      <td className="py-2.5 px-2 text-center text-gray-700">{m.eksternal.jumlah_dokumen}</td>
                      <td className="py-2.5 px-2 text-center text-[#01bcce]">{m.eksternal.proses}</td>
                      <td className="py-2.5 px-2 text-center text-[#10b981]">{m.eksternal.lolos}</td>

                      {/* Keseluruhan */}
                      <td className="py-2.5 px-2 text-center font-bold text-gray-900 bg-[#eef9fa]/30">{kesJml}</td>
                      <td className="py-2.5 px-2 text-center font-bold text-[#01bcce] bg-[#eef9fa]/30">{kesPros}</td>
                      <td className="py-2.5 px-2 text-center font-bold text-[#10b981] bg-[#eef9fa]/30">{kesLolos}</td>

                      {/* Actions */}
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleQuickEdit(m.bulan)}
                            className="p-1 rounded-lg text-[#01bcce] hover:bg-cyan-50 transition-colors cursor-pointer"
                            title="Edit Bulan Ini"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleResetMonth(m.bulan)}
                            className="p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Reset Bulan Ini ke 0"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
        </div>
      )}

      {/* ================= TAB 2: SLA (CAPAIAN) ================= */}
      {activeAdminTab === 'sla' && (
        <div className="space-y-6">
          {/* ================= CARD 1: FORM INPUT SLA PER BULAN ================= */}
          <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-sm border border-gray-100">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-100">
              <div>
                <h2 className="font-nav font-bold text-gray-800 text-lg flex items-center gap-2">
                  <Clock size={20} style={{ color: '#01bcce' }} />
                  Form Input SLA: {getActiveSlaTitle(slaCategory)} (%)
                </h2>
                <p className="font-nav text-xs text-gray-500 mt-0.5">
                  Pilih Kategori, Tahun, dan Bulan yang ingin diisi/diedit, lalu masukkan persentase capaian SLA Internal dan Eksternal.
                </p>
              </div>

              {/* Indikator Status Database SLA */}
              <div className="flex items-center gap-2 flex-wrap">
                {slaExistingRecordId ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200">
                    <CheckCircle2 size={13} /> Data SLA Tahun {slaSelectedYear} Tersimpan di DB
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    <AlertTriangle size={13} /> Data SLA Tahun {slaSelectedYear} Belum Tersimpan (Kosong)
                  </span>
                )}
              </div>
            </div>

            {/* SWITCHER KATEGORI SLA: Capaian, Pengambilan Dokumen, Pengembalian Dokumen */}
            <div className="mb-6">
              <label className="block text-[11px] font-black uppercase tracking-wider text-gray-500 mb-2 font-nav">
                Pilih Kategori SLA yang Ingin Diinput:
              </label>
              <div className="flex items-center gap-2 p-1.5 bg-[#f1f5f9] rounded-2xl border border-gray-200 overflow-x-auto">
                {[
                  { id: 'capaian', label: 'SLA Verifikasi', icon: TrendingUp },
                  { id: 'pengambilan', label: 'SLA Pengambilan', icon: FileDown },
                  { id: 'pengembalian', label: 'SLA Pengembalian', icon: FileUp },
                ].map(cat => {
                  const Icon = cat.icon
                  const isActive = slaCategory === cat.id
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleSwitchSlaCategory(cat.id as 'capaian' | 'pengambilan' | 'pengembalian')}
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

            {/* Baris Pilih Tahun & Bulan SLA */}
            <div className="bg-[#f8fafc] rounded-2xl p-4 sm:p-5 border border-gray-200 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                {/* Kolom Tahun */}
                <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-gray-200 shadow-xs">
                  <Calendar size={16} className="text-[#01bcce]" />
                  <span className="font-nav text-xs font-black text-gray-700 uppercase">Tahun:</span>
                  <select
                    value={slaSelectedYear}
                    onChange={(e) => setSlaSelectedYear(parseInt(e.target.value))}
                    className="font-nav font-black text-sm text-[#00282b] bg-transparent outline-none cursor-pointer"
                  >
                    {slaAvailableYears.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>

                {/* Tambah Tahun Baru */}
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    placeholder="Tahun baru..."
                    value={slaNewYearInput}
                    onChange={(e) => setSlaNewYearInput(e.target.value)}
                    className="w-28 px-3 py-2 text-xs font-nav font-bold bg-white border border-gray-200 rounded-xl outline-none focus:border-[#01bcce]"
                  />
                  <button
                    type="button"
                    onClick={handleAddNewSlaYear}
                    className="px-3 py-2 text-xs font-nav font-bold text-white rounded-xl flex items-center gap-1 cursor-pointer transition-all hover:opacity-90"
                    style={{ background: '#00282b' }}
                  >
                    <Plus size={13} /> Tambah
                  </button>
                </div>

                <span className="text-gray-300 hidden sm:inline">|</span>

                {/* Kolom Bulan */}
                <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-gray-200 shadow-xs">
                  <span className="font-nav text-xs font-black text-gray-700 uppercase">Bulan:</span>
                  <select
                    value={slaEditBulan}
                    onChange={(e) => handleSelectSlaBulan(e.target.value)}
                    className="font-nav font-black text-sm text-[#01bcce] bg-transparent outline-none cursor-pointer"
                  >
                    {NAMA_BULAN.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status Kategori & Tombol Hapus Tahun SLA */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="text-xs font-nav text-gray-500">
                  <span>Kategori: <strong className="text-[#01bcce]">{getActiveSlaTitle(slaCategory)}</strong> — Bulan: <strong className="text-[#00282b]">{slaEditBulan} {slaSelectedYear}</strong></span>
                </div>
                {(slaAvailableYears.length > 1 || slaExistingRecordId) && (
                  <button
                    type="button"
                    onClick={handleDeleteSlaYear}
                    disabled={loading}
                    className="px-3 py-1.5 rounded-xl text-xs font-nav font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors cursor-pointer flex items-center gap-1.5"
                    title={`Hapus tahun ${slaSelectedYear} dari verifikasi SLA`}
                  >
                    <Trash2 size={13} />
                    Hapus Tahun {slaSelectedYear}
                  </button>
                )}
              </div>
            </div>

            {/* GRID 3 KOLOM INPUT PERSENTASE SLA */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
              {/* 1. Internal (%) */}
              <div className="bg-[#f0fdf4]/50 border border-emerald-100 rounded-2xl p-4 sm:p-5">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-nav font-black text-xs uppercase tracking-wider text-[#00282b]">
                    Internal (%)
                  </label>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-100 text-[#01bcce]">
                    Internal
                  </span>
                </div>
                <div className="relative mt-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={slaIntPct}
                    onChange={(e) => handleSlaIntChange(e.target.value)}
                    className="w-full pl-3 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl font-nav font-black text-base text-[#01bcce] outline-none focus:border-[#01bcce] transition-colors"
                    placeholder="0"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-black text-sm">
                    %
                  </span>
                </div>
                <p className="font-nav text-[11px] text-gray-500 mt-2">
                  Persentase ketepatan waktu {getActiveSlaTitle(slaCategory).toLowerCase()} internal
                </p>
              </div>

              {/* 2. Eksternal (%) */}
              <div className="bg-[#f8fafc] border border-gray-200 rounded-2xl p-4 sm:p-5">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-nav font-black text-xs uppercase tracking-wider text-[#00282b]">
                    Eksternal (%)
                  </label>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-200 text-[#00282b]">
                    Eksternal
                  </span>
                </div>
                <div className="relative mt-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={slaEksPct}
                    onChange={(e) => handleSlaEksChange(e.target.value)}
                    className="w-full pl-3 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl font-nav font-black text-base text-[#00282b] outline-none focus:border-[#00282b] transition-colors"
                    placeholder="0"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-black text-sm">
                    %
                  </span>
                </div>
                <p className="font-nav text-[11px] text-gray-500 mt-2">
                  Persentase ketepatan waktu {getActiveSlaTitle(slaCategory).toLowerCase()} vendor/eksternal
                </p>
              </div>

              {/* 3. Keseluruhan (%) */}
              <div className="bg-[#ecfdf5] border border-emerald-200 rounded-2xl p-4 sm:p-5">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-nav font-black text-xs uppercase tracking-wider text-[#065f46]">
                    Keseluruhan (%)
                  </label>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Total
                  </span>
                </div>
                <div className="relative mt-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={slaAllPct}
                    onChange={(e) => {
                      setSlaAllPct(e.target.value)
                      setSlaAutoCalc(false)
                    }}
                    className="w-full pl-3 pr-8 py-2.5 bg-white border border-emerald-300 rounded-xl font-nav font-black text-base text-emerald-700 outline-none focus:border-emerald-600 transition-colors"
                    placeholder="0"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-black text-sm">
                    %
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-2">
                  <input
                    type="checkbox"
                    id="slaAutoCalcCheck"
                    checked={slaAutoCalc}
                    onChange={(e) => {
                      setSlaAutoCalc(e.target.checked)
                      if (e.target.checked) {
                        const i = parseFloat(slaIntPct) || 0
                        const ek = parseFloat(slaEksPct) || 0
                        setSlaAllPct(String(Number(((i + ek) / 2).toFixed(2))))
                      }
                    }}
                    className="rounded text-[#01bcce] cursor-pointer"
                  />
                  <label htmlFor="slaAutoCalcCheck" className="font-nav text-[11px] text-gray-600 cursor-pointer select-none">
                    Hitung otomatis rata-rata (Internal + Eksternal) / 2
                  </label>
                </div>
              </div>
            </div>

            {/* TOMBOL AKSI SIMPAN & RESET */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-gray-100 font-nav">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleResetSlaMonth(slaEditBulan)}
                  className="px-4 py-2.5 rounded-xl border border-red-200 text-red-600 text-xs font-bold hover:bg-red-50 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw size={14} /> Reset Bulan {slaEditBulan} (0%)
                </button>

                <button
                  type="button"
                  onClick={handleResetAllSlaMonths}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-xs font-bold hover:bg-gray-100 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 size={14} /> Reset Semua Bulan {getActiveSlaTitle(slaCategory)} ({slaSelectedYear})
                </button>
              </div>

              <button
                type="button"
                onClick={handleSaveSlaMonth}
                disabled={loading}
                className="w-full sm:w-auto px-7 py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all shadow-md hover:opacity-90 disabled:opacity-50 cursor-pointer"
                style={{ background: '#00282b' }}
              >
                <Save size={16} />
                {loading ? 'Menyimpan...' : `Simpan Data ${getActiveSlaTitle(slaCategory)} - ${slaEditBulan} ${slaSelectedYear}`}
              </button>
            </div>
          </div>

          {/* CARD 2: PENGATURAN TEKS CATATAN & JUDUL KATEGORI SLA */}
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
            </div>

            <div className="space-y-6 font-nav">
              {/* 1. Header Penjelasan Singkat SLA */}
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

              {/* 2 KOTAK SECTION: SLA DOKUMEN INTERNAL & SLA DOKUMEN EKSTERNAL */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Section 1: SLA Dokumen Internal */}
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

                {/* Section 2: SLA Dokumen Eksternal */}
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

              {/* Tombol Simpan Teks Catatan SLA */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveSlaTexts}
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl font-bold text-xs text-white flex items-center gap-2 transition-all shadow-sm hover:opacity-90 disabled:opacity-50 cursor-pointer"
                  style={{ background: '#00282b' }}
                >
                  <Save size={15} />
                  {loading ? 'Menyimpan...' : `Simpan Judul & Teks Catatan SLA ${slaSelectedYear}`}
                </button>
              </div>
            </div>
          </div>

          {/* CARD 3: TABEL REKAPITULASI DATA SLA TAHUN TERPILIH */}
          <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-sm border border-gray-100">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-gray-100">
              <div>
                <h2 className="font-nav font-bold text-gray-800 text-lg flex items-center gap-2">
                  <Calendar size={20} style={{ color: '#01bcce' }} />
                  Data {getActiveSlaTitle(slaCategory)} Tahun {slaSelectedYear}
                </h2>
                <p className="font-nav text-xs text-gray-500 mt-0.5">
                  Ringkasan seluruh 12 bulan {getActiveSlaTitle(slaCategory)}. Bulan yang diisi akan otomatis tampil di halaman publik.
                </p>
              </div>

              {/* Category tabs for viewing summary */}
              <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-xl border border-gray-200">
                {[
                  { id: 'capaian', label: 'SLA Verifikasi' },
                  { id: 'pengambilan', label: 'SLA Pengambilan' },
                  { id: 'pengembalian', label: 'SLA Pengembalian' },
                ].map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleSwitchSlaCategory(cat.id as 'capaian' | 'pengambilan' | 'pengembalian')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-nav font-bold transition-all cursor-pointer ${
                      slaCategory === cat.id
                        ? 'bg-[#00282b] text-[#d0db41] shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-xs bg-white">
              <table className="w-full text-left font-nav text-xs border-collapse">
                <thead style={{ background: '#008080' }}>
                  <tr>
                    <th style={{ padding: '12px 14px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.2)', borderBottom: '2px solid rgba(0,0,0,0.1)', fontFamily: 'Nunito, sans-serif', fontSize: 11, fontWeight: 800, color: '#ffffff', textTransform: 'uppercase' }}>
                      Bulan
                    </th>
                    <th style={{ padding: '12px 14px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.2)', borderBottom: '2px solid rgba(0,0,0,0.1)', fontFamily: 'Nunito, sans-serif', fontSize: 11, fontWeight: 800, color: '#ffffff', textTransform: 'uppercase' }}>
                      Internal (%)
                    </th>
                    <th style={{ padding: '12px 14px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.2)', borderBottom: '2px solid rgba(0,0,0,0.1)', fontFamily: 'Nunito, sans-serif', fontSize: 11, fontWeight: 800, color: '#ffffff', textTransform: 'uppercase' }}>
                      Eksternal (%)
                    </th>
                    <th style={{ padding: '12px 14px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.2)', borderBottom: '2px solid rgba(0,0,0,0.1)', fontFamily: 'Nunito, sans-serif', fontSize: 11, fontWeight: 800, color: '#ffffff', textTransform: 'uppercase' }}>
                      Keseluruhan (%)
                    </th>
                    <th style={{ padding: '12px 14px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.2)', borderBottom: '2px solid rgba(0,0,0,0.1)', fontFamily: 'Nunito, sans-serif', fontSize: 11, fontWeight: 800, color: '#ffffff', textTransform: 'uppercase' }}>
                      Status
                    </th>
                    <th style={{ padding: '12px 14px', textAlign: 'center', borderBottom: '2px solid rgba(0,0,0,0.1)', fontFamily: 'Nunito, sans-serif', fontSize: 11, fontWeight: 800, color: '#ffffff', textTransform: 'uppercase' }}>
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(slaCategory === 'pengambilan' ? slaMonthsPengambilan : slaCategory === 'pengembalian' ? slaMonthsPengembalian : slaMonthsData).map((m, idx) => {
                    const isFilled = m.has_data || m.internal > 0 || m.eksternal > 0 || m.keseluruhan > 0
                    return (
                      <tr key={m.bulan} className="rowHover" style={{ background: idx % 2 === 0 ? '#fff' : '#fafbfc' }}>
                        <td style={{ padding: '6px 14px', textAlign: 'left', borderRight: '1px solid #eee', fontWeight: 800, color: '#00282b' }}>
                          {m.bulan}
                        </td>
                        <td style={{ padding: '6px 14px', textAlign: 'center', borderRight: '1px solid #eee', fontWeight: 700, color: '#01bcce' }}>
                          {m.internal > 0 ? `${m.internal.toFixed(1)}%` : '-'}
                        </td>
                        <td style={{ padding: '6px 14px', textAlign: 'center', borderRight: '1px solid #eee', fontWeight: 700, color: '#00282b' }}>
                          {m.eksternal > 0 ? `${m.eksternal.toFixed(1)}%` : '-'}
                        </td>
                        <td style={{ padding: '6px 14px', textAlign: 'center', borderRight: '1px solid #eee', fontWeight: 800, color: '#10b981' }}>
                          {m.keseluruhan > 0 ? `${m.keseluruhan.toFixed(1)}%` : '-'}
                        </td>
                        <td style={{ padding: '6px 14px', textAlign: 'center', borderRight: '1px solid #eee' }}>
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
                        <td style={{ padding: '6px 14px', textAlign: 'center' }}>
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleQuickEditSla(m.bulan)}
                              className="p-1.5 rounded-lg text-[#01bcce] hover:bg-cyan-50 transition-colors cursor-pointer"
                              title="Edit Bulan Ini"
                            >
                              <Edit3 size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleResetSlaMonth(m.bulan)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                              title="Reset Bulan Ini ke 0%"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 3: BA TUTUP TAGIHAN ================= */}
      {activeAdminTab === 'ba_tutup_tagihan' && (
        <div className="space-y-6">
          {/* ================= CARD 1: PENGATURAN JUDUL & CATATAN 3 SECTION BA ================= */}
          <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-sm border border-gray-100">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-100">
              <div>
                <h2 className="font-nav font-bold text-gray-800 text-lg flex items-center gap-2">
                  <FileText size={20} style={{ color: '#01bcce' }} />
                  Pengaturan Judul & Catatan 3 Section BA Tutup Tagihan (Tahun {baSelectedYear})
                </h2>
                <p className="font-nav text-xs text-gray-500 mt-0.5">
                  Atur judul section dan teks catatan penjelasan untuk ke-3 section BA Tutup Tagihan agar dapat disesuaikan secara dinamis.
                </p>
              </div>

              {/* Indikator Status Database BA */}
              <div className="flex items-center gap-2 flex-wrap">
                {baExistingRecordId ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200">
                    <CheckCircle2 size={13} /> Data BA Tahun {baSelectedYear} Tersimpan di DB
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    <AlertTriangle size={13} /> Data BA Tahun {baSelectedYear} Belum Tersimpan (Kosong)
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-5 font-nav">
              {/* Header Penjelasan Singkat (Muncul di Banner Paling Atas Halaman Publik) */}
              <div>
                <label className="block text-xs font-black uppercase text-gray-700 mb-1.5">
                  Banner Penjelasan Singkat BA Tutup Tagihan (Muncul di Kotak Header Paling Atas)
                </label>
                <textarea
                  rows={2}
                  value={baHeaderText}
                  onChange={(e) => setBaHeaderText(e.target.value)}
                  className="w-full p-3 bg-[#f8fafc] border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-800 outline-none focus:border-[#01bcce] transition-colors resize-y"
                  placeholder="Masukkan penjelasan singkat BA Tutup Tagihan..."
                />
              </div>

              {/* 3 Section Judul & Catatan Box */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* SECTION 1: JENIS TAGIHAN */}
                <div className="p-4 rounded-2xl bg-[#eef9fa]/50 border border-[#01bcce]/30 flex flex-col gap-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                    <span className="w-3 h-3 rounded-full bg-[#01bcce]" />
                    <span className="font-nav font-bold text-xs text-[#00282b] uppercase tracking-wider">
                      Section 1: Jenis Tagihan
                    </span>
                  </div>
                  <div>
                    <label className="font-nav text-[11px] font-bold text-gray-500 uppercase block mb-1">
                      Judul Section 1 (Bisa Diedit):
                    </label>
                    <input
                      type="text"
                      value={baJudulJenisTagihan}
                      onChange={(e) => setBaJudulJenisTagihan(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:border-[#01bcce] transition-colors"
                      placeholder="Jenis Tagihan"
                    />
                  </div>
                  <div className="flex-1 flex flex-col">
                    <label className="font-nav text-[11px] font-bold text-gray-500 uppercase block mb-1">
                      Catatan Keterangan Section 1:
                    </label>
                    <textarea
                      rows={4}
                      value={baKetJenisTagihan}
                      onChange={(e) => setBaKetJenisTagihan(e.target.value)}
                      className="w-full flex-1 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-700 outline-none focus:border-[#01bcce] transition-colors resize-y leading-relaxed"
                      placeholder="Masukkan catatan jenis tagihan..."
                    />
                  </div>
                </div>

                {/* SECTION 2: BA TUTUP TAGIHAN BERDASARKAN PROSES */}
                <div className="p-4 rounded-2xl bg-[#f0fdf4]/50 border border-[#268484]/30 flex flex-col gap-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                    <span className="w-3 h-3 rounded-full bg-[#268484]" />
                    <span className="font-nav font-bold text-xs text-[#00282b] uppercase tracking-wider">
                      Section 2: Berdasarkan Proses
                    </span>
                  </div>
                  <div>
                    <label className="font-nav text-[11px] font-bold text-gray-500 uppercase block mb-1">
                      Judul Section 2 (Bisa Diedit):
                    </label>
                    <input
                      type="text"
                      value={baJudulTabel}
                      onChange={(e) => setBaJudulTabel(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:border-[#268484] transition-colors"
                      placeholder="BA Tutup Tagihan Berdasarkan Proses"
                    />
                  </div>
                  <div className="flex-1 flex flex-col">
                    <label className="font-nav text-[11px] font-bold text-gray-500 uppercase block mb-1">
                      Catatan Keterangan Section 2:
                    </label>
                    <textarea
                      rows={4}
                      value={baKet}
                      onChange={(e) => setBaKet(e.target.value)}
                      className="w-full flex-1 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-700 outline-none focus:border-[#268484] transition-colors resize-y leading-relaxed"
                      placeholder="Masukkan catatan BA Tutup Tagihan Berdasarkan Proses..."
                    />
                  </div>
                </div>

                {/* SECTION 3: NOMINAL BA TUTUP TAGIHAN */}
                <div className="p-4 rounded-2xl bg-[#f8fafc] border border-[#00282b]/25 flex flex-col gap-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                    <span className="w-3 h-3 rounded-full bg-[#d0db41]" />
                    <span className="font-nav font-bold text-xs text-[#00282b] uppercase tracking-wider">
                      Section 3: Berdasarkan Nominal (Rp)
                    </span>
                  </div>
                  <div>
                    <label className="font-nav text-[11px] font-bold text-gray-500 uppercase block mb-1">
                      Judul Section 3 (Bisa Diedit):
                    </label>
                    <input
                      type="text"
                      value={baJudulNominal}
                      onChange={(e) => setBaJudulNominal(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:border-[#00282b] transition-colors"
                      placeholder="BA Tutup Tagihan Berdasarkan Nominal (Rp)"
                    />
                  </div>
                  <div className="flex-1 flex flex-col">
                    <label className="font-nav text-[11px] font-bold text-gray-500 uppercase block mb-1">
                      Catatan Keterangan Section 3:
                    </label>
                    <textarea
                      rows={4}
                      value={baKetNominal}
                      onChange={(e) => setBaKetNominal(e.target.value)}
                      className="w-full flex-1 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-700 outline-none focus:border-[#00282b] transition-colors resize-y leading-relaxed"
                      placeholder="Masukkan catatan nominal BA Tutup Tagihan..."
                    />
                  </div>
                </div>
              </div>

              {/* Tombol Simpan Teks Catatan & Judul BA */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveBaTexts}
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl font-bold text-xs text-white flex items-center gap-2 transition-all shadow-sm hover:opacity-90 disabled:opacity-50 cursor-pointer"
                  style={{ background: '#00282b' }}
                >
                  <Save size={15} />
                  {loading ? 'Menyimpan...' : `Simpan Judul & Teks Catatan BA Tahun ${baSelectedYear}`}
                </button>
              </div>
            </div>
          </div>

          {/* ================= CARD 2: KELOLA DAFTAR JENIS TAGIHAN (SECTION 1) ================= */}
          <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-sm border border-gray-100">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-100">
              <div>
                <h2 className="font-nav font-bold text-gray-800 text-lg flex items-center gap-2">
                  <BarChart3 size={20} style={{ color: '#01bcce' }} />
                  Kelola Daftar {baJudulJenisTagihan || 'Jenis Tagihan'} (Section 1)
                </h2>
                <p className="font-nav text-xs text-gray-500 mt-0.5">
                  Tambah, ubah, atau hapus item jenis tagihan beserta Jumlah Penyedia dan Sudah Terbit BA untuk tahun {baSelectedYear}. Data ini otomatis tampil pada tabel dan column chart Jenis Tagihan.
                </p>
              </div>
            </div>

            {/* Form Tambah / Edit Item Jenis Tagihan */}
            <div className="bg-[#f8fafc] rounded-2xl p-4 sm:p-5 border border-gray-200 mb-6 font-nav">
              <h3 className="text-xs font-black uppercase text-[#00282b] mb-3">
                {editingJenisId ? '✏️ Ubah Item Jenis Tagihan' : '➕ Tambah Item Jenis Tagihan Baru'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                <div className="sm:col-span-5">
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                    Nama Jenis Tagihan:
                  </label>
                  <input
                    type="text"
                    value={newJenisNama}
                    onChange={(e) => setNewJenisNama(e.target.value)}
                    placeholder="Contoh: Obat & Farmasi, Alat Kesehatan..."
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:border-[#01bcce] transition-colors"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                    Jumlah Penyedia:
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newJenisJumlahPenyedia}
                    onChange={(e) => setNewJenisJumlahPenyedia(e.target.value)}
                    placeholder="Contoh: 450"
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-black text-[#268484] outline-none focus:border-[#01bcce] transition-colors text-center"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                    Sudah Terbit BA:
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newJenisSudahTerbitBa}
                    onChange={(e) => setNewJenisSudahTerbitBa(e.target.value)}
                    placeholder="Contoh: 380"
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-black text-[#566000] outline-none focus:border-[#01bcce] transition-colors text-center"
                  />
                </div>
                <div className="sm:col-span-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAddOrUpdateJenisItem}
                    className="flex-1 py-2.5 px-3 rounded-xl font-bold text-xs text-white flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-opacity hover:opacity-90"
                    style={{ background: '#00282b' }}
                  >
                    {editingJenisId ? <Check size={14} /> : <Plus size={14} />}
                    <span>{editingJenisId ? 'Perbarui' : 'Tambah'}</span>
                  </button>
                  {editingJenisId && (
                    <button
                      type="button"
                      onClick={handleCancelEditJenis}
                      className="py-2.5 px-3 rounded-xl font-bold text-xs bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors cursor-pointer"
                      title="Batal edit"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Tabel List Jenis Tagihan */}
            <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-xs bg-white mb-4">
              <table className="w-full text-left font-nav text-xs border-collapse">
                <thead style={{ background: '#008080' }}>
                  <tr>
                    <th style={{ padding: '10px 14px', textAlign: 'center', width: 50, borderRight: '1px solid rgba(255,255,255,0.2)', fontFamily: 'Nunito, sans-serif', fontSize: 11, fontWeight: 800, color: '#ffffff', textTransform: 'uppercase' }}>
                      No
                    </th>
                    <th style={{ padding: '10px 16px', textAlign: 'left', borderRight: '1px solid rgba(255,255,255,0.2)', fontFamily: 'Nunito, sans-serif', fontSize: 11, fontWeight: 800, color: '#ffffff', textTransform: 'uppercase' }}>
                      Jenis Tagihan
                    </th>
                    <th style={{ padding: '10px 16px', textAlign: 'center', width: 140, borderRight: '1px solid rgba(255,255,255,0.2)', fontFamily: 'Nunito, sans-serif', fontSize: 11, fontWeight: 800, color: '#ffffff', textTransform: 'uppercase' }}>
                      Jumlah Penyedia
                    </th>
                    <th style={{ padding: '10px 16px', textAlign: 'center', width: 140, borderRight: '1px solid rgba(255,255,255,0.2)', fontFamily: 'Nunito, sans-serif', fontSize: 11, fontWeight: 800, color: '#ffffff', textTransform: 'uppercase' }}>
                      Sudah Terbit BA
                    </th>
                    <th style={{ padding: '10px 14px', textAlign: 'center', width: 90, fontFamily: 'Nunito, sans-serif', fontSize: 11, fontWeight: 800, color: '#ffffff', textTransform: 'uppercase' }}>
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {baJenisTagihanItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-gray-400 font-bold text-xs">
                        Belum ada item jenis tagihan. Gunakan form di atas untuk menambahkan item.
                      </td>
                    </tr>
                  ) : (
                    (() => {
                      const totalPenyediaSum = baJenisTagihanItems.reduce((acc, it) => acc + (it.jumlah_penyedia ?? it.jumlah ?? 0), 0)
                      const totalTerbitSum = baJenisTagihanItems.reduce((acc, it) => acc + (it.sudah_terbit_ba ?? 0), 0)
                      return (
                        <>
                          {baJenisTagihanItems.map((item, idx) => {
                            const penyediaVal = item.jumlah_penyedia ?? item.jumlah ?? 0
                            const terbitVal = item.sudah_terbit_ba ?? 0
                            return (
                              <tr key={item.id || idx} className="hover:bg-gray-50/70" style={{ background: idx % 2 === 0 ? '#fff' : '#fafbfc' }}>
                                <td style={{ padding: '8px 14px', textAlign: 'center', borderRight: '1px solid #eee', fontWeight: 800, color: '#64748b' }}>
                                  {idx + 1}
                                </td>
                                <td style={{ padding: '8px 16px', textAlign: 'left', borderRight: '1px solid #eee', fontWeight: 800, color: '#00282b' }}>
                                  {item.jenis}
                                </td>
                                <td style={{ padding: '8px 16px', textAlign: 'center', borderRight: '1px solid #eee', fontWeight: 800, color: '#268484' }}>
                                  {penyediaVal.toLocaleString('id-ID')}
                                </td>
                                <td style={{ padding: '8px 16px', textAlign: 'center', borderRight: '1px solid #eee', fontWeight: 800, color: '#566000' }}>
                                  {terbitVal.toLocaleString('id-ID')}
                                </td>
                                <td style={{ padding: '8px 14px', textAlign: 'center' }}>
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleEditJenisItem(item)}
                                      className="p-1.5 rounded-lg text-[#01bcce] hover:bg-cyan-50 transition-colors cursor-pointer"
                                      title="Edit item ini"
                                    >
                                      <Edit3 size={13} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteJenisItem(item.id)}
                                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                                      title="Hapus item ini"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                          {/* Row Total */}
                          <tr style={{ background: '#f8fafc', borderTop: '2px solid #00282b', fontWeight: 800 }}>
                            <td colSpan={2} style={{ padding: '9px 16px', textAlign: 'left', borderRight: '1px solid #eee', color: '#00282b', fontWeight: 900, textTransform: 'uppercase', fontSize: 11 }}>
                              Total Tagihan
                            </td>
                            <td style={{ padding: '9px 16px', textAlign: 'center', borderRight: '1px solid #eee', color: '#268484', fontWeight: 900, fontSize: 13 }}>
                              {totalPenyediaSum.toLocaleString('id-ID')}
                            </td>
                            <td style={{ padding: '9px 16px', textAlign: 'center', borderRight: '1px solid #eee', color: '#566000', fontWeight: 900, fontSize: 13 }}>
                              {totalTerbitSum.toLocaleString('id-ID')}
                            </td>
                            <td />
                          </tr>
                        </>
                      )
                    })()
                  )}
                </tbody>
              </table>
            </div>

            {/* Tombol Simpan Daftar Jenis Tagihan */}
            <div className="pt-2 flex items-center justify-end gap-3">
              {baJenisTagihanItems.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAllJenisTagihan}
                  disabled={loading}
                  className="px-4 py-2.5 rounded-xl font-bold text-xs text-red-600 bg-red-50 hover:bg-red-100 flex items-center gap-1.5 transition-all border border-red-200 cursor-pointer disabled:opacity-50"
                  title="Hapus semua item jenis tagihan"
                >
                  <Trash2 size={14} />
                  Kosongkan Semua Item
                </button>
              )}
              <button
                type="button"
                onClick={handleSaveJenisTagihanList}
                disabled={loading}
                className="px-6 py-2.5 rounded-xl font-bold text-xs text-white flex items-center gap-2 transition-all shadow-sm hover:opacity-90 disabled:opacity-50 cursor-pointer"
                style={{ background: '#00282b' }}
              >
                <Save size={15} />
                {loading ? 'Menyimpan...' : `Simpan Daftar Jenis Tagihan Tahun ${baSelectedYear}`}
              </button>
            </div>
          </div>

          {/* ================= CARD 3: FORM INPUT DATA 12 BULAN (SECTION 2 & 3) ================= */}
          <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-sm border border-gray-100">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-100">
              <div>
                <h2 className="font-nav font-bold text-gray-800 text-lg flex items-center gap-2">
                  <FileCheck size={20} style={{ color: '#01bcce' }} />
                  Form Input Data 12 Bulan ({getActiveBaTitle(baCategory)})
                </h2>
                <p className="font-nav text-xs text-gray-500 mt-0.5">
                  Pilih kategori BA yang ingin diinput, lalu masukkan rincian data per bulan.
                </p>
              </div>

              {/* Kategori Switcher: Penyedia vs Nominal (Transaksi) */}
              <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-xl border border-gray-200">
                <button
                  type="button"
                  onClick={() => handleSwitchBaCategory('penyedia')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-nav font-bold transition-all cursor-pointer ${
                    baCategory === 'penyedia'
                      ? 'bg-[#00282b] text-[#d0db41] shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Section 2: {baJudulTabel || 'BA Tutup Tagihan'} (Penyedia)
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchBaCategory('nominal')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-nav font-bold transition-all cursor-pointer ${
                    baCategory === 'nominal'
                      ? 'bg-[#00282b] text-[#d0db41] shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Section 3: {baJudulNominal || 'Nominal BA Tutup Tagihan'} (Transaksi)
                </button>
              </div>
            </div>

            {/* Baris Pilih Tahun & Bulan BA */}
            <div className="bg-[#f8fafc] rounded-2xl p-4 sm:p-5 border border-gray-200 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                {/* Kolom Tahun */}
                <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-gray-200 shadow-xs">
                  <Calendar size={16} className="text-[#01bcce]" />
                  <span className="font-nav text-xs font-black text-gray-700 uppercase">Tahun:</span>
                  <select
                    value={baSelectedYear}
                    onChange={(e) => setBaSelectedYear(parseInt(e.target.value))}
                    className="font-nav font-black text-sm text-[#00282b] bg-transparent outline-none cursor-pointer"
                  >
                    {baAvailableYears.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>

                {/* Tambah Tahun Baru */}
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    placeholder="Tahun baru..."
                    value={baNewYearInput}
                    onChange={(e) => setBaNewYearInput(e.target.value)}
                    className="w-28 px-3 py-2 text-xs font-nav font-bold bg-white border border-gray-200 rounded-xl outline-none focus:border-[#01bcce]"
                  />
                  <button
                    type="button"
                    onClick={handleAddNewBaYear}
                    className="px-3 py-2 text-xs font-nav font-bold text-white rounded-xl flex items-center gap-1 cursor-pointer transition-all hover:opacity-90"
                    style={{ background: '#00282b' }}
                  >
                    <Plus size={13} /> Tambah
                  </button>
                </div>

                <span className="text-gray-300 hidden sm:inline">|</span>

                {/* Kolom Bulan */}
                <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-gray-200 shadow-xs">
                  <span className="font-nav text-xs font-black text-gray-700 uppercase">Bulan:</span>
                  <select
                    value={baEditBulan}
                    onChange={(e) => handleSelectBaBulan(e.target.value)}
                    className="font-nav font-black text-sm text-[#01bcce] bg-transparent outline-none cursor-pointer"
                  >
                    {NAMA_BULAN.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status Bulan Ini & Tombol Hapus Tahun BA */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="text-xs font-nav text-gray-500">
                  <span>Mengedit: <strong className="text-[#00282b]">{getActiveBaTitle(baCategory)} — {baEditBulan} {baSelectedYear}</strong></span>
                </div>
                {(baAvailableYears.length > 1 || baExistingRecordId) && (
                  <button
                    type="button"
                    onClick={handleDeleteBaYear}
                    disabled={loading}
                    className="px-3 py-1.5 rounded-xl text-xs font-nav font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors cursor-pointer flex items-center gap-1.5"
                    title={`Hapus tahun ${baSelectedYear} dari verifikasi BA Tutup Tagihan`}
                  >
                    <Trash2 size={13} />
                    Hapus Tahun {baSelectedYear}
                  </button>
                )}
              </div>
            </div>

            {/* GRID INPUT DATA (5 STATUS) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6 font-nav">
              {/* 1. Total Penyedia / Total Transaksi */}
              <div className="bg-[#f8fafc] border-2 border-slate-200 rounded-2xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-nav font-black text-[11px] uppercase tracking-wider text-[#00282b]">
                      {baCategory === 'nominal' ? 'Total Nilai' : 'Total Penyedia'}
                    </label>
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={baTotalPenyedia}
                    onChange={(e) => {
                      setBaTotalPenyedia(e.target.value)
                      setBaAutoCalcTotal(false)
                    }}
                    className="w-full text-center text-xl font-black text-[#00282b] bg-white border border-gray-200 rounded-xl py-2.5 outline-none focus:border-[#01bcce] transition-colors"
                  />
                </div>
                <div className="mt-3 pt-2.5 border-t border-gray-200">
                  <label className="flex items-center gap-1.5 cursor-pointer text-[10px] font-bold text-gray-600">
                    <input
                      type="checkbox"
                      checked={baAutoCalcTotal}
                      onChange={(e) => {
                        const checked = e.target.checked
                        setBaAutoCalcTotal(checked)
                        if (checked) {
                          updateBaTotalIfAuto(baBelumKonfirmasi, baProsesPenagihan, baProsesPembuatanBa, baSudahTerbitBa)
                        }
                      }}
                      className="rounded text-[#01bcce] focus:ring-0 cursor-pointer"
                    />
                    <span>Hitung Otomatis</span>
                  </label>
                </div>
              </div>

              {/* 2. Belum Dikonfirmasi */}
              <div className="bg-[#fff1f2]/60 border border-rose-200 rounded-2xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-nav font-black text-[11px] uppercase tracking-wider text-rose-700">
                      Belum Dikonfirmasi
                    </label>
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={baBelumKonfirmasi}
                    onChange={(e) => handleBaBelumChange(e.target.value)}
                    className="w-full text-center text-xl font-black text-rose-600 bg-white border border-rose-200 rounded-xl py-2.5 outline-none focus:border-rose-400 transition-colors"
                  />
                </div>
                <p className="mt-2 text-[10px] text-rose-500 font-semibold text-center">
                  Status Belum Konfirmasi
                </p>
              </div>

              {/* 3. Proses Penagihan */}
              <div className="bg-[#fffbeb]/60 border border-amber-200 rounded-2xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-nav font-black text-[11px] uppercase tracking-wider text-amber-800">
                      Proses Penagihan
                    </label>
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={baProsesPenagihan}
                    onChange={(e) => handleBaPenagihanChange(e.target.value)}
                    className="w-full text-center text-xl font-black text-amber-600 bg-white border border-amber-200 rounded-xl py-2.5 outline-none focus:border-amber-400 transition-colors"
                  />
                </div>
                <p className="mt-2 text-[10px] text-amber-600 font-semibold text-center">
                  Tahap Verifikasi Tagihan
                </p>
              </div>

              {/* 4. Proses Pembuatan BA */}
              <div className="bg-[#ecfeff]/60 border border-cyan-200 rounded-2xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-nav font-black text-[11px] uppercase tracking-wider text-cyan-800">
                      Proses Pembuatan BA
                    </label>
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={baProsesPembuatanBa}
                    onChange={(e) => handleBaBuatBaChange(e.target.value)}
                    className="w-full text-center text-xl font-black text-[#01bcce] bg-white border border-cyan-200 rounded-xl py-2.5 outline-none focus:border-cyan-400 transition-colors"
                  />
                </div>
                <p className="mt-2 text-[10px] text-cyan-600 font-semibold text-center">
                  Penyusunan Draft Berita Acara
                </p>
              </div>

              {/* 5. Sudah Terbit BA */}
              <div className="bg-[#f0fdf4]/60 border border-emerald-200 rounded-2xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-nav font-black text-[11px] uppercase tracking-wider text-emerald-800">
                      Sudah Terbit BA
                    </label>
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={baSudahTerbitBa}
                    onChange={(e) => handleBaTerbitBaChange(e.target.value)}
                    className="w-full text-center text-xl font-black text-emerald-600 bg-white border border-emerald-200 rounded-xl py-2.5 outline-none focus:border-emerald-400 transition-colors"
                  />
                </div>
                <p className="mt-2 text-[10px] text-emerald-600 font-semibold text-center">
                  Dokumen BA Resmi Terbit
                </p>
              </div>
            </div>

            {/* Tombol Simpan Bulan Ini */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100 flex-wrap gap-3">
              <button
                type="button"
                onClick={() => handleResetBaMonth(baEditBulan)}
                className="px-4 py-2 text-xs font-nav font-bold text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 size={14} /> Reset Bulan {baEditBulan} ke 0
              </button>

              <button
                type="button"
                onClick={handleSaveBaMonth}
                disabled={loading}
                className="px-6 py-2.5 rounded-xl font-nav font-bold text-xs text-white flex items-center gap-2 transition-all shadow-sm hover:opacity-90 disabled:opacity-50 cursor-pointer"
                style={{ background: '#00282b' }}
              >
                <Save size={15} />
                {loading ? 'Menyimpan...' : `Simpan Data ${getActiveBaTitle(baCategory)} Bulan ${baEditBulan} ${baSelectedYear}`}
              </button>
            </div>
          </div>

          {/* ================= CARD 4: TABEL REKAPITULASI DATA 12 BULAN ================= */}
          <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-sm border border-gray-100">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-100">
              <div>
                <h2 className="font-nav font-bold text-gray-800 text-lg flex items-center gap-2">
                  <Calendar size={20} style={{ color: '#01bcce' }} />
                  Data {getActiveBaTitle(baCategory)} Tahun {baSelectedYear}
                </h2>
                <p className="font-nav text-xs text-gray-500 mt-0.5">
                  Ringkasan seluruh 12 bulan data {getActiveBaTitle(baCategory)}. Bulan yang diisi akan otomatis tampil pada grafik dan tabel halaman publik.
                </p>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                {/* Category Switcher in Table Header */}
                <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl border border-gray-200">
                  <button
                    type="button"
                    onClick={() => handleSwitchBaCategory('penyedia')}
                    className={`px-3 py-1 text-xs font-nav font-bold rounded-lg transition-all cursor-pointer ${
                      baCategory === 'penyedia' ? 'bg-[#00282b] text-[#d0db41]' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Penyedia
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSwitchBaCategory('nominal')}
                    className={`px-3 py-1 text-xs font-nav font-bold rounded-lg transition-all cursor-pointer ${
                      baCategory === 'nominal' ? 'bg-[#00282b] text-[#d0db41]' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Nominal (Nilai)
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleResetAllBaMonths}
                  className="px-3.5 py-1.5 text-xs font-nav font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer border border-red-200"
                >
                  <Trash2 size={13} /> Reset Semua 12 Bulan (0)
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-xs bg-white">
              <table className="w-full text-left font-nav text-xs border-collapse">
                <thead style={{ background: '#008080' }}>
                  <tr>
                    <th style={{ padding: '12px 14px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.2)', borderBottom: '2px solid rgba(0,0,0,0.1)', fontFamily: 'Nunito, sans-serif', fontSize: 11, fontWeight: 800, color: '#ffffff', textTransform: 'uppercase' }}>
                      Periode
                    </th>
                    <th style={{ padding: '12px 12px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.2)', borderBottom: '2px solid rgba(0,0,0,0.1)', fontFamily: 'Nunito, sans-serif', fontSize: 11, fontWeight: 800, color: '#ffffff', textTransform: 'uppercase' }}>
                      {baCategory === 'nominal' ? 'Total Nilai' : 'Total Penyedia'}
                    </th>
                    <th style={{ padding: '12px 12px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.2)', borderBottom: '2px solid rgba(0,0,0,0.1)', fontFamily: 'Nunito, sans-serif', fontSize: 11, fontWeight: 800, color: '#ffffff', textTransform: 'uppercase' }}>
                      Belum Dikonfirmasi
                    </th>
                    <th style={{ padding: '12px 12px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.2)', borderBottom: '2px solid rgba(0,0,0,0.1)', fontFamily: 'Nunito, sans-serif', fontSize: 11, fontWeight: 800, color: '#ffffff', textTransform: 'uppercase' }}>
                      Proses Penagihan
                    </th>
                    <th style={{ padding: '12px 12px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.2)', borderBottom: '2px solid rgba(0,0,0,0.1)', fontFamily: 'Nunito, sans-serif', fontSize: 11, fontWeight: 800, color: '#ffffff', textTransform: 'uppercase' }}>
                      Proses Pembuatan BA
                    </th>
                    <th style={{ padding: '12px 12px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.2)', borderBottom: '2px solid rgba(0,0,0,0.1)', fontFamily: 'Nunito, sans-serif', fontSize: 11, fontWeight: 800, color: '#ffffff', textTransform: 'uppercase' }}>
                      Sudah Terbit BA
                    </th>
                    <th style={{ padding: '12px 14px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.2)', borderBottom: '2px solid rgba(0,0,0,0.1)', fontFamily: 'Nunito, sans-serif', fontSize: 11, fontWeight: 800, color: '#ffffff', textTransform: 'uppercase' }}>
                      Status
                    </th>
                    <th style={{ padding: '12px 14px', textAlign: 'center', borderBottom: '2px solid rgba(0,0,0,0.1)', fontFamily: 'Nunito, sans-serif', fontSize: 11, fontWeight: 800, color: '#ffffff', textTransform: 'uppercase' }}>
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(baCategory === 'nominal' ? baMonthsNominal : baMonthsData).map((m, idx) => {
                    const isFilled = m.has_data || m.total_penyedia > 0 || m.belum_dikonfirmasi > 0 || m.proses_penagihan > 0 || m.proses_pembuatan_ba > 0 || m.sudah_terbit_ba > 0
                    return (
                      <tr key={m.bulan} className="rowHover" style={{ background: idx % 2 === 0 ? '#fff' : '#fafbfc' }}>
                        <td style={{ padding: '6px 14px', textAlign: 'left', borderRight: '1px solid #eee', fontWeight: 800, color: '#00282b' }}>
                          {m.bulan}
                        </td>
                        <td style={{ padding: '6px 12px', textAlign: 'center', borderRight: '1px solid #eee', fontWeight: 800, color: '#00282b' }}>
                          {m.total_penyedia.toLocaleString('id-ID')}
                        </td>
                        <td style={{ padding: '6px 12px', textAlign: 'center', borderRight: '1px solid #eee', fontWeight: 700, color: '#f43f5e' }}>
                          {m.belum_dikonfirmasi.toLocaleString('id-ID')}
                        </td>
                        <td style={{ padding: '6px 12px', textAlign: 'center', borderRight: '1px solid #eee', fontWeight: 700, color: '#d97706' }}>
                          {m.proses_penagihan.toLocaleString('id-ID')}
                        </td>
                        <td style={{ padding: '6px 12px', textAlign: 'center', borderRight: '1px solid #eee', fontWeight: 700, color: '#01bcce' }}>
                          {m.proses_pembuatan_ba.toLocaleString('id-ID')}
                        </td>
                        <td style={{ padding: '6px 12px', textAlign: 'center', borderRight: '1px solid #eee', fontWeight: 800, color: '#10b981' }}>
                          {m.sudah_terbit_ba.toLocaleString('id-ID')}
                        </td>
                        <td style={{ padding: '6px 14px', textAlign: 'center', borderRight: '1px solid #eee' }}>
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
                        <td style={{ padding: '6px 14px', textAlign: 'center' }}>
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleQuickEditBa(m.bulan)}
                              className="p-1.5 rounded-lg text-[#01bcce] hover:bg-cyan-50 transition-colors cursor-pointer"
                              title="Edit Bulan Ini"
                            >
                              <Edit3 size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleResetBaMonth(m.bulan)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                              title="Reset Bulan Ini ke 0"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
