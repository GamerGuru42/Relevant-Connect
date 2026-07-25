-- Schema for Relevant+ Phase 1

-- Clean slate: drop existing tables if they exist
DROP TABLE IF EXISTS public.activity_logs CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.attendance_codes CASCADE;
DROP TABLE IF EXISTS public.attendance CASCADE;
DROP TABLE IF EXISTS public.event_registrations CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;
DROP TABLE IF EXISTS public.announcements CASCADE;
DROP TABLE IF EXISTS public.church_info CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
-- 1. PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  photo_url TEXT,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin')),
  membership_status TEXT NOT NULL DEFAULT 'visitor' CHECK (membership_status IN ('visitor', 'new_convert', 'member', 'worker')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 2. CHURCH INFO
CREATE TABLE public.church_info (
  id TEXT PRIMARY KEY DEFAULT 'churchInfo',
  church_name TEXT NOT NULL,
  pastor_name TEXT NOT NULL,
  address TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  service_times TEXT NOT NULL,
  about_text TEXT NOT NULL,
  logo_url TEXT,
  primary_color TEXT,
  secondary_color TEXT,
  today_scripture TEXT,
  updated_by UUID REFERENCES public.profiles(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.church_info ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Church info is viewable by everyone" ON public.church_info FOR SELECT USING (true);
CREATE POLICY "Only admins can insert church info" ON public.church_info FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Only admins can update church info" ON public.church_info FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 3. ANNOUNCEMENTS
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  image_url TEXT,
  category TEXT NOT NULL CHECK (category IN ('general', 'youth', 'choir', 'workers', 'cell_ministry', 'special_events')),
  publish_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published announcements are viewable by everyone" ON public.announcements FOR SELECT USING (
  (publish_at IS NOT NULL AND publish_at <= NOW() AND deleted_at IS NULL) OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Only admins can insert announcements" ON public.announcements FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Only admins can update announcements" ON public.announcements FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 4. EVENTS
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('service', 'midweek', 'prayer_meeting', 'conference', 'special_programme', 'youth', 'cell_meeting')),
  date DATE NOT NULL,
  time TEXT NOT NULL,
  venue_name TEXT NOT NULL,
  venue_address TEXT NOT NULL,
  venue_map_link TEXT,
  speaker TEXT,
  registration_limit INTEGER,
  poster_url TEXT,
  publish_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published events are viewable by everyone" ON public.events FOR SELECT USING (
  (publish_at IS NOT NULL AND publish_at <= NOW() AND deleted_at IS NULL) OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Only admins can insert events" ON public.events FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Only admins can update events" ON public.events FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Only admins can delete events" ON public.events FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 5. EVENT REGISTRATIONS
CREATE TABLE public.event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own registrations or admins can view all" ON public.event_registrations FOR SELECT USING (
  auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Users can register themselves" ON public.event_registrations FOR INSERT WITH CHECK (
  auth.uid() = user_id
);
CREATE POLICY "Users can unregister themselves" ON public.event_registrations FOR DELETE USING (
  auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 6. ATTENDANCE
CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  method TEXT NOT NULL CHECK (method IN ('qr', 'code', 'manual')),
  recorded_by UUID REFERENCES public.profiles(id),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all attendance, users can view their own" ON public.attendance FOR SELECT USING (
  auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Users can record their own attendance or admins can record" ON public.attendance FOR INSERT WITH CHECK (
  auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 7. ATTENDANCE CODES
CREATE TABLE public.attendance_codes (
  event_id UUID PRIMARY KEY REFERENCES public.events(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.attendance_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view attendance codes" ON public.attendance_codes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Only admins can manage attendance codes" ON public.attendance_codes FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 8. NOTIFICATIONS
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('announcement', 'event', 'reminder')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  link_to TEXT,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own notifications" ON public.notifications FOR DELETE USING (auth.uid() = user_id);
-- (Insert policy would normally require a service role or specific triggers since users shouldn't create their own notifications directly, but for now we'll allow authenticated users to insert to trigger from the frontend if needed)
CREATE POLICY "Authenticated users can create notifications" ON public.notifications FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 9. ACTIVITY LOGS
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('created', 'edited', 'deleted', 'promoted')),
  entity TEXT NOT NULL CHECK (entity IN ('announcement', 'event', 'attendance', 'user')),
  entity_id TEXT NOT NULL,
  entity_label TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view activity logs" ON public.activity_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can insert activity logs" ON public.activity_logs FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER set_church_info_updated_at BEFORE UPDATE ON public.church_info FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER set_announcements_updated_at BEFORE UPDATE ON public.announcements FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER set_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER set_event_registrations_updated_at BEFORE UPDATE ON public.event_registrations FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER set_attendance_updated_at BEFORE UPDATE ON public.attendance FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER set_notifications_updated_at BEFORE UPDATE ON public.notifications FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- Set up storage
insert into storage.buckets (id, name, public) values ('images', 'images', true);

create policy "Public Access" on storage.objects for select using ( bucket_id = 'images' );
create policy "Authenticated users can upload images" on storage.objects for insert with check ( bucket_id = 'images' and auth.role() = 'authenticated' );
create policy "Users can update their own images" on storage.objects for update using ( auth.uid() = owner ) with check ( bucket_id = 'images' and auth.role() = 'authenticated' );
create policy "Users can delete their own images" on storage.objects for delete using ( auth.uid() = owner );
