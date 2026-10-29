import { createClient } from '@/lib/supabase/server'
import KpiClient from './KpiClient'
import {
  KpiRow,
  IsoLikeRow,
  RscmAwardRow,
} from '@/lib/kpi-types'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata = {
  title: 'Key Performance Indicator (KPI) | RSCM Akuntansi',
  description: 'Capaian Key Performance Indicator (KPI), ISO Like, dan RSCM Award Tim Kerja Akuntansi RSUPN Dr. Cipto Mangunkusumo.',
}

export default async function KpiPage() {
  const supabase = await createClient()

  // Ambil seluruh data KPI dari financial_reports_data
  const { data: rawData, error } = await supabase
    .from('financial_reports_data')
    .select('*')
    .in('category', ['kpi_utama', 'kpi_iso_like', 'kpi_rscm_award'])
    .order('year', { ascending: false })

  if (error) {
    console.error('Error fetching KPI data from Supabase:', error)
  }

  const allRecords = rawData || []

  // Kumpulkan daftar tahun unik
  const currentYear = new Date().getFullYear()
  const yearsSet = new Set<number>([currentYear])
  allRecords.forEach((item) => {
    if (typeof item.year === 'number' && item.year > 1900) {
      yearsSet.add(item.year)
    }
  })

  const availableYears = Array.from(yearsSet).sort((a, b) => b - a)

  // Map data per kategori & tahun (kosongkan jika tidak ada data di database)
  const kpiDataByYear: Record<number, KpiRow[]> = {}
  const isoDataByYear: Record<number, IsoLikeRow[]> = {}
  const awardDataByYear: Record<number, RscmAwardRow[]> = {}

  availableYears.forEach((year) => {
    const kpiRec = allRecords.find((r) => r.category === 'kpi_utama' && r.year === year)
    kpiDataByYear[year] = Array.isArray(kpiRec?.data?.rows) ? kpiRec.data.rows : []

    const isoRec = allRecords.find((r) => r.category === 'kpi_iso_like' && r.year === year)
    isoDataByYear[year] = Array.isArray(isoRec?.data?.rows) ? isoRec.data.rows : []

    const awardRec = allRecords.find((r) => r.category === 'kpi_rscm_award' && r.year === year)
    awardDataByYear[year] = Array.isArray(awardRec?.data?.rows) ? awardRec.data.rows : []
  })

  return (
    <KpiClient
      availableYears={availableYears}
      initialKpiByYear={kpiDataByYear}
      initialIsoByYear={isoDataByYear}
      initialAwardByYear={awardDataByYear}
    />
  )
}
