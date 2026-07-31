'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/store/authStore'
import { format } from 'date-fns'

import { announcementService } from '@/services/database/announcementService'
import { eventService } from '@/services/database/eventService'
import { churchInfoService } from '@/services/database/churchInfoService'
import type { Announcement, Event } from '@/types'
import { useRealtimeAnnouncements } from '@/hooks/useRealtimeAnnouncements'
import { useRealtimeEvents } from '@/hooks/useRealtimeEvents'

import { Calendar as CalendarIcon, Clock, MapPin, ArrowRight, Users, CheckCircle, ShieldAlert, Settings, Radio } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { AppLayout } from '@/components/shared/AppLayout'
import { DashboardHeader } from '@/components/shared/DashboardHeader'
import { QuickActions, QuickAction } from '@/components/shared/QuickActions'
import { StatsCard } from '@/components/shared/StatsCard'
import { UpcomingMeetingsList } from '@/components/meetings/UpcomingMeetingsList'

export function SuperAdminDashboard() {
  const user = useAuthStore((state) => state.user)

  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([])
  const [isLive, setIsLive] = useState(false)
  const [loading, setLoading] = useState(true)

  useRealtimeAnnouncements(announcements, setAnnouncements)
  useRealtimeEvents(upcomingEvents, setUpcomingEvents)

  const fetchDashboardData = useCallback(async () => {
    try {
      const [recentAnnouncements, futureEvents, churchInfo] = await Promise.all([
        announcementService.getPublished(3),
        eventService.getUpcoming(),
        churchInfoService.get()
      ])

      setAnnouncements(recentAnnouncements)
      setUpcomingEvents(futureEvents.slice(0, 4))
      if (churchInfo) {
        setIsLive(churchInfo.isLive)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  const toggleLive = async () => {
    try {
      const info = await churchInfoService.get()
      if (info && user) {
        await churchInfoService.update({ isLive: !info.isLive }, user.id)
        setIsLive(!info.isLive)
      }
    } catch (error) {
      console.error('Failed to toggle live status:', error)
    }
  }

  if (!user) return null

  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  const actions: QuickAction[] = [
    { label: 'Admin Panel', href: '/admin', icon: <ShieldAlert className="w-6 h-6" />, colorClass: 'bg-primary/10 text-primary' },
    { label: 'Members', href: '/admin/members', icon: <Users className="w-6 h-6" />, colorClass: 'bg-indigo-500/10 text-indigo-500' },
    { label: 'Events Mgr', href: '/admin/events', icon: <CalendarIcon className="w-6 h-6" />, colorClass: 'bg-rose-500/10 text-rose-500' },
    { label: 'Settings', href: '/admin/settings', icon: <Settings className="w-6 h-6" />, colorClass: 'bg-slate-500/10 text-slate-500' },
  ]

  return (
    <AppLayout>
      <div className="min-h-screen bg-background/50 pb-24 md:pb-8">
        <DashboardHeader 
          firstName={user.fullName.split(' ')[0]} 
          roleLabel="Super Admin"
        />

        <div className="container mx-auto px-4 sm:px-6 mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Main Content Column */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Global Overview */}
              <motion.div initial="hidden" animate="visible" variants={fadeUp} className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatsCard title="Total Members" value="1,248" icon={<Users className="w-5 h-5 text-indigo-500" />} />
                <StatsCard title="Total Workers" value="156" icon={<ShieldAlert className="w-5 h-5 text-primary" />} />
                <StatsCard title="Active Cells" value="42" icon={<Users className="w-5 h-5 text-rose-500" />} />
                <StatsCard title="Avg Attendance" value="85%" icon={<CheckCircle className="w-5 h-5 text-emerald-500" />} />
              </motion.div>

              <motion.div initial="hidden" animate="visible" variants={fadeUp}>
                <QuickActions actions={actions} />
              </motion.div>

              {/* Live Status Control */}
              <motion.div initial="hidden" animate="visible" variants={fadeUp}>
                <div className="bg-card border border-border rounded-3xl p-6 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isLive ? 'bg-red-500/10 text-red-500' : 'bg-muted text-muted-foreground'}`}>
                      <Radio className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">Live Stream Status</h4>
                      <p className="text-sm text-muted-foreground">
                        {isLive ? 'Service is currently live streaming' : 'No active live stream'}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={toggleLive}
                    className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors ${
                      isLive 
                        ? 'bg-red-500 hover:bg-red-600 text-white shadow-md shadow-red-500/20' 
                        : 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-md'
                    }`}
                  >
                    {isLive ? 'End Stream' : 'Go Live'}
                  </button>
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
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 bg-card border border-border rounded-2xl text-muted-foreground">
                      No upcoming events scheduled.
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
