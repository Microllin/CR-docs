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
}: {
  locale: Locale
  siteName: string
  logoMark: string
}) {
  return (
    <header className="vp-nav">
      <div className="vp-nav-inner">
        <Link href={`/docs/${locale}`} className="vp-nav-logo">
          <span className="vp-logo-mark">{logoMark}</span>
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
