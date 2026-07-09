'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronDown, Menu, X } from 'lucide-react'

const navItems = [
  { label: 'Beranda', href: '/' },
  {
    label: 'Sub Tim Kerja',
    href: '#',
    children: [
      { label: 'Akuntansi Keuangan', href: '/akuntansi-keuangan' },
      { label: 'Akuntansi Manajemen', href: '/akuntansi-manajemen' },
      { label: 'Akuntansi Verifikasi', href: '/akuntansi-verifikasi' },
    ],
  },
  { label: 'Agenda', href: '/agenda' },
  {
    label: 'Profil',
    href: '#',
    children: [
      { label: 'Profil RSCM', href: '/profil/rscm' },
      { label: 'Struktur Organisasi', href: '/profil/struktur-organisasi' },
      { label: 'KPI', href: '/profil/kpi' },
      { label: 'Budaya Kerja', href: '/profil/budaya-kerja' },
    ],
  },
  {
    label: 'Informasi Publik',
    href: '#',
    children: [
      { label: 'Video Tutorial', href: '/video-tutorial' },
      { label: 'Kepuasan Pelanggan', href: '/kepuasan-pelanggan' },
      { label: 'Download Dokumen', href: '/download-dokumen' },
      { label: 'Pengumuman', href: '/pengumuman' },
      { label: 'Dokumentasi Kegiatan', href: '/dokumentasi' },
    ],
  },
  { label: 'Our Teams', href: '/our-teams' },
  { label: 'Kontak', href: '/kontak' },
]

export default function Navbar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Font family applied globally to Navbar elements
  const vagFont = { fontFamily: '"VAG Rounded Next", "VAGRounded BT", "Nunito", sans-serif' }

  return (
    <>
      {/* Logo Bar */}
      <div 
        className={`bg-white border-b border-gray-100 sticky top-0 z-50 transition-shadow duration-300 ${scrolled ? 'shadow-md' : ''}`}
        style={vagFont}
      >
        <div className="max-w-[1400px] mx-auto flex items-center justify-between" style={{ height: '80px', paddingLeft: '2%', paddingRight: '2%' }}>
          <Link href="/" className="flex items-center flex-shrink-0" style={{ gap: '16px' }}>
            {/* Logo */}
            <img 
              src="/logo-kemenkes.png" 
              alt="Logo RSCM / Kemenkes" 
              className="h-12 w-auto object-contain"
            />
            <div>
              <div className="font-bold tracking-wide leading-tight whitespace-nowrap" style={{ color: '#00282b', fontSize: '16px' }}>
                Tim Kerja Akuntansi
              </div>
              <div className="text-gray-500 font-semibold tracking-wide leading-tight whitespace-nowrap" style={{ fontSize: '12px', marginTop: '2px' }}>
                RSUPN Dr. Cipto Mangunkusumo
              </div>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center" style={{ gap: '12px' }}>
            {navItems.map((item) => (
              <div key={item.label} className="relative group">
                {item.children ? (
                  <>
                    <button
                      className={`flex items-center font-bold tracking-wide whitespace-nowrap transition-all duration-200 border-b-[3px] ${
                        item.children.some(c => pathname === c.href)
                          ? 'text-[#00282b] border-[#01bcce]'
                          : 'text-gray-500 border-transparent hover:text-[#00282b] hover:border-[#d0db41]'
                      }`}
                      style={{ padding: '28px 6px', fontSize: '13.5px', gap: '4px' }}
                    >
                      {item.label}
                      <ChevronDown size={14} className="group-hover:rotate-180 transition-transform duration-200" />
                    </button>
                    {/* Dropdown */}
                    <div className="absolute top-full left-0 bg-white rounded-b-2xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] border-t-[3px] border-[#01bcce] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50" style={{ minWidth: '240px' }}>
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={`block font-semibold transition-all duration-200 border-b border-gray-50 last:border-0 last:rounded-b-2xl ${
                            pathname === child.href
                              ? 'bg-[#eef9fa] text-[#00282b]'
                              : 'text-gray-500 hover:bg-gray-50 hover:text-[#00282b]'
                          }`}
                          style={{ padding: '14px 24px', fontSize: '13.5px' }}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  </>
                ) : (
                  <Link
                    href={item.href}
                    className={`flex items-center font-bold tracking-wide whitespace-nowrap transition-all duration-200 border-b-[3px] ${
                      pathname === item.href
                        ? 'text-[#00282b] border-[#01bcce]'
                        : 'text-gray-500 border-transparent hover:text-[#00282b] hover:border-[#d0db41]'
                    }`}
                    style={{ padding: '28px 6px', fontSize: '13.5px' }}
                  >
                    {item.label}
                  </Link>
                )}
              </div>
            ))}
          </nav>

          {/* Mobile hamburger */}
          <button
            className="lg:hidden p-2 text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="lg:hidden bg-white border-t border-gray-100 shadow-xl pb-4">
            {navItems.map((item) => (
              <div key={item.label}>
                {item.children ? (
                  <>
                    <button
                      onClick={() => setOpenDropdown(openDropdown === item.label ? null : item.label)}
                      className="w-full flex items-center justify-between font-bold text-gray-700 border-b border-gray-50 hover:bg-gray-50"
                      style={{ padding: '16px 24px', fontSize: '15px' }}
                    >
                      {item.label}
                      <ChevronDown size={18} className={`transition-transform duration-200 ${openDropdown === item.label ? 'rotate-180' : ''}`} />
                    </button>
                    {openDropdown === item.label && (
                      <div className="bg-[#f8fafa]">
                        {item.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={() => setMobileOpen(false)}
                            className="block font-semibold text-gray-600 border-b border-white hover:text-[#01bcce] hover:bg-white transition-colors"
                            style={{ padding: '14px 40px', fontSize: '14px' }}
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="block font-bold text-gray-700 border-b border-gray-50 hover:bg-gray-50 hover:text-[#01bcce] transition-colors"
                    style={{ padding: '16px 24px', fontSize: '15px' }}
                  >
                    {item.label}
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
