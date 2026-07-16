// 纯常量与工具（无 Payload 依赖）——可安全被客户端组件引用
export const LOCALES = ['zh', 'en'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'zh'

export function isLocale(v: string | undefined): v is Locale {
  return !!v && (LOCALES as readonly string[]).includes(v)
}

// 从 /docs/[[...slug]] 的路径段拆出 locale 与文档 slug
// /docs/zh/about/intro -> { locale: 'zh', slug: 'about/intro' }
// /docs/about/intro    -> { locale: 'zh'(默认), slug: 'about/intro' }
export function parsePath(segments: string[] = []): { locale: Locale; slug: string } {
  if (segments.length && isLocale(segments[0])) {
    return { locale: segments[0] as Locale, slug: segments.slice(1).join('/') }
  }
  return { locale: DEFAULT_LOCALE, slug: segments.join('/') }
}

export function docUrl(locale: Locale, slug: string): string {
  return `/docs/${locale}/${slug}`.replace(/\/+$/, '')
}
