-- Phase 3: Enable Supabase Realtime for key tables
-- Run this in the Supabase SQL Editor manually.
-- Realtime will broadcast INSERT, UPDATE, DELETE changes to subscribed clients.

ALTER PUBLICATION supabase_realtime ADD TABLE announcements, events;
