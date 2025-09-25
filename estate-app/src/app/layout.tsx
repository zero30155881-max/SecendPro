import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AppProvider } from '@/context/AppContext'

const inter = Inter({ subsets: ['latin', 'arabic'] })

export const metadata: Metadata = {
  title: 'نظام إدارة العقارات',
  description: 'نظام شامل لإدارة العقارات والعملاء والعقود',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className={inter.className}>
        <AppProvider>
          <div className="app">
            {children}
          </div>
        </AppProvider>
      </body>
    </html>
  )
}