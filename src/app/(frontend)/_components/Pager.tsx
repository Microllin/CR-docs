import Link from 'next/link'
import type { PagerLink } from '../_lib/nav'

// 底部上一页 / 下一页翻页器（VPDocFooter）
export function Pager({ prev, next }: { prev: PagerLink; next: PagerLink }) {
  if (!prev && !next) return null
  return (
    <div className="vp-pager">
      <div className="vp-pager-prev">
        {prev && (
          <Link href={prev.url}>
            <span className="vp-pager-label">上一页</span>
            <span className="vp-pager-title">{prev.title}</span>
          </Link>
        )}
      </div>
      <div className="vp-pager-next">
        {next && (
          <Link href={next.url}>
            <span className="vp-pager-label">下一页</span>
            <span className="vp-pager-title">{next.title}</span>
          </Link>
        )}
      </div>
    </div>
  )
}
