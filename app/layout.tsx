import { type Metadata } from 'next'
import { Inter } from 'next/font/google'

import '../styles/globals.css'

const inter = Inter({
  adjustFontFallback: true,
  display: 'swap',
  preload: true,
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Ntfy',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html data-scroll-behavior="smooth" lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} bg-background font-sans text-foreground antialiased`}>
        {children}
      </body>
    </html>
  )
}
