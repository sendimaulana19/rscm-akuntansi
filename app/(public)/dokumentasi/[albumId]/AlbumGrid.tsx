'use client'
import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, X, Download } from 'lucide-react'

interface Item {
  id: string
  file_url: string
  file_type: string
  caption?: string
}

export default function AlbumGrid({ items }: { items: Item[] }) {
  const [slideIndex, setSlideIndex] = useState<number | null>(null)

  const prev = useCallback(() => {
    setSlideIndex(i => i === null ? null : (i - 1 + items.length) % items.length)
  }, [items.length])

  const next = useCallback(() => {
    setSlideIndex(i => i === null ? null : (i + 1) % items.length)
  }, [items.length])

  // Keyboard navigation
  useEffect(() => {
    if (slideIndex === null) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
      if (e.key === 'Escape') setSlideIndex(null)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [slideIndex, prev, next])

  async function handleDownload(url: string, idx: number) {
    try {
      const res = await fetch(url)
      const blob = await res.blob()
      const ext = url.split('.').pop()?.split('?')[0] || 'jpg'
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `dokumentasi-${idx + 1}.${ext}`
      a.click()
    } catch {
      window.open(url, '_blank')
    }
  }

  return (
    <>
      {/* Photo Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
        {items.map((item, idx) => (
          <div key={item.id} style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', background: '#222', cursor: 'pointer', aspectRatio: '4/3' }}
            className="album-thumb">
            {/* Photo */}
            <div onClick={() => setSlideIndex(idx)} style={{ width: '100%', height: '100%' }}>
              {item.file_type === 'foto' ? (
                <img src={item.file_url} alt={`Foto ${idx + 1}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform .3s' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#00282b,#015a61)', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(208,219,65,.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#00282b"><polygon points="5,3 19,12 5,21"/></svg>
                  </div>
                  <span style={{ fontFamily: 'Nunito,sans-serif', fontSize: 11, color: 'rgba(255,255,255,.6)', fontWeight: 700 }}>Video</span>
                </div>
              )}
            </div>

            {/* Hover overlay with download */}
            <div className="album-overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px', transition: 'background .2s', pointerEvents: 'none' }}>
              <span style={{ fontFamily: 'Nunito,sans-serif', fontSize: 11, fontWeight: 700, color: '#fff', background: 'rgba(0,0,0,.55)', padding: '2px 8px', borderRadius: 12 }}>
                {idx + 1}/{items.length}
              </span>
              <button
                onClick={e => { e.stopPropagation(); handleDownload(item.file_url, idx) }}
                style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(0,0,0,.6)', border: '1px solid rgba(255,255,255,.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'all' }}>
                <Download size={14} color="#fff" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .album-thumb:hover .album-overlay { background: rgba(0,0,0,.35) !important; }
        .album-thumb:hover img { transform: scale(1.04); }
      `}</style>

      {/* Fullscreen Slideshow */}
      {slideIndex !== null && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#000', display: 'flex', flexDirection: 'column' as const }}>
          {/* Top bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(8px)', flexShrink: 0 }}>
            <span style={{ fontFamily: 'Nunito,sans-serif', fontSize: 14, fontWeight: 700, color: '#fff' }}>
              {slideIndex + 1} / {items.length}
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => handleDownload(items[slideIndex].file_url, slideIndex)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10, background: 'rgba(208,219,65,.15)', border: '1px solid rgba(208,219,65,.4)', cursor: 'pointer', fontFamily: 'Nunito,sans-serif', fontSize: 12, fontWeight: 700, color: '#d0db41' }}>
                <Download size={14} /> Unduh
              </button>
              <button onClick={() => setSlideIndex(null)}
                style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,.1)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={18} color="#fff" />
              </button>
            </div>
          </div>

          {/* Main photo area */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
            {/* Prev */}
            <button onClick={prev}
              style={{ position: 'absolute', left: 16, width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.25)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, transition: 'background .2s' }}
              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,.3)'}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,.15)'}>
              <ChevronLeft size={24} color="#fff" />
            </button>

            {/* Photo */}
            <div style={{ maxWidth: '88vw', maxHeight: '82vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {items[slideIndex].file_type === 'foto' ? (
                <img src={items[slideIndex].file_url} alt={`Foto ${slideIndex + 1}`}
                  style={{ maxWidth: '88vw', maxHeight: '82vh', objectFit: 'contain', borderRadius: 8, boxShadow: '0 8px 60px rgba(0,0,0,.8)' }} />
              ) : (
                <video src={items[slideIndex].file_url} controls autoPlay
                  style={{ maxWidth: '88vw', maxHeight: '82vh', borderRadius: 8 }} />
              )}
            </div>

            {/* Next */}
            <button onClick={next}
              style={{ position: 'absolute', right: 16, width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.25)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, transition: 'background .2s' }}
              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,.3)'}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,.15)'}>
              <ChevronRight size={24} color="#fff" />
            </button>
          </div>

          {/* Dot indicators */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, padding: '12px 0', flexShrink: 0 }}>
            {items.slice(0, 20).map((_, i) => (
              <button key={i} onClick={() => setSlideIndex(i)}
                style={{ width: i === slideIndex ? 24 : 8, height: 8, borderRadius: 4, border: 'none', cursor: 'pointer', transition: 'all .25s', background: i === slideIndex ? '#01bcce' : 'rgba(255,255,255,.3)', padding: 0 }} />
            ))}
          </div>

          {/* Thumbnail strip */}
          <div style={{ background: 'rgba(0,0,0,.7)', padding: '8px 12px', display: 'flex', gap: 6, overflowX: 'auto' as const, flexShrink: 0 }}>
            {items.map((item, i) => (
              <button key={i} onClick={() => setSlideIndex(i)}
                style={{ width: 56, height: 56, borderRadius: 8, overflow: 'hidden', flexShrink: 0, border: '2px solid', borderColor: i === slideIndex ? '#01bcce' : 'transparent', cursor: 'pointer', padding: 0, opacity: i === slideIndex ? 1 : 0.55, transition: 'all .2s' }}>
                {item.file_type === 'foto'
                  ? <img src={item.file_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <div style={{ width: '100%', height: '100%', background: '#00282b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="#d0db41"><polygon points="5,3 19,12 5,21"/></svg>
                    </div>}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
