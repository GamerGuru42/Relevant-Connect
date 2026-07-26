'use client'

import { useState, useEffect } from 'react'
import { AppLayout } from '@/components/shared/AppLayout'
import { meetingService } from '@/services/database/meetingService'
import type { Meeting } from '@/types'
import { format } from 'date-fns'
import { Video, Calendar, Clock, User, Share2, Plus, ExternalLink } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import Link from 'next/link'

export function MeetingsPage() {
  const user = useAuthStore((state) => state.user)
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        const upcoming = await meetingService.getUpcoming()
        setMeetings(upcoming)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    fetchMeetings()
  }, [])

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

  const isAdminOrWorker = user?.role === 'admin' || user?.membershipStatus === 'worker'

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                <Video className="w-6 h-6" />
              </div>
              Virtual Meetings
            </h1>
            <p className="text-muted-foreground mt-2">Join online fellowships and meetings</p>
          </div>
          
          {isAdminOrWorker && (
             <button className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors">
               <Plus className="w-5 h-5" /> Schedule Meeting
             </button>
          )}
        </div>

        <div className="grid gap-6">
          {loading ? (
             Array(3).fill(0).map((_, i) => (
               <div key={i} className="h-40 bg-card rounded-3xl animate-pulse border border-border"></div>
             ))
          ) : meetings.length > 0 ? (
            meetings.map(meeting => (
              <div key={meeting.id} className="bg-card border border-border rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row gap-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors"></div>
                
                <div className="flex-1 min-w-0 z-10">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-wide">
                      {meeting.platform.replace('_', ' ')}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold mb-2 truncate">{meeting.title}</h2>
                  {meeting.description && (
                    <p className="text-muted-foreground mb-4 line-clamp-2">{meeting.description}</p>
                  )}
                  
                  <div className="flex flex-wrap gap-y-3 gap-x-6 text-sm font-medium">
                    <div className="flex items-center text-foreground">
                      <Calendar className="w-4 h-4 mr-2 text-primary" />
                      {format(new Date(meeting.date), 'EEEE, MMM do, yyyy')}
                    </div>
                    <div className="flex items-center text-foreground">
                      <Clock className="w-4 h-4 mr-2 text-primary" />
                      {meeting.time} ({meeting.durationMinutes} mins)
                    </div>
                    <div className="flex items-center text-foreground">
                      <User className="w-4 h-4 mr-2 text-primary" />
                      Host: {meeting.hostName}
                    </div>
                  </div>
                </div>

                <div className="flex flex-row md:flex-col items-center justify-end gap-3 z-10 border-t border-border md:border-t-0 md:border-l md:pl-6 pt-4 md:pt-0 shrink-0">
                  <a 
                    href={meeting.meetingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors w-full"
                  >
                    Join Now <ExternalLink className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => handleShare(meeting)}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-secondary text-secondary-foreground font-bold rounded-xl hover:bg-secondary/80 transition-colors w-full md:w-auto"
                  >
                    <Share2 className="w-4 h-4" /> Share Link
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20 bg-card border border-border rounded-3xl">
              <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Video className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-2">No Upcoming Meetings</h3>
              <p className="text-muted-foreground">There are no virtual meetings scheduled at the moment.</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
