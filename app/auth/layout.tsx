import { ReactNode } from 'react'
import Link from 'next/link'
import { Logo } from '@/components/shared/Logo'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left side — cinematic branding panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900" />
        <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute inset-0 bg-black/20" />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <Link href="/" className="flex items-center gap-3">
            <Logo className="w-11 h-11" />
            <span className="font-extrabold text-xl text-white tracking-tight">Relevant+</span>
          </Link>

          <div className="space-y-6">
            <h2 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight tracking-tight">
              Your Church.
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
                Connected.
              </span>
            </h2>
            <p className="text-white/60 text-lg max-w-md leading-relaxed">
              One platform for announcements, events, attendance, and community.
            </p>
          </div>

          <p className="text-white/30 text-sm">
            &copy; {new Date().getFullYear()} Relevant+ &bull; Relevant PCF
          </p>
        </div>
      </div>

      {/* Right side — auth form */}
      <div className="flex-1 flex items-center justify-center bg-background p-6 relative">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-secondary/5 blur-3xl"></div>
        </div>
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  )
}
