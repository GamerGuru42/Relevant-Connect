# Relevant+ Development Instructions

## Project Overview

Relevant+ is a modern, responsive church management platform built with Next.js, React, TypeScript, and Firebase. The application is being developed in phases according to the detailed specification provided.

## Current Phase: Phase 1

### Completed Features
- ✅ Project scaffolding and setup
- ✅ Authentication (Email/Password, Google OAuth)
- ✅ Landing page with church info
- ✅ Basic dashboard structure
- ✅ UI component library (Button, Input, etc.)
- ✅ Zustand state management
- ✅ Firebase integration

### In Progress / Planned
- ⏳ Member profiles
- ⏳ Announcements (CRUD)
- ⏳ Events and calendar
- ⏳ Event registration
- ⏳ Attendance tracking (QR + code)
- ⏳ Notifications
- ⏳ Admin dashboard
- ⏳ Activity logging

## Building Instructions

### 1. Development Setup

```bash
cd "c:\Users\Benny Ben\Documents\Relevant+"

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Fill in Firebase credentials
```

### 2. Running Development Server

```bash
npm run dev
# Open http://localhost:3000
```

### 3. Build and Deployment

```bash
# Build for production
npm run build

# Start production server
npm start

# Deploy to Vercel
vercel deploy --prod
```

## Code Style Guidelines

- **TypeScript**: Strict mode, no implicit any
- **Components**: Use React Functional Components with Hooks
- **Naming**: camelCase for files/variables, PascalCase for components
- **Folders**: Feature-based structure (by domain, not by type)
- **Styling**: Tailwind CSS with shadcn/ui components
- **State**: Zustand for global state, React Hook Form for forms
- **Type Safety**: All types exported from `@/types/index.ts`

## Feature Development Checklist

When building a new feature:

1. **Define Types** - Add types to `@/types/index.ts`
2. **Create Service** - Add business logic to `@/services/`
3. **Build Components** - Feature-specific components in `@/components/`
4. **Add Shared UI** - Reusable components in `@/components/shared/`
5. **Create Pages** - Add routes in `@/app/`
6. **Add Forms** - Use React Hook Form with Zod validation
7. **Handle Loading States** - Show loading spinners, empty states
8. **Test Responsiveness** - Mobile-first design
9. **Add Error Boundaries** - Graceful error handling
10. **Document** - Add JSDoc comments for complex functions

## Firestore Security Rules

All security rules are enforced at the data layer. Key principles:

- Public can read published/non-deleted content
- Admins can read/write everything
- Users can only read/write their own data (with exceptions)
- Soft deletes enforce `deletedAt IS NULL` in queries

## Deployment Checklist

Before deploying to production:

- [ ] Environment variables configured in Vercel
- [ ] Firestore security rules are correct
- [ ] Firebase project is in production mode
- [ ] Google OAuth redirect URIs are updated
- [ ] All TypeScript errors resolved
- [ ] Mobile responsiveness tested
- [ ] Dark mode tested
- [ ] Forms validated on client and server
- [ ] Error handling in place

## Useful Commands

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Build
npm run build

# Development
npm run dev

# Production start
npm start
```

## File Organization

```
relevant-plus/
├── app/                  # Next.js app router
├── components/           # React components (feature-based)
├── lib/                  # Configurations and utilities
├── services/             # Business logic
├── store/                # Zustand stores
├── types/                # TypeScript types
├── hooks/                # Custom React hooks
├── constants/            # Enums and constants
└── utils/                # Helper functions
```

## Next Steps

1. Test the build: `npm run build`
2. Start dev server: `npm run dev`
3. Create Firebase project and add credentials
4. Build features according to build order:
   - Module 3: Member profile
   - Module 4: Announcements
   - Module 5: Events
   - Module 6: Event registration
   - Module 7: Attendance
   - Module 8: Notifications
   - Module 9: Dashboard
   - Module 10: Admin tools

## Resources

- [Spec Document](./BUILD_SPEC.md)
- [Database Schema](./SCHEMA.md)
- [API Documentation](./API.md) (when created)
- [Deployment Guide](./DEPLOYMENT.md) (when created)
