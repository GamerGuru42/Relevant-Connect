'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { attendanceService } from '@/services/database/attendanceService'
import { eventService } from '@/services/database/eventService'
import type { Event } from '@/types'
import { format } from 'date-fns'
import { motion } from 'framer-motion'
import { CheckCircle2, XCircle, Calendar, MapPin, Clock, Loader2 } from 'lucide-react'
import { Button } from '@/components/shared/Button'

import { haptics } from '@/utils/haptics'

export function AttendPage({ eventId }: { eventId: string }) {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const [event, setEvent] = useState<Event | null>(null)
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'unauthorized'>('loading')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    // If not logged in, redirect to login but save the return URL
    if (!user) {
      sessionStorage.setItem('returnUrl', `/attend/${eventId}`)
      router.push('/auth/login')
      return
    }

    const checkIn = async () => {
      try {
        const eventData = await eventService.getById(eventId)
        if (!eventData) throw new Error('Event not found')
        
        setEvent(eventData)

        // Record attendance
        await attendanceService.recordAttendance(eventId, user.id, 'qr')
        setStatus('success')
        haptics.success()
        
        // Clean up return URL if it exists
        sessionStorage.removeItem('returnUrl')
      } catch (err: any) {
        setErrorMessage(err.message || 'Failed to record attendance')
        setStatus('error')
        haptics.error()
      }
    }

    checkIn()
  }, [eventId, user, router])

  if (!user) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <h2 className="text-xl font-bold">Redirecting to login...</h2>
        <p className="text-muted-foreground mt-2">Please sign in to mark your attendance</p>
      </div>
    )
  }

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-md w-full bg-card border border-border rounded-3xl p-8 shadow-xl text-center"
      >
        {status === 'loading' && (
          <div className="flex flex-col items-center py-8">
            <Loader2 className="w-16 h-16 text-primary animate-spin mb-6" />
            <h2 className="text-2xl font-bold">Checking you in...</h2>
            <p className="text-muted-foreground mt-2">Please wait while we record your attendance</p>
          </div>
        )}

        {status === 'success' && event && (
          <div className="flex flex-col items-center py-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 15 }}
            >
              <CheckCircle2 className="w-24 h-24 text-emerald-500 mb-6" />
            </motion.div>
            <h2 className="text-3xl font-extrabold mb-2 text-emerald-500">You&apos;re checked in!</h2>
            <p className="text-muted-foreground mb-8">Your attendance has been recorded successfully.</p>
            
            <div className="w-full bg-muted/50 rounded-2xl p-6 text-left mb-8 border border-border">
              <h3 className="font-bold text-lg mb-4">{event.title}</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center text-muted-foreground">
                  <Calendar className="w-4 h-4 mr-3 text-primary" />
                  {format(new Date(event.date), 'EEEE, MMMM do, yyyy')}
                </div>
                <div className="flex items-center text-muted-foreground">
                  <Clock className="w-4 h-4 mr-3 text-primary" />
                  {event.time}
                </div>
                <div className="flex items-center text-muted-foreground">
                  <MapPin className="w-4 h-4 mr-3 text-primary" />
                  {event.venueName}
                </div>
              </div>
            </div>

            <Button className="w-full py-6 text-lg rounded-xl" onClick={() => router.push('/')}>
              Go to Dashboard
            </Button>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center py-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 15 }}
            >
              <XCircle className="w-24 h-24 text-destructive mb-6" />
            </motion.div>
            <h2 className="text-2xl font-bold mb-2">Check-in Failed</h2>
            <p className="text-muted-foreground mb-8">{errorMessage}</p>
            <Button variant="outline" className="w-full" onClick={() => router.push('/')}>
              Return to Dashboard
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  )
}
