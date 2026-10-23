'use client'
import { useState } from 'react'
import { Calendar as CalendarIcon, CalendarDays, List, ExternalLink } from 'lucide-react'

export default function AgendaClient() {
  const [mode, setMode] = useState<'WEEK' | 'MONTH' | 'AGENDA'>('WEEK')

  const embedUrl = `https://calendar.google.com/calendar/embed?src=akuntansirscm%40gmail.com&ctz=Asia%2FJakarta&mode=${mode}&showTitle=0&showNav=1&showDate=1&showPrint=0&showTabs=1&showCalendars=0&showTz=1`

  return (
    <div style={{ background: '#d0db41', paddingBottom: 48, flex: 1 }}>
      <div style={{ width: '100%', maxWidth: '100%', margin: '0 auto', padding: '0 12px' }} className="sm:px-4 md:px-6 lg:px-8">
        
        {/* Floating container — Full Width & agak mepet dengan tepian atas (jangan nempel) */}
        <div style={{
          background: '#fff', borderRadius: 20, padding: '14px sm:16px',
          boxShadow: '0 12px 48px rgba(0,40,43,.14)', border: '1px solid rgba(0,0,0,.05)',
          position: 'relative', top: -75, width: '100%',
        }}>
          
          {/* Google Calendar Embed Container */}
          <div
            className="rounded-xl overflow-hidden w-full shadow-sm"
            style={{ border: '1px solid #e2e8f0' }}
          >
            {/* Bar Header & Toggle Kalender */}
            <div
              className="px-4 sm:px-6 pt-2.5 pb-2.5 flex flex-wrap items-center justify-between gap-3"
              style={{ background: '#00282b' }}
            >
              {/* Window dots & Label */}
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full" style={{ background: '#ff5f56' }} />
                  <div className="w-3 h-3 rounded-full" style={{ background: '#ffbd2e' }} />
                  <div className="w-3 h-3 rounded-full" style={{ background: '#27c93f' }} />
                </div>
                <p
                  className="text-sm font-bold text-white flex items-center gap-2 m-0"
                  style={{ fontFamily: 'Nunito, sans-serif' }}
                >
                  <span style={{ color: '#01bcce' }}>Google Calendar</span>
                  <span className="text-white/30 hidden sm:inline">|</span>
                  <span className="text-white/80 text-xs sm:text-sm font-semibold hidden md:inline">Agenda Kegiatan Tim Akuntansi RSCM</span>
                </p>
              </div>

              {/* Toggle Kalender — Diperbesar, Agak Mepet Tepian Atas tapi tidak nempel */}
              <div className="flex items-center gap-2">
                <div
                  className="inline-flex items-center p-1 rounded-xl shadow-inner"
                  style={{ background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.12)' }}
                >
                  <button
                    type="button"
                    onClick={() => setMode('WEEK')}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer"
                    style={{
                      background: mode === 'WEEK' ? '#01bcce' : 'transparent',
                      color: mode === 'WEEK' ? '#00282b' : 'rgba(255,255,255,0.75)',
                      boxShadow: mode === 'WEEK' ? '0 2px 8px rgba(1,188,206,0.35)' : 'none',
                      fontFamily: 'Nunito, sans-serif',
                    }}
                    title="Tampilan Mingguan"
                  >
                    <CalendarDays size={15} />
                    <span>Minggu</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode('MONTH')}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer"
                    style={{
                      background: mode === 'MONTH' ? '#01bcce' : 'transparent',
                      color: mode === 'MONTH' ? '#00282b' : 'rgba(255,255,255,0.75)',
                      boxShadow: mode === 'MONTH' ? '0 2px 8px rgba(1,188,206,0.35)' : 'none',
                      fontFamily: 'Nunito, sans-serif',
                    }}
                    title="Tampilan Bulanan"
                  >
                    <CalendarIcon size={15} />
                    <span>Bulan</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode('AGENDA')}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer"
                    style={{
                      background: mode === 'AGENDA' ? '#01bcce' : 'transparent',
                      color: mode === 'AGENDA' ? '#00282b' : 'rgba(255,255,255,0.75)',
                      boxShadow: mode === 'AGENDA' ? '0 2px 8px rgba(1,188,206,0.35)' : 'none',
                      fontFamily: 'Nunito, sans-serif',
                    }}
                    title="Tampilan Agenda / Daftar"
                  >
                    <List size={15} />
                    <span>Agenda</span>
                  </button>
                </div>

                {/* Direct Google Calendar Button */}
                <a
                  href="https://calendar.google.com/calendar/u/2?cid=YWt1bnRhbnNpcnNjbUBnbWFpbC5jb20"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all hover:opacity-90"
                  style={{
                    background: 'rgba(208, 219, 65, 0.15)',
                    border: '1px solid rgba(208, 219, 65, 0.35)',
                    color: '#d0db41',
                    fontFamily: 'Nunito, sans-serif',
                    textDecoration: 'none',
                  }}
                  title="Buka di tab baru Google Calendar"
                >
                  <ExternalLink size={14} />
                  <span className="hidden sm:inline">Buka Kalender</span>
                </a>
              </div>
            </div>

            {/* Calendar iframe — Diperbesar Full Width */}
            <iframe
              key={mode}
              src={embedUrl}
              title="Agenda Kegiatan Tim Akuntansi RSCM"
              frameBorder="0"
              scrolling="no"
              style={{ width: '100%', height: '85vh', minHeight: '680px', border: 'none', display: 'block' }}
            />
          </div>

          {/* Note & Informasi */}
          <div
            className="mt-4 rounded-xl px-5 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
            style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
          >
            <div className="flex items-center gap-2.5">
              <span className="text-lg">💡</span>
              <p className="text-xs sm:text-sm m-0 text-gray-600" style={{ fontFamily: 'Nunito, sans-serif' }}>
                Mode tampilan aktif: <strong className="text-[#00282b]">{mode === 'WEEK' ? 'Mingguan' : mode === 'MONTH' ? 'Bulanan' : 'Daftar Agenda'}</strong>. Anda dapat mengganti tampilan melalui tombol toggle di atas.
              </p>
            </div>

            <a
              href="https://calendar.google.com/calendar/u/2?cid=YWt1bnRhbnNpcnNjbUBnbWFpbC5jb20"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-xs inline-flex items-center gap-1 flex-shrink-0"
              style={{ color: '#01bcce', textDecoration: 'none', fontFamily: 'Nunito, sans-serif' }}
            >
              Akses Google Calendar ↗
            </a>
          </div>

        </div>
      </div>
    </div>
  )
}
