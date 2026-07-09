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
        backgroundImage: 'url(/bg-rscm.jpg)', backgroundSize: 'cover', backgroundPosition: 'center 30%',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(0,40,43,.92), rgba(0,40,43,.65))' }} />
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
