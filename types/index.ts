// Auth Types
export interface AuthUser {
  id: string
  fullName: string
  email: string
  phone: string | null
  photoUrl: string | null
  role: 'member' | 'admin' // Kept for backwards compatibility during transition
  appRole: 'super_admin' | 'department_head' | 'worker' | 'member'
  membershipStatus: 'visitor' | 'new_convert' | 'member' | 'worker'
  isOnboarded: boolean
  department: string | null
  createdAt: Date
  updatedAt: Date
}

// Church Info
export interface ChurchInfo {
  id: string
  churchName: string
  pastorName: string
  address: string
  contactPhone: string
  contactEmail: string
  serviceTimes: string
  aboutText: string
  logoUrl: string | null
  primaryColor: string | null
  secondaryColor: string | null
  todayScripture: string | null
  isLive: boolean
  liveStreamUrl: string | null
  liveStreamPlatform: string | null
  updatedBy: string
  updatedAt: Date
}

// Announcements
export interface Announcement {
  id: string
  title: string
  body: string
  imageUrl: string | null
  category: 'general' | 'youth' | 'choir' | 'workers' | 'cell_ministry' | 'special_events'
  publishAt: Date | null
  createdBy: string
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export interface CreateAnnouncementInput {
  title: string
  body: string
  imageUrl?: string | null
  category: string
  publishAt?: Date | null
}

export interface UpdateAnnouncementInput extends CreateAnnouncementInput {
  id: string
}

// Events
export interface EventRegistration {
  id: string
  eventId: string
  userId: string
  registeredAt: Date
  updatedAt: Date
  qrCodeData: string | null
  ticketId: string
  checkedIn: boolean
  checkedInAt: Date | null
}

export interface Event {
  id: string
  title: string
  description: string
  category: 'service' | 'midweek' | 'prayer_meeting' | 'conference' | 'special_programme' | 'youth' | 'cell_meeting'
  date: string // ISO date
  time: string // HH:mm format
  venueName: string
  venueAddress: string
  venueMapLink: string | null
  speaker: string | null
  registrationLimit: number | null
  posterUrl: string | null
  publishAt: Date | null
  createdBy: string
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
  registrationCount?: number
}

export interface CreateEventInput {
  title: string
  description: string
  category: string
  date: string
  time: string
  venueName: string
  venueAddress: string
  venueMapLink?: string | null
  speaker?: string | null
  registrationLimit?: number | null
  posterUrl?: string | null
  publishAt?: Date | null
}

export interface UpdateEventInput extends CreateEventInput {
  id: string
}

// Attendance
export interface AttendanceRecord {
  id: string
  eventId: string
  userId: string
  method: 'qr' | 'code' | 'manual'
  recordedBy: string | null
  timestamp: Date
  updatedAt: Date
}

export interface AttendanceCode {
  eventId: string
  code: string
  generatedAt: Date
}

// Notifications
export interface Notification {
  id: string
  userId: string
  type: 'announcement' | 'event' | 'reminder'
  title: string
  body: string
  linkTo: string | null
  read: boolean
  createdAt: Date
  updatedAt: Date
}

// Activity Log
export interface ActivityLog {
  id: string
  userId: string
  action: 'created' | 'edited' | 'deleted' | 'promoted'
  entity: 'announcement' | 'event' | 'attendance' | 'user'
  entityId: string
  entityLabel: string
  timestamp: Date
}

// Themes/Branding
export interface Theme {
  primary: string
  secondary: string
  background: string
  foreground: string
  accent: string
}

// Meetings
export interface Meeting {
  id: string
  title: string
  description: string | null
  meetingUrl: string
  platform: 'google_meet' | 'zoom' | 'teams' | 'jitsi' | 'other'
  hostName: string
  hostId: string
  department: string | null
  targetAudience: 'department' | 'all'
  isActive: boolean
  date: string
  time: string
  durationMinutes: number
  notes: string | null
  recordingUrl: string | null
  timerEndAt: Date | null
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateMeetingInput {
  title: string
  description?: string
  meetingUrl: string
  platform: string
  hostName: string
  hostId: string
  department?: string | null
  targetAudience: 'department' | 'all'
  date: string
  time: string
  durationMinutes?: number
}
