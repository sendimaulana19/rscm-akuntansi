import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Tim Kerja Akuntansi — RSUPN Dr. Cipto Mangunkusumo',
  description: 'Portal internal Tim Kerja Akuntansi RSUPN Dr. Cipto Mangunkusumo',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet" />
        <style>{`
          @font-face {
            font-family: 'TeX Gyre Bonum';
            src: local('TeX Gyre Bonum'), local('TeXGyreBonum-Regular');
          }
        `}</style>
      </head>
      <body className="antialiased" suppressHydrationWarning>{children}</body>
    </html>
  )
}
