import { createClient } from '@/lib/supabase/server'
import { HelpCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'FAQ | RSCM Akuntansi',
  description: 'Frequently Asked Questions (FAQ) Tim Akuntansi RSCM',
}

interface FAQ {
  id: string
  pertanyaan: string
  jawaban: string
}

export default async function FAQPage() {
  const supabase = await createClient()

  // Fetch FAQ data
  const { data, error } = await supabase
    .from('faq')
    .select('id, pertanyaan, jawaban')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching FAQ:', error)
  }

  const items: FAQ[] = data ?? []

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

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center justify-center p-3 rounded-full bg-white/10 mb-4 text-[#d0db41]">
            <HelpCircle size={40} />
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight" style={{ fontFamily: 'Nunito, sans-serif' }}>
            Frequently Asked Questions
          </h1>
          <div className="mt-6 h-1 w-24 rounded-full mx-auto" style={{ background: '#d0db41' }} />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {items.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
            <p className="text-gray-500 text-lg">Belum ada FAQ saat ini.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {items.map((item) => (
              <div 
                key={item.id} 
                className="bg-white rounded-2xl p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow border border-gray-100"
              >
                {/* Bagian Atas: Pertanyaan */}
                <h3 
                  className="text-xl md:text-2xl font-bold text-[#00282b] mb-4" 
                  style={{ fontFamily: 'Nunito, sans-serif' }}
                >
                  Q: {item.pertanyaan}
                </h3>
                
                {/* Garis Pemisah Tipis */}
                <hr className="border-gray-100 mb-4" />
                
                {/* Bagian Bawah: Jawaban */}
                <div 
                  className="prose prose-lg max-w-none text-gray-600 leading-relaxed whitespace-pre-wrap break-words"
                  dangerouslySetInnerHTML={{ __html: item.jawaban }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
