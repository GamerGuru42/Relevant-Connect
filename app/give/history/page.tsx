'use client'

import { AppLayout } from '@/components/shared/AppLayout'
import { ArrowLeft, Clock } from 'lucide-react'
import Link from 'next/link'

export default function GiveHistoryPage() {
  // Since Paystack is deferred, history will be empty for now.
  // We'll scaffold the UI for later use.
  
  return (
    <AppLayout>
      <div className="container mx-auto max-w-2xl px-4 py-8">
        
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/give" className="hover:text-primary transition-colors flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Back to Give
            </Link>
          </div>
          <h1 className="text-3xl font-bold">Giving History</h1>
          <p className="text-muted-foreground">Your past donations and seeds.</p>
        </div>

        <div className="bg-card border border-border p-8 rounded-xl shadow-sm text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No History Yet</h3>
          <p className="text-muted-foreground">
            Once online giving is fully integrated, your donation history will appear here.
          </p>
        </div>

      </div>
    </AppLayout>
  )
}
