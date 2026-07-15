import { cn } from '../../lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

const variants: Record<Variant, string> = {
  primary:
    'bg-teal-600 text-white shadow-sm shadow-teal-700/15 hover:bg-teal-700 focus-visible:ring-teal-500/30',
  secondary:
    'border border-line bg-white text-ink-800 hover:bg-ink-50 focus-visible:ring-ink-500/15',
  ghost: 'bg-transparent text-ink-600 hover:bg-black/[0.04] hover:text-ink-900',
  danger: 'bg-rose-600 text-white hover:bg-rose-700',
}

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3.5 text-xs rounded-2xl gap-1.5',
  md: 'h-10 px-4 text-sm rounded-2xl gap-2',
  lg: 'h-11 px-5 text-sm rounded-2xl gap-2',
}

export function Button({
  children,
  className,
  variant = 'primary',
  size = 'md',
  disabled,
  type = 'button',
  onClick,
}: {
  children: React.ReactNode
  className?: string
  variant?: Variant
  size?: Size
  disabled?: boolean
  type?: 'button' | 'submit'
  onClick?: () => void
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'inline-flex items-center justify-center font-medium transition focus-visible:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
    >
      {children}
    </button>
  )
}
