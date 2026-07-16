import { useEffect, useRef, useState } from 'react'
import { Check, Palette } from 'lucide-react'
import { useTheme } from '../theme/useTheme'
import { cn } from '../lib/cn'
import type { ThemeId } from '../theme/themes'

/** 浅色工作台下的强调色切换 */
export function ThemeSwitcher() {
  const { themeId, themes, setTheme, theme } = useTheme()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="focus-ring flex h-11 min-w-11 items-center justify-center gap-2 rounded-2xl border border-line bg-white px-3 text-ink-500 shadow-sm transition hover:-translate-y-0.5 hover:text-ink-800"
        aria-label="切换强调色"
        aria-expanded={open}
        title="切换强调色"
      >
        <Palette className="h-4 w-4" />
        <span
          className="hidden h-3.5 w-3.5 rounded-full ring-2 ring-black/5 sm:block"
          style={{ background: theme.swatch }}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-56 overflow-hidden rounded-2xl border border-line bg-white shadow-xl shadow-black/10">
          <div className="border-b border-black/[0.04] px-3 py-2.5">
            <p className="text-[12px] font-semibold text-ink-900">强调色</p>
            <p className="mt-0.5 text-[11px] text-muted">侧栏高亮与主按钮颜色</p>
          </div>
          <div className="max-h-[280px] overflow-y-auto p-2">
            {themes.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setTheme(t.id as ThemeId)
                  setOpen(false)
                }}
                className={cn(
                  'focus-ring flex min-h-11 w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition',
                  themeId === t.id ? 'theme-option-active' : 'hover:bg-ink-50',
                )}
              >
                <span
                  className="h-7 w-7 shrink-0 rounded-lg ring-2 ring-black/5"
                  style={{ background: t.swatch }}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-ink-900">{t.name}</p>
                  <p className="truncate text-[11px] text-muted">{t.desc}</p>
                </div>
                {themeId === t.id && <Check className="h-4 w-4 text-[var(--accent-deep)]" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function ThemeGrid() {
  const { themeId, themes, setTheme } = useTheme()
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {themes.map((t) => {
        const active = themeId === t.id
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => setTheme(t.id)}
            aria-pressed={active}
            className={cn(
              'focus-ring flex min-h-11 flex-col items-start rounded-2xl border p-4 text-left transition',
              active
                ? 'theme-grid-active'
                : 'border-line bg-white hover:border-[var(--accent-border)]',
            )}
          >
            <div className="mb-3 flex w-full items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="h-8 w-8 rounded-lg ring-2 ring-black/5"
                  style={{
                    background: `linear-gradient(135deg, ${t.swatch}, ${t.vars['--accent-deep']})`,
                  }}
                />
                <div>
                  <p className="text-sm font-semibold text-ink-900">{t.name}</p>
                  <p className="text-[11px] text-muted">{t.desc}</p>
                </div>
              </div>
              {active && (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--accent-deep)] text-[var(--accent-contrast)]">
                  <Check className="h-3.5 w-3.5" />
                </span>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}
