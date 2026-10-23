'use client'
import { useState } from 'react'
import { Calendar as CalendarIcon, CalendarDays, List } from 'lucide-react'

export default function CalendarSection() {
  const [mode, setMode] = useState<'AGENDA' | 'WEEK' | 'MONTH'>('AGENDA')
  const embedUrl = `https://calendar.google.com/calendar/embed?src=akuntansirscm%40gmail.com&ctz=Asia%2FJakarta&mode=${mode}&showTitle=0&showNav=1&showPrint=0&showCalendars=0&showTz=1&bgcolor=%23ffffff&color=%2300282b`

  return (
    <section className="relative" style={{ background: '#00282b', paddingTop: '65px', paddingBottom: '90px' }}>
      <div className="w-full max-w-[1200px] mx-auto" style={{ paddingLeft: '5%', paddingRight: '5%' }}>
        <div className="flex flex-col lg:flex-row items-center justify-between" style={{ gap: '48px' }}>
          
          {/* Left: Calendar Embed */}
          <div className="w-full lg:w-[58%]">
            <div className="rounded-2xl overflow-hidden shadow-2xl bg-[#001f22]"
                 style={{ border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 30px 60px rgba(0,0,0,0.5)' }}>
              
              {/* Browser Bar Mockup & Toggle Kalender */}
              <div
                className="px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3"
                style={{ background: '#001a1d', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex gap-2">
                    <div className="w-3.5 h-3.5 rounded-full shadow-inner" style={{ background: '#ff5f56' }} />
                    <div className="w-3.5 h-3.5 rounded-full shadow-inner" style={{ background: '#ffbd2e' }} />
                    <div className="w-3.5 h-3.5 rounded-full shadow-inner" style={{ background: '#27c93f' }} />
                  </div>
                  <p className="text-sm font-bold m-0 tracking-wide uppercase text-white/60 hidden sm:inline" style={{ fontFamily: '"Nunito", sans-serif', fontSize: '11px' }}>
                    Agenda Internal
                  </p>
                </div>

                {/* Toggle Kalender — Sedikit Diperbesar & Agak Mepet Tepian Atas (proporsional) */}
                <div
                  className="inline-flex items-center p-1 rounded-xl shadow-inner"
                  style={{ background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.14)' }}
                >
                  <button
                    type="button"
                    onClick={() => setMode('AGENDA')}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-[13px] font-bold transition-all cursor-pointer"
                    style={{
                      background: mode === 'AGENDA' ? '#01bcce' : 'transparent',
                      color: mode === 'AGENDA' ? '#00282b' : 'rgba(255,255,255,0.75)',
                      boxShadow: mode === 'AGENDA' ? '0 2px 8px rgba(1,188,206,0.35)' : 'none',
                      fontFamily: '"Nunito", sans-serif',
                    }}
                    title="Tampilan Agenda / Daftar"
                  >
                    <List size={14} />
                    <span>Agenda</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode('WEEK')}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-[13px] font-bold transition-all cursor-pointer"
                    style={{
                      background: mode === 'WEEK' ? '#01bcce' : 'transparent',
                      color: mode === 'WEEK' ? '#00282b' : 'rgba(255,255,255,0.75)',
                      boxShadow: mode === 'WEEK' ? '0 2px 8px rgba(1,188,206,0.35)' : 'none',
                      fontFamily: '"Nunito", sans-serif',
                    }}
                    title="Tampilan Mingguan"
                  >
                    <CalendarDays size={14} />
                    <span>Minggu</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode('MONTH')}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-[13px] font-bold transition-all cursor-pointer"
                    style={{
                      background: mode === 'MONTH' ? '#01bcce' : 'transparent',
                      color: mode === 'MONTH' ? '#00282b' : 'rgba(255,255,255,0.75)',
                      boxShadow: mode === 'MONTH' ? '0 2px 8px rgba(1,188,206,0.35)' : 'none',
                      fontFamily: '"Nunito", sans-serif',
                    }}
                    title="Tampilan Bulanan"
                  >
                    <CalendarIcon size={14} />
                    <span>Bulan</span>
                  </button>
                </div>
              </div>

              <iframe
                key={mode}
                src={embedUrl}
                style={{ border: 0, width: '100%', height: '460px', display: 'block', background: '#ffffff' }}
                frameBorder="0"
                scrolling="no"
                title="Agenda Tim Kerja Akuntansi"
              />
            </div>
          </div>

          {/* Right: Text Content */}
          <div className="w-full lg:w-[42%] flex flex-col items-start text-left">
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full font-bold uppercase tracking-widest mb-4 shadow-lg"
                 style={{ background: 'rgba(208,219,65,0.15)', border: '1px solid rgba(208,219,65,0.3)', color: '#d0db41', fontSize: '11px', fontFamily: '"Nunito", sans-serif' }}>
              <span className="w-2 h-2 rounded-full" style={{ background: '#d0db41', boxShadow: '0 0 10px rgba(208,219,65,0.8)' }} />
              Jadwal & Kegiatan
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold mb-4 text-white" style={{ fontFamily: '"VAG Rounded Next", "VAGRounded BT", "Nunito", sans-serif', letterSpacing: '-1px' }}>
              Agenda Tim
            </h2>
            <p className="text-gray-300 text-[16px] md:text-[18px] max-w-lg font-medium leading-relaxed" style={{ fontFamily: '"Nunito", sans-serif' }}>
              Jadwal rapat dan kegiatan Tim Kerja Akuntansi RSCM
            </p>
            
            <div style={{ marginTop: '36px' }}>
              <a href="/agenda" className="inline-flex items-center gap-2 font-bold text-[15px] px-8 py-4 rounded-full transition-all duration-300 hover:gap-4 hover:-translate-y-1"
                 style={{ color: '#00282b', background: '#d0db41', fontFamily: '"Nunito", sans-serif', boxShadow: '0 10px 25px rgba(208,219,65,0.3)' }}>
                Lihat Halaman Agenda Penuh <span className="text-lg">→</span>
              </a>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
