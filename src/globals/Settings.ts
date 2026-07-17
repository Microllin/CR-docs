import type { GlobalConfig } from 'payload'

// 站点设置：站点名称 / Logo / 描述，可在后台 /admin 里随时修改
export const Settings: GlobalConfig = {
  slug: 'settings',
  label: '站点设置',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'siteName',
      type: 'text',
      required: true,
      localized: true,
      defaultValue: 'Docs',
      label: '站点名称',
      admin: { description: '显示在左上角 Logo 旁与浏览器标签标题。' },
    },
    {
      name: 'logoMark',
      type: 'text',
      defaultValue: 'D',
      label: 'Logo 字母',
      admin: { description: 'Logo 方块里的字母/字，建议 1~2 个字符。未上传 Logo 图片时使用。' },
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
      label: 'Logo 图片',
      admin: { description: '上传后替代左上角的字母方块（建议高度 32px 左右的 PNG/SVG）。' },
    },
    {
      name: 'favicon',
      type: 'upload',
      relationTo: 'media',
      label: '站点图标 favicon',
      admin: { description: '浏览器标签页图标（建议 .ico / .png / .svg，正方形）。' },
    },
    {
      name: 'description',
      type: 'textarea',
      localized: true,
      label: 'SEO 描述',
      admin: { description: '用于搜索引擎与分享预览。' },
    },
  ],
}
