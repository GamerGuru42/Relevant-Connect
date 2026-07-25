'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { announcementService } from '@/services/database/announcementService'
import type { Announcement } from '@/types'
import { AppLayout } from '@/components/shared/AppLayout'
import { Button } from '@/components/shared/Button'
import { ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'

export default function AnnouncementDetail() {
  const params = useParams()
  const router = useRouter()
  const [ann, setAnn] = useState<Announcement | null>(null)

  useEffect(() => {
    if (params.id) {
      announcementService.getById(params.id as string).then(setAnn)
    }
  }, [params.id])

  if (!ann) return <AppLayout><div className="p-8">Loading...</div></AppLayout>

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Button variant="ghost" className="mb-6" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        {ann.imageUrl && <img src={ann.imageUrl} alt={ann.title} className="w-full rounded-lg mb-6 max-h-96 object-cover" />}
        <div className="flex items-center gap-2 mb-4">
          <span className="bg-primary/10 text-primary px-3 py-1 rounded-sm text-sm font-semibold capitalize">{ann.category}</span>
          {ann.publishAt && <span className="text-muted-foreground text-sm">{format(new Date(ann.publishAt), 'MMMM d, yyyy')}</span>}
        </div>
        <h1 className="text-4xl font-bold mb-6">{ann.title}</h1>
        <div className="prose dark:prose-invert max-w-none">
          {ann.body.split('\n').map((para, i) => <p key={i} className="mb-4">{para}</p>)}
        </div>
      </div>
    </AppLayout>
  )
}
