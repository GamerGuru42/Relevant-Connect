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
          <section className="bg-gradient-to-r from-primary to-secondary rounded-lg p-8 text-primary-foreground">
            <h2 className="text-3xl font-bold mb-2">Welcome, {user.fullName}! 👋</h2>
            {churchInfo?.todayScripture && !isVisitor && (
              <p className="opacity-90 italic mb-4">&quot;{churchInfo.todayScripture}&quot;</p>
            )}
            <p className="opacity-90">
              {isVisitor ? 'Explore our church and join the community' : `You are logged in as ${user.membershipStatus}`}
            </p>
          </section>

          {/* Quick Stats */}
          {!isVisitor && (
            <section className="grid md:grid-cols-3 gap-4">
              <div className="bg-card border border-border rounded-lg p-6 shadow-soft">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Events Attended</h3>
                <p className="text-3xl font-bold">{attendanceCount}</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-6 shadow-soft">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Upcoming Events</h3>
                <p className="text-3xl font-bold">{events.length}</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-6 shadow-soft">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Announcements</h3>
                <p className="text-3xl font-bold">{announcements.length}</p>
              </div>
            </section>
          )}

          {/* Navigation Cards */}
          <section className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button onClick={() => router.push('/announcements')} className="group bg-card border border-border rounded-lg p-6 hover:border-primary transition-colors text-left shadow-soft">
              <div className="text-2xl mb-2">📢</div>
              <h3 className="font-bold">Announcements</h3>
            </button>
            <button onClick={() => router.push('/events')} className="group bg-card border border-border rounded-lg p-6 hover:border-primary transition-colors text-left shadow-soft">
              <Calendar className="w-6 h-6 mb-2" />
              <h3 className="font-bold">Events</h3>
            </button>
            {!isVisitor && (
              <>
                <button onClick={() => router.push('/attendance')} className="group bg-card border border-border rounded-lg p-6 hover:border-primary transition-colors text-left shadow-soft">
                  <div className="text-2xl mb-2">✓</div>
                  <h3 className="font-bold">Attendance</h3>
                </button>
                <button onClick={() => router.push('/profile')} className="group bg-card border border-border rounded-lg p-6 hover:border-primary transition-colors text-left shadow-soft">
                  <User className="w-6 h-6 mb-2" />
                  <h3 className="font-bold">Profile</h3>
                </button>
              </>
            )}
            {isAdmin && (
              <button onClick={() => router.push('/admin')} className="group bg-card border border-border rounded-lg p-6 hover:border-destructive transition-colors text-left shadow-soft col-span-full md:col-span-2 lg:col-span-4">
                <Settings className="w-6 h-6 mb-2 text-destructive" />
                <h3 className="font-bold text-destructive">Admin Panel</h3>
              </button>
            )}
          </section>

        </motion.div>
      </main>
    </AppLayout>
  )
}
