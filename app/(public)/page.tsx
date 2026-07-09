import HeroSection from '@/components/home/HeroSection'
import CalendarSection from '@/components/home/CalendarSection'
import MenuGrid from '@/components/home/MenuGrid'
import AnnouncementSection from '@/components/home/AnnouncementSection'
import DokumentasiMarquee from '@/components/home/DokumentasiMarquee'
import { createClient } from '@/lib/supabase/server'

export const metadata = {
  title: 'Beranda | Tim Kerja Akuntansi RSCM',
  description: 'Portal internal Tim Kerja Akuntansi RSUPN Dr. Cipto Mangunkusumo',
}

export default async function BerandaPage() {
  const supabase = await createClient()

  const { data: pengumuman } = await supabase
    .from('pengumuman')
    .select('id, judul, konten, jenis, created_at')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(3)

  const { data: dokumentasi } = await supabase
    .from('dokumentasi')
    .select('id, caption, file_url, file_type, tanggal')
    .order('tanggal', { ascending: false })
    .limit(10)

  return (
    <>
      <HeroSection />
      <CalendarSection />
      <AnnouncementSection items={pengumuman || []} />
      <MenuGrid />
      <DokumentasiMarquee items={dokumentasi || []} />
    </>
  )
}
