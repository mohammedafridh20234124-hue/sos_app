-- Add phone column to profiles table if not exists
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- Create SMS OTP tokens table for phone verification
CREATE TABLE IF NOT EXISTS sms_otp_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR NOT NULL,
  otp_code VARCHAR(6) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '10 minutes',
  verified BOOLEAN DEFAULT FALSE,
  attempt_count INT DEFAULT 0,
  UNIQUE(phone, otp_code)
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_sms_otp_tokens_phone ON sms_otp_tokens(phone);
CREATE INDEX IF NOT EXISTS idx_sms_otp_tokens_expires_at ON sms_otp_tokens(expires_at);

-- Enable RLS (Row Level Security) for SMS OTP tokens
ALTER TABLE sms_otp_tokens ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for SMS OTP tokens (public table for signup/login)
CREATE POLICY "Anyone can insert SMS OTP" ON sms_otp_tokens
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can query SMS OTP" ON sms_otp_tokens
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can update SMS OTP" ON sms_otp_tokens
  FOR UPDATE
  USING (true);
