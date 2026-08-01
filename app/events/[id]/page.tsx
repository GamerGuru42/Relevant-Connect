'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { eventService } from '@/services/database/eventService'
import type { Event } from '@/types'
import { eventRegistrationService } from '@/services/database/eventRegistrationService'
import { useAuthStore } from '@/store/authStore'
import Image from 'next/image'
import { AppLayout } from '@/components/shared/AppLayout'
import { Button } from '@/components/shared/Button'
import { ArrowLeft, MapPin, Clock, Calendar as CalendarIcon, User as UserIcon, Ticket, AlertCircle } from 'lucide-react'
import { format, isPast } from 'date-fns'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { haptics } from '@/utils/haptics'

export default function EventDetail() {
  const params = useParams()
  const router = useRouter()
  const user = useAuthStore(state => state.user)
  const [event, setEvent] = useState<Event | null>(null)
  const [isRegistered, setIsRegistered] = useState(false)
  const [loading, setLoading] = useState(false)
  const [currentCount, setCurrentCount] = useState(0)

  useEffect(() => {
    if (params.id) {
      eventService.getById(params.id as string).then(setEvent)
      eventRegistrationService.getRegistrationCount(params.id as string).then(setCurrentCount)
      if (user) {
        eventRegistrationService.isRegistered(params.id as string, user.id).then(setIsRegistered)
      }
    }
  }, [params.id, user])

  const handleRegister = async () => {
    if (!user || !event) return
    setLoading(true)
    haptics.light()
    try {
      if (isRegistered) {
        await eventRegistrationService.unregister(event.id, user.id)
        setIsRegistered(false)
        setCurrentCount(c => c - 1)
        toast.success('You have unregistered from this event.')
        haptics.medium()
      } else {
        await eventRegistrationService.register(event.id, user.id)
        setIsRegistered(true)
        setCurrentCount(c => c + 1)
        toast.success('Successfully registered for event!')
        haptics.success()
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to update registration')
      haptics.error()
    } finally {
      setLoading(false)
    }
  }

  if (!event) return <AppLayout><div className="p-8">Loading...</div></AppLayout>

  const isCompleted = isPast(new Date(event.date))
  const isFull = event.registrationLimit !== null && currentCount >= event.registrationLimit

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button variant="ghost" className="mb-6" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Events
        </Button>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            {event.posterUrl && (
              <div className="relative w-full h-[400px]">
                <Image src={event.posterUrl} alt={event.title} fill sizes="(max-width: 768px) 100vw, 50vw" priority className="rounded-lg object-cover" />
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="bg-secondary/10 text-secondary px-3 py-1 rounded-sm text-sm font-semibold capitalize">{event.category}</span>
              {isCompleted && (
                 <span className="bg-slate-500/10 text-slate-500 px-3 py-1 rounded-sm text-sm font-semibold">Completed</span>
              )}
            </div>
            <h1 className="text-4xl font-bold">{event.title}</h1>
            <div className="prose dark:prose-invert max-w-none">
              {event.description.split('\n').map((para, i) => <p key={i} className="mb-4">{para}</p>)}
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-card border border-border p-6 rounded-lg shadow-soft space-y-4">
              <h3 className="font-bold text-lg border-b border-border pb-2">Event Details</h3>
              <div className="flex items-start gap-3">
                <CalendarIcon className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">{format(new Date(event.date), 'EEEE, MMMM d, yyyy')}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">{event.time}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">{event.venueName}</p>
                  <p className="text-sm text-muted-foreground">{event.venueAddress}</p>
                  {event.venueMapLink && (
                    <a href={event.venueMapLink} target="_blank" rel="noopener noreferrer" className="text-primary text-sm hover:underline mt-1 inline-block">View on Map</a>
                  )}
                </div>
              </div>
              {event.speaker && (
                <div className="flex items-start gap-3">
                  <UserIcon className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Speaker</p>
                    <p className="text-sm text-muted-foreground">{event.speaker}</p>
                  </div>
                </div>
              )}
              
              <div className="pt-4 border-t border-border space-y-3">
                {event.registrationLimit && (
                  <p className="text-xs text-muted-foreground text-center">
                    {event.registrationLimit - currentCount} spots remaining
                  </p>
                )}

                {isCompleted ? (
                   <Button className="w-full" disabled variant="outline">
                     Event Completed
                   </Button>
                ) : isRegistered ? (
                  <div className="flex flex-col gap-2">
                    <Link href="/tickets" className="w-full">
                      <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white">
                        <Ticket className="w-4 h-4 mr-2" /> View Ticket
                      </Button>
                    </Link>
                    <Button className="w-full text-xs" onClick={handleRegister} loading={loading} variant="ghost">
                      Cancel Registration
                    </Button>
                  </div>
                ) : isFull ? (
                  <Button className="w-full" disabled variant="secondary">
                    <AlertCircle className="w-4 h-4 mr-2" /> Event Full
                  </Button>
                ) : (
                  <Button className="w-full" onClick={handleRegister} loading={loading}>
                    Sign Up
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
