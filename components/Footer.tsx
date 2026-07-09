import Link from 'next/link'
import { Mail, MapPin, Phone } from 'lucide-react'

export default function Footer() {
  return (
    <footer style={{ background: '#060e0f' }} className="text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-lg"
                   style={{ background: 'linear-gradient(135deg, #00282b, #01bcce)' }}>
                ⚕
              </div>
              <div>
                <div className="font-nav font-bold text-sm text-white leading-tight">
                  Tim Kerja Akuntansi
                </div>
                <div className="font-nav text-xs leading-tight" style={{ color: '#01bcce' }}>
                  RSUPN Dr. Cipto Mangunkusumo
                </div>
              </div>
            </div>
            <p className="font-nav text-xs text-gray-400 leading-relaxed italic mb-4">
              Akuntabel, Transparan, dan Profesional demi Pelayanan Kesehatan Terbaik
            </p>
            <div className="flex gap-2">
              {['📘','🐦','📷'].map((icon, i) => (
                <a key={i} href="#"
                   className="w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all duration-200 border border-white/10 hover:border-brand-cyan hover:bg-brand-cyan/20">
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-nav font-bold text-xs uppercase tracking-widest text-white mb-5 pb-2 border-b-2 border-brand-cyan inline-block">
              Menu Utama
            </h4>
            <ul className="space-y-2">
              {[
                { label: 'Beranda', href: '/' },
                { label: 'Agenda', href: '/agenda' },
                { label: 'Our Teams', href: '/our-teams' },
                { label: 'Kontak', href: '/kontak' },
                { label: 'Download Dokumen', href: '/download-dokumen' },
                { label: 'Pengumuman', href: '/pengumuman' },
              ].map(item => (
                <li key={item.href}>
                  <Link href={item.href}
                        className="font-nav text-sm text-gray-400 hover:text-brand-lime transition-all duration-150 hover:pl-1">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Sub Tim */}
          <div>
            <h4 className="font-nav font-bold text-xs uppercase tracking-widest text-white mb-5 pb-2 border-b-2 border-brand-cyan inline-block">
              Sub Tim Kerja
            </h4>
            <ul className="space-y-2">
              {[
                { label: 'Akuntansi Keuangan', href: '/akuntansi-keuangan' },
                { label: 'Akuntansi Manajemen', href: '/akuntansi-manajemen' },
                { label: 'Akuntansi Verifikasi', href: '/akuntansi-verifikasi' },
                { label: 'Video Tutorial', href: '/video-tutorial' },
                { label: 'Kepuasan Pelanggan', href: '/kepuasan-pelanggan' },
                { label: 'Dokumentasi Kegiatan', href: '/dokumentasi' },
              ].map(item => (
                <li key={item.href}>
                  <Link href={item.href}
                        className="font-nav text-sm text-gray-400 hover:text-brand-lime transition-all duration-150 hover:pl-1">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-nav font-bold text-xs uppercase tracking-widest text-white mb-5 pb-2 border-b-2 border-brand-cyan inline-block">
              Kontak
            </h4>
            <div className="space-y-3">
              <div className="flex gap-3">
                <MapPin size={16} className="text-brand-cyan mt-0.5 flex-shrink-0" />
                <p className="font-nav text-sm text-gray-400 leading-relaxed">
                  Jl. Kimia No.11, RT.5/RW.1, Pegangsaan, Kec. Menteng, Kota Jakarta Pusat, DKI Jakarta 10330
                </p>
              </div>
              <div className="flex gap-3 items-center">
                <Mail size={16} className="text-brand-cyan flex-shrink-0" />
                <a href="mailto:timkerjaakuntansi@rscm.co.id"
                   className="font-nav text-sm text-gray-400 hover:text-brand-lime transition-colors duration-150">
                  timkerjaakuntansi@rscm.co.id
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/5 py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-nav text-xs text-gray-500">
            © {new Date().getFullYear()} Tim Kerja Akuntansi RSUPN Dr. Cipto Mangunkusumo. Hak Cipta Dilindungi.
          </p>
          <div className="flex gap-4">
            {['Kebijakan Privasi', 'Ketentuan'].map(l => (
              <a key={l} href="#" className="font-nav text-xs text-gray-500 hover:text-brand-lime transition-colors">
                {l}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
