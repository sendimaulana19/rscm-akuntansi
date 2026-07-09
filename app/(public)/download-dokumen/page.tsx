'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Dokumen {
  id: string
  nama_dokumen: string
  deskripsi?: string
  file_url: string
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
        .select('id, nama_dokumen, deskripsi, file_url, kategori, jumlah_unduhan, created_at')
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
        d.nama_dokumen.toLowerCase().includes(q) ||
        d.deskripsi?.toLowerCase().includes(q) ||
        d.kategori?.toLowerCase().includes(q)
    )
  }, [dokumen, searchQuery])

  const handleDownload = async (doc: Dokumen) => {
    setDownloading(doc.id)
    try {
      // Track download count
      const supabase = createClient()
      await supabase
        .from('download_dokumen')
        .update({ jumlah_unduhan: (doc.jumlah_unduhan ?? 0) + 1 })
        .eq('id', doc.id)

      // Update local state
      setDokumen((prev) =>
        prev.map((d) =>
          d.id === doc.id ? { ...d, jumlah_unduhan: (d.jumlah_unduhan ?? 0) + 1 } : d
        )
      )

      // Trigger download
      const link = document.createElement('a')
      link.href = doc.file_url
      link.target = '_blank'
      link.rel = 'noopener noreferrer'
      link.download = doc.nama_dokumen
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      console.error('Error tracking download:', err)
    } finally {
      setDownloading(null)
    }
  }

  return (
    <main
      className="min-h-screen"
      style={{ fontFamily: '"TeX Gyre Bonum", Georgia, serif', background: '#f4f6f8' }}
    >
      {/* Header */}
      <div
        className="w-full py-12 px-6"
        style={{
          background: 'linear-gradient(135deg, #00282b 0%, #015a61 100%)',
        }}
      >
        <div className="max-w-4xl mx-auto">
          <h1
            className="text-3xl md:text-4xl font-bold text-white mb-2"
            style={{ fontFamily: 'Nunito, sans-serif' }}
          >
            Download Dokumen
          </h1>
          <p className="text-cyan-200 text-lg">
            Unduh dokumen, formulir, dan regulasi terkait akuntansi RSCM
          </p>
          <div
            className="mt-4 h-1 w-24 rounded-full"
            style={{ background: '#d0db41' }}
          />

          {/* Search Bar */}
          <div className="mt-8 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari dokumen..."
              className="w-full rounded-xl px-5 py-3.5 pl-12 text-gray-800 text-base focus:outline-none focus:ring-2 focus:ring-[#d0db41] shadow-lg"
              style={{
                fontFamily: '"TeX Gyre Bonum", Georgia, serif',
              }}
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">🔍</span>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* List */}
      <div className="max-w-4xl mx-auto px-4 py-10">
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block w-12 h-12 border-4 rounded-full animate-spin mb-4"
              style={{ borderColor: '#01bcce', borderTopColor: 'transparent' }}
            />
            <p className="text-gray-500">Memuat dokumen...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📂</div>
            <p className="text-gray-500 text-xl">
              {searchQuery ? `Tidak ada dokumen untuk "${searchQuery}"` : 'Belum ada dokumen tersedia.'}
            </p>
          </div>
        ) : (
          <>
            <p
              className="text-sm mb-5"
              style={{ color: '#01bcce', fontFamily: 'Nunito, sans-serif' }}
            >
              Menampilkan {filtered.length} dokumen{searchQuery ? ` untuk "${searchQuery}"` : ''}
            </p>
            <div className="space-y-4">
              {filtered.map((doc, idx) => (
                <div
                  key={doc.id}
                  className="bg-white rounded-2xl p-5 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                  style={{ border: '1px solid #e0e0e0' }}
                >
                  <div className="flex items-start gap-4 flex-1">
                    {/* Icon */}
                    <div
                      className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                      style={{ background: 'linear-gradient(135deg, #00282b, #015a61)' }}
                    >
                      📄
                    </div>

                    {/* Info */}
                    <div>
                      <h3
                        className="font-bold text-lg leading-tight"
                        style={{ color: '#00282b', fontFamily: 'Nunito, sans-serif' }}
                      >
                        {doc.nama_dokumen}
                      </h3>
                      {doc.deskripsi && (
                        <p className="text-sm text-gray-500 mt-0.5">{doc.deskripsi}</p>
                      )}
                      <div className="flex flex-wrap gap-3 mt-2">
                        {doc.kategori && (
                          <span
                            className="text-xs px-2.5 py-1 rounded-full font-semibold"
                            style={{
                              background: '#e8f9fc',
                              color: '#01bcce',
                              fontFamily: 'Nunito, sans-serif',
                            }}
                          >
                            {doc.kategori}
                          </span>
                        )}
                        {doc.jumlah_unduhan !== undefined && (
                          <span
                            className="text-xs px-2.5 py-1 rounded-full"
                            style={{
                              background: '#f0f4e8',
                              color: '#5a6e00',
                              fontFamily: 'Nunito, sans-serif',
                            }}
                          >
                            ⬇ {doc.jumlah_unduhan.toLocaleString('id-ID')} unduhan
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Download Button */}
                  <button
                    onClick={() => handleDownload(doc)}
                    disabled={downloading === doc.id}
                    className="flex-shrink-0 font-bold px-6 py-2.5 rounded-xl transition-all duration-200 hover:opacity-90 hover:shadow-lg disabled:opacity-70 flex items-center gap-2"
                    style={{
                      background: downloading === doc.id
                        ? '#ccc'
                        : 'linear-gradient(135deg, #d0db41, #b8c530)',
                      color: '#00282b',
                      fontFamily: 'Nunito, sans-serif',
                    }}
                  >
                    {downloading === doc.id ? (
                      <>
                        <span className="inline-block w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                        Mengunduh...
                      </>
                    ) : (
                      <>⬇ Download</>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  )
}
