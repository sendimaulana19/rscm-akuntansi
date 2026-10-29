'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { deleteFileFromStorage } from '@/lib/supabase/storage-helper'
import Link from 'next/link'
import { ArrowLeft, Save, Upload, Building, ImageIcon, Trash2 } from 'lucide-react'
import dynamic from 'next/dynamic'
import 'react-quill-new/dist/quill.snow.css'

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false })

export default function AdminProfilPage() {
  const supabase = createClient()
  const [slug, setSlug] = useState('tim-kerja-akuntansi')
  const [judul, setJudul] = useState('')
  const [konten, setKonten] = useState('')
  const [gambarUrl, setGambarUrl] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const fetchProfil = async (selectedSlug: string) => {
    setLoading(true)
    setMessage(null)
    const { data, error } = await supabase
      .from('halaman_profil')
      .select('*')
      .eq('slug', selectedSlug)
      .single()

    if (data) {
      if (selectedSlug === 'kpi' && data.konten && (data.konten.includes('kenari') || data.konten.startsWith('http'))) {
        await supabase.from('halaman_profil').update({ konten: '' }).eq('slug', 'kpi')
        setJudul(data.judul || 'Key Performance Indicator (KPI)')
        setKonten('')
      } else {
        setJudul(data.judul || '')
        setKonten(data.konten || '')
      }
      setGambarUrl(data.gambar_url || '')
    } else {
      // Default templates if not exists
      if (selectedSlug === 'tim-kerja-akuntansi') {
        setJudul('Profil Tim Kerja Akuntansi')
        setKonten('<p><strong>Tugas dan Fungsi:</strong><br/>...</p><p><strong>Struktur Organisasi:</strong><br/>...</p><p><strong>Data PIC Per Bidang:</strong><br/>...</p>')
      } else {
        setJudul('')
        setKonten('')
      }
      setGambarUrl('')
    }
    setFile(null)
    setLoading(false)
  }

  useEffect(() => {
    fetchProfil(slug)
  }, [slug])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      let finalGambarUrl = gambarUrl

      // Upload file jika ada
      if (file) {
        const ext = file.name.split('.').pop()
        const fileName = `profil/${slug}-${Date.now()}.${ext}`
        
        const { error: uploadError } = await supabase.storage
          .from('rscm-files')
          .upload(fileName, file, { upsert: true })

        if (uploadError) throw new Error('Gagal upload gambar: ' + uploadError.message)

        const { data: urlData } = supabase.storage.from('rscm-files').getPublicUrl(fileName)
        finalGambarUrl = urlData.publicUrl

        // Hapus gambar lama jika ada pergantian gambar
        if (gambarUrl && gambarUrl !== finalGambarUrl) {
          await deleteFileFromStorage(supabase, gambarUrl)
        }
      }

      // Bersihkan non-breaking spaces agar text wrap tidak terpotong di tengah kata
      const cleanKonten = konten ? konten.replace(/&nbsp;/g, ' ').replace(/\u00a0/g, ' ') : ''

      // Check if exists
      const { data: existing } = await supabase.from('halaman_profil').select('id').eq('slug', slug).maybeSingle()

      if (existing) {
        // Update
        const { error: updateError } = await supabase
          .from('halaman_profil')
          .update({
            judul,
            konten: cleanKonten,
            gambar_url: finalGambarUrl,
            updated_at: new Date().toISOString()
          })
          .eq('slug', slug)
        
        if (updateError) throw new Error(updateError.message)
      } else {
        // Insert
        const { error: insertError } = await supabase
          .from('halaman_profil')
          .insert({
            slug,
            judul,
            konten: cleanKonten,
            gambar_url: finalGambarUrl
          })
        
        if (insertError) throw new Error(insertError.message)
      }

      setMessage({ type: 'success', text: 'Halaman profil berhasil disimpan!' })
      setGambarUrl(finalGambarUrl)
      setFile(null)
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Terjadi kesalahan' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Apakah Anda yakin ingin menghapus data halaman ini? Konten akan dikosongkan.')) return
    
    setSaving(true)
    setMessage(null)
    try {
      if (gambarUrl) {
        await deleteFileFromStorage(supabase, gambarUrl)
      }
      const { error } = await supabase.from('halaman_profil').delete().eq('slug', slug)
      if (error) throw new Error(error.message)
      
      setMessage({ type: 'success', text: 'Data halaman berhasil dihapus!' })
      setJudul('')
      setKonten('')
      setGambarUrl('')
      setFile(null)
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Gagal menghapus data' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="font-nav" style={{ minHeight: '100vh', background: '#f0f4f5' }}>
      <header style={{ background: '#00282b', padding: '16px 32px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Link href="/admin/dashboard" style={{ color: '#d0db41', display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none', fontWeight: 600 }}>
          <ArrowLeft size={18} /> Dashboard
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fff' }}>
          <Building size={22} color="#01bcce" />
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>Manajemen Profil</h1>
        </div>
      </header>

      <main style={{ maxWidth: '900px', margin: '32px auto', padding: '0 16px' }}>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '32px', boxShadow: '0 2px 12px rgba(0,40,43,0.08)' }}>
          
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, color: '#00282b' }}>Pilih Halaman yang Ingin Diedit:</label>
            <select 
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              style={{ padding: '12px 16px', borderRadius: '8px', border: '2px solid #e0f0f2', width: '100%', fontSize: '15px', outline: 'none', fontWeight: 600, color: '#00282b' }}
            >
              <option value="tim-kerja-akuntansi">Profil Tim Kerja Akuntansi (Tugas, Fungsi, Struktur, PIC)</option>
              <option value="kpi">Key Performance Indicators (KPI)</option>
              <option value="budaya-kerja">Budaya Kerja</option>
            </select>
            {slug === 'kpi' && (
              <div style={{ marginTop: '12px', padding: '12px 16px', background: '#e0f9fa', borderRadius: '10px', border: '1px solid #b2ebf2', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                <span style={{ color: '#00282b' }}>💡 Untuk mengelola tabel indikator KPI, ISO Like, dan RSCM Award secara lengkap, buka panel khusus <strong>Kelola KPI</strong>.</span>
                <Link href="/admin/kpi" style={{ fontWeight: 700, color: '#015a61', textDecoration: 'underline', whiteSpace: 'nowrap' }}>
                  Buka Menu Kelola KPI →
                </Link>
              </div>
            )}
            {slug === 'budaya-kerja' && (
              <div style={{ marginTop: '12px', padding: '12px 16px', background: '#e0f9fa', borderRadius: '10px', border: '1px solid #b2ebf2', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                <span style={{ color: '#00282b' }}>💡 Untuk mengelola Budaya Kerja dengan fitur lengkap (Banner & Live Preview), buka menu khusus <strong>Budaya Kerja</strong>.</span>
                <Link href="/admin/budaya-kerja" style={{ fontWeight: 700, color: '#015a61', textDecoration: 'underline', whiteSpace: 'nowrap' }}>
                  Buka Menu Budaya Kerja →
                </Link>
              </div>
            )}
          </div>

          {message && (
            <div style={{
              padding: '12px 16px', borderRadius: '8px', marginBottom: '24px', fontWeight: 600,
              background: message.type === 'success' ? '#e6f9f0' : '#fdecea',
              color: message.type === 'success' ? '#00782b' : '#b91c1c',
              border: `1px solid ${message.type === 'success' ? '#a7f0c4' : '#fca5a5'}`
            }}>
              {message.text}
            </div>
          )}

          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>Memuat data...</div>
          ) : slug === 'kpi' ? (
            <div style={{ padding: '32px 24px', textAlign: 'center', background: '#f8fdfd', borderRadius: '12px', border: '1.5px dashed #b2ebf2' }}>
              <p style={{ fontSize: '15px', color: '#00282b', fontWeight: 700, marginBottom: '8px' }}>
                Halaman KPI kini dikelola melalui Panel Tabel KPI Khusus
              </p>
              <p style={{ fontSize: '13px', color: '#527377', marginBottom: '20px' }}>
                Tautan eksternal lama (Kenari) telah dihapus. Silakan kelola tabel KPI, ISO Like, dan RSCM Award secara langsung di menu Kelola KPI.
              </p>
              <Link
                href="/admin/kpi"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 24px',
                  borderRadius: '10px',
                  background: '#00282b',
                  color: '#d0db41',
                  fontWeight: 700,
                  fontSize: '14px',
                  textDecoration: 'none',
                }}
              >
                Buka Panel Kelola KPI →
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#00282b' }}>Judul Halaman *</label>
                <input
                  type="text"
                  value={judul}
                  onChange={e => setJudul(e.target.value)}
                  placeholder="Contoh: Profil Tim Kerja Akuntansi"
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1.5px solid #cce8ea', fontSize: '15px', outline: 'none' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#00282b' }}>Gambar Header / Cover</label>
                {gambarUrl && !file && (
                  <div style={{ marginBottom: '12px' }}>
                    <img src={gambarUrl} alt="Cover" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', border: '1px solid #ddd', objectFit: 'cover' }} />
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => setFile(e.target.files?.[0] || null)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #cce8ea', fontSize: '14px', background: '#f8fdfd' }}
                  />
                  {file && <span style={{ fontSize: '13px', color: '#00782b', fontWeight: 600, whiteSpace: 'nowrap' }}>File dipilih</span>}
                </div>
                <p style={{ fontSize: '12px', color: '#888', marginTop: '6px' }}>Format: JPG, PNG. Rekomendasi ukuran horizontal (landscape).</p>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#00282b' }}>Isi Konten *</label>
                <div style={{ background: '#fff' }}>
                  <style>{`
                    .admin-profil-quill .ql-editor {
                      font-family: 'Times New Roman', Times, Georgia, serif !important;
                      font-size: 16px;
                      line-height: 1.8;
                      min-height: 250px;
                    }
                    .admin-profil-quill .ql-editor p {
                      margin-bottom: 1em;
                    }
                  `}</style>
                  <ReactQuill 
                    className="admin-profil-quill"
                    theme="snow" 
                    value={konten} 
                    onChange={setKonten}
                    style={{ height: '300px', marginBottom: '40px' }}
                    modules={{
                      toolbar: [
                        [{ 'header': [1, 2, 3, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                        [{ 'align': [] }],
                        ['clean']
                      ]
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    flex: 1, padding: '14px 24px', borderRadius: '8px', border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
                    background: saving ? '#ccc' : '#01bcce', color: '#00282b', fontWeight: 700, fontSize: '16px',
                    display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', transition: 'background 0.2s',
                  }}
                >
                  <Save size={20} />
                  {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>

                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={saving}
                  style={{
                    padding: '14px 24px', borderRadius: '8px', border: '2px solid #ff4d4f', cursor: saving ? 'not-allowed' : 'pointer',
                    background: 'transparent', color: '#ff4d4f', fontWeight: 700, fontSize: '16px',
                    display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', transition: 'background 0.2s',
                  }}
                >
                  <Trash2 size={20} />
                  Hapus
                </button>
              </div>
            </form>
          )}

        </div>
      </main>
    </div>
  )
}
