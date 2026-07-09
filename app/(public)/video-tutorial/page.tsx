import { createClient } from '@/lib/supabase/server'

export const metadata = {
  title: 'Video Tutorial | RSCM Akuntansi',
  description: 'Kumpulan video tutorial Akuntansi RSCM',
}

interface VideoTutorial {
  id: string
  judul: string
  deskripsi?: string
  video_url: string
  thumbnail_url?: string
  created_at?: string
}

export default async function VideoTutorialPage() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('video_tutorial')
    .select('id, judul, deskripsi, video_url, thumbnail_url, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching video_tutorial:', error)
  }

  const videos: VideoTutorial[] = data ?? []

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
            Video Tutorial
          </h1>
          <p className="text-cyan-200 text-lg">
            Panduan dan tutorial penggunaan sistem akuntansi RSCM
          </p>
          <div
            className="mt-4 h-1 w-24 rounded-full"
            style={{ background: '#d0db41' }}
          />
        </div>
      </div>

      {/* Video Grid */}
      <div className="max-w-6xl mx-auto px-4 py-10">
        {videos.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🎬</div>
            <p className="text-gray-500 text-xl">Belum ada video tutorial tersedia.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {videos.map((video) => (
              <div
                key={video.id}
                className="rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 bg-white"
                style={{ border: '1px solid #e0e0e0' }}
              >
                {/* Video Player */}
                <div className="relative" style={{ background: '#00282b' }}>
                  <video
                    controls
                    preload="metadata"
                    poster={video.thumbnail_url || undefined}
                    className="w-full"
                    style={{ height: '200px', objectFit: 'cover' }}
                  >
                    <source src={video.video_url} type="video/mp4" />
                    <source src={video.video_url} type="video/webm" />
                    Browser Anda tidak mendukung tag video.
                  </video>
                  {/* Play overlay hint */}
                  <div
                    className="absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-bold"
                    style={{ background: '#01bcce', color: '#ffffff', fontFamily: 'Nunito, sans-serif' }}
                  >
                    VIDEO
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5">
                  <h3
                    className="font-bold text-lg leading-tight mb-2"
                    style={{ color: '#00282b', fontFamily: 'Nunito, sans-serif' }}
                  >
                    {video.judul}
                  </h3>
                  {video.deskripsi && (
                    <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
                      {video.deskripsi}
                    </p>
                  )}
                  {video.created_at && (
                    <p className="text-xs mt-3" style={{ color: '#01bcce', fontFamily: 'Nunito, sans-serif' }}>
                      📅{' '}
                      {new Date(video.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  )}
                </div>

                {/* Card Footer */}
                <div
                  className="px-5 py-3"
                  style={{ background: '#f8f9fa', borderTop: '1px solid #e0e0e0' }}
                >
                  <a
                    href={video.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold transition-colors hover:underline"
                    style={{ color: '#01bcce', fontFamily: 'Nunito, sans-serif' }}
                  >
                    Buka di tab baru ↗
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
