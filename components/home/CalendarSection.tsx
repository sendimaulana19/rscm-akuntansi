export default function CalendarSection() {
  const embedUrl = `https://calendar.google.com/calendar/embed?src=sendimaulana1199%40gmail.com&ctz=Asia%2FJakarta&mode=AGENDA&showTitle=0&showNav=1&showPrint=0&showCalendars=0&showTz=1&bgcolor=%23ffffff&color=%2300282b`

  return (
    <section className="relative" style={{ background: '#00282b', paddingTop: '140px', paddingBottom: '100px' }}>
      <div className="w-full max-w-[1200px] mx-auto" style={{ paddingLeft: '5%', paddingRight: '5%' }}>
        <div className="flex flex-col lg:flex-row items-center justify-between" style={{ gap: '60px' }}>
          
          {/* Left: Calendar Embed */}
          <div className="w-full lg:w-[55%]">
            <div className="rounded-2xl overflow-hidden shadow-2xl bg-[#001f22]"
                 style={{ border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 30px 60px rgba(0,0,0,0.5)' }}>
              {/* Browser Bar Mockup */}
              <div className="px-6 py-4 flex items-center gap-3" style={{ background: '#001a1d', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="flex gap-2">
                  <div className="w-3.5 h-3.5 rounded-full shadow-inner" style={{ background: '#ff5f56' }} />
                  <div className="w-3.5 h-3.5 rounded-full shadow-inner" style={{ background: '#ffbd2e' }} />
                  <div className="w-3.5 h-3.5 rounded-full shadow-inner" style={{ background: '#27c93f' }} />
                </div>
                <p className="text-sm ml-3 font-bold m-0 tracking-wide uppercase text-white/50" style={{ fontFamily: '"Nunito", sans-serif', fontSize: '11px' }}>
                  Agenda Internal
                </p>
              </div>
              <iframe
                src={embedUrl}
                style={{ border: 0, width: '100%', height: '450px', display: 'block', background: '#ffffff' }}
                frameBorder="0"
                scrolling="no"
                title="Agenda Tim Kerja Akuntansi"
              />
            </div>
          </div>

          {/* Right: Text Content */}
          <div className="w-full lg:w-[45%] flex flex-col items-start text-left">
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
            
            <div style={{ marginTop: '40px' }}>
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
