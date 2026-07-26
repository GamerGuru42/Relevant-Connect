'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { format } from 'date-fns'

import { announcementService } from '@/services/database/announcementService'
import { eventService } from '@/services/database/eventService'
import type { Announcement, Event } from '@/types'

import { Bell, Calendar as CalendarIcon, Clock, MapPin, ArrowRight, BookOpen, MessageSquare, CheckCircle, ChevronRight, User, Settings, Users, Briefcase, BookMarked, Sparkles, Heart } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'

interface VerseOfTheDay {
  text: string;
  reference: string;
}

export function DashboardPage() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)

  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([])
  const [verseOfDay, setVerseOfDay] = useState<VerseOfTheDay | null>(null)
  const [loading, setLoading] = useState(true)

  const isVisitor = user?.membershipStatus === 'visitor'
  const isNewConvert = user?.membershipStatus === 'new_convert'
  const isMember = user?.membershipStatus === 'member'
  const isWorker = user?.membershipStatus === 'worker'

  const fetchDashboardData = useCallback(async () => {
    try {
      // 1. Fetch announcements
      let categories = ['general']
      if (isVisitor) categories.push('visitor')
      if (isNewConvert) categories.push('new_convert')
      if (isMember) categories.push('member')
      if (isWorker) categories.push('worker', 'cell_ministry')

      const [recentAnnouncements, futureEvents] = await Promise.all([
        announcementService.getRecent(categories, 3),
        eventService.getUpcoming(3)
      ])

      setAnnouncements(recentAnnouncements)
      setUpcomingEvents(futureEvents)

      // 2. Fetch Verse of the Day (Deterministic based on date)
      const today = new Date().toISOString().split('T')[0]
      const cachedVerse = localStorage.getItem(`verseOfDay-${today}`)
      
      if (cachedVerse) {
        setVerseOfDay(JSON.parse(cachedVerse))
      } else {
        // Simple fallback verses if API fails, selected deterministically by day of year
        const fallbackVerses = [
          { reference: 'John 3:16', text: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.' },
          { reference: 'Philippians 4:13', text: 'I can do all things through Christ which strengtheneth me.' },
          { reference: 'Proverbs 3:5-6', text: 'Trust in the LORD with all thine heart; and lean not unto thine own understanding. In all thy ways acknowledge him, and he shall direct thy paths.' },
          { reference: 'Jeremiah 29:11', text: 'For I know the thoughts that I think toward you, saith the LORD, thoughts of peace, and not of evil, to give you an expected end.' },
          { reference: 'Romans 8:28', text: 'And we know that all things work together for good to them that love God, to them who are the called according to his purpose.' }
        ]
        
        try {
          // Use OurManna API for verse of the day
          const res = await fetch('https://beta.ourmanna.com/api/v1/get?format=json&order=daily')
          if (res.ok) {
            const data = await res.json()
            const verseData = {
              text: data.verse.details.text,
              reference: data.verse.details.reference
            }
            setVerseOfDay(verseData)
            localStorage.setItem(`verseOfDay-${today}`, JSON.stringify(verseData))
          } else {
            throw new Error('API failed')
          }
        } catch (e) {
          // Use deterministic fallback
          const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24)
          const fallback = fallbackVerses[dayOfYear % fallbackVerses.length]
          setVerseOfDay(fallback)
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }, [isVisitor, isNewConvert, isMember, isWorker])

  useEffect(() => {
    if (user) {
      fetchDashboardData()
    }
  }, [user, fetchDashboardData])

  if (!user) return null

  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <div className="min-h-screen bg-background/50 pb-24 md:pb-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-b border-border/40 pb-8 pt-8">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div 
            initial="hidden" 
            animate="visible" 
            variants={{
              visible: { transition: { staggerChildren: 0.1 } }
            }}
            className="flex flex-col md:flex-row md:items-center justify-between gap-6"
          >
            <motion.div variants={fadeUp} className="space-y-2">
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                Welcome back, {user.fullName.split(' ')[0]}
              </h1>
              <p className="text-muted-foreground text-lg flex items-center gap-2">
                {format(new Date(), 'EEEE, MMMM do')}
                <span className="w-1.5 h-1.5 rounded-full bg-primary/50"></span>
                <span className="capitalize">{user.membershipStatus.replace('_', ' ')}</span>
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Quick Actions (Contextual based on status) */}
            <motion.div 
              initial="hidden" animate="visible" variants={fadeUp}
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
            >
              <Link href="/announcements" className="flex flex-col items-center justify-center p-6 bg-card border border-border hover:border-primary/50 rounded-2xl shadow-sm hover:shadow-md transition-all group">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Bell className="w-6 h-6" />
                </div>
                <span className="font-semibold text-sm">News</span>
              </Link>
              
              <Link href="/events" className="flex flex-col items-center justify-center p-6 bg-card border border-border hover:border-primary/50 rounded-2xl shadow-sm hover:shadow-md transition-all group">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <CalendarIcon className="w-6 h-6" />
                </div>
                <span className="font-semibold text-sm">Events</span>
              </Link>
              
              {!isVisitor && (
                <Link href="/attendance" className="flex flex-col items-center justify-center p-6 bg-card border border-border hover:border-primary/50 rounded-2xl shadow-sm hover:shadow-md transition-all group">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <span className="font-semibold text-sm">Mark Attendance</span>
                </Link>
              )}
            </motion.div>

            {/* Role-Specific Sections */}
            <motion.div initial="hidden" animate="visible" variants={fadeUp} className="space-y-6">
              
              {/* VISITOR Section */}
              {isVisitor && (
                <motion.div variants={fadeUp} className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl p-8 shadow-xl text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-10">
                    <MessageSquare className="w-32 h-32" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2 relative z-10">We are so glad you are here!</h3>
                  <p className="text-amber-50 mb-6 max-w-md relative z-10">
                    Thank you for connecting with us. We would love to get to know you better and help you find your place in our church family.
                  </p>
                  <button className="bg-white text-orange-600 px-6 py-2.5 rounded-full font-bold text-sm hover:bg-amber-50 transition-colors relative z-10">
                    Connect With Us
                  </button>
                </motion.div>
              )}

              {/* NEW CONVERT Section */}
              {isNewConvert && (
                <motion.div variants={fadeUp} className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-8 shadow-xl text-white relative overflow-hidden">
                  <h3 className="text-2xl font-bold mb-2">Welcome to the Family!</h3>
                  <p className="text-emerald-50 mb-6 max-w-md">
                    Congratulations on making the best decision of your life. Start your journey with our Foundation School classes.
                  </p>
                  <button className="bg-white text-teal-700 px-6 py-2.5 rounded-full font-bold text-sm hover:bg-emerald-50 transition-colors">
                    Start Foundation School
                  </button>
                </motion.div>
              )}

              {/* MEMBER Section */}
              {isMember && (
                <motion.div variants={fadeUp} className="bg-card border-l-4 border-l-primary rounded-3xl p-6 shadow-xl flex items-center justify-between">
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
                </motion.div>
              )}

              {/* WORKER Section */}
              {isWorker && (
                <motion.div variants={fadeUp} className="bg-card border-l-4 border-l-amber-500 rounded-3xl p-6 shadow-xl flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-500">
                      <Bell className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">Worker&apos;s Meeting</h4>
                      <p className="text-sm text-muted-foreground">Next meeting: Saturday, 8:00 AM</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </motion.div>
              )}

            </motion.div>

            {/* Upcoming Events List */}
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
  )
}
