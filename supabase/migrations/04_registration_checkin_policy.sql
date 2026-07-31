-- Phase 4 Migration: Add UPDATE policy for event_registrations (for QR check-in)
-- Allows admins and department heads to update event_registrations (e.g., mark checked_in)

CREATE POLICY "Admins can update registrations for check-in" ON public.event_registrations
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND app_role IN ('super_admin', 'department_head')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND app_role IN ('super_admin', 'department_head')
    )
  );
