'use client'
import { useRouter } from 'next/navigation'
import { Camera, Play, Images, ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { parseJudulCaption } from '@/lib/dokumentasi-helper'

interface Item {
  id: string
  caption?: string
  file_url: string
  file_type: 'foto' | 'video'
  tanggal?: string
  album_id?: string
  created_at?: string
}

interface Album {
  id: string         // first item's id — used for navigation
  caption: string
  tanggal: string
  items: Item[]
}

function buildAlbums(items: Item[]): Album[] {
  const map: Record<string, Album> = {}
  items.forEach(item => {
    // Group by album_id if set; otherwise group by caption+tanggal
    const groupKey = item.album_id
      ? `aid:${item.album_id}`
      : `ct:${(item.caption || '').trim()}|${item.tanggal || ''}`

    if (!map[groupKey]) {
      map[groupKey] = {
        id: item.album_id || item.id,   // use album_id or first item's id for URL
        caption: item.caption || 'Dokumentasi Kegiatan',
        tanggal: item.tanggal || item.created_at || '',
        items: [],
      }
    }
    map[groupKey].items.push(item)
  })
  return Object.values(map)
}

function fmt(d?: string) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function DokumentasiClient({ items }: { items: Item[] }) {
  const router = useRouter()
  const albums = buildAlbums(items)

  if (albums.length === 0) {
    return (
      <div style={{ textAlign: 'center' as const, padding: '80px 20px' }}>
        <div style={{ width: 80, height: 80, borderRadius: 24, background: 'linear-gradient(135deg,#00282b,#015a61)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 8px 32px rgba(0,40,43,.2)' }}>
          <Camera size={36} color="#d0db41" />
        </div>
        <h3 style={{ fontFamily: 'Nunito,sans-serif', fontWeight: 800, color: '#00282b', fontSize: 20, margin: '0 0 8px' }}>Belum Ada Dokumentasi</h3>
        <p style={{ fontFamily: 'Nunito,sans-serif', color: '#999', fontSize: 14 }}>Foto dan video kegiatan akan tampil di sini.</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
      {albums.map(album => (
        <AlbumCard
          key={album.id}
          album={album}
          onClick={() => {
            // pass caption+tanggal as search params for reliable grouping
            const url = `/dokumentasi/${encodeURIComponent(album.id)}?caption=${encodeURIComponent(album.caption)}&tanggal=${encodeURIComponent(album.tanggal)}`
            router.push(url)
          }}
        />
      ))}
    </div>
  )
}

function AlbumCard({ album, onClick }: { album: Album; onClick: () => void }) {
  const [hovered, setHovered] = useState(false)
  const count = album.items.length
  const p1 = album.items[0]
  const p2 = album.items[1]
  const p3 = album.items[2]
  const { judul, caption } = parseJudulCaption(album.caption)

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: 18, overflow: 'hidden', cursor: 'pointer',
        background: '#fff',
        boxShadow: hovered ? '0 20px 50px rgba(0,40,43,.18)' : '0 3px 18px rgba(0,40,43,.09)',
        transform: hovered ? 'translateY(-6px)' : 'translateY(0)',
        transition: 'all .3s cubic-bezier(.4,0,.2,1)',
        border: '1px solid rgba(0,40,43,.07)',
        display: 'flex',
        flexDirection: 'column' as const,
      }}
    >
      {/* ── PHOTO ON TOP ── */}
      <div style={{ position: 'relative', width: '100%', aspectRatio: '16/10', overflow: 'hidden', background: '#111', flexShrink: 0 }}>
        {count === 1 ? (
          <PhotoThumb item={p1} scale={hovered} />
        ) : count === 2 ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', height: '100%', gap: 2 }}>
            <PhotoThumb item={p1} scale={false} />
            <PhotoThumb item={p2} scale={false} />
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gridTemplateRows: '1fr 1fr', height: '100%', gap: 2 }}>
            <div style={{ gridRow: '1/3', overflow: 'hidden', height: '100%' }}>
              <PhotoThumb item={p1} scale={hovered} />
            </div>
            <div style={{ overflow: 'hidden' }}><PhotoThumb item={p2} scale={false} /></div>
            <div style={{ position: 'relative', overflow: 'hidden' }}>
              <PhotoThumb item={p3} scale={false} />
              {count > 3 && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,20,22,.72)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: 'Nunito,sans-serif', fontWeight: 900, fontSize: 22, color: '#fff' }}>+{count - 3}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {count > 1 && (
          <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(6px)' }}>
            <Images size={12} color="#fff" />
            <span style={{ fontFamily: 'Nunito,sans-serif', fontSize: 11, fontWeight: 800, color: '#fff' }}>{count} foto</span>
          </div>
        )}
      </div>

      {/* ── JUDUL & CAPTION BELOW ── */}
      <div style={{ padding: '16px 18px 16px', display: 'flex', flexDirection: 'column' as const, gap: 6, flex: 1 }}>
        {album.tanggal && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#01bcce', flexShrink: 0 }} />
            <span style={{ fontFamily: 'Nunito,sans-serif', fontSize: 11, fontWeight: 700, color: '#01bcce' }}>
              {fmt(album.tanggal)}
            </span>
          </div>
        )}

        {/* Judul Kegiatan */}
        <h3 style={{
          fontFamily: 'Nunito,sans-serif', fontSize: 16, fontWeight: 900,
          color: '#00282b', margin: 0, lineHeight: 1.4,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical' as any,
          overflow: 'hidden',
          wordBreak: 'normal',
          overflowWrap: 'break-word',
          hyphens: 'none',
        }}>
          {judul}
        </h3>

        {/* Caption Kegiatan (Keterangan) */}
        {caption && (
          <p style={{
            fontFamily: 'Nunito,sans-serif', fontSize: 13, fontWeight: 500,
            color: '#55696b', margin: 0, lineHeight: 1.5,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical' as any,
            overflow: 'hidden',
            wordBreak: 'normal',
            overflowWrap: 'break-word',
            hyphens: 'none',
          }}>
            {caption}
          </p>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 10 }}>
          <span style={{ fontFamily: 'Nunito,sans-serif', fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>
            {count} foto/video
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'Nunito,sans-serif', fontSize: 13, fontWeight: 800, color: hovered ? '#00282b' : '#01bcce', transition: 'color .2s' }}>
            Lihat Album <ArrowRight size={14} />
          </span>
        </div>
      </div>
    </div>
  )
}

function PhotoThumb({ item, scale }: { item: Item; scale: boolean }) {
  return item.file_type === 'foto' ? (
    <img src={item.file_url} alt=""
      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform .4s ease', transform: scale ? 'scale(1.05)' : 'scale(1)' }} />
  ) : (
    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#00282b,#015a61)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(208,219,65,.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Play size={20} fill="#00282b" color="#00282b" style={{ marginLeft: 3 }} />
      </div>
    </div>
  )
}
