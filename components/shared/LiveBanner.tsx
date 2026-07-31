import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Video, X } from 'lucide-react'
import { churchInfoService } from '@/services/database/churchInfoService'
import { supabase } from '@/lib/supabase'

export function LiveBanner() {
  const [isLive, setIsLive] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // 1. Initial Fetch
    const fetchLiveStatus = async () => {
      try {
        const info = await churchInfoService.get()
        if (info) {
          setIsLive(info.isLive)
        }
      } catch (error) {
        console.error('Failed to fetch live status:', error)
      }
    }
    
    fetchLiveStatus()

    // 2. Realtime Subscription
    const subscription = supabase
      .channel('church_info_live')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'church_info' 
      }, (payload) => {
        setIsLive(payload.new.is_live ?? false)
        // If it goes live again, reset dismissed state
        if (payload.new.is_live && !isLive) {
          setDismissed(false)
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [isLive])

  if (!isLive || dismissed) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="bg-red-600 text-white relative z-50 shadow-md"
      >
        <div className="container mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link href="/live" className="flex items-center gap-3 flex-1 hover:opacity-90 transition-opacity">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-300 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
            </span>
            <div className="flex items-center gap-2">
              <Video className="w-5 h-5 hidden sm:block" />
              <span className="font-bold tracking-wide uppercase text-sm sm:text-base">We are Live!</span>
              <span className="hidden sm:inline-block px-2 py-0.5 bg-black/20 rounded-md text-xs font-semibold ml-2">
                Join the Service
              </span>
            </div>
          </Link>
          
          <button 
            onClick={() => setDismissed(true)}
            className="p-1.5 hover:bg-black/20 rounded-full transition-colors flex-shrink-0 ml-4"
            aria-label="Dismiss banner"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
