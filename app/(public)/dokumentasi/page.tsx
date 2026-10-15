import { createClient } from '@/lib/supabase/server'
import DokumentasiClient from './DokumentasiClient'

export const metadata = {
  title: 'Dokumentasi | RSCM Akuntansi',
  description: 'Galeri dokumentasi kegiatan dan aktivitas tim akuntansi RSCM',
}

export default async function DokumentasiPage() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('dokumentasi')
    .select('id, caption, file_url, file_type, tanggal, created_at')
    .order('tanggal', { ascending: false })

  if (error) console.error('Error fetching dokumentasi:', error)

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
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(208,219,65,.15)', border: '1px solid rgba(208,219,65,.3)', borderRadius: 20, padding: '5px 14px', marginBottom: 14 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#d0db41', display: 'inline-block' }} />
              <span style={{ fontFamily: 'Nunito, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#d0db41' }}>Galeri Tim Kerja</span>
            </div>
            <h1 style={{ fontSize: 48, fontWeight: 900, color: '#fff', lineHeight: 1.1, margin: 0, fontFamily: 'Nunito, sans-serif' }}>Dokumentasi</h1>
            <p style={{ fontFamily: 'Nunito, sans-serif', color: '#7dd3da', fontSize: 16, marginTop: 12 }}>Galeri foto dan video kegiatan Tim Akuntansi RSCM</p>
            <div style={{ width: 70, height: 4, background: '#d0db41', borderRadius: 2, marginTop: 16 }} />
          </div>
        </div>
      </div>

      {/* Grid Container */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 32px 80px' }}>
        <DokumentasiClient items={data || []} />
      </div>
    </main>
  )
}
