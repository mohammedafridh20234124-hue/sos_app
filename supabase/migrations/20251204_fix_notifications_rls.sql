-- Update RLS policies for notifications to allow admin replies
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Admin can insert notifications" ON notifications;

-- Create new policies
-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own notifications
CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Admin can insert notifications for any user
CREATE POLICY "Admins can insert notifications" ON notifications
  FOR INSERT
  WITH CHECK (true);  -- Allow admin inserts regardless of user_id

-- Users can update read status of their own notifications
CREATE POLICY "Users can mark own notifications as read" ON notifications
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
