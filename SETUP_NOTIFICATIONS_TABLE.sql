-- Notifications Table Setup
-- This SQL script creates the notifications table needed for broadcasts
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/[PROJECT_ID]/sql/new

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_id UUID REFERENCES public.emergency_alerts(id) ON DELETE SET NULL,
  title VARCHAR NOT NULL,
  message TEXT,
  type VARCHAR(50) DEFAULT 'alert', -- alert, info, warning, broadcast
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_by_admin BOOLEAN DEFAULT FALSE
);

-- Enable RLS (Row Level Security)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can delete notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can mark own notifications as read" ON public.notifications;
DROP POLICY IF EXISTS "Admin can insert notifications" ON public.notifications;

-- Create RLS policies
-- Allow users to view their own notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to update (mark as read) their own notifications
CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow anyone to insert (for broadcasts and admin messages)
CREATE POLICY "Anyone can insert notifications" ON public.notifications
  FOR INSERT
  WITH CHECK (true);

-- Allow deletion of notifications
CREATE POLICY "Users can delete their own notifications" ON public.notifications
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_type ON public.notifications(user_id, type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);

-- Grant permissions
GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT INSERT ON public.notifications TO authenticated;
GRANT SELECT ON public.notifications TO anon;
