import { AlertTriangle, RotateCcw } from 'lucide-react'
import { Button } from './Button'

export function LoadingBlock({ className }: { className?: string }) {
  return (
    <div className={`space-y-3 ${className ?? ''}`} aria-hidden="true">
      <div className="skeleton h-4 w-1/3" />
      <div className="skeleton h-24 w-full" />
      <div className="skeleton h-4 w-2/3" />
    </div>
  )
}

export function PageLoading() {
  return (
    <div
      className="flex min-h-[40vh] flex-col items-center justify-center gap-3"
      role="status"
      aria-live="polite"
      aria-label="页面加载中"
    >
      <div className="loading-spinner h-10 w-10 animate-spin rounded-full border-2" aria-hidden="true" />
      <p className="text-sm text-muted">正在加载解析数据…</p>
    </div>
  )
}

export function ErrorState({
  title = '加载失败',
  message = '请稍后重试，或检查文件是否完整。',
  onRetry,
}: {
  title?: string
  message?: string
  onRetry?: () => void
}) {
  return (
    <div
      className="card-surface flex min-h-[40vh] flex-col items-center justify-center gap-3 px-6 py-12 text-center"
      role="alert"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 ring-1 ring-rose-100">
        <AlertTriangle className="h-5 w-5" aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold text-ink-900">{title}</h3>
      <p className="max-w-md text-sm text-muted">{message}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry} className="mt-2">
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          重试
        </Button>
      )}
    </div>
  )
}
