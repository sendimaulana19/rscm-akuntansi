'use client'

import React, { useState, useEffect } from 'react'
import { Maximize2, X } from 'lucide-react'

export interface BudayaKerjaData {
  id?: string
  slug?: string
  judul?: string
  konten?: string | null
  gambar_url?: string | null
  updated_at?: string | null
}

interface Props {
  initialData?: BudayaKerjaData | null
}

export const DEFAULT_BUDAYA_KERJA_KONTEN = `
<p>Budaya Kerja di <strong>RSUPN Dr. Cipto Mangunkusumo (RSCM)</strong>, khususnya pada <strong>Tim Kerja Akuntansi</strong>, berakar pada komitmen luhur untuk mewujudkan pelayanan kesehatan dan tata kelola keuangan negara yang akuntabel, transparan, serta berintegritas tinggi.</p>

<p>Sebagai rumah sakit rujukan nasional dan bagian dari Kementerian Kesehatan Republik Indonesia, seluruh insan Akuntansi RSCM senantiasa menginternalisasikan Nilai Dasar (Core Values) ASN yaitu <strong>BerAKHLAK</strong> serta Tata Nilai Budaya Kerja Rumah Sakit.</p>

<h2>1. Core Values ASN: BerAKHLAK</h2>
<ul>
  <li><strong>Berorientasi Pelayanan:</strong> Berkomitmen memberikan pelayanan prima, solutif, dan ramah dalam melayani kebutuhan unit kerja, mitra kerja, serta masyarakat.</li>
  <li><strong>Akuntabel:</strong> Bertanggung jawab atas setiap pengelolaan anggaran, pencatatan transaksi, dan pelaporan keuangan secara jujur, cermat, disiplin, dan tepat waktu.</li>
  <li><strong>Kompeten:</strong> Terus meningkatkan kapabilitas diri dan keahlian di bidang akuntansi pemerintahan, standar akuntansi keuangan (PSAK/SAP), serta sistem informasi keuangan terkini.</li>
  <li><strong>Harmonis:</strong> Membangun lingkungan kerja yang kondusif, saling menghargai perbedaan, peduli, dan tolong-menolong antar-rekan kerja.</li>
  <li><strong>Loyal:</strong> Berdedikasi dan mengutamakan kepentingan bangsa, negara, institusi RSCM, serta menjaga rahasia jabatan dan keuangan negara.</li>
  <li><strong>Adaptif:</strong> Cepat menyesuaikan diri menghadapi perubahan regulasi dan bertindak proaktif dalam pemanfaatan teknologi digitalisasi akuntansi.</li>
  <li><strong>Kolaboratif:</strong> Membuka sinergi dan kerja sama yang harmonis dengan seluruh sub-tim kerja, manajemen rumah sakit, kementerian, serta para pemangku kepentingan (stakeholders).</li>
</ul>

<h2>2. Komitmen Tim Kerja Akuntansi RSCM</h2>
<p>Dalam menjalankan tugas perbendaharaan, verifikasi, akuntansi keuangan, akuntansi manajemen, hingga penyusunan laporan keuangan rumah sakit, Tim Kerja Akuntansi berpegang teguh pada prinsip:</p>
<ol>
  <li><strong>Presisi & Kepatuhan Regulasi:</strong> Memastikan seluruh laporan keuangan disusun sesuai dengan Standar Akuntansi Keuangan (SAK) dan Standar Akuntansi Pemerintahan (SAP).</li>
  <li><strong>Efisiensi & Transparansi:</strong> Pengelolaan sumber daya keuangan rumah sakit yang terukur demi mendukung pelayanan pasien yang berkesinambungan.</li>
  <li><strong>Inovasi Berkelanjutan:</strong> Mengoptimalkan integrasi sistem pelaporan akuntansi secara digital untuk kecepatan dan akurasi pengambilan keputusan manajerial.</li>
</ol>

<blockquote>
  "Integritas adalah fondasi, Akuntabilitas adalah dedikasi, Pelayanan Prima adalah bukti cinta kami untuk kesehatan negeri."
</blockquote>
`

function formatArticleHtml(rawHtml?: string): string {
  if (!rawHtml) return ''
  return rawHtml
    .replace(/\t/g, '&emsp;')
    .replace(/&nbsp;/g, ' ')
    .replace(/\u00a0/g, ' ')
}

function isHtmlEmpty(html?: string | null): boolean {
  if (!html) return true
  const stripped = html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\u00a0/g, ' ').trim()
  const hasMedia = /<img|<iframe|<video|<svg/i.test(html)
  return stripped.length === 0 && !hasMedia
}

