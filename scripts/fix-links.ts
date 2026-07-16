import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

// 原始文件 basename -> 站点 slug（文件名在整套文档里全局唯一，故按 basename 解析）
const BY_NAME: Record<string, string> = {
  '00-总览.md': 'guide/admin/overview',
  '00-子用户手册总览.md': 'guide/subuser/overview',
  '00-开发者指南总览.md': 'guide/dev/overview',
  '00-价格说明.md': 'guide/pricing',
  '00-工具接入总览.md': 'guide/tools/overview',
  '01-平台简介.md': 'guide/platform-intro',
  '01-Claude-Code.md': 'guide/tools/claude-code',
  '01-子用户管理.md': 'guide/admin/sub-users',
  '01-快速开始.md': 'guide/dev/quickstart',
  '01-激活与登录.md': 'guide/subuser/activation',
  '02-API-Key与路由分组.md': 'guide/admin/api-keys',
  '02-API调用基础.md': 'guide/dev/api-basics',
  '02-Cursor.md': 'guide/tools/cursor',
  '02-仪表盘与额度.md': 'guide/subuser/dashboard',
  '02-账户体系说明.md': 'guide/account-system',
  '03-API-密钥管理.md': 'guide/subuser/api-keys',
  '03-Cline.md': 'guide/tools/cline',
  '03-SDK接入.md': 'guide/dev/sdk',
  '03-充值与兑换码.md': 'guide/admin/recharge',
  '03-角色与权限.md': 'guide/roles-permissions',
  '04-余额管理与额度分配.md': 'guide/admin/balance',
  '04-第三方工具接入.md': 'guide/dev/third-party',
  '04-调用指南.md': 'guide/subuser/call-guide',
  '04-迁移与过渡说明.md': 'guide/migration',
  '05-使用记录与个人资料.md': 'guide/subuser/usage-profile',
  '05-组织注册与开通.md': 'guide/registration',
  '05-账单与用量监控.md': 'guide/admin/billing',
  '05-错误码与排障.md': 'guide/dev/errors',
  '06-余额预警与欠费.md': 'guide/admin/balance-alert',
  '06-子用户常见问题.md': 'guide/subuser/faq',
  '06-调用指南与双路由.md': 'guide/dev/routing',
  '07-Claude语言漂移说明.md': 'guide/dev/claude-lang-drift',
  '07-发票与凭证.md': 'guide/admin/invoice',
  '08-地区与模型范围.md': 'guide/admin/region-models',
  '08-开发者常见问题.md': 'guide/dev/faq',
  '09-并发设置.md': 'guide/admin/concurrency',
}

// 目录链接（以 / 结尾）-> 该手册总览
const BY_DIR: Record<string, string> = {
  '01-入门与概览': 'guide/intro',
  '02-组织管理员手册': 'guide/admin/overview',
  '03-子用户手册': 'guide/subuser/overview',
  '04-价格说明': 'guide/pricing',
  '05-开发者指南': 'guide/dev/overview',
  '06-工具接入': 'guide/tools/overview',
}

const PREFIX = '/docs/zh/'

// 匹配 markdown 链接：](目标(.md 或 ../dir/) 可带 #锚点)
const LINK_RE = /\]\(((?:[^)\s#]+\.md)|(?:\.\.?\/[^)\s#]*\/))(#[^)]*)?\)/g

function resolve(target: string): string | null {
  if (target.endsWith('/')) {
    // 目录链接：取最后一段文件夹名
    const seg = target.replace(/\/+$/, '').split('/').filter(Boolean).pop() || ''
    return BY_DIR[seg] ?? null
  }
  const base = target.split('/').pop() || target
  return BY_NAME[base] ?? null
}

async function run() {
  const payload = await getPayload({ config: await config })
  const res = await payload.find({ collection: 'docs', limit: 1000, pagination: false, depth: 0 })

  let totalDocs = 0
  let totalLinks = 0
  const unresolved = new Set<string>()

  for (const d of res.docs) {
    const id = (d as any).id
    const slug = (d as any).slug
    const cur = await payload.findByID({ collection: 'docs', id, locale: 'zh', depth: 0 })
    const content: string = (cur as any).content || ''
    if (!content.includes('](')) continue

    let changed = false
    const next = content.replace(LINK_RE, (whole, target: string, frag: string = '') => {
      const dest = resolve(target)
      if (!dest) {
        unresolved.add(target)
        return whole
      }
      changed = true
      totalLinks++
      return `](${PREFIX}${dest}${frag || ''})`
    })

    if (changed && next !== content) {
      await payload.update({ collection: 'docs', id, locale: 'zh', data: { content: next } })
      totalDocs++
      payload.logger.info(`✏️  ${slug} 已重写`)
    }
  }

  payload.logger.info(`✅ 共重写 ${totalDocs} 篇文档、${totalLinks} 处链接`)
  if (unresolved.size) {
    payload.logger.warn(`⚠️  未能映射（保持原样，请人工确认）:`)
    for (const u of [...unresolved].sort()) payload.logger.warn(`    ${u}`)
  } else {
    payload.logger.info('🎉 所有内部链接均已映射')
  }
  process.exit(0)
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
