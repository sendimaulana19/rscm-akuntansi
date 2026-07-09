'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Upload, Trash2, Plus, ImageIcon, Video, X, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'

export default function AdminDokumentasiPage() {
  const [caption, setCaption] = useState('')
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0])
  const [fileType, setFileType] = useState<'foto' | 'video'>('foto')
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [message, setMessage] = useState('')
  const [data, setData] = useState<any[]>([])
  const fileRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: d } = await supabase
      .from('dokumentasi')
      .select('*')
      .order('tanggal', { ascending: false })
    setData(d || [])
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files || [])
    setFiles(selected)
    const urls = selected
      .filter(f => f.type.startsWith('image/'))
      .map(f => URL.createObjectURL(f))
    setPreviews(urls)
  }

  async function handleUpload() {
    if (files.length === 0 || !caption.trim()) {
      setMessage('⚠️ Caption dan minimal 1 file wajib diisi!')
      return
    }
    setUploading(true)
    setMessage('')
    setUploadProgress(0)

    // Generate album_id — pakai timestamp sebagai pengelompokan
    const albumId = `album-${Date.now()}`
    let successCount = 0

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const bucket = fileType === 'foto' ? 'rscm-images' : 'rscm-files'
      const ext = file.name.split('.').pop()
      const fileName = `dok-${Date.now()}-${i}.${ext}`

      const { error: upErr } = await supabase.storage.from(bucket).upload(fileName, file)
      if (upErr) continue

      const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(fileName)
      await supabase.from('dokumentasi').insert({
        caption: caption.trim(),
        tanggal,
        file_url: publicUrl,
        file_type: fileType,
        album_id: albumId,
      })
      successCount++
      setUploadProgress(Math.round(((i + 1) / files.length) * 100))
    }

    if (successCount > 0) {
      setMessage(`✅ ${successCount} file berhasil diupload!`)
      setCaption('')
      setFiles([])
      setPreviews([])
      if (fileRef.current) fileRef.current.value = ''
      loadData()
    } else {
      setMessage('❌ Gagal upload semua file.')
    }
    setUploading(false)
    setTimeout(() => setMessage(''), 5000)
  }

  async function handleDeleteAlbum(albumId: string) {
    if (!confirm('Hapus semua foto dalam kegiatan ini?')) return
    if (albumId) {
      await supabase.from('dokumentasi').delete().eq('album_id', albumId)
    }
    loadData()
  }

  async function handleDeleteSingle(id: string) {
    if (!confirm('Hapus foto ini?')) return
    await supabase.from('dokumentasi').delete().eq('id', id)
    loadData()
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })

  // Group data by album_id
  const albums: Record<string, any[]> = {}
  data.forEach(item => {
    const key = item.album_id || item.id
    if (!albums[key]) albums[key] = []
    albums[key].push(item)
  })

  return (
    <div className="min-h-screen" style={{ background: '#f0f4f5' }}>
      <div style={{ background: '#00282b' }} className="px-6 py-6">
        <div className="max-w-5xl mx-auto">
          <p className="font-nav text-xs text-white/50 mb-1">
            <Link href="/admin/dashboard" className="hover:text-white">← Dashboard</Link>
          </p>
          <h1 className="font-nav font-bold text-white text-xl">Dokumentasi Kegiatan</h1>
          <p className="font-nav text-xs text-white/50 mt-1">Upload foto/video kegiatan — bisa banyak sekaligus per album</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Upload Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <Plus size={18} style={{ color: '#01bcce' }} />
            <h2 className="font-nav font-bold text-gray-800">Upload Album Kegiatan Baru</h2>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left */}
              <div className="space-y-4">
                <div>
                  <label className="font-nav text-xs font-bold text-gray-500 uppercase tracking-wide block mb-2">Tipe</label>
                  <div className="flex gap-3">
                    {(['foto', 'video'] as const).map(t => (
                      <button key={t} onClick={() => { setFileType(t); setFiles([]); setPreviews([]); if (fileRef.current) fileRef.current.value = '' }}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl font-nav font-bold text-sm transition-all"
                        style={{ background: fileType === t ? '#00282b' : '#f0f4f5', color: fileType === t ? '#d0db41' : '#666', border: '2px solid', borderColor: fileType === t ? '#00282b' : '#e5e7eb' }}>
                        {t === 'foto' ? <><ImageIcon size={14} /> Foto</> : <><Video size={14} /> Video</>}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="font-nav text-xs font-bold text-gray-500 uppercase tracking-wide block mb-2">Tanggal Kegiatan</label>
                  <input type="date" value={tanggal} onChange={e => setTanggal(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 font-nav text-sm outline-none" />
                </div>

                <div>
                  <label className="font-nav text-xs font-bold text-gray-500 uppercase tracking-wide block mb-2">Judul / Caption Kegiatan</label>
                  <textarea value={caption} onChange={e => setCaption(e.target.value)} rows={6}
                    placeholder={'Tulis judul atau keterangan kegiatan...\n\nContoh:\nRapat Evaluasi Kinerja Q1 2026\nBertempat di Ruang Rapat Lantai 3 RSCM'}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 font-nav text-sm outline-none resize-none"
                    style={{ lineHeight: 1.7 }} />
                  <p className="font-nav text-xs text-gray-400 mt-1">{caption.length} karakter</p>
                </div>
              </div>

              {/* Right: Multi-file upload */}
              <div>
                <label className="font-nav text-xs font-bold text-gray-500 uppercase tracking-wide block mb-2">
                  File {fileType === 'foto' ? 'Foto' : 'Video'}
                  <span className="ml-2 font-normal lowercase text-gray-400">(bisa pilih banyak sekaligus)</span>
                </label>
                <div onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:border-cyan-400 transition-colors"
                  style={{ minHeight: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
                  {previews.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2 w-full">
                      {previews.slice(0, 9).map((p, i) => (
                        <div key={i} className="relative rounded-lg overflow-hidden" style={{ aspectRatio: '1' }}>
                          <img src={p} alt="" className="w-full h-full object-cover" />
                          {i === 8 && previews.length > 9 && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                              <span className="font-nav font-bold text-white text-lg">+{previews.length - 9}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : files.length > 0 ? (
                    <div className="text-center">
                      <div className="text-4xl mb-2">🎥</div>
                      <p className="font-nav text-sm font-semibold text-cyan-600">{files.length} file video dipilih</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: 'rgba(1,188,206,0.08)' }}>
                        {fileType === 'foto' ? <ImageIcon size={26} style={{ color: '#01bcce' }} /> : <Video size={26} style={{ color: '#01bcce' }} />}
                      </div>
                      <p className="font-nav text-sm font-semibold text-gray-600">Klik untuk pilih {fileType === 'foto' ? 'foto' : 'video'}</p>
                      <p className="font-nav text-xs text-gray-400 mt-1">Bisa pilih beberapa sekaligus</p>
                    </div>
                  )}
                  <input ref={fileRef} type="file" accept={fileType === 'foto' ? 'image/*' : 'video/*'}
                    multiple className="hidden" onChange={handleFileChange} />
                </div>
                {files.length > 0 && (
                  <div className="flex items-center justify-between mt-2">
                    <p className="font-nav text-xs text-cyan-600 font-semibold">{files.length} file dipilih</p>
                    <button onClick={() => { setFiles([]); setPreviews([]); if (fileRef.current) fileRef.current.value = '' }}
                      className="font-nav text-xs text-gray-400 hover:text-red-400 transition-colors">× Hapus semua</button>
                  </div>
                )}
              </div>
            </div>

            {/* Progress bar */}
            {uploading && (
              <div className="mt-4">
                <div className="flex justify-between mb-1">
                  <span className="font-nav text-xs text-gray-500">Mengupload...</span>
                  <span className="font-nav text-xs font-bold" style={{ color: '#01bcce' }}>{uploadProgress}%</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%`, background: 'linear-gradient(90deg, #01bcce, #00282b)' }} />
                </div>
              </div>
            )}

            {message && (
              <div className={`mt-4 px-4 py-3 rounded-xl font-nav text-sm ${message.startsWith('✅') ? 'bg-green-50 text-green-700 border border-green-200' : message.startsWith('⚠️') ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                {message}
              </div>
            )}

            <div className="flex justify-end mt-6">
              <button onClick={handleUpload} disabled={uploading}
                className="flex items-center gap-2 px-8 py-3 rounded-xl font-nav font-bold text-sm text-white disabled:opacity-60 transition-all hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(135deg, #00282b, #015a61)' }}>
                <Upload size={16} />
                {uploading ? `Mengupload ${uploadProgress}%...` : `Upload ${files.length > 0 ? `(${files.length} file)` : ''}`}
              </button>
            </div>
          </div>
        </div>

        {/* Gallery grouped by album */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-nav font-bold text-gray-800">
              Galeri Dokumentasi
              <span className="ml-2 font-normal text-xs text-gray-400">({Object.keys(albums).length} kegiatan, {data.length} foto/video)</span>
            </h2>
          </div>

          {Object.keys(albums).length === 0 ? (
            <div className="p-12 text-center"><p className="font-nav text-sm text-gray-400">Belum ada dokumentasi.</p></div>
          ) : (
            <div className="p-6 space-y-6">
              {Object.entries(albums).map(([albumId, items]) => (
                <div key={albumId} className="border border-gray-100 rounded-2xl overflow-hidden">
                  {/* Album header */}
                  <div className="flex items-center justify-between px-4 py-3" style={{ background: '#f8fafc' }}>
                    <div>
                      <p className="font-nav font-bold text-sm text-gray-800">{items[0].caption}</p>
                      <p className="font-nav text-xs text-cyan-600 mt-0.5">📅 {formatDate(items[0].tanggal)} · {items.length} foto/video</p>
                    </div>
                    <button onClick={() => handleDeleteAlbum(albumId)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 text-red-400 font-nav text-xs font-bold hover:bg-red-100 transition-colors">
                      <Trash2 size={12} /> Hapus Album
                    </button>
                  </div>
                  {/* Photo grid */}
                  <div className="p-3 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {items.map((item: any) => (
                      <div key={item.id} className="relative rounded-lg overflow-hidden group" style={{ aspectRatio: '1', background: '#f0f0f0' }}>
                        {item.file_type === 'foto' ? (
                          <img src={item.file_url} alt={item.caption} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #00282b, #015a61)' }}>
                            <Video size={20} style={{ color: '#d0db41' }} />
                          </div>
                        )}
                        <button onClick={() => handleDeleteSingle(item.id)}
                          className="absolute top-1 right-1 p-1 rounded bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
