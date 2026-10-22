'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { deleteFileFromStorage } from '@/lib/supabase/storage-helper'
import {
  Upload,
  Trash2,
  ExternalLink,
  Save,
  CheckCircle2,
  AlertCircle,
  Coins,
  Activity,
  ArrowLeft,
  Image as ImageIcon,
  Link as LinkIcon,
  Eye,
  Loader2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  FileUp,
  FileText,
  FileCode,
} from 'lucide-react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import 'react-quill-new/dist/quill.snow.css'

// Dynamic import ReactQuill untuk mencegah SSR error
const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false })

const DEFAULT_UNIT_COST_TEXT = `
<p>Unit Cost (Biaya Satuan) di RSUPN Dr. Cipto Mangunkusumo merupakan perhitungan biaya riil yang dikeluarkan rumah sakit untuk menghasilkan suatu unit pelayanan atau tindakan medis. Perhitungan ini menjadi dasar penting dalam perencanaan anggaran, efisiensi operasional, penetapan tarif pelayanan, serta evaluasi pembiayaan kesehatan.</p>
<p>Layanan Unit Cost diklasifikasikan ke dalam dua kategori utama:</p>
<ul>
  <li><strong>Pelayanan Operatif:</strong> Meliputi seluruh tindakan pembedahan dan prosedur invasif di instalasi bedah pusat maupun ruang operasi khusus.</li>
  <li><strong>Pelayanan Non Operatif:</strong> Meliputi tindakan medis rawat jalan, rawat inap, pemeriksaan diagnostik, penunjang medis, dan terapi konservatif.</li>
</ul>
<p>Silakan melihat rincian data unit cost pelayanan RSCM melalui tombol tautan yang disediakan di bawah ini.</p>
`

const DEFAULT_MONEV_KSO_TEXT = `
<p>Monitoring dan Evaluasi Kerja Sama Operasional (Monev KSO) di RSUPN Dr. Cipto Mangunkusumo bertujuan untuk memastikan efektivitas, transparansi, serta kepatuhan pelaksanaan perjanjian kerja sama antara RSCM dengan mitra penyedia layanan.</p>
<p>Melalui sistem Monev KSO terintegrasi, tim manajemen dapat memantau realisasi pendapatan, bagi hasil, utilisasi alat medis, serta kepatuhan standar pelayanan secara berkala dan akuntabel.</p>
<p>Akses ke sistem Dashboard Monev KSO terintegrasi secara langsung dengan kredensial sistem Electronic Health Record (EHR) RSCM.</p>
`

// Konfigurasi Quill Toolbar Lengkap (Termasuk Rata Kiri/Tengah/Kanan/Justify, Paragraf, Indentasi, & Ukuran Teks)
const QUILL_MODULES = {
  toolbar: [
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    [{ size: ['small', false, 'large', 'huge'] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ color: [] }, { background: [] }],
    [{ align: [] }], // Menyediakan Rata Kiri, Rata Tengah, Rata Kanan, dan Rata Kanan-Kiri (Justify)
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ indent: '-1' }, { indent: '+1' }], // Pengaturan Indentasi Paragraf
    ['blockquote', 'link'],
    ['clean'],
  ],
}

function formatArticleHtml(rawHtml?: string): string {
  if (!rawHtml) return ''
  return rawHtml
    // Ganti tab \t menjadi &emsp; agar indentasi tab terlihat presisi di HTML
    .replace(/\t/g, '&emsp;')
    // Ganti non-breaking space (&nbsp; atau \u00a0) menjadi spasi normal
    // agar browser membungkus kata secara alami dan tidak memotong kata di tengah
    .replace(/&nbsp;/g, ' ')
    .replace(/\u00a0/g, ' ')
}

function formatActionUrl(url?: string): string {
  if (!url) return '#'
  const cleanUrl = url.trim()
  if (
    (cleanUrl.endsWith('.html') || cleanUrl.endsWith('.htm')) &&
    cleanUrl.includes('supabase.co') &&
    !cleanUrl.includes('/api/view-html')
  ) {
    return `/api/view-html?url=${encodeURIComponent(cleanUrl)}`
  }
  return cleanUrl
}

