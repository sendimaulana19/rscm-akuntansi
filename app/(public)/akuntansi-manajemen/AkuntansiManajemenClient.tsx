'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  Coins,
  Activity,
  ExternalLink,
  Maximize2,
  X,
  Info,
  Search,
  FileText,
} from 'lucide-react'

export interface UnitCostData {
  image?: string
  images?: string[]
  konten?: string
  link_operatif?: string
  link_non_operatif?: string
  kalimat_pengarah?: string
  keterangan?: string
}

export interface MonevKsoData {
  image?: string
  images?: string[]
  konten?: string
  link_dashboard?: string
  kalimat_pengarah?: string
  keterangan?: string
}

interface AkuntansiManajemenClientProps {
  initialUnitCost?: UnitCostData
  initialMonevKso?: MonevKsoData
  financialDocsRaw?: any[]
  unduhDokumenRaw?: any[]
}

const DEFAULT_UNIT_COST_KONTEN = `
<p>Unit Cost (Biaya Satuan) di RSUPN Dr. Cipto Mangunkusumo merupakan perhitungan biaya riil yang dikeluarkan rumah sakit untuk menghasilkan suatu unit pelayanan atau tindakan medis. Perhitungan ini menjadi dasar penting dalam perencanaan anggaran, efisiensi operasional, penetapan tarif pelayanan, serta evaluasi pembiayaan kesehatan.</p>
<p>Layanan Unit Cost diklasifikasikan ke dalam dua kategori utama:</p>
<ul>
  <li><strong>Pelayanan Operatif:</strong> Meliputi seluruh tindakan pembedahan dan prosedur invasif di instalasi bedah pusat maupun ruang operasi khusus.</li>
  <li><strong>Pelayanan Non Operatif:</strong> Meliputi tindakan medis rawat jalan, rawat inap, pemeriksaan diagnostik, penunjang medis, dan terapi konservatif.</li>
</ul>
<p>Silakan melihat rincian data unit cost pelayanan RSCM melalui tombol tautan yang disediakan di bawah ini.</p>
`

const DEFAULT_MONEV_KSO_KONTEN = `
<p>Monitoring dan Evaluasi Kerja Sama Operasional (Monev KSO) di RSUPN Dr. Cipto Mangunkusumo bertujuan untuk memastikan efektivitas, transparansi, serta kepatuhan pelaksanaan perjanjian kerja sama antara RSCM dengan mitra penyedia layanan.</p>
<p>Melalui sistem Monev KSO terintegrasi, tim manajemen dapat memantau realisasi pendapatan, bagi hasil, utilisasi alat medis, serta kepatuhan standar pelayanan secara berkala dan akuntabel.</p>
<p>Akses ke sistem Dashboard Monev KSO terintegrasi secara langsung dengan kredensial sistem Electronic Health Record (EHR) RSCM.</p>
`

