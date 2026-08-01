'use client'

import { useState, useEffect } from 'react'
import { eventService } from '@/services/database/eventService'
import type { Event } from '@/types'
import { AppLayout } from '@/components/shared/AppLayout'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { format } from 'date-fns'
import { MapPin, Clock, ArrowRight } from 'lucide-react'
import { Button } from '@/components/shared/Button'
import Image from 'next/image'

export function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEvts = async () => {
      try {
        const data = await eventService.getUpcoming()
        setEvents(data)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    fetchEvts()
  }, [])

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Events</h1>
        </div>

        {loading ? (
          <p>Loading events...</p>
        ) : events.length === 0 ? (
          <p className="text-muted-foreground">No upcoming events available.</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {events.map((event, i) => (
              <motion.div key={event.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass-card rounded-2xl overflow-hidden flex flex-col hover:-translate-y-1 transition-transform">
                {event.posterUrl && (
                  <div className="h-48 bg-muted relative">
                    <Image src={event.posterUrl} alt={event.title} fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" className="object-cover" />
                  </div>
                )}
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="bg-secondary/10 text-secondary px-2 py-1 rounded-sm text-xs font-semibold capitalize">{event.category}</span>
                    <span className="text-muted-foreground text-xs font-semibold">{format(new Date(event.date), 'MMM d, yyyy')}</span>
                  </div>
                  <h2 className="text-xl font-bold mb-2">{event.title}</h2>
                  <div className="space-y-2 mb-4 flex-1">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="w-4 h-4 mr-2" /> {event.time}
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4 mr-2" /> {event.venueName}
                    </div>
                  </div>
                  <Button asChild className="w-full justify-between">
                    <Link href={`/events/${event.id}`}>
                      View Details <ArrowRight className="w-4 h-4" />
                    </Link>
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
