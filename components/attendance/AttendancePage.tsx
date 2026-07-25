'use client'
import { useState } from 'react'
import { AppLayout } from '@/components/shared/AppLayout'
import { Button } from '@/components/shared/Button'
import { Input } from '@/components/shared/Input'
import { QrCode, Keyboard, Camera } from 'lucide-react'
import toast from 'react-hot-toast'

export function AttendancePage() {
  const [code, setCode] = useState('')
  const [mode, setMode] = useState<'select' | 'qr' | 'code'>('select')

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (code.length !== 6) {
      toast.error('Code must be 6 characters')
      return
    }
    // Simulate attendance logic since we don't have event selection implemented in this quick stub
    toast.success('Attendance code submitted successfully!')
    setCode('')
    setMode('select')
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-md">
        <h1 className="text-3xl font-bold mb-8 text-center">Check In</h1>
        
        {mode === 'select' && (
          <div className="space-y-4">
            <Button className="w-full h-24 text-lg" variant="outline" onClick={() => setMode('qr')}>
              <Camera className="w-8 h-8 mr-4" /> Scan QR Code
            </Button>
            <Button className="w-full h-24 text-lg" variant="outline" onClick={() => setMode('code')}>
              <Keyboard className="w-8 h-8 mr-4" /> Enter 6-Digit Code
            </Button>
          </div>
        )}

        {mode === 'code' && (
          <form onSubmit={handleCodeSubmit} className="space-y-4">
            <div className="text-center mb-6">
              <Keyboard className="w-12 h-12 mx-auto text-primary mb-4" />
              <p className="text-muted-foreground">Enter the 6-digit code displayed by the event coordinator.</p>
            </div>
            <Input 
              value={code} 
              onChange={(e) => setCode(e.target.value.toUpperCase())} 
              placeholder="e.g. A1B2C3" 
              maxLength={6} 
              className="text-center text-2xl tracking-widest uppercase"
            />
            <Button type="submit" className="w-full">Submit Code</Button>
            <Button type="button" variant="ghost" className="w-full" onClick={() => setMode('select')}>Cancel</Button>
          </form>
        )}

        {mode === 'qr' && (
          <div className="text-center space-y-4">
            <QrCode className="w-12 h-12 mx-auto text-primary mb-4" />
            <p className="text-muted-foreground">Camera access is required to scan QR codes. This feature will be implemented soon.</p>
            <div className="w-full aspect-square bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border">
              Camera Viewfinder
            </div>
            <Button type="button" variant="ghost" className="w-full" onClick={() => setMode('select')}>Cancel</Button>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
