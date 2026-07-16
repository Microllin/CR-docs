import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

// 种子数据：管理员 + 示例文档 + 侧边栏导航
// 运行：pnpm tsx scripts/seed.ts
async function seed() {
  const payload = await getPayload({ config: await config })

  // 1) 管理员（账号密码从环境变量读取，默认值仅供首次登录，请尽快改）
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@example.com'
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'changeme123'
  const admins = await payload.find({ collection: 'users', limit: 1 })
  if (admins.totalDocs === 0) {
    await payload.create({
      collection: 'users',
      data: { email: adminEmail, password: adminPassword },
    })
    payload.logger.info(`✅ 已创建管理员 ${adminEmail}（密码见 SEED_ADMIN_PASSWORD，请登录后立即修改）`)
  }

  // 2) 文档（幂等：按 slug upsert）
  const docs = [
    {
      slug: 'about/intro',
      title: '什么是 CR',
      excerpt: 'CR 是统一的大模型 API 网关，一个接口接入多家模型。',
      content: `CR 是一个**统一的大模型 API 网关**，让你用一套 OpenAI 兼容接口，接入多家模型厂商。

## 核心特性

- **统一接口**：一个 API Key，调用 Claude、GPT、Gemini 等
- **智能路由**：按价格、延迟、可用性自动选择上游
- **用量与计费**：内置 token 统计与成本核算

## 快速示例

下面是一个最小调用示例：

\`\`\`python
from openai import OpenAI

client = OpenAI(
    base_url="https://cr-docs.example.com/api/v1",
    api_key="YOUR_CR_KEY",
)

resp = client.chat.completions.create(
    model="claude-opus-4-8",
    messages=[{"role": "user", "content": "你好"}],
)
print(resp.choices[0].message.content)
\`\`\`

## 为什么选择 CR

| 能力 | 说明 |
| --- | --- |
| 兼容性 | 100% OpenAI 兼容 |
| 多模型 | 一个 Key 通吃 |
| 可观测 | 请求日志与用量看板 |

> 提示：把 \`base_url\` 指向 CR，即可无缝迁移现有代码。`,
    },
    {
      slug: 'quickstart',
      title: '快速开始',
      excerpt: '三步接入 CR：注册、拿 Key、发起第一个请求。',
      content: `本页帮助你在 5 分钟内完成接入。

## 第一步：获取 API Key

登录控制台，在「API Keys」页面创建一个新的密钥。

## 第二步：安装 SDK

\`\`\`bash
pip install openai
\`\`\`

## 第三步：发起请求

\`\`\`javascript
import OpenAI from 'openai'

const client = new OpenAI({
  baseURL: 'https://cr-docs.example.com/api/v1',
  apiKey: process.env.CR_KEY,
})

const res = await client.chat.completions.create({
  model: 'claude-opus-4-8',
  messages: [{ role: 'user', content: 'Hello' }],
})
console.log(res.choices[0].message.content)
\`\`\`

## 下一步

- 阅读 Chat API 了解全部参数
- 配置多模型路由策略`,
    },
    {
      slug: 'api/chat',
      title: 'Chat API',
      excerpt: 'Chat Completions 接口参数与返回说明。',
      content: `\`POST /api/v1/chat/completions\` —— 与 OpenAI Chat Completions 完全兼容。

## 请求参数

- \`model\`（必填）：模型 ID，如 \`claude-opus-4-8\`
- \`messages\`（必填）：对话消息数组
- \`stream\`（可选）：是否流式返回
- \`temperature\`（可选）：采样温度，0~2

## 请求示例

\`\`\`bash
curl https://cr-docs.example.com/api/v1/chat/completions \\
  -H "Authorization: Bearer $CR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "claude-opus-4-8",
    "messages": [{"role": "user", "content": "讲个笑话"}]
  }'
\`\`\`

## 返回结构

\`\`\`json
{
  "id": "chatcmpl-xxx",
  "choices": [
    { "message": { "role": "assistant", "content": "..." } }
  ],
  "usage": { "prompt_tokens": 12, "completion_tokens": 30 }
}
\`\`\`

### 流式返回

设置 \`stream: true\` 时，返回 SSE 数据流，逐块推送增量内容。`,
    },
  ]

  const idBySlug: Record<string, number> = {}
  for (const d of docs) {
    const existing = await payload.find({
      collection: 'docs',
      where: { slug: { equals: d.slug } },
      limit: 1,
    })
    if (existing.totalDocs > 0) {
      const updated = await payload.update({
        collection: 'docs',
        id: existing.docs[0].id,
        data: { title: d.title, excerpt: d.excerpt, content: d.content, _status: 'published' },
      })
      idBySlug[d.slug] = updated.id as number
    } else {
      const created = await payload.create({
        collection: 'docs',
        data: { ...d, _status: 'published' },
      })
      idBySlug[d.slug] = created.id as number
    }
  }
  payload.logger.info(`✅ 已写入 ${docs.length} 篇文档`)

  // 英文版（演示 i18n）
  await payload.update({
    collection: 'docs',
    id: idBySlug['about/intro'],
    locale: 'en',
    data: {
      title: 'What is CR',
      excerpt: 'CR is a unified LLM API gateway.',
      content: `CR is a **unified LLM API gateway**.

## Features

- **One interface** for Claude, GPT, Gemini
- **Smart routing** by price and latency

\`\`\`python
from openai import OpenAI
client = OpenAI(base_url="https://cr-docs.example.com/api/v1", api_key="KEY")
\`\`\``,
    },
  })

  // 3) 侧边栏导航
  await payload.updateGlobal({
    slug: 'navigation',
    data: {
      groups: [
        { label: '关于', collapsed: false, items: [{ doc: idBySlug['about/intro'] }] },
        { label: '快速开始', collapsed: false, items: [{ doc: idBySlug['quickstart'] }] },
        { label: 'API 参考', collapsed: false, items: [{ doc: idBySlug['api/chat'] }] },
      ],
    },
  })
  payload.logger.info('✅ 已配置侧边栏导航')

  payload.logger.info('🎉 种子数据完成')
  process.exit(0)
}

seed().catch((e) => {
  console.error(e)
  process.exit(1)
})
