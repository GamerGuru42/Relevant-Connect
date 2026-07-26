import { AppLayout } from '@/components/shared/AppLayout'
import { AttendPage } from '@/components/attendance/AttendPage'

export const metadata = {
  title: 'Check In - Relevant+',
  description: 'Check in to an event',
}

export default function AttendRoute({ params }: { params: { id: string } }) {
  return (
    <AppLayout>
      <AttendPage eventId={params.id} />
    </AppLayout>
  )
}
