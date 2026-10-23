export const metadata = {
  title: 'Agenda Kegiatan | RSCM Akuntansi',
  description: 'Kalender agenda dan jadwal kegiatan Tim Akuntansi RSCM',
}

export default function AgendaPage() {
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
              <span style={{ fontFamily: 'Nunito, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#d0db41' }}>Jadwal</span>
            </div>
            <h1 style={{ fontSize: 48, fontWeight: 900, color: '#fff', lineHeight: 1.1, margin: 0, fontFamily: 'Nunito, sans-serif' }}>Agenda Kegiatan</h1>
            <p style={{ fontFamily: 'Nunito, sans-serif', color: '#7dd3da', fontSize: 16, marginTop: 12 }}>Jadwal dan agenda kegiatan Tim Akuntansi RSCM</p>
            <div style={{ width: 70, height: 4, background: '#d0db41', borderRadius: 2, marginTop: 16 }} />
          </div>
        </div>
      </div>

      {/* ═══════ CALENDAR SECTION ═══════ */}
      <div style={{ background: '#d0db41', paddingBottom: 48, flex: 1 }}>
        <div style={{ width: '100%', maxWidth: '100%', margin: '0 auto', padding: '0 12px' }} className="sm:px-4 md:px-6 lg:px-8">
          
          {/* Floating container — Full Width hingga batas kiri dan kanan */}
          <div style={{
            background: '#fff', borderRadius: 20, padding: '16px',
            boxShadow: '0 12px 48px rgba(0,40,43,.14)', border: '1px solid rgba(0,0,0,.05)',
            position: 'relative', top: -50, width: '100%',
          }}>
            
            {/* Google Calendar Embed */}
            <div
              className="rounded-xl overflow-hidden w-full shadow-sm"
              style={{ border: '1px solid #e2e8f0' }}
            >
              {/* Bar Header */}
              <div
                className="px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3"
                style={{ background: '#00282b' }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full" style={{ background: '#ff5f56' }} />
                    <div className="w-3 h-3 rounded-full" style={{ background: '#ffbd2e' }} />
                    <div className="w-3 h-3 rounded-full" style={{ background: '#27c93f' }} />
                  </div>
                  <p
                    className="text-sm ml-1 font-bold text-white flex items-center gap-2"
                    style={{ fontFamily: 'Nunito, sans-serif', margin: 0 }}
                  >
                    <span style={{ color: '#01bcce' }}>Google Calendar</span>
                    <span className="text-white/40">|</span>
                    <span className="text-white/90 text-xs sm:text-sm font-semibold">Agenda Kegiatan Tim Akuntansi RSCM</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href="https://calendar.google.com/calendar/u/2?cid=YWt1bnRhbnNpcnNjbUBnbWFpbC5jb20"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all hover:opacity-90"
                    style={{
                      background: 'rgba(1, 188, 206, 0.2)',
                      border: '1px solid rgba(1, 188, 206, 0.4)',
                      color: '#d0db41',
                      fontFamily: 'Nunito, sans-serif',
                      textDecoration: 'none'
                    }}
                  >
                    Buka di Google Calendar ↗
                  </a>
                </div>
              </div>

              {/* Calendar iframe — Full Width */}
              <iframe
                src="https://calendar.google.com/calendar/embed?src=akuntansirscm%40gmail.com&ctz=Asia%2FJakarta&mode=WEEK&showTitle=0&showNav=1&showDate=1&showPrint=0&showTabs=1&showCalendars=0&showTz=1"
                title="Agenda Kegiatan Tim Akuntansi RSCM"
                frameBorder="0"
                scrolling="no"
                style={{ width: '100%', height: '82vh', minHeight: '650px', border: 'none', display: 'block' }}
              />
            </div>

            {/* Note & Informasi */}
            <div
              className="mt-5 rounded-xl px-5 py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-xl">💡</span>
                <p className="text-xs sm:text-sm m-0 text-gray-600" style={{ fontFamily: 'Nunito, sans-serif' }}>
                  Gunakan tab <strong>Minggu</strong>, <strong>Bulan</strong>, atau <strong>Agenda</strong> di kanan atas kalender untuk berpindah mode tampilan.
                </p>
              </div>

              <a
                href="https://calendar.google.com/calendar/u/2?cid=YWt1bnRhbnNpcnNjbUBnbWFpbC5jb20"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-xs inline-flex items-center gap-1 flex-shrink-0"
                style={{ color: '#01bcce', textDecoration: 'none', fontFamily: 'Nunito, sans-serif' }}
              >
                Buka Kalender Utama di Google Calendar ↗
              </a>
            </div>

          </div>
        </div>
      </div>
    </main>
  )
}
