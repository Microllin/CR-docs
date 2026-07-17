import React from 'react'
import type { Metadata } from 'next'
import './_styles/vitepress.css'
import { Providers } from './_components/Providers'
import { getSettings, DEFAULT_LOCALE } from './_lib/nav'

// 标题/描述/favicon 来自后台「站点设置」，可在 /admin 修改
export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings(DEFAULT_LOCALE)
  const meta: Metadata = {
    title: s.siteName,
    description: s.description || s.siteName,
  }
  if (s.faviconUrl) {
    meta.icons = { icon: s.faviconUrl }
  }
  return meta
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
