import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Struktur Organisasi | RSCM Akuntansi',
  description: 'Struktur Organisasi Tim Kerja Akuntansi RSCM',
}

export default function StrukturOrganisasiPage() {
  return (
    <main
      className="min-h-screen pb-20"
      style={{ fontFamily: '"TeX Gyre Bonum", Georgia, serif', background: '#f4f6f8' }}
    >
      {/* ═══════ HEADER ═══════ */}
      <div
        className="w-full py-12 px-6 mb-12"
        style={{
          background: 'linear-gradient(135deg, #00282b 0%, #015a61 100%)',
        }}
      >
        <div className="max-w-6xl mx-auto">
          <h1
            className="text-3xl md:text-4xl font-bold text-white mb-2"
            style={{ fontFamily: 'Nunito, sans-serif' }}
          >
            Struktur Organisasi
          </h1>
          <div
            className="mt-4 h-1 w-24 rounded-full"
            style={{ background: '#d0db41' }}
          />
        </div>
      </div>

      {/* ═══════ KONTEN (GAMBAR STRUKTUR) ═══════ */}
      <div className="max-w-6xl mx-auto px-4">
        <div 
          className="bg-white p-4 md:p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center min-h-[400px]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src="/images/struktur-organisasi.png" 
            alt="Bagan Struktur Organisasi Tim Kerja Akuntansi RSCM" 
            className="max-w-full h-auto rounded-xl"
          />
        </div>
      </div>
    </main>
  )
}
