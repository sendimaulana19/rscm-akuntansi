import { createClient } from '@/lib/supabase/server'
import AkuntansiManajemenClient, {
  UnitCostData,
  MonevKsoData,
} from './AkuntansiManajemenClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata = {
  title: 'Akuntansi Manajemen | Tim Kerja Akuntansi RSCM',
  description: 'Informasi Unit Cost dan Monitoring & Evaluasi KSO di RSUPN Dr. Cipto Mangunkusumo',
}

export default async function AkuntansiManajemenPage() {
  const supabase = await createClient()

  // Ambil data konfigurasi Unit Cost & Monev KSO dari financial_reports_data
  const { data: records, error } = await supabase
    .from('financial_reports_data')
    .select('*')
    .eq('category', 'akuntansi_manajemen')

  if (error) {
    console.error('Error fetching akuntansi_manajemen data:', error)
  }

  const unitCostRecord = (records || []).find((r: any) => r.item_name === 'unit_cost')
  const monevKsoRecord = (records || []).find((r: any) => r.item_name === 'monev_kso')

  const initialUnitCost: UnitCostData = {
    image:
      unitCostRecord?.data?.image ||
      (unitCostRecord?.data?.images && unitCostRecord.data.images[0]) ||
      '',
    konten: unitCostRecord?.data?.konten || '',
    link_operatif: unitCostRecord?.data?.link_operatif || '',
    link_non_operatif: unitCostRecord?.data?.link_non_operatif || '',
    kalimat_pengarah:
      unitCostRecord?.data?.kalimat_pengarah ||
      unitCostRecord?.data?.keterangan ||
      'Silahkan klik tombol disamping untuk melihat unit cost RSCM',
  }

  const initialMonevKso: MonevKsoData = {
    image:
      monevKsoRecord?.data?.image ||
      (monevKsoRecord?.data?.images && monevKsoRecord.data.images[0]) ||
      '',
    konten: monevKsoRecord?.data?.konten || '',
    link_dashboard: monevKsoRecord?.data?.link_dashboard || '',
    kalimat_pengarah:
      monevKsoRecord?.data?.kalimat_pengarah ||
      monevKsoRecord?.data?.keterangan ||
      'Silahkan klik tombol disamping untuk menuju dashboar Monev KSO, gunakan username dan password yang sama untuk mengakses ehr',
  }

  // Ambil dokumen unduhan
  const [{ data: financialDocs }, { data: unduhDokumen }] = await Promise.all([
    supabase
      .from('financial_reports_data')
      .select('*')
      .eq('category', 'unduh_dokumen')
      .order('year', { ascending: false }),
    supabase
      .from('download_dokumen')
      .select('*')
      .order('created_at', { ascending: false })
  ])

  return (
    <AkuntansiManajemenClient
      initialUnitCost={initialUnitCost}
      initialMonevKso={initialMonevKso}
      financialDocsRaw={financialDocs || []}
      unduhDokumenRaw={unduhDokumen || []}
    />
  )
}
