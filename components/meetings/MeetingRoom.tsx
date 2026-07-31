'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { meetingService } from '@/services/database/meetingService'
import { useAuthStore } from '@/store/authStore'
import { useRoleAccess } from '@/hooks/useRoleAccess'
import type { Meeting } from '@/types'
import { Video, ArrowLeft, Play, Square, Clock } from 'lucide-react'
import Link from 'next/link'

export function MeetingRoom({ meetingId }: { meetingId: string }) {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const { isSuperAdmin } = useRoleAccess()
  const [meeting, setMeeting] = useState<Meeting | null>(null)
  const [loading, setLoading] = useState(true)
  const [remainingTime, setRemainingTime] = useState<string | null>(null)

  useEffect(() => {
    const fetchMeeting = async () => {
      try {
        const data = await meetingService.getById(meetingId)
        setMeeting(data)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    fetchMeeting()

    const interval = setInterval(fetchMeeting, 5000) // Poll for meeting state (timer, active)
    return () => clearInterval(interval)
  }, [meetingId])

  useEffect(() => {
    if (!meeting?.timerEndAt) {
      setRemainingTime(null)
      return
    }

    const updateTimer = () => {
      const now = new Date().getTime()
      const end = new Date(meeting.timerEndAt!).getTime()
      const diff = end - now

      if (diff <= 0) {
        setRemainingTime('00:00')
        return
      }

      const minutes = Math.floor(diff / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)
      setRemainingTime(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
    }

    updateTimer()
    const timerInterval = setInterval(updateTimer, 1000)
    return () => clearInterval(timerInterval)
  }, [meeting?.timerEndAt])

  if (loading) {
    return <div className="h-screen bg-black flex items-center justify-center text-white">Loading...</div>
  }

  if (!meeting || !user) {
    return <div className="h-screen bg-black flex items-center justify-center text-white">Meeting not found or access denied.</div>
  }

  const isHost = user.id === meeting.hostId || isSuperAdmin
  const showControls = isHost

  const handleStart = async () => {
    try {
      await meetingService.startMeeting(meeting.id)
    } catch (err) {
      console.error(err)
    }
  }

  const handleEnd = async () => {
    try {
      await meetingService.endMeeting(meeting.id)
      router.push('/meetings')
    } catch (err) {
      console.error(err)
    }
  }

  const handleTimerAction = async (minutes: number) => {
    try {
      const endAt = new Date()
      endAt.setMinutes(endAt.getMinutes() + minutes)
      await meetingService.updateTimer(meeting.id, endAt)
    } catch (err) {
      console.error(err)
    }
  }

  const handleClearTimer = async () => {
    try {
      await meetingService.updateTimer(meeting.id, null)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="h-screen w-full bg-[#0a0a0a] flex flex-col font-sans relative overflow-hidden">
      {/* Top Bar */}
      <div className="h-16 shrink-0 bg-white/5 border-b border-white/10 flex items-center justify-between px-6 backdrop-blur-md relative z-20">
        <div className="flex items-center gap-4">
          <Link href="/meetings" className="p-2 -ml-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-white font-medium text-sm leading-tight">{meeting.title}</h1>
              <p className="text-gray-400 text-xs">Host: {meeting.hostName}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {remainingTime && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg border border-red-500/30">
              <Clock className="w-4 h-4 animate-pulse" />
              <span className="font-mono font-bold">{remainingTime}</span>
            </div>
          )}

          {showControls && (
            <div className="flex items-center gap-2 pl-4 border-l border-white/10">
              {!meeting.isActive ? (
                <button
                  onClick={handleStart}
                  className="flex items-center gap-2 px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <Play className="w-4 h-4" /> Start
                </button>
              ) : (
                <button
                  onClick={handleEnd}
                  className="flex items-center gap-2 px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <Square className="w-4 h-4" /> End
                </button>
              )}
              
              {meeting.isActive && (
                <div className="flex items-center gap-2 ml-2">
                  <button onClick={() => handleTimerAction(5)} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-lg transition-colors">+5m Timer</button>
                  <button onClick={handleClearTimer} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-lg transition-colors">Clear Timer</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Jitsi Iframe Container */}
      <div className="flex-1 w-full bg-black relative z-10">
        <iframe
          src={meeting.meetingUrl}
          allow="camera; microphone; fullscreen; display-capture; autoplay"
          className="w-full h-full border-0"
        />
        {!meeting.isActive && !showControls && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-30">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-gray-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Meeting hasn&apos;t started yet</h2>
              <p className="text-gray-400">Please wait for the host to start the meeting.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
