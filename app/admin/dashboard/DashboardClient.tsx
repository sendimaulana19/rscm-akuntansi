'use client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, Megaphone, Camera, Download, Users, TrendingUp,
  FileText, CheckSquare, Video, Star, Building, LogOut, Settings, ChevronRight, Sparkles, Target
} from 'lucide-react'

const adminModules = [
  { icon: <TrendingUp size={20} />, label: 'Data Laporan', desc: 'Input Neraca, Operasional, Arus Kas & 12 Indikator', href: '/admin/data-laporan', color: '#01bcce' },
  { icon: <FileText size={20} />, label: 'Laporan Keuangan', desc: 'Upload laporan & CALK', href: '/admin/laporan-keuangan', color: '#00282b' },
  { icon: <CheckSquare size={20} />, label: 'Akuntansi Manajemen', desc: 'Kelola laporan KSO', href: '/admin/akuntansi-manajemen', color: '#d0db41', textColor: '#00282b' },
  { icon: <CheckSquare size={20} />, label: 'Akuntansi Verifikasi', desc: 'Kelola dokumen tagihan', href: '/admin/akuntansi-verifikasi', color: '#01bcce' },
  { icon: <Target size={20} />, label: 'KPI & Sasaran Mutu', desc: 'Kelola KPI, ISO Like & RSCM Award', href: '/admin/kpi', color: '#015a61' },
  { icon: <Sparkles size={20} />, label: 'Budaya Kerja', desc: 'Kelola artikel & nilai budaya kerja', href: '/admin/budaya-kerja', color: '#01bcce' },
  { icon: <Video size={20} />, label: 'Video Tutorial', desc: 'Upload video & judul', href: '/admin/video-tutorial', color: '#01bcce' },
  { icon: <Download size={20} />, label: 'Download Dokumen', desc: 'Kelola dokumen unduhan', href: '/admin/download-dokumen', color: '#d0db41', textColor: '#00282b' },
  { icon: <Camera size={20} />, label: 'Dokumentasi Kegiatan', desc: 'Upload foto & video', href: '/admin/dokumentasi', color: '#01bcce' },
  { icon: <Megaphone size={20} />, label: 'Pengumuman', desc: 'Buat & kelola pengumuman', href: '/admin/pengumuman', color: '#00282b' },
  { icon: <Building size={20} />, label: 'Profil & Konten', desc: 'Edit halaman profil Tim Kerja Akuntansi', href: '/admin/profil', color: '#d0db41', textColor: '#00282b' },
  { icon: <Users size={20} />, label: 'Our Teams', desc: 'Kelola anggota tim', href: '/admin/our-teams', color: '#01bcce' },
  { icon: <Settings size={20} />, label: 'Manajemen User', desc: 'Kelola akun admin', href: '/admin/users', color: '#00282b' },
]

interface Props {
  user: any
  stats: { pengumuman: number; dokumentasi: number; dokumen: number; teams: number }
}

export default function AdminDashboardClient({ user, stats }: Props) {
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/admin/login')
    router.refresh()
  }

  return (
    <div className="min-h-screen" style={{ background: '#f0f4f5' }}>
      {/* Top bar */}
      <div className="sticky top-0 z-50 border-b border-white/20 shadow-sm"
           style={{ background: '#00282b' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm"
                 style={{ background: 'rgba(1,188,206,0.3)' }}>
              ⚕
            </div>
            <div>
              <span className="font-nav font-bold text-sm text-white">Panel Admin</span>
              <span className="font-nav text-xs ml-2" style={{ color: '#01bcce' }}>Tim Kerja Akuntansi RSCM</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="font-nav text-xs text-white/80">{user?.email}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-nav text-xs font-bold text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200"
            >
              <LogOut size={14} />
              Keluar
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1" style={{ color: '#00282b', fontFamily: '"TeX Gyre Bonum", Georgia, serif' }}>
            Selamat Datang! 👋
          </h1>
          <p className="font-nav text-sm text-gray-500">
            Kelola konten website Tim Kerja Akuntansi RSCM dari sini.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Pengumuman', value: stats.pengumuman, icon: '📢', color: '#01bcce' },
            { label: 'Dokumentasi', value: stats.dokumentasi, icon: '📸', color: '#00282b' },
            { label: 'Dokumen', value: stats.dokumen, icon: '📄', color: '#d0db41' },
            { label: 'Anggota Tim', value: stats.teams, icon: '👥', color: '#01bcce' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{s.icon}</span>
                <span className="font-nav font-black text-3xl" style={{ color: s.color }}>{s.value}</span>
              </div>
              <p className="font-nav text-xs font-semibold text-gray-500 uppercase tracking-wide">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Quick link to public site */}
        <div className="mb-8 p-4 rounded-2xl border border-brand-cyan/20 flex items-center justify-between"
             style={{ background: 'rgba(1,188,206,0.05)' }}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">🌐</span>
            <div>
              <p className="font-nav font-bold text-sm text-gray-700">Lihat Website Publik</p>
              <p className="font-nav text-xs text-gray-400">Cek tampilan website sebagai pengunjung</p>
            </div>
          </div>
          <Link href="/" target="_blank"
                className="font-nav text-xs font-bold px-4 py-2 rounded-full text-white transition-all duration-200"
                style={{ background: '#01bcce' }}>
            Buka →
          </Link>
        </div>

        {/* Modules Grid */}
        <h2 className="font-nav font-bold text-sm text-gray-500 uppercase tracking-widest mb-4">
          Modul Manajemen
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {adminModules.map((mod) => (
            <Link key={mod.href} href={mod.href}
                  className="group bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white flex-shrink-0 transition-transform duration-200 group-hover:scale-110"
                   style={{ background: mod.color, color: mod.textColor || 'white' }}>
                {mod.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-nav font-bold text-sm text-gray-800">{mod.label}</h3>
                <p className="font-nav text-xs text-gray-400 mt-0.5">{mod.desc}</p>
              </div>
              <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
