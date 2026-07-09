import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Building2, ChevronRight, FileText, Calendar, Briefcase } from 'lucide-react'

export const metadata = {
  title: 'Akuntansi Manajemen | RSCM Akuntansi',
  description: 'Profil dan Laporan KSO RSCM',
}

export default async function AkuntansiManajemenPage() {
  const supabase = await createClient()

  // Fetch Mitra KSO
  const { data: mitraList, error } = await supabase
    .from('mitra_kso')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching mitra_kso:', error)
  }

  const mitras = mitraList ?? []

  return (
    <main className="min-h-screen" style={{ fontFamily: '"TeX Gyre Bonum", Georgia, serif', background: '#f4f6f8' }}>
      <style>{`
        @keyframes fadeUpCard {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      {/* ═══════ HERO ═══════ */}
      <div
        style={{
          position: 'relative',
          height: 320,
          // Ganti 'header-kso.jpg' dengan nama file gambar yang diupload
          backgroundImage: 'url(/images/header-kso.jpg), linear-gradient(135deg, #00282b 0%, #015a61 100%)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, rgba(0,40,43,.85), rgba(0,40,43,.6))',
          }}
        />
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            maxWidth: 1140,
            margin: '0 auto',
            padding: '0 24px',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 48,
                fontWeight: 900,
                color: '#fff',
                lineHeight: 1.1,
                margin: 0,
                fontFamily: 'Nunito, sans-serif',
              }}
            >
              Akuntansi Manajemen
            </h1>
            <div style={{ width: 70, height: 4, background: '#d0db41', borderRadius: 2, marginTop: 16 }} />
          </div>
        </div>
      </div>

      {/* ═══════ KONTEN ═══════ */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        
        <div className="mb-10 text-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ width: 4, height: 28, background: '#01bcce', borderRadius: 2 }} />
            <h2 style={{ fontSize: 26, fontWeight: 800, color: '#00282b', margin: 0 }}>Monitoring dan Evaluasi KSO</h2>
          </div>
          <p style={{ fontFamily: 'Nunito, sans-serif', fontSize: 13, color: '#888', margin: '0 0 20px', paddingLeft: 16 }}>
            Silakan pilih Mitra KSO di bawah ini untuk melihat profil kerja sama dan laporan monitoring dan evaluasi KSO.
          </p>
        </div>

        {mitras.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="text-6xl mb-4 text-gray-300">🏢</div>
            <p className="text-gray-500 font-nav text-lg">Belum ada profil Mitra KSO yang ditambahkan.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mitras.map((mitra, index) => (
              <Link key={mitra.id} href={`/akuntansi-manajemen/${encodeURIComponent(mitra.nama)}`} className="group block" style={{ opacity: 0, animation: 'fadeUpCard 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards', animationDelay: `${index * 0.15}s` }}>
                <div className="bg-white rounded-2xl p-6 shadow-md border border-white/50 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 h-full flex flex-col relative overflow-hidden">
                  
                  {/* Dekorasi Pojok */}
                  <div className="absolute -right-6 -top-6 w-24 h-24 bg-cyan-50/50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500" />

                  <div className="relative z-10 flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #00282b, #015a61)' }}>
                      <Building2 size={24} color="#d0db41" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xl leading-tight" style={{ color: '#00282b' }}>
                        {mitra.nama}
                      </h3>
                    </div>
                  </div>

                  <div className="relative z-10 space-y-3 mt-auto pt-4 border-t border-gray-50 font-nav text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-cyan-600" />
                      <span className="truncate">{mitra.periode || 'Periode belum diatur'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Briefcase size={16} className="text-cyan-600" />
                      <span className="truncate">Bagi Hasil: {mitra.mekanisme || '-'}</span>
                    </div>
                  </div>

                  <div className="relative z-10 mt-6 flex items-center justify-between text-cyan-600 font-nav font-bold text-sm">
                    <span>Lihat Detail Laporan</span>
                    <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
