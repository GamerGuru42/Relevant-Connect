import { format } from 'date-fns'
import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface DashboardHeaderProps {
  firstName: string
  roleLabel: string
  department?: string | null
  badgeColorClass?: string
  children?: ReactNode // Optional extra content for the right side (like buttons)
}

export function DashboardHeader({ 
  firstName, 
  roleLabel, 
  department,
  badgeColorClass = "bg-primary/10 text-primary",
  children
}: DashboardHeaderProps) {
  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  }

  return (
    <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-b border-border/40 pb-8 pt-8">
      <div className="container mx-auto px-4 sm:px-6">
        <motion.div 
          initial="hidden" 
          animate="visible" 
          variants={{
            visible: { transition: { staggerChildren: 0.1 } }
          }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-6"
        >
          <motion.div variants={fadeUp} className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Welcome back, {firstName}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-lg">
              <span>{format(new Date(), 'EEEE, MMMM do')}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-primary/50"></span>
              
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${badgeColorClass}`}>
                {roleLabel}
              </span>

              {department && (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/50"></span>
                  <span className="text-sm font-medium">{department}</span>
                </>
              )}
            </div>
          </motion.div>

          {children && (
            <motion.div variants={fadeUp} className="flex-shrink-0">
              {children}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
