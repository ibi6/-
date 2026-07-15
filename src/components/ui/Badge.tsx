import { cn } from '../../lib/cn'
import type { PayloadType, Severity, TaskStatus } from '../../types'

const severityStyles: Record<Severity, string> = {
  info: 'bg-sky-50 text-sky-700 ring-sky-100',
  low: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  medium: 'bg-amber-50 text-amber-800 ring-amber-100',
  high: 'bg-orange-50 text-orange-700 ring-orange-100',
  critical: 'bg-rose-50 text-rose-700 ring-rose-100',
}

const statusStyles: Record<TaskStatus, string> = {
  pending: 'bg-ink-50 text-ink-600 ring-black/5',
  parsing: 'bg-sky-50 text-sky-700 ring-sky-100',
  extracting: 'bg-violet-50 text-violet-700 ring-violet-100',
  completed: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  failed: 'bg-rose-50 text-rose-700 ring-rose-100',
}

const statusLabel: Record<TaskStatus, string> = {
  pending: '排队中',
  parsing: '解析中',
  extracting: '提取中',
  completed: '已完成',
  failed: '失败',
}

const typeStyles: Record<PayloadType, string> = {
  text: 'bg-sky-50 text-sky-700 ring-sky-100',
  json: 'bg-teal-50 text-teal-700 ring-teal-100',
  html: 'bg-orange-50 text-orange-700 ring-orange-100',
  image: 'bg-pink-50 text-pink-700 ring-pink-100',
  binary: 'bg-ink-50 text-ink-600 ring-black/5',
  form: 'bg-violet-50 text-violet-700 ring-violet-100',
  file: 'bg-amber-50 text-amber-800 ring-amber-100',
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  const labels: Record<Severity, string> = {
    info: '信息',
    low: '低',
    medium: '中',
    high: '高',
    critical: '严重',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        severityStyles[severity],
      )}
    >
      {labels[severity]}
    </span>
  )
}

export function StatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        statusStyles[status],
      )}
    >
      {(status === 'parsing' || status === 'extracting') && (
        <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse-dot" />
      )}
      {statusLabel[status]}
    </span>
  )
}

export function TypeBadge({ type }: { type: PayloadType }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ring-1 ring-inset',
        typeStyles[type],
      )}
    >
      {type}
    </span>
  )
}

export function ProtocolBadge({ protocol }: { protocol: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-teal-50 px-2.5 py-0.5 font-mono text-[11px] font-medium text-teal-700 ring-1 ring-inset ring-teal-100">
      {protocol}
    </span>
  )
}

export function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-ink-50 px-2.5 py-0.5 text-xs text-ink-600 ring-1 ring-inset ring-black/5">
      {children}
    </span>
  )
}
