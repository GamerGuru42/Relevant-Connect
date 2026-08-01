'use client'

import { AppLayout } from '@/components/shared/AppLayout'
import { Wallet, Download, Search } from 'lucide-react'
import { Button } from '@/components/shared/Button'
import Link from 'next/link'

export default function AdminDonationsPage() {
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Link href="/admin" className="hover:text-primary transition-colors">Admin</Link>
              <span>/</span>
              <span className="text-foreground">Donations</span>
            </div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Wallet className="w-8 h-8" /> Donations Report
            </h1>
          </div>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
            <p className="text-sm font-medium text-muted-foreground mb-1">Total Received</p>
            <p className="text-2xl font-bold">₦0.00</p>
          </div>
          <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
            <p className="text-sm font-medium text-muted-foreground mb-1">This Month</p>
            <p className="text-2xl font-bold">₦0.00</p>
          </div>
          <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
            <p className="text-sm font-medium text-muted-foreground mb-1">Tithes</p>
            <p className="text-2xl font-bold">₦0.00</p>
          </div>
          <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
            <p className="text-sm font-medium text-muted-foreground mb-1">Project Seeds</p>
            <p className="text-2xl font-bold">₦0.00</p>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search by name or reference..." 
              className="w-full pl-9 pr-4 py-2 rounded-md bg-background border border-border focus:border-primary outline-none text-sm"
              disabled
            />
          </div>
          <select className="bg-background border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-primary disabled:opacity-50" disabled>
            <option value="all">All Categories</option>
            <option value="tithe">Tithe</option>
            <option value="project_offering">Project Offering</option>
            <option value="special_seed">Special Seed</option>
            <option value="other">Other</option>
          </select>
          <select className="bg-background border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-primary disabled:opacity-50" disabled>
            <option value="all">All Time</option>
            <option value="this_month">This Month</option>
            <option value="last_month">Last Month</option>
            <option value="this_year">This Year</option>
          </select>
        </div>

        {/* Empty State */}
        <div className="bg-card border border-border p-12 rounded-xl shadow-sm text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Wallet className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No Donations Yet</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Once Paystack is integrated, all online giving will appear here along with detailed reports.
          </p>
        </div>

      </div>
    </AppLayout>
  )
}
