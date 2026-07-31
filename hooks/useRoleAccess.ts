'use client'

import { useAuthStore } from '@/store/authStore'

export function useRoleAccess() {
  const { user } = useAuthStore()

  return {
    isSuperAdmin: user?.appRole === 'super_admin',
    isDepartmentHead: user?.appRole === 'department_head',
    isWorker: user?.appRole === 'worker',
    isMember: user?.appRole === 'member',
    isVisitor: user?.membershipStatus === 'visitor',
    isNewConvert: user?.membershipStatus === 'new_convert',
    department: user?.department,
    canAccessAdmin: user?.appRole === 'super_admin' || 
                   (user?.appRole === 'department_head' && user?.membershipStatus === 'worker'),
    canHostMeeting: user?.appRole === 'super_admin' || user?.appRole === 'department_head',
    canCreateEvent: user?.appRole === 'super_admin' || user?.appRole === 'department_head',
    canScanQR: user?.appRole === 'super_admin' || user?.appRole === 'department_head',
  }
}
