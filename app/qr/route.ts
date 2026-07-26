import { redirect } from 'next/navigation'

export async function GET() {
  // Currently redirects to the web app homepage.
  // In the future, this can be updated to redirect to an App Store link, 
  // Linktree, or specific event page without needing to reprint the physical QR code.
  redirect('/')
}
