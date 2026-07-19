export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}) {
  return (
    <div className="mb-6 flex min-w-0 flex-wrap items-end justify-between gap-4 sm:mb-7">
      <div className="min-w-0 flex-1 basis-full sm:basis-auto">
        <h1 className="text-[26px] font-semibold tracking-tight text-ink-900 sm:text-[28px]">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-muted">{subtitle}</p>
        ) : null}
      </div>
      {actions ? <div className="flex w-full min-w-0 flex-wrap items-center gap-2 sm:w-auto">{actions}</div> : null}
    </div>
  )
}
