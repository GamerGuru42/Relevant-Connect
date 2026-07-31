'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useRoleAccess } from '@/hooks/useRoleAccess'
import { announcementService } from '@/services/database/announcementService'
import { supabase } from '@/lib/supabase'
import { activityLogService } from '@/services/database/activityLogService'
import type { Announcement, CreateAnnouncementInput } from '@/types'

import { AppLayout } from '@/components/shared/AppLayout'
import { format } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Search, Trash2, Edit3, X, Eye, EyeOff,
  Megaphone, Upload, Calendar as CalendarIcon, Tag
} from 'lucide-react'
import Image from 'next/image'

const CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'youth', label: 'Youth' },
  { value: 'choir', label: 'Choir' },
  { value: 'workers', label: 'Workers' },
  { value: 'cell_ministry', label: 'Cell Ministry' },
  { value: 'special_events', label: 'Special Events' },
]

interface FormState {
  title: string
  body: string
  category: string
  imageUrl: string
  publishAt: string
}

const emptyForm: FormState = {
  title: '',
  body: '',
  category: 'general',
  imageUrl: '',
  publishAt: '',
}

export function AnnouncementManager() {
  const user = useAuthStore((state) => state.user)
  const { isSuperAdmin } = useRoleAccess()

  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  const fetchAll = useCallback(async () => {
    try {
      const data = await announcementService.getAll()
      setAnnouncements(data)
    } catch (err) {
      console.error('Failed to fetch announcements:', err)
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

  const openEdit = (ann: Announcement) => {
    setEditingId(ann.id)
    setForm({
      title: ann.title,
      body: ann.body,
      category: ann.category,
      imageUrl: ann.imageUrl || '',
      publishAt: ann.publishAt ? new Date(ann.publishAt).toISOString().slice(0, 16) : '',
    })
    setShowForm(true)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `announcements/${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('images').upload(path, file)
      if (error) throw error
      const { data: urlData } = supabase.storage.from('images').getPublicUrl(path)
      setForm((prev) => ({ ...prev, imageUrl: urlData.publicUrl }))
    } catch (err) {
      console.error('Image upload failed:', err)
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async () => {
    if (!user || !form.title.trim() || !form.body.trim()) return
    setSaving(true)
    try {
      const input: CreateAnnouncementInput = {
        title: form.title.trim(),
        body: form.body.trim(),
        category: form.category,
        imageUrl: form.imageUrl || null,
        publishAt: form.publishAt ? new Date(form.publishAt) : new Date(),
      }

      if (editingId) {
        await announcementService.update(editingId, { ...input, id: editingId })
        await activityLogService.log(user.id, 'edited', 'announcement', editingId, form.title)
      } else {
        const newId = await announcementService.create(user.id, input)
        await activityLogService.log(user.id, 'created', 'announcement', newId, form.title)
      }

      setShowForm(false)
      setEditingId(null)
      setForm(emptyForm)
      await fetchAll()
    } catch (err) {
      console.error('Failed to save announcement:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleSoftDelete = async (ann: Announcement) => {
    if (!user) return
    if (!confirm(`Delete "${ann.title}"? It will be soft-deleted.`)) return
    try {
      await announcementService.delete(ann.id)
      await activityLogService.log(user.id, 'deleted', 'announcement', ann.id, ann.title)
      await fetchAll()
    } catch (err) {
      console.error('Failed to delete announcement:', err)
    }
  }

  const filtered = announcements.filter((a) => {
    if (search) {
      const q = search.toLowerCase()
      return a.title.toLowerCase().includes(q) || a.body.toLowerCase().includes(q)
    }
    return true
  })

  const isPublished = (ann: Announcement) =>
    ann.publishAt && new Date(ann.publishAt) <= new Date() && !ann.deletedAt

  if (!user) return null

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Megaphone className="w-8 h-8 text-primary" />
              Announcements Manager
            </h1>
            <p className="text-muted-foreground mt-1">
              {announcements.length} announcement{announcements.length !== 1 ? 's' : ''} total
            </p>
          </div>
          <button
            onClick={openCreate}
            className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-md"
          >
            <Plus className="w-4 h-4" />
            New Announcement
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search announcements..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* Table */}
        {loading ? (
          <div className="space-y-3">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="h-20 bg-card rounded-xl animate-pulse border border-border" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-card border border-border rounded-2xl">
            <Megaphone className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No announcements found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((ann) => (
              <motion.div
                key={ann.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-card border rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center transition-all hover:shadow-md ${
                  ann.deletedAt ? 'border-red-500/30 opacity-60' : 'border-border'
                }`}
              >
                {/* Image thumbnail */}
                {ann.imageUrl && (
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                    <Image src={ann.imageUrl} alt="" fill className="object-cover" />
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-bold truncate">{ann.title}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-secondary/20 text-secondary-foreground capitalize">
                      {ann.category.replace('_', ' ')}
                    </span>
                    {ann.deletedAt ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 font-semibold">Deleted</span>
                    ) : isPublished(ann) ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-semibold flex items-center gap-1">
                        <Eye className="w-3 h-3" /> Published
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 font-semibold flex items-center gap-1">
                        <EyeOff className="w-3 h-3" /> Scheduled
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-1">{ann.body}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {ann.publishAt ? `Publishes: ${format(new Date(ann.publishAt), 'MMM d, yyyy h:mm a')}` : 'No publish date'}
                  </p>
                </div>

                {/* Actions */}
                {!ann.deletedAt && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => openEdit(ann)}
                      className="p-2 rounded-lg bg-secondary/50 hover:bg-secondary text-secondary-foreground transition-colors"
                      title="Edit"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    {isSuperAdmin && (
                      <button
                        onClick={() => handleSoftDelete(ann)}
                        className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Create/Edit Drawer */}
        <AnimatePresence>
          {showForm && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowForm(false)}
                className="fixed inset-0 bg-black/50 z-40"
              />

              {/* Drawer */}
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="fixed right-0 top-0 h-full w-full max-w-lg bg-card border-l border-border shadow-2xl z-50 flex flex-col"
              >
                {/* Drawer Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                  <h2 className="text-xl font-bold">
                    {editingId ? 'Edit Announcement' : 'New Announcement'}
                  </h2>
                  <button onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-muted transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Drawer Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-semibold mb-1.5">Title *</label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                      placeholder="e.g. Sunday Service Update"
                      className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>

                  {/* Body */}
                  <div>
                    <label className="block text-sm font-semibold mb-1.5">Body *</label>
                    <textarea
                      rows={6}
                      value={form.body}
                      onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))}
                      placeholder="Write the announcement content..."
                      className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-semibold mb-1.5 flex items-center gap-2">
                      <Tag className="w-4 h-4 text-primary" /> Category
                    </label>
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

                  {/* Publish Date */}
                  <div>
                    <label className="block text-sm font-semibold mb-1.5 flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-primary" /> Publish Date
                    </label>
                    <input
                      type="datetime-local"
                      value={form.publishAt}
                      onChange={(e) => setForm((p) => ({ ...p, publishAt: e.target.value }))}
                      className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Leave blank to publish immediately.</p>
                  </div>

                  {/* Image Upload */}
                  <div>
                    <label className="block text-sm font-semibold mb-1.5 flex items-center gap-2">
                      <Upload className="w-4 h-4 text-primary" /> Image (optional)
                    </label>
                    {form.imageUrl && (
                      <div className="relative w-full h-40 rounded-xl overflow-hidden mb-3 bg-muted">
                        <Image src={form.imageUrl} alt="Preview" fill className="object-cover" />
                        <button
                          onClick={() => setForm((p) => ({ ...p, imageUrl: '' }))}
                          className="absolute top-2 right-2 bg-black/60 text-white p-1 rounded-full"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    <label className="flex items-center justify-center gap-2 px-4 py-3 bg-background border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 transition-colors text-sm text-muted-foreground">
                      <Upload className="w-4 h-4" />
                      {uploading ? 'Uploading...' : 'Click to upload image'}
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
                    </label>
                  </div>
                </div>

                {/* Drawer Footer */}
                <div className="p-6 border-t border-border flex gap-3">
                  <button
                    onClick={() => setShowForm(false)}
                    className="flex-1 px-4 py-3 bg-secondary/50 hover:bg-secondary text-secondary-foreground rounded-xl font-semibold text-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={saving || !form.title.trim() || !form.body.trim()}
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
