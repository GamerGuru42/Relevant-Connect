'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useRoleAccess } from '@/hooks/useRoleAccess'
import { eventService } from '@/services/database/eventService'
import { supabase } from '@/lib/supabase'
import { activityLogService } from '@/services/database/activityLogService'
import type { Event, CreateEventInput } from '@/types'

import { AppLayout } from '@/components/shared/AppLayout'
import { format } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Search, Trash2, Edit3, X, Eye,
  CalendarDays, Upload, Clock, MapPin, Users, BarChart3, User as UserIcon
} from 'lucide-react'
import Image from 'next/image'

const CATEGORIES = [
  { value: 'service', label: 'Service' },
  { value: 'midweek', label: 'Midweek' },
  { value: 'prayer_meeting', label: 'Prayer Meeting' },
  { value: 'conference', label: 'Conference' },
  { value: 'special_programme', label: 'Special Programme' },
  { value: 'youth', label: 'Youth' },
  { value: 'cell_meeting', label: 'Cell Meeting' },
]

interface FormState {
  title: string
  description: string
  category: string
  date: string
  time: string
  venueName: string
  venueAddress: string
  venueMapLink: string
  speaker: string
  registrationLimit: string
  posterUrl: string
  publishAt: string
}

const emptyForm: FormState = {
  title: '',
  description: '',
  category: 'service',
  date: '',
  time: '',
  venueName: '',
  venueAddress: '',
  venueMapLink: '',
  speaker: '',
  registrationLimit: '',
  posterUrl: '',
  publishAt: '',
}

type EventWithStats = Event & { registrationCount: number; attendanceCount: number }

