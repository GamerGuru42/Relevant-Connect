'use client'
import { useState, useEffect, useMemo } from 'react'
import { AppLayout } from '@/components/shared/AppLayout'
import { supabase } from '@/lib/supabase'
import type { AuthUser, AttendanceRecord } from '@/types'
import { roleService } from '@/services/database/roleService'
import { attendanceService } from '@/services/database/attendanceService'
import { DEPARTMENT_OPTIONS } from '@/constants/enums'
import { useAuthStore } from '@/store/authStore'
import { useRoleAccess } from '@/hooks/useRoleAccess'
import { toast } from 'react-hot-toast'
import { Shield, Search, ShieldAlert, Eye, X, CheckCircle, Clock } from 'lucide-react'
import { Button } from '@/components/shared/Button'
import { format } from 'date-fns'
import Link from 'next/link'

// Simple map function for raw profile row
const mapProfileRow = (row: any): AuthUser => ({
  id: row.id,
  fullName: row.full_name,
  email: row.email,
  phone: row.phone ?? null,
  photoUrl: row.photo_url ?? null,
  role: row.role ?? 'member',
  appRole: row.app_role ?? 'member',
  membershipStatus: row.membership_status ?? 'visitor',
  isOnboarded: row.is_onboarded ?? false,
  department: row.department ?? null,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
})

