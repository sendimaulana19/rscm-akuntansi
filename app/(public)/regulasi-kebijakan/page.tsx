'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ExternalLink, Search, FileText } from 'lucide-react'

interface Dokumen {
  id: string
  nama: string
  deskripsi?: string
  file_url: string
  tahun?: string
  kategori?: string
  jumlah_unduhan?: number
  created_at?: string
}

export default function DownloadDokumenPage() {
  const [dokumen, setDokumen] = useState<Dokumen[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [downloading, setDownloading] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('download_dokumen')
        .select('id, nama, deskripsi, file_url, kategori, jumlah_unduhan, created_at')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching download_dokumen:', error)
      } else {
        setDokumen(data ?? [])
      }
      setLoading(false)
    }

    fetchData()
  }, [])

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return dokumen
    const q = searchQuery.toLowerCase()
    return dokumen.filter(
      (d) =>
        d.nama?.toLowerCase().includes(q) ||
        d.tahun?.toLowerCase().includes(q) ||
        d.kategori?.toLowerCase().includes(q)
    )
  }, [dokumen, searchQuery])

  const handleOpen = async (doc: Dokumen) => {
    setDownloading(doc.id)
    try {
      // Track download/open count
      const supabase = createClient()
      await supabase
        .from('download_dokumen')
        .update({ jumlah_unduhan: (doc.jumlah_unduhan ?? 0) + 1 })
        .eq('id', doc.id)

      // Open in new tab
      window.open(doc.file_url, '_blank')
    } catch (error) {
      console.error('Failed to open document:', error)
    } finally {
      setDownloading(null)
    }
  }

  return (
    <main className="min-h-screen" style={{ background: '#f4f6f8', fontFamily: '"TeX Gyre Bonum", Georgia, serif' }}>
      {/* Hero Section */}
      <div style={{
          position: 'relative', height: 280,
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
            <h1 style={{ fontSize: 42, fontWeight: 900, color: '#fff', lineHeight: 1.1, margin: 0, fontFamily: 'Nunito, sans-serif' }}>
              Regulasi & Kebijakan
            </h1>
            <div style={{ width: 70, height: 4, background: '#d0db41', borderRadius: 2, marginTop: 16 }} />
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1140, margin: '40px auto 40px', padding: '0 24px', position: 'relative', zIndex: 10 }}>
        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-lg">
            <input
              type="text"
              placeholder="Cari regulasi atau kebijakan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-full border border-gray-200 shadow-sm outline-none focus:border-[#01bcce] focus:ring-1 focus:ring-[#01bcce] transition-all"
              style={{ fontFamily: 'Nunito, sans-serif' }}
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">Memuat data regulasi...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-white rounded-xl shadow-sm border border-gray-100">
            Tidak ada regulasi yang ditemukan.
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left" style={{ fontFamily: 'Nunito, sans-serif' }}>
              <thead className="bg-[#f8fafa]">
                <tr>
                  <th className="py-4 px-6 text-sm font-bold text-gray-600 uppercase tracking-wider text-center">Judul Regulasi & Kebijakan</th>
                  <th className="py-4 px-6 text-sm font-bold text-gray-600 uppercase tracking-wider w-32 text-center">Tahun</th>
                  <th className="py-4 px-6 text-sm font-bold text-gray-600 uppercase tracking-wider text-center w-40">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-2.5 px-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#eef9fa] text-[#01bcce] rounded-lg">
                          <FileText size={20} />
                        </div>
                        <span className="font-semibold text-gray-800 text-lg">{doc.nama}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-6 text-center">
                      <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-gray-100 text-gray-700 font-bold text-sm">
                        {doc.tahun || doc.kategori || '-'}
                      </span>
                    </td>
                    <td className="py-2.5 px-6 text-center">
                      <button
                        onClick={() => handleOpen(doc)}
                        disabled={downloading === doc.id}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm"
                        style={{
                          background: '#00282b',
                          color: '#01bcce',
                          opacity: downloading === doc.id ? 0.7 : 1,
                        }}
                      >
                        <ExternalLink size={16} />
                        Buka
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  )
}
