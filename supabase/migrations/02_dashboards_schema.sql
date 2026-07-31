-- Migration for Phase 2: Dashboards and Expanded Schema

-- DONATIONS TABLE
CREATE TABLE IF NOT EXISTS public.donations (
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

DROP POLICY IF EXISTS "Users view own donations" ON public.donations;
CREATE POLICY "Users view own donations" ON public.donations
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins view all donations" ON public.donations;
CREATE POLICY "Admins view all donations" ON public.donations
  FOR SELECT TO authenticated USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() 
    AND app_role = 'super_admin'
  ));

DROP POLICY IF EXISTS "Users insert own donations" ON public.donations;
CREATE POLICY "Users insert own donations" ON public.donations
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- PUSH SUBSCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subscription JSONB NOT NULL,
  endpoint TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users manage own subscriptions" ON public.push_subscriptions
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- MEETINGS TABLE (expand existing)
ALTER TABLE public.meetings 
  ADD COLUMN IF NOT EXISTS department TEXT,
  ADD COLUMN IF NOT EXISTS host_id UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS target_audience TEXT CHECK (target_audience IN ('department', 'all')) DEFAULT 'all',
  ADD COLUMN IF NOT EXISTS meeting_url TEXT,
  ADD COLUMN IF NOT EXISTS duration_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS agenda JSONB DEFAULT '[]';

-- EVENTS TABLE (expand existing)
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS department TEXT,
  ADD COLUMN IF NOT EXISTS target_audience TEXT CHECK (target_audience IN ('global', 'department', 'role_specific')) DEFAULT 'global',
  ADD COLUMN IF NOT EXISTS target_role public.app_role,
  ADD COLUMN IF NOT EXISTS host_id UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'cancelled', 'completed'));

-- CHURCH INFO (expand existing)
ALTER TABLE public.church_info
  ADD COLUMN IF NOT EXISTS live_stream_url TEXT,
  ADD COLUMN IF NOT EXISTS is_live BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS live_stream_platform TEXT DEFAULT 'youtube';

-- TICKETS / QR REGISTRATIONS (expand event_registrations)
ALTER TABLE public.event_registrations
  ADD COLUMN IF NOT EXISTS qr_code_data TEXT,
  ADD COLUMN IF NOT EXISTS ticket_id UUID DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS checked_in BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS checked_in_by UUID REFERENCES public.profiles(id);

-- NOTIFICATIONS TABLE (expand existing)
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS entity_id UUID,
  ADD COLUMN IF NOT EXISTS entity_type TEXT,
  ADD COLUMN IF NOT EXISTS target_department TEXT,
  ADD COLUMN IF NOT EXISTS target_role public.app_role,
  ADD COLUMN IF NOT EXISTS sent_via_push BOOLEAN NOT NULL DEFAULT false;
