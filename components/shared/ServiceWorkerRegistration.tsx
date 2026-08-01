'use client'

import { useEffect } from 'react'
import toast from 'react-hot-toast'

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Reload the page when the service worker controller changes (i.e., new SW takes over)
      let refreshing = false
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return
        refreshing = true
        toast.loading('App updated! Reloading...', { duration: 2000 })
        setTimeout(() => window.location.reload(), 1500)
      })

      window.addEventListener('load', async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js')
          
          // Check for updates on load and periodically
          registration.update()

          // Check for updates when window regains focus
          window.addEventListener('focus', () => {
            registration.update()
          })
          
          // Poll every hour just in case
          setInterval(() => {
            registration.update()
          }, 1000 * 60 * 60)

          const listenForWaitingServiceWorker = (reg: ServiceWorkerRegistration) => {
            const promptUserToUpdate = (worker: ServiceWorker) => {
              toast.custom((t) => (
                <div className="bg-card border border-border shadow-lg rounded-lg p-4 flex items-center gap-4">
                  <span className="text-sm font-medium">Update available.</span>
                  <button
                    onClick={() => {
                      toast.dismiss(t.id)
                      worker.postMessage({ type: 'SKIP_WAITING' })
                    }}
                    className="bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-xs font-bold hover:bg-primary/90"
                  >
                    Refresh
                  </button>
                </div>
              ), { duration: Infinity, id: 'sw-update' })
            }

            const awaitStateChange = () => {
              reg.installing?.addEventListener('statechange', function () {
                if (this.state === 'installed' && navigator.serviceWorker.controller) {
                  promptUserToUpdate(this)
                }
              })
            }

            if (!reg.waiting) {
              if (reg.installing) awaitStateChange()
              reg.addEventListener('updatefound', awaitStateChange)
            } else {
              promptUserToUpdate(reg.waiting)
            }
          }

          listenForWaitingServiceWorker(registration)

        } catch (err) {
          console.log('SW registration failed:', err)
        }
      })
    }
  }, [])

  return null
}
