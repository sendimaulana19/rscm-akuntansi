import { createClient } from '@/lib/supabase/server'
import BudayaKerjaClient, { BudayaKerjaData } from './BudayaKerjaClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata = {
  title: 'Budaya Kerja | Tim Kerja Akuntansi RSCM',
  description: 'Budaya Kerja di RSUPN Dr. Cipto Mangunkusumo',
}

export default async function BudayaKerjaPage() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('halaman_profil')
    .select('id, slug, judul, konten, gambar_url, updated_at')
    .eq('slug', 'budaya-kerja')
    .maybeSingle()

  if (error) {
    console.error('Error fetching budaya-kerja:', error)
  }

  return <BudayaKerjaClient initialData={(data as BudayaKerjaData) || null} />
}
