'use client'
import { AppLayout } from '@/components/shared/AppLayout'
import { useAuthStore } from '@/store/authStore'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import { Settings, Users, Calendar, Megaphone, Activity, Video, QrCode } from 'lucide-react'

export function AdminDashboard() {
  const user = useAuthStore((state) => state.user)
  const router = useRouter()

  useEffect(() => {
    if (user && !(user.role === 'admin' && user.membershipStatus === 'worker')) {
      router.replace('/')
    }
  }, [user, router])

  if (!user || !(user.role === 'admin' && user.membershipStatus === 'worker')) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">Access denied.</p>
        </div>
      </AppLayout>
    )
  }

  const links = [
    { name: 'Announcements', href: '/admin/announcements', icon: Megaphone },
    { name: 'Events', href: '/admin/events', icon: Calendar },
    { name: 'Meetings', href: '/admin/meetings', icon: Video },
    { name: 'QR Scanner', href: '/admin/scanner', icon: QrCode },
    { name: 'Members', href: '/admin/members', icon: Users },
    { name: 'Church Settings', href: '/admin/settings', icon: Settings },
    { name: 'Activity Log', href: '/admin/activity', icon: Activity },
  ]
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {links.map((link) => (
            <Link key={link.name} href={link.href} className="bg-card border border-border p-6 rounded-lg shadow-soft hover:border-primary transition-colors flex items-center gap-4">
              <link.icon className="w-8 h-8 text-primary" />
              <span className="text-xl font-bold">{link.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </AppLayout>
  )
}
