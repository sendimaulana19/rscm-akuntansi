'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Upload, Trash2, Plus, Download } from 'lucide-react'
import Link from 'next/link'

export default function AdminDownloadDokumenPage() {
  const [nama, setNama] = useState('')
  const [deskripsi, setDeskripsi] = useState('')
  const [kategori, setKategori] = useState('Umum')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [data, setData] = useState<any[]>([])
  const fileRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => { loadData() }, [])
  async function loadData() {
    const { data: d } = await supabase.from('download_dokumen').select('*').order('created_at', { ascending: false })
    setData(d || [])
  }

  async function handleUpload() {
    if (!file || !nama) { setMessage('⚠️ Lengkapi nama dan pilih file!'); return }
    setUploading(true); setMessage('')
    const fileName = `${Date.now()}-${file.name}`
    const { error: upErr } = await supabase.storage.from('rscm-files').upload(fileName, file)
    if (upErr) { setMessage('❌ Gagal upload: ' + upErr.message); setUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('rscm-files').getPublicUrl(fileName)
    const { error } = await supabase.from('download_dokumen').insert({ nama, deskripsi, kategori, file_url: publicUrl, file_name: file.name, jumlah_unduhan: 0 })
    if (error) { setMessage('❌ Gagal simpan: ' + error.message) }
    else { setMessage('✅ Berhasil!'); setNama(''); setDeskripsi(''); setFile(null); if (fileRef.current) fileRef.current.value = ''; loadData() }
    setUploading(false); setTimeout(() => setMessage(''), 4000)
  }

  async function handleDelete(id: string, fileUrl: string) {
    if (!confirm('Hapus dokumen ini?')) return
    const fileName = fileUrl.split('/').pop()!
    await Promise.all([supabase.from('download_dokumen').delete().eq('id', id), supabase.storage.from('rscm-files').remove([fileName])])
    loadData()
  }

  const kategoris = ['Umum', 'Keuangan', 'Administrasi', 'Regulasi', 'Panduan', 'Formulir']

  return (
    <div className="min-h-screen" style={{ background: '#f0f4f5' }}>
      <div style={{ background: '#00282b' }} className="px-6 py-6">
        <div className="max-w-4xl mx-auto">
          <p className="font-nav text-xs text-white/50 mb-1"><Link href="/admin/dashboard" className="hover:text-white">← Dashboard</Link></p>
          <h1 className="font-nav font-bold text-white text-xl">Download Dokumen</h1>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-nav font-bold text-gray-800 mb-4 flex items-center gap-2"><Plus size={18} style={{ color: '#01bcce' }} />Upload Dokumen</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="font-nav text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Nama Dokumen</label>
              <input type="text" value={nama} onChange={e => setNama(e.target.value)} placeholder="Nama dokumen" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 font-nav text-sm outline-none" />
            </div>
            <div>
              <label className="font-nav text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Kategori</label>
              <select value={kategori} onChange={e => setKategori(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 font-nav text-sm outline-none">
                {kategoris.map(k => <option key={k}>{k}</option>)}
              </select>
            </div>
            <div>
              <label className="font-nav text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Deskripsi</label>
              <input type="text" value={deskripsi} onChange={e => setDeskripsi(e.target.value)} placeholder="Deskripsi singkat" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 font-nav text-sm outline-none" />
            </div>
            <div className="sm:col-span-2">
              <label className="font-nav text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">File</label>
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:border-cyan-400 transition-colors" onClick={() => fileRef.current?.click()}>
                {file ? <p className="font-nav text-sm text-cyan-600 font-semibold">📎 {file.name}</p> : <p className="font-nav text-sm text-gray-400">Klik untuk pilih file (PDF, Excel, Word)</p>}
                <input ref={fileRef} type="file" accept=".pdf,.xlsx,.xls,.doc,.docx" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
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
          <h2 className="font-nav font-bold text-gray-800 mb-4">Daftar Dokumen <span className="font-normal text-xs text-gray-400">({data.length} file)</span></h2>
          {data.length === 0 ? <p className="font-nav text-sm text-gray-400">Belum ada dokumen.</p> : (
            <div className="space-y-3">
              {data.map((item: any) => (
                <div key={item.id} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100">
                  <div className="flex-1 min-w-0">
                    <p className="font-nav font-bold text-sm text-gray-800">{item.nama}</p>
                    <p className="font-nav text-xs text-gray-400">{item.kategori} · <Download size={10} className="inline" /> {item.jumlah_unduhan || 0}x diunduh</p>
                  </div>
                  <a href={item.file_url} target="_blank" className="font-nav text-xs font-bold px-3 py-1.5 rounded-lg" style={{ background: 'rgba(1,188,206,0.1)', color: '#01bcce' }}>Lihat</a>
                  <button onClick={() => handleDelete(item.id, item.file_url)} className="p-1.5 rounded-lg bg-red-50 text-red-400"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
