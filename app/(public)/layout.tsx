import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export const dynamic = 'force-dynamic'

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const kpiUrl = '/profil/kpi'

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar kpiUrl={kpiUrl} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
