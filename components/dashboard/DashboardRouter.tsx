'use client'

import { useAuthStore } from '@/store/authStore'
import { useRoleAccess } from '@/hooks/useRoleAccess'
import { SuperAdminDashboard } from './SuperAdminDashboard'
import { DepartmentHeadDashboard } from './DepartmentHeadDashboard'
import { WorkerDashboard } from './WorkerDashboard'
import { MemberDashboard } from './MemberDashboard'
import { VisitorDashboard } from './VisitorDashboard'

export function DashboardRouter() {
  const user = useAuthStore((state) => state.user)
  const { isSuperAdmin, isDepartmentHead, isWorker, isMember } = useRoleAccess()

  // During loading or if user is null
  if (!user) return null

  // Route based on role/membership
  if (isSuperAdmin) {
    return <SuperAdminDashboard />
  }
  
  if (isDepartmentHead) {
    return <DepartmentHeadDashboard />
  }

  if (isWorker) {
    return <WorkerDashboard />
  }

  if (isMember) {
    return <MemberDashboard />
  }

  // Fallback for visitors, new converts, or anyone else
  return <VisitorDashboard />
}
