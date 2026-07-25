'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/shared/Button'
import { AppLayout } from '@/components/shared/AppLayout'
import { motion } from 'framer-motion'
import { User, Mail, Phone, Edit2 } from 'lucide-react'
import { authService } from '@/services/auth/authService'
import toast from 'react-hot-toast'

export function ProfilePage() {
  const user = useAuthStore((state) => state.user)
  const setUser = useAuthStore((state) => state.setUser)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
  })

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName,
        phone: user.phone || '',
      })
    }
  }, [user])

  const handleSave = async () => {
    if (!user || !formData.fullName.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      await authService.updateUserProfile(user.id, {
        fullName: formData.fullName,
        phone: formData.phone,
      })

      setUser({
        ...user,
        fullName: formData.fullName,
        phone: formData.phone,
      })

      setIsEditing(false)
      toast.success('Profile updated successfully!')
    } catch (error) {
      toast.error('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  const membershipStatusLabel = {
    visitor: 'Visitor',
    new_convert: 'New Convert',
    member: 'Member',
    worker: 'Worker',
  }[user.membershipStatus]

  return (
    <AppLayout>
      <div className="min-h-screen bg-background">

        <div className="container mx-auto px-4 -mt-16 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border/50 rounded-3xl shadow-xl p-8 mb-6"
          >
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-4xl text-primary-foreground">
                {user.fullName.charAt(0).toUpperCase()}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold">{user.fullName}</h1>
                  {user.role === 'admin' && (
                    <span className="bg-destructive text-destructive-foreground px-3 py-1 rounded-full text-xs font-semibold">
                      Admin
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground mb-4">{membershipStatusLabel}</p>

                <div className="flex gap-2">
                  {!isEditing ? (
                    <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  ) : (
                    <>
                      <Button onClick={handleSave} size="sm" loading={loading}>
                        Save Changes
                      </Button>
                      <Button
                        onClick={() => setIsEditing(false)}
                        variant="outline"
                        size="sm"
                        disabled={loading}
                      >
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Profile Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card border border-border rounded-lg shadow-soft p-6"
          >
            <h2 className="text-xl font-bold mb-6">Contact Information</h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium flex items-center gap-2 mb-2">
                  <User className="w-4 h-4" />
                  Full Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                ) : (
                  <p className="text-foreground">{user.fullName}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium flex items-center gap-2 mb-2">
                  <Mail className="w-4 h-4" />
                  Email
                </label>
                <p className="text-foreground">{user.email}</p>
              </div>

              <div>
                <label className="text-sm font-medium flex items-center gap-2 mb-2">
                  <Phone className="w-4 h-4" />
                  Phone
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                ) : (
                  <p className="text-foreground">{user.phone || 'Not provided'}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Membership Status</label>
                <p className="text-foreground">{membershipStatusLabel}</p>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Role</label>
                <p className="text-foreground capitalize">{user.role}</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AppLayout>
  )
}
