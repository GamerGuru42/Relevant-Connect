'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { format } from 'date-fns'

import { announcementService } from '@/services/database/announcementService'
import { eventService } from '@/services/database/eventService'
import type { Announcement, Event, ChurchInfo } from '@/types'
import { attendanceService } from '@/services/database/attendanceService'
import { churchInfoService } from '@/services/database/churchInfoService'
import { AppLayout } from '@/components/shared/AppLayout'
import { motion } from 'framer-motion'
import { Calendar, User, Settings, Bell, ChevronRight, CheckCircle, BookOpen, Clock, Heart, Users, BookMarked, Briefcase, Sparkles } from 'lucide-react'

export function DashboardPage() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const [, setLoading] = useState(true)
  const [churchInfo, setChurchInfo] = useState<ChurchInfo | null>(null)
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [attendanceCount, setAttendanceCount] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return
      try {
        const [info, anns, evts, att] = await Promise.all([
          churchInfoService.get(),
          announcementService.getPublished(3),
          eventService.getUpcoming(),
          attendanceService.getUserAttendance(user.id)
        ])
        setChurchInfo(info)
        setAnnouncements(anns)
        setEvents(evts.slice(0, 3))
        setAttendanceCount(att.length)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [user])

  if (!user) return null

  const isAdmin = user.role === 'admin'
  const status = user.membershipStatus || 'visitor'
  const isVisitor = status === 'visitor'
  const isNewConvert = status === 'new_convert'
  const isWorker = status === 'worker'

  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' },
    }),
  }

  // Tailored Welcome Message
  let welcomeMessage = ''
  if (isVisitor) welcomeMessage = "We're so glad you're here! Explore our community and see what's happening."
  else if (isNewConvert) welcomeMessage = "Welcome to the family! We've prepared special resources to help you grow in your faith journey."
  else if (isWorker) welcomeMessage = "Thank you for your service to the ministry. Stay updated with your departmental news."
  else welcomeMessage = "Stay connected, grow in the Word, and never miss an update from the fellowship."

  return (
    <AppLayout>
      <div className="min-h-screen bg-background pb-20">
        
        {/* ───── Cinematic Welcome Header ───── */}
        <section className="relative pt-12 pb-24 overflow-hidden rounded-b-[3rem] mb-12">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-primary to-slate-900" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/20 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />
          <div className="absolute inset-0 bg-black/20" />

          <div className="relative z-10 container mx-auto px-6">
            <motion.div initial="hidden" animate="visible" className="max-w-3xl">
              <motion.p custom={0} variants={fadeUp} className="text-white/70 font-medium tracking-widest uppercase text-sm mb-3">
                {format(new Date(), 'EEEE, MMMM do, yyyy')}
              </motion.p>
              <motion.h1 custom={1} variants={fadeUp} className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4 flex items-center gap-3">
                Welcome back, {user.fullName.split(' ')[0]} 
                {isNewConvert && <Sparkles className="w-8 h-8 text-yellow-400" />}
                {isWorker && <Briefcase className="w-8 h-8 text-amber-400" />}
                {(!isNewConvert && !isWorker) && '👋'}
              </motion.h1>
              <motion.p custom={2} variants={fadeUp} className="text-lg text-white/80 leading-relaxed max-w-xl">
                {welcomeMessage}
              </motion.p>
              
              <motion.div custom={2.5} variants={fadeUp} className="mt-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white border border-white/20 text-sm font-medium capitalize">
                  {status.replace('_', ' ')}
                </span>
              </motion.div>
            </motion.div>
          </div>
        </section>

        <main className="container mx-auto px-6 -mt-20 relative z-20">
          
          <div className="grid lg:grid-cols-3 gap-8">
            
            {/* Left Column: Quick Actions & Scripture */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Scripture of the Day (Hidden for mere visitors to encourage joining) */}
              {churchInfo?.todayScripture && !isVisitor && (
                <motion.div custom={3} initial="hidden" animate="visible" variants={fadeUp} className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-500"></div>
                  <div className="relative bg-card border border-border/50 rounded-3xl p-8 shadow-xl">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <h3 className="font-bold text-lg">Word for the Day</h3>
                    </div>
                    <blockquote className="text-2xl font-medium text-foreground leading-snug mb-4 italic">
                      &quot;{churchInfo.todayScripture}&quot;
                    </blockquote>
                  </div>
                </motion.div>
              )}

              {/* Special Sections Based on Status */}
              {isVisitor && (
                <motion.div custom={3.5} initial="hidden" animate="visible" variants={fadeUp} className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl p-8 shadow-xl text-white">
                  <h3 className="text-2xl font-bold mb-2">Connect With Us</h3>
                  <p className="text-white/90 mb-6 max-w-md">We would love to know you better. Fill out our first-timer form and let us officially welcome you to the family!</p>
                  <button className="px-6 py-3 bg-white text-amber-600 font-bold rounded-xl hover:bg-white/90 transition-colors shadow-lg">
                    I&apos;m a First Timer
                  </button>
                </motion.div>
              )}

              {isNewConvert && (
                <motion.div custom={3.5} initial="hidden" animate="visible" variants={fadeUp} className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-8 shadow-xl text-white flex flex-col md:flex-row gap-6 items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold mb-2 flex items-center gap-2"><BookMarked className="w-6 h-6" /> Foundation School</h3>
                    <p className="text-white/90 max-w-md">Start your spiritual journey on the right foot. Access the foundation school materials tailored for you.</p>
                  </div>
                  <button className="px-6 py-3 bg-white text-emerald-600 font-bold rounded-xl hover:bg-white/90 transition-colors shadow-lg whitespace-nowrap">
                    Start Learning
                  </button>
                </motion.div>
              )}

              {isWorker && (
                <motion.div custom={3.5} initial="hidden" animate="visible" variants={fadeUp} className="bg-card border-l-4 border-l-amber-500 rounded-3xl p-6 shadow-xl flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Workers Meeting</h3>
                      <p className="text-sm text-muted-foreground">Don&apos;t forget the mandatory workers meeting this Sunday at 7:30 AM.</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Navigation Grid */}
              <motion.div custom={4} initial="hidden" animate="visible" variants={fadeUp} className="grid sm:grid-cols-2 gap-4">
                <button onClick={() => router.push('/announcements')} className="group flex flex-col items-start bg-card border border-border/50 rounded-3xl p-6 hover:shadow-xl hover:border-primary/30 transition-all duration-300">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 mb-4 group-hover:scale-110 transition-transform">
                    <Bell className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-lg mb-1">Announcements</h3>
                  <p className="text-sm text-muted-foreground text-left">Stay updated with church news</p>
                </button>

                <button onClick={() => router.push('/events')} className="group flex flex-col items-start bg-card border border-border/50 rounded-3xl p-6 hover:shadow-xl hover:border-primary/30 transition-all duration-300">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-500 mb-4 group-hover:scale-110 transition-transform">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-lg mb-1">Events & Calendar</h3>
                  <p className="text-sm text-muted-foreground text-left">Never miss a fellowship</p>
                </button>

                {!isVisitor && (
                  <>
                    <button onClick={() => router.push('/attendance')} className="group flex flex-col items-start bg-card border border-border/50 rounded-3xl p-6 hover:shadow-xl hover:border-primary/30 transition-all duration-300">
                      <div className="w-12 h-12 rounded-2xl bg-teal-500/10 flex items-center justify-center text-teal-500 mb-4 group-hover:scale-110 transition-transform">
                        <CheckCircle className="w-6 h-6" />
                      </div>
                      <h3 className="font-bold text-lg mb-1">Mark Attendance</h3>
                      <p className="text-sm text-muted-foreground text-left">Scan QR or enter code</p>
                    </button>

                    <button onClick={() => router.push('/profile')} className="group flex flex-col items-start bg-card border border-border/50 rounded-3xl p-6 hover:shadow-xl hover:border-primary/30 transition-all duration-300">
                      <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center text-violet-500 mb-4 group-hover:scale-110 transition-transform">
                        <User className="w-6 h-6" />
                      </div>
                      <h3 className="font-bold text-lg mb-1">My Profile</h3>
                      <p className="text-sm text-muted-foreground text-left">Manage your information</p>
                    </button>
                  </>
                )}
              </motion.div>

              {isAdmin && (
                <motion.div custom={5} initial="hidden" animate="visible" variants={fadeUp}>
                  <button onClick={() => router.push('/admin')} className="w-full group flex items-center justify-between bg-destructive/5 border border-destructive/20 rounded-3xl p-6 hover:bg-destructive/10 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center text-destructive">
                        <Settings className="w-6 h-6" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-bold text-lg text-destructive">Admin Dashboard</h3>
                        <p className="text-sm text-destructive/70">Manage users, events, and church settings</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-destructive group-hover:translate-x-1 transition-transform" />
                  </button>
                </motion.div>
              )}
            </div>

            {/* Right Column: Reminders & Stats */}
            <div className="space-y-6">
              
              {!isVisitor && (
                <motion.div custom={4} initial="hidden" animate="visible" variants={fadeUp} className="bg-card border border-border/50 rounded-3xl p-6 shadow-xl">
                  <h3 className="font-bold text-lg flex items-center gap-2 mb-6">
                    <Heart className="w-5 h-5 text-rose-500" /> My Engagement
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-muted/30 rounded-2xl p-4 text-center">
                      <p className="text-3xl font-extrabold text-primary mb-1">{attendanceCount}</p>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Attended</p>
                    </div>
                    <div className="bg-muted/30 rounded-2xl p-4 text-center">
                      <p className="text-3xl font-extrabold text-secondary mb-1">{events.length}</p>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Upcoming</p>
                    </div>
                  </div>
                </motion.div>
              )}

              <motion.div custom={5} initial="hidden" animate="visible" variants={fadeUp} className="bg-card border border-border/50 rounded-3xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-500" /> Upcoming Events
                  </h3>
                  <button onClick={() => router.push('/events')} className="text-sm font-medium text-primary hover:underline">View All</button>
                </div>
                
                {events.length > 0 ? (
                  <div className="space-y-4">
                    {events.map(event => (
                      <div key={event.id} className="flex gap-4 p-3 rounded-2xl hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => router.push(`/events/${event.id}`)}>
                        <div className="w-12 h-12 shrink-0 rounded-xl bg-primary/10 flex flex-col items-center justify-center text-primary">
                          <span className="text-xs font-bold uppercase">{format(new Date(event.date), 'MMM')}</span>
                          <span className="text-lg font-extrabold leading-none">{format(new Date(event.date), 'd')}</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-sm line-clamp-1">{event.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {event.time}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">No upcoming events right now.</p>
                  </div>
                )}
              </motion.div>

              <motion.div custom={6} initial="hidden" animate="visible" variants={fadeUp} className="bg-gradient-to-br from-primary to-secondary rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-xl -mr-10 -mt-10"></div>
                <h3 className="font-bold text-lg mb-2 relative z-10">Stay Informed</h3>
                <p className="text-sm text-white/80 mb-4 relative z-10">You have {announcements.length} new announcements from the leadership.</p>
                <button onClick={() => router.push('/announcements')} className="w-full py-2.5 bg-white text-gray-900 font-bold rounded-xl text-sm hover:bg-white/90 transition-colors relative z-10">
                  Read Announcements
                </button>
              </motion.div>

            </div>
          </div>
        </main>
      </div>
    </AppLayout>
  )
}
