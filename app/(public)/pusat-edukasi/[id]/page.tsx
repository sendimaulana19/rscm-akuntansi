import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, PlayCircle, Download, FileText } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function PusatEdukasiDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params

  const { data, error } = await supabase
    .from('video_tutorial')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) {
    console.error('Error fetching data for id', id, ':', error)
    notFound()
  }

  const item = data

  return (
    <main className="min-h-screen" style={{ fontFamily: '"TeX Gyre Bonum", Georgia, serif', background: '#f4f6f8' }}>
      {/* Header */}
      <div className="w-full py-12 px-6 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #00282b 0%, #015a61 100%)' }}>
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

        <div className="max-w-4xl mx-auto relative z-10">
          <Link href="/pusat-edukasi" className="inline-flex items-center gap-2 text-[#01bcce] hover:text-white mb-6 transition-colors font-bold text-sm" style={{ fontFamily: 'Nunito, sans-serif' }}>
            <ArrowLeft size={16} /> Kembali ke Pusat Edukasi
          </Link>
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight" style={{ fontFamily: 'Nunito, sans-serif' }}>
            {item.judul}
          </h1>
          {item.deskripsi && (
            <p className="text-cyan-100 text-lg md:text-xl leading-relaxed opacity-90">
              {item.deskripsi}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Video Player */}
        {item.video_url && (
          <div className="mb-12 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="font-bold text-xl mb-4 text-[#00282b] flex items-center gap-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
              <PlayCircle size={24} className="text-[#01bcce]" /> Video Edukasi
            </h2>
            <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black">
              <iframe
                src={(() => {
                  const url = item.video_url;
                  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
                  const match = url.match(regExp);
                  return (match && match[2].length === 11) 
                    ? `https://www.youtube.com/embed/${match[2]}` 
                    : url;
                })()}
                className="absolute inset-0 w-full h-full"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            </div>
          </div>
        )}

        {/* Artikel / Konten Rich Text */}
        {item.konten && (
          <div className="mb-12 bg-white p-8 md:p-10 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="font-bold text-xl mb-6 text-[#00282b] flex items-center gap-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
              <FileText size={24} className="text-[#01bcce]" /> Penjelasan Materi
            </h2>
            <div 
              className="prose prose-lg max-w-none text-gray-700 prose-headings:font-bold prose-headings:text-[#00282b] prose-a:text-[#01bcce] break-words whitespace-pre-wrap overflow-hidden"
              dangerouslySetInnerHTML={{ __html: item.konten }} 
            />
          </div>
        )}

        {/* Download Materi Dokumen */}
        {item.materi_url && (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
            <h2 className="font-bold text-xl mb-3 text-[#00282b]" style={{ fontFamily: 'Nunito, sans-serif' }}>
              Dokumen Materi Edukasi
            </h2>
            <p className="text-gray-500 mb-6">Unduh lampiran dokumen terkait materi ini untuk dipelajari lebih lanjut.</p>
            <a 
              href={item.materi_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-8 py-4 bg-[#01bcce] text-[#00282b] font-bold rounded-xl hover:bg-[#00282b] hover:text-white transition-all shadow-md"
            >
              <Download size={20} /> Unduh File Materi
            </a>
          </div>
        )}
      </div>
    </main>
  )
}
