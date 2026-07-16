import type { GlobalConfig } from 'payload'

// 侧边栏导航树：1:1 对应 VitePress 的 sidebar 配置
// groups = 分组（可折叠），每组 items 指向具体文档
// 前端据此渲染左侧导航，并按扁平顺序推导每页的上一页 / 下一页
export const Navigation: GlobalConfig = {
  slug: 'navigation',
  label: '侧边栏导航',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'groups',
      type: 'array',
      label: '导航分组',
      labels: { singular: '分组', plural: '分组' },
      admin: {
        description: '每个分组是侧边栏里一个可折叠的标题，下面挂若干文档。',
      },
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
          localized: true,
          label: '分组标题',
        },
        {
          name: 'collapsed',
          type: 'checkbox',
          label: '默认折叠',
          defaultValue: false,
        },
        {
          name: 'items',
          type: 'array',
          label: '文档项',
          labels: { singular: '文档项', plural: '文档项' },
          fields: [
            {
              name: 'doc',
              type: 'relationship',
              relationTo: 'docs',
              required: true,
              label: '关联文档',
            },
          ],
        },
      ],
    },
  ],
}
