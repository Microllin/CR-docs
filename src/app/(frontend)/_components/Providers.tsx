'use client'

import { ThemeProvider } from 'next-themes'
import React from 'react'

// next-themes：切换 html 上的 .dark class，对应 vitepress.css 里的 html.dark
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
      {children}
    </ThemeProvider>
  )
}
