-- Migration for Phase 1: Role Expansion

-- ==========================================
-- PART 1: Run this section FIRST, then run PART 2
-- ==========================================

-- Step 1: Create new role type (idempotent)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('super_admin', 'department_head', 'worker', 'member');
  END IF;
END $$;

-- Ensure all required values exist in case the enum was created previously with missing values
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'department_head';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'worker';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'member';

-- ==========================================
-- PART 2: Run this section SECOND (after Part 1 completes)
-- ==========================================

-- Step 2: Add new column
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS app_role public.app_role NOT NULL DEFAULT 'member';

-- Step 3: Migrate existing data
UPDATE public.profiles 
  SET app_role = CASE 
    WHEN role = 'admin' THEN 'super_admin'::public.app_role
    ELSE 'member'::public.app_role
  END;

-- Step 4: Add department_head constraint helper
-- Department heads MUST have a department assigned
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS dept_head_requires_department;
ALTER TABLE public.profiles 
  ADD CONSTRAINT dept_head_requires_department 
  CHECK (app_role != 'department_head' OR department IS NOT NULL);

-- Step 5: Update RLS policies to use app_role

-- 5.1 Announcements
DROP POLICY IF EXISTS "Only admins can insert announcements" ON public.announcements;
CREATE POLICY "Only admins can insert announcements" ON public.announcements
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND app_role IN ('super_admin', 'department_head')
  ));

DROP POLICY IF EXISTS "Only admins can update announcements" ON public.announcements;
CREATE POLICY "Only admins can update announcements" ON public.announcements
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND app_role IN ('super_admin', 'department_head')
  ));

-- 5.2 Events
DROP POLICY IF EXISTS "Only admins can insert events" ON public.events;
CREATE POLICY "Only admins can insert events" ON public.events
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND app_role IN ('super_admin', 'department_head')
  ));

DROP POLICY IF EXISTS "Only admins can update events" ON public.events;
CREATE POLICY "Only admins can update events" ON public.events
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND app_role IN ('super_admin', 'department_head')
  ));

DROP POLICY IF EXISTS "Only admins can delete events" ON public.events;
CREATE POLICY "Only admins can delete events" ON public.events
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND app_role = 'super_admin'
  ));

-- 5.3 Event Registrations
DROP POLICY IF EXISTS "Users can view their own registrations or admins can view all" ON public.event_registrations;
CREATE POLICY "Users can view their own registrations or admins can view all" ON public.event_registrations
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND app_role IN ('super_admin', 'department_head')
    )
  );

DROP POLICY IF EXISTS "Users can unregister themselves" ON public.event_registrations;
CREATE POLICY "Users can unregister themselves or admins can unregister" ON public.event_registrations
  FOR DELETE TO authenticated
  USING (
    auth.uid() = user_id OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND app_role IN ('super_admin', 'department_head')
    )
  );

-- 5.4 Attendance
DROP POLICY IF EXISTS "Admins can view all attendance, users can view their own" ON public.attendance;
CREATE POLICY "Admins can view all attendance, users can view their own" ON public.attendance
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND app_role IN ('super_admin', 'department_head')
    )
  );

DROP POLICY IF EXISTS "Users can record their own attendance or admins can record" ON public.attendance;
CREATE POLICY "Users can record their own attendance or admins can record" ON public.attendance
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND app_role IN ('super_admin', 'department_head')
    )
  );

-- 5.5 Attendance Codes
DROP POLICY IF EXISTS "Only admins can manage attendance codes" ON public.attendance_codes;
CREATE POLICY "Only admins can manage attendance codes" ON public.attendance_codes
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND app_role IN ('super_admin', 'department_head')
  ));

-- 5.6 Activity Logs
DROP POLICY IF EXISTS "Admins can view activity logs" ON public.activity_logs;
CREATE POLICY "Admins can view activity logs" ON public.activity_logs
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND app_role = 'super_admin'
  ));

DROP POLICY IF EXISTS "Admins can insert activity logs" ON public.activity_logs;
CREATE POLICY "Admins can insert activity logs" ON public.activity_logs
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND app_role IN ('super_admin', 'department_head')
  ));

-- 5.7 Church Info
DROP POLICY IF EXISTS "Only admins can insert church info" ON public.church_info;
CREATE POLICY "Only admins can insert church info" ON public.church_info
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND app_role = 'super_admin'
  ));

DROP POLICY IF EXISTS "Only admins can update church info" ON public.church_info;
CREATE POLICY "Only admins can update church info" ON public.church_info
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND app_role = 'super_admin'
  ));
