'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AdminDashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        window.location.href = '/admin/login'
        return
      }

      setUser(session.user)
      setLoading(false)
    }
    checkAuth()
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/admin/login'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
           style={{ background: '#00282b' }}>
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#f8fafc' }}>
      {/* Header */}
      <div className="px-8 py-4 flex items-center justify-between shadow-sm"
           style={{ background: '#00282b' }}>
        <div className="flex items-center gap-3">
          <span className="text-white text-2xl">⚕</span>
          <div>
            <h1 className="font-nav font-bold text-white text-sm">Tim Kerja Akuntansi</h1>
            <p className="font-nav text-xs" style={{ color: '#01bcce' }}>Panel Admin</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-nav text-xs text-white/60">{user?.email}</span>
          <button
            onClick={handleLogout}
            className="font-nav text-xs px-4 py-2 rounded-lg transition-all"
            style={{ background: '#d0db41', color: '#00282b', fontWeight: 700 }}
          >
            Keluar
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        <h2 className="font-nav font-bold text-2xl text-gray-800 mb-2">Dashboard Admin</h2>
        <p className="font-nav text-gray-500 mb-8">Selamat datang, {user?.email}</p>

        {/* Menu Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[
            { label: 'Data Laporan', href: '/admin/data-laporan', icon: '📈' },
            { label: 'Laporan Keuangan', href: '/admin/laporan-keuangan', icon: '📋' },
            { label: 'Akuntansi Manajemen', href: '/admin/akuntansi-manajemen', icon: '🏢' },
            { label: 'Akuntansi Verifikasi', href: '/admin/akuntansi-verifikasi', icon: '📑' },
            { label: 'KPI & Sasaran Mutu', href: '/admin/kpi', icon: '🎯' },
            { label: 'Pusat Edukasi', href: '/admin/pusat-edukasi', icon: '🎥' },
            { label: 'Kepuasan Pelanggan', href: '/admin/kepuasan-pelanggan', icon: '⭐' },
            { label: 'Regulasi & Kebijakan', href: '/admin/regulasi-kebijakan', icon: '⚖️' },
            { label: 'Layanan & Formulir', href: '/admin/layanan-formulir', icon: '📝' },
            { label: 'FAQ', href: '/admin/faq', icon: '❓' },
            { label: 'Dokumentasi', href: '/admin/dokumentasi', icon: '🖼️' },
            { label: 'Pengumuman', href: '/admin/pengumuman', icon: '📢' },
            { label: 'Profil Tim Kerja', href: '/admin/profil', icon: '🏛️' },
            { label: 'Budaya Kerja', href: '/admin/budaya-kerja', icon: '✨' },
            { label: 'Our Teams', href: '/admin/our-teams', icon: '👥' },
            { label: 'Kontak Pesan', href: '/admin/kontak', icon: '✉️' },
          ].map((menu) => (
            <a
              key={menu.href}
              href={menu.href}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all hover:-translate-y-1 text-center"
            >
              <div className="text-3xl mb-3">{menu.icon}</div>
              <p className="font-nav font-semibold text-sm text-gray-700">{menu.label}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
