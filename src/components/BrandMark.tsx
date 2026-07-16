import { ScanLine } from 'lucide-react'
import { cn } from '../lib/cn'

export function BrandMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'brand-mark relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[14px] ring-1 ring-white/15',
        className,
      )}
      aria-hidden="true"
    >
      <ScanLine className="relative z-10 h-5 w-5" strokeWidth={2.2} />
      <span className="absolute bottom-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-white ring-2 ring-white/20" />
    </div>
  )
}
