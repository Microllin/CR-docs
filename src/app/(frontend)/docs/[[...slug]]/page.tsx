import { notFound, redirect } from 'next/navigation'
import { renderMarkdown } from '../../_lib/markdown'
import {
  flattenSidebar,
  getDocBySlug,
  getPager,
  getSettings,
  getSidebar,
  parsePath,
  type Locale,
  type SiteSettings,
} from '../../_lib/nav'
import { TopNav } from '../../_components/TopNav'
import { Sidebar } from '../../_components/Sidebar'
import { TocAside } from '../../_components/TocAside'
import { Pager } from '../../_components/Pager'

// 文档内容随后台编辑实时变化，按需动态渲染
export const dynamic = 'force-dynamic'

export default async function DocPage(props: { params: Promise<{ slug?: string[] }> }) {
  const { slug: segments = [] } = await props.params
  const { locale, slug } = parsePath(segments)

  const [sidebar, settings] = await Promise.all([getSidebar(locale), getSettings(locale)])

  // /docs 或 /docs/zh —— 无具体文档时，跳到侧边栏第一篇
  if (!slug) {
    const first = flattenSidebar(sidebar)[0]
    if (first) redirect(first.url)
    return (
      <Shell locale={locale} sidebar={sidebar} settings={settings}>
        <EmptyState />
      </Shell>
    )
  }

  const doc = await getDocBySlug(slug, locale)
  if (!doc) notFound()

  const { html, toc } = await renderMarkdown(doc.content || '')
  const { prev, next } = getPager(sidebar, slug)

  return (
    <Shell locale={locale} sidebar={sidebar} settings={settings} aside={<TocAside items={toc} />}>
      <article className="vp-doc">
        <h1 className="vp-doc-title">{doc.title}</h1>
        <div className="vp-doc-content" dangerouslySetInnerHTML={{ __html: html }} />
        <Pager prev={prev} next={next} />
      </article>
    </Shell>
  )
}

function Shell({
  locale,
  sidebar,
  settings,
  aside,
  children,
}: {
  locale: Locale
  sidebar: Awaited<ReturnType<typeof getSidebar>>
  settings: SiteSettings
  aside?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="vp-layout">
      <TopNav locale={locale} siteName={settings.siteName} logoMark={settings.logoMark} />
      <div className="vp-body">
        <Sidebar groups={sidebar} />
        <main className="vp-main">{children}</main>
        {aside ?? <aside className="vp-aside" />}
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <article className="vp-doc">
      <h1 className="vp-doc-title">还没有内容</h1>
      <div className="vp-doc-content">
        <p>
          请先到 <a href="/admin">后台</a> 创建文档，并在「侧边栏导航」里配置分组。
        </p>
      </div>
    </article>
  )
}
