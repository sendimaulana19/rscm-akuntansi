import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ slug: string }>
}

interface HalamanProfil {
  id: string
  slug: string
  judul: string
  konten: string
  gambar_url?: string
  file_url?: string
  file_name?: string
  updated_at?: string
}

export async function generateMetadata({ params }: Props) {
  const supabase = await createClient()
  const { slug } = await params
  const { data } = await supabase
    .from('halaman_profil')
    .select('judul, konten')
    .eq('slug', slug)
    .single()

  return {
    title: data ? `${data.judul} | RSCM Akuntansi` : 'Profil | RSCM Akuntansi',
    description: data?.konten?.replace(/<[^>]+>/g, '').substring(0, 160) || 'Halaman Profil RSCM Akuntansi',
  }
}

export default async function ProfilSlugPage({ params }: Props) {
  const supabase = await createClient()
  const { slug } = await params

  if (slug === 'budaya-kerja') {
    redirect('/profil/budaya-kerja')
  }

  const { data, error } = await supabase
    .from('halaman_profil')
    .select('id, slug, judul, konten, gambar_url, file_url, updated_at')
    .eq('slug', slug)
    .single()

  let halaman = data as HalamanProfil | null
  console.log("DEBUG_PROFIL:", { slug, data, error })
  
  if (error || !data) {
    if (slug === 'tim-kerja-akuntansi') {
      halaman = {
        id: 'temp',
        slug: 'tim-kerja-akuntansi',
        judul: 'Profil Tim Kerja Akuntansi',
        konten: '<p style="text-align:center; color:#666;"><em>Konten profil belum ditambahkan. Silakan perbarui melalui Panel Admin.</em></p>'
      }
    } else {
      notFound()
    }
  }

  const isKpi = slug === 'kpi'
  
  if (isKpi && halaman?.konten) {
    let url = halaman.konten.replace(/<[^>]+>/g, '').trim()
    if (url.startsWith('http')) {
      redirect(url)
    }
  }

  if (!halaman) return null;

  return (
    <main
      className="min-h-screen"
      style={{ fontFamily: '"TeX Gyre Bonum", Georgia, serif', background: '#f4f6f8' }}
    >
      {/* Hero Section */}
      <div style={{
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
              {halaman.judul.startsWith('Profil ') ? (
                <>
                  Profil<br />
                  {halaman.judul.substring(7)}
                </>
              ) : (
                halaman.judul
              )}
            </h1>
            {halaman.updated_at && (
              <p
                className="text-sm mt-3"
                style={{ color: '#a0d8dd', fontFamily: 'Nunito, sans-serif' }}
              >
                Terakhir diperbarui:{' '}
                {new Date(halaman.updated_at).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            )}
            <div style={{ width: 70, height: 4, background: '#d0db41', borderRadius: 2, marginTop: 16 }} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1140, margin: '40px auto 40px', padding: '0 24px', position: 'relative', zIndex: 10 }}>
        {/* Cover Image */}
        {halaman.gambar_url && (
          <div className="mb-8 rounded-2xl overflow-hidden shadow-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={halaman.gambar_url}
              alt={halaman.judul}
              className="w-full object-cover"
              style={{ maxHeight: '400px' }}
            />
          </div>
        )}

        {/* HTML Content */}
        <article
          className="bg-white rounded-2xl p-8 shadow-lg mb-8"
          style={{ border: '1px solid #e0e0e0' }}
        >
          <div
            className="prose prose-lg max-w-none leading-relaxed text-gray-700 break-words whitespace-pre-wrap"
            style={{ fontFamily: '"TeX Gyre Bonum", Georgia, serif' }}
            dangerouslySetInnerHTML={{ __html: halaman.konten }}
          />
        </article>

        {/* KPI: embed PDF */}
        {isKpi && halaman.file_url && (
          <div
            className="rounded-2xl overflow-hidden shadow-xl"
            style={{ border: '2px solid #01bcce' }}
          >
            <div
              className="px-6 py-4 flex items-center justify-between"
              style={{ background: '#00282b' }}
            >
              <div>
                <p
                  className="text-white font-semibold"
                  style={{ fontFamily: 'Nunito, sans-serif' }}
                >
                  {halaman.file_name || 'Dokumen KPI'}
                </p>
                <p
                  className="text-xs"
                  style={{ color: '#01bcce', fontFamily: 'Nunito, sans-serif' }}
                >
                  Key Performance Indicators
                </p>
              </div>
              <a
                href={halaman.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold px-4 py-2 rounded-lg text-sm transition-all hover:opacity-90"
                style={{ background: '#d0db41', color: '#00282b', fontFamily: 'Nunito, sans-serif' }}
              >
                ⬇ Unduh PDF
              </a>
            </div>
            <iframe
              src={halaman.file_url}
              title={halaman.file_name || 'KPI Document'}
              className="w-full"
              style={{ height: '80vh', border: 'none' }}
            />
          </div>
        )}

        {/* Non-KPI file attachment */}
        {!isKpi && halaman.file_url && (
          <div
            className="rounded-2xl p-5 flex items-center justify-between gap-4 shadow-md"
            style={{ background: '#ffffff', border: '1px solid #e0e0e0' }}
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">📎</span>
              <div>
                <p
                  className="font-semibold"
                  style={{ color: '#00282b', fontFamily: 'Nunito, sans-serif' }}
                >
                  {halaman.file_name || 'Lampiran Dokumen'}
                </p>
                <p className="text-sm text-gray-500">Klik untuk mengunduh atau membuka file</p>
              </div>
            </div>
            <a
              href={halaman.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 font-bold px-5 py-2.5 rounded-xl transition-all hover:opacity-90 hover:shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #00282b, #015a61)',
                color: '#d0db41',
                fontFamily: 'Nunito, sans-serif',
              }}
            >
              ⬇ Unduh
            </a>
          </div>
        )}
      </div>
    </main>
  )
}
