'use client'
import Link from 'next/link'
import { Play } from 'lucide-react'

interface Item {
  id: string
  caption?: string
  file_url: string
  file_type: 'foto' | 'video'
  tanggal?: string
}

export default function DokumentasiMarquee({ items }: { items: Item[] }) {
  if (!items || items.length === 0) return null

  // Duplicate items to ensure smooth infinite scrolling even if there are only a few items
  const marqueeItems = [...items, ...items, ...items, ...items, ...items].slice(0, 15)

  return (
    <section id="dokumentasi-kegiatan" className="bg-[#f4f6f8] overflow-hidden border-t border-gray-200" style={{ paddingTop: '96px', paddingBottom: '96px' }}>
      <div className="max-w-[1200px] mx-auto px-6 text-center relative z-10" style={{ marginBottom: '60px' }}>
        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full font-bold uppercase tracking-widest mb-6 shadow-sm"
             style={{ background: 'rgba(1,188,206,0.1)', border: '1px solid rgba(1,188,206,0.2)', color: '#01bcce', fontSize: '11px', fontFamily: '"VAG Rounded Next", "VAGRounded BT", "Nunito", sans-serif' }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#01bcce', boxShadow: '0 0 10px rgba(1,188,206,0.8)' }} />
          Dokumentasi
        </div>
        <h2 className="text-3xl md:text-4xl font-extrabold text-[#00282b]" style={{ fontFamily: '"VAG Rounded Next", "VAGRounded BT", "Nunito", sans-serif', letterSpacing: '-0.5px' }}>
          Galeri Kegiatan
        </h2>
      </div>

      <div className="relative w-full flex overflow-hidden group">
        {/* CSS for marquee sliding right */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes marqueeRight {
            0% { transform: translateX(-50%); }
            100% { transform: translateX(0%); }
          }
          .animate-marquee-right {
            display: flex;
            width: max-content;
            animation: marqueeRight 120s linear infinite;
          }
          .group:hover .animate-marquee-right {
            animation-play-state: paused;
          }
        `}} />

        {/* 
          Since it's sliding right, it goes from -50% to 0%. 
          We double the content to ensure it never runs out of visual space.
        */}
        <div className="animate-marquee-right">
          {/* Create two identical halves so the loop is seamless */}
          <div className="flex gap-6 px-3">
            {marqueeItems.map((item, i) => (
              <MarqueeItem key={`half1-${i}`} item={item} />
            ))}
          </div>
          <div className="flex gap-6 px-3">
            {marqueeItems.map((item, i) => (
              <MarqueeItem key={`half2-${i}`} item={item} />
            ))}
          </div>
        </div>
      </div>

      <div className="text-center relative z-10" style={{ marginTop: '60px' }}>
        <Link href="/dokumentasi" className="inline-flex items-center gap-2 font-bold text-[#01bcce] hover:text-[#00282b] transition-colors" style={{ fontFamily: '"Nunito", sans-serif' }}>
          Lihat Semua Dokumentasi →
        </Link>
      </div>
    </section>
  )
}

function MarqueeItem({ item }: { item: Item }) {
  return (
    <div className="relative w-72 h-48 md:w-80 md:h-56 rounded-3xl overflow-hidden shadow-lg flex-shrink-0 group/card cursor-pointer">
      <Link href="/dokumentasi">
        <div className="absolute inset-0 bg-[#00282b]">
          {item.file_type === 'foto' ? (
            <img src={item.file_url} alt={item.caption || 'Dokumentasi'} className="w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-110" />
          ) : (
            <video src={item.file_url} autoPlay loop muted playsInline className="w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover/card:scale-110" />
          )}
        </div>
        
        {/* Overlay gradient & caption on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#00282b]/95 via-[#00282b]/40 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-6">
          {item.file_type === 'video' && (
             <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
               <Play size={18} color="#fff" fill="#fff" className="ml-1" />
             </div>
          )}
          <p className="text-white font-extrabold line-clamp-2 transform translate-y-4 group-hover/card:translate-y-0 transition-transform duration-500" style={{ fontFamily: '"Nunito", sans-serif' }}>
            {item.caption || 'Dokumentasi Kegiatan'}
          </p>
          {item.tanggal && (
            <span className="text-[#d0db41] text-xs font-bold mt-2 tracking-wider transform translate-y-4 group-hover/card:translate-y-0 transition-transform duration-500 delay-75" style={{ fontFamily: '"Nunito", sans-serif' }}>
              {new Date(item.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          )}
        </div>
      </Link>
    </div>
  )
}
