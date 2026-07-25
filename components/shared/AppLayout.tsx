'use client'

import { ReactNode } from 'react'
import { AppHeader } from './AppHeader'
import { MobileBottomNav } from './MobileBottomNav'

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />
      <main className="flex-1 pb-20 md:pb-0">
        {children}
      </main>
      <MobileBottomNav />
    </div>
  )
}
