/**
 * Helper untuk memisahkan dan memformat Judul & Caption pada Dokumentasi Kegiatan
 */

export interface JudulCaption {
  judul: string
  caption: string
}

export function parseJudulCaption(raw: string = ''): JudulCaption {
  if (!raw) return { judul: 'Dokumentasi Kegiatan', caption: '' }

  // 1. Tagged format: [JUDUL]...[/JUDUL]...
  const matchTagged = raw.match(/\[JUDUL\]([\s\S]*?)\[\/JUDUL\]([\s\S]*)/i)
  if (matchTagged) {
    return {
      judul: matchTagged[1].trim() || 'Dokumentasi Kegiatan',
      caption: matchTagged[2].trim(),
    }
  }

  // 2. Baris terpisah oleh newline (\n)
  // Baris pertama dianggap Judul, baris berikutnya dianggap Caption
  const lines = raw.split('\n')
  const firstNonEmptyIdx = lines.findIndex(l => l.trim().length > 0)
  if (firstNonEmptyIdx !== -1) {
    const firstLine = lines[firstNonEmptyIdx].trim()
    const remaining = lines.slice(firstNonEmptyIdx + 1).join('\n').trim()
    if (remaining) {
      return {
        judul: firstLine,
        caption: remaining,
      }
    }
  }

  // 3. Hanya 1 baris
  return {
    judul: raw.trim(),
    caption: '',
  }
}

export function formatJudulCaption(judul: string, caption: string): string {
  const j = (judul || '').trim()
  const c = (caption || '').trim()
  if (c) {
    return `[JUDUL]${j}[/JUDUL]${c}`
  }
  return j
}
