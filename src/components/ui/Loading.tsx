export function LoadingBlock({ className }: { className?: string }) {
  return (
    <div className={`space-y-3 ${className ?? ''}`}>
      <div className="skeleton h-4 w-1/3" />
      <div className="skeleton h-24 w-full" />
      <div className="skeleton h-4 w-2/3" />
    </div>
  )
}

export function PageLoading() {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
      <p className="text-sm text-muted">解析引擎加载中…</p>
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
    <div className="card-surface flex min-h-[40vh] flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 ring-1 ring-rose-100">
        !
      </div>
      <h3 className="text-base font-semibold text-ink-900">{title}</h3>
      <p className="max-w-md text-sm text-muted">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 rounded-2xl border border-line bg-white px-4 py-2 text-sm text-ink-800 shadow-sm hover:bg-ink-50"
        >
          重试
        </button>
      )}
    </div>
  )
}
