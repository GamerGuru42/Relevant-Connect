'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/store/authStore'

import { announcementService } from '@/services/database/announcementService'
import { eventService } from '@/services/database/eventService'
import type { Announcement, Event } from '@/types'
import { useRealtimeAnnouncements } from '@/hooks/useRealtimeAnnouncements'
import { useRealtimeEvents } from '@/hooks/useRealtimeEvents'

import { Clock, MapPin, ArrowRight, MessageSquare, ChevronRight, Info } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { format } from 'date-fns'
import { AppLayout } from '@/components/shared/AppLayout'
import { DashboardHeader } from '@/components/shared/DashboardHeader'

export function VisitorDashboard() {
  const user = useAuthStore((state) => state.user)

  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useRealtimeAnnouncements(announcements, setAnnouncements)
  useRealtimeEvents(upcomingEvents, setUpcomingEvents)

  const isNewConvert = user?.membershipStatus === 'new_convert'

  const fetchDashboardData = useCallback(async () => {
    try {
      const [recentAnnouncements, futureEvents] = await Promise.all([
        announcementService.getPublished(3),
        eventService.getUpcoming()
      ])

      setAnnouncements(recentAnnouncements)
      setUpcomingEvents(futureEvents.slice(0, 3))
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  if (!user) return null

  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-background/50 pb-24 md:pb-8">
        <DashboardHeader 
          firstName={user.fullName.split(' ')[0]} 
          roleLabel={isNewConvert ? 'New Believer' : 'Welcome Guest'}
        />

        <div className="container mx-auto px-4 sm:px-6 mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Main Content Column */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Welcome Banner */}
              <motion.div initial="hidden" animate="visible" variants={fadeUp}>
                <div className="bg-gradient-to-br from-primary to-primary/80 rounded-3xl p-8 text-primary-foreground shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                  <div className="relative z-10">
                    <h2 className="text-2xl md:text-3xl font-bold mb-3">
                      {isNewConvert ? 'Begin Your Journey' : 'We are glad you are here'}
                    </h2>
                    <p className="text-primary-foreground/90 max-w-lg mb-6 leading-relaxed">
                      {isNewConvert 
                        ? 'Congratulations on taking this step. We have resources prepared specially to guide you through your new faith journey.'
                        : 'Experience God\'s presence with us. Whether you are looking for a church home or just visiting, you belong here.'}
                    </p>
                    <Link 
                      href={isNewConvert ? '/foundation-class' : '/connect'}
                      className="inline-flex bg-background text-foreground px-6 py-3 rounded-xl font-bold text-sm hover:bg-white/90 transition-colors"
                    >
                      {isNewConvert ? 'Start Foundation Class' : 'Connect With Us'}
                    </Link>
                  </div>
                </div>
              </motion.div>

              {/* Action Cards */}
              <motion.div initial="hidden" animate="visible" variants={fadeUp} className="grid sm:grid-cols-2 gap-4">
                <Link href="/about" className="bg-card border border-border p-6 rounded-3xl hover:border-primary/50 transition-colors group shadow-sm flex flex-col justify-between min-h-[140px]">
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                      <Info className="w-6 h-6" />
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">About Us</h3>
                    <p className="text-sm text-muted-foreground line-clamp-1">Learn about our vision and beliefs</p>
                  </div>
                </Link>

                <Link href="/contact" className="bg-card border border-border p-6 rounded-3xl hover:border-primary/50 transition-colors group shadow-sm flex flex-col justify-between min-h-[140px]">
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">Contact Pastor</h3>
                    <p className="text-sm text-muted-foreground line-clamp-1">Send a prayer request or message</p>
                  </div>
                </Link>
              </motion.div>

              {/* Upcoming Events */}
              <motion.div initial="hidden" animate="visible" variants={fadeUp} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold tracking-tight">Upcoming Events</h2>
                  <Link href="/events" className="text-sm font-medium text-primary hover:underline flex items-center">
                    View all <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>
                
                <div className="grid gap-4">
                  {loading ? (
                    Array(2).fill(0).map((_, i) => (
                      <div key={i} className="h-32 bg-card rounded-2xl animate-pulse border border-border"></div>
                    ))
                  ) : upcomingEvents.length > 0 ? (
                    upcomingEvents.map((event) => (
                      <div key={event.id} className="group bg-card border border-border hover:border-primary/30 p-5 rounded-2xl flex flex-col sm:flex-row gap-5 transition-all shadow-sm hover:shadow-md">
                        <div className="flex-shrink-0 w-16 h-16 bg-primary/10 rounded-xl flex flex-col items-center justify-center text-primary">
                          <span className="text-xs font-bold uppercase tracking-wider">
                            {format(new Date(event.date), 'MMM')}
                          </span>
                          <span className="text-xl font-black">
                            {format(new Date(event.date), 'dd')}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-lg mb-1 truncate group-hover:text-primary transition-colors">{event.title}</h3>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground mb-3">
                            <span className="flex items-center"><Clock className="w-3.5 h-3.5 mr-1.5" /> {event.time}</span>
                            <span className="flex items-center truncate"><MapPin className="w-3.5 h-3.5 mr-1.5" /> {event.venueName}</span>
                          </div>
                        </div>
                        <div className="sm:self-center">
                          <Link href={`/events/${event.id}`} className="inline-flex items-center justify-center px-4 py-2 bg-secondary/50 hover:bg-secondary text-secondary-foreground text-sm font-semibold rounded-lg transition-colors">
                            Details
                          </Link>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 bg-card border border-border rounded-2xl text-muted-foreground">
                      No upcoming events scheduled.
                    </div>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Sidebar Column */}
            <div className="space-y-8">
              {/* Join as Member Widget */}
              <motion.div initial="hidden" animate="visible" variants={fadeUp}>
                <div className="bg-card border border-primary/20 rounded-3xl p-6 shadow-sm text-center">
                  <h3 className="font-bold text-lg mb-2">Become a Member</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Take the next step in your spiritual journey and join our church family.
                  </p>
                  <button className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors">
                    Start Process
                  </button>
                </div>
              </motion.div>

              {/* Recent Announcements Widget */}
              <motion.div initial="hidden" animate="visible" variants={fadeUp} className="bg-card border border-border rounded-3xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold">Latest News</h3>
                  <Link href="/announcements" className="text-xs font-semibold text-primary hover:underline">View All</Link>
                </div>
                
                <div className="space-y-5">
                  {loading ? (
                     Array(3).fill(0).map((_, i) => (
                      <div key={i} className="flex gap-3 animate-pulse">
                        <div className="w-2 h-2 mt-1.5 rounded-full bg-muted"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-3 bg-muted rounded w-full"></div>
                          <div className="h-3 bg-muted rounded w-2/3"></div>
                        </div>
                      </div>
                    ))
                  ) : announcements.length > 0 ? (
                    announcements.map((announcement) => (
                      <Link href={`/announcements/${announcement.id}`} key={announcement.id} className="flex gap-3 group">
                        <div className="w-2 h-2 mt-1.5 rounded-full bg-primary/40 group-hover:bg-primary transition-colors flex-shrink-0"></div>
                        <div>
                          <h4 className="text-sm font-semibold line-clamp-2 group-hover:text-primary transition-colors">{announcement.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(announcement.createdAt), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No recent announcements.</p>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
