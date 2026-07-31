'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Menu, X, Sun, Moon, LogOut, Settings, User } from 'lucide-react'
import { Button } from './Button'
import { useAuthStore } from '@/store/authStore'
import { authService } from '@/services/auth/authService'
import toast from 'react-hot-toast'
import { Logo } from './Logo'

export function AppHeader() {
  const router = useRouter()
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const { user, setUser } = useAuthStore()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => setMounted(true), [])

  const handleLogout = async () => {
    try {
      await authService.logout()
      setUser(null)
      router.push('/')
      toast.success('Logged out successfully')
    } catch (error) {
      toast.error('Failed to logout')
    }
  }

  const navLinks = [
    { href: '/', label: 'Dashboard' },
    { href: '/announcements', label: 'Announcements' },
    { href: '/events', label: 'Events' },
    { href: '/bible', label: 'Bible' },
    { href: '/meetings', label: 'Meetings' },
    { href: '/attendance', label: 'Attendance' },
  ]

  return (
    <header className="sticky top-0 z-50 w-full glass border-b border-border/40">
      <div className="container mx-auto px-4 flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3 group">
            <Logo className="w-10 h-10 group-hover:scale-105 transition-transform duration-300" />
            <span className="font-extrabold text-xl hidden sm:inline-block tracking-tight text-gradient">Relevant+</span>
          </Link>
          
          <nav className="hidden md:flex gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground ${
                  pathname === link.href ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-accent focus:ring-2 focus:ring-primary"
            aria-label="Toggle Theme"
          >
            {mounted ? (theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />) : <div className="w-5 h-5" />}
          </button>
          
          {user && (
            <>
              <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full"></span>
              </button>

              <div className="relative">
                <button 
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center gap-2 p-1 rounded-full hover:bg-accent transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-sm font-bold">
                    {user.fullName.charAt(0).toUpperCase()}
                  </div>
                </button>

                <AnimatePresence>
                  {isProfileMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-card border border-border overflow-hidden"
                    >
                      <div className="px-4 py-3 border-b border-border">
                        <p className="text-sm font-medium truncate">{user.fullName}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                      <div className="p-1">
                        <Link href="/profile" className="flex items-center px-3 py-2 text-sm rounded-sm hover:bg-accent" onClick={() => setIsProfileMenuOpen(false)}>
                          <User className="w-4 h-4 mr-2" /> Profile
                        </Link>
                        {user.role === 'admin' && user.membershipStatus === 'worker' && (
                          <Link href="/admin" className="flex items-center px-3 py-2 text-sm rounded-sm hover:bg-accent" onClick={() => setIsProfileMenuOpen(false)}>
                            <Settings className="w-4 h-4 mr-2" /> Admin Panel
                          </Link>
                        )}
                        <button onClick={() => { setIsProfileMenuOpen(false); handleLogout(); }} className="w-full flex items-center px-3 py-2 text-sm rounded-sm hover:bg-accent text-destructive">
                          <LogOut className="w-4 h-4 mr-2" /> Logout
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          )}

          {!user && (
             <div className="hidden sm:flex gap-2">
               <Button variant="outline" size="sm" onClick={() => router.push('/auth/login')}>Sign In</Button>
             </div>
          )}

          <button
            className="md:hidden p-2 text-muted-foreground hover:text-foreground"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden border-b border-border bg-background"
          >
            <nav className="flex flex-col p-4 gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`px-4 py-3 rounded-md text-sm font-medium ${
                    pathname === link.href ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              {!user && (
                <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-border">
                   <Button className="w-full" onClick={() => { setIsMobileMenuOpen(false); router.push('/auth/login'); }}>Sign In with Google</Button>
                </div>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
