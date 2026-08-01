'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/store/authStore'
import { format } from 'date-fns'

import { announcementService } from '@/services/database/announcementService'
import { eventService } from '@/services/database/eventService'
import type { Announcement, Event } from '@/types'
import { useRealtimeAnnouncements } from '@/hooks/useRealtimeAnnouncements'
import { useRealtimeEvents } from '@/hooks/useRealtimeEvents'

import { Calendar as CalendarIcon, Clock, MapPin, ArrowRight, BookOpen, ChevronRight, Video, CheckCircle, History, Heart } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { AppLayout } from '@/components/shared/AppLayout'
import { DashboardHeader } from '@/components/shared/DashboardHeader'
import { QuickActions, QuickAction } from '@/components/shared/QuickActions'
import { UpcomingMeetingsList } from '@/components/meetings/UpcomingMeetingsList'
import { EmptyState } from '@/components/shared/EmptyState'
import { SkeletonList } from '@/components/shared/SkeletonList'

interface VerseOfTheDay {
  text: string;
  reference: string;
}

export function MemberDashboard() {
  const user = useAuthStore((state) => state.user)

  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([])
  const [pastEvents, setPastEvents] = useState<(Event & { attended: boolean })[]>([])
  const [verseOfDay, setVerseOfDay] = useState<VerseOfTheDay | null>(null)
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
      setUpcomingEvents(futureEvents.slice(0, 3))
      setPastEvents(historyEvents)

      const today = new Date().toISOString().split('T')[0]
      const cachedVerse = localStorage.getItem(`verseOfDay-${today}`)
      
      if (cachedVerse) {
        setVerseOfDay(JSON.parse(cachedVerse))
      } else {
        const fallbackVerses = [
          { reference: 'John 3:16', text: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.' },
          { reference: 'Philippians 4:13', text: 'I can do all things through Christ which strengtheneth me.' },
          { reference: 'Proverbs 3:5-6', text: 'Trust in the LORD with all thine heart; and lean not unto thine own understanding. In all thy ways acknowledge him, and he shall direct thy paths.' },
        ]
        const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24)
        setVerseOfDay(fallbackVerses[dayOfYear % fallbackVerses.length])
      }
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
    { label: 'Give', href: '/give', icon: <Heart className="w-6 h-6" />, colorClass: 'bg-emerald-500/10 text-emerald-500' },
    { label: 'Bible', href: '/bible', icon: <BookOpen className="w-6 h-6" />, colorClass: 'bg-indigo-500/10 text-indigo-500' },
    { label: 'Meetings', href: '/meetings', icon: <Video className="w-6 h-6" />, colorClass: 'bg-rose-500/10 text-rose-500' },
    { label: 'Events', href: '/events', icon: <CalendarIcon className="w-6 h-6" />, colorClass: 'bg-blue-500/10 text-blue-500' },
  ]

  return (
    <AppLayout>
      <div className="min-h-screen bg-background/50 pb-24 md:pb-8">
        <DashboardHeader 
          firstName={user.fullName.split(' ')[0]} 
          roleLabel="Member"
        />

        <div className="container mx-auto px-4 sm:px-6 mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Main Content Column */}
            <div className="lg:col-span-2 space-y-8">
              
              <motion.div initial="hidden" animate="visible" variants={fadeUp}>
                <QuickActions actions={actions} />
              </motion.div>

              <motion.div initial="hidden" animate="visible" variants={fadeUp}>
                <div className="bg-card border-l-4 border-l-primary rounded-3xl p-6 shadow-xl flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">Join a Cell Group</h4>
                      <p className="text-sm text-muted-foreground">Grow together in fellowship</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
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
                    <SkeletonList count={2} />
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
                    <EmptyState 
                      icon={CalendarIcon}
                      title="No upcoming events"
                      description="Check back soon for new events!"
                    />
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
                    <SkeletonList count={1} />
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
                    <EmptyState 
                      icon={History}
                      title="No event history"
                      description="You haven't registered for any past events yet."
                    />
                  )}
                </div>
              </motion.div>
            </div>

            {/* Sidebar Column */}
            <div className="space-y-8">
              {/* Verse of the Day Widget */}
              <motion.div initial="hidden" animate="visible" variants={fadeUp}>
                <div className="bg-card border border-border rounded-3xl p-6 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 transition-transform group-hover:scale-150"></div>
                  
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-primary" /> 
                    Verse of the Day
                  </h3>
                  
                  {verseOfDay ? (
                    <>
                      <blockquote className="text-lg font-medium leading-relaxed mb-4 relative z-10">
                        &quot;{verseOfDay.text}&quot;
                      </blockquote>
                      <p className="text-sm font-bold text-primary relative z-10">— {verseOfDay.reference}</p>
                    </>
                  ) : (
                    <div className="animate-pulse space-y-3">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-4 bg-muted rounded w-full"></div>
                      <div className="h-4 bg-muted rounded w-5/6"></div>
                      <div className="h-4 bg-muted rounded w-1/4 mt-4"></div>
                    </div>
                  )}
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
                    <SkeletonList count={2} />
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
