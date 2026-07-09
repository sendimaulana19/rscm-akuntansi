'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Upload, Trash2, Plus } from 'lucide-react'
import Link from 'next/link'

const KATEGORI_JABATAN_OPTIONS = [
  'Manajer',
  'Sekretaris',
  'Asisten Manajer',
  'Team Leader',
  'Staff'
]

const SUB_TIM_OPTIONS = [
  '-',
  'Sub Tim Akuntansi Keuangan',
  'Sub Tim Akuntansi Manajemen',
  'Sub Tim Akuntansi Verifikasi'
]

export default function AdminOurTeamsPage() {
  const [nama, setNama] = useState('')
  const [kategoriJabatan, setKategoriJabatan] = useState('Staff')
  const [subTim, setSubTim] = useState('-')
  const [urutan, setUrutan] = useState('1')
  const [foto, setFoto] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [data, setData] = useState<any[]>([])
  const fotoRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => { loadData() }, [])
  async function loadData() {
    const { data: d } = await supabase.from('our_teams').select('*').order('urutan', { ascending: true })
    setData(d || [])
  }

  async function handleUpload() {
    if (!nama) { setMessage('⚠️ Nama wajib diisi!'); return }
    setUploading(true); setMessage('')
    let fotoUrl = null
    if (foto) {
      const fileName = `team-${Date.now()}-${foto.name}`
      const { error: upErr } = await supabase.storage.from('rscm-images').upload(fileName, foto)
      if (!upErr) {
        const { data: { publicUrl } } = supabase.storage.from('rscm-images').getPublicUrl(fileName)
        fotoUrl = publicUrl
      }
    }
    
    // Save as delimited string
    const finalJabatan = subTim === '-' ? kategoriJabatan : `${kategoriJabatan}|${subTim}`

    const { error } = await supabase.from('our_teams').insert({ nama, jabatan: finalJabatan, urutan: parseInt(urutan), foto_url: fotoUrl })
    if (error) { setMessage('❌ Gagal simpan: ' + error.message) }
    else { 
      setMessage('✅ Berhasil!'); 
      setNama(''); 
      setKategoriJabatan('Staff'); 
      setSubTim('-'); 
      setUrutan('1'); 
      setFoto(null); 
      if (fotoRef.current) fotoRef.current.value = ''; 
      loadData() 
    }
    setUploading(false); setTimeout(() => setMessage(''), 4000)
  }

  async function handleDelete(id: string) {
    if (!confirm('Hapus anggota ini?')) return
    await supabase.from('our_teams').delete().eq('id', id)
    loadData()
  }

  // Parse helper for display
  const parseJabatan = (raw: string) => {
    const parts = raw.split('|')
    return {
      kategori: parts[0] || '',
      sub: parts.length > 1 ? parts[1] : '-'
    }
  }

  return (
    <div className="min-h-screen" style={{ background: '#f0f4f5' }}>
      <div style={{ background: '#00282b' }} className="px-6 py-6">
        <div className="max-w-4xl mx-auto">
          <p className="font-nav text-xs text-white/50 mb-1"><Link href="/admin/dashboard" className="hover:text-white">← Dashboard</Link></p>
          <h1 className="font-nav font-bold text-white text-xl">Our Teams</h1>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-nav font-bold text-gray-800 mb-4 flex items-center gap-2"><Plus size={18} style={{ color: '#01bcce' }} />Tambah Anggota Tim</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-nav text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Nama Lengkap</label>
              <input type="text" value={nama} onChange={e => setNama(e.target.value)} placeholder="Contoh: Budi Santoso" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 font-nav text-sm outline-none bg-gray-50/50 focus:bg-white focus:border-cyan-400 transition-colors" />
            </div>
            <div>
              <label className="font-nav text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Kategori Jabatan</label>
              <select value={kategoriJabatan} onChange={e => setKategoriJabatan(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 font-nav text-sm outline-none bg-gray-50/50 focus:bg-white focus:border-cyan-400 transition-colors">
                {KATEGORI_JABATAN_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            <div>
              <label className="font-nav text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Sub Tim</label>
              <select value={subTim} onChange={e => setSubTim(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 font-nav text-sm outline-none bg-gray-50/50 focus:bg-white focus:border-cyan-400 transition-colors">
                {SUB_TIM_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            <div>
              <label className="font-nav text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Urutan Tampil (No. Urut)</label>
              <input type="number" min="1" value={urutan} onChange={e => setUrutan(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 font-nav text-sm outline-none bg-gray-50/50 focus:bg-white focus:border-cyan-400 transition-colors" />
            </div>
            <div className="sm:col-span-2">
              <label className="font-nav text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Foto (Transparan / Tanpa Background direkomendasikan)</label>
              <div className="border-2 border-dashed border-gray-200 bg-gray-50/50 rounded-xl p-4 text-center cursor-pointer hover:border-cyan-400 hover:bg-cyan-50/30 transition-all" onClick={() => fotoRef.current?.click()}>
                {foto ? <p className="font-nav text-sm text-cyan-600 font-bold">🖼️ {foto.name}</p> : <p className="font-nav text-sm text-gray-500">Klik di sini untuk memilih file foto</p>}
                <input ref={fotoRef} type="file" accept="image/*" className="hidden" onChange={e => setFoto(e.target.files?.[0] || null)} />
              </div>
            </div>
          </div>
          {message && <div className={`mt-4 px-4 py-3 rounded-xl font-nav text-sm font-semibold ${message.startsWith('✅') ? 'bg-green-50 text-green-700' : message.startsWith('⚠️') ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-600'}`}>{message}</div>}
          <div className="flex justify-end mt-6 pt-4 border-t border-gray-100">
            <button onClick={handleUpload} disabled={uploading} className="flex items-center gap-2 px-8 py-3 rounded-xl font-nav font-bold text-sm text-white disabled:opacity-60 hover:opacity-90 transition-opacity" style={{ background: '#00282b' }}>
              <Upload size={16} />{uploading ? 'Menyimpan...' : 'Simpan Data'}
            </button>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-nav font-bold text-gray-800 mb-6 text-lg">Daftar Anggota Tim <span className="font-normal text-sm text-gray-400 ml-1">({data.length} orang)</span></h2>
          {(() => {
            // Grouping logic remains the same, it safely handles strings with or without `|` since `includes` checks the whole string.
            const manager = data.filter((m: any) => m.jabatan.toLowerCase().includes('manajer') && !m.jabatan.toLowerCase().includes('asisten') && !m.jabatan.toLowerCase().includes('sub'))
            const secretary = data.filter((m: any) => m.jabatan.toLowerCase().includes('sekertaris') || m.jabatan.toLowerCase().includes('sekretaris'))
            
            const getSubTeam = (keywords: string[]) => data.filter((m: any) => keywords.some(k => m.jabatan.toLowerCase().includes(k)))
            const keuangan = getSubTeam(['keuangan'])
            const manajemen = getSubTeam(['manajemen'])
            const verifikasi = getSubTeam(['verifikasi'])

            const categorizedIds = [...manager, ...secretary, ...keuangan, ...manajemen, ...verifikasi].map((m: any) => m.id)
            const others = data.filter((m: any) => !categorizedIds.includes(m.id))

            const renderSection = (title: string, members: any[]) => {
              return (
                <div className="mb-8 last:mb-0">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-px bg-gray-100 flex-1"></div>
                    <h3 className="font-nav font-bold text-[11px] text-[#01bcce] uppercase tracking-[0.15em] bg-[#e8f9fc] px-3 py-1 rounded-full">{title}</h3>
                    <div className="h-px bg-gray-100 flex-1"></div>
                  </div>
                  {members.length === 0 ? (
                    <p className="font-nav text-xs text-gray-400 text-center py-4 italic">Belum ada anggota di posisi ini.</p>
                  ) : (
                    <div className="space-y-3">
                      {members.map((item: any) => {
                        const parsed = parseJabatan(item.jabatan)
                        return (
                          <div key={item.id} className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 hover:border-[#01bcce]/30 hover:shadow-md transition-all bg-white group">
                            <div className="w-12 h-12 flex-shrink-0 transition-transform group-hover:scale-110">
                              {item.foto_url ? <img src={item.foto_url} alt={item.nama} className="w-full h-full object-contain drop-shadow-sm" /> : <div className="w-full h-full rounded-full flex items-center justify-center text-gray-400 text-xl bg-gray-50 border-2 border-gray-100">👤</div>}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-nav font-extrabold text-sm text-gray-800 truncate">{item.nama}</p>
                              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                <span className="font-nav text-[10px] font-bold text-white bg-gradient-to-r from-[#00282b] to-[#015a61] px-2 py-0.5 rounded-full">{parsed.kategori}</span>
                                {parsed.sub !== '-' && <span className="font-nav text-[10px] font-bold text-[#00282b] bg-[#d0db41] px-2 py-0.5 rounded-full">{parsed.sub}</span>}
                                <span className="font-nav text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">Urutan #{item.urutan}</span>
                              </div>
                            </div>
                            <button onClick={() => handleDelete(item.id)} className="p-2.5 rounded-xl bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-colors flex-shrink-0" title="Hapus Anggota"><Trash2 size={16} /></button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            }

            return (
              <div>
                {renderSection('Manajer', manager)}
                {renderSection('Sekretaris', secretary)}
                {renderSection('Sub Tim Keuangan', keuangan)}
                {renderSection('Sub Tim Manajemen', manajemen)}
                {renderSection('Sub Tim Verifikasi', verifikasi)}
                {others.length > 0 && renderSection('Anggota Lainnya', others)}
              </div>
            )
          })()}
        </div>
      </div>
    </div>
  )
}
