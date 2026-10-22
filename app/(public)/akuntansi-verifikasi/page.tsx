import { createClient } from '@/lib/supabase/server'
import AkuntansiVerifikasiClient, { YearVerificationData, YearSlaData, YearBaTutupTagihanData } from './AkuntansiVerifikasiClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AkuntansiVerifikasiPage() {
  const supabase = await createClient()

  // Ambil data verifikasi dokumen tagihan dari Supabase
  const { data: records, error } = await supabase
    .from('financial_reports_data')
    .select('*')
    .eq('category', 'verifikasi_dokumen_tagihan')
    .order('year', { ascending: false })

  if (error) {
    console.error('Error fetching verifikasi_dokumen_tagihan:', error)
  }

  // Ambil data verifikasi SLA dari Supabase
  const { data: slaRecords, error: slaError } = await supabase
    .from('financial_reports_data')
    .select('*')
    .eq('category', 'verifikasi_sla')
    .order('year', { ascending: false })

  if (slaError) {
    console.error('Error fetching verifikasi_sla:', slaError)
  }

  // Ambil data verifikasi BA Tutup Tagihan dari Supabase
  const { data: baRecords, error: baError } = await supabase
    .from('financial_reports_data')
    .select('*')
    .eq('category', 'verifikasi_ba_tutup_tagihan')
    .order('year', { ascending: false })

  if (baError) {
    console.error('Error fetching verifikasi_ba_tutup_tagihan:', baError)
  }

  // Ambil catatan text box perbandingan (bersifat umum, tanpa riwayat per tahun)
  const { data: globalComp } = await supabase
    .from('financial_reports_data')
    .select('*')
    .eq('category', 'verifikasi_dokumen_tagihan_global')
    .eq('item_name', 'perbandingan_keterangan')
    .maybeSingle()

  const initialDataList: YearVerificationData[] = (records || []).map((r: any) => ({
    tahun: r.year,
    header_text: r.data?.header_text,
    judul_text_keseluruhan: r.data?.judul_text_keseluruhan,
    keterangan_keseluruhan: r.data?.keterangan_keseluruhan,
    judul_text_internal: r.data?.judul_text_internal,
    keterangan_internal: r.data?.keterangan_internal,
    judul_text_eksternal: r.data?.judul_text_eksternal,
    keterangan_eksternal: r.data?.keterangan_eksternal,
    months: r.data?.months || []
  }))

  const initialSlaDataList: YearSlaData[] = (slaRecords || []).map((r: any) => ({
    tahun: r.year,
    header_text: r.data?.header_text,
    judul_tabel: r.data?.judul_tabel,
    keterangan_capaian: r.data?.keterangan_capaian,
    months: r.data?.months || [],
    judul_pengambilan: r.data?.judul_pengambilan,
    keterangan_pengambilan: r.data?.keterangan_pengambilan,
    months_pengambilan: r.data?.months_pengambilan || [],
    judul_pengembalian: r.data?.judul_pengembalian,
    keterangan_pengembalian: r.data?.keterangan_pengembalian,
    months_pengembalian: r.data?.months_pengembalian || []
  }))

  const initialBaDataList: YearBaTutupTagihanData[] = (baRecords || []).map((r: any) => ({
    tahun: r.year,
    header_text: r.data?.header_text,
    judul_jenis_tagihan: r.data?.judul_jenis_tagihan,
    jenis_tagihan_items: r.data?.jenis_tagihan_items || [],
    keterangan_jenis_tagihan: r.data?.keterangan_jenis_tagihan,
    judul_tabel: r.data?.judul_tabel,
    keterangan: r.data?.keterangan,
    months: r.data?.months || [],
    judul_nominal: r.data?.judul_nominal,
    keterangan_nominal: r.data?.keterangan_nominal,
    months_nominal: r.data?.months_nominal || []
  }))

  const globalPerbandinganInternal = (globalComp?.data?.keterangan_perbandingan_internal || '').trim()
  const globalPerbandinganEksternal = (globalComp?.data?.keterangan_perbandingan_eksternal || '').trim()

  return (
    <AkuntansiVerifikasiClient
      initialDataList={initialDataList}
      initialSlaDataList={initialSlaDataList}
      initialBaDataList={initialBaDataList}
      globalPerbandinganInternal={globalPerbandinganInternal}
      globalPerbandinganEksternal={globalPerbandinganEksternal}
    />
  )
}

