'use client'

import { useState, useEffect, useCallback } from 'react'
import { meetingService } from '@/services/database/meetingService'
import type { Meeting } from '@/types'
import { format, differenceInMinutes } from 'date-fns'
import { Video, Calendar, Clock, ExternalLink } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useRoleAccess } from '@/hooks/useRoleAccess'
import Link from 'next/link'
import { EmptyState } from '@/components/shared/EmptyState'

export function UpcomingMeetingsList() {
  const user = useAuthStore((state) => state.user)
  const { isSuperAdmin } = useRoleAccess()
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)

  const fetchMeetings = useCallback(async () => {
    if (!user) return
    try {
      const fetched = await meetingService.getScopedMeetings(user.department, user.appRole)
      // Sort to prioritize department meetings if they exist (for workers/heads)
      const sorted = fetched.sort((a, b) => {
        if (a.department === user.department && b.department !== user.department) return -1
        if (b.department === user.department && a.department !== user.department) return 1
        return 0
      })
      
      // Filter out past inactive meetings, keep only upcoming 3
      const valid = sorted.filter(m => {
        const meetingDateTime = new Date(`${m.date}T${m.time}`)
        const minsToStart = differenceInMinutes(meetingDateTime, new Date())
        return m.isActive || minsToStart >= -120 
      }).slice(0, 3)
      
      setMeetings(valid)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchMeetings()
  }, [fetchMeetings])

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-24 bg-white/5 animate-pulse rounded-2xl border border-white/10" />
        ))}
      </div>
    )
  }

  if (meetings.length === 0) {
    return (
      <EmptyState 
        icon={Video}
        title="No upcoming meetings"
        description="Tap 'New Meeting' above to schedule one"
      />
    )
  }

  return (
    <div className="grid gap-4">
      {meetings.map(meeting => {
        const meetingDateTime = new Date(`${meeting.date}T${meeting.time}`)
        const minsToStart = differenceInMinutes(meetingDateTime, new Date())
        const isHost = user?.id === meeting.hostId || isSuperAdmin
        const canJoin = meeting.isActive || (isHost && minsToStart <= 15)

        return (
          <div key={meeting.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between group hover:bg-white/10 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center text-accent shrink-0">
                <Video className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-white font-medium flex items-center gap-2">
                  {meeting.title}
                  {meeting.isActive && (
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" title="Live Now"></span>
                  )}
                </h4>
                <div className="flex items-center gap-3 text-sm text-gray-400 mt-1">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {format(new Date(meeting.date), 'MMM d')}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {meeting.time}</span>
                </div>
              </div>
            </div>
            
            {canJoin ? (
              <Link 
                href={`/meetings/${meeting.id}`}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-colors shrink-0 ${meeting.isActive ? 'bg-green-600 hover:bg-green-700 text-white animate-pulse' : 'bg-white/10 hover:bg-white/20 text-white'}`}
              >
                {isHost && !meeting.isActive ? 'Start' : 'Join'} <ExternalLink className="w-3 h-3" />
              </Link>
            ) : (
              <span className="text-sm text-gray-500 shrink-0">In {minsToStart}m</span>
            )}
          </div>
        )
      })}
    </div>
  )
}
