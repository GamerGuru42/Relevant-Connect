-- Migration: 06_notifications
-- Purpose: Add link column, create push_subscriptions, and add auto-creation triggers.
-- The notifications table already has: entity_id, entity_type, target_department, target_role, sent_via_push, link_to

-- 1. Create push_subscriptions table (for future push notifications)
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subscription JSONB NOT NULL,
  endpoint TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

-- Enable RLS on push_subscriptions
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own push subscriptions"
  ON public.push_subscriptions FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 2. Create triggers for auto-notifications

-- 2a. Trigger function for Announcements
CREATE OR REPLACE FUNCTION public.create_announcement_notification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, body, entity_id, entity_type, target_department, target_role, link_to)
  SELECT 
    p.id, 
    'announcement', 
    NEW.title, 
    LEFT(NEW.content, 100), 
    NEW.id, 
    'announcement', 
    NEW.department, 
    NEW.target_role,
    '/announcements/' || NEW.id
  FROM public.profiles p
  WHERE p.is_onboarded = true
  AND (
    NEW.target_audience = 'global' 
    OR (NEW.target_audience = 'department' AND p.department = NEW.department)
    OR (NEW.target_audience = 'role_specific' AND p.app_role = NEW.target_role)
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.notifications n 
    WHERE n.user_id = p.id 
    AND n.entity_id = NEW.id 
    AND n.entity_type = 'announcement'
    AND n.read = false
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2b. Attach Trigger to announcements
DROP TRIGGER IF EXISTS announcement_notification ON public.announcements;
CREATE TRIGGER announcement_notification
  AFTER INSERT ON public.announcements
  FOR EACH ROW
  EXECUTE FUNCTION public.create_announcement_notification();


-- 2c. Trigger function for Events
CREATE OR REPLACE FUNCTION public.create_event_notification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, body, entity_id, entity_type, link_to)
  SELECT 
    p.id, 
    'event', 
    NEW.title, 
    LEFT(NEW.description, 100), 
    NEW.id, 
    'event',
    '/events/' || NEW.id
  FROM public.profiles p
  WHERE p.is_onboarded = true
  AND NOT EXISTS (
    SELECT 1 FROM public.notifications n 
    WHERE n.user_id = p.id 
    AND n.entity_id = NEW.id 
    AND n.entity_type = 'event'
    AND n.read = false
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2d. Attach Trigger to events
DROP TRIGGER IF EXISTS event_notification ON public.events;
CREATE TRIGGER event_notification
  AFTER INSERT ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.create_event_notification();

-- 3. Enable real-time for notifications
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
