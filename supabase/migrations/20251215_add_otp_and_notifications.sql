-- Add new columns to profiles table for enhanced registration
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS register_number VARCHAR(50);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- Create OTP tokens table for email verification
CREATE TABLE IF NOT EXISTS otp_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR NOT NULL,
  otp_code VARCHAR(6) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '10 minutes',
  verified BOOLEAN DEFAULT FALSE,
  attempt_count INT DEFAULT 0,
  UNIQUE(email, otp_code)
);

-- Create notifications table for real-time alerts
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_id UUID REFERENCES emergency_alerts(id) ON DELETE CASCADE,
  title VARCHAR NOT NULL,
  message TEXT,
  type VARCHAR(50) DEFAULT 'alert', -- alert, info, warning
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_otp_tokens_email ON otp_tokens(email);
CREATE INDEX IF NOT EXISTS idx_otp_tokens_expires_at ON otp_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Enable RLS (Row Level Security) for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for notifications - users can only see their own notifications
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admin can insert notifications" ON notifications
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'admin');
