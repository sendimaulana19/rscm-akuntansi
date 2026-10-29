'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { deleteFileFromStorage } from '@/lib/supabase/storage-helper'
import { Trash2, Plus, ToggleLeft, ToggleRight, Edit2, X, Bold } from 'lucide-react'
import Link from 'next/link'

export default function AdminPengumumanPage() {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [judul, setJudul] = useState('')
  const [konten, setKonten] = useState('')
  const [jenis, setJenis] = useState<'teks' | 'gambar' | 'pdf'>('teks')
  const [file, setFile] = useState<File | null>(null)
  const [existingFileUrl, setExistingFileUrl] = useState<string | null>(null)
  const [isActive, setIsActive] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [data, setData] = useState<any[]>([])
  const fileRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const supabase = createClient()

  useEffect(() => { loadData() }, [])
  async function loadData() {
    const { data: d } = await supabase.from('pengumuman').select('*').order('created_at', { ascending: false })
    setData(d || [])
  }

  function resetForm() {
    setEditingId(null)
    setJudul('')
    setKonten('')
    setJenis('teks')
    setFile(null)
    setExistingFileUrl(null)
    setIsActive(true)
    if (fileRef.current) fileRef.current.value = ''
  }

  function handleEdit(item: any) {
    setEditingId(item.id)
    setJudul(item.judul || '')
    setKonten(item.konten || '')
    setJenis(item.jenis || 'teks')
    setFile(null)
    setExistingFileUrl(item.file_url || null)
    setIsActive(item.is_active ?? true)
    if (fileRef.current) fileRef.current.value = ''
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleBoldSelection() {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const selected = konten.slice(start, end)
    const wrapped = selected ? `**${selected}**` : `**teks tebal**`
    const next = konten.slice(0, start) + wrapped + konten.slice(end)
    setKonten(next)
    setTimeout(() => {
      el.focus()
      el.setSelectionRange(start + 2, start + 2 + (selected ? selected.length : 10))
    }, 0)
  }

  async function handleSave() {
    if (!judul) { setMessage('⚠️ Judul wajib diisi!'); return }
    setUploading(true); setMessage('')
    let fileUrl = existingFileUrl

    if (file && jenis !== 'teks') {
      const bucket = jenis === 'gambar' ? 'rscm-images' : 'rscm-files'
      const fileName = `${Date.now()}-${file.name}`
      const { error: upErr } = await supabase.storage.from(bucket).upload(fileName, file)
      if (!upErr) {
        const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(fileName)
        fileUrl = publicUrl
      }
    } else if (jenis === 'teks') {
      fileUrl = null
    }

    if (editingId) {
      const { error } = await supabase
        .from('pengumuman')
        .update({
          judul,
          konten,
          jenis,
          file_url: fileUrl,
          is_active: isActive,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingId)

      if (error) {
        setMessage('❌ Gagal memperbarui: ' + error.message)
      } else {
        setMessage('✅ Pengumuman berhasil diperbarui!')
        resetForm()
        loadData()
      }
    } else {
      const { error } = await supabase
        .from('pengumuman')
        .insert({ judul, konten, jenis, file_url: fileUrl, is_active: isActive })

      if (error) {
        setMessage('❌ Gagal simpan: ' + error.message)
      } else {
        setMessage('✅ Berhasil!')
        resetForm()
        loadData()
      }
    }
    setUploading(false); setTimeout(() => setMessage(''), 4000)
  }

  async function toggleActive(id: string, current: boolean) {
    await supabase.from('pengumuman').update({ is_active: !current }).eq('id', id)
    loadData()
  }

  async function handleDelete(id: string) {
    if (!confirm('Hapus pengumuman ini?')) return
    const item = data.find(p => p.id === id)
    if (item?.file_url) {
      await deleteFileFromStorage(supabase, item.file_url)
    }
    await supabase.from('pengumuman').delete().eq('id', id)
    if (editingId === id) resetForm()
    loadData()
  }

  return (
    <div className="min-h-screen" style={{ background: '#f0f4f5' }}>
      <div style={{ background: '#00282b' }} className="px-6 py-6">
        <div className="max-w-4xl mx-auto">
          <p className="font-nav text-xs text-white/50 mb-1"><Link href="/admin/dashboard" className="hover:text-white">← Dashboard</Link></p>
          <h1 className="font-nav font-bold text-white text-xl">Pengumuman</h1>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-nav font-bold text-gray-800 flex items-center gap-2">
              {editingId ? <Edit2 size={18} style={{ color: '#01bcce' }} /> : <Plus size={18} style={{ color: '#01bcce' }} />}
              {editingId ? 'Edit Pengumuman' : 'Tambah Pengumuman'}
            </h2>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg font-nav text-xs font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <X size={14} /> Batal Edit
              </button>
            )}
          </div>
          <div className="space-y-4">
            <div>
              <label className="font-nav text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Judul</label>
              <input type="text" value={judul} onChange={e => setJudul(e.target.value)} placeholder="Judul pengumuman" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 font-nav text-sm outline-none" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-nav text-xs font-bold text-gray-500 uppercase tracking-wide">Konten / Isi</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleBoldSelection}
                    title="Tebalkan teks terpilih (**teks**)"
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 font-nav text-xs font-bold text-gray-700 transition-colors"
                  >
                    <Bold size={13} /> Tebal (Bold)
                  </button>
                  <span className="font-nav text-[11px] text-gray-400">
                    Baris baru (Enter) & paragraf otomatis dipertahankan
                  </span>
                </div>
              </div>
              <textarea
                ref={textareaRef}
                value={konten}
                onChange={e => setKonten(e.target.value)}
                rows={10}
                placeholder="Isi pengumuman... (Tekan Enter untuk baris/paragraf baru. Gunakan **teks** atau tombol Tebal untuk huruf tebal)"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 font-nav text-sm outline-none resize-y leading-relaxed"
              />
            </div>
            <div>
              <label className="font-nav text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Jenis Lampiran</label>
              <div className="flex gap-2 flex-wrap">
                {(['teks', 'gambar', 'pdf'] as const).map(j => (
                  <button key={j} type="button" onClick={() => setJenis(j)}
                    className="px-4 py-2 rounded-lg font-nav font-bold text-sm transition-all"
                    style={{ background: jenis === j ? '#00282b' : '#f0f4f5', color: jenis === j ? '#d0db41' : '#666' }}>
                    {j === 'teks' ? '📝 Teks Saja' : j === 'gambar' ? '🖼️ Gambar' : '📄 PDF'}
                  </button>
                ))}
              </div>
            </div>
            {jenis !== 'teks' && (
              <div>
                <label className="font-nav text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">File Lampiran</label>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:border-cyan-400 transition-colors" onClick={() => fileRef.current?.click()}>
                  {file ? (
                    <p className="font-nav text-sm text-cyan-600 font-semibold">📎 {file.name}</p>
                  ) : existingFileUrl ? (
                    <p className="font-nav text-sm text-emerald-600 font-semibold">📎 Lampiran saat ini tersimpan (Klik untuk mengganti file)</p>
                  ) : (
                    <p className="font-nav text-sm text-gray-400">Klik untuk pilih file</p>
                  )}
                  <input ref={fileRef} type="file" accept={jenis === 'gambar' ? 'image/*' : '.pdf'} className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <span className="font-nav text-sm font-bold text-gray-700">Status Aktif:</span>
              <button type="button" onClick={() => setIsActive(!isActive)}>
                {isActive ? <ToggleRight size={28} style={{ color: '#01bcce' }} /> : <ToggleLeft size={28} className="text-gray-400" />}
              </button>
              <span className="font-nav text-xs text-gray-500">{isActive ? 'Aktif (akan tampil di website)' : 'Tidak Aktif'}</span>
            </div>
          </div>
          {message && <div className={`mt-4 px-4 py-3 rounded-xl font-nav text-sm ${message.startsWith('✅') ? 'bg-green-50 text-green-700' : message.startsWith('⚠️') ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-600'}`}>{message}</div>}
          <div className="flex justify-end mt-4">
            <button onClick={handleSave} disabled={uploading} className="flex items-center gap-2 px-6 py-3 rounded-xl font-nav font-bold text-sm text-white disabled:opacity-60" style={{ background: '#00282b' }}>
              {editingId ? <Edit2 size={16} /> : <Plus size={16} />}
              {uploading ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Simpan'}
            </button>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-nav font-bold text-gray-800 mb-4">Daftar Pengumuman <span className="font-normal text-xs text-gray-400">({data.length} item)</span></h2>
          {data.length === 0 ? <p className="font-nav text-sm text-gray-400">Belum ada pengumuman.</p> : (
            <div className="space-y-3">
              {data.map((item: any) => (
                <div key={item.id} className="flex items-start gap-4 p-4 rounded-xl border border-gray-100">
                  <div className="flex-1 min-w-0">
                    <p className="font-nav font-bold text-sm text-gray-800">{item.judul}</p>
                    <p className="font-nav text-xs text-gray-500 mt-1 line-clamp-3 whitespace-pre-line">{item.konten}</p>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-nav font-bold ${item.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {item.is_active ? '● Aktif' : '○ Nonaktif'}
                    </span>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => handleEdit(item)}
                      className="font-nav text-xs font-bold px-3 py-1.5 rounded-lg bg-cyan-50 text-cyan-700 hover:bg-cyan-100 transition-all flex items-center gap-1"
                    >
                      <Edit2 size={13} /> Edit
                    </button>
                    <button onClick={() => toggleActive(item.id, item.is_active)}
                      className="font-nav text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
                      style={{ background: item.is_active ? '#fff3e0' : '#e8f5e9', color: item.is_active ? '#e65100' : '#2e7d32' }}>
                      {item.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg bg-red-50 text-red-400"><Trash2 size={14} /></button>
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
