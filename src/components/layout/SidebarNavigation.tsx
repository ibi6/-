import { NavLink } from 'react-router-dom'
import { NAV_GROUPS } from '../../config/navigation'
import { cn } from '../../lib/cn'

export function SidebarNavigation({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav aria-label="主导航" className="flex-1 overflow-y-auto px-3 py-3">
      {NAV_GROUPS.map((group, groupIndex) => (
        <div key={group.label} className={cn(groupIndex > 0 && 'mt-4')}>
          <p className="px-3.5 pb-1.5 font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-white/25">
            {group.label}
          </p>
          <div className="space-y-1">
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    'group flex min-h-11 items-center gap-3 rounded-[14px] px-3.5 py-2.5 text-[13px] font-medium transition-all duration-200',
                    isActive
                      ? 'nav-active'
                      : 'text-white/52 hover:bg-white/[0.055] hover:text-white/90',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon
                      className={cn(
                        'nav-icon h-[18px] w-[18px] shrink-0 transition-colors',
                        isActive ? '' : 'text-white/34 group-hover:text-white/70',
                      )}
                      aria-hidden="true"
                    />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>
      ))}
    </nav>
  )
}
