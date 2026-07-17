import { getPayload } from 'payload'
import config from '@/payload.config'
import type { Doc } from '@/payload-types'
import { docUrl, type Locale } from './locale'

// 从 locale.ts 再导出，方便服务端代码统一从 nav 引入
export { LOCALES, DEFAULT_LOCALE, isLocale, parsePath, docUrl } from './locale'
export type { Locale } from './locale'

let _payload: Awaited<ReturnType<typeof getPayload>> | null = null
export async function getPayloadClient() {
  if (_payload) return _payload
  _payload = await getPayload({ config: await config })
  return _payload
}

export type NavLink = { title: string; slug: string; url: string }
export type NavGroup = { label: string; collapsed: boolean; items: NavLink[] }

// 读取 Navigation global，解析成侧边栏分组结构（已按 locale 本地化）
export async function getSidebar(locale: Locale): Promise<NavGroup[]> {
  const payload = await getPayloadClient()
  const nav = await payload.findGlobal({ slug: 'navigation', locale, depth: 1 })

  const groups: NavGroup[] = []
  for (const g of nav?.groups ?? []) {
    const items: NavLink[] = []
    for (const it of g.items ?? []) {
      const doc = it.doc
      if (doc && typeof doc === 'object') {
        items.push({ title: doc.title, slug: doc.slug, url: docUrl(locale, doc.slug) })
      }
    }
    groups.push({ label: g.label ?? '', collapsed: !!g.collapsed, items })
  }
  return groups
}

// 侧边栏扁平顺序 -> 用于计算上一页/下一页
export function flattenSidebar(groups: NavGroup[]): NavLink[] {
  return groups.flatMap((g) => g.items)
}

export type PagerLink = { title: string; url: string } | null
export function getPager(
  groups: NavGroup[],
  currentSlug: string,
): { prev: PagerLink; next: PagerLink } {
  const flat = flattenSidebar(groups)
  const idx = flat.findIndex((l) => l.slug === currentSlug)
  if (idx === -1) return { prev: null, next: null }
  const prev = idx > 0 ? flat[idx - 1] : null
  const next = idx < flat.length - 1 ? flat[idx + 1] : null
  return {
    prev: prev ? { title: prev.title, url: prev.url } : null,
    next: next ? { title: next.title, url: next.url } : null,
  }
}

// 按 slug + locale 取单篇文档（仅已发布）
export async function getDocBySlug(slug: string, locale: Locale): Promise<Doc | null> {
  const payload = await getPayloadClient()
  const res = await payload.find({
    collection: 'docs',
    where: { slug: { equals: slug } },
    locale,
    limit: 1,
    depth: 0,
  })
  return (res.docs[0] as Doc) ?? null
}

// 所有文档 slug（用于 generateStaticParams / 兜底导航）
export async function getAllDocSlugs(): Promise<string[]> {
  const payload = await getPayloadClient()
  const res = await payload.find({ collection: 'docs', limit: 1000, depth: 0, pagination: false })
  return res.docs.map((d) => (d as Doc).slug).filter(Boolean)
}

export type SiteSettings = {
  siteName: string
  logoMark: string
  description: string
  logoUrl: string | null
  faviconUrl: string | null
}

// 从 upload 字段里取媒体 URL（depth>=1 时 payload 会填充关联对象）
function mediaUrl(v: unknown): string | null {
  if (v && typeof v === 'object' && 'url' in v) {
    const u = (v as { url?: string }).url
    return u || null
  }
  return null
}

// 读取站点设置（后台可改），带兜底默认值
// 构建期预渲染 / 或数据库暂不可用时不抛错，返回默认值
export async function getSettings(locale: Locale): Promise<SiteSettings> {
  try {
    const payload = await getPayloadClient()
    const s = await payload.findGlobal({ slug: 'settings', locale, depth: 1 })
    const siteName = s?.siteName || 'Docs'
    return {
      siteName,
      logoMark: s?.logoMark || siteName.charAt(0).toUpperCase(),
      description: s?.description || '',
      logoUrl: mediaUrl(s?.logo),
      faviconUrl: mediaUrl(s?.favicon),
    }
  } catch {
    return { siteName: 'Docs', logoMark: 'D', description: '', logoUrl: null, faviconUrl: null }
  }
}
