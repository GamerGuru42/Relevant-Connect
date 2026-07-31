'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { useRoleAccess } from '@/hooks/useRoleAccess'
import { attendanceService } from '@/services/database/attendanceService'
import { eventService } from '@/services/database/eventService'
import { supabase } from '@/lib/supabase'
import type { Event } from '@/types'
import { ArrowLeft, Camera, Search, CheckCircle2, XCircle, AlertTriangle, QrCode } from 'lucide-react'
import { Button } from '@/components/shared/Button'
import toast from 'react-hot-toast'

type ScanResult = {
  type: 'success' | 'warning' | 'error'
  message: string
  userName?: string
}

export function ScannerMode() {
  const router = useRouter()
  const user = useAuthStore(state => state.user)
  const { canScanQR } = useRoleAccess()

  const [events, setEvents] = useState<Event[]>([])
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [scanning, setScanning] = useState(false)
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [scanPaused, setScanPaused] = useState(false)
  const [manualSearch, setManualSearch] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [checkedInCount, setCheckedInCount] = useState(0)

  const scannerRef = useRef<any>(null)
  const scannerContainerRef = useRef<HTMLDivElement>(null)

  // Redirect if not authorized
  useEffect(() => {
    if (user && !canScanQR) {
      router.replace('/dashboard')
    }
  }, [user, canScanQR, router])

  // Load events the user can scan for
  useEffect(() => {
    loadEvents()
  }, [])

  const loadEvents = async () => {
    try {
      const upcoming = await eventService.getUpcoming(60)
      setEvents(upcoming)
    } catch {
      // Fail silently
    }
  }

  // Start camera scanning when event is selected
  useEffect(() => {
    if (selectedEvent && !scanning) {
      startScanner()
    }
    return () => {
      stopScanner()
    }
  }, [selectedEvent])

  const startScanner = async () => {
    if (!scannerContainerRef.current || scanning) return

    try {
      // Dynamically import html5-qrcode to avoid SSR issues
      const { Html5Qrcode } = await import('html5-qrcode')

      const scanner = new Html5Qrcode('qr-scanner-container')
      scannerRef.current = scanner

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        onScanSuccess,
        () => {} // Ignore scan failures (no QR detected yet)
      )

      setScanning(true)
    } catch (err: any) {
      toast.error('Camera access denied. Please allow camera permissions.')
    }
  }

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop()
        scannerRef.current.clear()
      } catch {
        // Ignore cleanup errors
      }
      scannerRef.current = null
      setScanning(false)
    }
  }

  const onScanSuccess = useCallback(async (decodedText: string) => {
    if (scanPaused || !selectedEvent || !user) return

    // Pause scanning for 2 seconds
    setScanPaused(true)

    try {
      // Step 1: Parse
      let payload: { eventId: string; userId: string; ticketId: string; timestamp: string }
      try {
        payload = JSON.parse(decodedText)
      } catch {
        setScanResult({ type: 'error', message: 'Invalid QR code' })
        playSound('error')
        setTimeout(() => { setScanPaused(false); setScanResult(null) }, 2000)
        return
      }

      // Step 2: Event match
      if (payload.eventId !== selectedEvent.id) {
        setScanResult({ type: 'error', message: 'Wrong event ticket' })
        playSound('error')
        setTimeout(() => { setScanPaused(false); setScanResult(null) }, 2000)
        return
      }

      // Step 3-6: Check registration, already checked in, and record
      const result = await attendanceService.checkInByQr(
        payload.eventId,
        payload.userId,
        payload.ticketId,
        user.id
      )

      setScanResult({
        type: 'success',
        message: `✅ ${result.userName} checked in`,
        userName: result.userName,
      })
      setCheckedInCount(c => c + 1)
      playSound('success')

    } catch (err: any) {
      const msg = err.message || ''

      if (msg === 'TICKET_NOT_FOUND') {
        setScanResult({ type: 'error', message: 'Ticket not found' })
        playSound('error')
      } else if (msg.startsWith('ALREADY_CHECKED_IN:')) {
        const name = msg.split(':')[1]
        setScanResult({
          type: 'warning',
          message: `Already checked in — ${name}`,
          userName: name,
        })
        playSound('warning')
      } else {
        setScanResult({ type: 'error', message: msg || 'Scan failed' })
        playSound('error')
      }
    }

    setTimeout(() => {
      setScanPaused(false)
      setScanResult(null)
    }, 2500)
  }, [scanPaused, selectedEvent, user])

  const playSound = (type: 'success' | 'warning' | 'error') => {
    try {
      const ctx = new AudioContext()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      gain.gain.value = 0.15

      if (type === 'success') {
        osc.frequency.value = 880
        osc.type = 'sine'
      } else if (type === 'warning') {
        osc.frequency.value = 440
        osc.type = 'triangle'
      } else {
        osc.frequency.value = 220
        osc.type = 'square'
      }

      osc.start()
      osc.stop(ctx.currentTime + 0.15)
    } catch {
      // Web Audio may not be available
    }
  }

  // Manual search fallback
  const handleManualSearch = async () => {
    if (!manualSearch.trim() || !selectedEvent) return
    setSearchLoading(true)

    try {
      const { data } = await supabase
        .from('event_registrations')
        .select(`
          id, ticket_id, checked_in, user_id,
          profiles!inner(full_name, email)
        `)
        .eq('event_id', selectedEvent.id)
        .or(`full_name.ilike.%${manualSearch}%,email.ilike.%${manualSearch}%`, { referencedTable: 'profiles' })

      setSearchResults(data || [])
    } catch {
      toast.error('Search failed')
    } finally {
      setSearchLoading(false)
    }
  }

  const handleManualCheckIn = async (registration: any) => {
    if (!user || !selectedEvent) return

    try {
      await attendanceService.checkInByQr(
        selectedEvent.id,
        registration.user_id,
        registration.ticket_id,
        user.id
      )
      toast.success(`✅ ${registration.profiles.full_name} checked in`)
      setCheckedInCount(c => c + 1)
      // Update local state
      setSearchResults(prev =>
        prev.map(r => r.id === registration.id ? { ...r, checked_in: true } : r)
      )
    } catch (err: any) {
      const msg = err.message || ''
      if (msg.startsWith('ALREADY_CHECKED_IN:')) {
        toast(`Already checked in — ${msg.split(':')[1]}`, { icon: '⚠️' })
      } else {
        toast.error(msg || 'Check-in failed')
      }
    }
  }

  if (!canScanQR) return null

  // Event selection screen
  if (!selectedEvent) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <QrCode className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">QR Scanner</h1>
              <p className="text-sm text-muted-foreground">Select an event to start scanning tickets</p>
            </div>
          </div>

          {events.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <Camera className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>No upcoming events to scan for</p>
            </div>
          ) : (
            <div className="space-y-3">
              {events.map(event => (
                <button
                  key={event.id}
                  onClick={() => setSelectedEvent(event)}
                  className="w-full text-left bg-card border border-border rounded-xl p-4 hover:border-primary/50 hover:shadow-soft transition-all group"
                >
                  <p className="font-semibold group-hover:text-primary transition-colors">{event.title}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {event.date} · {event.time} · {event.venueName}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Scanner active screen
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/80 backdrop-blur-sm z-20 relative">
        <button
          onClick={() => { stopScanner(); setSelectedEvent(null) }}
          className="flex items-center gap-2 text-white/70 hover:text-white text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="text-center">
          <p className="text-sm font-semibold truncate max-w-[200px]">{selectedEvent.title}</p>
          <p className="text-xs text-white/50">{checkedInCount} checked in</p>
        </div>
        <div className="w-16" /> {/* Spacer for centering */}
      </div>

      {/* Camera feed */}
      <div className="flex-1 relative flex items-center justify-center">
        <div
          id="qr-scanner-container"
          ref={scannerContainerRef}
          className="w-full h-full"
          style={{ minHeight: '400px' }}
        />

        {/* Scan frame overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="w-64 h-64 relative">
            {/* Corner brackets */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white/80 rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white/80 rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white/80 rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white/80 rounded-br-lg" />
          </div>
        </div>

        {/* Scan result overlay */}
        {scanResult && (
          <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/60 backdrop-blur-sm">
            <div className="text-center p-8 animate-in fade-in zoom-in duration-200">
              {scanResult.type === 'success' && (
                <CheckCircle2 className="w-20 h-20 text-emerald-400 mx-auto mb-4" />
              )}
              {scanResult.type === 'warning' && (
                <AlertTriangle className="w-20 h-20 text-amber-400 mx-auto mb-4" />
              )}
              {scanResult.type === 'error' && (
                <XCircle className="w-20 h-20 text-red-400 mx-auto mb-4" />
              )}
              <p className="text-xl font-bold">{scanResult.message}</p>
            </div>
          </div>
        )}
      </div>

      {/* Manual search section */}
      <div className="bg-slate-900 p-4 z-20 relative border-t border-white/10">
        <p className="text-xs text-white/40 mb-2 text-center">
          Manual check-in fallback
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={manualSearch}
            onChange={e => setManualSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleManualSearch()}
            className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <Button
            onClick={handleManualSearch}
            loading={searchLoading}
            size="sm"
            className="bg-white/10 hover:bg-white/20 border border-white/20"
          >
            <Search className="w-4 h-4" />
          </Button>
        </div>

        {/* Search results */}
        {searchResults.length > 0 && (
          <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
            {searchResults.map((reg: any) => (
              <div
                key={reg.id}
                className="flex items-center justify-between bg-white/5 rounded-lg px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium">{reg.profiles?.full_name}</p>
                  <p className="text-xs text-white/40">{reg.profiles?.email}</p>
                </div>
                {reg.checked_in ? (
                  <span className="text-xs text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Done
                  </span>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handleManualCheckIn(reg)}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs"
                  >
                    Check In
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
