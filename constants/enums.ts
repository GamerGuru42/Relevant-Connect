// Roles
export const ROLES = {
  MEMBER: 'member',
  ADMIN: 'admin',
} as const

export const ROLE_OPTIONS = [
  { value: 'member', label: 'Member' },
  { value: 'admin', label: 'Admin' },
] as const

// Membership Status
export const MEMBERSHIP_STATUS = {
  VISITOR: 'visitor',
  NEW_CONVERT: 'new_convert',
  MEMBER: 'member',
  WORKER: 'worker',
} as const

export const MEMBERSHIP_STATUS_OPTIONS = [
  { value: 'visitor', label: 'Visitor' },
  { value: 'new_convert', label: 'New Convert' },
  { value: 'member', label: 'Member' },
  { value: 'worker', label: 'Worker' },
] as const

// Announcement Categories
export const ANNOUNCEMENT_CATEGORIES = {
  GENERAL: 'general',
  YOUTH: 'youth',
  CHOIR: 'choir',
  WORKERS: 'workers',
  CELL_MINISTRY: 'cell_ministry',
  SPECIAL_EVENTS: 'special_events',
} as const

export const ANNOUNCEMENT_CATEGORY_OPTIONS = [
  { value: 'general', label: 'General' },
  { value: 'youth', label: 'Youth' },
  { value: 'choir', label: 'Choir' },
  { value: 'workers', label: 'Workers' },
  { value: 'cell_ministry', label: 'Cell Ministry' },
  { value: 'special_events', label: 'Special Events' },
] as const

// Event Categories
export const EVENT_CATEGORIES = {
  SERVICE: 'service',
  MIDWEEK: 'midweek',
  PRAYER_MEETING: 'prayer_meeting',
  CONFERENCE: 'conference',
  SPECIAL_PROGRAMME: 'special_programme',
  YOUTH: 'youth',
  CELL_MEETING: 'cell_meeting',
} as const

export const EVENT_CATEGORY_OPTIONS = [
  { value: 'service', label: 'Service' },
  { value: 'midweek', label: 'Midweek' },
  { value: 'prayer_meeting', label: 'Prayer Meeting' },
  { value: 'conference', label: 'Conference' },
  { value: 'special_programme', label: 'Special Programme' },
  { value: 'youth', label: 'Youth' },
  { value: 'cell_meeting', label: 'Cell Meeting' },
] as const

// Notification Types
export const NOTIFICATION_TYPES = {
  ANNOUNCEMENT: 'announcement',
  EVENT: 'event',
  REMINDER: 'reminder',
} as const

// Attendance Methods
export const ATTENDANCE_METHODS = {
  QR: 'qr',
  CODE: 'code',
  MANUAL: 'manual',
} as const

// Activity Log Actions
export const ACTIVITY_LOG_ACTIONS = {
  CREATED: 'created',
  EDITED: 'edited',
  DELETED: 'deleted',
  PROMOTED: 'promoted',
} as const

export const ACTIVITY_LOG_ENTITIES = {
  ANNOUNCEMENT: 'announcement',
  EVENT: 'event',
  ATTENDANCE: 'attendance',
  USER: 'user',
} as const

// Announcement Status (derived from publishAt)
export const ANNOUNCEMENT_STATUS = {
  DRAFT: 'draft',
  SCHEDULED: 'scheduled',
  PUBLISHED: 'published',
} as const

// Event Status (derived from publishAt)
export const EVENT_STATUS = {
  DRAFT: 'draft',
  SCHEDULED: 'scheduled',
  PUBLISHED: 'published',
} as const

// Image upload
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

// Departments
export const DEPARTMENTS = {
  CHOIR: 'choir',
  MEDIA: 'media',
  USHERING: 'ushering',
  PROTOCOL: 'protocol',
  CHILDREN_MINISTRY: 'children_ministry',
  SECURITY: 'security',
  TECHNICAL: 'technical',
  WELFARE: 'welfare',
  PRAYER: 'prayer',
  EVANGELISM: 'evangelism',
} as const

export const DEPARTMENT_OPTIONS = [
  { value: 'choir', label: 'Choir' },
  { value: 'media', label: 'Media' },
  { value: 'ushering', label: 'Ushering' },
  { value: 'protocol', label: 'Protocol' },
  { value: 'children_ministry', label: "Children's Ministry" },
  { value: 'security', label: 'Security' },
  { value: 'technical', label: 'Technical' },
  { value: 'welfare', label: 'Welfare' },
  { value: 'prayer', label: 'Prayer' },
  { value: 'evangelism', label: 'Evangelism' },
] as const

// Meeting Platforms
export const MEETING_PLATFORM_OPTIONS = [
  { value: 'google_meet', label: 'Google Meet' },
  { value: 'zoom', label: 'Zoom' },
  { value: 'teams', label: 'Microsoft Teams' },
  { value: 'other', label: 'Other' },
] as const
