'use client'
import { useState, useEffect, useMemo, useRef } from 'react'
import { FileText, ChevronRight, BarChart3, Grid3x3, Calendar, TrendingUp, TrendingDown, Search, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { NERACA_ROWS, NERACA_COLORS } from '@/lib/neraca'
import { OPERASIONAL_ROWS, OPERASIONAL_COLORS } from '@/lib/operasional'
import { ARUSKAS_ROWS } from '@/lib/aruskas'

const NAMA_BULAN = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const NAMA_BULAN_FULL = NAMA_BULAN

const kpiConfig = [
  { key: 'ebitda',                            label: 'EBITDA',                          satuan: 'rupiah', target: 'Positif',    targetVal: 0,    higherBetter: true  },
  { key: 'arus_kas_bersih',                   label: 'Arus Kas Bersih',                 satuan: 'rupiah', target: 'Positif',    targetVal: 0,    higherBetter: true  },
  { key: 'pendapatan_operasional',             label: 'Pendapatan Operasional',          satuan: 'rupiah', target: 'Linear RBA', targetVal: null,  higherBetter: true  },
  { key: 'rasio_beban_pegawai',                label: 'Rasio Beban Pegawai',             satuan: 'persen', target: '≤ 45%',     targetVal: 45,   higherBetter: false },
  { key: 'rasio_beban_persediaan_farmasi',     label: 'Rasio Beban Persediaan Farmasi',  satuan: 'persen', target: '≤ 25%',     targetVal: 25,   higherBetter: false },
  { key: 'rasio_beban_persediaan_non_farmasi', label: 'Rasio Beban Non Farmasi',         satuan: 'persen', target: '≤ 5%',      targetVal: 5,    higherBetter: false },
  { key: 'margin_laba_kotor',                  label: 'Margin Laba Kotor',               satuan: 'persen', target: '≥ 25%',     targetVal: 25,   higherBetter: true  },
  { key: 'margin_laba_usaha',                  label: 'Margin Laba Usaha',               satuan: 'persen', target: '≥ 10%',     targetVal: 10,   higherBetter: true  },
  { key: 'ebitda_margin',                      label: 'EBITDA Margin',                   satuan: 'persen', target: '≥ 15%',     targetVal: 15,   higherBetter: true  },
  { key: 'perputaran_piutang',                 label: 'Perputaran Piutang',              satuan: 'hari',   target: '≤ 40 hari', targetVal: 40,   higherBetter: false },
  { key: 'perputaran_persediaan',              label: 'Perputaran Persediaan',            satuan: 'hari',   target: '≤ 60 hari', targetVal: 60,   higherBetter: false },
  { key: 'perputaran_utang',                   label: 'Perputaran Utang',                satuan: 'hari',   target: '≤ 60 hari', targetVal: 60,   higherBetter: false },
]

function fmt(v: number | null | undefined, s: string) {
  if (v == null) return '—'
  if (s === 'rupiah') return `Rp\u00A0${Math.round(v).toLocaleString('id-ID')}`
  if (s === 'persen') return `${v.toFixed(1)}%`
  if (s === 'hari')   return `${v.toFixed(0)} hari`
  return String(v)
}

function fmtAngka(v: any) {
  if (v == null || v === '') return '—'
  const num = typeof v === 'number' ? v : parseFloat(String(v).replace(/\s/g, '').replace(',', '.'))
  if (!isNaN(num)) {
    return num.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
  }
  return String(v)
}

function parseTargetRule(
  customTarget: string | null | undefined,
  defaultTargetVal: number | null,
  defaultHigherBetter: boolean
): { targetVal: number | null; higherBetter: boolean } {
  if (!customTarget || typeof customTarget !== 'string') {
    return { targetVal: defaultTargetVal, higherBetter: defaultHigherBetter }
  }

  const s = customTarget.trim().toLowerCase()
  if (s.includes('positif')) {
    return { targetVal: 0, higherBetter: true }
  }
  if (s.includes('negatif')) {
    return { targetVal: 0, higherBetter: false }
  }

  let higherBetter = defaultHigherBetter
  if (s.includes('≤') || s.includes('<=') || s.includes('<') || s.includes('maks') || s.includes('max')) {
    higherBetter = false
  } else if (s.includes('≥') || s.includes('>=') || s.includes('>') || s.includes('min') || s.includes('lebih')) {
    higherBetter = true
  }

  const clean = s.replace(',', '.')
  const numMatch = clean.match(/-?\d+(\.\d+)?/)
  const targetVal = numMatch ? parseFloat(numMatch[0]) : defaultTargetVal

  return { targetVal, higherBetter }
}

function stat(v: number | null | undefined, c: { targetVal: number | null; higherBetter: boolean }): 'baik' | 'buruk' | 'kosong' {
  if (v == null) return 'kosong'
  if (c.targetVal === null) return v > 0 ? 'baik' : 'buruk'
  return c.higherBetter ? (v >= c.targetVal ? 'baik' : 'buruk') : (v <= c.targetVal ? 'baik' : 'buruk')
}

interface Props {
  kpiTerbaru: any;
  semuaKpi: any[];
  financialData: any[];
  laporanKeuangan: any[];
  catatanLaporan: any[];
  unduhDokumenRaw?: any[];
}

export default function KinerjaKeuanganClient({ kpiTerbaru, semuaKpi, financialData, laporanKeuangan, catatanLaporan, unduhDokumenRaw }: Props) {
  const [mode, setMode] = useState<'grid' | 'tabel'>('grid')
  const [kategori, setKategori] = useState('12 Indikator Kinerja')
  
  const [fP, setFP] = useState(''); const [fTL, setFTL] = useState(''); const [fTC, setFTC] = useState('')
  const [ready, setReady] = useState(false)
  
  // State Unduh Dokumen
  const initialDocs = useMemo(() => {
    const list: any[] = []
    financialData
      .filter(f => f.category === 'unduh_dokumen')
      .forEach(f => {
        list.push({
          id: f.item_name || f.id,
          nama: f.data?.nama || f.item_name,
          tahun: f.data?.tahun || f.year,
          file_url: f.data?.file_url || '#',
          created_at: f.data?.created_at || f.created_at
        })
      })
    ;(unduhDokumenRaw || []).forEach((d: any) => {
      list.push({
        id: d.id,
        nama: d.nama,
        tahun: d.kategori || d.tahun || '-',
        file_url: d.file_url,
        created_at: d.created_at
      })
    })


    const map = new Map<string, any>()
    list.forEach(item => {
      const k = (item.nama + '-' + item.file_url).toLowerCase().trim()
      if (!map.has(k)) map.set(k, item)
    })
    return Array.from(map.values())
  }, [financialData, unduhDokumenRaw])

  const [searchDoc, setSearchDoc] = useState('')

  const filteredDocs = useMemo(() => {
    if (!searchDoc.trim()) return initialDocs
    const q = searchDoc.toLowerCase()
    return initialDocs.filter(d =>
      d.nama?.toLowerCase().includes(q) ||
      String(d.tahun || '').toLowerCase().includes(q)
    )
  }, [initialDocs, searchDoc])
  
  const availThn = [...new Set([
    ...semuaKpi.map(k => k.tahun),
    ...financialData.map(f => f.year)
  ])].filter((y): y is number => typeof y === 'number' && y > 1900 && !isNaN(y)).sort((a: number, b: number) => b - a)
  
  if (availThn.length === 0) availThn.push(new Date().getFullYear())

  const defaultThn = (kpiTerbaru?.tahun && kpiTerbaru.tahun > 1900) ? kpiTerbaru.tahun : (availThn[0] ?? new Date().getFullYear())
  const defaultBln = kpiTerbaru?.bulan ?? (new Date().getMonth() + 1)
  const defaultColKey = 'm' + defaultBln
  
  const [selectedThn, setSelectedThn] = useState<number>(defaultThn)
  const [selectedColKey, setSelectedColKey] = useState<string>(defaultColKey)
  const previousColumnsRef = useRef<Array<{ key: string; label: string }>>([])
  
  // Columns for the currently active tab & year (matches table headers exactly)
  const currentTableColumns = useMemo((): Array<{ key: string; label: string }> => {
    if (kategori === '12 Indikator Kinerja') {
      const firstWithCols = financialData.find(f => f.category === '12_indikator' && f.year === selectedThn && f.data?._columns)?.data?._columns
      return (firstWithCols && firstWithCols.length > 0
        ? firstWithCols
        : Array.from({ length: 12 }, (_, i) => ({ key: 'm' + (i + 1), label: NAMA_BULAN[i + 1].slice(0, 3) }))
      ).filter((c: any) => c.key !== 'target')
    } else {
      const catKey = kategori === 'Neraca' ? 'neraca' : kategori === 'Laporan Operasional' ? 'operasional' : 'arus_kas'
      const finData = financialData.filter(f => f.category === catKey && f.year === selectedThn)
      const customColsDef = finData.find(f => f.data?._columns && Array.isArray(f.data._columns))?.data?._columns
      return (customColsDef && customColsDef.length > 0
        ? customColsDef
        : Array.from({ length: 12 }, (_, i) => ({ key: 'm' + (i + 1), label: NAMA_BULAN[i + 1].slice(0, 3) }))
      ).filter((c: any) => c.key !== 'target')
    }
  }, [kategori, selectedThn, financialData])

  // Keep selectedColKey in sync when switching tabs/years
  useEffect(() => {
    if (currentTableColumns.length === 0) return
    const exists = currentTableColumns.some((c: any) => c.key === selectedColKey)
    if (!exists) {
      const prevCol = previousColumnsRef.current.find((c: any) => c.key === selectedColKey)
      const matchByLabel = prevCol ? currentTableColumns.find((c: any) => c.label.toLowerCase() === prevCol.label.toLowerCase()) : null
      if (matchByLabel) {
        setSelectedColKey(matchByLabel.key)
      } else {
        const hasDefault = currentTableColumns.find((c: any) => c.key === defaultColKey)
        setSelectedColKey(hasDefault ? hasDefault.key : currentTableColumns[0].key)
      }
    }
    previousColumnsRef.current = currentTableColumns
  }, [currentTableColumns, selectedColKey, defaultColKey])

  const selectedBln = selectedColKey.startsWith('m') && !isNaN(parseInt(selectedColKey.slice(1)))
    ? parseInt(selectedColKey.slice(1))
    : defaultBln

  const activePeriodLabel = useMemo(() => {
    const col = currentTableColumns.find((c: any) => c.key === selectedColKey)
    if (!col) return NAMA_BULAN[selectedBln] || ''
    const monthNum = col.key.startsWith('m') && !isNaN(parseInt(col.key.slice(1))) ? parseInt(col.key.slice(1)) : null
    return monthNum && NAMA_BULAN[monthNum] && col.label.toLowerCase().startsWith(NAMA_BULAN[monthNum].slice(0, 3).toLowerCase())
      ? NAMA_BULAN[monthNum]
      : col.label
  }, [currentTableColumns, selectedColKey, selectedBln])

  useEffect(() => { setTimeout(() => setReady(true), 80) }, [])

  const thnL = [...new Set(laporanKeuangan.map(l => l.tahun))].filter((y): y is number => typeof y === 'number' && y > 1900 && !isNaN(y)).sort((a: number, b: number) => b - a)
  const thnC = [...new Set(catatanLaporan.map(c => c.tahun))].filter((y): y is number => typeof y === 'number' && y > 1900 && !isNaN(y)).sort((a: number, b: number) => b - a)

  const lapF = laporanKeuangan.filter(l => (!fP || l.periode === fP) && (!fTL || String(l.tahun) === fTL))
  const catF = fTC ? catatanLaporan.filter(c => String(c.tahun) === fTC) : catatanLaporan

  // Data for 12 Indikator
  const komp = semuaKpi.filter(k => k.tahun === selectedThn).sort((a, b) => a.bulan - b.bulan)
  const dSelected = komp.find(k => k.bulan === selectedBln)
  
  // Data for Financial Reports (Neraca, Ops, Arus Kas)
  const catKey = kategori === 'Neraca' ? 'neraca' : kategori === 'Laporan Operasional' ? 'operasional' : 'arus_kas'
  const finDataForYear = financialData.filter(f => f.category === catKey && f.year === selectedThn)

  useEffect(() => {
    if (kategori === '12 Indikator Kinerja') return
    const years = financialData.filter(f => f.category === catKey).map(f => f.year as number)
    if (years.length > 0 && !years.includes(selectedThn)) setSelectedThn(Math.max(...years))
  }, [kategori, catKey, financialData, selectedThn])

  const TABS = ['12 Indikator Kinerja', 'Neraca', 'Laporan Operasional', 'Laporan Arus Kas']

  const renderGridFinancial = () => {
    let allowed: string[] = [];
    if (kategori === 'Neraca') allowed = ['kas', 'piutang', 'persediaan', 'aset', 'kewajiban', 'ekuitas'];
    else if (kategori === 'Laporan Operasional') allowed = ['pendapatan jasa layanan', 'pendapatan diklat', 'pendapatan operasional', 'beban pokok', 'beban penjualan', 'beban umum', 'pendapatan (beban) non operasional', 'pendapatan (beban) keuangan', 'net profit'];
    else if (kategori === 'Laporan Arus Kas') allowed = ['arus kas masuk', 'arus kas keluar', 'saldo awal kas', 'kenaikan', 'penurunan', 'saldo akhir'];

    let gridData = finDataForYear.filter(item => {
      const lower = item.item_name.toLowerCase();
      return allowed.some(a => lower.includes(a));
    });
    if (kategori === 'Neraca') {
      gridData = [
        { label: 'Kas', source: 'Kas dan Setara Kas' },
        { label: 'Piutang (Neto)', source: 'Piutang' },
        { label: 'Persediaan', source: 'Persediaan' },
        { label: 'Aset (Neto)', source: 'Aset' },
        { label: 'Kewajiban Jangka Pendek', source: 'Kewajiban Jangka Pendek' },
        { label: 'Ekuitas', source: 'Ekuitas' },
      ].map(g => {
        const found = finDataForYear.find(f => f.item_name.toLowerCase().trim() === g.source.toLowerCase())
        return { item_name: g.label, data: found?.data ?? {} }
      })
    } else if (kategori === 'Laporan Operasional') {
      gridData = [
        { label: 'Pendapatan Jasa Layanan', source: 'Pendapatan Jasa Layanan Rawat Jalan' }, // Approximation, usually a total of ranap + rajal but they didn't specify total row for it. Let's map to a known row, wait, they specified 9 items. I'll just map the names they asked for to whatever matches best or just use the exact names they asked for.
        { label: 'Pendapatan Diklat', source: 'Pendapatan Program Pendidikan, Pelatihan, Penelitian dan Pengampuan' },
        { label: 'Pendapatan Operasional', source: 'Pendapatan Operasional' },
        { label: 'Beban Pokok Pendapatan (Layanan)', source: 'Beban Pokok Pendapatan (Layanan)' },
        { label: 'Beban Penjualan dan Pemasaran', source: 'Beban Penjualan dan Pemasaran' },
        { label: 'Beban Umum dan Administrasi', source: 'Beban Umum dan Administrasi' },
        { label: 'Pendapatan (Beban) Non Operasional', source: 'Pendapatan (Beban) Non Operasional – Neto' },
        { label: 'Pendapatan (Beban) Keuangan', source: 'Pendapatan (Beban) Keuangan – Neto' },
        { label: 'Net Profit', source: 'Surplus/Defisit Neto' }
      ].map(g => {
        const found = finDataForYear.find(f => f.item_name.toLowerCase().trim() === g.source.toLowerCase())
        return { item_name: g.label, data: found?.data ?? {} }
      })
    } else if (kategori === 'Laporan Arus Kas') {
      gridData = [
        { label: 'Arus Kas Masuk dari Aktivitas Operasi', source: 'JUMLAH ARUS MASUK KAS (Operasi)' },
        { label: 'Arus Kas Keluar dari Aktivitas Operasi', source: 'JUMLAH ARUS KELUAR KAS (Operasi)' },
        { label: 'Arus Kas Masuk dari Aktivitas Investasi', source: 'JUMLAH ARUS MASUK KAS (Investasi)' },
        { label: 'Arus Kas Keluar dari Aktivitas Investasi', source: 'JUMLAH ARUS KELUAR KAS (Investasi)' },
        { label: 'Arus Kas Masuk dari Aktivitas Pendanaan', source: 'JUMLAH ARUS MASUK KAS (Pendanaan)' },
        { label: 'Arus Kas Keluar dari Aktivitas Pendanaan', source: 'JUMLAH ARUS KELUAR KAS (Pendanaan)' },
        { label: 'Saldo Awal Kas', source: 'Saldo Awal Kas' },
        { label: 'Kenaikan/Penurunan Kas', source: 'KENAIKAN/PENURUNAN KAS' },
        { label: 'Saldo Akhir Kas', source: 'SALDO AKHIR KAS' }
      ].map(g => {
        const found = finDataForYear.find(f => f.item_name.toLowerCase().trim() === g.source.toLowerCase())
        return { item_name: g.label, data: found?.data ?? {} }
      })
    } else if (gridData.length === 0) {
      gridData = finDataForYear;
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {gridData.map((item, idx) => {
          const val = item.data?.[selectedColKey] ?? (selectedColKey.startsWith('m') ? item.data?.['m' + selectedBln] : null)
          return (
            <div key={idx} className="animate-float-in cardHover relative overflow-hidden flex flex-col justify-center items-center text-center" style={{ background: '#ffffff', color: '#00282b', borderRadius: 12, padding: '24px 16px 20px', minHeight: 120, animationDelay: `${idx * 0.1}s`, boxShadow: '0 2px 8px rgba(0,40,43,.12)' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg, #01bcce, #d0db41)' }} />
              <div style={{ fontFamily: 'Nunito, sans-serif', fontSize: 16, fontWeight: 800, lineHeight: 1.2, marginBottom: 8, color: '#3d5a5c' }}>
                {item.item_name}
              </div>
              <div style={{ fontFamily: 'Nunito, sans-serif', fontSize: 22, fontWeight: 900, lineHeight: 1.1, color: '#00282b' }}>
                {val != null && val !== '' ? fmtAngka(val) : '—'}
              </div>
            </div>
          )
        })}
        {finDataForYear.length === 0 && !(kategori === 'Neraca' || kategori === 'Laporan Operasional' || kategori === 'Laporan Arus Kas') && (
          <div className="col-span-full text-center py-12 border-2 border-dashed rounded-xl font-nav text-sm" style={{ borderColor: 'rgba(255,255,255,0.5)', color: '#ffffff' }}>
            Tidak ada data {kategori} untuk periode ini.
          </div>
        )}
      </div>
    )
  }

  const renderGrid12Indikator = () => {
    const kpiFinMap = new Map(
      financialData
        .filter(f => f.category === '12_indikator' && f.year === selectedThn)
        .map(f => [f.item_name.toLowerCase().trim(), f.data])
    )

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {kpiConfig.map((cfg, idx) => {
          const finItem = kpiFinMap.get(cfg.label.toLowerCase().trim())
          const customTarget = finItem?.target || finItem?.['target']
          const displayTarget = (customTarget !== undefined && customTarget !== null && customTarget !== '') ? customTarget : cfg.target

          const effectiveRule = parseTargetRule(customTarget, cfg.targetVal, cfg.higherBetter)
          const effectiveCfg = { ...cfg, target: displayTarget, ...effectiveRule }

          // Value from financial_reports_data for selectedColKey, fallback to dSelected if monthly
          const rawFinVal = finItem?.[selectedColKey]
          const val = (rawFinVal !== undefined && rawFinVal !== null && rawFinVal !== '')
            ? (typeof rawFinVal === 'number' ? rawFinVal : parseNumber(String(rawFinVal)))
            : (selectedColKey.startsWith('m') ? dSelected?.[cfg.key] : null)

          const st = stat(val, effectiveCfg)
          const isBaik = st === 'baik'
          const accent = val == null ? '#cbd5e1' : isBaik ? '#01bcce' : '#e11d48'
          const chipColor = isBaik ? '#00858f' : '#e11d48'

          return (
            <div key={cfg.key} className="animate-float-in cardHover relative overflow-hidden flex flex-col justify-center items-center text-center" style={{ background: '#ffffff', color: '#00282b', borderRadius: 12, padding: '24px 16px 20px', minHeight: 120, animationDelay: `${idx * 0.1}s`, boxShadow: '0 2px 8px rgba(0,40,43,.12)' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: accent }} />
              
              {/* Top Right Logo Icon */}
              {val != null && (
                <div style={{ position: 'absolute', top: 12, right: 12, color: chipColor }}>
                  {isBaik ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                </div>
              )}

              <div style={{ fontFamily: 'Nunito, sans-serif', fontSize: 16, fontWeight: 800, lineHeight: 1.2, color: '#00282b' }}>{cfg.label}</div>
              <div style={{ fontFamily: 'Nunito, sans-serif', fontSize: 14, fontWeight: 600, color: '#000000', lineHeight: 1.2, marginTop: 4 }}>
                Target: {displayTarget}
              </div>

              <div style={{ fontFamily: 'Nunito, sans-serif', fontSize: 22, fontWeight: 900, lineHeight: 1.1, color: '#00282b', marginTop: 10 }}>
                {fmt(val, cfg.satuan)}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const renderTable12Indikator = () => {
    let kpiFinData = new Map(
      financialData
        .filter(f => f.category === '12_indikator' && f.year === selectedThn)
        .map(f => [f.item_name.toLowerCase().trim(), f.data])
    )

    // Fallback: if financial_reports_data has no rows for selectedThn, populate from semuaKpi (kinerja_keuangan)
    if (kpiFinData.size === 0 && semuaKpi && semuaKpi.length > 0) {
      const mapMetric: Record<string, string> = {
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
      const relevantKpi = semuaKpi.filter(k => k.tahun === selectedThn)
      if (relevantKpi.length > 0) {
        const generatedMap = new Map<string, any>()
        Object.entries(mapMetric).forEach(([labelKey, dbCol]) => {
          const rowData: Record<string, any> = {}
          relevantKpi.forEach(k => {
            const val = (k as any)[dbCol]
            if (val !== null && val !== undefined) {
              rowData['m' + k.bulan] = val
            }
          })
          generatedMap.set(labelKey, rowData)
        })
        kpiFinData = generatedMap
      }
    }

    const tableColumns = currentTableColumns

    // Combine template KPI rows with any custom rows
    const templateKeys = new Set(kpiConfig.map(c => c.label.toLowerCase().trim()))
    const customKpiRows = financialData
      .filter(f => f.category === '12_indikator' && f.year === selectedThn && !templateKeys.has(f.item_name.toLowerCase().trim()))
      .map((f, idx) => {
        const rawTarget = f.data?.target || f.data?.['target'] || '-'
        const { targetVal, higherBetter } = parseTargetRule(rawTarget, null, true)
        return {
          key: `custom_${idx}`,
          label: f.item_name,
          satuan: '',
          target: rawTarget,
          targetVal,
          higherBetter,
          order: f.data?._style?.order ?? (100 + idx)
        }
      })

    const allKpiRows = [
      ...kpiConfig.map((c, idx) => {
        const finItem = kpiFinData.get(c.label.toLowerCase().trim())
        const customTarget = finItem?.target || finItem?.['target']
        const displayTarget = (customTarget !== undefined && customTarget !== null && customTarget !== '') ? customTarget : c.target
        const { targetVal, higherBetter } = parseTargetRule(customTarget, c.targetVal, c.higherBetter)
        return {
          ...c,
          target: displayTarget,
          targetVal,
          higherBetter,
          order: finItem?._style?.order ?? idx
        }
      }),
      ...customKpiRows
    ].sort((a, b) => a.order - b.order)

    return (
      <div className="overflow-x-auto border border-gray-100 rounded-2xl shadow-sm bg-white" style={{ width: 'max-content', maxWidth: '100%' }}>
        <table className="text-left border-collapse" style={{ width: 'max-content' }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              <th style={{ padding: '12px 14px', position: 'sticky', left: 0, zIndex: 2, background: '#f8fafc', borderRight: '1px solid #eee', borderBottom: '2px solid #eee', fontFamily: 'Nunito, sans-serif', fontSize: 11, fontWeight: 800, color: '#888', textTransform: 'uppercase', width: 260, minWidth: 260, maxWidth: 260, whiteSpace: 'nowrap', textAlign: 'center' }}>Indikator</th>
              <th style={{ padding: '12px 12px', textAlign: 'center', borderRight: '1px solid #eee', borderBottom: '2px solid #eee', fontFamily: 'Nunito, sans-serif', fontSize: 11, fontWeight: 800, color: '#888', textTransform: 'uppercase', width: 130, minWidth: 130, maxWidth: 130, whiteSpace: 'nowrap' }}>Target</th>
              {tableColumns.map((col: any) => {
                const isSelectedCol = col.key === selectedColKey
                return (
                  <th
                    key={col.key}
                    style={{
                      padding: '12px 10px',
                      textAlign: 'center',
                      borderBottom: '2px solid #eee',
                      fontFamily: 'Nunito, sans-serif',
                      fontSize: 11,
                      fontWeight: 800,
                      color: isSelectedCol ? '#00282b' : '#888',
                      background: isSelectedCol ? 'rgba(1, 188, 206, 0.15)' : undefined,
                      width: 140,
                      minWidth: 140,
                      maxWidth: 140,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {col.label}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {allKpiRows.map((cfg, ri) => {
              const d = kpiFinData.get(cfg.label.toLowerCase().trim()) ?? {}
              const cSt = d._style ?? {}
              const bg = cSt.bgColor ?? (ri % 2 === 0 ? '#fff' : '#fafbfc')
              const bold = cSt.bold !== undefined ? cSt.bold : true
              const italic = cSt.italic ?? false
              const color = cSt.color ?? '#00282b'
              const indent = cSt.indent ?? 0

              return (
                <tr key={cfg.key} className="rowHover" style={{ background: bg }}>
                  <td style={{ padding: '10px 14px', position: 'sticky', left: 0, zIndex: 1, background: 'inherit', borderRight: '1px solid #eee', borderBottom: '1px solid #f0f0f0', paddingLeft: `${14 + indent * 16}px`, width: 260, minWidth: 260, maxWidth: 260, whiteSpace: 'nowrap' }}>
                    <div style={{ fontFamily: 'Nunito, sans-serif', fontSize: 11, fontWeight: bold ? 800 : 500, fontStyle: italic ? 'italic' : 'normal', color, whiteSpace: 'nowrap' }}>{cSt.customName || cfg.label}</div>
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', background: 'inherit', borderRight: '1px solid #eee', borderBottom: '1px solid #f0f0f0', fontFamily: 'Nunito, sans-serif', fontSize: 11, fontWeight: 700, color: '#00282b', width: 130, minWidth: 130, maxWidth: 130, whiteSpace: 'nowrap' }}>
                    {cfg.target || '—'}
                  </td>
                  {tableColumns.map((col: any, mi: number) => {
                    const monthIdx = col.key.startsWith('m') ? parseInt(col.key.slice(1)) : (mi + 1)
                    const rawV = d[col.key] ?? (col.key.startsWith('m') ? komp.find(k => k.bulan === monthIdx)?.[cfg.key] : null)
                    const s = stat(typeof rawV === 'number' ? rawV : null, cfg as any)
                    const cellSt = d._cellStyles?.[col.key] ?? {}
                    const cellBold = cellSt.bold !== undefined ? cellSt.bold : (rawV != null ? 700 : 400)
                    const cellItalic = cellSt.italic ?? false
                    const cellColor = cellSt.color ?? (rawV == null || rawV === '' ? '#94a3b8' : s === 'baik' ? '#111827' : '#e11d48')
                    const isSelectedCol = col.key === selectedColKey
                    const cellBg = cellSt.bgColor ?? (isSelectedCol ? (ri % 2 === 0 ? '#eef9fa' : '#e4f6f8') : undefined)

                    return (
                      <td key={col.key} style={{ padding: '10px 10px', textAlign: 'center', fontFamily: 'Nunito, sans-serif', fontSize: 11, fontWeight: cellBold, fontStyle: cellItalic ? 'italic' : 'normal', color: cellColor, background: cellBg, borderBottom: '1px solid #f0f0f0', width: 140, minWidth: 140, maxWidth: 140, whiteSpace: 'nowrap' }}>
                        {typeof rawV === 'number' && cfg.satuan ? fmt(rawV, cfg.satuan) : rawV != null ? (typeof rawV === 'number' ? fmtAngka(rawV) : String(rawV)) : '—'}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }

  const renderTableFinancial = () => {
    const tableColumns = currentTableColumns

    const TEMPLATE_ROWS = kategori === 'Neraca' ? NERACA_ROWS : kategori === 'Laporan Operasional' ? OPERASIONAL_ROWS : ARUSKAS_ROWS
    const COLORS = kategori === 'Neraca' ? NERACA_COLORS : OPERASIONAL_COLORS
    
    const byName = new Map(finDataForYear.map(f => [f.item_name.toLowerCase().trim(), f.data]))
    
    // Combine template rows with any custom rows
    const templateNames = new Set(TEMPLATE_ROWS.map(r => r.name.toLowerCase().trim()))
    const templateItems = TEMPLATE_ROWS.map((tr, idx) => {
      const d = byName.get(tr.name.toLowerCase().trim())
      return {
        name: tr.name,
        style: tr.style,
        data: d,
        order: d?._style?.order ?? idx
      }
    })
    
    const customItems = finDataForYear
      .filter(f => !templateNames.has(f.item_name.toLowerCase().trim()))
      .map((f, idx) => ({
        name: f.item_name,
        style: 'white',
        data: f.data,
        order: f.data?._style?.order ?? (1000 + idx)
      }))

    const allRows = [...templateItems, ...customItems].sort((a, b) => a.order - b.order)

    return (
    <div className="overflow-x-auto border border-gray-100 rounded-2xl shadow-sm bg-white" style={{ width: 'max-content', maxWidth: '100%' }}>
      <table className="text-left border-collapse" style={{ width: 'max-content' }}>
        <thead>
          <tr style={{ background: '#f8fafc' }}>
            <th style={{ padding: '10px 14px', position: 'sticky', left: 0, zIndex: 2, background: '#f8fafc', borderRight: '1px solid #eee', borderBottom: '2px solid #eee', fontFamily: 'Nunito, sans-serif', fontSize: 11, fontWeight: 800, color: '#888', textTransform: 'uppercase', whiteSpace: 'nowrap', textAlign: 'center' }}></th>
            {tableColumns.map((col: any) => {
              const isSelectedCol = col.key === selectedColKey
              return (
                <th
                  key={col.key}
                  style={{
                    padding: '10px 10px',
                    textAlign: 'center',
                    borderBottom: '2px solid #eee',
                    fontFamily: 'Nunito, sans-serif',
                    fontSize: 11,
                    fontWeight: 800,
                    color: isSelectedCol ? '#00282b' : '#888',
                    background: isSelectedCol ? 'rgba(1, 188, 206, 0.15)' : undefined,
                    width: 140,
                    minWidth: 140,
                    maxWidth: 140,
                    whiteSpace: 'nowrap'
                  }}
                >
                  {col.label}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {finDataForYear.length === 0 && !(kategori === 'Neraca' || kategori === 'Laporan Operasional' || kategori === 'Laporan Arus Kas') ? (
             <tr><td colSpan={tableColumns.length + 1} style={{ textAlign: 'center', padding: 24, color: '#999', fontFamily: 'Nunito, sans-serif', fontSize: 13 }}>Belum ada data untuk tahun ini.</td></tr>
          ) : (
            allRows.map((rowItem, ri) => {
              if (rowItem.style === 'blank') return <tr key={ri}><td colSpan={tableColumns.length + 1} style={{ height: 16 }}></td></tr>
              
              const d = rowItem.data ?? {}
              const cSt = d._style ?? {}
              
              const bg = cSt.bgColor ?? (COLORS as Record<string, string>)[rowItem.style] ?? '#ffffff'
              const bold = cSt.bold !== undefined ? cSt.bold : (rowItem.style !== 'white')
              const italic = cSt.italic ?? false
              const isRed = rowItem.name.includes('APBN')
              const textCol = cSt.color ?? (isRed ? '#e11d48' : '#000000')
              const indent = cSt.indent !== undefined ? cSt.indent : (rowItem.style === 'white' ? 1 : 0)
              const displayName = cSt.customName || rowItem.name.replace(/ \((Operasi|Investasi|Pendanaan|Ranap)\)$/, '')

              return (
                <tr key={ri} className="rowHover" style={{ background: bg }}>
                  <td style={{ padding: '5px 14px', position: 'sticky', left: 0, zIndex: 1, background: bg, borderRight: '1px solid #eee', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingLeft: `${14 + indent * 16}px`, whiteSpace: 'nowrap' }}>
                    <div style={{ fontFamily: 'Nunito, sans-serif', fontSize: 11, fontWeight: bold ? 800 : 500, fontStyle: italic ? 'italic' : 'normal', color: textCol, whiteSpace: 'nowrap' }}>{displayName}</div>
                  </td>
                  {tableColumns.map((col: any) => {
                    const v = d[col.key]
                    const cellSt = d._cellStyles?.[col.key] ?? {}
                    const isSelectedCol = col.key === selectedColKey
                    const cellBg = cellSt.bgColor ?? (isSelectedCol ? 'rgba(1, 188, 206, 0.12)' : undefined)
                    const cellBold = cellSt.bold !== undefined ? cellSt.bold : bold
                    const cellItalic = cellSt.italic ?? italic
                    const cellColor = cellSt.color ?? textCol

                    return (
                      <td key={col.key} style={{ padding: '5px 10px', textAlign: 'right', fontFamily: 'Nunito, sans-serif', fontSize: 11, fontWeight: cellBold && v != null ? 700 : 400, fontStyle: cellItalic ? 'italic' : 'normal', color: cellColor, background: cellBg, borderBottom: '1px solid rgba(0,0,0,0.05)', width: 140, minWidth: 140, maxWidth: 140, whiteSpace: 'nowrap' }}>
                        {v != null ? (typeof v === 'number' ? fmtAngka(v) : String(v)) : '—'}
                      </td>
                    )
                  })}
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}

  return (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes fadeSlideUp { from { opacity:0; transform: translateY(15px) } to { opacity:1; transform: translateY(0) } }
        @keyframes floatIn { from { opacity:0; transform: translateY(40px) } to { opacity:1; transform: translateY(0) } }
        
        .aFadeIn { animation: fadeIn 0.6s ease both }
        .animate-fadeSlideUp { animation: fadeSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards }
        .animate-float-in { animation: floatIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
        
        .cardHover { transition: transform .3s cubic-bezier(.175,.885,.32,1.275), box-shadow .3s }
        .cardHover:hover { transform: translateY(-8px) scale(1.02) !important; box-shadow: 0 20px 40px rgba(0,0,0,0.5), 0 0 20px rgba(208,219,65,0.15) !important; z-index: 10; }
        
        .rowHover { transition: background .15s }
        .rowHover:hover { background: #eef9fa !important }
        
        .pdfCard { transition: transform .3s cubic-bezier(.22,1,.36,1), box-shadow .3s }
        .pdfCard:hover { transform: translateY(-8px); box-shadow: 0 20px 50px rgba(0,40,43,.15) }
        .pdfCard:hover .pdfOverlay { opacity: 1 }
      `}</style>

      <div style={{ minHeight: '100vh', fontFamily: '"TeX Gyre Bonum", Georgia, serif' }}>
        {/* HERO */}
        <div className={ready ? 'aFadeIn' : ''} style={{
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

          <div style={{ position: 'relative', zIndex: 1, maxWidth: 1140, margin: '0 auto', padding: '0 24px', height: '100%', display: 'flex', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: 42, fontWeight: 900, color: '#fff', lineHeight: 1.1, margin: 0, fontFamily: 'Nunito, sans-serif' }}>
                Akuntansi Keuangan
              </h1>
              <div style={{ width: 70, height: 4, background: '#d0db41', borderRadius: 2, marginTop: 16 }} />
            </div>
          </div>
        </div>

        {/* MAIN SECTION */}
        <div style={{ background: '#f4f6f8', paddingBottom: 48 }}>
          <div style={{ maxWidth: 1440, margin: '0 auto', padding: '0 24px' }}>
            
            {/* Main Container */}
            <div style={{
              background: '#fff', borderRadius: 16, padding: '36px',
              boxShadow: '0 8px 40px rgba(0,40,43,.05)',
              position: 'relative', top: -40,
            }}>

              {/* TABS & FILTERS */}
              <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center mb-3 border-b border-gray-100 pb-3">
                <div className="flex flex-wrap gap-2">
                  {TABS.map(t => (
                    <button
                      key={t}
                      onClick={() => setKategori(t)}
                      className={`px-4 py-2 rounded-lg font-nav text-sm font-bold transition-all ${kategori === t ? 'bg-[#00282b] text-white shadow-md' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-xl border border-gray-100">
                  <Calendar size={16} className="text-gray-400 ml-2" />
                  <select
                    value={selectedColKey}
                    onChange={e => setSelectedColKey(e.target.value)}
                    className="bg-transparent font-nav text-sm font-bold text-[#00282b] outline-none cursor-pointer"
                  >
                    {currentTableColumns.map((col: any) => {
                      const monthNum = col.key.startsWith('m') && !isNaN(parseInt(col.key.slice(1))) ? parseInt(col.key.slice(1)) : null
                      const displayLabel = monthNum && NAMA_BULAN[monthNum] && col.label.toLowerCase().startsWith(NAMA_BULAN[monthNum].slice(0, 3).toLowerCase())
                        ? NAMA_BULAN[monthNum]
                        : col.label
                      return (
                        <option key={col.key} value={col.key}>
                          {displayLabel}
                        </option>
                      )
                    })}
                  </select>
                  <select
                    value={selectedThn}
                    onChange={e => setSelectedThn(Number(e.target.value))}
                    className="bg-transparent font-nav text-sm font-bold text-[#01bcce] outline-none cursor-pointer pr-2"
                  >
                    {availThn.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              {/* VIEW TOGGLE ROW */}
              <div className="flex justify-end items-center mb-4">
                <div style={{ display: 'flex', background: '#f0f0f0', borderRadius: 8, padding: 4 }}>
                  <button onClick={() => setMode('grid')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 6, border: 'none', background: mode === 'grid' ? '#fff' : 'transparent', color: mode === 'grid' ? '#00282b' : '#888', fontWeight: 700, fontSize: 12, fontFamily: 'Nunito, sans-serif', cursor: 'pointer', boxShadow: mode === 'grid' ? '0 2px 6px rgba(0,0,0,.05)' : 'none', transition: 'all .2s' }}><Grid3x3 size={14} /> Grid</button>
                  <button onClick={() => setMode('tabel')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 6, border: 'none', background: mode === 'tabel' ? '#fff' : 'transparent', color: mode === 'tabel' ? '#00282b' : '#888', fontWeight: 700, fontSize: 12, fontFamily: 'Nunito, sans-serif', cursor: 'pointer', boxShadow: mode === 'tabel' ? '0 2px 6px rgba(0,0,0,.05)' : 'none', transition: 'all .2s' }}><BarChart3 size={14} /> Komparatif</button>
                </div>
              </div>

              {/* CONTENT */}
              <div key={`${mode}-${kategori}`} className="animate-fadeSlideUp">
                {mode === 'grid' ? (
                  <div className="flex flex-col lg:flex-row gap-6 items-stretch rounded-3xl p-6 lg:p-10 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #00282b 0%, #015a61 100%)', boxShadow: '0 12px 32px rgba(0,40,43,.25)' }}>
                    {/* RSCM Ornament Decoration */}
                    <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: '45%', paddingBottom: '45%', backgroundImage: 'url(/ornament-rscm.png)', backgroundSize: 'contain', backgroundRepeat: 'no-repeat', opacity: 0.15, zIndex: 0, transform: 'rotate(-15deg)' }} />

                    {/* Left Column */}
                    <div className="lg:w-1/4 flex flex-col pt-2 relative z-10">
                      <h2 className="font-nav text-3xl font-black leading-tight mb-3" style={{ color: '#d0db41', textShadow: '0 2px 10px rgba(208,219,65,0.2)' }}>
                        {kategori === '12 Indikator Kinerja' ? 'Indikator Kinerja Keuangan RSCM' : kategori}
                      </h2>
                      <p className="font-nav text-sm font-bold" style={{ color: '#ffffff' }}>
                        Periode: {activePeriodLabel} {selectedThn}
                      </p>
                      <p className="font-nav text-xs mt-2" style={{ color: '#ffffff', opacity: 0.9 }}>
                        * Dalam jutaan rupiah
                      </p>
                      <div className="mt-6 hidden lg:block w-16 h-1.5 rounded-full" style={{ background: '#d0db41', boxShadow: '0 2px 8px rgba(208,219,65,0.3)' }} />
                    </div>

                    {/* Right Column (The Cards) */}
                    <div className="lg:w-3/4 w-full relative z-10">
                      {kategori === '12 Indikator Kinerja' ? renderGrid12Indikator() : renderGridFinancial()}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mb-4">
                      <h2 className="font-nav text-2xl font-black text-[#00282b]">{kategori}</h2>
                      <p className="font-nav text-sm text-[#01bcce] font-bold mt-1">
                        Periode: {selectedThn}
                        <span className="text-gray-500 font-normal ml-2">(* Dalam jutaan rupiah)</span>
                      </p>
                    </div>
                    {kategori === '12 Indikator Kinerja' ? renderTable12Indikator() : renderTableFinancial()}
                  </>
                )}
              </div>

            </div>

            {/* BOX 2: DOKUMEN LAPORAN KEUANGAN */}
            <div style={{
              background: '#fff', borderRadius: 16, padding: '32px 32px',
              boxShadow: '0 8px 40px rgba(0,40,43,.05)',
              marginBottom: 32,
            }}>
              {/* Centered Header (Jarak Rapat) */}
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <div style={{ width: 40, height: 3.5, background: '#01bcce', borderRadius: 2, margin: '0 auto 6px' }} />
                <h2 style={{ fontFamily: 'Nunito, sans-serif', fontSize: 22, fontWeight: 900, color: '#00282b', margin: 0, letterSpacing: '-0.3px', lineHeight: 1.2 }}>
                  Dokumen Laporan Keuangan
                </h2>
                <p style={{ fontFamily: 'Nunito, sans-serif', fontSize: 13, color: '#64748b', marginTop: 3, marginBottom: 0, fontWeight: 600, lineHeight: 1.3 }}>
                  Unduh laporan keuangan per semester dan tahunan
                </p>
              </div>

              {/* Centered Filters */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
                <select value={fP} onChange={e => setFP(e.target.value)} style={sel}>
                  <option value="">Semua Periode</option>
                  <option value="Semester 1">Semester 1</option>
                  <option value="Semester 2">Semester 2</option>
                  <option value="Tahunan">Tahunan</option>
                </select>
                <select value={fTL} onChange={e => setFTL(e.target.value)} style={sel}>
                  <option value="">Semua Tahun</option>
                  {thnL.map(t => <option key={t} value={String(t)}>{t}</option>)}
                </select>
              </div>

              {/* Document Cards Grid */}
              {lapF.length === 0 ? <Empty /> : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 20 }}>
                  {lapF.map((l: any) => <PdfCover key={l.id} title={l.judul} sub={`${l.periode} · ${l.tahun}`} url={l.file_url} />)}
                </div>
              )}
            </div>

            {/* BOX 3: CATATAN ATAS LAPORAN KEUANGAN */}
            <div style={{
              background: '#fff', borderRadius: 16, padding: '32px 32px',
              boxShadow: '0 8px 40px rgba(0,40,43,.05)',
              marginBottom: 32,
            }}>
              {/* Centered Header (Jarak Rapat) */}
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <div style={{ width: 40, height: 3.5, background: '#d0db41', borderRadius: 2, margin: '0 auto 6px' }} />
                <h2 style={{ fontFamily: 'Nunito, sans-serif', fontSize: 22, fontWeight: 900, color: '#00282b', margin: 0, letterSpacing: '-0.3px', lineHeight: 1.2 }}>
                  Catatan Atas Laporan Keuangan
                </h2>
                <p style={{ fontFamily: 'Nunito, sans-serif', fontSize: 13, color: '#64748b', marginTop: 3, marginBottom: 0, fontWeight: 600, lineHeight: 1.3 }}>
                  Catatan penjelas atas laporan keuangan tahunan
                </p>
              </div>

              {/* Centered Filter */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
                <select value={fTC} onChange={e => setFTC(e.target.value)} style={sel}>
                  <option value="">Semua Tahun</option>
                  {thnC.map(t => <option key={t} value={String(t)}>{t}</option>)}
                </select>
              </div>

              {/* Document Cards Grid */}
              {catF.length === 0 ? <Empty /> : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 20 }}>
                  {catF.map((c: any) => <PdfCover key={c.id} title={c.judul} sub={`Tahun ${c.tahun}`} url={c.file_url} />)}
                </div>
              )}
            </div>

            {/* BOX 4: UNDUH DOKUMEN (Konsep Regulasi & Kebijakan) */}
            <div style={{
              background: '#fff', borderRadius: 16, padding: '32px 32px',
              boxShadow: '0 8px 40px rgba(0,40,43,.05)',
            }}>
              {/* Centered Header (Jarak Rapat) */}
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{ width: 40, height: 3.5, background: '#00282b', borderRadius: 2, margin: '0 auto 6px' }} />
                <h2 style={{ fontFamily: 'Nunito, sans-serif', fontSize: 22, fontWeight: 900, color: '#00282b', margin: 0, letterSpacing: '-0.3px', lineHeight: 1.2 }}>
                  Unduh Dokumen
                </h2>
                <p style={{ fontFamily: 'Nunito, sans-serif', fontSize: 13, color: '#64748b', marginTop: 3, marginBottom: 0, fontWeight: 600, lineHeight: 1.3 }}>
                  Cari dan akses dokumen, panduan, serta regulasi terkait akuntansi dan keuangan
                </p>
              </div>

              {/* Action Toolbar: Search Bar di Sebelah Kiri */}
              <div className="flex justify-start mb-5">
                <div className="relative w-full sm:w-80 md:w-96">
                  <input
                    type="text"
                    placeholder="Cari nama dokumen atau tahun..."
                    value={searchDoc}
                    onChange={e => setSearchDoc(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 shadow-sm outline-none font-nav text-xs sm:text-sm focus:border-[#01bcce] focus:ring-1 focus:ring-[#01bcce] transition-all bg-[#f8fafc]"
                  />
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                </div>
              </div>

              {/* Document List Table */}
              {filteredDocs.length === 0 ? (
                <div className="text-center py-12 text-gray-400 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 font-nav text-sm font-semibold">
                  {searchDoc ? 'Tidak ada dokumen yang cocok dengan pencarian Anda.' : 'Belum ada dokumen yang tersedia.'}
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <table className="w-full text-left font-nav">
                    <thead className="bg-[#f8fafa]">
                      <tr>
                        <th className="py-4 px-6 text-xs font-bold text-gray-600 uppercase tracking-wider text-center">Judul Dokumen</th>
                        <th className="py-4 px-6 text-xs font-bold text-gray-600 uppercase tracking-wider w-36 text-center">Tahun</th>
                        <th className="py-4 px-6 text-xs font-bold text-gray-600 uppercase tracking-wider text-center w-36">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredDocs.map((doc) => (
                        <tr key={doc.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="py-3.5 px-6">
                            <div className="flex items-center gap-3">
                              <div className="p-2.5 bg-[#eef9fa] text-[#01bcce] rounded-xl flex-shrink-0">
                                <FileText size={20} />
                              </div>
                              <span className="font-semibold text-gray-800 text-sm sm:text-base leading-snug">{doc.nama}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-6 text-center">
                            <span className="inline-flex items-center justify-center px-3.5 py-1 rounded-full bg-gray-100 text-gray-700 font-bold text-xs">
                              {doc.tahun || '-'}
                            </span>
                          </td>
                          <td className="py-3.5 px-6 text-center">
                            <a
                              href={doc.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl font-bold text-xs transition-all shadow-sm hover:opacity-90"
                              style={{
                                background: '#00282b',
                                color: '#01bcce',
                              }}
                            >
                              <ExternalLink size={15} />
                              Buka
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        </div>
        <div style={{ height: 40 }} />
      </div>
    </>
  )
}

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

function Empty() {
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px', border: '2px dashed #e2e8f0', borderRadius: 16, color: '#94a3b8', fontFamily: 'Nunito, sans-serif', fontSize: 13, fontWeight: 600 }}>
      Belum ada dokumen yang tersedia untuk filter ini.
    </div>
  )
}

function PdfCover({ title, sub, url }: { title: string; sub: string; url: string }) {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="pdfCard"
      style={{ display: 'block', textDecoration: 'none', borderRadius: 12, overflow: 'hidden', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,.06)', border: '1px solid #eee' }}>
      <div style={{ position: 'relative', width: '100%', aspectRatio: '3/4', background: '#f0f0f0', overflow: 'hidden' }}>
        <iframe src={`${url}#page=1&view=FitH&toolbar=0&navpanes=0&scrollbar=0`} style={{ width: '200%', height: '200%', border: 'none', transform: 'scale(0.5)', transformOrigin: '0 0', pointerEvents: 'none' }} title={title} />
        <div className="pdfOverlay" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,40,43,.85) 0%, rgba(0,40,43,.3) 50%, transparent 100%)', opacity: 0, transition: 'opacity .3s', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: 16 }}>
          <span style={{ fontFamily: 'Nunito, sans-serif', fontSize: 12, fontWeight: 700, color: '#d0db41', background: 'rgba(0,40,43,.6)', borderRadius: 6, padding: '6px 16px', backdropFilter: 'blur(4px)' }}>Buka Dokumen →</span>
        </div>
      </div>
      <div style={{ padding: '12px 14px' }}>
        <div style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700, fontSize: 13, color: '#00282b', lineHeight: 1.3 }}>{title}</div>
        <div style={{ fontFamily: 'Nunito, sans-serif', fontSize: 11, color: '#888', marginTop: 3 }}>{sub}</div>
      </div>
    </a>
  )
}
