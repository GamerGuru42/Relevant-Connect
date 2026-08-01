import { LucideIcon } from 'lucide-react'
import { ReactNode } from 'react'

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: ReactNode;
}

export function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <div className="text-center py-10 px-4 bg-card border border-border rounded-2xl flex flex-col items-center justify-center">
      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center text-muted-foreground mb-4">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-bold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
    </div>
  )
}
