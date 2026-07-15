import { useMemo } from 'react'
import { cn } from '../lib/cn'

function hexToBytes(hex: string): number[] {
  const clean = hex.replace(/\s+/g, '')
  const bytes: number[] = []
  for (let i = 0; i < clean.length; i += 2) {
    bytes.push(parseInt(clean.slice(i, i + 2), 16))
  }
  return bytes
}

function toAscii(b: number) {
  return b >= 32 && b <= 126 ? String.fromCharCode(b) : '.'
}

export function HexViewer({
  hex,
  columns = 16,
  className,
}: {
  hex: string
  columns?: number
  className?: string
}) {
  const rows = useMemo(() => {
    const bytes = hexToBytes(hex)
    const result: { offset: number; bytes: number[] }[] = []
    for (let i = 0; i < bytes.length; i += columns) {
      result.push({ offset: i, bytes: bytes.slice(i, i + columns) })
    }
    return result
  }, [hex, columns])

  return (
    <div
      className={cn(
        'overflow-x-auto rounded-2xl border border-line bg-[#0f1724] font-mono text-[12px] leading-6 text-white',
        className,
      )}
    >
      <div className="min-w-[640px] p-4">
        <div className="mb-2 grid grid-cols-[72px_1fr_140px] gap-4 text-[10px] uppercase tracking-wider text-white/40">
          <span>Offset</span>
          <span>Hex</span>
          <span>ASCII</span>
        </div>
        {rows.map((row) => (
          <div
            key={row.offset}
            className="grid grid-cols-[72px_1fr_140px] gap-4 border-t border-white/[0.04] py-0.5"
          >
            <span className="text-white/40">{row.offset.toString(16).padStart(8, '0')}</span>
            <div className="flex flex-wrap gap-x-1">
              {row.bytes.map((b, i) => (
                <span key={i} className="hex-byte rounded px-0.5 text-teal-200/90">
                  {b.toString(16).padStart(2, '0')}
                </span>
              ))}
            </div>
            <span className="text-emerald-300/80">
              {row.bytes.map((b) => toAscii(b)).join('')}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
