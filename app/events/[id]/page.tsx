'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { eventService } from '@/services/database/eventService'
import type { Event } from '@/types'
import { eventRegistrationService } from '@/services/database/eventRegistrationService'
import { useAuthStore } from '@/store/authStore'
import { AppLayout } from '@/components/shared/AppLayout'
import { Button } from '@/components/shared/Button'
import { ArrowLeft, MapPin, Clock, Calendar as CalendarIcon, User as UserIcon } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function EventDetail() {
  const params = useParams()
  const router = useRouter()
  const user = useAuthStore(state => state.user)
  const [event, setEvent] = useState<Event | null>(null)
  const [isRegistered, setIsRegistered] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (params.id) {
      eventService.getById(params.id as string).then(setEvent)
      if (user) {
        eventRegistrationService.isRegistered(params.id as string, user.id).then(setIsRegistered)
      }
    }
  }, [params.id, user])

  const handleRSVP = async () => {
    if (!user || !event) return
    setLoading(true)
    try {
      if (isRegistered) {
        await eventRegistrationService.unregister(event.id, user.id)
        setIsRegistered(false)
        toast.success('You have unregistered from this event.')
      } else {
        await eventRegistrationService.register(event.id, user.id)
        setIsRegistered(true)
        toast.success('Successfully registered for event!')
      }
    } catch (e) {
      toast.error('Failed to update RSVP')
    } finally {
      setLoading(false)
    }
  }

  if (!event) return <AppLayout><div className="p-8">Loading...</div></AppLayout>

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button variant="ghost" className="mb-6" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Events
        </Button>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            {event.posterUrl && <img src={event.posterUrl} alt={event.title} className="w-full rounded-lg max-h-[400px] object-cover" />}
            <div className="flex items-center gap-2">
              <span className="bg-secondary/10 text-secondary px-3 py-1 rounded-sm text-sm font-semibold capitalize">{event.category}</span>
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
              
              <div className="pt-4 border-t border-border">
                <Button className="w-full" onClick={handleRSVP} loading={loading} variant={isRegistered ? "outline" : "default"}>
                  {isRegistered ? 'Cancel RSVP' : 'RSVP Now'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
