-- Ensure notifications table has all required columns for broadcast functionality
-- Add missing columns if they don't exist

-- Check if notifications table exists, if not create it
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  alert_id UUID REFERENCES emergency_alerts(id) ON DELETE CASCADE,
  title VARCHAR NOT NULL,
  message TEXT,
  type VARCHAR(50) DEFAULT 'alert', -- alert, info, warning, broadcast
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE
);

-- Add type column if it doesn't exist
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'alert';

-- Add read_at column if it doesn't exist  
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE;

-- Create or replace indexes for better query performance
DROP INDEX IF EXISTS idx_notifications_user_id;
DROP INDEX IF EXISTS idx_notifications_user_id_type;
DROP INDEX IF EXISTS idx_notifications_created_at;
DROP INDEX IF EXISTS idx_notifications_user_id_read;

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_user_id_type ON notifications(user_id, type);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_user_id_read ON notifications(user_id, read);

-- Enable RLS (Row Level Security) for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Admins can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Users can mark own notifications as read" ON notifications;
DROP POLICY IF EXISTS "Admin can insert notifications" ON notifications;

-- Create updated RLS policies
-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins can insert notifications for any user (broadcast)
CREATE POLICY "Admins can insert notifications" ON notifications
  FOR INSERT
  WITH CHECK (true);

-- Admins can delete notifications
CREATE POLICY "Admins can delete notifications" ON notifications
  FOR DELETE
  WITH CHECK (true);

-- Grant necessary permissions to authenticated users
GRANT SELECT, UPDATE ON notifications TO authenticated;
GRANT INSERT ON notifications TO authenticated;