export function MemberManager() {
  const [members, setMembers] = useState<AuthUser[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuthStore()
  const { isSuperAdmin } = useRoleAccess()
  
  // Search and Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [deptFilter, setDeptFilter] = useState('all')

  // Modal state
  const [promotingUser, setPromotingUser] = useState<AuthUser | null>(null)
  const [selectedDept, setSelectedDept] = useState('')
  const [isPromoting, setIsPromoting] = useState(false)
  
  const [viewingUser, setViewingUser] = useState<AuthUser | null>(null)
  const [userAttendance, setUserAttendance] = useState<AttendanceRecord[]>([])
  const [loadingAttendance, setLoadingAttendance] = useState(false)

  useEffect(() => {
    fetchMembers()
  }, [])

  const fetchMembers = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      toast.error('Failed to load members')
      console.error(error)
    } else if (data) {
      setMembers(data.map(mapProfileRow))
    }
    setLoading(false)
  }

  const handlePromote = async () => {
    if (!promotingUser || !selectedDept || !user) return
    setIsPromoting(true)
    try {
      await roleService.promoteToDepartmentHead(
        promotingUser.id,
        selectedDept,
        user.id,
        user.fullName
      )
      toast.success(`${promotingUser.fullName} promoted to Department Head!`)
      setPromotingUser(null)
      setSelectedDept('')
      fetchMembers() // refresh list
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsPromoting(false)
    }
  }

  const handleDemote = async (memberToDemote: AuthUser) => {
    if (!user) return
    if (!confirm(`Are you sure you want to remove ${memberToDemote.fullName} from their role?`)) return
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ app_role: 'worker' })
        .eq('id', memberToDemote.id)

      if (error) throw error

      toast.success(`${memberToDemote.fullName} demoted to worker.`)
      fetchMembers()
    } catch (error: any) {
      toast.error(error.message || 'Failed to demote member')
    }
  }
  
  const handleViewProfile = async (member: AuthUser) => {
    setViewingUser(member)
    setLoadingAttendance(true)
    try {
       const attendance = await attendanceService.getUserAttendance(member.id)
       setUserAttendance(attendance)
    } catch(e) {
       toast.error("Failed to load attendance")
    } finally {
       setLoadingAttendance(false)
    }
  }

  const filteredMembers = useMemo(() => {
    return members.filter(m => {
      const matchesSearch = 
        m.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
        m.email.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesRole = roleFilter === 'all' || m.appRole === roleFilter
      const matchesDept = deptFilter === 'all' || m.department === deptFilter

      return matchesSearch && matchesRole && matchesDept
    })
  }, [members, searchQuery, roleFilter, deptFilter])

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 relative">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/admin" className="hover:text-primary transition-colors">Admin</Link>
            <span>/</span>
            <span className="text-foreground">Members</span>
          </div>
          <h1 className="text-3xl font-bold">Member Manager</h1>
        </div>
        
        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search by name or email..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-md bg-background border border-border focus:border-primary outline-none text-sm"
            />
          </div>
          <select 
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-background border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-primary"
          >
            <option value="all">All Roles</option>
            <option value="super_admin">Super Admin</option>
            <option value="department_head">Department Head</option>
            <option value="worker">Worker</option>
            <option value="member">Member</option>
          </select>
          <select 
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="bg-background border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-primary"
          >
            <option value="all">All Departments</option>
            {DEPARTMENT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center p-8">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-lg overflow-x-auto shadow-sm">
            <table className="w-full text-left min-w-[800px]">
              <thead className="bg-muted">
                <tr>
                  <th className="p-4 font-semibold text-sm">Name</th>
                  <th className="p-4 font-semibold text-sm">Email</th>
                  <th className="p-4 font-semibold text-sm">Role</th>
                  <th className="p-4 font-semibold text-sm">Department</th>
                  <th className="p-4 font-semibold text-sm text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((member) => (
                  <tr key={member.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                    <td className="p-4 font-medium">{member.fullName}</td>
                    <td className="p-4 text-muted-foreground text-sm">{member.email}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        member.appRole === 'super_admin' ? 'bg-red-500/10 text-red-500' :
                        member.appRole === 'department_head' ? 'bg-purple-500/10 text-purple-500' :
                        member.appRole === 'worker' ? 'bg-blue-500/10 text-blue-500' :
                        'bg-zinc-500/10 text-zinc-500'
                      }`}>
                        {member.appRole.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 capitalize text-sm">{member.department?.replace('_', ' ') || '-'}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewProfile(member)}
                          className="h-8 w-8 p-0"
                          title="View Profile"
                        >
                           <Eye className="w-4 h-4" />
                        </Button>
                        {isSuperAdmin && member.appRole !== 'super_admin' && (
                          <>
                            {member.appRole !== 'department_head' ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setPromotingUser(member)}
                                className="h-8 text-xs bg-primary/5 text-primary hover:bg-primary hover:text-primary-foreground border-primary/20"
                                title="Promote"
                              >
                                <Shield className="w-4 h-4 mr-1" />
                                Promote
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDemote(member)}
                                className="h-8 text-xs"
                                title="Demote"
                              >
                                <ShieldAlert className="w-4 h-4 mr-1" />
                                Demote
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredMembers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      No members found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Promote Modal */}
        {promotingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="bg-card w-full max-w-md rounded-xl p-6 shadow-xl border border-border animate-in fade-in zoom-in-95 duration-200">
              <h2 className="text-xl font-bold mb-2">Promote to Department Head</h2>
              <p className="text-muted-foreground mb-6 text-sm">
                Select a department for <span className="font-semibold text-foreground">{promotingUser.fullName}</span>.
              </p>
              
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Department</label>
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="w-full bg-background border border-border rounded-md px-3 py-2 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                >
                  <option value="" disabled>Select department</option>
                  {DEPARTMENT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setPromotingUser(null)} disabled={isPromoting}>
                  Cancel
                </Button>
                <Button onClick={handlePromote} disabled={!selectedDept || isPromoting} loading={isPromoting}>
                  Confirm Promotion
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {/* Profile Modal */}
        {viewingUser && (
           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
             <div className="bg-card w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl p-6 shadow-xl border border-border animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-start mb-6 border-b border-border pb-4">
                   <div>
                      <h2 className="text-2xl font-bold">{viewingUser.fullName}</h2>
                      <p className="text-muted-foreground">{viewingUser.email}</p>
                   </div>
                   <button onClick={() => setViewingUser(null)} className="p-2 hover:bg-muted rounded-full transition-colors">
                      <X className="w-5 h-5" />
                   </button>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-8">
                   <div>
                      <p className="text-sm text-muted-foreground">App Role</p>
                      <p className="font-semibold capitalize">{viewingUser.appRole.replace('_', ' ')}</p>
                   </div>
                   <div>
                      <p className="text-sm text-muted-foreground">Department</p>
                      <p className="font-semibold capitalize">{viewingUser.department?.replace('_', ' ') || 'None'}</p>
                   </div>
                   <div>
                      <p className="text-sm text-muted-foreground">Membership Status</p>
                      <p className="font-semibold capitalize">{viewingUser.membershipStatus}</p>
                   </div>
                   <div>
                      <p className="text-sm text-muted-foreground">Joined</p>
                      <p className="font-semibold">{format(viewingUser.createdAt, 'MMM d, yyyy')}</p>
                   </div>
                </div>
                
                <div>
                   <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-primary" />
                      Attendance History
                   </h3>
                   {loadingAttendance ? (
                      <p className="text-sm text-muted-foreground">Loading attendance...</p>
                   ) : userAttendance.length > 0 ? (
                      <div className="space-y-3">
                         {userAttendance.map((record) => (
                            <div key={record.id} className="flex items-center justify-between p-3 border border-border rounded-lg bg-background">
                               <div className="flex items-center gap-3">
                                  <Clock className="w-4 h-4 text-muted-foreground" />
                                  <span className="text-sm font-medium">{format(new Date(record.timestamp), 'MMM d, yyyy - h:mm a')}</span>
                               </div>
                               <span className="text-xs px-2 py-1 bg-muted rounded capitalize">{record.method}</span>
                            </div>
                         ))}
                      </div>
                   ) : (
                      <p className="text-sm text-muted-foreground bg-muted p-4 rounded-lg text-center">No attendance records found.</p>
                   )}
                </div>
             </div>
           </div>
        )}
      </div>
    </AppLayout>
  )
}
