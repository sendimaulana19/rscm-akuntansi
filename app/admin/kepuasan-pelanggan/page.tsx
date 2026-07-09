'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Upload, Trash2, Plus } from 'lucide-react'
import Link from 'next/link'

export default function AdminKepuasanPelangganPage() {
  const [judul, setJudul] = useState('')
  const [deskripsi, setDeskripsi] = useState('')
  const [fileType, setFileType] = useState<'gambar' | 'pdf'>('gambar')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [data, setData] = useState<any[]>([])
  const fileRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => { loadData() }, [])
  async function loadData() {
    const { data: d } = await supabase.from('kepuasan_pelanggan').select('*').order('created_at', { ascending: false })
    setData(d || [])
  }

  async function handleUpload() {
    if (!file || !judul) { setMessage('⚠️ Lengkapi judul dan pilih file!'); return }
    setUploading(true); setMessage('')
    const bucket = fileType === 'gambar' ? 'rscm-images' : 'rscm-files'
    const fileName = `${Date.now()}-${file.name}`
    const { error: upErr } = await supabase.storage.from(bucket).upload(fileName, file)
    if (upErr) { setMessage('❌ Gagal upload: ' + upErr.message); setUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(fileName)
    const { error } = await supabase.from('kepuasan_pelanggan').insert({ judul, deskripsi, file_url: publicUrl, file_type: fileType })
    if (error) { setMessage('❌ Gagal simpan: ' + error.message) }
    else { setMessage('✅ Berhasil!'); setJudul(''); setDeskripsi(''); setFile(null); if (fileRef.current) fileRef.current.value = ''; loadData() }
    setUploading(false); setTimeout(() => setMessage(''), 4000)
  }

  async function handleDelete(id: string) {
    if (!confirm('Hapus data ini?')) return
    await supabase.from('kepuasan_pelanggan').delete().eq('id', id)
    loadData()
  }

  return (
    <div className="min-h-screen" style={{ background: '#f0f4f5' }}>
      <div style={{ background: '#00282b' }} className="px-6 py-6">
        <div className="max-w-4xl mx-auto">
          <p className="font-nav text-xs text-white/50 mb-1"><Link href="/admin/dashboard" className="hover:text-white">← Dashboard</Link></p>
          <h1 className="font-nav font-bold text-white text-xl">Kepuasan Pelanggan</h1>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-nav font-bold text-gray-800 mb-4 flex items-center gap-2"><Plus size={18} style={{ color: '#01bcce' }} />Upload Data Kepuasan</h2>
          <div className="space-y-4">
            <div>
              <label className="font-nav text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Judul</label>
              <input type="text" value={judul} onChange={e => setJudul(e.target.value)} placeholder="Judul survey / laporan kepuasan" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 font-nav text-sm outline-none" />
            </div>
            <div>
              <label className="font-nav text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Deskripsi</label>
              <textarea value={deskripsi} onChange={e => setDeskripsi(e.target.value)} rows={2} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 font-nav text-sm outline-none resize-none" />
            </div>
            <div>
              <label className="font-nav text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Tipe File</label>
              <div className="flex gap-3">
                {(['gambar', 'pdf'] as const).map(t => (
                  <button key={t} onClick={() => setFileType(t)}
                    className="px-4 py-2 rounded-lg font-nav font-bold text-sm transition-all"
                    style={{ background: fileType === t ? '#00282b' : '#f0f4f5', color: fileType === t ? '#d0db41' : '#666' }}>
                    {t === 'gambar' ? '🖼️ Gambar' : '📄 PDF'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="font-nav text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">File</label>
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:border-cyan-400 transition-colors" onClick={() => fileRef.current?.click()}>
                {file ? <p className="font-nav text-sm text-cyan-600 font-semibold">📎 {file.name}</p> : <p className="font-nav text-sm text-gray-400">Klik untuk pilih file</p>}
                <input ref={fileRef} type="file" accept={fileType === 'gambar' ? 'image/*' : '.pdf'} className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
              </div>
            </div>
          </div>
          {message && <div className={`mt-4 px-4 py-3 rounded-xl font-nav text-sm ${message.startsWith('✅') ? 'bg-green-50 text-green-700' : message.startsWith('⚠️') ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-600'}`}>{message}</div>}
          <div className="flex justify-end mt-4">
            <button onClick={handleUpload} disabled={uploading} className="flex items-center gap-2 px-6 py-3 rounded-xl font-nav font-bold text-sm text-white disabled:opacity-60" style={{ background: '#00282b' }}>
              <Upload size={16} />{uploading ? 'Mengupload...' : 'Upload'}
            </button>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-nav font-bold text-gray-800 mb-4">Daftar Data <span className="font-normal text-xs text-gray-400">({data.length} item)</span></h2>
          {data.length === 0 ? <p className="font-nav text-sm text-gray-400">Belum ada data.</p> : (
            <div className="space-y-3">
              {data.map((item: any) => (
                <div key={item.id} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100">
                  <div className="flex-1 min-w-0">
                    <p className="font-nav font-bold text-sm text-gray-800">{item.judul}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded text-xs font-nav font-bold" style={{ background: item.file_type === 'gambar' ? '#e8f5e9' : '#e3f2fd', color: item.file_type === 'gambar' ? '#2e7d32' : '#1565c0' }}>{item.file_type}</span>
                  </div>
                  <a href={item.file_url} target="_blank" className="font-nav text-xs font-bold px-3 py-1.5 rounded-lg" style={{ background: 'rgba(1,188,206,0.1)', color: '#01bcce' }}>Lihat</a>
                  <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg bg-red-50 text-red-400"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
