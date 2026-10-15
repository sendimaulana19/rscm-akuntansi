import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props) {
  const supabase = await createClient()
  const { id } = await params
  const { data } = await supabase
    .from('pengumuman')
    .select('judul, konten')
    .eq('id', id)
    .single()

  return {
    title: data ? `${data.judul} | RSCM Akuntansi` : 'Pengumuman | RSCM Akuntansi',
    description: data ? 'Detail pengumuman Tim Akuntansi RSCM' : 'Pengumuman Tim Akuntansi RSCM',
  }
}

interface Pengumuman {
  id: string
  judul: string
  konten: string
  created_at: string
  jenis: 'teks' | 'gambar' | 'pdf'
  file_url?: string
}

export default async function PengumumanDetailPage({ params }: Props) {
  const supabase = await createClient()
  const { id } = await params

  const { data, error } = await supabase
    .from('pengumuman')
    .select('id, judul, konten, jenis, created_at, file_url')
    .eq('id', id)
    .single()

  if (error || !data) {
    notFound()
  }

  const item = data as Pengumuman

  return (
    <main style={{ minHeight: '100vh', fontFamily: '"TeX Gyre Bonum", Georgia, serif', background: '#f4f6f8' }}>
      
      {/* ═══════ HERO ═══════ */}
      <div style={{
        position: 'relative', height: 320,
        background: 'linear-gradient(135deg, #00282b 0%, #015a61 100%)',
        overflow: 'hidden',
      }}>
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
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 1140, margin: '0 auto', padding: '0 24px', height: '100%', display: 'flex', alignItems: 'center' }}>
          <div>
            <Link
              href="/pengumuman"
              className="inline-flex items-center gap-2 text-sm mb-6 hover:underline transition-colors"
              style={{ color: '#d0db41', fontFamily: 'Nunito, sans-serif' }}
            >
              ← Kembali ke Pengumuman
            </Link>

            <br />
            
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(208,219,65,.15)', border: '1px solid rgba(208,219,65,.3)', borderRadius: 20, padding: '5px 14px', marginBottom: 14 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#d0db41', display: 'inline-block' }} />
              <span style={{ fontFamily: 'Nunito, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#d0db41' }}>
                {item.jenis === 'teks' ? 'Umum' : item.jenis === 'gambar' ? 'Informasi Terbaru' : 'Surat Edaran'}
              </span>
            </div>
            
            <h1 style={{ fontSize: 36, fontWeight: 900, color: '#fff', lineHeight: 1.2, margin: 0, fontFamily: 'Nunito, sans-serif' }}>{item.judul}</h1>
            
            <div className="flex flex-wrap gap-4 mt-4">
              <span className="text-sm font-bold" style={{ color: '#7dd3da', fontFamily: 'Nunito, sans-serif' }}>
                📅 {new Date(item.created_at).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
            <div style={{ width: 70, height: 4, background: '#d0db41', borderRadius: 2, marginTop: 16 }} />
          </div>
        </div>
      </div>

      {/* Content Container */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 32px 80px' }}>
        <article
          className="bg-white rounded-3xl shadow-lg"
          style={{ border: '1px solid #e0e0e0', padding: '48px' }}
        >
          {/* Image Attachment (if image type) */}
          {item.jenis === 'gambar' && item.file_url && (
            <div className="rounded-2xl overflow-hidden shadow-md" style={{ marginBottom: '40px' }}>
              <img src={item.file_url} alt={item.judul} className="w-full h-auto object-contain bg-gray-50" />
            </div>
          )}

          {/* Prose content */}
          <div
            className="prose prose-lg max-w-none leading-relaxed text-gray-800"
            style={{ fontFamily: '"Nunito", sans-serif', textAlign: 'justify' }}
            dangerouslySetInnerHTML={{ __html: item.konten }}
          />

          {/* Document Attachment (if pdf type) */}
          {item.jenis === 'pdf' && item.file_url && (
            <div
              className="mt-12 p-6 rounded-2xl flex items-center justify-between gap-4"
              style={{ background: '#f8fafa', border: '1px solid #e0e0e0' }}
            >
              <div className="flex items-center gap-4">
                <span className="text-4xl">📄</span>
                <div>
                  <p
                    className="font-bold text-lg"
                    style={{ color: '#00282b', fontFamily: 'Nunito, sans-serif' }}
                  >
                    Lampiran Dokumen
                  </p>
                  <p className="text-sm text-gray-500 font-medium" style={{ fontFamily: 'Nunito, sans-serif' }}>Unduh untuk membaca selengkapnya</p>
                </div>
              </div>
              <a
                href={item.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 font-bold px-6 py-3 rounded-xl transition-all hover:-translate-y-1 hover:shadow-lg shadow-sm"
                style={{
                  background: '#01bcce',
                  color: '#ffffff',
                  fontFamily: 'Nunito, sans-serif',
                }}
              >
                ⬇ Unduh PDF
              </a>
            </div>
          )}
        </article>

        {/* Back Link */}
        <div className="mt-10 text-center">
          <Link
            href="/pengumuman"
            className="inline-flex items-center gap-2 font-bold px-8 py-3.5 rounded-xl transition-all hover:shadow-lg hover:-translate-y-1"
            style={{
              background: '#00282b',
              color: '#ffffff',
              fontFamily: 'Nunito, sans-serif',
            }}
          >
            ← Kembali ke Daftar Pengumuman
          </Link>
        </div>
      </div>
    </main>
  )
}
