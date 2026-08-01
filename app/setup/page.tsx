'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/shared/Button'
import { ShieldCheck, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SetupPage() {
  const { user, setUser } = useAuthStore()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    const checkSetup = async () => {
      if (!user) {
        router.push('/auth/login')
        return
      }
      
      if (!user.isOnboarded) {
        router.push('/onboarding')
        return
      }

      try {
        const { count, error } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('app_role', 'super_admin')

        if (error) throw error

        if (count && count > 0) {
          // Super admin already exists, hide page
          router.push('/')
        } else {
          setLoading(false)
        }
      } catch (err) {
        console.error('Failed to check super admin count', err)
        router.push('/')
      }
    }

    checkSetup()
  }, [user, router])

  const handleCompleteSetup = async () => {
    if (!user) return
    setUpdating(true)

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          app_role: 'super_admin',
          membership_status: 'worker',
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) throw error

      // Update local store
      setUser({
        ...user,
        appRole: 'super_admin',
        membershipStatus: 'worker',
      })

      toast.success('Successfully promoted to Super Admin')
      router.push('/')
    } catch (err: any) {
      toast.error(err.message || 'Failed to complete setup')
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground text-sm">Checking setup status...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center max-w-md mx-auto">
      <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-6">
        <ShieldCheck className="w-8 h-8 text-primary" />
      </div>
      <h1 className="text-3xl font-bold mb-4">Initial Setup</h1>
      <p className="text-muted-foreground mb-8">
        Welcome to Relevant+! It looks like you are the first user. Click below to complete setup and become the Super Admin.
      </p>
      
      <Button 
        size="lg" 
        className="w-full" 
        onClick={handleCompleteSetup}
        disabled={updating}
      >
        {updating ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Configuring...
          </>
        ) : (
          'Complete Setup'
        )}
      </Button>
    </div>
  )
}
