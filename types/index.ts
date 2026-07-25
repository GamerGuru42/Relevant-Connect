// Auth Types
export interface AuthUser {
  id: string
  fullName: string
  email: string
  phone: string | null
  photoUrl: string | null
  role: 'member' | 'admin'
  membershipStatus: 'visitor' | 'new_convert' | 'member' | 'worker'
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
