'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/store/authStore'
import { format } from 'date-fns'

import { announcementService } from '@/services/database/announcementService'
import { eventService } from '@/services/database/eventService'
import type { Announcement, Event } from '@/types'
import { useRealtimeAnnouncements } from '@/hooks/useRealtimeAnnouncements'
import { useRealtimeEvents } from '@/hooks/useRealtimeEvents'

import { Calendar as CalendarIcon, Clock, MapPin, ArrowRight, ChevronRight, Video, CheckCircle, Bell, Users, History } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { AppLayout } from '@/components/shared/AppLayout'
import { DashboardHeader } from '@/components/shared/DashboardHeader'
import { QuickActions, QuickAction } from '@/components/shared/QuickActions'
import { UpcomingMeetingsList } from '@/components/meetings/UpcomingMeetingsList'

export function WorkerDashboard() {
  const user = useAuthStore((state) => state.user)

  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([])
  const [pastEvents, setPastEvents] = useState<(Event & { attended: boolean })[]>([])
  const [loading, setLoading] = useState(true)

  useRealtimeAnnouncements(announcements, setAnnouncements)
  useRealtimeEvents(upcomingEvents, setUpcomingEvents)

  const fetchDashboardData = useCallback(async () => {
    if (!user) return
    try {
      const [recentAnnouncements, futureEvents, historyEvents] = await Promise.all([
        announcementService.getPublished(3),
        eventService.getUpcoming(),
        eventService.getPastEventsForUser(user.id, 5)
      ])

      setAnnouncements(recentAnnouncements)
      setUpcomingEvents(futureEvents.slice(0, 4))
      setPastEvents(historyEvents)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  if (!user) return null

  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  const actions: QuickAction[] = [
    { label: 'Check In', href: '/attendance/check-in', icon: <CheckCircle className="w-6 h-6" />, colorClass: 'bg-emerald-500/10 text-emerald-500' },
    { label: 'Department', href: '/department', icon: <Users className="w-6 h-6" />, colorClass: 'bg-indigo-500/10 text-indigo-500' },
    { label: 'Meetings', href: '/meetings', icon: <Video className="w-6 h-6" />, colorClass: 'bg-rose-500/10 text-rose-500' },
    { label: 'Roster', href: '/roster', icon: <CalendarIcon className="w-6 h-6" />, colorClass: 'bg-blue-500/10 text-blue-500' },
  ]

  return (
    <AppLayout>
      <div className="min-h-screen bg-background/50 pb-24 md:pb-8">
        <DashboardHeader 
          firstName={user.fullName.split(' ')[0]} 
          roleLabel="Worker"
          department={user.department?.replace('_', ' ')}
        />

        <div className="container mx-auto px-4 sm:px-6 mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Main Content Column */}
            <div className="lg:col-span-2 space-y-8">
              
              <motion.div initial="hidden" animate="visible" variants={fadeUp}>
                <QuickActions actions={actions} />
              </motion.div>

              <motion.div initial="hidden" animate="visible" variants={fadeUp}>
                <motion.div className="bg-card border border-primary/20 rounded-3xl p-6 shadow-sm flex items-center justify-between cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                      <Bell className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">Department Updates</h4>
                      <p className="text-sm text-muted-foreground">You have 2 new notifications</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </motion.div>
              </motion.div>

              <motion.div initial="hidden" animate="visible" variants={fadeUp} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold tracking-tight">Virtual Meetings</h2>
                  <Link href="/meetings" className="text-sm font-medium text-primary hover:underline flex items-center">
                    View all <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>
                <UpcomingMeetingsList />
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
                      <div key={i} className="h-24 bg-card rounded-2xl animate-pulse border border-border"></div>
                    ))
                  ) : upcomingEvents.length > 0 ? (
                    upcomingEvents.map((event) => (
                      <div key={event.id} className="group bg-card border border-border hover:border-primary/30 p-4 rounded-2xl flex items-center justify-between transition-all shadow-sm hover:shadow-md">
                        <div className="flex items-center gap-4">
                          <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-xl flex flex-col items-center justify-center text-primary">
                            <span className="text-[10px] font-bold uppercase tracking-wider leading-none mb-0.5">
                              {format(new Date(event.date), 'MMM')}
                            </span>
                            <span className="text-lg font-black leading-none">
                              {format(new Date(event.date), 'dd')}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-bold mb-1 truncate group-hover:text-primary transition-colors">{event.title}</h3>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> {event.time}</span>
                              <span className="flex items-center"><MapPin className="w-3 h-3 mr-1" /> {event.venueName}</span>
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 bg-card border border-border rounded-2xl text-muted-foreground">
                      No upcoming events scheduled.
                    </div>
                  )}
                </div>
              </motion.div>
              
              {/* Past Events History */}
              <motion.div initial="hidden" animate="visible" variants={fadeUp} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold tracking-tight">Your Event History</h2>
                </div>
                
                <div className="grid gap-4">
                  {loading ? (
                    <div className="h-24 bg-card rounded-2xl animate-pulse border border-border"></div>
                  ) : pastEvents.length > 0 ? (
                    pastEvents.map((event) => (
                      <div key={event.id} className="bg-card border border-border p-4 rounded-2xl flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center text-muted-foreground">
                            <History className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-foreground">{event.title}</h4>
                            <p className="text-xs text-muted-foreground">{format(new Date(event.date), 'MMMM d, yyyy')}</p>
                          </div>
                        </div>
                        <div>
                          {event.attended ? (
                            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 text-xs font-bold rounded-full flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> Attended
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-amber-500/10 text-amber-600 text-xs font-bold rounded-full">
                              Missed
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 bg-card border border-border rounded-2xl text-muted-foreground text-sm">
                      You haven&apos;t registered for any past events yet.
                    </div>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Sidebar Column */}
            <div className="space-y-8">
              
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
