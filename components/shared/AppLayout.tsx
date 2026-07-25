'use client'

import { ReactNode } from 'react'
import { AppHeader } from './AppHeader'

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
