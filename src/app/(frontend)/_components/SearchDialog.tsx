'use client'

import { Command } from 'cmdk'
import MiniSearch from 'minisearch'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { Locale } from '../_lib/locale'

type SearchDoc = {
  id: string
  title: string
  slug: string
  url: string
  headings: string
  excerpt: string
}

// Ctrl/Cmd+K 搜索面板：cmdk 命令面板 + minisearch（VitePress 本地搜索同款引擎）
export function SearchDialog({ locale }: { locale: Locale }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [docs, setDocs] = useState<SearchDoc[]>([])
  const loaded = useRef(false)
  const router = useRouter()

  // Ctrl/Cmd+K 打开
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  // 首次打开时懒加载索引
  useEffect(() => {
    if (!open || loaded.current) return
    loaded.current = true
    fetch(`/search-index?locale=${locale}`)
      .then((r) => r.json())
      .then((d: SearchDoc[]) => setDocs(d))
      .catch(() => setDocs([]))
  }, [open, locale])

  const mini = useMemo(() => {
    const ms = new MiniSearch<SearchDoc>({
      fields: ['title', 'headings', 'excerpt'],
      storeFields: ['title', 'url', 'excerpt'],
      searchOptions: { boost: { title: 3, headings: 2 }, prefix: true, fuzzy: 0.2 },
    })
    ms.addAll(docs)
    return ms
  }, [docs])

  const results = useMemo(() => {
    if (!query.trim()) return docs.slice(0, 8).map((d) => ({ ...d }))
    return mini.search(query).slice(0, 12) as unknown as SearchDoc[]
  }, [query, mini, docs])

  const go = (url: string) => {
    setOpen(false)
    setQuery('')
    router.push(url)
  }

  return (
    <>
      <button className="vp-search-btn" onClick={() => setOpen(true)} aria-label="搜索">
        <SearchIcon />
        <span className="vp-search-btn-text">搜索</span>
        <span className="vp-search-kbd">
          <kbd>Ctrl</kbd>
          <kbd>K</kbd>
        </span>
      </button>

      <Command.Dialog
        open={open}
        onOpenChange={setOpen}
        label="搜索文档"
        className="vp-cmd"
        shouldFilter={false}
      >
        <div className="vp-cmd-input">
          <SearchIcon />
          <Command.Input value={query} onValueChange={setQuery} placeholder="搜索文档…" autoFocus />
          <button className="vp-cmd-esc" onClick={() => setOpen(false)}>
            esc
          </button>
        </div>
        <Command.List className="vp-cmd-list">
          <Command.Empty className="vp-cmd-empty">没有找到结果</Command.Empty>
          {results.map((r) => (
            <Command.Item
              key={r.url}
              value={r.url}
              onSelect={() => go(r.url)}
              className="vp-cmd-item"
            >
              <div className="vp-cmd-item-title">{r.title}</div>
              {r.excerpt ? <div className="vp-cmd-item-excerpt">{r.excerpt}</div> : null}
            </Command.Item>
          ))}
        </Command.List>
      </Command.Dialog>
    </>
  )
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}
