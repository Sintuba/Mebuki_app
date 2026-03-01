import type { Metadata, Viewport } from 'next'
import { Geist_Mono } from 'next/font/google'
import './globals.css'
import { ServiceWorkerRegister } from '@/components/ServiceWorkerRegister'
import { PwaInstallBanner } from '@/components/PwaInstallBanner'
import { Providers } from './providers'

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
})

export const metadata: Metadata = {
  title: 'MEBUKI',
  description: '思考の小さな芽を、構造化されたナレッジに昇華する',
  icons: {
    apple: '/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'MEBUKI',
  },
}

export const viewport: Viewport = {
  themeColor: '#22C55E',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja">
      <body className={`${geistMono.variable} font-mono antialiased`}>
        <ServiceWorkerRegister />
        <PwaInstallBanner />
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
