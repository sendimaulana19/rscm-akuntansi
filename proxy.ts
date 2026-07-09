import { NextResponse, type NextRequest } from 'next/server'

// Proxy hanya meneruskan request tanpa memblokir
// Auth check dilakukan di dalam masing-masing admin page
export async function proxy(request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
