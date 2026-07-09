import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import AlbumGrid from './AlbumGrid'

export default async function AlbumDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ albumId: string }>
  searchParams: Promise<{ caption?: string; tanggal?: string }>
}) {
  const supabase = await createClient()
  const { albumId: rawId } = await params
  const { caption: captionParam, tanggal: tanggalParam } = await searchParams

  let items: any[] = []

  if (captionParam && tanggalParam) {
    const { data } = await supabase
      .from('dokumentasi')
      .select('*')
      .eq('caption', decodeURIComponent(captionParam))
      .eq('tanggal', decodeURIComponent(tanggalParam))
      .order('created_at', { ascending: true })
    items = data || []
  }

  if (items.length === 0) {
    const albumId = decodeURIComponent(rawId)
    const { data: byAlbum } = await supabase.from('dokumentasi').select('*').eq('album_id', albumId).order('created_at', { ascending: true })
    if (byAlbum && byAlbum.length > 0) {
      items = byAlbum
    } else {
      const { data: byId } = await supabase.from('dokumentasi').select('*').eq('id', albumId)
      items = byId || []
    }
  }

  if (items.length === 0) notFound()

  const caption = items[0].caption || 'Album Dokumentasi'
  const tanggal = items[0].tanggal
    ? new Date(items[0].tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : ''

  return (
    <main style={{ minHeight: '100vh', background: '#f4f6f8', fontFamily: '"TeX Gyre Bonum", Georgia, serif' }}>
      {/* Top bar */}
      <div style={{ background: 'linear-gradient(135deg,#00282b 0%,#015a61 100%)', padding: '14px 24px', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 4px 12px rgba(0,40,43,.1)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/dokumentasi"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'Nunito,sans-serif', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,.8)', textDecoration: 'none' }}>
            ← Dokumentasi
          </Link>
          <span style={{ fontFamily: 'Nunito,sans-serif', fontSize: 13, color: 'rgba(255,255,255,.6)', fontWeight: 600 }}>
            {items.length} foto/video
          </span>
        </div>
      </div>

      {/* Photos FIRST — full grid */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 20px 0' }}>
        <AlbumGrid items={items} />
      </div>

      {/* Caption BELOW photos */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px 60px' }}>
        <div style={{ background: '#ffffff', borderRadius: 16, padding: '24px 28px', border: '1px solid rgba(1,188,206,.2)', boxShadow: '0 4px 24px rgba(0,40,43,.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(1,188,206,.1)', border: '1px solid rgba(1,188,206,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📷</div>
            <div>
              <p style={{ fontFamily: 'Nunito,sans-serif', fontSize: 13, fontWeight: 800, color: '#01bcce', margin: 0, textTransform: 'uppercase' as const, letterSpacing: 1 }}>Tim Kerja Akuntansi RSCM</p>
              <p style={{ fontFamily: 'Nunito,sans-serif', fontSize: 12, color: '#666', margin: 0, marginTop: 2 }}>{tanggal}</p>
            </div>
          </div>
          <p style={{ fontFamily: 'Nunito,sans-serif', fontSize: 16, fontWeight: 600, color: '#00282b', margin: 0, lineHeight: 1.7, whiteSpace: 'pre-line' as const, wordBreak: 'break-word' as const }}>
            {caption}
          </p>
        </div>
      </div>
    </main>
  )
}
