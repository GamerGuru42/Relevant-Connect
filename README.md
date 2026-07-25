# Relevant+ - Church Management Platform

A modern, responsive web application for church management built with Next.js, React, TypeScript, and Supabase.

## 🚀 Features

### Phase 1 (Current)
- **Authentication**: Email/Password and Google OAuth login/signup
- **Landing Page**: Public-facing homepage with church information
- **Member Dashboard**: Personalized dashboard for logged-in members
- **Church Info Settings**: Admin settings for church details and branding
- **Announcements**: Create, edit, publish, and view announcements
- **Events Calendar**: Manage events with agenda and monthly grid views
- **Event Registration**: RSVP and manage event registrations
- **Attendance Tracking**: QR code and manual code-based attendance
- **Member Profiles**: View and edit personal profiles
- **Notifications**: In-app notification center
- **Admin Dashboard**: Overview and management tools for administrators
- **Activity Log**: Audit trail for admin actions

## 🛠 Tech Stack

- **Framework**: Next.js 14
- **Language**: TypeScript
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Database**: Supabase Postgres
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod
- **Notifications**: React Hot Toast
- **Theme**: Next Themes

## 📋 Prerequisites

- Node.js 18+ and npm/yarn
- Supabase project with:
  - Project URL and anon key
  - Authentication (Email/Password and Google OAuth)
  - Storage enabled

## 🔧 Setup

### 1. Clone and Install

```bash
cd Relevant+
npm install
```

### 2. Supabase Configuration

Create a `.env.local` file in the root directory and add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

NEXT_PUBLIC_APP_NAME=Relevant+
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Supabase Setup

#### Firestore Security Rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Public read for church info and published content
    match /settings/churchInfo {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }

    // Users collection
    match /users/{userId} {
      allow read: if request.auth.uid == userId || request.auth.token.admin == true;
      allow write: if request.auth.uid == userId;
      allow create: if request.auth.uid == userId;
    }

    // Announcements
    match /announcements/{document=**} {
      // Members can read published
      allow read: if resource.data.publishAt <= request.time && !resource.data.deletedAt;
      // Admins can read all
      allow read: if request.auth.token.admin == true;
      allow write: if request.auth.token.admin == true;
    }

    // Events
    match /events/{document=**} {
      allow read: if resource.data.publishAt <= request.time && !resource.data.deletedAt;
      allow read: if request.auth.token.admin == true;
      allow write: if request.auth.token.admin == true;
    }

    // Event registrations
    match /eventRegistrations/{document=**} {
      allow read, write: if request.auth != null;
    }

    // Attendance
    match /attendance/{document=**} {
      allow read: if request.auth.token.admin == true;
      allow write: if request.auth != null;
    }

    // Notifications
    match /notifications/{userId}/notifications/{document=**} {
      allow read, write: if request.auth.uid == userId;
    }

    // Activity logs
    match /activityLogs/{document=**} {
      allow read: if request.auth.token.admin == true;
      allow write: if request.auth.token.admin == true;
    }
  }
}
```

#### Set Admin Custom Claims

For admin users, set custom claims in Firebase Console or via Firebase CLI:

```bash
firebase auth:import users.json --hash-algo=bcrypt
```

Or use Firebase Admin SDK to set custom claims on user creation.

## 🚀 Running the Application

```bash
# Development
npm run dev

# Production build
npm run build
npm start

# Type checking
npm run type-check
```

Visit `http://localhost:3000` in your browser.

## 📁 Project Structure

