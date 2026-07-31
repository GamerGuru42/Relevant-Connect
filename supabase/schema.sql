-- Schema for Relevant+ Phase 1

-- Clean slate: drop existing tables if they exist
DROP TABLE IF EXISTS public.activity_logs CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.attendance_codes CASCADE;
DROP TABLE IF EXISTS public.attendance CASCADE;
DROP TABLE IF EXISTS public.event_registrations CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;
DROP TABLE IF EXISTS public.meetings CASCADE;
DROP TABLE IF EXISTS public.announcements CASCADE;
DROP TABLE IF EXISTS public.church_info CASCADE;
DROP TABLE IF EXISTS public.donations CASCADE;
DROP TABLE IF EXISTS public.push_subscriptions CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
-- 1. PROFILES
CREATE TYPE public.app_role AS ENUM ('super_admin', 'department_head', 'worker', 'member');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  photo_url TEXT,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin')),
  app_role public.app_role NOT NULL DEFAULT 'member',
  membership_status TEXT NOT NULL DEFAULT 'visitor' CHECK (membership_status IN ('visitor', 'new_convert', 'member', 'worker')),
  department TEXT,
  is_onboarded BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT dept_head_requires_department CHECK (app_role != 'department_head' OR department IS NOT NULL)
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
  live_stream_url TEXT,
  is_live BOOLEAN NOT NULL DEFAULT false,
  live_stream_platform TEXT DEFAULT 'youtube',
  updated_by UUID REFERENCES public.profiles(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.church_info ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Church info is viewable by everyone" ON public.church_info FOR SELECT USING (true);
CREATE POLICY "Only admins can insert church info" ON public.church_info FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND app_role = 'super_admin')
);
CREATE POLICY "Only admins can update church info" ON public.church_info FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND app_role = 'super_admin')
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
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND app_role IN ('super_admin', 'department_head'))
);
CREATE POLICY "Only admins can insert announcements" ON public.announcements FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND app_role IN ('super_admin', 'department_head'))
);
CREATE POLICY "Only admins can update announcements" ON public.announcements FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND app_role IN ('super_admin', 'department_head'))
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
  department TEXT,
  target_audience TEXT CHECK (target_audience IN ('global', 'department', 'role_specific')) DEFAULT 'global',
  target_role public.app_role,
  host_id UUID REFERENCES public.profiles(id),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'cancelled', 'completed')),
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published events are viewable by everyone" ON public.events FOR SELECT USING (
  (publish_at IS NOT NULL AND publish_at <= NOW() AND deleted_at IS NULL) OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND app_role IN ('super_admin', 'department_head'))
);
CREATE POLICY "Only admins can insert events" ON public.events FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND app_role IN ('super_admin', 'department_head'))
);
CREATE POLICY "Only admins can update events" ON public.events FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND app_role IN ('super_admin', 'department_head'))
);
CREATE POLICY "Only admins can delete events" ON public.events FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND app_role = 'super_admin')
);

-- 5. EVENT REGISTRATIONS
CREATE TABLE public.event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  qr_code_data TEXT,
  ticket_id UUID DEFAULT gen_random_uuid(),
  checked_in BOOLEAN NOT NULL DEFAULT false,
  checked_in_at TIMESTAMPTZ,
  checked_in_by UUID REFERENCES public.profiles(id),
  UNIQUE(event_id, user_id)
);

ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own registrations or admins can view all" ON public.event_registrations FOR SELECT USING (
  auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND app_role IN ('super_admin', 'department_head'))
);
CREATE POLICY "Users can register themselves" ON public.event_registrations FOR INSERT WITH CHECK (
  auth.uid() = user_id
);
CREATE POLICY "Users can unregister themselves" ON public.event_registrations FOR DELETE USING (
  auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND app_role IN ('super_admin', 'department_head'))
);
CREATE POLICY "Admins can update registrations for check-in" ON public.event_registrations FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND app_role IN ('super_admin', 'department_head')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND app_role IN ('super_admin', 'department_head')));

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
  auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND app_role IN ('super_admin', 'department_head'))
);
CREATE POLICY "Users can record their own attendance or admins can record" ON public.attendance FOR INSERT WITH CHECK (
  auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND app_role IN ('super_admin', 'department_head'))
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
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND app_role IN ('super_admin', 'department_head'))
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
  entity_id UUID,
  entity_type TEXT,
  target_department TEXT,
  target_role public.app_role,
  sent_via_push BOOLEAN NOT NULL DEFAULT false,
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
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND app_role = 'super_admin')
);
CREATE POLICY "Admins can insert activity logs" ON public.activity_logs FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND app_role IN ('super_admin', 'department_head'))
);

-- 10. DONATIONS
CREATE TABLE public.donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  category TEXT NOT NULL CHECK (category IN ('tithe', 'project_offering', 'special_seed', 'other')),
  payment_reference TEXT,
  payment_gateway TEXT NOT NULL DEFAULT 'paystack',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own donations" ON public.donations FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins view all donations" ON public.donations FOR SELECT TO authenticated USING (EXISTS (
  SELECT 1 FROM public.profiles WHERE id = auth.uid() AND app_role = 'super_admin'
));
CREATE POLICY "Users insert own donations" ON public.donations FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- 11. PUSH SUBSCRIPTIONS
CREATE TABLE public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subscription JSONB NOT NULL,
  endpoint TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own subscriptions" ON public.push_subscriptions FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 12. MEETINGS
CREATE TABLE public.meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  meeting_url TEXT,
  platform TEXT NOT NULL DEFAULT 'other',
  host_name TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  duration_minutes INTEGER,
  notes TEXT,
  recording_url TEXT,
  department TEXT,
  host_id UUID REFERENCES public.profiles(id),
  is_active BOOLEAN NOT NULL DEFAULT false,
  target_audience TEXT CHECK (target_audience IN ('department', 'all')) DEFAULT 'all',
  agenda JSONB DEFAULT '[]',
  timer_end_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Meetings are viewable by allowed users" ON public.meetings FOR SELECT TO authenticated USING (
  target_audience = 'all' OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (app_role = 'super_admin' OR department = public.meetings.department))
);
CREATE POLICY "Admins and heads can insert meetings" ON public.meetings FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND app_role IN ('super_admin', 'department_head'))
);
CREATE POLICY "Host or admin can update meetings" ON public.meetings FOR UPDATE TO authenticated USING (
  host_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND app_role = 'super_admin')
);
CREATE POLICY "Host or admin can delete meetings" ON public.meetings FOR DELETE TO authenticated USING (
  host_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND app_role = 'super_admin')
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
CREATE TRIGGER set_donations_updated_at BEFORE UPDATE ON public.donations FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER set_meetings_updated_at BEFORE UPDATE ON public.meetings FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- Set up storage
insert into storage.buckets (id, name, public) values ('images', 'images', true);

create policy "Public Access" on storage.objects for select using ( bucket_id = 'images' );
create policy "Authenticated users can upload images" on storage.objects for insert with check ( bucket_id = 'images' and auth.role() = 'authenticated' );
create policy "Users can update their own images" on storage.objects for update using ( auth.uid() = owner ) with check ( bucket_id = 'images' and auth.role() = 'authenticated' );
create policy "Users can delete their own images" on storage.objects for delete using ( auth.uid() = owner );
