import { createClient } from '@/lib/supabase/server'
import KinerjaKeuanganClient from './KinerjaKeuanganClient'

export default async function AkuntansiKeuanganPage() {
  const supabase = await createClient()

  // Ambil data KPI terbaru
  const { data: kpiTerbaru } = await supabase
    .from('kinerja_keuangan')
    .select('*')
    .order('tahun', { ascending: false })
    .order('bulan', { ascending: false })
    .limit(1)
    .single()

  // Ambil semua data untuk tabel komparatif
  const { data: semuaKpi } = await supabase
    .from('kinerja_keuangan')
    .select('*')
    .order('tahun', { ascending: false })
    .order('bulan', { ascending: true })

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

  return (
    <KinerjaKeuanganClient
      kpiTerbaru={kpiTerbaru}
      semuaKpi={semuaKpi || []}
      laporanKeuangan={laporanKeuangan || []}
      catatanLaporan={catatanLaporan || []}
    />
  )
}
