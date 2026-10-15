'use client'

import Link from 'next/link'
import { Mail, MapPin, ArrowRight, ExternalLink } from 'lucide-react'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer
      className="relative text-white overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #001f22 0%, #001416 100%)',
        fontFamily: '"TeX Gyre Bonum", Georgia, serif',
      }}
    >
      {/* Top Accent Line */}
      <div
        className="w-full h-1"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, #01bcce 35%, #d0db41 65%, transparent 100%)',
          opacity: 0.8,
        }}
      />

      {/* Watermark Ornamen Mandala (Kanan Atas) */}
      <img
        src="/ornament-mandala.png"
        alt=""
        className="absolute -top-16 -right-16 w-72 h-72 object-contain pointer-events-none select-none z-0"
        style={{ opacity: 0.07 }}
      />

      {/* Watermark Ornamen Sisi Kiri */}
      <img
        src="/ornament-side.png"
        alt=""
        className="absolute -left-10 bottom-0 h-full w-48 object-cover object-left pointer-events-none select-none z-0 opacity-[0.05]"
        style={{ filter: 'brightness(0) invert(1)' }}
      />

      {/* Main Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">
          
          {/* Col 1: Brand & Logo (span 4) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Logo Badge (Sama dengan Header Page) */}
            <div className="inline-flex items-center bg-white px-4 py-2.5 rounded-2xl shadow-lg border border-white/20 transition-transform duration-300 hover:scale-105">
              <img
                src="/logo-kemenkes.png"
                alt="Logo RSCM / Kemenkes"
                className="h-11 w-auto object-contain"
              />
            </div>

            <div>
              <h3
                className="text-lg font-black text-white leading-tight tracking-wide"
                style={{ fontFamily: 'Nunito, sans-serif' }}
              >
                Tim Kerja Akuntansi
              </h3>
              <p
                className="text-xs font-bold leading-tight mt-1"
                style={{ color: '#01bcce', fontFamily: 'Nunito, sans-serif' }}
              >
                RSUPN Dr. Cipto Mangunkusumo
              </p>
            </div>
          </div>

          {/* Col 2: Menu Utama (span 2) */}
          <div className="lg:col-span-2">
            <h4
              className="text-xs font-black uppercase tracking-wider text-white mb-5 pb-2.5 border-b border-[#01bcce]/40 inline-flex items-center gap-2"
              style={{ fontFamily: 'Nunito, sans-serif' }}
            >
              <span className="w-2 h-2 rounded-full bg-[#01bcce]" />
              Menu Utama
            </h4>
            <ul className="space-y-2.5 text-xs font-semibold" style={{ fontFamily: 'Nunito, sans-serif' }}>
              {[
                { label: 'Beranda', href: '/' },
                { label: 'Profil RSCM', href: '/profil/rscm' },
                { label: 'Budaya Kerja', href: '/profil/budaya-kerja' },
                { label: 'Our Teams', href: '/our-teams' },
                { label: 'Agenda Kegiatan', href: '/agenda' },
                { label: 'Kontak Kami', href: '/kontak' },
              ].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-gray-400 hover:text-[#d0db41] transition-all duration-200 inline-flex items-center gap-1.5 hover:translate-x-1"
                  >
                    <span className="text-[#01bcce] opacity-40 text-[10px]">›</span>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Layanan & Informasi (span 3) */}
          <div className="lg:col-span-3">
            <h4
              className="text-xs font-black uppercase tracking-wider text-white mb-5 pb-2.5 border-b border-[#01bcce]/40 inline-flex items-center gap-2"
              style={{ fontFamily: 'Nunito, sans-serif' }}
            >
              <span className="w-2 h-2 rounded-full bg-[#d0db41]" />
              Layanan Akuntansi
            </h4>
            <ul className="space-y-2.5 text-xs font-semibold" style={{ fontFamily: 'Nunito, sans-serif' }}>
              {[
                { label: 'Akuntansi Keuangan', href: '/akuntansi-keuangan' },
                { label: 'Akuntansi Manajemen', href: '/akuntansi-manajemen' },
                { label: 'Akuntansi Verifikasi', href: '/akuntansi-verifikasi' },
                { label: 'Pusat Edukasi', href: '/pusat-edukasi' },
                { label: 'Regulasi & Kebijakan', href: '/regulasi-kebijakan' },
                { label: 'Layanan & Formulir', href: '/layanan-formulir' },
                { label: 'FAQ (Tanya Jawab)', href: '/faq' },
                { label: 'Pengumuman', href: '/pengumuman' },
                { label: 'Dokumentasi Kegiatan', href: '/dokumentasi' },
              ].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-gray-400 hover:text-[#01bcce] transition-all duration-200 inline-flex items-center gap-1.5 hover:translate-x-1"
                  >
                    <span className="text-[#d0db41] opacity-40 text-[10px]">›</span>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Kontak & Lokasi (span 3) */}
          <div className="lg:col-span-3 space-y-5">
            <h4
              className="text-xs font-black uppercase tracking-wider text-white mb-5 pb-2.5 border-b border-[#01bcce]/40 inline-flex items-center gap-2"
              style={{ fontFamily: 'Nunito, sans-serif' }}
            >
              <span className="w-2 h-2 rounded-full bg-[#01bcce]" />
              Hubungi Kami
            </h4>

            <div className="space-y-3.5 text-xs" style={{ fontFamily: 'Nunito, sans-serif' }}>
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-[#01bcce]/10 border border-[#01bcce]/20 flex items-center justify-center flex-shrink-0 mt-0.5 text-[#01bcce]">
                  <MapPin size={14} />
                </div>
                <p className="text-gray-300/90 leading-relaxed">
                  Jl. Kimia No.11, RT.5/RW.1, Pegangsaan, Kec. Menteng, Kota Jakarta Pusat, DKI Jakarta 10330
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-[#01bcce]/10 border border-[#01bcce]/20 flex items-center justify-center flex-shrink-0 text-[#01bcce]">
                  <Mail size={14} />
                </div>
                <a
                  href="mailto:timkerjaakuntansi@rscm.co.id"
                  className="text-gray-300 hover:text-[#d0db41] transition-colors break-all font-medium"
                >
                  timkerjaakuntansi@rscm.co.id
                </a>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/kontak"
                className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white shadow-md transition-all hover:opacity-90 active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, #015a61 0%, #01bcce 100%)',
                  fontFamily: 'Nunito, sans-serif',
                }}
              >
                <span>Kirim Pesan / Pertanyaan</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div
        className="relative z-10 border-t border-white/10 py-5"
        style={{
          background: 'rgba(0, 20, 22, 0.65)',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <p
            className="text-[11px] text-gray-400"
            style={{ fontFamily: 'Nunito, sans-serif' }}
          >
            © {currentYear} <strong>Tim Kerja Akuntansi RSUPN Dr. Cipto Mangunkusumo</strong>. Hak Cipta Dilindungi.
          </p>

          <div
            className="flex items-center gap-5 text-[11px] font-semibold text-gray-400"
            style={{ fontFamily: 'Nunito, sans-serif' }}
          >
            <a
              href="https://rscm.co.id"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#01bcce] transition-colors inline-flex items-center gap-1"
            >
              <span>Portal Resmi RSCM</span>
              <ExternalLink size={11} className="opacity-60" />
            </a>
            <span className="text-gray-600">•</span>
            <Link href="/admin/login" className="hover:text-[#d0db41] transition-colors">
              Panel Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
