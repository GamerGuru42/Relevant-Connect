'use client'
import { AppLayout } from '@/components/shared/AppLayout'
import Link from 'next/link'
import { Settings, Users, Calendar, Megaphone, Activity } from 'lucide-react'

export function AdminDashboard() {
  const links = [
    { name: 'Announcements', href: '/admin/announcements', icon: Megaphone },
    { name: 'Events', href: '/admin/events', icon: Calendar },
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
