'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Upload, Trash2, Plus, Users, FileText } from 'lucide-react'
import Link from 'next/link'

export default function AdminAkuntansiManajemenPage() {
  const [activeTab, setActiveTab] = useState<'mitra' | 'dokumen'>('mitra')
  
  // State for Mitra
  const [namaMitra, setNamaMitra] = useState('')
  const [tentang, setTentang] = useState('')
  const [periodeKerjaSama, setPeriodeKerjaSama] = useState('')
  const [mekanisme, setMekanisme] = useState('')
  const [mitraList, setMitraList] = useState<any[]>([])
  const [loadingMitra, setLoadingMitra] = useState(false)
  const [msgMitra, setMsgMitra] = useState('')

  // State for Dokumen
  const [namaKso, setNamaKso] = useState('')
  const [periode, setPeriode] = useState('Triwulan 1')
  const [tahun, setTahun] = useState(String(new Date().getFullYear()))
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [msgDokumen, setMsgDokumen] = useState('')
  const [dokumenList, setDokumenList] = useState<any[]>([])
  
  const fileRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => { 
    loadMitra()
    loadDokumen()
  }, [])

  async function loadMitra() {
    const { data } = await supabase.from('mitra_kso').select('*').order('created_at', { ascending: false })
    setMitraList(data || [])
  }

  async function loadDokumen() {
    const { data } = await supabase.from('akuntansi_manajemen').select('*').order('created_at', { ascending: false })
    setDokumenList(data || [])
  }

  async function handleSimpanMitra() {
    if (!namaMitra) { setMsgMitra('⚠️ Nama Mitra harus diisi!'); return }
    setLoadingMitra(true); setMsgMitra('')
    
    const { error } = await supabase.from('mitra_kso').insert({ 
      nama: namaMitra, 
      tentang, 
      periode: periodeKerjaSama, 
      mekanisme 
    })
    
    if (error) { 
      setMsgMitra('❌ Gagal simpan: ' + error.message) 
    } else { 
      setMsgMitra('✅ Berhasil ditambahkan!')
      setNamaMitra(''); setTentang(''); setPeriodeKerjaSama(''); setMekanisme('')
      loadMitra()
    }
    setLoadingMitra(false)
    setTimeout(() => setMsgMitra(''), 4000)
  }

  async function handleDeleteMitra(id: string) {
    if (!confirm('Hapus profil mitra ini? Jika ada dokumen yang terhubung, sebaiknya hapus dokumennya dulu.')) return
    await supabase.from('mitra_kso').delete().eq('id', id)
    loadMitra()
  }

  async function handleUploadDokumen() {
    if (!file || !namaKso) { setMsgDokumen('⚠️ Pilih Mitra dan file dokumen!'); return }
    setUploading(true); setMsgDokumen('')
    
    const fileName = `${Date.now()}-${file.name}`
    const { error: uploadError } = await supabase.storage.from('rscm-files').upload(fileName, file)
    
    if (uploadError) { 
      setMsgDokumen('❌ Gagal upload: ' + uploadError.message)
      setUploading(false)
      return 
    }
    
    const { data: { publicUrl } } = supabase.storage.from('rscm-files').getPublicUrl(fileName)
    
    const { error } = await supabase.from('akuntansi_manajemen').insert({ 
      nama_kso: namaKso, 
      periode, 
      tahun: parseInt(tahun), 
      file_url: publicUrl, 
      file_name: file.name 
    })
    
    if (error) { 
      setMsgDokumen('❌ Gagal simpan database: ' + error.message) 
    } else { 
      setMsgDokumen('✅ Berhasil diupload!')
      setFile(null)
      if (fileRef.current) fileRef.current.value = ''
      loadDokumen() 
    }
    setUploading(false)
    setTimeout(() => setMsgDokumen(''), 4000)
  }

  async function handleDeleteDokumen(id: string, fileUrl: string) {
    if (!confirm('Hapus dokumen ini?')) return
    const fileName = fileUrl.split('/').pop()!
    await Promise.all([
      supabase.from('akuntansi_manajemen').delete().eq('id', id), 
      supabase.storage.from('rscm-files').remove([fileName])
    ])
    loadDokumen()
  }

  return (
    <div className="min-h-screen" style={{ background: '#f0f4f5' }}>
      <div style={{ background: '#00282b' }} className="px-6 py-6">
        <div className="max-w-5xl mx-auto">
          <p className="font-nav text-xs text-white/50 mb-1"><Link href="/admin/dashboard" className="hover:text-white">← Dashboard</Link></p>
          <h1 className="font-nav font-bold text-white text-xl">Akuntansi Manajemen (KSO)</h1>
        </div>
      </div>
      
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-8">
          <button 
            onClick={() => setActiveTab('mitra')}
            className={`flex items-center gap-2 px-6 py-4 font-nav text-sm font-bold border-b-2 transition-colors ${activeTab === 'mitra' ? 'border-cyan-500 text-cyan-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            <Users size={18} /> Profil Mitra KSO
          </button>
          <button 
            onClick={() => setActiveTab('dokumen')}
            className={`flex items-center gap-2 px-6 py-4 font-nav text-sm font-bold border-b-2 transition-colors ${activeTab === 'dokumen' ? 'border-cyan-500 text-cyan-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            <FileText size={18} /> Laporan & Dokumen
          </button>
        </div>

        {/* TAB 1: MITRA */}
        {activeTab === 'mitra' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="font-nav font-bold text-gray-800 mb-4 flex items-center gap-2"><Plus size={18} style={{ color: '#01bcce' }} />Tambah Mitra Baru</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="sm:col-span-2">
                  <label className="font-nav text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Nama Mitra</label>
                  <input type="text" value={namaMitra} onChange={e => setNamaMitra(e.target.value)} placeholder="Contoh: KSO Laboratorium" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 font-nav text-sm outline-none focus:border-cyan-400" />
                </div>
                <div className="sm:col-span-2">
                  <label className="font-nav text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Tentang</label>
                  <textarea value={tentang} onChange={e => setTentang(e.target.value)} placeholder="Deskripsi singkat mengenai kerja sama ini" rows={3} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 font-nav text-sm outline-none focus:border-cyan-400" />
                </div>
                <div>
                  <label className="font-nav text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Periode Kerja Sama</label>
                  <input type="text" value={periodeKerjaSama} onChange={e => setPeriodeKerjaSama(e.target.value)} placeholder="Contoh: 2023 - 2028" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 font-nav text-sm outline-none focus:border-cyan-400" />
                </div>
                <div>
                  <label className="font-nav text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Mekanisme Bagi Hasil</label>
                  <input type="text" value={mekanisme} onChange={e => setMekanisme(e.target.value)} placeholder="Contoh: 60% RSCM - 40% Mitra" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 font-nav text-sm outline-none focus:border-cyan-400" />
                </div>
              </div>
              {msgMitra && <div className={`mb-4 px-4 py-3 rounded-xl font-nav text-sm ${msgMitra.startsWith('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>{msgMitra}</div>}
              <div className="flex justify-end">
                <button onClick={handleSimpanMitra} disabled={loadingMitra} className="flex items-center gap-2 px-6 py-3 rounded-xl font-nav font-bold text-sm text-white disabled:opacity-60 hover:opacity-90 transition-opacity" style={{ background: '#00282b' }}>
                  <Users size={16} />{loadingMitra ? 'Menyimpan...' : 'Simpan Mitra'}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="font-nav font-bold text-gray-800 mb-4">Daftar Mitra <span className="font-normal text-xs text-gray-400">({mitraList.length} mitra)</span></h2>
              {mitraList.length === 0 ? <p className="font-nav text-sm text-gray-400">Belum ada mitra yang ditambahkan.</p> : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mitraList.map((item: any) => (
                    <div key={item.id} className="flex flex-col gap-2 p-4 rounded-xl border border-gray-100 bg-gray-50">
                      <div className="flex justify-between items-start">
                        <p className="font-nav font-bold text-base text-gray-800">{item.nama}</p>
                        <button onClick={() => handleDeleteMitra(item.id)} className="p-1.5 rounded-lg bg-white border border-red-100 text-red-400 hover:bg-red-50"><Trash2 size={14} /></button>
                      </div>
                      <div className="font-nav text-xs text-gray-500 space-y-1">
                        <p><b>Periode:</b> {item.periode || '-'}</p>
                        <p><b>Bagi Hasil:</b> {item.mekanisme || '-'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: DOKUMEN */}
        {activeTab === 'dokumen' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="font-nav font-bold text-gray-800 mb-4 flex items-center gap-2"><Upload size={18} style={{ color: '#01bcce' }} />Upload Dokumen / Laporan</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="sm:col-span-2">
                  <label className="font-nav text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Pilih Mitra KSO</label>
                  <select value={namaKso} onChange={e => setNamaKso(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 font-nav text-sm outline-none focus:border-cyan-400">
                    <option value="">-- Pilih Mitra --</option>
                    {mitraList.map(m => <option key={m.id} value={m.nama}>{m.nama}</option>)}
                  </select>
                </div>
                <div>
                  <label className="font-nav text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Periode / Jenis Laporan</label>
                  <input type="text" value={periode} onChange={e => setPeriode(e.target.value)} placeholder="Contoh: Triwulan 1 / Semester 1" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 font-nav text-sm outline-none focus:border-cyan-400" />
                </div>
                <div>
                  <label className="font-nav text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Tahun</label>
                  <select value={tahun} onChange={e => setTahun(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 font-nav text-sm outline-none focus:border-cyan-400">
                    {[2023,2024,2025,2026,2027,2028,2029].map(y => <option key={y}>{y}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="font-nav text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">File PDF Laporan</label>
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-cyan-400 transition-colors bg-gray-50" onClick={() => fileRef.current?.click()}>
                    {file ? <p className="font-nav text-sm font-semibold text-cyan-600">📄 {file.name}</p> : <p className="font-nav text-sm text-gray-400">Klik untuk pilih file laporan (disarankan PDF)</p>}
                    <input ref={fileRef} type="file" accept=".pdf,.xlsx,.xls,.doc,.docx" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
                  </div>
                </div>
              </div>
              {msgDokumen && <div className={`mb-4 px-4 py-3 rounded-xl font-nav text-sm ${msgDokumen.startsWith('✅') ? 'bg-green-50 text-green-700' : msgDokumen.startsWith('⚠️') ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-600'}`}>{msgDokumen}</div>}
              <div className="flex justify-end">
                <button onClick={handleUploadDokumen} disabled={uploading} className="flex items-center gap-2 px-6 py-3 rounded-xl font-nav font-bold text-sm text-white disabled:opacity-60 hover:opacity-90 transition-opacity" style={{ background: '#00282b' }}>
                  <Upload size={16} />{uploading ? 'Mengupload...' : 'Upload Laporan'}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="font-nav font-bold text-gray-800 mb-4">Daftar Dokumen KSO <span className="font-normal text-xs text-gray-400">({dokumenList.length} file)</span></h2>
              {dokumenList.length === 0 ? <p className="font-nav text-sm text-gray-400">Belum ada dokumen yang diupload.</p> : (
                <div className="space-y-3">
                  {dokumenList.map((item: any) => (
                    <div key={item.id} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50">
                      <div className="flex-1 min-w-0">
                        <p className="font-nav font-bold text-sm text-gray-800">{item.nama_kso}</p>
                        <p className="font-nav text-xs text-gray-500 mt-1">{item.periode} · Tahun {item.tahun}</p>
                      </div>
                      <a href={item.file_url} target="_blank" className="font-nav text-xs font-bold px-3 py-1.5 rounded-lg border border-cyan-100 hover:bg-cyan-50 transition-colors" style={{ color: '#01bcce' }}>Lihat PDF</a>
                      <button onClick={() => handleDeleteDokumen(item.id, item.file_url)} className="p-1.5 rounded-lg bg-white border border-red-100 text-red-400 hover:bg-red-50"><Trash2 size={14} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
