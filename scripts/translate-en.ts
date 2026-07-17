import 'dotenv/config'
import { getPayload } from 'payload'
import Anthropic from '@anthropic-ai/sdk'
import config from '../src/payload.config'

// 把中文文档机器翻译成英文，写入 en locale。
// 运行（宿主机，连本地开发库 + 会话网关）：
//   DATABASE_URL=postgres://payload:payload@localhost:5432/zenmux pnpm tsx scripts/translate-en.ts
// 需要环境变量：ANTHROPIC_BASE_URL、ANTHROPIC_AUTH_TOKEN（脚本内不落任何密钥）

const MODEL = 'claude-opus-4-8'
const CONCURRENCY = 4
const MAX_RETRY = 2

const anthropic = new Anthropic({
  baseURL: process.env.ANTHROPIC_BASE_URL,
  authToken: process.env.ANTHROPIC_AUTH_TOKEN,
  apiKey: process.env.ANTHROPIC_API_KEY || undefined,
  defaultHeaders: { 'anthropic-beta': 'oauth-2025-04-20' },
})

const SYSTEM = `You are a professional technical documentation translator. Translate the given Chinese text into natural, fluent English suitable for developer documentation.

Rules:
- Output ONLY the translation. No preamble, no explanation, no wrapping.
- Preserve ALL Markdown structure exactly: headings, lists, tables, blockquotes, links.
- Do NOT translate content inside code blocks/inline code, commands, variable names, environment variables, file paths, URLs, or slugs — keep them byte-for-byte.
- Keep link targets unchanged (e.g. /docs/zh/... stays as written; do not alter paths).
- Use standard English technical terminology. Keep product/brand names as-is.`

// 调 Claude 翻译一段文本；空串直接返回
async function translate(text: string, kind: string): Promise<string> {
  const src = (text || '').trim()
  if (!src) return text || ''
  const user = `Translate the following Chinese ${kind} to English. Output only the translation.\n\n${src}`
  let lastErr: unknown
  for (let attempt = 0; attempt <= MAX_RETRY; attempt++) {
    try {
      const resp = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 16000,
        system: SYSTEM,
        messages: [{ role: 'user', content: user }],
      })
      const out = resp.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map((b) => b.text)
        .join('')
        .trim()
      if (!out) throw new Error('empty translation')
      return out
    } catch (e) {
      lastErr = e
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)))
    }
  }
  throw lastErr
}

// 译文里内部链接指向英文页
function toEnLinks(md: string): string {
  return md.replace(/\/docs\/zh\//g, '/docs/en/')
}

// 简单并发池
async function pool<T>(items: T[], n: number, fn: (item: T, i: number) => Promise<void>) {
  let idx = 0
  const workers = Array.from({ length: Math.min(n, items.length) }, async () => {
    while (idx < items.length) {
      const cur = idx++
      await fn(items[cur], cur)
    }
  })
  await Promise.all(workers)
}

async function run() {
  const payload = await getPayload({ config: await config })

  // 1) 文档
  const res = await payload.find({ collection: 'docs', limit: 1000, pagination: false, depth: 0 })
  const docs = res.docs as Array<{ id: number; slug: string }>
  payload.logger.info(`开始翻译 ${docs.length} 篇文档 -> en`)

  let done = 0
  await pool(docs, CONCURRENCY, async (d) => {
    // 取该文档的中文源
    const zh = await payload.findByID({ collection: 'docs', id: d.id, locale: 'zh', depth: 0 })
    const [title, excerpt, content] = await Promise.all([
      translate((zh as any).title || '', 'page title'),
      translate((zh as any).excerpt || '', 'summary'),
      translate((zh as any).content || '', 'Markdown document'),
    ])
    await payload.update({
      collection: 'docs',
      id: d.id,
      locale: 'en',
      data: { title, excerpt, content: toEnLinks(content) },
    })
    done++
    payload.logger.info(`  [${done}/${docs.length}] ${d.slug} ✓`)
  })

  // 2) 导航分组标题
  const nav = await payload.findGlobal({ slug: 'navigation', locale: 'zh', depth: 0 })
  const groups = (nav as any).groups ?? []
  const enGroups = []
  for (const g of groups) {
    enGroups.push({ ...g, label: await translate(g.label || '', 'navigation label') })
  }
  if (enGroups.length) {
    await payload.updateGlobal({ slug: 'navigation', locale: 'en', data: { groups: enGroups } })
    payload.logger.info(`导航 ${enGroups.length} 个分组标题已翻译`)
  }

  // 3) 站点设置描述（siteName 是品牌名，不译）
  const s = await payload.findGlobal({ slug: 'settings', locale: 'zh', depth: 0 })
  if ((s as any).description) {
    await payload.updateGlobal({
      slug: 'settings',
      locale: 'en',
      data: { description: await translate((s as any).description, 'site description') },
    })
    payload.logger.info('站点描述已翻译')
  }

  payload.logger.info('🎉 英文翻译完成')
  process.exit(0)
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
