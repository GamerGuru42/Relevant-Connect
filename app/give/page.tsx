'use client'

import { useState } from 'react'
import { AppLayout } from '@/components/shared/AppLayout'
import { Button } from '@/components/shared/Button'
import { toast } from 'react-hot-toast'
import { CreditCard, Heart, Building, Gift, History } from 'lucide-react'
import Link from 'next/link'
import { haptics } from '@/utils/haptics'

const GIVING_CATEGORIES = [
  { id: 'tithe', label: 'Tithe', icon: Heart, description: '10% of your income' },
  { id: 'project_offering', label: 'Project Offering', icon: Building, description: 'Support church building & projects' },
  { id: 'special_seed', label: 'Special Seed', icon: Gift, description: 'Sow a specific seed' },
  { id: 'other', label: 'Other', icon: CreditCard, description: 'General offering or other giving' },
]

export default function GivePage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('tithe')
  const [amount, setAmount] = useState<string>('')
  const [note, setNote] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const handleGive = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }
    
    haptics.medium()
    setLoading(true)

    // TODO: Integrate Paystack here
    // import PaystackPop from '@paystack/inline-js'
    // const paystack = new PaystackPop()
    // paystack.newTransaction({
    //   key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
    //   email: user?.email,
    //   amount: Number(amount) * 100,
    //   ...
    // })
    
    // Deferment behavior as requested by user
    setTimeout(() => {
      setLoading(false)
      toast.success(
        "Online giving will be available soon. For now, please use the church account numbers displayed at the service.",
        { duration: 6000 }
      )
    }, 1000)
  }

  return (
    <AppLayout>
      <div className="container mx-auto max-w-2xl px-4 py-8">
        
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Give</h1>
            <p className="text-muted-foreground">Support the ministry.</p>
          </div>
          <Link href="/give/history">
            <Button variant="outline" size="sm">
              <History className="w-4 h-4 mr-2" /> History
            </Button>
          </Link>
        </div>

        <form onSubmit={handleGive} className="space-y-8">
          
          {/* Category Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">1. Select Category</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {GIVING_CATEGORIES.map((cat) => {
                const Icon = cat.icon
                const isSelected = selectedCategory === cat.id
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(cat.id)
                      haptics.light()
                    }}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      isSelected 
                        ? 'border-primary bg-primary/5 ring-1 ring-primary shadow-sm' 
                        : 'border-border bg-card hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${isSelected ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className={`font-semibold ${isSelected ? 'text-primary' : ''}`}>{cat.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{cat.description}</p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Amount & Note */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">2. Enter Details</h3>
            <div className="bg-card border border-border p-6 rounded-xl shadow-sm space-y-4">
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Amount (NGN)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">
                    ₦
                  </span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    min="100"
                    className="w-full pl-10 pr-4 py-4 rounded-lg bg-background border border-border focus:border-primary outline-none text-xl font-bold"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Note (Optional)</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Any additional information..."
                  rows={2}
                  className="w-full p-3 rounded-lg bg-background border border-border focus:border-primary outline-none text-sm"
                />
              </div>

            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full h-14 text-lg font-bold" 
            loading={loading}
          >
            Give Now
          </Button>
          
        </form>

      </div>
    </AppLayout>
  )
}
