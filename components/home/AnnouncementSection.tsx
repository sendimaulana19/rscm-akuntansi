'use client'

import Link from 'next/link'

interface Pengumuman {
  id: string
  judul: string
  konten: string
  created_at: string
  jenis: 'teks' | 'gambar' | 'pdf'
  file_url?: string
}

function formatWaktu(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function AnnouncementSection({ items }: { items: Pengumuman[] }) {
  return (
    <section className="relative" style={{ background: '#00282b', paddingTop: '20px', paddingBottom: '100px' }}>
      <div className="w-full max-w-[1200px] mx-auto" style={{ paddingLeft: '5%', paddingRight: '5%' }}>
        
        {/* Header */}
        <div className="flex items-center justify-between" style={{ marginBottom: '40px' }}>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white" style={{ fontFamily: '"VAG Rounded Next", "VAGRounded BT", "Nunito", sans-serif', letterSpacing: '-0.5px' }}>
            Info Terbaru
          </h2>
          <Link href="/pengumuman" className="font-bold text-[#d0db41] hover:underline" style={{ fontFamily: '"Nunito", sans-serif' }}>
            Lihat Semua →
          </Link>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-16 text-white/40 font-medium" style={{ fontFamily: '"Nunito", sans-serif' }}>
            Belum ada pengumuman.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {items.map((item) => (
              <Link
                key={item.id}
                href={`/pengumuman/${item.id}`}
                className="group relative flex flex-col rounded-3xl transition-all duration-500 hover:-translate-y-2 overflow-hidden min-h-[220px] justify-between text-left"
                style={{ 
                  background: '#ffffff', 
                  border: '1px solid rgba(255,255,255,0.06)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                  padding: '32px'
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget
                  el.style.background = '#01bcce'
                  el.style.boxShadow = '0 20px 40px rgba(1,188,206,0.3)'
                  el.style.transform = 'translateY(-8px)'
                  el.style.borderColor = '#01bcce'
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget
                  el.style.background = '#ffffff'
                  el.style.boxShadow = '0 4px 20px rgba(0,0,0,0.2)'
                  el.style.transform = 'translateY(0)'
                  el.style.borderColor = 'rgba(255,255,255,0.06)'
                }}
              >
                {/* Background Decor */}
                <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-0 group-hover:opacity-10 transition-opacity duration-500"
                     style={{ background: '#ffffff' }} />

                <div className="relative z-10 flex flex-col justify-between h-full">
                  <div>
                    <span className="inline-block mb-3 font-bold text-[13px] text-gray-500 group-hover:text-white/90 transition-colors duration-300" style={{ fontFamily: '"Nunito", sans-serif' }}>
                      {formatWaktu(item.created_at)}
                    </span>
                    <h3 className="font-extrabold text-[#00282b] group-hover:text-white text-[19px] leading-snug line-clamp-3 transition-colors duration-300"
                        style={{ fontFamily: '"VAG Rounded Next", "VAGRounded BT", "Nunito", sans-serif' }}>
                      {item.judul}
                    </h3>
                  </div>
                  
                  <div className="mt-8 flex items-center gap-1 group-hover:gap-2 transition-all">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-[#01bcce] group-hover:text-white/90 transition-colors duration-300" style={{ fontFamily: '"Nunito", sans-serif' }}>
                      Baca Selengkapnya
                    </span>
                    <span className="text-[#01bcce] group-hover:text-white transition-colors duration-300">→</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
