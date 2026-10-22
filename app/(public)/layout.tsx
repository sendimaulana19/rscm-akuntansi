import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  let kpiUrl = '/profil/kpi'
  try {
    const supabase = await createClient()
    const { data } = await supabase.from('halaman_profil').select('konten').eq('slug', 'kpi').single()
    
    if (data?.konten && data.konten.replace(/<[^>]+>/g, '').trim().startsWith('http')) {
      kpiUrl = data.konten.replace(/<[^>]+>/g, '').trim()
    }
  } catch (err) {
    console.warn('Network issue fetching KPI link:', err)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar kpiUrl={kpiUrl} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
