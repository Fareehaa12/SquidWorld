import type { Metadata } from 'next'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: 'SQUID — Smart Queue Unleashing Inventory Dominance',
  description: '8 arms. Zero stockouts. RL-powered inventory management.',
  icons: { icon: '/squid-favicon.svg' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="ocean-bg min-h-screen">{children}</body>
    </html>
  )
}
