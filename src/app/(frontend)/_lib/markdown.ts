import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypePrettyCode from 'rehype-pretty-code'
import rehypeStringify from 'rehype-stringify'
import { visit } from 'unist-util-visit'
import { toString as mdastToString } from 'mdast-util-to-string'
import GithubSlugger from 'github-slugger'

export type TocItem = { id: string; text: string; level: number }

// remark 插件：收集 h2/h3 标题，生成右侧 TOC 数据。
// 用 github-slugger 复刻 rehype-slug 的 id 生成规则，保证锚点一致。
function collectHeadings(acc: TocItem[]) {
  const slugger = new GithubSlugger()
  return () => (tree: unknown) => {
    visit(tree as any, 'heading', (node: any) => {
      const text = mdastToString(node)
      const id = slugger.slug(text)
      if (node.depth === 2 || node.depth === 3) {
        acc.push({ id, text, level: node.depth })
      } else {
        // 仍然消费 slugger，保持与 rehype-slug 对同名标题的去重行为一致
        slugger.slug(text)
      }
    })
  }
}

const prettyCodeOptions = {
  theme: { light: 'github-light', dark: 'github-dark' },
  keepBackground: false,
  defaultLang: 'plaintext',
}

// 把 Markdown 源码渲染成 VitePress 风格 HTML，并返回 TOC。
// Shiki 双主题（light/dark），标题自动锚点（wrap 模式，和 VitePress 一致）。
export async function renderMarkdown(
  markdown: string,
): Promise<{ html: string; toc: TocItem[] }> {
  const toc: TocItem[] = []

  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(collectHeadings(toc))
    .use(remarkRehype)
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings as any, {
      behavior: 'wrap',
      properties: { className: ['header-anchor'], ariaHidden: true, tabIndex: -1 },
    })
    .use(rehypePrettyCode as any, prettyCodeOptions)
    .use(rehypeStringify)
    .process(markdown || '')

  return { html: String(file), toc }
}
