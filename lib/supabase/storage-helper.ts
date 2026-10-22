/**
 * Helper terpusat untuk mengelola dan menghapus berkas fisik di Supabase Storage.
 * Memastikan path subdirektori (folder) dan karakter spasi (%20) ter-decode dengan benar
 * sehingga berkas fisik benar-benar terhapus dan tidak membebani kuota penyimpanan.
 */

export interface ParsedStorageUrl {
  bucket: string
  path: string
}

/**
 * Mendapatkan nama bucket dan relative file path dari URL Supabase Storage.
 * Contoh:
 * https://xyz.supabase.co/storage/v1/object/public/rscm-files/materi-edukasi/1791260870551.pptx
 * -> { bucket: 'rscm-files', path: 'materi-edukasi/1791260870551.pptx' }
 */
export function parseStorageUrl(fileUrl: string | null | undefined): ParsedStorageUrl | null {
  if (!fileUrl || typeof fileUrl !== 'string') return null

  // Hilangkan query parameter seperti ?t=123
  const cleanUrl = fileUrl.split('?')[0].trim()

  // Pola standar public url Supabase: /storage/v1/object/public/<bucket>/<path>
  const publicMarker = '/storage/v1/object/public/'
  const markerIdx = cleanUrl.indexOf(publicMarker)

  if (markerIdx !== -1) {
    const afterMarker = cleanUrl.substring(markerIdx + publicMarker.length)
    const slashIdx = afterMarker.indexOf('/')
    if (slashIdx !== -1) {
      const bucket = afterMarker.substring(0, slashIdx)
      const rawPath = afterMarker.substring(slashIdx + 1)
      try {
        return { bucket, path: decodeURIComponent(rawPath) }
      } catch {
        return { bucket, path: rawPath }
      }
    }
  }

  // Fallback: deteksi bucket 'rscm-files' atau 'rscm-images'
  const knownBuckets = ['rscm-files', 'rscm-images']
  for (const bucket of knownBuckets) {
    const bucketMarker = `/${bucket}/`
    const bIdx = cleanUrl.indexOf(bucketMarker)
    if (bIdx !== -1) {
      const rawPath = cleanUrl.substring(bIdx + bucketMarker.length)
      try {
        return { bucket, path: decodeURIComponent(rawPath) }
      } catch {
        return { bucket, path: rawPath }
      }
    }
  }

  return null
}

/**
 * Menghapus satu berkas fisik dari Supabase Storage.
 * Aman dipanggil: jika bukan URL Supabase atau berkas sudah tidak ada, tidak akan melempar unhandled exception.
 */
export async function deleteFileFromStorage(
  supabase: any,
  fileUrlOrPath: string | null | undefined,
  fallbackBucket: string = 'rscm-files'
): Promise<boolean> {
  if (!fileUrlOrPath) return false

  const parsed = parseStorageUrl(fileUrlOrPath)
  let bucket = fallbackBucket
  let path = fileUrlOrPath

  if (parsed) {
    bucket = parsed.bucket
    path = parsed.path
  } else {
    // Jika diberikan raw path tanpa URL penuh
    try {
      path = decodeURIComponent(path.split('?')[0].trim())
    } catch {
      path = path.split('?')[0].trim()
    }
  }

  // Jangan proses jika path kosong atau URL eksternal (misal Google Drive, Youtube)
  if (!path || path.startsWith('http://') || path.startsWith('https://')) {
    return false
  }

  try {
    const { error } = await supabase.storage.from(bucket).remove([path])
    if (error) {
      console.warn(`[StorageCleanup] Peringatan: gagal menghapus berkas ${path} di bucket ${bucket}:`, error.message)
      return false
    }
    console.log(`[StorageCleanup] Berhasil menghapus berkas ${path} dari bucket ${bucket}`)
    return true
  } catch (err: any) {
    console.warn(`[StorageCleanup] Exception saat menghapus berkas ${path}:`, err?.message)
    return false
  }
}

/**
 * Menghapus banyak berkas fisik dari Supabase Storage sekaligus.
 */
export async function deleteFilesFromStorage(
  supabase: any,
  urlsOrPaths: (string | null | undefined)[]
): Promise<void> {
  const validItems = urlsOrPaths.filter((item): item is string => Boolean(item))
  if (validItems.length === 0) return

  await Promise.allSettled(
    validItems.map((item) => deleteFileFromStorage(supabase, item))
  )
}