export default function AdminAkuntansiManajemenPage() {
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState<'unit_cost' | 'monev_kso'>('unit_cost')

  // Unit Cost States
  const [unitCostImage, setUnitCostImage] = useState<string>('')
  const [unitCostKonten, setUnitCostKonten] = useState<string>('')
  const [linkOperatif, setLinkOperatif] = useState('')
  const [linkNonOperatif, setLinkNonOperatif] = useState('')
  const [kalimatUnitCost, setKalimatUnitCost] = useState(
    'Silahkan klik tombol disamping untuk melihat unit cost RSCM'
  )

  // Monev KSO States
  const [monevKsoImage, setMonevKsoImage] = useState<string>('')
  const [monevKsoKonten, setMonevKsoKonten] = useState<string>('')
  const [linkDashboardMonev, setLinkDashboardMonev] = useState('')
  const [kalimatMonevKso, setKalimatMonevKso] = useState(
    'Silahkan klik tombol disamping untuk menuju dashboar Monev KSO, gunakan username dan password yang sama untuk mengakses ehr'
  )

  // Loading & Feedback States
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadingDocOperatif, setUploadingDocOperatif] = useState(false)
  const [uploadingDocNonOperatif, setUploadingDocNonOperatif] = useState(false)
  const [uploadingDocMonev, setUploadingDocMonev] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const fileInputUnitRef = useRef<HTMLInputElement>(null)
  const fileInputMonevRef = useRef<HTMLInputElement>(null)
  const fileInputOperatifRef = useRef<HTMLInputElement>(null)
  const fileInputNonOperatifRef = useRef<HTMLInputElement>(null)
  const fileInputMonevDocRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('financial_reports_data')
        .select('*')
        .eq('category', 'akuntansi_manajemen')

      if (error) {
        console.error('Error fetching akuntansi_manajemen:', error)
      } else if (data) {
        const ucRecord = data.find((r) => r.item_name === 'unit_cost')
        if (ucRecord?.data) {
          const img = ucRecord.data.image || (ucRecord.data.images && ucRecord.data.images[0]) || ''
          setUnitCostImage(img)
          setUnitCostKonten(formatArticleHtml(ucRecord.data.konten || DEFAULT_UNIT_COST_TEXT))
          setLinkOperatif(ucRecord.data.link_operatif || '')
          setLinkNonOperatif(ucRecord.data.link_non_operatif || '')
          setKalimatUnitCost(
            ucRecord.data.kalimat_pengarah ||
              ucRecord.data.keterangan ||
              'Silahkan klik tombol disamping untuk melihat unit cost RSCM'
          )
        } else {
          setUnitCostKonten(DEFAULT_UNIT_COST_TEXT)
        }

        const mkRecord = data.find((r) => r.item_name === 'monev_kso')
        if (mkRecord?.data) {
          const img = mkRecord.data.image || (mkRecord.data.images && mkRecord.data.images[0]) || ''
          setMonevKsoImage(img)
          setMonevKsoKonten(formatArticleHtml(mkRecord.data.konten || DEFAULT_MONEV_KSO_TEXT))
          setLinkDashboardMonev(mkRecord.data.link_dashboard || '')
          setKalimatMonevKso(
            mkRecord.data.kalimat_pengarah ||
              mkRecord.data.keterangan ||
              'Silahkan klik tombol disamping untuk menuju dashboar Monev KSO, gunakan username dan password yang sama untuk mengakses ehr'
          )
        } else {
          setMonevKsoKonten(DEFAULT_MONEV_KSO_TEXT)
        }
      }
    } catch (err: any) {
      console.error('Failed to load data:', err)
    } finally {
      setLoading(false)
    }
  }

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message })
    setTimeout(() => setFeedback(null), 5000)
  }

  // Upload helper
  async function uploadImageFile(file: File, prefix: string): Promise<string | null> {
    const ext = file.name.split('.').pop() || 'png'
    const fileName = `manajemen-${prefix}-${Date.now()}.${ext}`

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

  // Handle Upload Gambar Unit Cost
  async function handleUploadUnitCost(file: File) {
    setUploadingImage(true)
    try {
      const publicUrl = await uploadImageFile(file, 'unitcost')
      if (publicUrl) {
        if (unitCostImage && unitCostImage !== publicUrl) {
          await deleteFileFromStorage(supabase, unitCostImage)
        }
        setUnitCostImage(publicUrl)
        showFeedback('success', 'Gambar Unit Cost berhasil diunggah!')
      }
    } catch (err: any) {
      showFeedback('error', `Gagal mengunggah gambar: ${err.message}`)
    } finally {
      setUploadingImage(false)
    }
  }

  // Handle Remove Gambar Unit Cost
  async function handleRemoveUnitCostImage() {
    if (!confirm('Hapus gambar infografis Unit Cost ini?')) return
    if (unitCostImage) {
      await deleteFileFromStorage(supabase, unitCostImage)
      setUnitCostImage('')
      showFeedback('success', 'Gambar Unit Cost berhasil dihapus dari penyimpanan!')
    }
  }

  // Handle Upload Gambar Monev KSO
  async function handleUploadMonev(file: File) {
    setUploadingImage(true)
    try {
      const publicUrl = await uploadImageFile(file, 'monev')
      if (publicUrl) {
        if (monevKsoImage && monevKsoImage !== publicUrl) {
          await deleteFileFromStorage(supabase, monevKsoImage)
        }
        setMonevKsoImage(publicUrl)
        showFeedback('success', 'Gambar Monev KSO berhasil diunggah!')
      }
    } catch (err: any) {
      showFeedback('error', `Gagal mengunggah gambar: ${err.message}`)
    } finally {
      setUploadingImage(false)
    }
  }

  // Handle Remove Gambar Monev KSO
  async function handleRemoveMonevImage() {
    if (!confirm('Hapus gambar Monev KSO ini?')) return
    if (monevKsoImage) {
      await deleteFileFromStorage(supabase, monevKsoImage)
      setMonevKsoImage('')
      showFeedback('success', 'Gambar Monev KSO berhasil dihapus dari penyimpanan!')
    }
  }

  // Upload helper untuk file dokumen (.html, .htm, .pdf)
  async function uploadDocumentFile(file: File, prefix: string): Promise<string | null> {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'html'
    const fileName = `manajemen-doc-${prefix}-${Date.now()}.${ext}`

    const isHtml = ext === 'html' || ext === 'htm'
    const contentType = isHtml ? 'text/html' : (file.type || 'application/octet-stream')

    const { error: uploadError } = await supabase.storage
      .from('rscm-files')
      .upload(fileName, file, {
        upsert: true,
        contentType,
      })

    if (uploadError) {
      throw new Error(uploadError.message)
    }

    const { data } = supabase.storage.from('rscm-files').getPublicUrl(fileName)
    return data.publicUrl
  }

  // Handle Upload Dokumen HTML/PDF untuk Tombol Operatif
  async function handleUploadDocOperatif(file: File) {
    setUploadingDocOperatif(true)
    try {
      const publicUrl = await uploadDocumentFile(file, 'operatif')
      if (publicUrl) {
        if (linkOperatif && linkOperatif !== publicUrl) {
          await deleteFileFromStorage(supabase, linkOperatif)
        }
        setLinkOperatif(publicUrl)
        showFeedback('success', `File "${file.name}" berhasil diunggah! Link URL otomatis terisi.`)
      }
    } catch (err: any) {
      showFeedback('error', `Gagal mengunggah file: ${err.message}`)
    } finally {
      setUploadingDocOperatif(false)
    }
  }

  // Handle Upload Dokumen HTML/PDF untuk Tombol Non Operatif
  async function handleUploadDocNonOperatif(file: File) {
    setUploadingDocNonOperatif(true)
    try {
      const publicUrl = await uploadDocumentFile(file, 'non-operatif')
      if (publicUrl) {
        if (linkNonOperatif && linkNonOperatif !== publicUrl) {
          await deleteFileFromStorage(supabase, linkNonOperatif)
        }
        setLinkNonOperatif(publicUrl)
        showFeedback('success', `File "${file.name}" berhasil diunggah! Link URL otomatis terisi.`)
      }
    } catch (err: any) {
      showFeedback('error', `Gagal mengunggah file: ${err.message}`)
    } finally {
      setUploadingDocNonOperatif(false)
    }
  }

  // Handle Upload Dokumen HTML/PDF untuk Tombol Dashboard Monev KSO
  async function handleUploadDocMonev(file: File) {
    setUploadingDocMonev(true)
    try {
      const publicUrl = await uploadDocumentFile(file, 'monev-kso')
      if (publicUrl) {
        if (linkDashboardMonev && linkDashboardMonev !== publicUrl) {
          await deleteFileFromStorage(supabase, linkDashboardMonev)
        }
        setLinkDashboardMonev(publicUrl)
        showFeedback('success', `File "${file.name}" berhasil diunggah! Link URL otomatis terisi.`)
      }
    } catch (err: any) {
      showFeedback('error', `Gagal mengunggah file: ${err.message}`)
    } finally {
      setUploadingDocMonev(false)
    }
  }

  // Simpan data Unit Cost
  async function handleSaveUnitCost() {
    setSaving(true)
    try {
      const payload = {
        image: unitCostImage.trim(),
        images: unitCostImage ? [unitCostImage.trim()] : [],
        konten: formatArticleHtml(unitCostKonten),
        link_operatif: linkOperatif.trim(),
        link_non_operatif: linkNonOperatif.trim(),
        kalimat_pengarah: kalimatUnitCost.trim(),
      }

      const { error } = await supabase.from('financial_reports_data').upsert(
        {
          category: 'akuntansi_manajemen',
          year: 0,
          item_name: 'unit_cost',
          data: payload,
        },
        { onConflict: 'category,year,item_name' }
      )

      if (error) throw error

      showFeedback('success', 'Artikel Unit Cost berhasil disimpan ke database!')
    } catch (err: any) {
      showFeedback('error', `Gagal menyimpan Unit Cost: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  // Simpan data Monev KSO
  async function handleSaveMonevKso() {
    setSaving(true)
    try {
      const payload = {
        image: monevKsoImage.trim(),
        images: monevKsoImage ? [monevKsoImage.trim()] : [],
        konten: formatArticleHtml(monevKsoKonten),
        link_dashboard: linkDashboardMonev.trim(),
        kalimat_pengarah: kalimatMonevKso.trim(),
      }

      const { error } = await supabase.from('financial_reports_data').upsert(
        {
          category: 'akuntansi_manajemen',
          year: 0,
          item_name: 'monev_kso',
          data: payload,
        },
        { onConflict: 'category,year,item_name' }
      )

      if (error) throw error

      showFeedback('success', 'Artikel Monev KSO berhasil disimpan ke database!')
    } catch (err: any) {
      showFeedback('error', `Gagal menyimpan Monev KSO: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-nav text-gray-800">
      <style>{`
        /* Kustomisasi Toolbar & Area Teks Editor agar Lebih Luas & Nyaman */
        .ql-toolbar.ql-snow {
          border-top-left-radius: 1rem;
          border-top-right-radius: 1rem;
          background: #f8fafc;
          border-color: #cbd5e1 !important;
          padding: 12px 16px !important;
        }
        .ql-container.ql-snow {
          border-bottom-left-radius: 1rem;
          border-bottom-right-radius: 1rem;
          border-color: #cbd5e1 !important;
          font-family: "TeX Gyre Bonum", Georgia, serif !important;
          font-size: 16.5px !important;
          background: #ffffff;
        }
        .ql-editor {
          min-height: 480px !important;
          font-family: "TeX Gyre Bonum", Georgia, serif !important;
          font-size: 16.5px !important;
          line-height: 1.85 !important;
          padding: 24px 28px !important;
          color: #2d3748 !important;
          word-break: normal !important;
          overflow-wrap: break-word !important;
          hyphens: none !important;
          -webkit-hyphens: none !important;
        }
        .ql-editor p {
          margin-bottom: 1.35em !important;
          word-break: normal !important;
          overflow-wrap: break-word !important;
        }
        .ql-editor .ql-align-justify {
          text-align: justify !important;
          text-justify: inter-word !important;
          text-align-last: left !important;
        }
        .ql-snow .ql-picker-label {
          font-weight: 700;
        }
      `}</style>

      {/* Header Admin */}
      <div
        className="px-6 py-6 border-b border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
        style={{ background: '#00282b' }}
      >
        <div className="flex items-center gap-4">
          <Link
            href="/admin/dashboard"
            className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all"
            title="Kembali ke Dashboard Admin"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white leading-tight">
              Admin Akuntansi Manajemen
            </h1>
            <p className="text-xs text-[#01bcce] mt-0.5">
              Editor Artikel Lengkap (Rata Kiri, Tengah, Kanan, Justify & Paragraf)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/akuntansi-manajemen"
            target="_blank"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#01bcce] text-[#00282b] hover:bg-[#01bcce]/90 shadow-md transition-all"
          >
            <Eye size={15} />
            <span>Lihat Halaman Publik</span>
          </Link>
        </div>
      </div>

      {/* Main Content Area (Lebih Besar & Luas: max-w-6xl) */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8">
        {/* Toast Feedback */}
        {feedback && (
          <div
            className={`mb-6 p-4 rounded-2xl flex items-center gap-3 border shadow-md animate-fadeSlideUp ${
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
            <p className="text-sm font-bold flex-1">{feedback.message}</p>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="bg-white rounded-2xl p-2 border border-gray-200 shadow-xs flex items-center gap-2 mb-8">
          <button
            type="button"
            onClick={() => setActiveTab('unit_cost')}
            className={`flex-1 py-3 px-5 rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
              activeTab === 'unit_cost'
                ? 'bg-[#00282b] text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100 hover:text-[#00282b]'
            }`}
          >
            <Coins size={18} className={activeTab === 'unit_cost' ? 'text-[#01bcce]' : 'text-gray-400'} />
            <span>Halaman Unit Cost</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('monev_kso')}
            className={`flex-1 py-3 px-5 rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
              activeTab === 'monev_kso'
                ? 'bg-[#00282b] text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100 hover:text-[#00282b]'
            }`}
          >
            <Activity size={18} className={activeTab === 'monev_kso' ? 'text-[#01bcce]' : 'text-gray-400'} />
            <span>Halaman Monev KSO</span>
          </button>
        </div>

        {loading ? (
          <div className="bg-white rounded-3xl p-16 border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
            <Loader2 size={36} className="animate-spin text-[#01bcce] mb-3" />
            <p className="font-bold text-gray-500 text-sm">Memuat konten dari database...</p>
          </div>
        ) : (
          <>
            {/* ================= TAB 1: UNIT COST ================= */}
            {activeTab === 'unit_cost' && (
              <div className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-200 shadow-sm space-y-8">
                <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                  <div className="w-10 h-10 rounded-xl bg-cyan-50 text-[#01bcce] flex items-center justify-center">
                    <Coins size={22} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-[#00282b]">
                      Artikel & Konten Unit Cost
                    </h2>
                    <p className="text-xs text-gray-500">
                      Gunakan editor artikel di bawah untuk mengatur paragraf, rata teks (kiri, tengah, kanan, justify), dan gambar utama
                    </p>
                  </div>
                </div>

                {/* 1 Slot Upload Gambar Utama */}
                <div className="p-6 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-xs uppercase tracking-wider text-gray-700 flex items-center gap-2">
                      <ImageIcon size={16} className="text-[#01bcce]" />
                      <span>Slot 1 Gambar Utama (Featured Image)</span>
                    </span>
                    {unitCostImage && (
                      <button
                        type="button"
                        onClick={handleRemoveUnitCostImage}
                        className="text-rose-600 hover:text-rose-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 size={13} /> Hapus Gambar
                      </button>
                    )}
                  </div>

                  {unitCostImage ? (
                    <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-white p-3 mb-4 flex items-center justify-center min-h-[220px]">
                      <img
                        src={unitCostImage}
                        alt="Preview Unit Cost"
                        className="max-h-64 max-w-full object-contain rounded-lg shadow-xs"
                      />
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 mb-4 flex flex-col items-center justify-center text-center">
                      <ImageIcon size={40} className="text-gray-300 mb-2" />
                      <p className="text-xs text-gray-400 font-semibold">
                        Belum ada gambar yang diunggah untuk Unit Cost
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        (Jika tidak diisi, halaman akan langsung menampilkan artikel teks tanpa gambar)
                      </p>
                    </div>
                  )}

                  <input
                    type="file"
                    ref={fileInputUnitRef}
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleUploadUnitCost(file)
                    }}
                  />

                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <button
                      type="button"
                      disabled={uploadingImage}
                      onClick={() => fileInputUnitRef.current?.click()}
                      className="w-full sm:w-auto py-2.5 px-5 rounded-xl bg-[#00282b] text-white text-xs font-bold flex items-center justify-center gap-2 hover:bg-[#015a61] transition-all cursor-pointer disabled:opacity-50"
                    >
                      {uploadingImage ? (
                        <Loader2 size={14} className="animate-spin text-[#01bcce]" />
                      ) : (
                        <Upload size={14} className="text-[#01bcce]" />
                      )}
                      <span>{unitCostImage ? 'Ganti File Gambar' : 'Upload File Gambar'}</span>
                    </button>

                    <input
                      type="url"
                      placeholder="Atau tempel URL gambar langsung di sini..."
                      value={unitCostImage}
                      onChange={(e) => setUnitCostImage(e.target.value)}
                      className="flex-1 w-full text-xs px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#01bcce] focus:outline-none bg-white"
                    />
                  </div>
                </div>

                {/* Editor Teks Penjelasan (Form Lebih Besar dengan Rata Teks Lengkap) */}
                <div className="space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Editor Artikel & Teks Penjelasan Unit Cost
                    </label>
                    <span className="text-[11px] text-gray-500 font-semibold flex items-center gap-1.5">
                      <span>Rata Teks:</span>
                      <span className="text-[#01bcce] font-bold">Kiri / Tengah / Kanan / Rata Kanan-Kiri (Justify)</span>
                    </span>
                  </div>

                  <div className="rounded-2xl border border-gray-300/80 shadow-xs overflow-hidden bg-white">
                    <ReactQuill
                      theme="snow"
                      value={unitCostKonten}
                      onChange={setUnitCostKonten}
                      modules={QUILL_MODULES}
                      placeholder="Tuliskan artikel atau penjelasan detail mengenai Unit Cost RSCM di sini..."
                    />
                  </div>
                </div>

                {/* Form Link Tombol & Kalimat Pengarah */}
                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <h3 className="text-sm font-bold text-[#00282b] flex items-center gap-2">
                    <LinkIcon size={16} className="text-[#01bcce]" />
                    <span>Pengaturan Tombol Link & Kalimat Pengarah</span>
                  </h3>

                  {/* Kalimat Pengarah */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Kalimat Pengarah (di samping tombol)
                    </label>
                    <input
                      type="text"
                      value={kalimatUnitCost}
                      onChange={(e) => setKalimatUnitCost(e.target.value)}
                      placeholder="Silahkan klik tombol disamping untuk melihat unit cost RSCM"
                      className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:border-[#01bcce] focus:outline-none bg-gray-50 focus:bg-white transition-all"
                    />
                  </div>

                  {/* Link Tombol Operatif */}
                  <div className="p-4 rounded-xl border border-gray-200 bg-white space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Link Dokumen Tombol "Operatif"
                      </label>
                      {linkOperatif && (
                        <button
                          type="button"
                          onClick={() => setLinkOperatif('')}
                          className="text-rose-600 hover:text-rose-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 size={12} /> Hapus / Kosongkan
                        </button>
                      )}
                    </div>

                    <input
                      type="file"
                      ref={fileInputOperatifRef}
                      accept=".html,.htm,.pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleUploadDocOperatif(file)
                        e.target.value = ''
                      }}
                    />

                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        type="button"
                        disabled={uploadingDocOperatif}
                        onClick={() => fileInputOperatifRef.current?.click()}
                        className="px-4 py-2.5 rounded-xl bg-[#00282b] hover:bg-[#015a61] text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 flex-shrink-0 shadow-xs"
                      >
                        {uploadingDocOperatif ? (
                          <Loader2 size={14} className="animate-spin text-[#01bcce]" />
                        ) : (
                          <FileUp size={14} className="text-[#01bcce]" />
                        )}
                        <span>{uploadingDocOperatif ? 'Mengunggah...' : 'Upload File HTML'}</span>
                      </button>

                      <input
                        type="text"
                        value={linkOperatif}
                        onChange={(e) => setLinkOperatif(e.target.value)}
                        placeholder="Atau tempel link URL / path file di sini..."
                        className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-gray-200 focus:border-[#01bcce] focus:outline-none bg-gray-50 focus:bg-white transition-all font-mono"
                      />

                      {linkOperatif && (
                        <a
                          href={formatActionUrl(linkOperatif)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-all flex-shrink-0"
                        >
                          <ExternalLink size={14} /> Uji Link / Buka
                        </a>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500">
                      💡 Klik <strong>Upload File HTML</strong> untuk memilih file <code>.html</code> langsung dari komputer, atau masukkan link web secara manual.
                    </p>
                  </div>

                  {/* Link Tombol Non Operatif */}
                  <div className="p-4 rounded-xl border border-gray-200 bg-white space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Link Dokumen Tombol "Non Operatif"
                      </label>
                      {linkNonOperatif && (
                        <button
                          type="button"
                          onClick={() => setLinkNonOperatif('')}
                          className="text-rose-600 hover:text-rose-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 size={12} /> Hapus / Kosongkan
                        </button>
                      )}
                    </div>

                    <input
                      type="file"
                      ref={fileInputNonOperatifRef}
                      accept=".html,.htm,.pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleUploadDocNonOperatif(file)
                        e.target.value = ''
                      }}
                    />

                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        type="button"
                        disabled={uploadingDocNonOperatif}
                        onClick={() => fileInputNonOperatifRef.current?.click()}
                        className="px-4 py-2.5 rounded-xl bg-[#00282b] hover:bg-[#015a61] text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 flex-shrink-0 shadow-xs"
                      >
                        {uploadingDocNonOperatif ? (
                          <Loader2 size={14} className="animate-spin text-[#01bcce]" />
                        ) : (
                          <FileUp size={14} className="text-[#01bcce]" />
                        )}
                        <span>{uploadingDocNonOperatif ? 'Mengunggah...' : 'Upload File HTML'}</span>
                      </button>

                      <input
                        type="text"
                        value={linkNonOperatif}
                        onChange={(e) => setLinkNonOperatif(e.target.value)}
                        placeholder="Atau tempel link URL / path file di sini..."
                        className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-gray-200 focus:border-[#01bcce] focus:outline-none bg-gray-50 focus:bg-white transition-all font-mono"
                      />

                      {linkNonOperatif && (
                        <a
                          href={formatActionUrl(linkNonOperatif)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-all flex-shrink-0"
                        >
                          <ExternalLink size={14} /> Uji Link / Buka
                        </a>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500">
                      💡 Klik <strong>Upload File HTML</strong> untuk memilih file <code>.html</code> langsung dari komputer, atau masukkan link web secara manual.
                    </p>
                  </div>
                </div>

                {/* Tombol Simpan Unit Cost */}
                <div className="pt-4 border-t border-gray-100 flex justify-end">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={handleSaveUnitCost}
                    className="px-8 py-3.5 rounded-xl text-white font-bold text-sm flex items-center gap-2.5 shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
                    style={{ background: '#00282b' }}
                  >
                    {saving ? (
                      <Loader2 size={16} className="animate-spin text-[#01bcce]" />
                    ) : (
                      <Save size={16} className="text-[#d0db41]" />
                    )}
                    <span>Simpan Perubahan Unit Cost</span>
                  </button>
                </div>
              </div>
            )}

            {/* ================= TAB 2: MONEV KSO ================= */}
            {activeTab === 'monev_kso' && (
              <div className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-200 shadow-sm space-y-8">
                <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                  <div className="w-10 h-10 rounded-xl bg-cyan-50 text-[#01bcce] flex items-center justify-center">
                    <Activity size={22} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-[#00282b]">
                      Artikel & Konten Monev KSO
                    </h2>
                    <p className="text-xs text-gray-500">
                      Gunakan editor artikel di bawah untuk mengatur paragraf, rata teks (kiri, tengah, kanan, justify), dan gambar utama
                    </p>
                  </div>
                </div>

                {/* 1 Slot Upload Gambar Utama */}
                <div className="p-6 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-xs uppercase tracking-wider text-gray-700 flex items-center gap-2">
                      <ImageIcon size={16} className="text-[#01bcce]" />
                      <span>Slot 1 Gambar Utama (Featured Image)</span>
                    </span>
                    {monevKsoImage && (
                      <button
                        type="button"
                        onClick={handleRemoveMonevImage}
                        className="text-rose-600 hover:text-rose-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 size={13} /> Hapus Gambar
                      </button>
                    )}
                  </div>

                  {monevKsoImage ? (
                    <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-white p-3 mb-4 flex items-center justify-center min-h-[220px]">
                      <img
                        src={monevKsoImage}
                        alt="Preview Monev KSO"
                        className="max-h-64 max-w-full object-contain rounded-lg shadow-xs"
                      />
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 mb-4 flex flex-col items-center justify-center text-center">
                      <ImageIcon size={40} className="text-gray-300 mb-2" />
                      <p className="text-xs text-gray-400 font-semibold">
                        Belum ada gambar yang diunggah untuk Monev KSO
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        (Jika tidak diisi, halaman akan langsung menampilkan artikel teks tanpa gambar)
                      </p>
                    </div>
                  )}

                  <input
                    type="file"
                    ref={fileInputMonevRef}
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleUploadMonev(file)
                    }}
                  />

                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <button
                      type="button"
                      disabled={uploadingImage}
                      onClick={() => fileInputMonevRef.current?.click()}
                      className="w-full sm:w-auto py-2.5 px-5 rounded-xl bg-[#00282b] text-white text-xs font-bold flex items-center justify-center gap-2 hover:bg-[#015a61] transition-all cursor-pointer disabled:opacity-50"
                    >
                      {uploadingImage ? (
                        <Loader2 size={14} className="animate-spin text-[#01bcce]" />
                      ) : (
                        <Upload size={14} className="text-[#01bcce]" />
                      )}
                      <span>{monevKsoImage ? 'Ganti File Gambar' : 'Upload File Gambar'}</span>
                    </button>

                    <input
                      type="url"
                      placeholder="Atau tempel URL gambar langsung di sini..."
                      value={monevKsoImage}
                      onChange={(e) => setMonevKsoImage(e.target.value)}
                      className="flex-1 w-full text-xs px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#01bcce] focus:outline-none bg-white"
                    />
                  </div>
                </div>

                {/* Editor Teks Penjelasan (Form Lebih Besar dengan Rata Teks Lengkap) */}
                <div className="space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Editor Artikel & Teks Penjelasan Monev KSO
                    </label>
                    <span className="text-[11px] text-gray-500 font-semibold flex items-center gap-1.5">
                      <span>Rata Teks:</span>
                      <span className="text-[#01bcce] font-bold">Kiri / Tengah / Kanan / Rata Kanan-Kiri (Justify)</span>
                    </span>
                  </div>

                  <div className="rounded-2xl border border-gray-300/80 shadow-xs overflow-hidden bg-white">
                    <ReactQuill
                      theme="snow"
                      value={monevKsoKonten}
                      onChange={setMonevKsoKonten}
                      modules={QUILL_MODULES}
                      placeholder="Tuliskan artikel atau penjelasan detail mengenai Monitoring dan Evaluasi KSO di sini..."
                    />
                  </div>
                </div>

                {/* Form Link Tombol Dashboard & Kalimat Pengarah */}
                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <h3 className="text-sm font-bold text-[#00282b] flex items-center gap-2">
                    <LinkIcon size={16} className="text-[#01bcce]" />
                    <span>Pengaturan Tombol Link & Kalimat Pengarah</span>
                  </h3>

                  {/* Kalimat Pengarah */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Kalimat Pengarah (di samping tombol)
                    </label>
                    <textarea
                      rows={2}
                      value={kalimatMonevKso}
                      onChange={(e) => setKalimatMonevKso(e.target.value)}
                      placeholder="Silahkan klik tombol disamping untuk menuju dashboar Monev KSO, gunakan username dan password yang sama untuk mengakses ehr"
                      className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:border-[#01bcce] focus:outline-none bg-gray-50 focus:bg-white transition-all leading-relaxed"
                    />
                  </div>

                  {/* Link Tombol Dashboard Monev KSO */}
                  <div className="p-4 rounded-xl border border-gray-200 bg-white space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Link Dokumen / Sistem Tombol "Dashboard Monev KSO"
                      </label>
                      {linkDashboardMonev && (
                        <button
                          type="button"
                          onClick={() => setLinkDashboardMonev('')}
                          className="text-rose-600 hover:text-rose-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 size={12} /> Hapus / Kosongkan
                        </button>
                      )}
                    </div>

                    <input
                      type="file"
                      ref={fileInputMonevDocRef}
                      accept=".html,.htm,.pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleUploadDocMonev(file)
                        e.target.value = ''
                      }}
                    />

                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        type="button"
                        disabled={uploadingDocMonev}
                        onClick={() => fileInputMonevDocRef.current?.click()}
                        className="px-4 py-2.5 rounded-xl bg-[#00282b] hover:bg-[#015a61] text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 flex-shrink-0 shadow-xs"
                      >
                        {uploadingDocMonev ? (
                          <Loader2 size={14} className="animate-spin text-[#01bcce]" />
                        ) : (
                          <FileUp size={14} className="text-[#01bcce]" />
                        )}
                        <span>{uploadingDocMonev ? 'Mengunggah...' : 'Upload File HTML'}</span>
                      </button>

                      <input
                        type="text"
                        value={linkDashboardMonev}
                        onChange={(e) => setLinkDashboardMonev(e.target.value)}
                        placeholder="Atau tempel link URL / path sistem di sini..."
                        className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-gray-200 focus:border-[#01bcce] focus:outline-none bg-gray-50 focus:bg-white transition-all font-mono"
                      />

                      {linkDashboardMonev && (
                        <a
                          href={formatActionUrl(linkDashboardMonev)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-all flex-shrink-0"
                        >
                          <ExternalLink size={14} /> Uji Link / Buka
                        </a>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500">
                      💡 Klik <strong>Upload File HTML</strong> untuk memilih file <code>.html</code> dari komputer, atau tempel link URL sistem langsung.
                    </p>
                  </div>
                </div>

                {/* Tombol Simpan Monev KSO */}
                <div className="pt-4 border-t border-gray-100 flex justify-end">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={handleSaveMonevKso}
                    className="px-8 py-3.5 rounded-xl text-white font-bold text-sm flex items-center gap-2.5 shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
                    style={{ background: '#00282b' }}
                  >
                    {saving ? (
                      <Loader2 size={16} className="animate-spin text-[#01bcce]" />
                    ) : (
                      <Save size={16} className="text-[#d0db41]" />
                    )}
                    <span>Simpan Perubahan Monev KSO</span>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
