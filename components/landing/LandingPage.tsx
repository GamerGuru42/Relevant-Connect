'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { churchInfoService } from '@/services/database/churchInfoService'
import type { ChurchInfo } from '@/types'
import { motion } from 'framer-motion'
import { ArrowRight, Calendar, Users, Bell, CheckCircle, ChevronDown } from 'lucide-react'

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

  const fadeUp = {
    hidden: { opacity: 0, y: 40 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.15, duration: 0.7, ease: [0.25, 0.4, 0.25, 1] },
    }),
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ───── Navigation (Oasis-style transparent overlay) ───── */}
      <header className="fixed top-0 z-50 w-full">
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-transparent pointer-events-none" />
        <div className="relative container mx-auto flex h-20 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-white"><path d="M12 5v14M5 12h14"/></svg>
            </div>
            <span className="font-extrabold text-xl text-white tracking-tight">Relevant+</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/auth/login')}
              className="px-5 py-2.5 text-sm font-semibold text-white/90 hover:text-white transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => router.push('/auth/signup')}
              className="px-6 py-2.5 text-sm font-semibold bg-white text-gray-900 rounded-full hover:bg-white/90 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* ───── Hero Section (Full-screen cinematic) ───── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900" />
        {/* Ambient light effects */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        {/* Overlay grain */}
        <div className="absolute inset-0 bg-black/30" />

        <div className="relative z-10 container mx-auto px-6 text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            className="space-y-8 max-w-4xl mx-auto"
          >
            <motion.p custom={0} variants={fadeUp} className="text-sm font-semibold tracking-[0.3em] uppercase text-white/60">
              Relevant PCF &bull; Christ Embassy
            </motion.p>
            <motion.h1 custom={1} variants={fadeUp} className="text-5xl md:text-7xl lg:text-8xl font-extrabold text-white leading-[0.95] tracking-tight">
              Your Church.
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
                Connected.
              </span>
            </motion.h1>
            <motion.p custom={2} variants={fadeUp} className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed">
              One platform for announcements, events, attendance, and community — replacing the chaos of scattered WhatsApp groups.
            </motion.p>
            <motion.div custom={3} variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <button
                onClick={() => router.push('/auth/signup')}
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-bold bg-white text-gray-900 rounded-full hover:bg-white/90 transition-all shadow-2xl hover:shadow-white/25 transform hover:scale-105"
              >
                Join the Community
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => router.push('/auth/login')}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-white border border-white/30 rounded-full hover:bg-white/10 transition-all backdrop-blur-sm"
              >
                Sign In
              </button>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 12, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/40"
        >
          <ChevronDown className="w-6 h-6" />
        </motion.div>
      </section>

      {/* ───── Features Section (Oasis-style cards) ───── */}
      <section className="py-24 md:py-32 bg-background">
        <div className="container mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} className="text-center mb-20">
            <motion.p custom={0} variants={fadeUp} className="text-sm font-semibold tracking-[0.2em] uppercase text-primary mb-4">
              Everything You Need
            </motion.p>
            <motion.h2 custom={1} variants={fadeUp} className="text-4xl md:text-5xl font-extrabold tracking-tight">
              Stay Connected.<br />Stay Relevant.
            </motion.h2>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Bell className="w-7 h-7" />,
                title: 'Announcements',
                description: 'Stay up to date with the latest church news, important updates, and leadership messages — all in one place.',
                gradient: 'from-blue-500 to-indigo-600',
              },
              {
                icon: <Calendar className="w-7 h-7" />,
                title: 'Events & Calendar',
                description: 'Never miss a service, conference, or fellowship. View upcoming events and RSVP with a single tap.',
                gradient: 'from-cyan-500 to-blue-600',
              },
              {
                icon: <CheckCircle className="w-7 h-7" />,
                title: 'Easy Attendance',
                description: 'Check in instantly via QR code or attendance code. No more manual registers or paper sign-ins.',
                gradient: 'from-teal-500 to-cyan-600',
              },
              {
                icon: <Users className="w-7 h-7" />,
                title: 'Member Profiles',
                description: 'Manage your profile, track your attendance history, and stay connected with your church family.',
                gradient: 'from-violet-500 to-purple-600',
              },
              {
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                ),
                title: 'Notifications',
                description: 'Get timely reminders about upcoming events, new announcements, and important church updates.',
                gradient: 'from-amber-500 to-orange-600',
              },
              {
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                ),
                title: 'Event Registration',
                description: 'RSVP for events, manage your registrations, and see who else is attending from your group.',
                gradient: 'from-rose-500 to-pink-600',
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                custom={index}
                variants={fadeUp}
                className="group relative bg-card rounded-3xl p-8 border border-border/50 hover:border-primary/30 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl"
              >
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} text-white mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  {feature.icon}
                </div>
                <h3 className="font-bold text-xl mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ───── About / Church Info Section ───── */}
      {churchInfo && (
        <section className="py-24 md:py-32 bg-muted/30">
          <div className="container mx-auto px-6">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} className="grid lg:grid-cols-2 gap-16 items-center">
              <motion.div custom={0} variants={fadeUp} className="space-y-6">
                <p className="text-sm font-semibold tracking-[0.2em] uppercase text-primary">About Us</p>
                <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">{churchInfo.churchName}</h2>
                <p className="text-lg text-muted-foreground leading-relaxed">{churchInfo.aboutText}</p>
                <div className="flex flex-col sm:flex-row gap-8 pt-4">
                  <div>
                    <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Pastor</p>
                    <p className="font-bold text-lg">{churchInfo.pastorName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Service Times</p>
                    <p className="font-bold text-lg">{churchInfo.serviceTimes}</p>
                  </div>
                </div>
              </motion.div>

              <motion.div custom={1} variants={fadeUp} className="bg-card rounded-3xl p-10 border border-border/50 shadow-xl">
                <h3 className="text-2xl font-bold mb-8">Get In Touch</h3>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Address</p>
                      <p className="font-medium">{churchInfo.address}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Phone</p>
                      <p className="font-medium">{churchInfo.contactPhone}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Email</p>
                      <p className="font-medium">{churchInfo.contactEmail}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>
      )}

      {/* ───── CTA Section (Full-width cinematic) ───── */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-blue-600 to-secondary" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -ml-48 -mb-48" />

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="relative z-10 container mx-auto px-6 text-center">
          <motion.h2 custom={0} variants={fadeUp} className="text-4xl md:text-6xl font-extrabold text-white mb-6 tracking-tight">
            Ready to get connected?
          </motion.h2>
          <motion.p custom={1} variants={fadeUp} className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
            Join our church community today and be part of something greater.
          </motion.p>
          <motion.div custom={2} variants={fadeUp}>
            <button
              onClick={() => router.push('/auth/signup')}
              className="group inline-flex items-center gap-2 px-10 py-5 text-lg font-bold bg-white text-gray-900 rounded-full hover:bg-white/90 transition-all shadow-2xl transform hover:scale-105"
            >
              Create Your Account
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        </motion.div>
      </section>

      {/* ───── Footer ───── */}
      <footer className="bg-card border-t border-border">
        <div className="container mx-auto px-6 py-16">
          <div className="grid md:grid-cols-3 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-md">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-white"><path d="M12 5v14M5 12h14"/></svg>
                </div>
                <span className="font-extrabold text-xl tracking-tight">Relevant+</span>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Modern church management platform connecting our community through announcements, events, and meaningful engagement.
              </p>
            </div>
            {churchInfo && (
              <>
                <div>
                  <h4 className="font-bold text-sm uppercase tracking-wider mb-5">Church</h4>
                  <div className="space-y-3 text-muted-foreground">
                    <p>{churchInfo.churchName}</p>
                    <p>{churchInfo.address}</p>
                    <p>{churchInfo.serviceTimes}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-sm uppercase tracking-wider mb-5">Contact</h4>
                  <div className="space-y-3 text-muted-foreground">
                    <p>{churchInfo.contactPhone}</p>
                    <p>{churchInfo.contactEmail}</p>
                  </div>
                </div>
              </>
            )}
          </div>
          <div className="border-t border-border pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} Relevant+. All rights reserved.</p>
            <p className="text-sm text-muted-foreground">Relevant PCF &bull; Christ Embassy</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
