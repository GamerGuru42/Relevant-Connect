import { BookOpen, Calendar, Clock, LayoutDashboard, ScanLine, Settings, Users, Video } from 'lucide-react'

export default function HelpPage() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-foreground mb-4">How can we help?</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Learn how to use the Relevant+ app based on your role. If you need further assistance, please contact the church administration.
        </p>
      </div>

      <div className="space-y-12">
        {/* Member Section */}
        <section>
          <div className="flex items-center gap-3 mb-6 border-b border-border pb-4">
            <div className="w-10 h-10 rounded-full bg-accent/20 text-accent flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">For Members</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="font-semibold text-foreground flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-accent" /> Sign Up for Events
              </h3>
              <p className="text-sm text-muted-foreground">Go to the Events tab to see upcoming gatherings. Click {'"'}Sign Up{'"'} to secure your spot and get a QR code ticket.</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="font-semibold text-foreground flex items-center gap-2 mb-2">
                <Video className="w-4 h-4 text-accent" /> Join Meetings
              </h3>
              <p className="text-sm text-muted-foreground">View Virtual Meetings on your Home page. Click {'"'}Join{'"'} when a meeting goes live to connect via video.</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="font-semibold text-foreground flex items-center gap-2 mb-2">
                <BookOpen className="w-4 h-4 text-accent" /> Read the Bible
              </h3>
              <p className="text-sm text-muted-foreground">Access the built-in Bible from the main menu to read scripture, search passages, and follow reading plans.</p>
            </div>
          </div>
        </section>

        {/* Worker Section */}
        <section>
          <div className="flex items-center gap-3 mb-6 border-b border-border pb-4">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">For Workers</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="font-semibold text-foreground flex items-center gap-2 mb-2">
                <LayoutDashboard className="w-4 h-4 text-blue-500" /> Department Schedule
              </h3>
              <p className="text-sm text-muted-foreground">Your Home page displays events and meetings specifically for your department. Stay up-to-date with department announcements.</p>
            </div>
          </div>
        </section>

        {/* Department Head Section */}
        <section>
          <div className="flex items-center gap-3 mb-6 border-b border-border pb-4">
            <div className="w-10 h-10 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">For Department Heads</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="font-semibold text-foreground flex items-center gap-2 mb-2">
                <Video className="w-4 h-4 text-orange-500" /> Create a Meeting
              </h3>
              <p className="text-sm text-muted-foreground">Go to Admin {'>'} Meetings to schedule department-only virtual meetings for your workers.</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="font-semibold text-foreground flex items-center gap-2 mb-2">
                <ScanLine className="w-4 h-4 text-orange-500" /> Check In Attendees
              </h3>
              <p className="text-sm text-muted-foreground">Use Admin {'>'} Check In to scan QR codes at the door for your department&apos;s events.</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="font-semibold text-foreground flex items-center gap-2 mb-2">
                <BookOpen className="w-4 h-4 text-orange-500" /> Post Announcements
              </h3>
              <p className="text-sm text-muted-foreground">Use Admin {'>'} Announcements to send updates directly to your department&apos;s workers.</p>
            </div>
          </div>
        </section>

        {/* Admin Section */}
        <section>
          <div className="flex items-center gap-3 mb-6 border-b border-border pb-4">
            <div className="w-10 h-10 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">For Admins</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="font-semibold text-foreground flex items-center gap-2 mb-2">
                <Video className="w-4 h-4 text-red-500" /> Go Live
              </h3>
              <p className="text-sm text-muted-foreground">Use Admin {'>'} Settings to toggle the Live Stream banner for church-wide broadcasts.</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="font-semibold text-foreground flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-red-500" /> Manage Members
              </h3>
              <p className="text-sm text-muted-foreground">Go to Admin {'>'} Members to update roles, assign departments, and manage access.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
