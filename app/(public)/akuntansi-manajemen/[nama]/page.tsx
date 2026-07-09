import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Building2, Calendar, Briefcase, Info, ArrowLeft, FileText } from 'lucide-react'

// Fungsi render PDF Cover ringan tanpa client component (mengandalkan iframe asli browser)
function PdfCover({ title, sub, url }: { title: string; sub: string; url: string }) {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="group block" style={{ textDecoration: 'none' }}>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-2 transition-all duration-300 h-full flex flex-col">
        {/* PDF Cover Preview */}
        <div style={{ position: 'relative', width: '100%', aspectRatio: '3/4', background: '#f0f0f0', overflow: 'hidden' }}>
          <iframe
            src={`${url}#page=1&view=FitH&toolbar=0&navpanes=0&scrollbar=0`}
            style={{ width: '200%', height: '200%', border: 'none', transform: 'scale(0.5)', transformOrigin: '0 0', pointerEvents: 'none' }}
            title={title}
          />
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(0,40,43,0.85)] via-[rgba(0,40,43,0.3)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
            <span className="font-nav text-xs font-bold text-[#d0db41] bg-[rgba(0,40,43,0.6)] px-4 py-1.5 rounded-lg backdrop-blur-sm">
              Buka Dokumen →
            </span>
          </div>
        </div>
        {/* Title below */}
        <div className="p-4 bg-white mt-auto">
          <div className="font-nav font-bold text-[13px] text-[#00282b] leading-tight line-clamp-2">{title}</div>
          <div className="font-nav text-[11px] text-gray-500 mt-1">{sub}</div>
        </div>
      </div>
    </a>
  )
}

export const dynamic = 'force-dynamic'

export default async function MitraDetailPage({ params }: { params: Promise<{ nama: string }> }) {
  const supabase = await createClient()
  const { nama } = await params
  const namaMitra = decodeURIComponent(nama)

  // Fetch detail Mitra
  const { data: mitraData } = await supabase
    .from('mitra_kso')
    .select('*')
    .eq('nama', namaMitra)
    .single()

  // Jika mitra tidak ditemukan
  if (!mitraData) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center" style={{ background: '#f4f6f8' }}>
        <h1 className="text-2xl font-bold mb-4">Mitra tidak ditemukan</h1>
        <Link href="/akuntansi-manajemen" className="text-cyan-600 underline">Kembali ke Daftar Mitra</Link>
      </main>
    )
  }

  // Fetch laporan terkait mitra ini
  const { data: laporanData } = await supabase
    .from('akuntansi_manajemen')
    .select('*')
    .eq('nama_kso', namaMitra)
    .order('tahun', { ascending: false })
    .order('periode', { ascending: true })

  const laporan = laporanData ?? []

  return (
    <main className="min-h-screen" style={{ fontFamily: '"TeX Gyre Bonum", Georgia, serif', background: '#f4f6f8' }}>
      
      {/* ═══════ HEADER ═══════ */}
      <div
        className="w-full py-12 px-6"
        style={{
          background: 'linear-gradient(135deg, #00282b 0%, #015a61 100%)',
        }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <Link href="/akuntansi-manajemen" className="inline-flex items-center gap-2 text-cyan-200 hover:text-white font-nav text-sm transition-colors">
              <ArrowLeft size={16} /> Kembali ke Daftar KSO
            </Link>
          </div>
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/10 backdrop-blur-sm">
              <Building2 size={24} color="#d0db41" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white font-nav">
              {mitraData.nama}
            </h1>
          </div>
          <div
            className="mt-4 h-1 w-24 rounded-full"
            style={{ background: '#d0db41' }}
          />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        
        {/* ═══════ INFO PROFIL MITRA ═══════ */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-12">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2" style={{ color: '#00282b' }}>
            <Info size={20} color="#01bcce" /> Profil Kerja Sama
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-nav text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Tentang Mitra</h3>
              <p className="text-gray-700 leading-relaxed font-nav whitespace-pre-line">
                {mitraData.tentang || 'Belum ada deskripsi mengenai profil mitra ini.'}
              </p>
            </div>
            
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="mt-1"><Calendar size={20} className="text-cyan-600" /></div>
                <div>
                  <h3 className="font-nav text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Periode Kerja Sama</h3>
                  <p className="text-gray-800 font-bold font-nav">{mitraData.periode || '-'}</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="mt-1"><Briefcase size={20} className="text-cyan-600" /></div>
                <div>
                  <h3 className="font-nav text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Mekanisme Bagi Hasil</h3>
                  <p className="text-gray-800 font-bold font-nav">{mitraData.mekanisme || '-'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════ DOKUMEN & LAPORAN ═══════ */}
        <div className="mb-8 flex items-center gap-3">
          <div className="w-1 h-8 rounded-full" style={{ background: '#01bcce' }} />
          <h2 className="text-2xl font-bold" style={{ color: '#00282b' }}>
            Laporan Monitoring & Evaluasi KSO
          </h2>
        </div>

        {laporan.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
            <div className="text-5xl mb-4 text-gray-300">📄</div>
            <p className="text-gray-500 font-nav text-lg">Belum ada laporan yang diupload untuk mitra ini.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {laporan.map((lap) => (
              <PdfCover 
                key={lap.id} 
                title={lap.file_name} 
                sub={`${lap.periode} · ${lap.tahun}`} 
                url={lap.file_url} 
              />
            ))}
          </div>
        )}

      </div>
    </main>
  )
}
