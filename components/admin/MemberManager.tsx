'use client'
import { useState, useEffect } from 'react'
import { AppLayout } from '@/components/shared/AppLayout'
import { supabase } from '@/lib/supabase'
import type { AuthUser } from '@/types'
import { roleService } from '@/services/database/roleService'
import { DEPARTMENT_OPTIONS } from '@/constants/enums'
import { useAuthStore } from '@/store/authStore'
import { useRoleAccess } from '@/hooks/useRoleAccess'
import { toast } from 'react-hot-toast'
import { Shield } from 'lucide-react'

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
  
  // Modal state
  const [promotingUser, setPromotingUser] = useState<AuthUser | null>(null)
  const [selectedDept, setSelectedDept] = useState('')
  const [isPromoting, setIsPromoting] = useState(false)

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

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 relative">
        <h1 className="text-3xl font-bold mb-8">Member Manager</h1>
        
        {loading ? (
          <p>Loading members...</p>
        ) : (
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-muted">
                <tr>
                  <th className="p-4 font-semibold">Name</th>
                  <th className="p-4 font-semibold">Email</th>
                  <th className="p-4 font-semibold">Role</th>
                  <th className="p-4 font-semibold">Department</th>
                  <th className="p-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.id} className="border-t border-border">
                    <td className="p-4">{member.fullName}</td>
                    <td className="p-4 text-muted-foreground">{member.email}</td>
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
                    <td className="p-4 capitalize">{member.department?.replace('_', ' ') || '-'}</td>
                    <td className="p-4">
                      {isSuperAdmin && member.appRole !== 'super_admin' && member.appRole !== 'department_head' && (
                        <button
                          onClick={() => setPromotingUser(member)}
                          className="flex items-center gap-1 text-sm bg-primary text-primary-foreground px-3 py-1.5 rounded hover:bg-primary/90 transition-colors"
                        >
                          <Shield className="w-4 h-4" />
                          Promote to Head
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Promote Modal */}
        {promotingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="bg-card w-full max-w-md rounded-lg p-6 shadow-xl border border-border">
              <h2 className="text-xl font-bold mb-2">Promote to Department Head</h2>
              <p className="text-muted-foreground mb-4">
                Select a department for {promotingUser.fullName}.
              </p>
              
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Department</label>
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="w-full bg-background border border-border rounded-md px-3 py-2 outline-none focus:border-primary"
                >
                  <option value="" disabled>Select department</option>
                  {DEPARTMENT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setPromotingUser(null)}
                  className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-md transition-colors"
                  disabled={isPromoting}
                >
                  Cancel
                </button>
                <button
                  onClick={handlePromote}
                  disabled={!selectedDept || isPromoting}
                  className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {isPromoting ? 'Promoting...' : 'Confirm Promotion'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
