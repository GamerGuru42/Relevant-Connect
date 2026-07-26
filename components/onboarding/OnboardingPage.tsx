'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { authService } from '@/services/auth/authService'
import { MEMBERSHIP_STATUS_OPTIONS, DEPARTMENT_OPTIONS } from '@/constants/enums'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, Sparkles, Users, BookOpen, UserCheck, Briefcase } from 'lucide-react'
import { Logo } from '@/components/shared/Logo'
import toast from 'react-hot-toast'

const statusIcons: Record<string, any> = {
  visitor: Users,
  new_convert: Sparkles,
  member: UserCheck,
  worker: Briefcase,
}

const statusDescriptions: Record<string, string> = {
  visitor: 'I am visiting or attending for the first time',
  new_convert: 'I recently gave my life to Christ',
  member: 'I am an established member of the church',
  worker: 'I serve in a department within the church',
}

export function OnboardingPage() {
  const router = useRouter()
  const { user, setUser } = useAuthStore()
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null)
  const [step, setStep] = useState<'status' | 'department'>('status')
  const [loading, setLoading] = useState(false)

  if (!user) return null

  const handleStatusSelect = (status: string) => {
    setSelectedStatus(status)
    if (status === 'worker') {
      setStep('department')
    } else {
      handleComplete(status, null)
    }
  }

  const handleComplete = async (status: string, department: string | null) => {
    setLoading(true)
    try {
      await authService.completeOnboarding(user.id, status, department)
      setUser({
        ...user,
        membershipStatus: status as any,
        isOnboarded: true,
        department,
      })
      toast.success('Welcome to Relevant+!')
      router.push('/')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to complete setup'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-lg"
      >
        <div className="text-center mb-10">
          <Logo className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">
            Welcome, {user.fullName.split(' ')[0]}!
          </h1>
          <p className="text-muted-foreground text-lg">
            {step === 'status'
              ? 'How are you connecting with us today?'
              : 'Which department do you serve in?'}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {step === 'status' && (
            <motion.div
              key="status"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-3"
            >
              {MEMBERSHIP_STATUS_OPTIONS.map((option) => {
                const Icon = statusIcons[option.value] || Users
                return (
                  <button
                    key={option.value}
                    onClick={() => handleStatusSelect(option.value)}
                    disabled={loading}
                    className="w-full flex items-center gap-4 p-5 bg-card border-2 border-border rounded-2xl hover:border-primary/50 hover:shadow-lg transition-all duration-300 text-left group disabled:opacity-50"
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{option.label}</h3>
                      <p className="text-sm text-muted-foreground">
                        {statusDescriptions[option.value]}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </button>
                )
              })}
            </motion.div>
          )}

          {step === 'department' && (
            <motion.div
              key="department"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-3"
            >
              <button
                onClick={() => { setStep('status'); setSelectedStatus(null) }}
                className="text-sm text-primary hover:underline mb-4 flex items-center gap-1"
              >
                ← Back to status selection
              </button>

              <div className="grid grid-cols-2 gap-3">
                {DEPARTMENT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSelectedDepartment(option.value)
                      handleComplete('worker', option.value)
                    }}
                    disabled={loading}
                    className={`p-4 bg-card border-2 rounded-2xl text-center font-semibold hover:border-primary/50 hover:shadow-lg transition-all duration-300 disabled:opacity-50 ${
                      selectedDepartment === option.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {loading && (
          <div className="flex items-center justify-center mt-8 gap-2 text-muted-foreground">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span>Setting up your profile...</span>
          </div>
        )}
      </motion.div>
    </div>
  )
}
