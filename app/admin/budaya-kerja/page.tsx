'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Upload,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Image as ImageIcon,
  Eye,
  Loader2,
  Sparkles,
  Maximize2,
  X,
  FileText,
} from 'lucide-react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import 'react-quill-new/dist/quill.snow.css'
import { DEFAULT_BUDAYA_KERJA_KONTEN } from '@/app/(public)/profil/budaya-kerja/BudayaKerjaClient'

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false })

const QUILL_MODULES = {
  toolbar: [
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    [{ size: ['small', false, 'large', 'huge'] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ color: [] }, { background: [] }],
    [{ align: [] }],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ indent: '-1' }, { indent: '+1' }],
    ['blockquote', 'link'],
    ['clean'],
  ],
}

function isHtmlEmpty(html?: string | null): boolean {
  if (!html) return true
  const stripped = html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\u00a0/g, ' ').trim()
  const hasMedia = /<img|<iframe|<video|<svg/i.test(html)
  return stripped.length === 0 && !hasMedia
}

function formatArticleHtml(rawHtml?: string): string {
  if (!rawHtml) return ''
  return rawHtml
    .replace(/\t/g, '&emsp;')
    .replace(/&nbsp;/g, ' ')
    .replace(/\u00a0/g, ' ')
}

export default function AdminBudayaKerjaPage() {
  const supabase = createClient()
  const [mode, setMode] = useState<'editor' | 'preview'>('editor')

  // Form states
  const [judul, setJudul] = useState('Budaya Kerja RSUPN Dr. Cipto Mangunkusumo')
  const [gambarUrl, setGambarUrl] = useState('')
  const [konten, setKonten] = useState('')
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('halaman_profil')
        .select('*')
        .eq('slug', 'budaya-kerja')
        .maybeSingle()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (data) {
        if (data.judul && data.judul.trim().length > 0) {
          setJudul(data.judul)
        }
        setGambarUrl(data.gambar_url || '')
        setKonten(data.konten || '')
        setUpdatedAt(data.updated_at || null)
      } else {
        setJudul('Budaya Kerja RSUPN Dr. Cipto Mangunkusumo')
        setGambarUrl('')
        setKonten('')
        setUpdatedAt(null)
      }
    } catch (err: any) {
      console.error('Failed to load budaya-kerja data:', err)
      showFeedback('error', 'Gagal memuat data Budaya Kerja: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleClearKonten() {
    if (confirm('Apakah Anda yakin ingin mengosongkan teks artikel Budaya Kerja?')) {
      setKonten('')
    }
  }

  function handleLoadTemplate() {
    if (confirm('Muat contoh template artikel Budaya Kerja (BerAKHLAK)? Teks yang ada saat ini akan diganti dengan template.')) {
      setKonten(DEFAULT_BUDAYA_KERJA_KONTEN)
    }
  }

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message })
    setTimeout(() => setFeedback(null), 5000)
  }

  async function uploadImageFile(file: File): Promise<string | null> {
    const ext = file.name.split('.').pop() || 'png'
    const fileName = `budaya-kerja-${Date.now()}.${ext}`

    let uploadRes = await supabase.storage.from('rscm-images').upload(fileName, file, { upsert: true })
    if (uploadRes.error) {
      uploadRes = await supabase.storage.from('rscm-files').upload(fileName, file, { upsert: true })
      if (uploadRes.error) {
        throw new Error(uploadRes.error.message)
      }
      const { data } = supabase.storage.from('rscm-files').getPublicUrl(fileName)
      return data.publicUrl
    }
    const { data } = supabase.storage.from('rscm-images').getPublicUrl(fileName)
    return data.publicUrl
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    try {
      const publicUrl = await uploadImageFile(file)
      if (publicUrl) {
        setGambarUrl(publicUrl)
        showFeedback('success', 'Gambar utama berhasil diunggah!')
      }
    } catch (err: any) {
      showFeedback('error', `Gagal mengunggah gambar: ${err.message}`)
    } finally {
      setUploadingImage(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      const now = new Date().toISOString()
      const cleanKonten = isHtmlEmpty(konten) ? '' : formatArticleHtml(konten)
      const payload = {
        slug: 'budaya-kerja',
        judul: judul.trim() || 'Budaya Kerja RSUPN Dr. Cipto Mangunkusumo',
        konten: cleanKonten,
        gambar_url: gambarUrl || null,
        updated_at: now,
      }

      const { data: existing } = await supabase
        .from('halaman_profil')
        .select('id')
        .eq('slug', 'budaya-kerja')
        .maybeSingle()

      if (existing) {
        const { error: updateError } = await supabase
          .from('halaman_profil')
          .update(payload)
          .eq('slug', 'budaya-kerja')

        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase
          .from('halaman_profil')
          .insert(payload)

        if (insertError) throw insertError
      }

      setUpdatedAt(now)
      showFeedback('success', 'Halaman Budaya Kerja berhasil disimpan!')
    } catch (err: any) {
      console.error('Error saving data:', err)
      showFeedback('error', `Gagal menyimpan: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f4f6f8] font-nav pb-16">
      {/* HEADER BAR */}
      <header className="sticky top-0 z-50 shadow-md" style={{ background: '#00282b' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-1.5 text-xs font-bold text-gray-300 hover:text-white px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-all"
            >
              <ArrowLeft size={14} />
              <span>Dashboard</span>
            </Link>
            <div className="h-4 w-px bg-white/20 mx-1 hidden sm:block" />
            <div className="flex items-center gap-2 text-white">
              <Sparkles size={18} className="text-[#01bcce]" />
              <h1 className="font-extrabold text-sm sm:text-base tracking-wide">
                Manajemen Budaya Kerja
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/profil/budaya-kerja"
              target="_blank"
              className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-[#d0db41] hover:underline"
            >
              <Eye size={14} /> Lihat Halaman Web ↗
            </Link>

            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="flex items-center gap-2 px-5 py-2 rounded-xl font-bold text-xs sm:text-sm text-white shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #01bcce 0%, #00858f 100%)',
              }}
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Simpan Perubahan</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* SUB-BAR / VIEW TOGGLE & FEEDBACK */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-6">
        {feedback && (
          <div
            className={`mb-6 p-4 rounded-2xl flex items-center gap-3 shadow-sm border animate-fadeSlideUp ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 size={20} className="text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle size={20} className="text-rose-600 flex-shrink-0" />
            )}
            <p className="text-xs sm:text-sm font-bold flex-1">{feedback.message}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-3 rounded-2xl shadow-sm border border-gray-200/80 mb-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMode('editor')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                mode === 'editor'
                  ? 'bg-[#00282b] text-white shadow'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FileText size={15} />
              <span>Editor Artikel</span>
            </button>
            <button
              onClick={() => setMode('preview')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                mode === 'preview'
                  ? 'bg-[#00282b] text-white shadow'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Eye size={15} />
              <span>Live Preview Web</span>
            </button>
          </div>

          {updatedAt && (
            <span className="text-xs text-gray-400 font-medium px-2">
              Terakhir disimpan: {new Date(updatedAt).toLocaleString('id-ID')}
            </span>
          )}
        </div>

        {/* LOADING STATE */}
        {loading ? (
          <div className="bg-white rounded-2xl p-16 text-center shadow-sm border border-gray-200 flex flex-col items-center justify-center gap-3">
            <Loader2 size={32} className="animate-spin text-[#01bcce]" />
            <p className="text-sm font-bold text-gray-500">Memuat data Budaya Kerja...</p>
          </div>
        ) : mode === 'editor' ? (
          /* FORM EDITOR */
          <div className="space-y-6">
            {/* Card 1: Judul Halaman */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-200/80">
              <label className="block text-xs uppercase tracking-wider font-extrabold text-[#00282b] mb-2">
                Judul Artikel
              </label>
              <input
                type="text"
                value={judul}
                onChange={(e) => setJudul(e.target.value)}
                placeholder="Contoh: Budaya Kerja RSUPN Dr. Cipto Mangunkusumo"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#01bcce] focus:ring-1 focus:ring-[#01bcce] outline-none text-sm sm:text-base font-bold text-[#00282b] bg-[#fdfdfd]"
              />
              <p className="text-xs text-gray-400 mt-2">
                Judul ini akan ditampilkan di header atas kartu artikel pada halaman publik.
              </p>
            </div>

            {/* Card 2: Featured Image (Gambar Utama / Poster) */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-200/80">
              <label className="block text-xs uppercase tracking-wider font-extrabold text-[#00282b] mb-2">
                Gambar Utama / Banner Budaya Kerja (Opsional)
              </label>
              <p className="text-xs text-gray-500 mb-4">
                Unggah poster atau infografis nilai budaya kerja. Gambar ini akan tampil di bagian atas artikel dan dapat diperbesar oleh pengunjung.
              </p>

              {gambarUrl ? (
                <div className="relative rounded-2xl overflow-hidden border border-gray-200 max-w-2xl bg-gray-50 group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={gambarUrl}
                    alt="Preview Featured Image"
                    className="w-full h-auto max-h-80 object-cover block"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => setGambarUrl('')}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg transition-all"
                    >
                      <Trash2 size={14} /> Hapus Gambar
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-white hover:bg-gray-100 text-[#00282b] rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg transition-all"
                    >
                      <Upload size={14} /> Ganti Gambar
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 hover:border-[#01bcce] rounded-2xl p-8 text-center cursor-pointer transition-all bg-[#fafbfc] hover:bg-[#f0f9fa]"
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#01bcce]/10 text-[#01bcce] flex items-center justify-center mx-auto mb-3">
                    <ImageIcon size={24} />
                  </div>
                  <p className="text-sm font-bold text-gray-700">
                    {uploadingImage ? 'Sedang mengunggah...' : 'Klik untuk Memilih Gambar / Banner'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG, JPEG, atau WebP (Disarankan resolusi tajam)</p>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            {/* Card 3: Rich Text Editor Artikel */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-200/80">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div>
                  <label className="block text-xs uppercase tracking-wider font-extrabold text-[#00282b]">
                    Isi Artikel Budaya Kerja (Rich Text Editor)
                  </label>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Tulis atau kosongkan teks artikel. Jika dikosongkan, halaman web hanya akan menampilkan banner/gambar tanpa kalimat bawaan.
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={handleClearKonten}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all cursor-pointer shadow-xs"
                    title="Kosongkan seluruh teks artikel"
                  >
                    <Trash2 size={13} /> Kosongkan Teks
                  </button>
                  <button
                    type="button"
                    onClick={handleLoadTemplate}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[#015a61] bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 transition-all cursor-pointer shadow-xs"
                    title="Muat contoh format BerAKHLAK"
                  >
                    <Sparkles size={13} className="text-[#01bcce]" /> Muat Format Contoh
                  </button>
                </div>
              </div>

              <div className="rounded-xl overflow-hidden border border-gray-300">
                <ReactQuill
                  theme="snow"
                  value={konten}
                  onChange={setKonten}
                  modules={QUILL_MODULES}
                  placeholder="Ketik isi artikel budaya kerja di sini..."
                  className="bg-white min-h-[360px]"
                />
              </div>
            </div>

            {/* Tombol Simpan Bawah */}
            <div className="flex justify-end pt-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-sm text-white shadow-lg transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, #00282b 0%, #015a61 100%)',
                }}
              >
                {saving ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Menyimpan Perubahan...</span>
                  </>
                ) : (
                  <>
                    <Save size={18} className="text-[#d0db41]" />
                    <span>Simpan Budaya Kerja</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* LIVE PREVIEW */
          <div className="space-y-4">
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-semibold flex items-center justify-between">
              <span>Ini adalah simulasi tampilan persis seperti yang akan dilihat pengunjung di halaman website.</span>
              <button
                onClick={() => setMode('editor')}
                className="underline font-bold hover:text-amber-950"
              >
                Kembali ke Editor
              </button>
            </div>

            {/* Preview Box identik dengan BudayaKerjaClient */}
            <div
              style={{
                background: '#ffffff',
                borderRadius: 24,
                padding: '40px 32px 48px',
                boxShadow: '0 8px 32px rgba(0,40,43,.04)',
                border: '1px solid #eae7dd',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Watermark Ornamen Mandala */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/ornament-mandala.png"
                alt=""
                className="absolute -top-12 -right-12 w-52 h-52 object-contain opacity-[0.07] pointer-events-none select-none z-0"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/ornament-side.png"
                alt=""
                className="absolute -left-6 sm:-left-7 md:-left-8 top-0 bottom-0 h-full w-36 sm:w-44 md:w-52 object-cover object-left opacity-[0.07] pointer-events-none select-none z-0"
              />

              <div className="relative z-10">
                <div className="relative mb-6 text-center">
                  <p className="font-nav text-xs text-gray-400 font-medium">
                    Terakhir diperbarui: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>

                {gambarUrl && (
                  <div className="my-6 flex justify-center">
                    <div className="rounded-2xl border border-gray-200 overflow-hidden shadow-sm max-w-5xl w-full">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={gambarUrl}
                        alt="Preview Gambar"
                        className="w-full h-auto block rounded-2xl"
                      />
                    </div>
                  </div>
                )}

                {!isHtmlEmpty(konten) && (
                  <div className="my-6">
                    <div
                      className="blog-content leading-relaxed"
                      style={{
                        fontFamily: '"TeX Gyre Bonum", Georgia, serif',
                        fontSize: '16.5px',
                        lineHeight: 1.85,
                        color: '#2d3748',
                      }}
                      dangerouslySetInnerHTML={{ __html: formatArticleHtml(konten) }}
                    />
                  </div>
                )}
                {isHtmlEmpty(konten) && !gambarUrl && (
                  <div className="my-10 text-center py-6">
                    <p className="font-nav text-sm text-gray-400">
                      (Teks artikel kosong — tidak ada kalimat yang akan ditampilkan di web)
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
