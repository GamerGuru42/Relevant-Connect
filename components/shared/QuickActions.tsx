import Link from 'next/link'
import { ReactNode } from 'react'

export interface QuickAction {
  label: string
  href: string
  icon: ReactNode
  colorClass: string // e.g. "bg-indigo-500/10 text-indigo-500"
}

interface QuickActionsProps {
  actions: QuickAction[]
}

export function QuickActions({ actions }: QuickActionsProps) {
  if (!actions || actions.length === 0) return null

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {actions.map((action, i) => (
        <Link 
          key={i} 
          href={action.href} 
          className="flex flex-col items-center justify-center p-6 bg-card border border-border hover:border-primary/50 rounded-2xl shadow-sm hover:shadow-md transition-all group"
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform ${action.colorClass}`}>
            {action.icon}
          </div>
          <span className="font-semibold text-sm text-center">{action.label}</span>
        </Link>
      ))}
    </div>
  )
}
