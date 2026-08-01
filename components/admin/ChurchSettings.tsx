'use client'

import { useState, useEffect } from 'react'
import { AppLayout } from '@/components/shared/AppLayout'
import { churchInfoService } from '@/services/database/churchInfoService'
import { activityLogService } from '@/services/database/activityLogService'
import type { ChurchInfo } from '@/types'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/shared/Button'
import { toast } from 'react-hot-toast'
import { Save, Radio, Settings, Image as ImageIcon, Video } from 'lucide-react'
import Link from 'next/link'

export function ChurchSettings() {
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isLive, setIsLive] = useState(false)
  const [formData, setFormData] = useState<Partial<ChurchInfo>>({
    churchName: '',
    pastorName: '',
    address: '',
    contactPhone: '',
    contactEmail: '',
    serviceTimes: '',
    aboutText: '',
    liveStreamUrl: '',
    logoUrl: '',
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const info = await churchInfoService.get()
      if (info) {
        setFormData({
          churchName: info.churchName,
          pastorName: info.pastorName,
          address: info.address,
          contactPhone: info.contactPhone,
          contactEmail: info.contactEmail,
          serviceTimes: info.serviceTimes,
          aboutText: info.aboutText,
          liveStreamUrl: info.liveStreamUrl || '',
          logoUrl: info.logoUrl || '',
        })
        setIsLive(info.isLive)
      }
    } catch (error) {
      toast.error('Failed to load church settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setSaving(true)
    try {
      await churchInfoService.update(formData, user.id)
      await activityLogService.log(user.id, 'edited', 'user', 'churchInfo', 'Church Settings')
      toast.success('Settings updated successfully')
    } catch (error: any) {
      toast.error(error.message || 'Failed to update settings')
    } finally {
      setSaving(false)
    }
  }

  const toggleLive = async () => {
    if (!user) return
    const newState = !isLive
    
    // Optimistic update
    setIsLive(newState)
    
    try {
      await churchInfoService.update({ isLive: newState }, user.id)
      await activityLogService.log(user.id, 'edited', 'user', 'churchInfo', `Live Stream ${newState ? 'Started' : 'Ended'}`)
      toast.success(newState ? 'We are now LIVE!' : 'Live stream ended')
    } catch (error) {
      setIsLive(!newState)
      toast.error('Failed to toggle live status')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-64">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Link href="/admin" className="hover:text-primary transition-colors">Admin</Link>
              <span>/</span>
              <span className="text-foreground">Settings</span>
            </div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Settings className="w-8 h-8" /> Church Settings
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="md:col-span-2 space-y-6">
            <form onSubmit={handleSave} className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold border-b border-border pb-2">General Information</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Church Name</label>
                    <input
                      name="churchName"
                      value={formData.churchName}
                      onChange={handleChange}
                      className="w-full p-3 rounded-md bg-background border border-border focus:border-primary outline-none"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Pastor Name</label>
                    <input
                      name="pastorName"
                      value={formData.pastorName}
                      onChange={handleChange}
                      className="w-full p-3 rounded-md bg-background border border-border focus:border-primary outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Address</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows={2}
                    className="w-full p-3 rounded-md bg-background border border-border focus:border-primary outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Contact Phone</label>
                    <input
                      name="contactPhone"
                      value={formData.contactPhone}
                      onChange={handleChange}
                      className="w-full p-3 rounded-md bg-background border border-border focus:border-primary outline-none"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Contact Email</label>
                    <input
                      name="contactEmail"
                      type="email"
                      value={formData.contactEmail}
                      onChange={handleChange}
                      className="w-full p-3 rounded-md bg-background border border-border focus:border-primary outline-none"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <h3 className="text-xl font-semibold border-b border-border pb-2">Details</h3>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Service Times</label>
                  <textarea
                    name="serviceTimes"
                    value={formData.serviceTimes}
                    onChange={handleChange}
                    rows={3}
                    placeholder="e.g. Sundays 9:00 AM & 11:00 AM\nWednesdays 6:30 PM"
                    className="w-full p-3 rounded-md bg-background border border-border focus:border-primary outline-none"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">About Text</label>
                  <textarea
                    name="aboutText"
                    value={formData.aboutText}
                    onChange={handleChange}
                    rows={4}
                    className="w-full p-3 rounded-md bg-background border border-border focus:border-primary outline-none"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" loading={saving}>
                  <Save className="w-4 h-4 mr-2" /> Save Settings
                </Button>
              </div>
            </form>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Live Stream Controls */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
              <h3 className="text-lg font-semibold border-b border-border pb-2 flex items-center gap-2">
                <Video className="w-5 h-5" /> Live Stream
              </h3>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">YouTube Embed URL</label>
                <input
                  name="liveStreamUrl"
                  value={formData.liveStreamUrl || ''}
                  onChange={handleChange}
                  placeholder="https://www.youtube.com/embed/..."
                  className="w-full p-3 rounded-md bg-background border border-border focus:border-primary outline-none text-sm"
                />
                <p className="text-xs text-muted-foreground">URL must be an embed link.</p>
              </div>

              <Button
                onClick={toggleLive}
                variant={isLive ? 'destructive' : 'default'}
                className="w-full mt-4"
              >
                <Radio className={`w-4 h-4 mr-2 ${isLive ? 'animate-pulse' : ''}`} /> 
                {isLive ? 'End Live Stream' : 'Go Live Now'}
              </Button>
            </div>

            {/* Branding Controls */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
              <h3 className="text-lg font-semibold border-b border-border pb-2 flex items-center gap-2">
                <ImageIcon className="w-5 h-5" /> Branding
              </h3>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Logo URL</label>
                <input
                  name="logoUrl"
                  value={formData.logoUrl || ''}
                  onChange={handleChange}
                  placeholder="https://..."
                  className="w-full p-3 rounded-md bg-background border border-border focus:border-primary outline-none text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
