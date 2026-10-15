'use client'
import Link from 'next/link'
import { CalendarDays, TrendingUp, BarChart3, CheckSquare, GraduationCap, Scale, Image as ImageIcon, Megaphone, HelpCircle } from 'lucide-react'

const menuItems = [
  {
    id: 'agenda',
    icon: CalendarDays,
    label: 'Agenda',
    desc: 'Jadwal & kegiatan tim',
    href: '/agenda',
    color: '#00282b',
    glow: 'rgba(0,40,43,0.3)',
    hoverText: '#ffffff'
  },
  {
    id: 'ak-keuangan',
    icon: TrendingUp,
    label: 'Akuntansi Keuangan',
    desc: 'Laporan & kinerja keuangan',
    href: '/akuntansi-keuangan',
    color: '#01bcce',
    glow: 'rgba(1,188,206,0.3)',
    hoverText: '#ffffff'
  },
  {
    id: 'ak-manajemen',
    icon: BarChart3,
    label: 'Akuntansi Manajemen',
    desc: 'Laporan KSO & analisis',
    href: '/akuntansi-manajemen',
    color: '#00282b',
    glow: 'rgba(0,40,43,0.3)',
    hoverText: '#ffffff'
  },
  {
    id: 'ak-verifikasi',
    icon: CheckSquare,
    label: 'Akuntansi Verifikasi',
    desc: 'Dashboard verifikasi data',
    href: '/akuntansi-verifikasi',
    color: '#d0db41',
    glow: 'rgba(208,219,65,0.3)',
    hoverText: '#00282b'
  },
  {
    id: 'pusat-edukasi',
    icon: GraduationCap,
    label: 'Pusat Edukasi',
    desc: 'Panduan, materi & video',
    href: '/pusat-edukasi',
    color: '#01bcce',
    glow: 'rgba(1,188,206,0.3)',
    hoverText: '#ffffff'
  },
  {
    id: 'regulasi-kebijakan',
    icon: Scale,
    label: 'Regulasi dan Kebijakan',
    desc: 'Peraturan, pedoman & SK',
    href: '/regulasi-kebijakan',
    color: '#d0db41',
    glow: 'rgba(208,219,65,0.3)',
    hoverText: '#00282b'
  },
  {
    id: 'dokumentasi',
    icon: ImageIcon,
    label: 'Dokumentasi Kegiatan',
    desc: 'Foto & video kegiatan tim',
    href: '/dokumentasi',
    color: '#01bcce',
    glow: 'rgba(1,188,206,0.3)',
    hoverText: '#ffffff'
  },
  {
    id: 'pengumuman',
    icon: Megaphone,
    label: 'Pengumuman',
    desc: 'Informasi & pengumuman terbaru',
    href: '/pengumuman',
    color: '#00282b',
    glow: 'rgba(0,40,43,0.3)',
    hoverText: '#ffffff'
  },
  {
    id: 'faq',
    icon: HelpCircle,
    label: 'FAQ',
    desc: 'Pertanyaan sering diajukan',
    href: '/faq',
    color: '#d0db41',
    glow: 'rgba(208,219,65,0.3)',
    hoverText: '#00282b'
  },
]

