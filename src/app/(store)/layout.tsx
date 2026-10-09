import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AuraMart — Luxury AR Shopping',
  description: 'Minimalist luxury apparel with real-time AR virtual try-on powered by FitVision.',
}

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={inter.className}>
      {children}
    </div>
  )
}
