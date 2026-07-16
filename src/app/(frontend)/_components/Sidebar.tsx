'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import type { NavGroup } from '../_lib/nav'

// 左侧导航（VPSidebar）：分组可折叠 + 当前页高亮
export function Sidebar({ groups }: { groups: NavGroup[] }) {
  return (
    <aside className="vp-sidebar">
      <nav className="vp-sidebar-nav">
        {groups.map((g, i) => (
          <SidebarGroup key={i} group={g} />
        ))}
      </nav>
    </aside>
  )
}

function SidebarGroup({ group }: { group: NavGroup }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(!group.collapsed)

  return (
    <div className="vp-sidebar-group">
      <button
        className="vp-sidebar-heading"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span>{group.label}</span>
        <span className={`vp-caret ${open ? 'open' : ''}`} aria-hidden>
          ›
        </span>
      </button>
      {open && (
        <ul className="vp-sidebar-items">
          {group.items.map((it) => {
            const active = pathname === it.url || decodeURIComponent(pathname) === it.url
            return (
              <li key={it.url}>
                <Link href={it.url} className={active ? 'active' : ''}>
                  {it.title}
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
