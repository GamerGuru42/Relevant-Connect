'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Button } from '@/components/shared/Button'
import { Input } from '@/components/shared/Input'
import { authService } from '@/services/auth/authService'
import { useAuthStore } from '@/store/authStore'
import { motion } from 'framer-motion'
import { Mail, Lock, User, UserPlus } from 'lucide-react'
import { MEMBERSHIP_STATUS_OPTIONS } from '@/constants/enums'

export function SignupForm() {
  const router = useRouter()
  const setUser = useAuthStore((state) => state.setUser)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    membershipStatus: 'visitor',
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required'
    if (!formData.email) newErrors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = 'Invalid email format'
    if (!formData.password) newErrors.password = 'Password is required'
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters'
    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = 'Passwords do not match'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setLoading(true)
    try {
      const user = await authService.signup(
        formData.email,
        formData.password,
        formData.fullName,
        formData.membershipStatus
      )
      setUser(user)
      toast.success('Account created successfully!')
      router.push('/')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Signup failed'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    try {
      await authService.loginWithGoogle()
      toast.success('Redirecting to Google...')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Google signup failed'
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
            <UserPlus className="w-6 h-6" />
          </div>
        </div>
        <h1 className="text-3xl font-bold">Join Relevant+</h1>
        <p className="text-muted-foreground">Create your account to get started</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <User className="w-4 h-4" />
            Full Name
          </label>
          <Input
            type="text"
            placeholder="John Doe"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            error={errors.fullName}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Email
          </label>
          <Input
            type="email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            error={errors.email}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Membership Status</label>
          <select
            value={formData.membershipStatus}
            onChange={(e) => setFormData({ ...formData, membershipStatus: e.target.value })}
            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {MEMBERSHIP_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Password
          </label>
          <Input
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            error={errors.password}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Confirm Password
          </label>
          <Input
            type="password"
            placeholder="••••••••"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            error={errors.confirmPassword}
          />
        </div>

        <Button type="submit" className="w-full" loading={loading}>
          Create Account
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="px-2 bg-background text-muted-foreground">Or continue with</span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={handleGoogleLogin}
        disabled={loading}
      >
        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Google
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/auth/login" className="text-primary font-semibold hover:underline">
          Sign in
        </Link>
      </p>
    </motion.div>
  )
}
