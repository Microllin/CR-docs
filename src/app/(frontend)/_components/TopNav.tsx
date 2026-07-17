'use client'

import Link from 'next/link'
import { type Locale } from '../_lib/locale'
import { SearchDialog } from './SearchDialog'
import { ThemeToggle } from './ThemeToggle'

// 顶部导航栏（VPNav）：Logo + 搜索 + 深浅色
export function TopNav({
  locale,
  siteName,
  logoMark,
  logoUrl,
}: {
  locale: Locale
  siteName: string
  logoMark: string
  logoUrl?: string | null
}) {
  return (
    <header className="vp-nav">
      <div className="vp-nav-inner">
        <Link href={`/docs/${locale}`} className="vp-nav-logo">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="vp-logo-img" src={logoUrl} alt={siteName} />
          ) : (
            <span className="vp-logo-mark">{logoMark}</span>
          )}
          <span className="vp-logo-text">{siteName}</span>
        </Link>

        <div className="vp-nav-right">
          <SearchDialog locale={locale} />
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
