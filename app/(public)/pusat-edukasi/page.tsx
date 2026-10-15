import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { PlayCircle, FileText, BookOpen } from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Pusat Edukasi | RSCM Akuntansi',
  description: 'Pusat Edukasi, panduan, video tutorial, dan materi Akuntansi RSCM',
}

interface Edukasi {
  id: string
  judul: string
  deskripsi?: string
  video_url?: string
  thumbnail_url?: string
  materi_url?: string
  konten?: string
  created_at?: string
}

export default async function PusatEdukasiPage() {
  const supabase = await createClient()

  // Safely select all columns, including the ones we just added to the schema
  const { data, error } = await supabase
    .from('video_tutorial')
    .select('id, judul, deskripsi, video_url, thumbnail_url, materi_url, konten, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching edukasi:', error)
  }

  const items: Edukasi[] = data ?? []

  return (
    <main className="min-h-screen" style={{ fontFamily: '"TeX Gyre Bonum", Georgia, serif', background: '#f4f6f8' }}>
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
              Pusat Edukasi
            </h1>
            <div style={{ width: 70, height: 4, background: '#d0db41', borderRadius: 2, marginTop: 16 }} />
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1140, margin: '-40px auto 40px', padding: '0 24px', position: 'relative', zIndex: 10 }}>
        {items.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
            <p className="text-gray-500 text-lg">Belum ada materi edukasi saat ini.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {items.map((item) => {
              const hasVideo = !!item.video_url
              const hasMateri = !!item.materi_url
              const hasArtikel = !!item.konten
              
              return (
                <Link 
                  href={`/pusat-edukasi/${item.id}`} 
                  key={item.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 border border-gray-100 group flex flex-col"
                >
                  {/* Thumbnail Cover */}
                  <div className="relative w-full aspect-video bg-[#00282b] flex items-center justify-center overflow-hidden">
                    {item.thumbnail_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.thumbnail_url}
                        alt={item.judul}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="opacity-50 text-[#01bcce]">
                        {hasVideo ? <PlayCircle size={64} /> : hasMateri ? <FileText size={64} /> : <BookOpen size={64} />}
                      </div>
                    )}
                    
                    {/* Badge Overlay */}
                    <div className="absolute top-4 right-4 flex gap-2">
                      {hasVideo && <span className="bg-red-500/90 text-white text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm">VIDEO</span>}
                      {hasMateri && <span className="bg-blue-500/90 text-white text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm">MATERI</span>}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="font-bold text-gray-800 text-xl mb-3 line-clamp-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
                      {item.judul}
                    </h3>
                    {item.deskripsi && (
                      <p className="text-gray-600 text-sm line-clamp-3 mb-4 leading-relaxed">
                        {item.deskripsi}
                      </p>
                    )}
                    
                    <div className="mt-auto pt-4 border-t border-gray-100">
                      <span className="text-[#01bcce] font-bold text-sm group-hover:text-[#00282b] transition-colors inline-flex items-center gap-2">
                        Pelajari Selengkapnya &rarr;
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
