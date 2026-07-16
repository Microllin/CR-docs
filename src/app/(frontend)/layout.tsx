import React from 'react'
import type { Metadata } from 'next'
import './_styles/vitepress.css'
import { Providers } from './_components/Providers'
import { getSettings, DEFAULT_LOCALE } from './_lib/nav'

// 标题/描述来自后台「站点设置」，可在 /admin 修改
export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings(DEFAULT_LOCALE)
  return {
    title: s.siteName,
    description: s.description || s.siteName,
  }
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="zh" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
