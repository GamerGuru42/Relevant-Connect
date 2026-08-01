'use client'

import { useState, useEffect } from 'react'
import { AppLayout } from '@/components/shared/AppLayout'
import { churchInfoService } from '@/services/database/churchInfoService'
import type { ChurchInfo } from '@/types'
import { supabase } from '@/lib/supabase'
import { Video, BellRing, Share2, Calendar as CalendarIcon } from 'lucide-react'
import { Button } from '@/components/shared/Button'
import { toast } from 'react-hot-toast'
import { haptics } from '@/utils/haptics'

export default function LivePage() {
  const [churchInfo, setChurchInfo] = useState<ChurchInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchChurchInfo()

    const subscription = supabase
      .channel('church_info_live_page')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'church_info' 
      }, () => {
        fetchChurchInfo()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [])

  const fetchChurchInfo = async () => {
    setLoading(true)
    try {
      const info = await churchInfoService.get()
      setChurchInfo(info)
    } catch (error) {
      console.error('Failed to load church info:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleShare = async () => {
    haptics.light()
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join our Live Service',
          url: window.location.href
        })
      } catch (err) {
        console.error('Error sharing:', err)
      }
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied to clipboard')
    }
  }

  const handleSetReminder = async () => {
    haptics.light()
    if (!('Notification' in window)) {
      toast.error('Notifications are not supported in this browser.')
      return
    }

    const permission = await Notification.requestPermission()
    if (permission === 'granted') {
      toast.success('Reminder set! We will notify you when we go live.')
      haptics.success()
      // In a full implementation, you would save this to push_subscriptions
    } else {
      toast.error('Please allow notifications to receive reminders.')
    }
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
      <div className="container mx-auto max-w-4xl px-4 py-8">
        
        {churchInfo?.isLive ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                  <span className="relative flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
                  </span>
                  Live Service
                </h1>
                <p className="text-muted-foreground mt-1">Join us in worship and the word.</p>
              </div>
              <Button onClick={handleShare} variant="outline" size="sm" className="hidden sm:flex">
                <Share2 className="w-4 h-4 mr-2" /> Share
              </Button>
            </div>

            <div className="aspect-video w-full rounded-xl overflow-hidden bg-black shadow-xl ring-1 ring-border">
              {churchInfo.liveStreamUrl ? (
                <iframe 
                  src={churchInfo.liveStreamUrl} 
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                  title="Live Stream"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-white/50">
                  <Video className="w-12 h-12 mb-2 opacity-50" />
                  <p>Stream starting shortly...</p>
                </div>
              )}
            </div>
            
            <Button onClick={handleShare} variant="outline" className="w-full sm:hidden">
              <Share2 className="w-4 h-4 mr-2" /> Share Stream Link
            </Button>
          </div>
        ) : (
          <div className="max-w-md mx-auto text-center space-y-8 py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <Video className="w-10 h-10 text-muted-foreground" />
            </div>
            
            <div>
              <h1 className="text-3xl font-bold mb-2">We are currently offline</h1>
              <p className="text-muted-foreground text-lg">
                Our next service will be broadcasted live here.
              </p>
            </div>

            <div className="bg-card border border-border p-6 rounded-xl shadow-sm text-left">
              <h3 className="font-semibold text-lg border-b border-border pb-3 mb-4">Service Schedule</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CalendarIcon className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Service Times</p>
                    <p className="text-muted-foreground whitespace-pre-wrap">{churchInfo?.serviceTimes || 'Sundays 9:00 AM'}</p>
                  </div>
                </div>
              </div>
            </div>

            <Button onClick={handleSetReminder} className="w-full h-12 text-base font-semibold shadow-md">
              <BellRing className="w-5 h-5 mr-2" /> Set Reminder
            </Button>
          </div>
        )}
        
      </div>
    </AppLayout>
  )
}
