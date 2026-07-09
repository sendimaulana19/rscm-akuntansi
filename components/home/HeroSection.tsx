'use client'
import Link from 'next/link'
import { useEffect, useRef } from 'react'

export default function HeroSection() {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // Autoplay blocked — video will show poster
      })
    }
  }, [])

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden"
             style={{ background: '#00282b' }}>
      {/* Background Video */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover opacity-50"
        autoPlay muted loop playsInline
        poster="/hero-poster.jpg"
        id="hero-video"
      >
        <source src="/hero-bg.mp4" type="video/mp4" />
      </video>

      {/* Overlay */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(135deg, rgba(0,40,43,0.95) 0%, rgba(0,40,43,0.7) 40%, rgba(1,188,206,0.3) 100%)'
      }} />

      {/* Content */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-6 lg:px-12 animate-fade-in-up mt-10 text-left">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border mb-6 uppercase tracking-widest shadow-lg"
             style={{
               background: 'rgba(208,219,65,0.15)',
               borderColor: 'rgba(208,219,65,0.4)',
               color: '#d0db41',
               fontSize: '11px',
               fontFamily: '"VAG Rounded Next", "VAGRounded BT", "Nunito", sans-serif',
               fontWeight: 800
             }}>
          <span className="w-2 h-2 rounded-full animate-pulse-dot" style={{ background: '#d0db41', boxShadow: '0 0 10px rgba(208,219,65,0.8)' }} />
          Portal Internal Tim Kerja
        </div>

        {/* Title */}
        <h1 className="text-white mb-0"
            style={{
              fontFamily: '"VAG Rounded Next", "VAGRounded BT", "Nunito", sans-serif',
              fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
              fontWeight: 800,
              lineHeight: 1,
              letterSpacing: '-1px',
              textShadow: '0 4px 20px rgba(0,0,0,0.3)'
            }}>
          Tim Kerja Akuntansi
        </h1>
        <h2 className="mt-2 mb-6"
            style={{
              fontFamily: '"Nunito", sans-serif',
              fontSize: 'clamp(1.2rem, 2.5vw, 2.2rem)',
              fontWeight: 300,
              color: '#d0db41',
              lineHeight: 1.3,
              letterSpacing: '0.5px',
              textShadow: '0 2px 10px rgba(0,0,0,0.2)'
            }}>
          RSUPN Dr Cipto Mangunkusumo
        </h2>

        <p className="text-gray-200 text-[16px] md:text-[18px] mb-10 max-w-xl leading-relaxed"
           style={{ fontFamily: '"Nunito", sans-serif' }}>
          Portal terintegrasi untuk pengelolaan data akuntansi, laporan kinerja keuangan bulanan, dan pusat informasi strategis tim kerja.
        </p>

        {/* CTA Button */}
        <Link
          href="#menu-utama"
          className="group inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full font-bold transition-all duration-500 hover:-translate-y-2 overflow-hidden relative"
          style={{
            background: 'linear-gradient(135deg, #d0db41, #e3ec76)',
            color: '#00282b',
            boxShadow: '0 10px 30px rgba(208,219,65,0.3)',
            fontFamily: '"VAG Rounded Next", "VAGRounded BT", "Nunito", sans-serif',
            fontSize: '15px'
          }}
          onClick={(e) => {
            e.preventDefault()
            document.getElementById('menu-utama')?.scrollIntoView({ behavior: 'smooth' })
          }}
        >
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
          <span className="relative z-10">Jelajahi Layanan</span>
          <span className="relative z-10 group-hover:translate-y-1 transition-transform duration-300">↓</span>
        </Link>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/50 opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
           onClick={() => document.getElementById('menu-utama')?.scrollIntoView({ behavior: 'smooth' })}>
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-1.5 pb-1">
          <div className="w-1.5 h-2.5 bg-white/70 rounded-full animate-bounce" />
        </div>
      </div>
    </section>
  )
}
