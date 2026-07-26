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
            const awaitStateChange = () => {
              reg.installing?.addEventListener('statechange', function () {
                if (this.state === 'installed' && navigator.serviceWorker.controller) {
                  // A new service worker is installed and waiting.
                  // Tell it to skip waiting and activate immediately.
                  this.postMessage({ type: 'SKIP_WAITING' })
                }
              })
            }

            if (!reg.waiting) {
              // If there's already an installing worker, wait for state changes
              if (reg.installing) {
                awaitStateChange()
              }
              // Listen for new installing workers
              reg.addEventListener('updatefound', awaitStateChange)
            } else {
              // A worker is already waiting (maybe from a previous load)
              reg.waiting.postMessage({ type: 'SKIP_WAITING' })
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
