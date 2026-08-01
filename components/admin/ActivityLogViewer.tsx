'use client'

import { useState, useEffect } from 'react'
import { AppLayout } from '@/components/shared/AppLayout'
import { activityLogService } from '@/services/database/activityLogService'
import { supabase } from '@/lib/supabase'
import type { ActivityLog } from '@/types'
import { format } from 'date-fns'
import { Activity, Plus, Edit, Trash2, Shield, Calendar, Users, CheckCircle, Search } from 'lucide-react'
import { toast } from 'react-hot-toast'
import Link from 'next/link'

type LogWithUser = ActivityLog & { userName: string }

export function ActivityLogViewer() {
  const [logs, setLogs] = useState<LogWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [actionFilter, setActionFilter] = useState('all')
  const [entityFilter, setEntityFilter] = useState('all')

  useEffect(() => {
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
    try {
      const rawLogs = await activityLogService.getAll(500)
      
      // Fetch user profiles for mapping
      const userIds = Array.from(new Set(rawLogs.map(l => l.userId)))
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds)
        
      const userMap = new Map(profiles?.map(p => [p.id, p.full_name]) || [])
      
      const enrichedLogs = rawLogs.map(log => ({
        ...log,
        userName: userMap.get(log.userId) || 'Unknown User'
      }))
      
      setLogs(enrichedLogs)
    } catch (error) {
      toast.error('Failed to load activity logs')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'created': return <Plus className="w-4 h-4 text-emerald-500" />
      case 'edited': return <Edit className="w-4 h-4 text-blue-500" />
      case 'deleted': return <Trash2 className="w-4 h-4 text-red-500" />
      case 'promoted': return <Shield className="w-4 h-4 text-purple-500" />
      default: return <Activity className="w-4 h-4 text-muted-foreground" />
    }
  }

  const getEntityIcon = (entity: string) => {
    switch (entity) {
      case 'event': return <Calendar className="w-4 h-4" />
      case 'user': return <Users className="w-4 h-4" />
      case 'attendance': return <CheckCircle className="w-4 h-4" />
      default: return <Activity className="w-4 h-4" />
    }
  }

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.userName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      log.entityLabel.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesAction = actionFilter === 'all' || log.action === actionFilter
    const matchesEntity = entityFilter === 'all' || log.entity === entityFilter

    return matchesSearch && matchesAction && matchesEntity
  })

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/admin" className="hover:text-primary transition-colors">Admin</Link>
            <span>/</span>
            <span className="text-foreground">Activity Log</span>
          </div>
          <h1 className="text-3xl font-bold">Activity Log</h1>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search by user or entity..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-md bg-background border border-border focus:border-primary outline-none text-sm"
            />
          </div>
          <select 
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-background border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-primary"
          >
            <option value="all">All Actions</option>
            <option value="created">Created</option>
            <option value="edited">Edited</option>
            <option value="deleted">Deleted</option>
            <option value="promoted">Promoted</option>
          </select>
          <select 
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="bg-background border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-primary"
          >
            <option value="all">All Entities</option>
            <option value="user">Users</option>
            <option value="event">Events</option>
            <option value="announcement">Announcements</option>
            <option value="attendance">Attendance</option>
            <option value="churchInfo">Settings</option>
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center p-8">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="divide-y divide-border">
              {filteredLogs.map((log) => (
                <div key={log.id} className="p-4 hover:bg-muted/30 transition-colors flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                      {getActionIcon(log.action)}
                    </div>
                    <div>
                      <p className="text-sm">
                        <span className="font-semibold">{log.userName}</span>{' '}
                        <span className="text-muted-foreground">{log.action}</span>{' '}
                        <span className="font-semibold">{log.entityLabel}</span>
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1 capitalize">
                          {getEntityIcon(log.entity)} {log.entity}
                        </span>
                        <span>•</span>
                        <span>{format(new Date(log.timestamp), 'MMM d, yyyy h:mm a')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredLogs.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  No activity logs found.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
