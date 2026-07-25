'use client'

import { useState, useEffect } from 'react'
import { announcementService } from '@/services/database/announcementService'
import type { Announcement } from '@/types'
import { AppLayout } from '@/components/shared/AppLayout'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { format } from 'date-fns'
import { ArrowRight } from 'lucide-react'

export function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAnns = async () => {
      try {
        const data = await announcementService.getPublished()
        setAnnouncements(data)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    fetchAnns()
  }, [])

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">Announcements</h1>
        {loading ? (
          <p>Loading announcements...</p>
        ) : announcements.length === 0 ? (
          <p className="text-muted-foreground">No announcements available.</p>
        ) : (
          <div className="grid gap-6">
            {announcements.map((ann, i) => (
              <motion.div key={ann.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-card border border-border rounded-lg shadow-soft overflow-hidden flex flex-col md:flex-row">
                {ann.imageUrl && (
                  <div className="md:w-1/3 h-48 md:h-auto bg-muted">
                    <img src={ann.imageUrl} alt={ann.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-primary/10 text-primary px-2 py-1 rounded-sm text-xs font-semibold capitalize">{ann.category}</span>
                      {ann.publishAt && <span className="text-muted-foreground text-xs">{format(new Date(ann.publishAt), 'MMM d, yyyy')}</span>}
                    </div>
                    <h2 className="text-xl font-bold mb-2">{ann.title}</h2>
                    <p className="text-muted-foreground line-clamp-2 mb-4">{ann.body}</p>
                  </div>
                  <Link href={`/announcements/${ann.id}`} className="text-primary font-medium flex items-center hover:underline">
                    Read more <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
