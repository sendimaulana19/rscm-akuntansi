'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Upload, Trash2, FileText, Plus } from 'lucide-react'
import Link from 'next/link'

interface LaporanKeuangan {
  id: string
  judul: string
  periode: string
  tahun: number
  file_url: string
  file_name: string
  created_at: string
}

export default function AdminLaporanKeuanganPage() {
  const [tab, setTab] = useState<'laporan' | 'catatan'>('laporan')
  const [judul, setJudul] = useState('')
  const [periode, setPeriode] = useState('Semester 1')
  const [tahun, setTahun] = useState(String(new Date().getFullYear()))
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [laporan, setLaporan] = useState<any[]>([])
  const [catatan, setCatatan] = useState<any[]>([])
  const fileRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const [{ data: l }, { data: c }] = await Promise.all([
      supabase.from('laporan_keuangan').select('*').order('tahun', { ascending: false }),
      supabase.from('catatan_laporan_keuangan').select('*').order('tahun', { ascending: false })
    ])
    setLaporan(l || [])
    setCatatan(c || [])
  }

  async function handleUpload() {
    if (!file || !judul) { setMessage('⚠️ Lengkapi judul dan pilih file!'); return }
    setUploading(true); setMessage('')

    const ext = file.name.split('.').pop()
    const fileName = `${Date.now()}-${file.name}`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('rscm-files')
      .upload(fileName, file)

    if (uploadError) { setMessage('❌ Gagal upload file: ' + uploadError.message); setUploading(false); return }

    const { data: { publicUrl } } = supabase.storage.from('rscm-files').getPublicUrl(fileName)

    const table = tab === 'laporan' ? 'laporan_keuangan' : 'catatan_laporan_keuangan'
    const dataToInsert: any = { judul, tahun: parseInt(tahun), file_url: publicUrl, file_name: file.name }
    if (tab === 'laporan') dataToInsert.periode = periode

    const { error } = await supabase.from(table).insert(dataToInsert)
    if (error) { setMessage('❌ Gagal menyimpan: ' + error.message) }
    else {
      setMessage('✅ Berhasil diupload!')
      setJudul(''); setFile(null)
      if (fileRef.current) fileRef.current.value = ''
      loadData()
    }
    setUploading(false); setTimeout(() => setMessage(''), 4000)
  }

  async function handleDelete(id: string, fileUrl: string, isLaporan: boolean) {
    if (!confirm('Hapus file ini?')) return
    const table = isLaporan ? 'laporan_keuangan' : 'catatan_laporan_keuangan'
    const fileName = fileUrl.split('/').pop()!
    await Promise.all([
      supabase.from(table).delete().eq('id', id),
      supabase.storage.from('rscm-files').remove([fileName])
    ])
    loadData()
  }

  const currentList = tab === 'laporan' ? laporan : catatan

  return (
    <div className="min-h-screen" style={{ background: '#f0f4f5' }}>
      <div style={{ background: '#00282b' }} className="px-4 sm:px-6 py-6">
        <div className="max-w-5xl mx-auto">
          <p className="font-nav text-xs text-white/50 mb-1"><Link href="/admin/dashboard" className="hover:text-white">← Dashboard</Link></p>
          <h1 className="font-nav font-bold text-white text-xl">Laporan Keuangan</h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Tab */}
        <div className="flex gap-2 bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 w-fit">
          {[['laporan', 'Laporan Keuangan'], ['catatan', 'Catatan Atas Laporan']].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key as any)}
                    className={`px-5 py-2 rounded-xl font-nav font-bold text-sm transition-all duration-200 ${tab === key ? 'text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    style={tab === key ? { background: '#00282b' } : {}}>
              {label}
            </button>
          ))}
        </div>

        {/* Upload Form */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-nav font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Plus size={18} style={{ color: '#01bcce' }} />
            Upload {tab === 'laporan' ? 'Laporan Keuangan' : 'Catatan Atas Laporan'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="sm:col-span-2">
              <label className="font-nav text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Judul</label>
              <input type="text" value={judul} onChange={e => setJudul(e.target.value)}
                     placeholder={tab === 'laporan' ? 'Laporan Keuangan Semester 1 2025' : 'CALK Tahun 2025'}
                     className="w-full px-4 py-2.5 rounded-xl border border-gray-200 font-nav text-sm outline-none focus:border-brand-cyan" />
            </div>
            {tab === 'laporan' && (
              <div>
                <label className="font-nav text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Periode</label>
                <select value={periode} onChange={e => setPeriode(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 font-nav text-sm outline-none focus:border-brand-cyan">
                  <option>Semester 1</option>
                  <option>Semester 2</option>
                  <option>Tahunan</option>
                </select>
              </div>
            )}
            <div>
              <label className="font-nav text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Tahun</label>
              <select value={tahun} onChange={e => setTahun(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 font-nav text-sm outline-none focus:border-brand-cyan">
                {[2023,2024,2025,2026,2027].map(y => <option key={y}>{y}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="font-nav text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">File (PDF, Excel, Word)</label>
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-brand-cyan transition-colors cursor-pointer"
                   onClick={() => fileRef.current?.click()}>
                {file ? (
                  <p className="font-nav text-sm font-semibold" style={{ color: '#01bcce' }}>📄 {file.name}</p>
                ) : (
                  <>
                    <Upload size={24} className="mx-auto mb-2 text-gray-300" />
                    <p className="font-nav text-sm text-gray-400">Klik untuk pilih file atau drag & drop</p>
                    <p className="font-nav text-xs text-gray-300 mt-1">PDF, XLSX, DOCX — maks. 20MB</p>
                  </>
                )}
                <input ref={fileRef} type="file" accept=".pdf,.xlsx,.xls,.doc,.docx" className="hidden"
                       onChange={e => setFile(e.target.files?.[0] || null)} />
              </div>
            </div>
          </div>

          {message && (
            <div className={`mb-4 px-4 py-3 rounded-xl font-nav text-sm border ${message.startsWith('✅') ? 'bg-green-50 text-green-700 border-green-200' : message.startsWith('⚠️') ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
              {message}
            </div>
          )}

          <div className="flex justify-end">
            <button onClick={handleUpload} disabled={uploading}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl font-nav font-bold text-sm text-white disabled:opacity-60 hover:-translate-y-0.5 transition-all duration-200"
                    style={{ background: '#00282b' }}>
              <Upload size={16} />{uploading ? 'Mengupload...' : 'Upload File'}
            </button>
          </div>
        </div>

        {/* List */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-nav font-bold text-gray-800 mb-4">
            Daftar {tab === 'laporan' ? 'Laporan Keuangan' : 'Catatan Atas Laporan'}
            <span className="ml-2 font-nav text-xs text-gray-400 font-normal">({currentList.length} file)</span>
          </h2>
          {currentList.length === 0 ? (
            <p className="font-nav text-sm text-gray-400">Belum ada file yang diupload.</p>
          ) : (
            <div className="space-y-3">
              {currentList.map((item: any) => (
                <div key={item.id} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                       style={{ background: 'rgba(1,188,206,0.1)', color: '#01bcce' }}>
                    <FileText size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-nav font-bold text-sm text-gray-800 truncate">{item.judul}</p>
                    <p className="font-nav text-xs text-gray-400">
                      {item.periode && `${item.periode} · `}Tahun {item.tahun}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <a href={item.file_url} target="_blank"
                       className="font-nav text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                       style={{ background: 'rgba(1,188,206,0.1)', color: '#01bcce' }}>
                      Lihat
                    </a>
                    <button onClick={() => handleDelete(item.id, item.file_url, tab === 'laporan')}
                            className="p-1.5 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 transition-colors">
                      <Trash2 size={14} />
                    </button>
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
