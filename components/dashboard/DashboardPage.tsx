'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'

import { announcementService } from '@/services/database/announcementService'
import { eventService } from '@/services/database/eventService'
import type { Announcement, Event, ChurchInfo } from '@/types'
import { attendanceService } from '@/services/database/attendanceService'
import { churchInfoService } from '@/services/database/churchInfoService'
import { AppLayout } from '@/components/shared/AppLayout'
import { motion } from 'framer-motion'
import { Calendar, User, Settings } from 'lucide-react'

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
          announcementService.getPublished(5),
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
  const isVisitor = user.membershipStatus === 'visitor'

  return (
    <AppLayout>
      <main className="container mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          
          {/* Welcome Section */}
          <section className="bg-gradient-to-r from-primary to-secondary rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl"></div>
            <h2 className="text-3xl font-bold mb-2 relative z-10">Welcome, {user.fullName}! 👋</h2>
            {churchInfo?.todayScripture && !isVisitor && (
              <p className="opacity-90 italic mb-4">&quot;{churchInfo.todayScripture}&quot;</p>
            )}
            <p className="opacity-90">
              {isVisitor ? 'Explore our church and join the community' : `You are logged in as ${user.membershipStatus}`}
            </p>
          </section>

          {/* Quick Stats */}
          {!isVisitor && (
            <section className="grid md:grid-cols-3 gap-6">
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider">Events Attended</h3>
                <p className="text-4xl font-extrabold text-gradient">{attendanceCount}</p>
              </div>
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider">Upcoming Events</h3>
                <p className="text-4xl font-extrabold text-gradient">{events.length}</p>
              </div>
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider">Announcements</h3>
                <p className="text-4xl font-extrabold text-gradient">{announcements.length}</p>
              </div>
            </section>
          )}

          {/* Navigation Cards */}
          <section className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <button onClick={() => router.push('/announcements')} className="group glass-card rounded-2xl p-6 text-left hover:-translate-y-1 transition-transform">
              <div className="text-3xl mb-3">📢</div>
              <h3 className="font-bold text-lg">Announcements</h3>
            </button>
            <button onClick={() => router.push('/events')} className="group glass-card rounded-2xl p-6 text-left hover:-translate-y-1 transition-transform">
              <Calendar className="w-8 h-8 mb-3 text-primary" />
              <h3 className="font-bold text-lg">Events</h3>
            </button>
            {!isVisitor && (
              <>
                <button onClick={() => router.push('/attendance')} className="group glass-card rounded-2xl p-6 text-left hover:-translate-y-1 transition-transform">
                  <div className="text-3xl mb-3 text-secondary">✓</div>
                  <h3 className="font-bold text-lg">Attendance</h3>
                </button>
                <button onClick={() => router.push('/profile')} className="group glass-card rounded-2xl p-6 text-left hover:-translate-y-1 transition-transform">
                  <User className="w-8 h-8 mb-3 text-primary" />
                  <h3 className="font-bold text-lg">Profile</h3>
                </button>
              </>
            )}
            {isAdmin && (
              <button onClick={() => router.push('/admin')} className="group glass-card rounded-2xl p-6 text-left hover:-translate-y-1 transition-transform col-span-full md:col-span-2 lg:col-span-4 border-destructive/30">
                <Settings className="w-8 h-8 mb-3 text-destructive" />
                <h3 className="font-bold text-lg text-destructive">Admin Panel</h3>
              </button>
            )}
          </section>

        </motion.div>
      </main>
    </AppLayout>
  )
}
