import { ReactNode } from 'react'

interface StatsCardProps {
  title: string
  value: string | number
  icon: ReactNode
  description?: string
  trend?: {
    value: number
    isPositive: boolean
  }
}

export function StatsCard({ title, value, icon, description, trend }: StatsCardProps) {
  return (
    <div className="bg-card border border-border p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-muted-foreground">{title}</h3>
        <div className="p-2 bg-primary/10 text-primary rounded-lg">
          {icon}
        </div>
      </div>
      
      <div className="space-y-1">
        <h2 className="text-3xl font-bold tracking-tight">{value}</h2>
        
        {(description || trend) && (
          <div className="flex items-center gap-2 text-sm">
            {trend && (
              <span className={`font-medium ${trend.isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
              </span>
            )}
            {description && (
              <span className="text-muted-foreground">{description}</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
