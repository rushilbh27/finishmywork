import './globals.css'
import { Providers } from './providers'
import { CursorGlow } from '@/components/CursorGlow'
import { Toaster } from '@/components/ui/toaster'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'FinishMyWork',
  description: 'Connect. Learn. Earn.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-[--bg] text-[--text] antialiased`}>
        <CursorGlow />
        <Providers>
          {children}
        </Providers>
        <Toaster />
      </body>
    </html>
  )
}
