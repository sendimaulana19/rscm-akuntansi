'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { deleteFileFromStorage } from '@/lib/supabase/storage-helper'
import { Plus, Trash2, Link as LinkIcon, Download } from 'lucide-react'
import Link from 'next/link'

export default function AdminDownloadDokumenPage() {
  const [nama, setNama] = useState('')
  const [deskripsi, setDeskripsi] = useState('')
  const [tahun, setTahun] = useState('')
  const [fileUrl, setFileUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [data, setData] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => { loadData() }, [])
  async function loadData() {
    const { data: d } = await supabase.from('layanan_formulir').select('*').order('created_at', { ascending: false })
    setData(d || [])
  }

  async function handleUpload() {
    if (!fileUrl || !nama || !tahun) { setMessage('⚠️ Lengkapi nama, tahun, dan link!'); return }
    setUploading(true); setMessage('')
    
    const { error } = await supabase.from('layanan_formulir').insert({ 
      nama, 
      deskripsi, 
      kategori: tahun, // using kategori as fallback or we can use the explicit tahun column
      file_url: fileUrl, 
      file_name: nama, 
      jumlah_unduhan: 0 
    })
    
    // Actually wait, let's use a real 'tahun' column. So we insert 'tahun'
    // I will instruct the user to run SQL to add 'tahun'
    
    if (error) { setMessage('❌ Gagal simpan: ' + error.message) }
    else { 
      setMessage('✅ Berhasil!')
      setNama('')
      setDeskripsi('')
      setTahun('')
      setFileUrl('')
      loadData() 
    }
    setUploading(false); setTimeout(() => setMessage(''), 4000)
  }

  async function handleDelete(id: string) {
    if (!confirm('Hapus dokumen ini?')) return
    const item = data.find(d => d.id === id)
    if (item?.file_url) {
      await deleteFileFromStorage(supabase, item.file_url)
    }
    await supabase.from('layanan_formulir').delete().eq('id', id)
    loadData()
  }

  return (
    <div className="min-h-screen" style={{ background: '#f0f4f5' }}>
      <div style={{ background: '#00282b' }} className="px-6 py-6">
        <div className="max-w-4xl mx-auto">
          <p className="font-nav text-xs text-white/50 mb-1"><Link href="/admin/dashboard" className="hover:text-white">← Dashboard</Link></p>
          <h1 className="font-nav font-bold text-white text-xl">Kelola Layanan & Formulir</h1>
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-nav font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Plus size={18} style={{ color: '#01bcce' }} /> Tambah Formulir Baru
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="font-nav text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Judul Formulir / Layanan</label>
              <input type="text" value={nama} onChange={e => setNama(e.target.value)} placeholder="Contoh: Formulir Permintaan Data" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 font-nav text-sm outline-none" />
            </div>
            
            <div className="sm:col-span-1">
              <label className="font-nav text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Tahun</label>
              <input type="number" value={tahun} onChange={e => setTahun(e.target.value)} placeholder="Contoh: 2026" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 font-nav text-sm outline-none" />
            </div>
            
            <div className="sm:col-span-1">
              <label className="font-nav text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Link Google Drive</label>
              <input type="url" value={fileUrl} onChange={e => setFileUrl(e.target.value)} placeholder="https://drive.google.com/..." className="w-full px-4 py-2.5 rounded-xl border border-gray-200 font-nav text-sm outline-none" />
            </div>
          </div>
          
          <div className="mt-6">
            <button onClick={handleUpload} disabled={uploading} className="bg-[#01bcce] text-[#00282b] font-nav font-bold text-sm px-6 py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50">
              {uploading ? 'Menyimpan...' : 'Simpan Formulir'}
            </button>
            {message && <span className="ml-4 font-nav text-sm font-semibold">{message}</span>}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-nav font-bold text-gray-800 mb-4">Daftar Layanan & Formulir</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-nav">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="py-3 px-4 text-xs font-bold text-gray-400 uppercase">Judul Layanan / Formulir</th>
                  <th className="py-3 px-4 text-xs font-bold text-gray-400 uppercase">Tahun</th>
                  <th className="py-3 px-4 text-xs font-bold text-gray-400 uppercase text-center">Diklik</th>
                  <th className="py-3 px-4 text-xs font-bold text-gray-400 uppercase text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.map(d => (
                  <tr key={d.id} className="hover:bg-gray-50/50">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-gray-800">{d.nama}</div>
                      <div className="text-xs text-gray-400 truncate max-w-xs">{d.file_url}</div>
                    </td>
                    <td className="py-3 px-4 text-sm font-semibold text-gray-600">{d.kategori || '-'}</td>
                    <td className="py-3 px-4 text-sm text-gray-500 text-center">{d.jumlah_unduhan || 0}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a href={d.file_url} target="_blank" rel="noreferrer" className="p-2 text-blue-500 bg-blue-50 rounded-lg hover:bg-blue-100"><LinkIcon size={16} /></a>
                        <button onClick={() => handleDelete(d.id)} className="p-2 text-red-500 bg-red-50 rounded-lg hover:bg-red-100"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {data.length === 0 && (
                  <tr><td colSpan={4} className="py-8 text-center text-gray-400 text-sm">Belum ada formulir</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