```
relevant-plus/
├── app/                          # Next.js app directory
│   ├── api/                      # API routes
│   ├── auth/                     # Auth pages
│   ├── dashboard/                # Dashboard pages
│   ├── landing/                  # Landing page
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Home page
│   └── globals.css               # Global styles
├── components/                   # React components
│   ├── auth/                     # Auth components
│   ├── announcements/            # Announcement components
│   ├── events/                   # Event components
│   ├── attendance/               # Attendance components
│   ├── profile/                  # Profile components
│   ├── notifications/            # Notification components
│   ├── admin/                    # Admin components
│   ├── landing/                  # Landing page components
│   ├── dashboard/                # Dashboard components
│   └── shared/                   # Shared UI components
├── lib/                          # Utilities and configurations
│   └── firebase.ts               # Firebase setup
├── services/                     # Business logic
│   ├── auth/                     # Auth service
│   └── database/                 # Database service
├── store/                        # Zustand stores
├── types/                        # TypeScript types
├── hooks/                        # Custom React hooks
├── utils/                        # Helper functions
├── constants/                    # Constants and enums
├── public/                       # Static assets
└── package.json
```

## 📝 Build Modules (Sequential Order)

1. ✅ Auth (signup/login)
2. ✅ Church Info settings + Landing page
3. ⏳ Member profile (view/edit)
4. ⏳ Announcements (CRUD + states)
5. ⏳ Events + Calendar
6. ⏳ Event registration
7. ⏳ Attendance system
8. ⏳ Notifications
9. ⏳ Dashboard
10. ⏳ Admin dashboard + Activity log

## 🌐 Deployment

### Vercel Deployment

1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

```bash
# One-click deployment
npm run build
vercel deploy --prod
```

### Environment Variables (Vercel)

Add all variables from `.env.local` to Vercel project settings:
- NEXT_PUBLIC_FIREBASE_API_KEY
- NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
- NEXT_PUBLIC_FIREBASE_PROJECT_ID
- NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
- NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
- NEXT_PUBLIC_FIREBASE_APP_ID
- NEXT_PUBLIC_APP_URL (production URL)

## 📚 Database Schema

### Users Collection
```typescript
{
  id: string (UUID)
  fullName: string
  email: string
  phone: string | null
  photoUrl: string | null
  role: 'member' | 'admin'
  membershipStatus: 'visitor' | 'new_convert' | 'member' | 'worker'
  createdAt: timestamp
  updatedAt: timestamp
}
```

### Announcements Collection
```typescript
{
  id: string (UUID)
  title: string
  body: string
  imageUrl: string | null
  category: enum
  publishAt: timestamp | null
  createdBy: userId
  createdAt: timestamp
  updatedAt: timestamp
  deletedAt: timestamp | null
}
```

### Events Collection
```typescript
{
  id: string (UUID)
  title: string
  description: string
  category: enum
  date: string (ISO date)
  time: string (HH:mm)
  venueName: string
  venueAddress: string
  venueMapLink: string | null
  speaker: string | null
  registrationLimit: number | null
  posterUrl: string | null
  publishAt: timestamp | null
  createdBy: userId
  createdAt: timestamp
  updatedAt: timestamp
  deletedAt: timestamp | null
}
```

See [SCHEMA.md](./SCHEMA.md) for complete database schema.

## 🔐 Security

- All authentication handled by Firebase
- Role-based access control at data layer
- Firestore security rules enforce permissions
- Soft deletes for data integrity
- Activity logging for audit trail

## 🎨 Customization

### Colors and Branding

Colors are defined in `tailwind.config.js` and can be customized via:
1. Church Info settings (logo, primary/secondary colors)
2. Theme variables in `app/globals.css`
3. `next-themes` for light/dark mode support

### Church Information

Update church details via admin settings:
- Church name, pastor name
- Address and contact info
- Service times
- Logo and colors
- About text
- Daily scripture

## 🐛 Troubleshooting

### Firebase Connection Issues
- Verify API keys in `.env.local`
- Check Firebase project settings
- Ensure Firestore database is in production mode
- Review Firebase security rules

### Build Errors
- Clear `.next` folder: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check TypeScript: `npm run type-check`

### Authentication Issues
- Clear browser cookies and localStorage
- Verify Firebase Auth providers are enabled
- Check Google OAuth redirect URIs

## 📖 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com)

## 📜 License

All rights reserved. Relevant+ is proprietary software for Relevant PCF (Christ Embassy).

## 🤝 Support

For issues, questions, or feature requests, please contact the development team.

---

**Status**: Phase 1 development in progress
**Last Updated**: January 2025
