'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useRoleAccess } from '@/hooks/useRoleAccess'
import { meetingService } from '@/services/database/meetingService'
import type { Meeting, CreateMeetingInput } from '@/types'

import { AppLayout } from '@/components/shared/AppLayout'
import { format } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Search, Trash2, X, Video, Clock, Users, Link as LinkIcon
} from 'lucide-react'

interface FormState {
  title: string
  description: string
  date: string
  time: string
  durationMinutes: string
  department: string
  targetAudience: 'department' | 'all'
}

const emptyForm: FormState = {
  title: '',
  description: '',
  date: '',
  time: '',
  durationMinutes: '60',
  department: '',
  targetAudience: 'department',
}

export function MeetingManager() {
  const user = useAuthStore((state) => state.user)
  const { isSuperAdmin, isDepartmentHead } = useRoleAccess()

  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm)

  const fetchMeetings = useCallback(async () => {
    try {
      if (!user) return
      const fetched = await meetingService.getScopedMeetings(user.department, user.appRole)
      setMeetings(fetched)
    } catch (err) {
      console.error('Failed to fetch meetings:', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchMeetings()
  }, [fetchMeetings])

  const openCreate = () => {
    setForm({
      ...emptyForm,
      department: user?.department || '',
      targetAudience: isSuperAdmin ? 'all' : 'department'
    })
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setForm(emptyForm)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    try {
      const meetingId = crypto.randomUUID()
      const timestamp = Date.now()
      const dept = form.targetAudience === 'all' ? 'All' : (form.department || 'General')
      const roomName = `RelevantPlus-${dept}-${meetingId.substring(0,8)}-${timestamp}`.replace(/[^a-zA-Z0-9-]/g, '')
      const meetingUrl = `https://meet.jit.si/${roomName}#config.prejoinPageEnabled=false&config.startWithAudioMuted=true&config.startWithVideoMuted=true&userInfo.displayName=${encodeURIComponent(user.fullName)}`

      const input: CreateMeetingInput = {
        title: form.title,
        description: form.description,
        meetingUrl,
        platform: 'jitsi',
        hostName: user.fullName,
        hostId: user.id,
        department: form.department || null,
        targetAudience: form.targetAudience,
        date: form.date,
        time: form.time,
        durationMinutes: parseInt(form.durationMinutes, 10),
      }

      await meetingService.create(input, user.id)
      await fetchMeetings()
      closeForm()
    } catch (err) {
      console.error('Failed to save meeting:', err)
      alert('Failed to save meeting')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this meeting?')) return
    try {
      await meetingService.delete(id)
      setMeetings((prev) => prev.filter((m) => m.id !== id))
    } catch (err) {
      console.error('Failed to delete:', err)
      alert('Failed to delete meeting')
    }
  }

  const filtered = meetings.filter((m) =>
    m.title.toLowerCase().includes(search.toLowerCase())
  )

  if (!user || (!isSuperAdmin && !isDepartmentHead)) {
    return <div className="p-8 text-center text-white">Access Denied</div>
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Meeting Manager</h1>
            <p className="text-gray-400 text-sm mt-1">Schedule and manage online meetings</p>
          </div>
          <button
            onClick={openCreate}
            className="bg-accent text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-accent/90 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Meeting
          </button>
        </div>

        <div className="bg-foreground/50 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-xl">
          <div className="p-4 border-b border-white/5">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search meetings..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all"
              />
            </div>
          </div>

          <div className="p-4">
            {loading ? (
              <div className="text-center py-12 text-gray-400">Loading meetings...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12">
                <Video className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No meetings found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filtered.map((meeting) => (
                  <div
                    key={meeting.id}
                    className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col hover:bg-white/[0.07] transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-white">{meeting.title}</h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDelete(meeting.id)}
                          className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {meeting.description && (
                      <p className="text-sm text-gray-400 line-clamp-2 mb-4">{meeting.description}</p>
                    )}
                    <div className="mt-auto space-y-2 text-sm text-gray-300">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span>{format(new Date(meeting.date), 'MMM d, yyyy')} • {meeting.time} ({meeting.durationMinutes}m)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span>{meeting.targetAudience === 'all' ? 'All Members' : meeting.department}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <LinkIcon className="w-4 h-4 text-gray-500" />
                        <span className="truncate flex-1">{meeting.platform === 'jitsi' ? 'Jitsi Meet' : meeting.platform}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeForm}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-[#111111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0">
                <h2 className="text-xl font-semibold text-white">Create Meeting</h2>
                <button
                  onClick={closeForm}
                  className="text-gray-400 hover:text-white transition-colors p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto">
                <form id="meetingForm" onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Title *</label>
                    <input
                      required
                      type="text"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50"
                      placeholder="e.g. Choir Rehearsal"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 min-h-[80px]"
                      placeholder="Optional meeting agenda or notes..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Date *</label>
                      <input
                        required
                        type="date"
                        value={form.date}
                        onChange={(e) => setForm({ ...form, date: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Time *</label>
                      <input
                        required
                        type="time"
                        value={form.time}
                        onChange={(e) => setForm({ ...form, time: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Duration (mins) *</label>
                      <input
                        required
                        type="number"
                        min="15"
                        step="15"
                        value={form.durationMinutes}
                        onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Target Audience</label>
                      <select
                        value={form.targetAudience}
                        onChange={(e) => setForm({ ...form, targetAudience: e.target.value as 'department' | 'all' })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50"
                      >
                        <option value="department">My Department Only</option>
                        {isSuperAdmin && <option value="all">All Members</option>}
                      </select>
                    </div>
                  </div>
                  
                  {form.targetAudience === 'department' && isSuperAdmin && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Department Name *</label>
                      <input
                        required
                        type="text"
                        value={form.department}
                        onChange={(e) => setForm({ ...form, department: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50"
                        placeholder="e.g. Choir"
                      />
                    </div>
                  )}

                </form>
              </div>

              <div className="p-6 border-t border-white/10 bg-white/[0.02] shrink-0 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="meetingForm"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium bg-accent text-white hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Creating...' : 'Create Meeting'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AppLayout>
  )
}
