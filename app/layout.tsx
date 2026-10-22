import { type Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'

import { ThemeProvider } from '@/components/theme/provider'
import { cn } from '@/lib/utils'

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
      <body
        className={cn(inter.variable, 'bg-background-main font-sans text-foreground antialiased')}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" disableTransitionOnChange enableSystem>
          {children}
          <Toaster richColors />
        </ThemeProvider>
      </body>
    </html>
  )
}
