import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

// 按 slug 前缀把文档分组，配置侧边栏导航
// 每组内的顺序 = 下面数组的顺序（同时决定上一页/下一页）
const GROUPS: { label: string; slugs: string[] }[] = [
  {
    label: '入门',
    slugs: [
      'guide/intro',
      'guide/platform-intro',
      'guide/pricing',
      'guide/view-models',
      'guide/account-system',
      'guide/roles-permissions',
      'guide/registration',
      'guide/migration',
    ],
  },
  {
    label: '开发者指南',
    slugs: [
      'guide/dev/overview',
      'guide/dev/quickstart',
      'guide/dev/api-basics',
      'guide/dev/routing',
      'guide/dev/sdk',
      'guide/dev/third-party',
      'guide/dev/errors',
      'guide/dev/claude-lang-drift',
      'guide/dev/faq',
    ],
  },
  {
    label: '管理员手册',
    slugs: [
      'guide/admin/overview',
      'guide/admin/api-keys',
      'guide/admin/sub-users',
      'guide/admin/recharge',
      'guide/admin/balance',
      'guide/admin/balance-alert',
      'guide/admin/billing',
      'guide/admin/invoice',
      'guide/admin/concurrency',
      'guide/admin/region-models',
      'guide/admin/faq',
    ],
  },
  {
    label: '子用户手册',
    slugs: [
      'guide/subuser/overview',
      'guide/subuser/activation',
      'guide/subuser/dashboard',
      'guide/subuser/api-keys',
      'guide/subuser/call-guide',
      'guide/subuser/usage-profile',
      'guide/subuser/faq',
    ],
  },
  {
    label: '工具接入',
    slugs: [
      'guide/tools/overview',
      'guide/tools/claude-code',
      'guide/tools/cursor',
      'guide/tools/cline',
    ],
  },
]

async function run() {
  const payload = await getPayload({ config: await config })

  const res = await payload.find({ collection: 'docs', limit: 1000, pagination: false, depth: 0 })
  const idBySlug = new Map<string, number>()
  for (const d of res.docs) idBySlug.set((d as any).slug, (d as any).id as number)

  const usedSlugs = new Set<string>()
  const groups = GROUPS.map((g) => {
    const items = g.slugs
      .filter((s) => {
        const ok = idBySlug.has(s)
        if (!ok) payload.logger.warn(`⚠️  分组「${g.label}」里的 slug 不存在，已跳过: ${s}`)
        if (ok) usedSlugs.add(s)
        return ok
      })
      .map((s) => ({ doc: idBySlug.get(s)! }))
    return { label: g.label, collapsed: false, items }
  })

  // 收集未被任何分组覆盖的文档，兜底放进「其他」
  const leftover = [...idBySlug.keys()].filter((s) => !usedSlugs.has(s)).sort()
  if (leftover.length) {
    payload.logger.info(`ℹ️  ${leftover.length} 篇未分组，归入「其他」: ${leftover.join(', ')}`)
    groups.push({
      label: '其他',
      collapsed: false,
      items: leftover.map((s) => ({ doc: idBySlug.get(s)! })),
    })
  }

  await payload.updateGlobal({ slug: 'navigation', data: { groups } })
  const total = groups.reduce((n, g) => n + g.items.length, 0)
  payload.logger.info(`✅ 已配置 ${groups.length} 个分组，共 ${total} 篇文档`)
  process.exit(0)
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
