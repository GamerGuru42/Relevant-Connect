'use client'

import { useEffect, useState, useRef } from 'react'
import { useAuthStore } from '@/store/authStore'
import { eventRegistrationService } from '@/services/database/eventRegistrationService'
import { eventService } from '@/services/database/eventService'
import { AppLayout } from '@/components/shared/AppLayout'
import type { EventRegistration, Event } from '@/types'
import { Ticket, ChevronLeft, Share2, CheckCircle2, Clock } from 'lucide-react'
import { Button } from '@/components/shared/Button'
import { format } from 'date-fns'
import QRCode from 'qrcode'

interface TicketWithEvent extends EventRegistration {
  event: Event | null
}

export function TicketsPage() {
  const user = useAuthStore(state => state.user)
  const [tickets, setTickets] = useState<TicketWithEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    loadTickets()
  }, [user])

  const loadTickets = async () => {
    if (!user) return
    setLoading(true)
    try {
      const registrations = await eventRegistrationService.getUserRegistrations(user.id)
      const ticketsWithEvents = await Promise.all(
        registrations.map(async (reg) => {
          const event = await eventService.getById(reg.eventId)
          return { ...reg, event }
        })
      )
      // Sort: upcoming first, then past
      ticketsWithEvents.sort((a, b) => {
        if (!a.event || !b.event) return 0
        return new Date(a.event.date).getTime() - new Date(b.event.date).getTime()
      })
      setTickets(ticketsWithEvents)
    } catch {
      // Fail silently, empty state will show
    } finally {
      setLoading(false)
    }
  }

  const handleShare = (ticket: TicketWithEvent) => {
    if (!ticket.event) return
    const text = encodeURIComponent(
      `I'm attending ${ticket.event.title} at Relevant+ Church! 🎉`
    )
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-10 h-10 border-4 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      </AppLayout>
    )
  }

  // Full-screen QR view
  if (expandedTicket) {
    const ticket = tickets.find(t => t.id === expandedTicket)
    if (!ticket || !ticket.event) return null

    return (
      <AppLayout>
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-6">
          <button
            onClick={() => setExpandedTicket(null)}
            className="absolute top-6 left-6 text-white/80 hover:text-white flex items-center gap-2 text-sm"
          >
            <ChevronLeft className="w-5 h-5" /> Back
          </button>
          <h2 className="text-white text-xl font-bold mb-2 text-center">{ticket.event.title}</h2>
          <p className="text-white/60 text-sm mb-8">
            {format(new Date(ticket.event.date), 'MMMM d, yyyy')} · {ticket.event.time}
          </p>
          <QRCodeRenderer data={ticket.qrCodeData || ''} size={280} />
          <p className="text-white/40 text-xs mt-6 text-center">Present this QR code at the venue for check-in</p>
          {ticket.checkedIn && (
            <div className="mt-4 flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-medium">Checked In</span>
            </div>
          )}
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <Ticket className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">My Tickets</h1>
            <p className="text-sm text-muted-foreground">{tickets.length} ticket{tickets.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {tickets.length === 0 ? (
          <div className="text-center py-20">
            <Ticket className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground">No tickets yet</h3>
            <p className="text-sm text-muted-foreground/70 mt-1">Register for an event to get your ticket</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map(ticket => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                onExpand={() => setExpandedTicket(ticket.id)}
                onShare={() => handleShare(ticket)}
              />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}

function TicketCard({
  ticket,
  onExpand,
  onShare,
}: {
  ticket: TicketWithEvent
  onExpand: () => void
  onShare: () => void
}) {
  if (!ticket.event) return null

  const isPast = new Date(ticket.event.date) < new Date()

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-border shadow-soft transition-all hover:shadow-lg ${
        isPast ? 'opacity-60' : ''
      }`}
    >
      {/* Ticket top section — event info */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-5 text-white relative">
        {ticket.event.posterUrl && (
          <div
            className="absolute inset-0 opacity-20 bg-cover bg-center"
            style={{ backgroundImage: `url(${ticket.event.posterUrl})` }}
          />
        )}
        <div className="relative z-10">
          <p className="text-xs text-white/50 uppercase tracking-wider font-medium mb-1">
            {ticket.event.category.replace(/_/g, ' ')}
          </p>
          <h3 className="text-lg font-bold leading-snug">{ticket.event.title}</h3>
          <div className="mt-3 flex items-center gap-4 text-sm text-white/70">
            <span>{format(new Date(ticket.event.date), 'MMM d, yyyy')}</span>
            <span>{ticket.event.time}</span>
          </div>
          <p className="text-xs text-white/50 mt-1">{ticket.event.venueName}</p>
        </div>
      </div>

      {/* Dotted separator with notch effect */}
      <div className="relative h-6 bg-card flex items-center">
        <div className="absolute -left-3 w-6 h-6 rounded-full bg-background" />
        <div className="absolute -right-3 w-6 h-6 rounded-full bg-background" />
        <div className="w-full border-t-2 border-dashed border-border mx-6" />
      </div>

      {/* Ticket bottom section — QR + actions */}
      <div className="bg-card p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {ticket.checkedIn ? (
            <div className="flex items-center gap-1.5 text-emerald-500">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-sm font-medium">Checked In</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span className="text-sm">Not checked in yet</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onShare}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            title="Share on WhatsApp"
          >
            <Share2 className="w-4 h-4 text-muted-foreground" />
          </button>
          <Button size="sm" onClick={onExpand} disabled={isPast}>
            <Ticket className="w-4 h-4 mr-1" /> Show QR
          </Button>
        </div>
      </div>
    </div>
  )
}

function QRCodeRenderer({ data, size = 200 }: { data: string; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (canvasRef.current && data) {
      QRCode.toCanvas(canvasRef.current, data, {
        width: size,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      })
    }
  }, [data, size])

  return (
    <div className="bg-white rounded-2xl p-4 inline-block">
      <canvas ref={canvasRef} />
    </div>
  )
}
