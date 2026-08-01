import type { Metadata, Viewport } from 'next'
import { Outfit } from 'next/font/google'
import { Providers } from './providers'
import { ServiceWorkerRegistration } from '@/components/shared/ServiceWorkerRegistration'
import './globals.css'

const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' })

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#3b82f6' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
}

export const metadata: Metadata = {
  title: 'Relevant+ — Church Management Platform',
  description: 'Modern church management platform for announcements, events, attendance, and community.',
  keywords: ['church', 'management', 'announcements', 'events', 'attendance', 'community', 'Relevant PCF'],
  authors: [{ name: 'Relevant PCF' }],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Relevant+',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    title: 'Relevant+ — Church Management Platform',
    description: 'Modern church management platform for announcements, events, attendance, and community.',
    siteName: 'Relevant+',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={outfit.className}>
        <Providers>{children}</Providers>
        <ServiceWorkerRegistration />
      </body>
    </html>
  )
}
