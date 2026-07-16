import { cn } from '../../lib/cn'
import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

const variants: Record<Variant, string> = {
  primary: 'button-primary',
  secondary:
    'border border-line bg-white text-ink-800 hover:bg-ink-50 focus-visible:ring-ink-500/15',
  ghost: 'bg-transparent text-ink-600 hover:bg-black/[0.04] hover:text-ink-900',
  danger: 'bg-rose-600 text-white hover:bg-rose-700',
}

const sizes: Record<Size, string> = {
  sm: 'h-11 px-3.5 text-xs rounded-2xl gap-1.5',
  md: 'h-11 px-4 text-sm rounded-2xl gap-2',
  lg: 'h-12 px-5 text-sm rounded-2xl gap-2',
}

type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'size'> & {
  variant?: Variant
  size?: Size
}

export function Button({
  children,
  className,
  variant = 'primary',
  size = 'md',
  disabled,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      {...props}
      className={cn(
        'inline-flex items-center justify-center font-medium transition duration-200 focus-visible:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
    >
      {children}
    </button>
  )
}
