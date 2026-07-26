import { meetingService } from '@/services/database/meetingService'
import { AppLayout } from '@/components/shared/AppLayout'
import { format } from 'date-fns'
import { Video, Calendar, Clock, User, ExternalLink } from 'lucide-react'
import { notFound } from 'next/navigation'
import type { Metadata, ResolvingMetadata } from 'next'

type Props = {
  params: { id: string }
}

export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
  const meeting = await meetingService.getById(params.id).catch(() => null)
  
  if (!meeting) {
    return { title: 'Meeting Not Found' }
  }

  return {
    title: `${meeting.title} - Relevant+`,
    description: `Join ${meeting.hostName} for ${meeting.title} on ${format(new Date(meeting.date), 'MMM do')} at ${meeting.time}`,
    openGraph: {
      title: meeting.title,
      description: `Join ${meeting.hostName} on ${format(new Date(meeting.date), 'MMM do')} at ${meeting.time}`,
      type: 'website',
    }
  }
}

export default async function MeetingLobbyRoute({ params }: Props) {
  const meeting = await meetingService.getById(params.id).catch(() => null)

  if (!meeting) {
    notFound()
  }

  return (
    <AppLayout>
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="max-w-xl w-full bg-card border border-border rounded-3xl p-8 shadow-2xl relative overflow-hidden text-center">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/10 rounded-full blur-3xl -ml-32 -mb-32"></div>
          
          <div className="relative z-10">
            <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-lg">
              <Video className="w-10 h-10" />
            </div>
            
            <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-widest mb-4">
              Virtual Meeting
            </span>
            
            <h1 className="text-3xl font-extrabold mb-4">{meeting.title}</h1>
            
            {meeting.description && (
              <p className="text-muted-foreground mb-8 text-lg">{meeting.description}</p>
            )}
            
            <div className="bg-muted/50 rounded-2xl p-6 border border-border mb-8 text-left space-y-4">
              <div className="flex items-center text-foreground font-medium">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-4">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Date</div>
                  {format(new Date(meeting.date), 'EEEE, MMMM do, yyyy')}
                </div>
              </div>
              <div className="flex items-center text-foreground font-medium">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-4">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Time</div>
                  {meeting.time} <span className="text-muted-foreground font-normal">({meeting.durationMinutes} mins)</span>
                </div>
              </div>
              <div className="flex items-center text-foreground font-medium">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-4">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Host</div>
                  {meeting.hostName}
                </div>
              </div>
            </div>
            
            <a 
              href={meeting.meetingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-3 w-full py-5 bg-primary text-white text-xl font-bold rounded-2xl shadow-lg hover:shadow-xl hover:bg-primary/90 transition-all transform hover:-translate-y-1"
            >
              Join Meeting Now <ExternalLink className="w-6 h-6" />
            </a>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