export function EventManager() {
  const user = useAuthStore((state) => state.user)
  const { isSuperAdmin } = useRoleAccess()

  const [events, setEvents] = useState<Event[]>([])
  const [history, setHistory] = useState<EventWithStats[]>([])
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming')
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [reportEvent, setReportEvent] = useState<EventWithStats | null>(null)

  const fetchAll = useCallback(async () => {
    try {
      const [allEvents, pastEvents] = await Promise.all([
        eventService.getAll(),
        eventService.getGlobalEventHistory(50),
      ])
      const today = new Date().toISOString().split('T')[0]
      setEvents(allEvents.filter((e) => e.date >= today && !e.deletedAt))
      setHistory(pastEvents)
    } catch (err) {
      console.error('Failed to fetch events:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  const openEdit = (evt: Event) => {
    setEditingId(evt.id)
    setForm({
      title: evt.title,
      description: evt.description,
      category: evt.category,
      date: evt.date,
      time: evt.time,
      venueName: evt.venueName,
      venueAddress: evt.venueAddress,
      venueMapLink: evt.venueMapLink || '',
      speaker: evt.speaker || '',
      registrationLimit: evt.registrationLimit ? String(evt.registrationLimit) : '',
      posterUrl: evt.posterUrl || '',
      publishAt: evt.publishAt ? new Date(evt.publishAt).toISOString().slice(0, 16) : '',
    })
    setShowForm(true)
  }

  const handlePosterUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `events/${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('images').upload(path, file)
      if (error) throw error
      const { data: urlData } = supabase.storage.from('images').getPublicUrl(path)
      setForm((p) => ({ ...p, posterUrl: urlData.publicUrl }))
    } catch (err) {
      console.error('Poster upload failed:', err)
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async () => {
    if (!user || !form.title.trim() || !form.date || !form.time || !form.venueName.trim()) return
    setSaving(true)
    try {
      const input: CreateEventInput = {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        date: form.date,
        time: form.time,
        venueName: form.venueName.trim(),
        venueAddress: form.venueAddress.trim(),
        venueMapLink: form.venueMapLink || null,
        speaker: form.speaker || null,
        registrationLimit: form.registrationLimit ? parseInt(form.registrationLimit) : null,
        posterUrl: form.posterUrl || null,
        publishAt: form.publishAt ? new Date(form.publishAt) : new Date(),
      }

      if (editingId) {
        await eventService.update(editingId, { ...input, id: editingId })
        await activityLogService.log(user.id, 'edited', 'event', editingId, form.title)
      } else {
        const newId = await eventService.create(user.id, input)
        await activityLogService.log(user.id, 'created', 'event', newId, form.title)
      }

      setShowForm(false)
      setEditingId(null)
      setForm(emptyForm)
      await fetchAll()
    } catch (err) {
      console.error('Failed to save event:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleSoftDelete = async (evt: Event) => {
    if (!user) return
    if (!confirm(`Delete "${evt.title}"? It will be soft-deleted.`)) return
    try {
      await eventService.delete(evt.id)
      await activityLogService.log(user.id, 'deleted', 'event', evt.id, evt.title)
      await fetchAll()
    } catch (err) {
      console.error('Failed to delete event:', err)
    }
  }

  const filteredList = (activeTab === 'upcoming' ? events : history).filter((e) => {
    if (search) {
      const q = search.toLowerCase()
      return e.title.toLowerCase().includes(q) || e.venueName.toLowerCase().includes(q)
    }
    return true
  })

  const getScanRate = (evt: EventWithStats) => {
    if (!evt.registrationCount) return '—'
    return `${Math.round((evt.attendanceCount / evt.registrationCount) * 100)}%`
  }

  if (!user) return null

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <CalendarDays className="w-8 h-8 text-primary" />
              Events Manager
            </h1>
            <p className="text-muted-foreground mt-1">
              {events.length} upcoming · {history.length} past
            </p>
          </div>
          <button
            onClick={openCreate}
            className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-md"
          >
            <Plus className="w-4 h-4" />
            New Event
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted/50 rounded-xl p-1 mb-6 w-fit">
          {(['upcoming', 'history'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors capitalize ${
                activeTab === tab ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab === 'upcoming' ? `Upcoming (${events.length})` : `History (${history.length})`}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={`Search ${activeTab} events...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* Event List */}
        {loading ? (
          <div className="space-y-3">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="h-24 bg-card rounded-xl animate-pulse border border-border" />
            ))}
          </div>
        ) : filteredList.length === 0 ? (
          <div className="text-center py-16 bg-card border border-border rounded-2xl">
            <CalendarDays className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No {activeTab} events found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredList.map((evt) => (
              <motion.div
                key={evt.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center hover:shadow-md transition-all"
              >
                {/* Poster thumbnail */}
                {evt.posterUrl && (
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                    <Image src={evt.posterUrl} alt="" fill className="object-cover" />
                  </div>
                )}

                {/* Date badge */}
                <div className="flex-shrink-0 w-14 h-14 bg-primary/10 rounded-xl flex flex-col items-center justify-center text-primary">
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    {format(new Date(evt.date), 'MMM')}
                  </span>
                  <span className="text-lg font-black leading-none">
                    {format(new Date(evt.date), 'dd')}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-bold truncate">{evt.title}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-secondary/20 text-secondary-foreground capitalize">
                      {evt.category.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {evt.time}</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {evt.venueName}</span>
                    {evt.speaker && <span className="flex items-center gap-1"><UserIcon className="w-3 h-3" /> {evt.speaker}</span>}
                  </div>

                  {/* History stats */}
                  {activeTab === 'history' && 'registrationCount' in evt && (
                    <div className="flex items-center gap-4 mt-2 text-xs">
                      <span className="flex items-center gap-1 text-blue-500">
                        <Users className="w-3 h-3" /> {(evt as EventWithStats).registrationCount} registered
                      </span>
                      <span className="flex items-center gap-1 text-emerald-500">
                        <Eye className="w-3 h-3" /> {(evt as EventWithStats).attendanceCount} attended
                      </span>
                      <span className="flex items-center gap-1 text-amber-500">
                        <BarChart3 className="w-3 h-3" /> {getScanRate(evt as EventWithStats)} scan rate
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {activeTab === 'history' && (
                    <button
                      onClick={() => setReportEvent(evt as EventWithStats)}
                      className="p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 transition-colors"
                      title="View Report"
                    >
                      <BarChart3 className="w-4 h-4" />
                    </button>
                  )}
                  {activeTab === 'upcoming' && (
                    <>
                      <button
                        onClick={() => openEdit(evt)}
                        className="p-2 rounded-lg bg-secondary/50 hover:bg-secondary text-secondary-foreground transition-colors"
                        title="Edit"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      {isSuperAdmin && (
                        <button
                          onClick={() => handleSoftDelete(evt)}
                          className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Event Report Modal */}
        <AnimatePresence>
          {reportEvent && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setReportEvent(null)}
                className="fixed inset-0 bg-black/50 z-40"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="fixed inset-4 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-2xl sm:max-h-[80vh] bg-card border border-border rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
              >
                {/* Report Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                  <div>
                    <h2 className="text-xl font-bold">Event Report</h2>
                    <p className="text-sm text-muted-foreground">{reportEvent.title}</p>
                  </div>
                  <button onClick={() => setReportEvent(null)} className="p-2 rounded-lg hover:bg-muted transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Report Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-blue-500/10 rounded-xl p-4 text-center">
                      <p className="text-2xl font-black text-blue-500">{reportEvent.registrationCount}</p>
                      <p className="text-xs font-semibold text-muted-foreground mt-1">Registrations</p>
                    </div>
                    <div className="bg-emerald-500/10 rounded-xl p-4 text-center">
                      <p className="text-2xl font-black text-emerald-500">{reportEvent.attendanceCount}</p>
                      <p className="text-xs font-semibold text-muted-foreground mt-1">Attended</p>
                    </div>
                    <div className="bg-amber-500/10 rounded-xl p-4 text-center">
                      <p className="text-2xl font-black text-amber-500">{getScanRate(reportEvent)}</p>
                      <p className="text-xs font-semibold text-muted-foreground mt-1">Scan Rate</p>
                    </div>
                  </div>

                  {/* Visual Bar */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Registration vs Attendance</h4>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Registered</span>
                          <span>{reportEvent.registrationCount}</span>
                        </div>
                        <div className="h-4 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: '100%' }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Attended</span>
                          <span>{reportEvent.attendanceCount}</span>
                        </div>
                        <div className="h-4 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all"
                            style={{
                              width: reportEvent.registrationCount > 0
                                ? `${Math.min(100, (reportEvent.attendanceCount / reportEvent.registrationCount) * 100)}%`
                                : '0%'
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* No-Show Count */}
                  <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-red-500 mb-1">No-Shows</h4>
                    <p className="text-2xl font-black">
                      {Math.max(0, reportEvent.registrationCount - reportEvent.attendanceCount)}
                    </p>
                    <p className="text-xs text-muted-foreground">Registered but did not check in</p>
                  </div>

                  {/* Event Details */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CalendarDays className="w-4 h-4" /> {format(new Date(reportEvent.date), 'EEEE, MMMM d, yyyy')}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="w-4 h-4" /> {reportEvent.time}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4" /> {reportEvent.venueName}
                    </div>
                    {reportEvent.speaker && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <UserIcon className="w-4 h-4" /> {reportEvent.speaker}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Create/Edit Drawer */}
        <AnimatePresence>
          {showForm && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowForm(false)}
                className="fixed inset-0 bg-black/50 z-40"
              />
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="fixed right-0 top-0 h-full w-full max-w-lg bg-card border-l border-border shadow-2xl z-50 flex flex-col"
              >
                <div className="flex items-center justify-between p-6 border-b border-border">
                  <h2 className="text-xl font-bold">
                    {editingId ? 'Edit Event' : 'New Event'}
                  </h2>
                  <button onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-muted transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-semibold mb-1.5">Title *</label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                      placeholder="e.g. Sunday Worship Service"
                      className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-semibold mb-1.5">Description *</label>
                    <textarea
                      rows={4}
                      value={form.description}
                      onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                      placeholder="Describe the event..."
                      className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                    />
                  </div>

                  {/* Date + Time row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-1.5">Date *</label>
                      <input
                        type="date"
                        value={form.date}
                        onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                        className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1.5">Time *</label>
                      <input
                        type="time"
                        value={form.time}
                        onChange={(e) => setForm((p) => ({ ...p, time: e.target.value }))}
                        className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-semibold mb-1.5">Category</label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                      className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Venue */}
                  <div>
                    <label className="block text-sm font-semibold mb-1.5">Venue Name *</label>
                    <input
                      type="text"
                      value={form.venueName}
                      onChange={(e) => setForm((p) => ({ ...p, venueName: e.target.value }))}
                      placeholder="e.g. Main Auditorium"
                      className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1.5">Venue Address</label>
                    <input
                      type="text"
                      value={form.venueAddress}
                      onChange={(e) => setForm((p) => ({ ...p, venueAddress: e.target.value }))}
                      placeholder="e.g. 123 Church Street"
                      className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>

                  {/* Speaker */}
                  <div>
                    <label className="block text-sm font-semibold mb-1.5">Speaker</label>
                    <input
                      type="text"
                      value={form.speaker}
                      onChange={(e) => setForm((p) => ({ ...p, speaker: e.target.value }))}
                      placeholder="e.g. Pastor Smith"
                      className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>

                  {/* Registration Limit */}
                  <div>
                    <label className="block text-sm font-semibold mb-1.5">Registration Limit</label>
                    <input
                      type="number"
                      value={form.registrationLimit}
                      onChange={(e) => setForm((p) => ({ ...p, registrationLimit: e.target.value }))}
                      placeholder="Leave blank for unlimited"
                      className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>

                  {/* Publish Date */}
                  <div>
                    <label className="block text-sm font-semibold mb-1.5">Publish Date</label>
                    <input
                      type="datetime-local"
                      value={form.publishAt}
                      onChange={(e) => setForm((p) => ({ ...p, publishAt: e.target.value }))}
                      className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Leave blank to publish immediately.</p>
                  </div>

                  {/* Poster Upload */}
                  <div>
                    <label className="block text-sm font-semibold mb-1.5 flex items-center gap-2">
                      <Upload className="w-4 h-4 text-primary" /> Event Poster
                    </label>
                    {form.posterUrl && (
                      <div className="relative w-full h-40 rounded-xl overflow-hidden mb-3 bg-muted">
                        <Image src={form.posterUrl} alt="Preview" fill className="object-cover" />
                        <button
                          onClick={() => setForm((p) => ({ ...p, posterUrl: '' }))}
                          className="absolute top-2 right-2 bg-black/60 text-white p-1 rounded-full"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    <label className="flex items-center justify-center gap-2 px-4 py-3 bg-background border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 transition-colors text-sm text-muted-foreground">
                      <Upload className="w-4 h-4" />
                      {uploading ? 'Uploading...' : 'Click to upload poster'}
                      <input type="file" accept="image/*" onChange={handlePosterUpload} className="hidden" disabled={uploading} />
                    </label>
                  </div>
                </div>

                <div className="p-6 border-t border-border flex gap-3">
                  <button
                    onClick={() => setShowForm(false)}
                    className="flex-1 px-4 py-3 bg-secondary/50 hover:bg-secondary text-secondary-foreground rounded-xl font-semibold text-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={saving || !form.title.trim() || !form.date || !form.time || !form.venueName.trim()}
                    className="flex-1 px-4 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold text-sm transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : editingId ? 'Update' : 'Publish'}
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  )
}
