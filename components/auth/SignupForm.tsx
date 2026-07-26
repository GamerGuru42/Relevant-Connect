'use client'

import { LoginForm } from './LoginForm'

export function SignupForm() {
  // With Google-only auth, signup and login are the same flow
  return <LoginForm />
}
