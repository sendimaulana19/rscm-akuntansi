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
        backgroundImage: 'url(/bg-rscm-aerial.jpg)', backgroundSize: 'cover', backgroundPosition: 'center 40%',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(0,40,43,.92), rgba(0,40,43,.65))' }} />
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
        <div style={{ maxWidth: 1140, margin: '0 auto', padding: '0 24px' }}>
          
          {/* Floating container */}
          <div style={{
            background: '#fff', borderRadius: 16, padding: '24px',
            boxShadow: '0 8px 40px rgba(0,40,43,.12)', border: '1px solid rgba(0,0,0,.04)',
            position: 'relative', top: -50,
          }}>
            
            {/* Google Calendar Embed */}
            <div
              className="rounded-xl overflow-hidden w-full"
              style={{ border: '1px solid #eee' }}
            >
              {/* Bar */}
              <div
                className="px-6 py-3 flex items-center gap-3"
                style={{ background: '#00282b' }}
              >
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full" style={{ background: '#ff5f56' }} />
                  <div className="w-3 h-3 rounded-full" style={{ background: '#ffbd2e' }} />
                  <div className="w-3 h-3 rounded-full" style={{ background: '#27c93f' }} />
                </div>
                <p
                  className="text-sm ml-2"
                  style={{ fontFamily: 'Nunito, sans-serif', color: '#01bcce', fontWeight: 600, margin: 0 }}
                >
                  Google Calendar — Agenda Tim Akuntansi RSCM
                </p>
              </div>

              {/* Calendar iframe - mode=WEEK */}
              <iframe
                src="https://calendar.google.com/calendar/embed?src=sendimaulana1199%40gmail.com&ctz=Asia%2FJakarta&mode=WEEK&showTitle=0&showNav=1&showDate=1&showPrint=0&showTabs=1&showCalendars=0&showTz=1"
                title="Agenda Kegiatan Tim Akuntansi RSCM"
                frameBorder="0"
                scrolling="no"
                style={{ width: '100%', height: '75vh', border: 'none', display: 'block' }}
              />
            </div>

            {/* Note */}
            <div
              className="mt-6 rounded-xl px-6 py-4 flex items-start gap-3"
              style={{ background: '#f4f6f8', border: '1px solid #e0e0e0' }}
            >
              <span className="text-2xl mt-0.5">💡</span>
              <div>
                <p
                  className="font-semibold m-0"
                  style={{ color: '#00282b', fontFamily: 'Nunito, sans-serif', fontSize: 16 }}
                >
                  Catatan
                </p>
                <p className="text-sm m-0 mt-1" style={{ color: '#555', lineHeight: 1.5 }}>
                  Jika kalender tidak tampil, pastikan Anda terhubung ke internet dan kalender ini dibagikan secara publik.
                  Anda juga dapat mengakses kalender secara langsung di{' '}
                  <a
                    href="https://calendar.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold"
                    style={{ color: '#01bcce', textDecoration: 'none' }}
                  >
                    Google Calendar ↗
                  </a>
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </main>
  )
}
