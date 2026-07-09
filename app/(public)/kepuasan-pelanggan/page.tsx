import { createClient } from '@/lib/supabase/server'

export const metadata = {
  title: 'Kepuasan Pelanggan | RSCM Akuntansi',
  description: 'Laporan Kepuasan Pelanggan RSCM',
}

interface KepuasanPelanggan {
  id: string
  judul: string
  file_url: string
  file_name?: string
  file_type: 'image' | 'pdf'
  created_at?: string
}

export default async function KepuasanPelangganPage() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('kepuasan_pelanggan')
    .select('id, judul, file_url, file_name, file_type, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching kepuasan_pelanggan:', error)
  }

  const items: KepuasanPelanggan[] = data ?? []

  return (
    <main
      className="min-h-screen"
      style={{ fontFamily: '"TeX Gyre Bonum", Georgia, serif', background: '#f4f6f8' }}
    >
      {/* Header */}
      <div
        className="w-full py-12 px-6"
        style={{
          background: 'linear-gradient(135deg, #00282b 0%, #015a61 100%)',
        }}
      >
        <div className="max-w-6xl mx-auto">
          <h1
            className="text-3xl md:text-4xl font-bold text-white mb-2"
            style={{ fontFamily: 'Nunito, sans-serif' }}
          >
            Kepuasan Pelanggan
          </h1>
          <p className="text-cyan-200 text-lg">
            Laporan dan survei kepuasan pelanggan layanan akuntansi RSCM
          </p>
          <div
            className="mt-4 h-1 w-24 rounded-full"
            style={{ background: '#d0db41' }}
          />
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-6xl mx-auto px-4 py-10">
        {items.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📊</div>
            <p className="text-gray-500 text-xl">Belum ada data kepuasan pelanggan.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 bg-white flex flex-col"
                style={{ border: '1px solid #e0e0e0' }}
              >
                {/* Preview */}
                <div className="relative flex-shrink-0" style={{ height: '220px', background: '#f0f4f4' }}>
                  {item.file_type === 'image' ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.file_url}
                      alt={item.judul}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <iframe
                      src={`${item.file_url}#view=FitH&scrollbar=0&toolbar=0&navpanes=0`}
                      title={item.judul}
                      className="w-full h-full border-none"
                    />
                  )}

                  {/* Badge */}
                  <div
                    className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-bold uppercase"
                    style={{
                      background: item.file_type === 'image' ? '#d0db41' : '#01bcce',
                      color: '#00282b',
                      fontFamily: 'Nunito, sans-serif',
                    }}
                  >
                    {item.file_type === 'image' ? '🖼 Gambar' : '📄 PDF'}
                  </div>
                </div>

                {/* Body */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <h3
                    className="font-bold text-lg leading-tight"
                    style={{ color: '#00282b', fontFamily: 'Nunito, sans-serif' }}
                  >
                    {item.judul}
                  </h3>
                  {item.created_at && (
                    <p className="text-xs mt-2" style={{ color: '#01bcce', fontFamily: 'Nunito, sans-serif' }}>
                      📅{' '}
                      {new Date(item.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  )}
                  <a
                    href={item.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-block text-sm font-bold px-4 py-2 rounded-lg text-center transition-all hover:opacity-90"
                    style={{
                      background: 'linear-gradient(135deg, #01bcce, #0097a7)',
                      color: '#ffffff',
                      fontFamily: 'Nunito, sans-serif',
                    }}
                  >
                    Lihat Selengkapnya ↗
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
