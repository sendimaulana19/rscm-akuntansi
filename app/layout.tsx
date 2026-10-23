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
        <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&family=Varela+Round&display=swap" rel="stylesheet" />
        <style>{`
          @font-face {
            font-family: 'TeX Gyre Bonum';
            src: local('TeX Gyre Bonum'), local('TeXGyreBonum-Regular');
          }
          @font-face {
            font-family: 'VAG Rounded';
            src: local('VAG Rounded'), local('VAG Rounded BT'), local('VAGRounded BT'), local('VAGRounded'), local('VAG Rounded Std');
            font-weight: normal;
            font-style: normal;
          }
          @font-face {
            font-family: 'VAG Rounded';
            src: local('VAG Rounded Bold'), local('VAG Rounded BT Bold'), local('VAGRounded BT Bold'), local('VAGRounded-Bold');
            font-weight: bold;
            font-style: normal;
          }
        `}</style>
      </head>
      <body className="antialiased" suppressHydrationWarning>{children}</body>
    </html>
  )
}
