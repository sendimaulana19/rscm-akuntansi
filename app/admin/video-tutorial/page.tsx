'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Upload, Trash2, Eye, Plus, ArrowLeft, Video } from 'lucide-react'

interface VideoTutorial {
  id: string
  judul: string
  deskripsi: string
  video_url: string
  thumbnail_url: string
  created_at: string
}

export default function VideoTutorialPage() {
  const supabase = createClient()

  const [judul, setJudul] = useState('')
  const [deskripsi, setDeskripsi] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [thumbnail, setThumbnail] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [data, setData] = useState<VideoTutorial[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    setLoading(true)
    const { data: rows, error } = await supabase
      .from('video_tutorial')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error && rows) setData(rows)
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!judul || !videoUrl) {
      setMessage({ type: 'error', text: 'Judul dan URL video wajib diisi.' })
      return
    }
    setUploading(true)
    setMessage(null)

    try {
      let thumbnailUrl = ''

      if (thumbnail) {
        const ext = thumbnail.name.split('.').pop()
        const fileName = `video-tutorial/${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('rscm-files')
          .upload(fileName, thumbnail, { upsert: true })

        if (uploadError) throw new Error('Gagal upload thumbnail: ' + uploadError.message)

        const { data: urlData } = supabase.storage.from('rscm-files').getPublicUrl(fileName)
        thumbnailUrl = urlData.publicUrl
      }

      const { error: insertError } = await supabase.from('video_tutorial').insert({
        judul,
        deskripsi,
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl,
      })

      if (insertError) throw new Error('Gagal menyimpan data: ' + insertError.message)

      setMessage({ type: 'success', text: 'Video tutorial berhasil ditambahkan.' })
      setJudul('')
      setDeskripsi('')
      setVideoUrl('')
      setThumbnail(null)
      const fileInput = document.getElementById('thumbnail-input') as HTMLInputElement
      if (fileInput) fileInput.value = ''
      fetchData()
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Terjadi kesalahan.' })
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus video tutorial ini?')) return
    const { error } = await supabase.from('video_tutorial').delete().eq('id', id)
    if (error) {
      setMessage({ type: 'error', text: 'Gagal menghapus: ' + error.message })
    } else {
      setMessage({ type: 'success', text: 'Data berhasil dihapus.' })
      fetchData()
    }
  }

  return (
    <div className="font-nav" style={{ minHeight: '100vh', background: '#f0f9fa' }}>
      {/* Header */}
      <header style={{ background: '#00282b', padding: '16px 32px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Link href="/admin/dashboard" style={{ color: '#d0db41', display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none', fontWeight: 600 }}>
          <ArrowLeft size={18} /> Dashboard
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fff' }}>
          <Video size={22} color="#01bcce" />
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>Manajemen Video Tutorial</h1>
        </div>
      </header>

      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 16px' }}>
        {/* Form */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '28px', marginBottom: '32px', boxShadow: '0 2px 12px rgba(0,40,43,0.08)', border: '1px solid #e0f0f2' }}>
          <h2 style={{ margin: '0 0 20px', fontSize: '18px', color: '#00282b', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={20} color="#01bcce" /> Tambah Video Tutorial
          </h2>

          {message && (
            <div style={{
              padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontWeight: 600,
              background: message.type === 'success' ? '#e6f9f0' : '#fdecea',
              color: message.type === 'success' ? '#00782b' : '#b91c1c',
              border: `1px solid ${message.type === 'success' ? '#a7f0c4' : '#fca5a5'}`
            }}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#00282b', fontSize: '14px' }}>Judul *</label>
              <input
                type="text"
                value={judul}
                onChange={e => setJudul(e.target.value)}
                placeholder="Judul video tutorial"
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #cce8ea', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#00282b', fontSize: '14px' }}>Deskripsi</label>
              <textarea
                value={deskripsi}
                onChange={e => setDeskripsi(e.target.value)}
                placeholder="Deskripsi singkat video"
                rows={3}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #cce8ea', fontSize: '14px', boxSizing: 'border-box', resize: 'vertical', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#00282b', fontSize: '14px' }}>URL Video *</label>
              <input
                type="url"
                value={videoUrl}
                onChange={e => setVideoUrl(e.target.value)}
                placeholder="https://youtube.com/..."
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #cce8ea', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#00282b', fontSize: '14px' }}>Thumbnail (opsional)</label>
              <input
                id="thumbnail-input"
                type="file"
                accept="image/*"
                onChange={e => setThumbnail(e.target.files?.[0] || null)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #cce8ea', fontSize: '14px', boxSizing: 'border-box', background: '#f8fdfd' }}
              />
            </div>
            <button
              type="submit"
              disabled={uploading}
              style={{
                padding: '12px 24px', borderRadius: '8px', border: 'none', cursor: uploading ? 'not-allowed' : 'pointer',
                background: uploading ? '#ccc' : '#01bcce', color: '#00282b', fontWeight: 700, fontSize: '15px',
                display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', transition: 'background 0.2s'
              }}
            >
              <Upload size={18} />
              {uploading ? 'Menyimpan...' : 'Simpan Video Tutorial'}
            </button>
          </form>
        </div>

        {/* List */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '28px', boxShadow: '0 2px 12px rgba(0,40,43,0.08)', border: '1px solid #e0f0f2' }}>
          <h2 style={{ margin: '0 0 20px', fontSize: '18px', color: '#00282b' }}>Daftar Video Tutorial</h2>
          {loading ? (
            <p style={{ color: '#888', textAlign: 'center', padding: '24px' }}>Memuat data...</p>
          ) : data.length === 0 ? (
            <p style={{ color: '#888', textAlign: 'center', padding: '24px' }}>Belum ada data video tutorial.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: '#f0f9fa' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: '#00282b', fontWeight: 700, borderBottom: '2px solid #cce8ea' }}>Judul</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: '#00282b', fontWeight: 700, borderBottom: '2px solid #cce8ea' }}>Deskripsi</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', color: '#00282b', fontWeight: 700, borderBottom: '2px solid #cce8ea' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map(row => (
                    <tr key={row.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: '#00282b' }}>{row.judul}</td>
                      <td style={{ padding: '12px 16px', color: '#555', maxWidth: '260px' }}>{row.deskripsi || '-'}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <a
                          href={row.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ padding: '6px 14px', borderRadius: '6px', background: '#e6f9fb', color: '#01bcce', fontWeight: 600, fontSize: '13px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid #b3ecf2' }}
                        >
                          <Eye size={14} /> Lihat
                        </a>
                        <button
                          onClick={() => handleDelete(row.id)}
                          style={{ padding: '6px 14px', borderRadius: '6px', background: '#fdecea', color: '#b91c1c', fontWeight: 600, fontSize: '13px', border: '1px solid #fca5a5', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Trash2 size={14} /> Hapus
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
    </div>
  )
}
