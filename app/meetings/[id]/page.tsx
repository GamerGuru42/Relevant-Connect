import { MeetingRoom } from '@/components/meetings/MeetingRoom'
import { meetingService } from '@/services/database/meetingService'
import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const meeting = await meetingService.getById(params.id).catch(() => null)
  return {
    title: meeting ? `${meeting.title} | Relevant+` : 'Meeting Not Found',
  }
}

export default function MeetingRoomRoute({ params }: { params: { id: string } }) {
  return <MeetingRoom meetingId={params.id} />
}
