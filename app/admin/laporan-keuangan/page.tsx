'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { deleteFileFromStorage } from '@/lib/supabase/storage-helper'
import { Upload, Trash2, FileText, Plus, ExternalLink, Link as LinkIcon, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

interface LaporanItem {
  id: string
  judul: string
  periode?: string
  tahun: number
  file_url: string
  file_name?: string
  created_at?: string
}

interface UnduhItem {
  id: string
  dbId?: string
  source: 'financial_reports_data' | 'download_dokumen'
  nama: string
  tahun: string | number
  file_url: string
  file_name?: string
  created_at?: string
}

function AdminLaporanKeuanganContent() {
  const searchParams = useSearchParams()
  const [tab, setTab] = useState<'laporan' | 'catatan' | 'unduh'>('laporan')

  // State Laporan & Catatan
  const [judul, setJudul] = useState('')
  const [periode, setPeriode] = useState('Semester 1')
  const [tahun, setTahun] = useState(String(new Date().getFullYear()))
  const [file, setFile] = useState<File | null>(null)

  // State Unduh Dokumen
  const [judulUnduh, setJudulUnduh] = useState('')
  const [tahunUnduh, setTahunUnduh] = useState(String(new Date().getFullYear()))
  const [tipeUnduh, setTipeUnduh] = useState<'link' | 'upload'>('link')
  const [linkUnduh, setLinkUnduh] = useState('')
  const [fileUnduh, setFileUnduh] = useState<File | null>(null)

  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [laporan, setLaporan] = useState<LaporanItem[]>([])
  const [catatan, setCatatan] = useState<LaporanItem[]>([])
  const [unduhList, setUnduhList] = useState<UnduhItem[]>([])

  const fileRef = useRef<HTMLInputElement>(null)
  const fileUnduhRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => {
    const t = searchParams.get('tab')
    if (t === 'catatan' || t === 'unduh') {
      setTab(t)
    }
  }, [searchParams])

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [{ data: l }, { data: c }, { data: u }, { data: d }] = await Promise.all([
        supabase.from('laporan_keuangan').select('*').order('tahun', { ascending: false }),
        supabase.from('catatan_laporan_keuangan').select('*').order('tahun', { ascending: false }),
        supabase.from('financial_reports_data').select('*').eq('category', 'unduh_dokumen').order('year', { ascending: false }),
        supabase.from('download_dokumen').select('*').order('created_at', { ascending: false })
      ])

      setLaporan(l || [])
      setCatatan(c || [])

      const docs: UnduhItem[] = []
      ;(u || []).forEach((f: any) => {
        docs.push({
          id: f.item_name || f.id,
          dbId: f.id,
          source: 'financial_reports_data',
          nama: f.data?.nama || f.item_name,
          tahun: f.data?.tahun || f.year,
          file_url: f.data?.file_url || '#',
          file_name: f.data?.file_name,
          created_at: f.data?.created_at || f.created_at
        })
      })

      ;(d || []).forEach((item: any) => {
        docs.push({
          id: item.id,
          dbId: item.id,
          source: 'download_dokumen',
          nama: item.nama,
          tahun: item.kategori || item.tahun || '-',
          file_url: item.file_url,
          file_name: item.file_name,
          created_at: item.created_at
        })
      })

      // Remove duplicate by name + URL
      const map = new Map<string, UnduhItem>()
      docs.forEach(item => {
        const k = (item.nama + '-' + item.file_url).toLowerCase().trim()
        if (!map.has(k)) map.set(k, item)
      })
      setUnduhList(Array.from(map.values()))
    } catch (err: any) {
      console.error('Error loading data:', err)
    }
  }

  // Upload Laporan Keuangan & Catatan Atas Laporan
  async function handleUploadLaporan() {
    if (!file || !judul.trim()) {
      setMessage('⚠️ Lengkapi judul dan pilih file!')
      return
    }
    setUploading(true)
    setMessage('')

    try {
      const fileName = `${Date.now()}-${file.name}`
      const { error: uploadError } = await supabase.storage
        .from('rscm-files')
        .upload(fileName, file)

      if (uploadError) {
        setMessage('❌ Gagal upload file: ' + uploadError.message)
        setUploading(false)
        return
      }

      const { data: { publicUrl } } = supabase.storage.from('rscm-files').getPublicUrl(fileName)

      const table = tab === 'laporan' ? 'laporan_keuangan' : 'catatan_laporan_keuangan'
      const dataToInsert: any = {
        judul: judul.trim(),
        tahun: parseInt(tahun) || new Date().getFullYear(),
        file_url: publicUrl,
        file_name: file.name
      }
      if (tab === 'laporan') dataToInsert.periode = periode

      const { error } = await supabase.from(table).insert(dataToInsert)
      if (error) {
        setMessage('❌ Gagal menyimpan: ' + error.message)
      } else {
        setMessage('✅ Berhasil diupload!')
        setJudul('')
        setFile(null)
        if (fileRef.current) fileRef.current.value = ''
        loadData()
      }
    } catch (err: any) {
      setMessage('❌ Terjadi kesalahan: ' + err.message)
    } finally {
      setUploading(false)
      setTimeout(() => setMessage(''), 4000)
    }
  }

  // Simpan Unduh Dokumen (Link URL atau File Upload)
  async function handleSaveUnduhDokumen() {
    if (!judulUnduh.trim()) {
      setMessage('⚠️ Judul dokumen wajib diisi!')
      return
    }

    if (tipeUnduh === 'link' && !linkUnduh.trim()) {
      setMessage('⚠️ Masukkan link dokumen / Google Drive!')
      return
    }

    if (tipeUnduh === 'upload' && !fileUnduh) {
      setMessage('⚠️ Silakan pilih file dokumen untuk diupload!')
      return
    }

    setUploading(true)
    setMessage('')

    try {
      let finalUrl = linkUnduh.trim()
      let uploadedFileName: string | undefined

      if (tipeUnduh === 'upload' && fileUnduh) {
        const fileName = `${Date.now()}-${fileUnduh.name}`
        const { error: uploadError } = await supabase.storage
          .from('rscm-files')
          .upload(fileName, fileUnduh)

        if (uploadError) {
          setMessage('❌ Gagal upload file: ' + uploadError.message)
          setUploading(false)
          return
        }

        const { data: { publicUrl } } = supabase.storage.from('rscm-files').getPublicUrl(fileName)
        finalUrl = publicUrl
        uploadedFileName = fileUnduh.name
      }

      const docId = `doc-${Date.now()}`
      const itemData = {
        id: docId,
        nama: judulUnduh.trim(),
        tahun: tahunUnduh.trim() || String(new Date().getFullYear()),
        file_url: finalUrl,
        file_name: uploadedFileName,
        created_at: new Date().toISOString()
      }

      const { error } = await supabase.from('financial_reports_data').insert({
        category: 'unduh_dokumen',
        year: parseInt(itemData.tahun) || new Date().getFullYear(),
        item_name: docId,
        data: itemData
      })

      if (error) {
        setMessage('❌ Gagal menyimpan dokumen: ' + error.message)
      } else {
        setMessage('✅ Dokumen berhasil ditambahkan ke daftar Unduh Dokumen!')
        setJudulUnduh('')
        setLinkUnduh('')
        setFileUnduh(null)
        if (fileUnduhRef.current) fileUnduhRef.current.value = ''
        loadData()
      }
    } catch (err: any) {
      setMessage('❌ Terjadi kesalahan: ' + err.message)
    } finally {
      setUploading(false)
      setTimeout(() => setMessage(''), 4000)
    }
  }

  // Delete Laporan / Catatan
  async function handleDeleteLaporan(id: string, fileUrl: string, isLaporan: boolean) {
    if (!confirm('Hapus file ini?')) return
    const table = isLaporan ? 'laporan_keuangan' : 'catatan_laporan_keuangan'
    await Promise.all([
      supabase.from(table).delete().eq('id', id),
      deleteFileFromStorage(supabase, fileUrl)
    ])
    loadData()
  }

  // Delete Unduh Dokumen
  async function handleDeleteUnduh(item: UnduhItem) {
    if (!confirm(`Hapus dokumen "${item.nama}" dari daftar Unduh Dokumen?`)) return
    try {
      if (item.source === 'download_dokumen') {
        await supabase.from('download_dokumen').delete().eq('id', item.id)
      } else {
        await supabase.from('financial_reports_data').delete().eq('category', 'unduh_dokumen').eq('item_name', item.id)
      }

      if (item.file_url) {
        await deleteFileFromStorage(supabase, item.file_url)
      }
      loadData()
    } catch (err: any) {
      console.error('Error deleting document:', err)
    }
  }

  const currentList = tab === 'laporan' ? laporan : catatan

  return (
    <div className="min-h-screen" style={{ background: '#f0f4f5' }}>
      <div style={{ background: '#00282b' }} className="px-4 sm:px-6 py-6">
        <div className="max-w-5xl mx-auto">
          <p className="font-nav text-xs text-white/50 mb-1">
            <Link href="/admin/dashboard" className="hover:text-white transition-colors">← Dashboard</Link>
          </p>
          <h1 className="font-nav font-bold text-white text-xl">Laporan Keuangan & Unduh Dokumen</h1>
          <p className="font-nav text-xs text-white/70 mt-1">
            Kelola dokumen publik untuk halaman Akuntansi dan Keuangan
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Tab Navigation */}
        <div className="flex gap-2 bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 w-fit flex-wrap">
          {[
            ['laporan', 'Laporan Keuangan'],
            ['catatan', 'Catatan Atas Laporan'],
            ['unduh', 'Unduh Dokumen']
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => { setTab(key as any); setMessage('') }}
              className={`px-5 py-2.5 rounded-xl font-nav font-bold text-sm transition-all duration-200 cursor-pointer ${
                tab === key ? 'text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
              style={tab === key ? { background: '#00282b' } : {}}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ================= TAB UNDUH DOKUMEN ================= */}
        {tab === 'unduh' ? (
          <>
            {/* Form Tambah Unduh Dokumen */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100">
              <h2 className="font-nav font-bold text-gray-800 text-lg mb-1 flex items-center gap-2">
                <Plus size={20} style={{ color: '#01bcce' }} />
                Tambah Dokumen ke Bagian &quot;Unduh Dokumen&quot;
              </h2>
              <p className="font-nav text-xs text-gray-400 mb-6">
                Dokumen yang ditambahkan di sini akan tampil di section Unduh Dokumen pada halaman publik Akuntansi & Keuangan.
              </p>

              {/* Mode Selection: Link vs Upload */}
              <div className="flex items-center gap-3 mb-6 p-1.5 bg-gray-50 rounded-xl w-fit border border-gray-100">
                <button
                  type="button"
                  onClick={() => setTipeUnduh('link')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-nav text-xs font-bold transition-all cursor-pointer ${
                    tipeUnduh === 'link' ? 'bg-white text-[#00282b] shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <LinkIcon size={14} style={{ color: tipeUnduh === 'link' ? '#01bcce' : undefined }} />
                  Link URL / Google Drive
                </button>
                <button
                  type="button"
                  onClick={() => setTipeUnduh('upload')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-nav text-xs font-bold transition-all cursor-pointer ${
                    tipeUnduh === 'upload' ? 'bg-white text-[#00282b] shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Upload size={14} style={{ color: tipeUnduh === 'upload' ? '#01bcce' : undefined }} />
                  Upload File Langsung
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                <div className="sm:col-span-2">
                  <label className="font-nav text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">
                    Judul Dokumen *
                  </label>
                  <input
                    type="text"
                    value={judulUnduh}
                    onChange={e => setJudulUnduh(e.target.value)}
                    placeholder="Contoh: Pedoman Pengelolaan Keuangan & Akuntansi BLU RSCM"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 font-nav text-sm outline-none focus:border-[#01bcce] focus:ring-1 focus:ring-[#01bcce]"
                  />
                </div>

                <div>
                  <label className="font-nav text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">
                    Tahun Dokumen
                  </label>
                  <input
                    type="text"
                    value={tahunUnduh}
                    onChange={e => setTahunUnduh(e.target.value)}
                    placeholder="Contoh: 2026"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 font-nav text-sm outline-none focus:border-[#01bcce] focus:ring-1 focus:ring-[#01bcce]"
                  />
                </div>

                {tipeUnduh === 'link' ? (
                  <div className="sm:col-span-3">
                    <label className="font-nav text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">
                      Link Dokumen (Google Drive / URL) *
                    </label>
                    <input
                      type="url"
                      value={linkUnduh}
                      onChange={e => setLinkUnduh(e.target.value)}
                      placeholder="https://drive.google.com/file/d/... atau https://..."
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 font-nav text-sm outline-none focus:border-[#01bcce] focus:ring-1 focus:ring-[#01bcce]"
                    />
                  </div>
                ) : (
                  <div className="sm:col-span-3">
                    <label className="font-nav text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">
                      Pilih File Dokumen (PDF, Excel, Word) *
                    </label>
                    <div
                      className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-[#01bcce] transition-colors cursor-pointer bg-[#fafbfc]"
                      onClick={() => fileUnduhRef.current?.click()}
                    >
                      {fileUnduh ? (
                        <p className="font-nav text-sm font-semibold flex items-center justify-center gap-2" style={{ color: '#01bcce' }}>
                          <FileText size={18} /> {fileUnduh.name} ({(fileUnduh.size / (1024 * 1024)).toFixed(2)} MB)
                        </p>
                      ) : (
                        <>
                          <Upload size={24} className="mx-auto mb-2 text-gray-300" />
                          <p className="font-nav text-sm text-gray-400">Klik untuk pilih file atau seret ke sini</p>
                          <p className="font-nav text-xs text-gray-300 mt-1">PDF, XLSX, DOCX — maksimal 20MB</p>
                        </>
                      )}
                      <input
                        ref={fileUnduhRef}
                        type="file"
                        accept=".pdf,.xlsx,.xls,.doc,.docx"
                        className="hidden"
                        onChange={e => setFileUnduh(e.target.files?.[0] || null)}
                      />
                    </div>
                  </div>
                )}
              </div>

              {message && (
                <div className={`mb-4 px-4 py-3 rounded-xl font-nav text-sm border ${
                  message.startsWith('✅') ? 'bg-green-50 text-green-700 border-green-200' :
                  message.startsWith('⚠️') ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                  'bg-red-50 text-red-600 border-red-200'
                }`}>
                  {message}
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveUnduhDokumen}
                  disabled={uploading}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl font-nav font-bold text-sm text-white disabled:opacity-60 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer shadow-sm"
                  style={{ background: '#00282b' }}
                >
                  <Plus size={16} />
                  {uploading ? 'Menyimpan...' : 'Simpan Dokumen'}
                </button>
              </div>
            </div>

            {/* List Unduh Dokumen */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-nav font-bold text-gray-800 text-lg">
                  Daftar Unduh Dokumen
                  <span className="ml-2 font-nav text-xs text-gray-400 font-normal">({unduhList.length} dokumen)</span>
                </h2>
              </div>

              {unduhList.length === 0 ? (
                <p className="font-nav text-sm text-gray-400 py-6 text-center">Belum ada dokumen unduhan yang tersimpan.</p>
              ) : (
                <div className="space-y-3">
                  {unduhList.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors bg-white hover:bg-gray-50/50"
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(1,188,206,0.1)', color: '#01bcce' }}
                      >
                        <FileText size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-nav font-bold text-sm text-gray-800 truncate">{item.nama}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-nav text-xs text-gray-400">Tahun {item.tahun}</span>
                          <span className="text-gray-300 text-xs">•</span>
                          <span className="font-nav text-xs text-gray-400 truncate max-w-xs">{item.file_url}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={item.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-nav text-xs font-bold px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1.5"
                          style={{ background: 'rgba(1,188,206,0.1)', color: '#01bcce' }}
                        >
                          <ExternalLink size={13} />
                          Buka
                        </a>
                        <button
                          type="button"
                          onClick={() => handleDeleteUnduh(item)}
                          className="p-1.5 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 transition-colors cursor-pointer"
                          title="Hapus Dokumen"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          /* ================= TAB LAPORAN & CATATAN ================= */
          <>
            {/* Upload Form Laporan / Catatan */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100">
              <h2 className="font-nav font-bold text-gray-800 text-lg mb-4 flex items-center gap-2">
                <Plus size={18} style={{ color: '#01bcce' }} />
                Upload {tab === 'laporan' ? 'Laporan Keuangan' : 'Catatan Atas Laporan'}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="sm:col-span-2">
                  <label className="font-nav text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Judul</label>
                  <input
                    type="text"
                    value={judul}
                    onChange={e => setJudul(e.target.value)}
                    placeholder={tab === 'laporan' ? 'Laporan Keuangan Semester 1 2025' : 'CALK Tahun 2025'}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 font-nav text-sm outline-none focus:border-[#01bcce]"
                  />
                </div>
                {tab === 'laporan' && (
                  <div>
                    <label className="font-nav text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Periode</label>
                    <select
                      value={periode}
                      onChange={e => setPeriode(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 font-nav text-sm outline-none focus:border-[#01bcce]"
                    >
                      <option>Semester 1</option>
                      <option>Semester 2</option>
                      <option>Tahunan</option>
                    </select>
                  </div>
                )}
                <div>
                  <label className="font-nav text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Tahun</label>
                  <select
                    value={tahun}
                    onChange={e => setTahun(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 font-nav text-sm outline-none focus:border-[#01bcce]"
                  >
                    {[2023, 2024, 2025, 2026, 2027].map(y => <option key={y}>{y}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="font-nav text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">File (PDF, Excel, Word)</label>
                  <div
                    className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-[#01bcce] transition-colors cursor-pointer bg-[#fafbfc]"
                    onClick={() => fileRef.current?.click()}
                  >
                    {file ? (
                      <p className="font-nav text-sm font-semibold" style={{ color: '#01bcce' }}>📄 {file.name}</p>
                    ) : (
                      <>
                        <Upload size={24} className="mx-auto mb-2 text-gray-300" />
                        <p className="font-nav text-sm text-gray-400">Klik untuk pilih file atau drag & drop</p>
                        <p className="font-nav text-xs text-gray-300 mt-1">PDF, XLSX, DOCX — maks. 20MB</p>
                      </>
                    )}
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".pdf,.xlsx,.xls,.doc,.docx"
                      className="hidden"
                      onChange={e => setFile(e.target.files?.[0] || null)}
                    />
                  </div>
                </div>
              </div>

              {message && (
                <div className={`mb-4 px-4 py-3 rounded-xl font-nav text-sm border ${
                  message.startsWith('✅') ? 'bg-green-50 text-green-700 border-green-200' :
                  message.startsWith('⚠️') ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                  'bg-red-50 text-red-600 border-red-200'
                }`}>
                  {message}
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleUploadLaporan}
                  disabled={uploading}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl font-nav font-bold text-sm text-white disabled:opacity-60 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer shadow-sm"
                  style={{ background: '#00282b' }}
                >
                  <Upload size={16} />
                  {uploading ? 'Mengupload...' : 'Upload File'}
                </button>
              </div>
            </div>

            {/* List Laporan / Catatan */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100">
              <h2 className="font-nav font-bold text-gray-800 text-lg mb-4">
                Daftar {tab === 'laporan' ? 'Laporan Keuangan' : 'Catatan Atas Laporan'}
                <span className="ml-2 font-nav text-xs text-gray-400 font-normal">({currentList.length} file)</span>
              </h2>
              {currentList.length === 0 ? (
                <p className="font-nav text-sm text-gray-400 py-6 text-center">Belum ada file yang diupload.</p>
              ) : (
                <div className="space-y-3">
                  {currentList.map((item: any) => (
                    <div key={item.id} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors bg-white hover:bg-gray-50/50">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(1,188,206,0.1)', color: '#01bcce' }}
                      >
                        <FileText size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-nav font-bold text-sm text-gray-800 truncate">{item.judul}</p>
                        <p className="font-nav text-xs text-gray-400">
                          {item.periode && `${item.periode} · `}Tahun {item.tahun}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <a
                          href={item.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-nav text-xs font-bold px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1"
                          style={{ background: 'rgba(1,188,206,0.1)', color: '#01bcce' }}
                        >
                          <ExternalLink size={13} />
                          Lihat
                        </a>
                        <button
                          type="button"
                          onClick={() => handleDeleteLaporan(item.id, item.file_url, tab === 'laporan')}
                          className="p-1.5 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 transition-colors cursor-pointer"
                          title="Hapus File"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function AdminLaporanKeuanganPage() {
  return (
    <Suspense fallback={<div className="min-h-screen p-8 text-center font-nav text-sm text-gray-400" style={{ background: '#f0f4f5' }}>Memuat...</div>}>
      <AdminLaporanKeuanganContent />
    </Suspense>
  )
}
