'use client'
import { SessionProvider } from 'next-auth/react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { NotificationProvider } from '@/components/NotificationProvider'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <NotificationProvider>
        <div className="flex flex-col min-h-screen bg-transparent">
          <Navbar />
          {/* PATCH: reduce global top padding under fixed navbar to tighten header/content gap */}
          <main className="flex-1 bg-transparent pt-24">
            {children}
          </main>
          <Footer />
        </div>
      </NotificationProvider>
    </SessionProvider>
  )
}