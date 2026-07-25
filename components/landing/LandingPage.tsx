'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/shared/Button'
import { useEffect, useState } from 'react'
import { churchInfoService } from '@/services/database/churchInfoService'
import type { ChurchInfo } from '@/types'
import { motion } from 'framer-motion'

export function LandingPage() {
  const router = useRouter()
  const [churchInfo, setChurchInfo] = useState<ChurchInfo | null>(null)

  useEffect(() => {
    const fetchChurchInfo = async () => {
      try {
        const info = await churchInfoService.get()
        setChurchInfo(info)
      } catch (error) {
        console.error('Error fetching church info:', error)
      }
    }

    fetchChurchInfo()
  }, [])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center font-bold">
              R+
            </div>
            <span className="font-bold text-lg">Relevant+</span>
          </div>
          <div className="flex gap-4">
            <Button variant="outline" size="sm" onClick={() => router.push('/auth/login')}>
              Login
            </Button>
            <Button size="sm" onClick={() => router.push('/auth/signup')}>
              Register
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-20">
        <motion.div
          className="grid gap-20"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Hero Section */}
          <motion.section variants={itemVariants} className="text-center space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tighter">
              Welcome to{' '}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Relevant+
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Modern church management platform connecting our community through announcements,
              events, and meaningful engagement.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button size="lg" onClick={() => router.push('/auth/signup')}>
                Get Started
              </Button>
              <Button size="lg" variant="outline" onClick={() => router.push('/auth/login')}>
                Sign In
              </Button>
            </div>
          </motion.section>

          {/* About Section */}
          {churchInfo && (
            <motion.section variants={itemVariants} className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-4">
                <h2 className="text-3xl font-bold">About {churchInfo.churchName}</h2>
                <p className="text-muted-foreground text-lg">{churchInfo.aboutText}</p>
                <div className="space-y-2 pt-4">
                  <p>
                    <strong>Pastor:</strong> {churchInfo.pastorName}
                  </p>
                  <p>
                    <strong>Service Times:</strong> {churchInfo.serviceTimes}
                  </p>
                </div>
              </div>
              <div className="bg-card rounded-lg p-8 shadow-soft border border-border">
                <h3 className="text-2xl font-bold mb-4">Contact Information</h3>
                <div className="space-y-3">
                  <p className="text-muted-foreground">
                    📍 {churchInfo.address}
                  </p>
                  <p className="text-muted-foreground">
                    📞 {churchInfo.contactPhone}
                  </p>
                  <p className="text-muted-foreground">
                    ✉️ {churchInfo.contactEmail}
                  </p>
                </div>
              </div>
            </motion.section>
          )}

          {/* Features Section */}
          <motion.section variants={itemVariants} className="space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold">Key Features</h2>
              <p className="text-muted-foreground">Everything you need to stay connected</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  title: 'Announcements',
                  description: 'Stay updated with the latest church news and announcements',
                  icon: '📢',
                },
                {
                  title: 'Events Calendar',
                  description: 'Never miss an event. View services, conferences, and programs',
                  icon: '📅',
                },
                {
                  title: 'Easy Attendance',
                  description: 'Quick check-in via QR code or attendance code',
                  icon: '✓',
                },
                {
                  title: 'Member Profiles',
                  description: 'Manage your profile and view attendance history',
                  icon: '👤',
                },
                {
                  title: 'Event Registration',
                  description: 'RSVP for events and manage your registrations',
                  icon: '🎟️',
                },
                {
                  title: 'Notifications',
                  description: 'Get notified about important updates and reminders',
                  icon: '🔔',
                },
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="bg-card rounded-lg p-6 border border-border shadow-soft hover:shadow-md transition-shadow"
                >
                  <div className="text-4xl mb-3">{feature.icon}</div>
                  <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* CTA Section */}
          <motion.section
            variants={itemVariants}
            className="bg-gradient-to-r from-primary to-secondary rounded-lg p-12 text-center text-primary-foreground"
          >
            <h2 className="text-3xl font-bold mb-4">Ready to connect with our community?</h2>
            <p className="text-lg mb-8 opacity-90">
              Join us today and be part of something greater
            </p>
            <Button size="lg" variant="outline" onClick={() => router.push('/auth/signup')}>
              Create Account Now
            </Button>
          </motion.section>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-lg bg-primary text-white flex items-center justify-center text-sm font-bold">
                  R+
                </div>
                <span className="font-bold">Relevant+</span>
              </div>
              <p className="text-muted-foreground text-sm">
                Church management made simple and effective
              </p>
            </div>
            {churchInfo && (
              <>
                <div>
                  <h4 className="font-bold mb-4">Church</h4>
                  <p className="text-muted-foreground text-sm mb-2">{churchInfo.churchName}</p>
                  <p className="text-muted-foreground text-sm mb-2">{churchInfo.address}</p>
                </div>
                <div>
                  <h4 className="font-bold mb-4">Contact</h4>
                  <p className="text-muted-foreground text-sm mb-2">{churchInfo.contactPhone}</p>
                  <p className="text-muted-foreground text-sm">{churchInfo.contactEmail}</p>
                </div>
              </>
            )}
          </div>
          <div className="border-t border-border pt-8 text-center text-muted-foreground text-sm">
            <p>&copy; 2024 Relevant+. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
