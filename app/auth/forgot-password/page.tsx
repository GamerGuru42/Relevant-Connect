'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Button } from '@/components/shared/Button'
import { Input } from '@/components/shared/Input'
import { authService } from '@/services/auth/authService'
import { motion } from 'framer-motion'
import { Mail, ArrowRight, KeyRound } from 'lucide-react'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      toast.error('Email is required')
      return
    }
    
    setLoading(true)
    try {
      await authService.resetPassword(email)
      setSubmitted(true)
      toast.success('Password reset link sent!')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send reset link'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md space-y-6"
    >
      <div className="text-center space-y-2">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white">
            <KeyRound className="w-6 h-6" />
          </div>
        </div>
        <h1 className="text-3xl font-bold">Forgot Password</h1>
        <p className="text-muted-foreground">
          {submitted ? 'Check your email for the reset link' : 'Enter your email to receive a password reset link'}
        </p>
      </div>

      {!submitted ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email
            </label>
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <Button type="submit" className="w-full" loading={loading}>
            Send Reset Link <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </form>
      ) : (
        <Button onClick={() => router.push('/auth/login')} className="w-full" variant="outline">
          Back to Login
        </Button>
      )}

      <p className="text-center text-sm text-muted-foreground">
        Remember your password?{' '}
        <Link href="/auth/login" className="text-primary font-semibold hover:underline">
          Sign in
        </Link>
      </p>
    </motion.div>
  )
}