export default function MenuGrid() {
  return (
    <section id="menu-utama" className="px-6 relative" style={{ background: '#00282b', paddingTop: '96px', paddingBottom: '96px' }}>
      <div className="max-w-[1200px] mx-auto relative z-10" style={{ paddingLeft: '5%', paddingRight: '5%' }}>
        {/* Header */}
        <div className="text-center" style={{ marginBottom: '80px' }}>
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full font-bold uppercase tracking-widest mb-6 shadow-lg"
               style={{ background: 'rgba(208,219,65,0.15)', border: '1px solid rgba(208,219,65,0.3)', color: '#d0db41', fontSize: '11px', fontFamily: '"VAG Rounded Next", "VAGRounded BT", "Nunito", sans-serif' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#d0db41', boxShadow: '0 0 10px rgba(208,219,65,0.8)' }} />
            Menu Utama
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white" style={{ fontFamily: '"VAG Rounded Next", "VAGRounded BT", "Nunito", sans-serif', letterSpacing: '-0.5px' }}>
            Layanan Tim Kerja Akuntansi
          </h2>
        </div>

        {/* Unified 3x3 Grid matching AnnouncementSection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {menuItems.map((item) => (
            <MenuCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  )
}

function MenuCard({ item }: { item: typeof menuItems[0] }) {
  const Icon = item.icon
  
  return (
    <Link
      href={item.href}
      id={`menu-${item.id}`}
      className="group relative flex flex-col justify-between items-center text-center rounded-3xl transition-all duration-500 hover:-translate-y-2 overflow-hidden min-h-[220px]"
      style={{ 
        background: '#ffffff', 
        border: '1px solid rgba(0,40,43,0.06)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
        padding: '32px',
        // Define a CSS variable for the hover text color to be used via arbitrary variants if needed
        '--hover-text': item.hoverText
      } as React.CSSProperties}
      onMouseEnter={(e) => {
        const el = e.currentTarget
        el.style.background = item.color
        el.style.boxShadow = `0 20px 40px ${item.glow}`
        el.style.borderColor = item.color
        el.style.transform = 'translateY(-8px)'
        
        // Find children and change colors
        const title = el.querySelector('.card-title') as HTMLElement
        if(title) title.style.color = item.hoverText
        
        const desc = el.querySelector('.card-desc') as HTMLElement
        if(desc) desc.style.color = item.hoverText === '#00282b' ? 'rgba(0,40,43,0.8)' : 'rgba(255,255,255,0.9)'
        
        const iconContainer = el.querySelector('.card-icon') as HTMLElement
        if(iconContainer) iconContainer.style.color = item.hoverText
        
        const arrowText = el.querySelector('.card-arrow-text') as HTMLElement
        if(arrowText) arrowText.style.color = item.hoverText === '#00282b' ? '#00282b' : 'rgba(255,255,255,0.9)'
        
        const arrowIcon = el.querySelector('.card-arrow-icon') as HTMLElement
        if(arrowIcon) arrowIcon.style.color = item.hoverText
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget
        el.style.background = '#ffffff'
        el.style.boxShadow = '0 4px 20px rgba(0,0,0,0.02)'
        el.style.borderColor = 'rgba(0,40,43,0.06)'
        el.style.transform = 'translateY(0)'
        
        // Revert colors
        const title = el.querySelector('.card-title') as HTMLElement
        if(title) title.style.color = '#00282b'
        
        const desc = el.querySelector('.card-desc') as HTMLElement
        if(desc) desc.style.color = '#6b7280' // text-gray-500
        
        const iconContainer = el.querySelector('.card-icon') as HTMLElement
        if(iconContainer) iconContainer.style.color = '#00282b'
        
        const arrowText = el.querySelector('.card-arrow-text') as HTMLElement
        if(arrowText) arrowText.style.color = '#01bcce'
        
        const arrowIcon = el.querySelector('.card-arrow-icon') as HTMLElement
        if(arrowIcon) arrowIcon.style.color = '#01bcce'
      }}
    >
      {/* Background Decor */}
      <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-0 group-hover:opacity-10 transition-opacity duration-500"
           style={{ background: '#ffffff', pointerEvents: 'none' }} />

      <div className="relative z-10 flex flex-col justify-between items-center h-full w-full">
        <div className="flex flex-col items-center w-full">
          {/* Icon Circle */}
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-sm transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3"
               style={{ background: 'rgba(0,40,43,0.03)', border: '1px solid rgba(0,40,43,0.05)' }}>
            <Icon className="w-6 h-6 card-icon transition-colors duration-300" style={{ color: '#00282b' }} />
          </div>

          {/* Label */}
          <h3 className="card-title font-extrabold text-[19px] leading-snug mb-2 transition-colors duration-300"
              style={{ fontFamily: '"VAG Rounded Next", "VAGRounded BT", "Nunito", sans-serif', color: '#00282b' }}>
            {item.label}
          </h3>

          {/* Desc */}
          <p className="card-desc text-[13px] leading-relaxed transition-colors duration-300"
             style={{ fontFamily: '"Nunito", sans-serif', color: '#6b7280' }}>
            {item.desc}
          </p>
        </div>

        {/* Arrow Indicator */}
        <div className="mt-8 flex items-center justify-center gap-1 group-hover:gap-2 transition-all w-full">
          <span className="card-arrow-text text-[11px] font-bold uppercase tracking-widest transition-colors duration-300" style={{ fontFamily: '"Nunito", sans-serif', color: '#01bcce' }}>
            Akses Layanan
          </span>
          <span className="card-arrow-icon transition-colors duration-300" style={{ color: '#01bcce' }}>
            →
          </span>
        </div>
      </div>
    </Link>
  )
}
