import { createClient } from '@/lib/supabase/server'
import KinerjaKeuanganClient from './KinerjaKeuanganClient'
import { normName, parseNumber } from '@/lib/neraca'

// Selalu ambil data terbaru dari database (jangan pakai cache halaman)
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AkuntansiKeuanganPage() {
  const supabase = await createClient()

  // Ambil data financial (Neraca, LabaRugi, ArusKas, 12 Indikator)
  const { data: financialDataRaw } = await supabase
    .from('financial_reports_data')
    .select('*')
    .order('year', { ascending: false })

  const financialData = (financialDataRaw || []).filter(f => typeof f.year === 'number' && f.year > 1900)

  // Derive 12 Indikator Kinerja from financial_reports_data (Data Laporan)
  const kpiRows = financialData.filter(f => f.category === '12_indikator')
  
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

  let semuaKpi: any[] = []
  let kpiTerbaru: any = null

  if (kpiRows.length > 0) {
    // Group rows by year
    const byYear = new Map<number, any[]>()
    kpiRows.forEach(r => {
      if (!byYear.has(r.year)) byYear.set(r.year, [])
      byYear.get(r.year)!.push(r)
    })

    const extractedKpi: any[] = []
    byYear.forEach((rows, year) => {
      for (let b = 1; b <= 12; b++) {
        const mKey = 'm' + b
        let hasAnyValue = false
        const kpiItem: Record<string, any> = { tahun: year, bulan: b }

        rows.forEach(r => {
          const norm = normName(r.item_name)
          const field = mapMetricToCol[norm]
          if (field) {
            const rawVal = r.data?.[mKey]
            if (rawVal !== null && rawVal !== undefined && rawVal !== '') {
              const num = typeof rawVal === 'number' ? rawVal : parseNumber(String(rawVal))
              kpiItem[field] = num
              if (num !== null) hasAnyValue = true
            } else {
              kpiItem[field] = null
            }
          }
        })

        if (hasAnyValue) {
          extractedKpi.push(kpiItem)
        }
      }
    })

    // Sort: year descending, month ascending
    extractedKpi.sort((a, b) => b.tahun - a.tahun || a.bulan - b.bulan)
    semuaKpi = extractedKpi
    
    // Find latest KPI with data (largest year, largest month)
    const sortedDesc = [...extractedKpi].sort((a, b) => b.tahun - a.tahun || b.bulan - a.bulan)
    kpiTerbaru = sortedDesc[0] || null
  } else {
    // Fallback only if financial_reports_data has never been created
    const { data: fallbackKpi } = await supabase
      .from('kinerja_keuangan')
      .select('*')
      .order('tahun', { ascending: false })
      .order('bulan', { ascending: true })
    semuaKpi = fallbackKpi || []
    kpiTerbaru = semuaKpi[semuaKpi.length - 1] || null
  }

  // Ambil laporan keuangan
  const { data: laporanKeuangan } = await supabase
    .from('laporan_keuangan')
    .select('*')
    .order('tahun', { ascending: false })

  // Ambil catatan atas laporan keuangan
  const { data: catatanLaporan } = await supabase
    .from('catatan_laporan_keuangan')
    .select('*')
    .order('tahun', { ascending: false })

  // Ambil dokumen unduhan umum
  const { data: unduhDokumen } = await supabase
    .from('download_dokumen')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <KinerjaKeuanganClient
      kpiTerbaru={kpiTerbaru}
      semuaKpi={semuaKpi}
      financialData={financialData}
      laporanKeuangan={laporanKeuangan || []}
      catatanLaporan={catatanLaporan || []}
      unduhDokumenRaw={unduhDokumen || []}
    />
  )
}

