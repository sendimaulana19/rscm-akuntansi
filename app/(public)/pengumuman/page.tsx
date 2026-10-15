import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const metadata = {
  title: 'Pengumuman | RSCM Akuntansi',
  description: 'Daftar pengumuman resmi Tim Akuntansi RSCM',
}

interface Pengumuman {
  id: string
  judul: string
  konten: string
  created_at: string
  jenis: 'teks' | 'gambar' | 'pdf'
  file_url?: string
}

export default async function PengumumanPage() {
  const supabase = await createClient()

  // Fix: Select only existing columns to prevent the "Error fetching pengumuman: {}" issue
  const { data, error } = await supabase
    .from('pengumuman')
    .select('id, judul, konten, jenis, created_at, file_url')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching pengumuman:', error)
  }

  const items: Pengumuman[] = data ?? []

  return (
    <main style={{ minHeight: '100vh', fontFamily: '"TeX Gyre Bonum", Georgia, serif', background: '#f4f6f8' }}>
      
      {/* ═══════ HERO ═══════ */}
      <div style={{
        position: 'relative', height: 320,
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
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(208,219,65,.15)', border: '1px solid rgba(208,219,65,.3)', borderRadius: 20, padding: '5px 14px', marginBottom: 14 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#d0db41', display: 'inline-block' }} />
              <span style={{ fontFamily: 'Nunito, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#d0db41' }}>Informasi Terbaru</span>
            </div>
            <h1 style={{ fontSize: 48, fontWeight: 900, color: '#fff', lineHeight: 1.1, margin: 0, fontFamily: 'Nunito, sans-serif' }}>Pengumuman</h1>
            <p style={{ fontFamily: 'Nunito, sans-serif', color: '#7dd3da', fontSize: 16, marginTop: 12 }}>Informasi, berita, dan pengumuman terbaru dari Tim Kerja Akuntansi RSCM</p>
            <div style={{ width: 70, height: 4, background: '#d0db41', borderRadius: 2, marginTop: 16 }} />
          </div>
        </div>
      </div>

      {/* Grid Container */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 32px 80px' }}>
        {items.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📢</div>
            <p className="text-gray-500 text-xl font-medium" style={{ fontFamily: 'Nunito, sans-serif' }}>Belum ada pengumuman saat ini.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col border border-gray-100 group"
                style={{ fontFamily: 'Nunito, sans-serif' }}
              >
                {/* Image Banner */}
                {item.jenis === 'gambar' && item.file_url ? (
                  <div className="w-full h-48 relative bg-gray-100 overflow-hidden shrink-0">
                    <img 
                      src={item.file_url} 
                      alt={item.judul}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                ) : (
                  <div className="w-full h-48 bg-white shrink-0" />
                )}

                <div className="flex flex-col flex-grow" style={{ paddingLeft: '32px', paddingRight: '32px', paddingBottom: '32px' }}>
                  <div className="mb-4">
                    <div className="text-xs text-gray-400 font-medium mb-1">
                      {new Date(item.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </div>
                    
                    <div className="text-xs font-bold text-[#01bcce] mb-3 uppercase tracking-wider">
                      {item.jenis === 'teks' ? 'Umum' : item.jenis === 'gambar' ? 'Informasi Terbaru' : 'Surat Edaran'}
                    </div>

                    <h2
                      className="text-[20px] font-extrabold leading-tight text-gray-900 group-hover:text-[#01bcce] transition-colors"
                      style={{ fontFamily: '"VAG Rounded Next", "VAGRounded BT", "Nunito", sans-serif' }}
                    >
                      {item.judul}
                    </h2>
                    
                    <p className="text-gray-400 mt-3 text-sm">
                      -
                    </p>
                  </div>

                  <div className="mt-auto pt-6">
                    <Link
                      href={`/pengumuman/${item.id}`}
                      className="block w-max mx-auto bg-[#01bcce] hover:bg-[#01a9b4] text-white font-bold py-2.5 px-6 rounded-lg transition-colors text-sm shadow-md"
                    >
                      Baca Selengkapnya
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
