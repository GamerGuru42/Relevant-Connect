-- Phase 5 Migration: Add timer_end_at to meetings table
ALTER TABLE public.meetings ADD COLUMN timer_end_at TIMESTAMPTZ;
