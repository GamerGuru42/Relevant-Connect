'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Calendar, Bell, CheckCircle, User } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { motion } from 'framer-motion'

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/announcements', label: 'News', icon: Bell },
  { href: '/events', label: 'Events', icon: Calendar },
  { href: '/attendance', label: 'Attend', icon: CheckCircle },
  { href: '/profile', label: 'Profile', icon: User },
]

export function MobileBottomNav() {
  const pathname = usePathname()
  const user = useAuthStore((state) => state.user)

  // Don't show on auth pages or landing page when not logged in
  if (!user) return null
  if (pathname.startsWith('/auth')) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card/90 backdrop-blur-xl border-t border-border/50 safe-bottom">
      <div className="flex items-center justify-around px-2 pt-2 pb-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center justify-center gap-0.5 py-1 px-3 min-w-[56px] min-h-[48px]"
            >
              {isActive && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute -top-0.5 w-8 h-1 bg-primary rounded-full"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <Icon
                className={`w-5 h-5 transition-colors ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}
              />
              <span
                className={`text-[10px] font-medium transition-colors ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