function formatArticleHtml(rawHtml?: string): string {
  if (!rawHtml) return ''
  return rawHtml
    // Ganti tab \t menjadi &emsp; agar indentasi tab presisi dan terlihat di HTML
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

export default function AkuntansiManajemenClient({
  initialUnitCost,
  initialMonevKso,
  financialDocsRaw,
  unduhDokumenRaw,
}: AkuntansiManajemenClientProps) {
  const [activeTab, setActiveTab] = useState<'unit_cost' | 'monev_kso'>('unit_cost')
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)

  // State Unduh Dokumen (Sinkron dengan Akuntansi Keuangan)
  const initialDocs = useMemo(() => {
    const list: any[] = []
    ;(financialDocsRaw || []).forEach(f => {
      list.push({
        id: f.item_name || f.id,
        nama: f.data?.nama || f.item_name,
        tahun: f.data?.tahun || f.year,
        file_url: f.data?.file_url || '#',
        created_at: f.data?.created_at || f.created_at
      })
    })
    ;(unduhDokumenRaw || []).forEach((d: any) => {
      list.push({
        id: d.id,
        nama: d.nama,
        tahun: d.kategori || d.tahun || '-',
        file_url: d.file_url,
        created_at: d.created_at
      })
    })

    const map = new Map<string, any>()
    list.forEach(item => {
      const k = (item.nama + '-' + item.file_url).toLowerCase().trim()
      if (!map.has(k)) map.set(k, item)
    })
    return Array.from(map.values())
  }, [financialDocsRaw, unduhDokumenRaw])

  const [searchDoc, setSearchDoc] = useState('')

  const filteredDocs = useMemo(() => {
    if (!searchDoc.trim()) return initialDocs
    const q = searchDoc.toLowerCase()
    return initialDocs.filter(d =>
      d.nama?.toLowerCase().includes(q) ||
      String(d.tahun || '').toLowerCase().includes(q)
    )
  }, [initialDocs, searchDoc])

  // Ambil gambar (support format single image maupun array)
  const unitCostImage =
    initialUnitCost?.image ||
    (initialUnitCost?.images && initialUnitCost.images[0]) ||
    ''

  const unitCostKonten = formatArticleHtml(
    initialUnitCost?.konten && initialUnitCost.konten.trim().length > 0
      ? initialUnitCost.konten
      : DEFAULT_UNIT_COST_KONTEN
  )

  const unitCostKalimat =
    initialUnitCost?.kalimat_pengarah ||
    initialUnitCost?.keterangan ||
    'Silahkan klik tombol disamping untuk melihat unit cost RSCM'

  const monevKsoImage =
    initialMonevKso?.image ||
    (initialMonevKso?.images && initialMonevKso.images[0]) ||
    ''

  const monevKsoKonten = formatArticleHtml(
    initialMonevKso?.konten && initialMonevKso.konten.trim().length > 0
      ? initialMonevKso.konten
      : DEFAULT_MONEV_KSO_KONTEN
  )

  const monevKsoKalimat =
    initialMonevKso?.kalimat_pengarah ||
    initialMonevKso?.keterangan ||
    'Silahkan klik tombol disamping untuk menuju dashboar Monev KSO, gunakan username dan password yang sama untuk mengakses ehr'

  // Tutup lightbox dengan tombol Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxImage(null)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes fadeSlideUp { from { opacity:0; transform: translateY(15px) } to { opacity:1; transform: translateY(0) } }
        .aFadeIn { animation: fadeIn 0.6s ease both }
        .animate-fadeSlideUp { animation: fadeSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards }
        
        /* Tipografi Blog / Artikel */
        .blog-content {
          font-family: "TeX Gyre Bonum", Georgia, serif;
          font-size: 16.5px;
          line-height: 1.85;
          color: #2d3748;
          word-break: normal;
          overflow-wrap: break-word;
          hyphens: none;
          -webkit-hyphens: none;
          -moz-hyphens: none;
        }
        .blog-content p, .blog-content div, .blog-content span {
          word-break: normal;
          overflow-wrap: break-word;
          hyphens: none;
          -webkit-hyphens: none;
        }
        .blog-content p {
          margin-bottom: 1.35em;
        }
        .blog-content h1, .blog-content h2, .blog-content h3, .blog-content h4, .blog-content h5, .blog-content h6 {
          font-family: Nunito, sans-serif;
          font-weight: 800;
          color: #00282b;
          margin-top: 1.6em;
          margin-bottom: 0.6em;
          line-height: 1.3;
        }
        .blog-content h1 { font-size: 1.75em; }
        .blog-content h2 { font-size: 1.45em; }
        .blog-content h3 { font-size: 1.25em; }
        .blog-content h4 { font-size: 1.1em; }
        .blog-content ul {
          list-style-type: disc;
          padding-left: 1.6em;
          margin-bottom: 1.35em;
        }
        .blog-content ol {
          list-style-type: decimal;
          padding-left: 1.6em;
          margin-bottom: 1.35em;
        }
        .blog-content li {
          margin-bottom: 0.5em;
          line-height: 1.75;
        }
        .blog-content strong {
          color: #00282b;
          font-weight: 700;
        }
        .blog-content blockquote {
          border-left: 4px solid #01bcce;
          padding-left: 1.2em;
          margin: 1.5em 0;
          color: #4a5568;
          font-style: italic;
        }
        .blog-content a {
          color: #01bcce;
          text-decoration: underline;
        }
        .blog-content img {
          max-width: 100%;
          height: auto;
          border-radius: 12px;
          margin: 1.5em auto;
          display: block;
        }

        /* Dukungan Pengaturan Rata Teks Quill */
        .blog-content .ql-align-center {
          text-align: center;
        }
        .blog-content .ql-align-right {
          text-align: right;
        }
        .blog-content .ql-align-justify {
          text-align: justify;
          text-justify: inter-word;
          text-align-last: left;
        }
        .blog-content .ql-align-left {
          text-align: left;
        }

        /* Dukungan Penuh Indentasi Paragraf Quill (1 s/d 8) - Sinkron dengan Quill */
        .blog-content .ql-indent-1 { padding-left: 3em; }
        .blog-content .ql-indent-2 { padding-left: 6em; }
        .blog-content .ql-indent-3 { padding-left: 9em; }
        .blog-content .ql-indent-4 { padding-left: 12em; }
        .blog-content .ql-indent-5 { padding-left: 15em; }
        .blog-content .ql-indent-6 { padding-left: 18em; }
        .blog-content .ql-indent-7 { padding-left: 21em; }
        .blog-content .ql-indent-8 { padding-left: 24em; }

        /* Dukungan Indentasi pada list item */
        .blog-content li.ql-indent-1 { padding-left: 3em; }
        .blog-content li.ql-indent-2 { padding-left: 6em; }
        .blog-content li.ql-indent-3 { padding-left: 9em; }
        .blog-content li.ql-indent-4 { padding-left: 12em; }

        /* Dukungan Ukuran Font Quill */
        .blog-content .ql-size-small {
          font-size: 0.85em;
        }
        .blog-content .ql-size-large {
          font-size: 1.35em;
        }
        .blog-content .ql-size-huge {
          font-size: 1.75em;
        }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#f4f6f8', fontFamily: '"TeX Gyre Bonum", Georgia, serif' }}>
        {/* Hero Header */}
        <div
          style={{
            position: 'relative',
            height: 280,
            background: 'linear-gradient(135deg, #00282b 0%, #015a61 100%)',
            overflow: 'hidden',
          }}
        >
          {/* Watermark Ornamen Mandala (Kanan Atas) */}
          <img
            src="/ornament-mandala.png"
            alt=""
            className="absolute -top-10 -right-10 w-48 h-48 object-contain pointer-events-none select-none z-0"
            style={{ opacity: 0.15 }}
          />

          {/* Watermark Ornamen Sisi Kiri */}
          <img
            src="/ornament-side.png"
            alt=""
            className="absolute -left-6 sm:-left-8 top-0 bottom-0 h-full w-32 sm:w-44 object-cover object-left pointer-events-none select-none z-0 opacity-[0.08]"
            style={{ filter: 'brightness(0) invert(1)' }}
          />
          <div
            style={{
              position: 'relative',
              zIndex: 1,
              maxWidth: 1260,
              margin: '0 auto',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
            }}
            className="px-6 sm:px-10 lg:px-14"
          >
            <div>
              <h1
                style={{
                  fontSize: 42,
                  fontWeight: 900,
                  color: '#fff',
                  lineHeight: 1.1,
                  margin: 0,
                  fontFamily: 'Nunito, sans-serif',
                }}
              >
                Akuntansi Manajemen
              </h1>
              <div style={{ width: 70, height: 4, background: '#d0db41', borderRadius: 2, marginTop: 16 }} />
            </div>
          </div>
        </div>

        {/* Main Section */}
        <div
          style={{
            maxWidth: 1260,
            margin: '0 auto',
            position: 'relative',
            top: -40,
            zIndex: 20,
          }}
          className="px-6 sm:px-10 lg:px-14"
        >
          {/* Category Tabs Switcher (Unit Cost & Monev KSO) */}
          <div className="flex justify-center mb-8 relative z-30">
            <div className="bg-[#eaf5ff] p-2 sm:p-2.5 rounded-2xl shadow-xl border border-[#cde2f5] flex items-center gap-2 flex-wrap relative z-30">
              {[
                { id: 'unit_cost', label: 'Unit Cost', icon: Coins },
                { id: 'monev_kso', label: 'Monev KSO', icon: Activity },
              ].map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`group flex items-center gap-2.5 px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl font-nav font-bold text-sm sm:text-base transition-all duration-200 cursor-pointer select-none relative z-10 ${
                      isActive
                        ? 'text-white shadow-md scale-[1.02]'
                        : 'text-gray-600 hover:text-[#00282b] hover:bg-[#d8edff] active:scale-95'
                    }`}
                    style={isActive ? { background: '#00282b' } : {}}
                  >
                    <Icon
                      size={18}
                      className="transition-transform duration-200 group-hover:scale-110"
                      style={{ color: isActive ? '#01bcce' : '#64748b' }}
                    />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* ================= SECTION: UNIT COST ================= */}
          {activeTab === 'unit_cost' && (
            <div className="space-y-8 pb-16 animate-fadeSlideUp">
              {/* Kotak Besar Section Unit Cost (Warna Dasar #f8f7f2) */}
              <div
                style={{
                  background: '#f8f7f2',
                  borderRadius: 20,
                  padding: '32px 32px',
                  boxShadow: '0 8px 32px rgba(0,40,43,.04)',
                  border: '1px solid #eae7dd',
                  marginBottom: 32,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Watermark Ornamen Mandala (Kanan Atas) */}
                <img
                  src="/ornament-mandala.png"
                  alt=""
                  className="absolute -top-12 -right-12 w-52 h-52 object-contain opacity-[0.07] pointer-events-none select-none z-0"
                />

                {/* Watermark Ornamen Sisi Kiri (Diperbesar) */}
                <img
                  src="/ornament-side.png"
                  alt=""
                  className="absolute -left-6 sm:-left-7 md:-left-8 top-0 bottom-0 h-full w-36 sm:w-44 md:w-52 object-cover object-left opacity-[0.07] pointer-events-none select-none z-0"
                />

                <div className="relative z-10">
                  {/* Header Box: Judul di Tengah (Teks label atas telah dihapus) */}
                  <div className="relative mb-6 text-center">
                    <div
                      style={{
                        width: 40,
                        height: 3.5,
                        background: '#01bcce',
                        borderRadius: 2,
                        margin: '0 auto 6px',
                      }}
                    />
                    <h2
                      style={{
                        fontFamily: 'Nunito, sans-serif',
                        fontSize: 26,
                        fontWeight: 900,
                        color: '#00282b',
                        margin: 0,
                        letterSpacing: '-0.3px',
                        lineHeight: 1.2,
                      }}
                    >
                      Unit Cost RSCM
                    </h2>
                  </div>

                  {/* 1 Slot Gambar Utama (Featured Image pas tanpa blank space) */}
                  {unitCostImage ? (
                    <div className="my-6 flex justify-center">
                      <div
                        onClick={() => setLightboxImage(unitCostImage)}
                        className="group relative cursor-pointer overflow-hidden rounded-2xl border border-gray-200/90 shadow-sm hover:shadow-xl transition-all duration-300 max-w-5xl w-full mx-auto"
                      >
                        <img
                          src={unitCostImage}
                          alt="Gambar Unit Cost RSCM"
                          className="w-full h-auto block rounded-2xl transition-transform duration-300 group-hover:scale-[1.01]"
                        />
                        <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
                          <span className="bg-[#00282b] text-white px-5 py-2.5 rounded-xl text-xs font-nav font-bold flex items-center gap-2 shadow-xl border border-[#01bcce]/40">
                            <Maximize2 size={15} className="text-[#01bcce]" /> Klik untuk Memperbesar
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {/* Teks Penjelasan (Body Artikel tanpa background warna) */}
                  <div className="my-6">
                    <div
                      className="blog-content leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: unitCostKonten }}
                    />
                  </div>

                  {/* Divider halus sebelum tombol aksi */}
                  <div className="border-t border-gray-300/70 my-8 pt-6">
                    {/* Action Row: Kalimat Pengarah & 2 Tombol Shape (Operatif & Non Operatif) */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-5">
                      <div className="flex items-center gap-3.5 text-center md:text-left">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: 'rgba(38,132,132,0.12)', color: '#268484' }}
                        >
                          <Info size={20} />
                        </div>
                        <p className="font-nav text-xs sm:text-sm md:text-base font-bold text-[#00282b] leading-relaxed">
                          {unitCostKalimat}
                        </p>
                      </div>

                      {/* 2 Shape Tombol: Operatif & Non Operatif */}
                      <div className="flex items-center gap-3 flex-wrap justify-center flex-shrink-0">
                        <a
                          href={formatActionUrl(initialUnitCost?.link_operatif)}
                          target={initialUnitCost?.link_operatif ? '_blank' : '_self'}
                          rel="noopener noreferrer"
                          onClick={(e) => {
                            if (!initialUnitCost?.link_operatif) {
                              e.preventDefault()
                              alert('Link untuk Operatif belum diatur di panel admin.')
                            }
                          }}
                          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-nav font-black text-xs sm:text-sm text-white shadow-md transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer select-none"
                          style={{
                            background: 'linear-gradient(135deg, #00282b 0%, #015a61 100%)',
                            border: '1px solid rgba(1,188,206,0.5)',
                          }}
                        >
                          <span>Operatif</span>
                          <ExternalLink size={15} className="text-[#d0db41]" />
                        </a>

                        <a
                          href={formatActionUrl(initialUnitCost?.link_non_operatif)}
                          target={initialUnitCost?.link_non_operatif ? '_blank' : '_self'}
                          rel="noopener noreferrer"
                          onClick={(e) => {
                            if (!initialUnitCost?.link_non_operatif) {
                              e.preventDefault()
                              alert('Link untuk Non Operatif belum diatur di panel admin.')
                            }
                          }}
                          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-nav font-black text-xs sm:text-sm text-white shadow-md transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer select-none"
                          style={{
                            background: 'linear-gradient(135deg, #268484 0%, #018e9c 100%)',
                            border: '1px solid rgba(208,219,65,0.5)',
                          }}
                        >
                          <span>Non Operatif</span>
                          <ExternalLink size={15} className="text-[#d0db41]" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= SECTION: MONEV KSO ================= */}
          {activeTab === 'monev_kso' && (
            <div className="space-y-8 pb-16 animate-fadeSlideUp">
              {/* Kotak Besar Section Monev KSO (Warna Dasar #f8f7f2) */}
              <div
                style={{
                  background: '#f8f7f2',
                  borderRadius: 20,
                  padding: '32px 32px',
                  boxShadow: '0 8px 32px rgba(0,40,43,.04)',
                  border: '1px solid #eae7dd',
                  marginBottom: 32,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Watermark Ornamen Mandala (Kanan Atas) */}
                <img
                  src="/ornament-mandala.png"
                  alt=""
                  className="absolute -top-12 -right-12 w-52 h-52 object-contain opacity-[0.07] pointer-events-none select-none z-0"
                />

                {/* Watermark Ornamen Sisi Kiri (Diperbesar) */}
                <img
                  src="/ornament-side.png"
                  alt=""
                  className="absolute -left-6 sm:-left-7 md:-left-8 top-0 bottom-0 h-full w-36 sm:w-44 md:w-52 object-cover object-left opacity-[0.07] pointer-events-none select-none z-0"
                />

                <div className="relative z-10">
                  {/* Header Box: Judul di Tengah (Teks label atas telah dihapus) */}
                  <div className="relative mb-6 text-center">
                    <div
                      style={{
                        width: 40,
                        height: 3.5,
                        background: '#01bcce',
                        borderRadius: 2,
                        margin: '0 auto 6px',
                      }}
                    />
                    <h2
                      style={{
                        fontFamily: 'Nunito, sans-serif',
                        fontSize: 26,
                        fontWeight: 900,
                        color: '#00282b',
                        margin: 0,
                        letterSpacing: '-0.3px',
                        lineHeight: 1.2,
                      }}
                    >
                      Monitoring & Evaluasi KSO
                    </h2>
                  </div>

                  {/* 1 Slot Gambar Utama (Featured Image pas tanpa blank space) */}
                  {monevKsoImage ? (
                    <div className="my-6 flex justify-center">
                      <div
                        onClick={() => setLightboxImage(monevKsoImage)}
                        className="group relative cursor-pointer overflow-hidden rounded-2xl border border-gray-200/90 shadow-sm hover:shadow-xl transition-all duration-300 max-w-5xl w-full mx-auto"
                      >
                        <img
                          src={monevKsoImage}
                          alt="Gambar Monev KSO RSCM"
                          className="w-full h-auto block rounded-2xl transition-transform duration-300 group-hover:scale-[1.01]"
                        />
                        <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
                          <span className="bg-[#00282b] text-white px-5 py-2.5 rounded-xl text-xs font-nav font-bold flex items-center gap-2 shadow-xl border border-[#01bcce]/40">
                            <Maximize2 size={15} className="text-[#01bcce]" /> Klik untuk Memperbesar
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {/* Teks Penjelasan (Body Artikel tanpa background warna) */}
                  <div className="my-6">
                    <div
                      className="blog-content leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: monevKsoKonten }}
                    />
                  </div>

                  {/* Divider halus sebelum tombol aksi */}
                  <div className="border-t border-gray-300/70 my-8 pt-6">
                    {/* Action Row: Kalimat Pengarah & 1 Tombol Shape (Dashboard Monev KSO) */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-5">
                      <div className="flex items-center gap-3.5 text-center md:text-left">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: 'rgba(38,132,132,0.12)', color: '#268484' }}
                        >
                          <Info size={20} />
                        </div>
                        <p className="font-nav text-xs sm:text-sm md:text-base font-bold text-[#00282b] leading-relaxed">
                          {monevKsoKalimat}
                        </p>
                      </div>

                      {/* 1 Shape Tombol: Dashboar Monev KSO */}
                      <div className="flex items-center gap-3 flex-wrap justify-center flex-shrink-0">
                        <a
                          href={formatActionUrl(initialMonevKso?.link_dashboard)}
                          target={initialMonevKso?.link_dashboard ? '_blank' : '_self'}
                          rel="noopener noreferrer"
                          onClick={(e) => {
                            if (!initialMonevKso?.link_dashboard) {
                              e.preventDefault()
                              alert('Link Dashboard Monev KSO belum diatur di panel admin.')
                            }
                          }}
                          className="inline-flex items-center gap-2.5 px-7 py-3 rounded-xl font-nav font-black text-xs sm:text-sm text-white shadow-md transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer select-none"
                          style={{
                            background: 'linear-gradient(135deg, #00282b 0%, #015a61 100%)',
                            border: '1px solid rgba(1,188,206,0.5)',
                          }}
                        >
                          <span>Dashboar Monev KSO</span>
                          <ExternalLink size={15} className="text-[#d0db41]" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* UNDUH DOKUMEN SECTION (Sama persis dengan Akuntansi Keuangan) */}
          <div style={{
            background: '#fff', borderRadius: 16, padding: '32px 32px',
            boxShadow: '0 8px 40px rgba(0,40,43,.05)',
            marginTop: 32,
          }}>
            {/* Centered Header (Jarak Rapat) */}
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ width: 40, height: 3.5, background: '#00282b', borderRadius: 2, margin: '0 auto 6px' }} />
              <h2 style={{ fontFamily: 'Nunito, sans-serif', fontSize: 22, fontWeight: 900, color: '#00282b', margin: 0, letterSpacing: '-0.3px', lineHeight: 1.2 }}>
                Unduh Dokumen
              </h2>
              <p style={{ fontFamily: 'Nunito, sans-serif', fontSize: 13, color: '#64748b', marginTop: 3, marginBottom: 0, fontWeight: 600, lineHeight: 1.3 }}>
                Cari dan akses dokumen, panduan, serta regulasi terkait akuntansi dan keuangan
              </p>
            </div>

            {/* Action Toolbar: Search Bar di Sebelah Kiri */}
            <div className="flex justify-start mb-5">
              <div className="relative w-full sm:w-80 md:w-96">
                <input
                  type="text"
                  placeholder="Cari nama dokumen atau tahun..."
                  value={searchDoc}
                  onChange={e => setSearchDoc(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 shadow-sm outline-none font-nav text-xs sm:text-sm focus:border-[#01bcce] focus:ring-1 focus:ring-[#01bcce] transition-all bg-[#f8fafc]"
                />
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              </div>
            </div>

            {/* Document List Table */}
            {filteredDocs.length === 0 ? (
              <div className="text-center py-12 text-gray-400 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 font-nav text-sm font-semibold">
                {searchDoc ? 'Tidak ada dokumen yang cocok dengan pencarian Anda.' : 'Belum ada dokumen yang tersedia.'}
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left font-nav">
                  <thead className="bg-[#f8fafa]">
                    <tr>
                      <th className="py-4 px-6 text-xs font-bold text-gray-600 uppercase tracking-wider text-center">Judul Dokumen</th>
                      <th className="py-4 px-6 text-xs font-bold text-gray-600 uppercase tracking-wider w-36 text-center">Tahun</th>
                      <th className="py-4 px-6 text-xs font-bold text-gray-600 uppercase tracking-wider text-center w-36">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredDocs.map((doc) => (
                      <tr key={doc.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-3.5 px-6">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-[#eef9fa] text-[#01bcce] rounded-xl flex-shrink-0">
                              <FileText size={20} />
                            </div>
                            <span className="font-semibold text-gray-800 text-sm sm:text-base leading-snug">{doc.nama}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-6 text-center">
                          <span className="inline-flex items-center justify-center px-3.5 py-1 rounded-full bg-gray-100 text-gray-700 font-bold text-xs">
                            {doc.tahun || '-'}
                          </span>
                        </td>
                        <td className="py-3.5 px-6 text-center">
                          <a
                            href={doc.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl font-bold text-xs transition-all shadow-sm hover:opacity-90"
                            style={{
                              background: '#00282b',
                              color: '#01bcce',
                            }}
                          >
                            <ExternalLink size={15} />
                            Buka
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox Modal Zoom Gambar */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-[99999] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 aFadeIn"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="relative max-w-6xl max-h-[92vh] w-full flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Tombol Tutup */}
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              className="absolute -top-12 right-0 sm:right-2 text-white/80 hover:text-white p-2 rounded-xl bg-black/40 hover:bg-black/60 transition-all cursor-pointer flex items-center gap-1.5 font-nav text-xs font-bold"
            >
              <X size={18} />
              <span>Tutup</span>
            </button>

            <img
              src={lightboxImage}
              alt="Preview Infografis"
              className="max-h-[88vh] max-w-[94vw] w-auto h-auto block object-contain rounded-2xl shadow-2xl border border-white/20"
            />
          </div>
        </div>
      )}
    </>
  )
}
