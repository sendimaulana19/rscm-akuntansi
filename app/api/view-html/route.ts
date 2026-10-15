import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const fileUrl = searchParams.get('url')

  if (!fileUrl) {
    return new NextResponse('URL file tidak ditemukan', { status: 400 })
  }

  try {
    const res = await fetch(fileUrl, { cache: 'no-store' })
    if (!res.ok) {
      return new NextResponse(`Gagal mengambil file: ${res.statusText}`, { status: res.status })
    }

    const htmlContent = await res.text()

    return new NextResponse(htmlContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        // Izinkan script dan style berjalan normal
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (err: any) {
    return new NextResponse(`Error: ${err.message}`, { status: 500 })
  }
}
