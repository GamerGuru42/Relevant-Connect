'use client'

import { useState, useEffect, useCallback } from 'react'
import { AppLayout } from '@/components/shared/AppLayout'
import { meetingService } from '@/services/database/meetingService'
import type { Meeting } from '@/types'
import { format, differenceInMinutes } from 'date-fns'
import { Video, Calendar, Clock, User, Share2, Plus, ExternalLink } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useRoleAccess } from '@/hooks/useRoleAccess'
import Link from 'next/link'

export function MeetingsPage() {
  const user = useAuthStore((state) => state.user)
  const { isSuperAdmin, isDepartmentHead } = useRoleAccess()
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)

  const fetchMeetings = useCallback(async () => {
    if (!user) return
    try {
      const fetched = await meetingService.getScopedMeetings(user.department, user.appRole)
      setMeetings(fetched)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchMeetings()
    // Poll every 30 seconds to update is_active state if changed
    const interval = setInterval(fetchMeetings, 30000)
    return () => clearInterval(interval)
  }, [fetchMeetings])

  const handleShare = async (meeting: Meeting) => {
    const url = `${window.location.origin}/meetings/${meeting.id}`
    const shareData = {
      title: `Relevant+ | ${meeting.title}`,
      text: `Join ${meeting.hostName} for ${meeting.title} on ${format(new Date(meeting.date), 'MMM do')} at ${meeting.time}`,
      url: url,
    }

    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData)
      } else {
        await navigator.clipboard.writeText(url)
        alert('Link copied to clipboard!')
      }
    } catch (err) {
      console.error('Error sharing:', err)
    }
  }

  const isAdminOrHead = isSuperAdmin || isDepartmentHead

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold flex items-center gap-3 text-white">
              <div className="w-12 h-12 bg-accent/20 text-accent rounded-2xl flex items-center justify-center">
                <Video className="w-6 h-6" />
              </div>
              Virtual Meetings
            </h1>
            <p className="text-gray-400 mt-2">Join online fellowships and meetings</p>
          </div>
          
          {isAdminOrHead && (
             <Link href="/admin/meetings" className="flex items-center gap-2 px-5 py-2.5 bg-accent text-white font-semibold rounded-xl hover:bg-accent/90 transition-colors">
               <Plus className="w-5 h-5" /> Manage Meetings
             </Link>
          )}
        </div>

        <div className="grid gap-6">
          {loading ? (
             Array(3).fill(0).map((_, i) => (
               <div key={i} className="h-40 bg-white/5 rounded-3xl animate-pulse border border-white/10"></div>
             ))
          ) : meetings.length > 0 ? (
            meetings.map(meeting => {
              const meetingDateTime = new Date(`${meeting.date}T${meeting.time}`)
              const minsToStart = differenceInMinutes(meetingDateTime, new Date())
              const isHost = user?.id === meeting.hostId || isSuperAdmin
              const canJoin = meeting.isActive || (isHost && minsToStart <= 15)
              
              // Hide past meetings that aren't active
              if (minsToStart < -120 && !meeting.isActive) return null

              return (
                <div key={meeting.id} className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row gap-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-accent/20 transition-colors"></div>
                  
                  <div className="flex-1 min-w-0 z-10">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-3 py-1 bg-white/10 text-gray-300 rounded-full text-xs font-bold uppercase tracking-wide">
                        {meeting.platform === 'jitsi' ? 'Jitsi Meet' : meeting.platform.replace('_', ' ')}
                      </span>
                      {meeting.isActive && (
                        <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 animate-pulse">
                          <span className="w-2 h-2 rounded-full bg-green-500"></span> Live Now
                        </span>
                      )}
                    </div>
                    <h2 className="text-2xl font-bold mb-2 truncate text-white">{meeting.title}</h2>
                    {meeting.description && (
                      <p className="text-gray-400 mb-4 line-clamp-2">{meeting.description}</p>
                    )}
                    
                    <div className="flex flex-wrap gap-y-3 gap-x-6 text-sm font-medium">
                      <div className="flex items-center text-gray-300">
                        <Calendar className="w-4 h-4 mr-2 text-accent" />
                        {format(new Date(meeting.date), 'EEEE, MMM do, yyyy')}
                      </div>
                      <div className="flex items-center text-gray-300">
                        <Clock className="w-4 h-4 mr-2 text-accent" />
                        {meeting.time} ({meeting.durationMinutes} mins)
                      </div>
                      <div className="flex items-center text-gray-300">
                        <User className="w-4 h-4 mr-2 text-accent" />
                        Host: {meeting.hostName}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-row md:flex-col items-center justify-end gap-3 z-10 border-t border-white/10 md:border-t-0 md:border-l md:pl-6 pt-4 md:pt-0 shrink-0">
                    {canJoin ? (
                      <Link 
                        href={`/meetings/${meeting.id}`}
                        className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 font-bold rounded-xl transition-colors w-full ${meeting.isActive ? 'bg-green-600 hover:bg-green-700 text-white animate-pulse' : 'bg-accent text-white hover:bg-accent/90'}`}
                      >
                        {isHost && !meeting.isActive ? 'Start Meeting' : 'Join Now'} <ExternalLink className="w-4 h-4" />
                      </Link>
                    ) : (
                       <button 
                        disabled
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 font-bold rounded-xl transition-colors w-full bg-white/5 text-gray-500 cursor-not-allowed"
                      >
                        Starts in {minsToStart}m
                      </button>
                    )}
                    <button
                      onClick={() => handleShare(meeting)}
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-white/5 text-gray-300 font-bold rounded-xl hover:bg-white/10 transition-colors w-full md:w-auto"
                    >
                      <Share2 className="w-4 h-4" /> Share Link
                    </button>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="text-center py-20 bg-white/5 border border-white/10 rounded-3xl">
              <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Video className="w-8 h-8 text-gray-500" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-white">No Upcoming Meetings</h3>
              <p className="text-gray-400">There are no virtual meetings scheduled at the moment.</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
