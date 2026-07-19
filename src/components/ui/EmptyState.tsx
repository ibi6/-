import { Inbox } from 'lucide-react'
import { cn } from '../../lib/cn'

export function EmptyState({
  title = '暂无数据',
  description = '上传经典 PCAP/CAP 文件后，系统将自动解析并提取应用层载荷。',
  action,
  className,
}: {
  title?: string
  description?: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'card-surface flex min-h-64 flex-col items-center justify-center px-6 py-16 text-center',
        className,
      )}
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-deep)] ring-1 ring-[var(--accent-border)]">
        <Inbox className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold text-ink-900">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-muted">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
