import type { CollectionConfig } from 'payload'
import GithubSlugger from 'github-slugger'

// 文档集合：每条记录 = 一篇 Markdown 文档
// - content 存 Markdown 源码，前端用 remark/rehype + Shiki 渲染成 VitePress 样式
// - 开启 drafts 得到「草稿 / 版本历史 / 预览」
// - title / content / excerpt 开启 localized，对应多语言文档
export const Docs: CollectionConfig = {
  slug: 'docs',
  labels: {
    singular: '文档',
    plural: '文档',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'updatedAt', '_status'],
    description: '文档内容用 Markdown 编写，slug 是访问路径（如 about/intro）。',
  },
  access: {
    // 已发布内容公开可读；草稿仅登录用户可见（Payload drafts 默认行为）
    read: () => true,
  },
  versions: {
    drafts: {
      autosave: false,
    },
    maxPerDoc: 20,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
      admin: { description: '页面标题，显示在正文顶部与侧边栏。' },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
        description: '访问路径，如 about/intro（不含语言前缀）。留空则按标题自动生成。',
      },
    },
    {
      name: 'excerpt',
      type: 'textarea',
      localized: true,
      admin: {
        position: 'sidebar',
        description: '摘要，用于搜索结果与 SEO。',
      },
    },
    {
      name: 'content',
      type: 'textarea',
      localized: true,
      admin: {
        description: 'Markdown 源码。支持 GFM、代码块（Shiki 高亮）、标题自动锚点。',
        rows: 24,
      },
    },
  ],
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (data && !data.slug && data.title) {
          data.slug = new GithubSlugger().slug(String(data.title))
        }
        return data
      },
    ],
  },
}