export default function BudayaKerjaClient({ initialData }: Props) {
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)

  const judul = initialData?.judul && initialData.judul.trim().length > 0
    ? initialData.judul
    : 'Budaya Kerja RSUPN Dr. Cipto Mangunkusumo'

  const hasKonten = !isHtmlEmpty(initialData?.konten)
  const kontenFormatted = hasKonten ? formatArticleHtml(initialData?.konten || '') : ''
  const featuredImage = initialData?.gambar_url || ''

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
        
        /* Tipografi Blog / Artikel (Identik dengan Akuntansi Manajemen) */
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
          background: #f8fafc;
          padding-top: 0.75em;
          padding-bottom: 0.75em;
          border-radius: 0 12px 12px 0;
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
        }

        /* Dukungan Alignment Quill */
        .blog-content .ql-align-center { text-align: center; }
        .blog-content .ql-align-right { text-align: right; }
        .blog-content .ql-align-justify {
          text-align: justify;
          text-justify: inter-word;
          text-align-last: left;
        }
        .blog-content .ql-align-left { text-align: left; }

        /* Dukungan Indentasi Quill */
        .blog-content .ql-indent-1 { padding-left: 3em; }
        .blog-content .ql-indent-2 { padding-left: 6em; }
        .blog-content .ql-indent-3 { padding-left: 9em; }
        .blog-content .ql-indent-4 { padding-left: 12em; }
        .blog-content .ql-indent-5 { padding-left: 15em; }
        .blog-content .ql-indent-6 { padding-left: 18em; }
        .blog-content .ql-indent-7 { padding-left: 21em; }
        .blog-content .ql-indent-8 { padding-left: 24em; }

        .blog-content li.ql-indent-1 { padding-left: 3em; }
        .blog-content li.ql-indent-2 { padding-left: 6em; }
        .blog-content li.ql-indent-3 { padding-left: 9em; }
        .blog-content li.ql-indent-4 { padding-left: 12em; }

        /* Ukuran Font Quill */
        .blog-content .ql-size-small { font-size: 0.85em; }
        .blog-content .ql-size-large { font-size: 1.35em; }
        .blog-content .ql-size-huge { font-size: 1.75em; }
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
                Budaya Kerja
              </h1>
              <div style={{ width: 70, height: 4, background: '#d0db41', borderRadius: 2, marginTop: 16 }} />
            </div>
          </div>
        </div>

        {/* Main Content Area */}
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
          {/* Main Article Card (Sama persis dengan Akuntansi Manajemen) */}
          <div
            className="animate-fadeSlideUp"
            style={{
              background: '#ffffff',
              borderRadius: 24,
              padding: '40px 32px 48px',
              boxShadow: '0 8px 32px rgba(0,40,43,.04)',
              border: '1px solid #eae7dd',
              position: 'relative',
              overflow: 'hidden',
              marginBottom: 32,
            }}
          >
            {/* Watermark Ornamen Mandala (Kanan Atas) */}
            <img
              src="/ornament-mandala.png"
              alt=""
              className="absolute -top-12 -right-12 w-52 h-52 object-contain opacity-[0.07] pointer-events-none select-none z-0"
            />

            {/* Watermark Ornamen Sisi Kiri */}
            <img
              src="/ornament-side.png"
              alt=""
              className="absolute -left-6 sm:-left-7 md:-left-8 top-0 bottom-0 h-full w-36 sm:w-44 md:w-52 object-cover object-left opacity-[0.07] pointer-events-none select-none z-0"
            />

            <div className="relative z-10">
              {/* Info Terakhir Diperbarui */}
              <div className="relative mb-6 text-center">
                <p className="font-nav text-xs text-gray-400 font-medium">
                  Terakhir diperbarui:{' '}
                  {initialData?.updated_at
                    ? new Date(initialData.updated_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })
                    : new Date().toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                </p>
              </div>

              {/* Featured Image (Jika Ada) */}
              {featuredImage ? (
                <div className="my-6 flex justify-center">
                  <div
                    onClick={() => setLightboxImage(featuredImage)}
                    className="group relative cursor-pointer overflow-hidden rounded-2xl border border-gray-200/90 shadow-sm hover:shadow-xl transition-all duration-300 max-w-5xl w-full mx-auto"
                  >
                    <img
                      src={featuredImage}
                      alt={judul}
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

              {/* Teks Penjelasan (Body Artikel) */}
              {hasKonten && (
                <div className="my-6">
                  <div
                    className="blog-content leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: kontenFormatted }}
                  />
                </div>
              )}

              {!hasKonten && !featuredImage && (
                <div className="my-10 text-center py-6">
                  <p className="font-nav text-sm text-gray-400">
                    Konten Budaya Kerja belum ditambahkan.
                  </p>
                </div>
              )}
            </div>
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
              alt="Preview Gambar Budaya Kerja"
              className="max-h-[88vh] max-w-[94vw] w-auto h-auto block object-contain rounded-2xl shadow-2xl border border-white/20"
            />
          </div>
        </div>
      )}
    </>
  )
}
