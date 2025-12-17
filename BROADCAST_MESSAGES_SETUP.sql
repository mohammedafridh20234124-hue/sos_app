-- ============================================
-- Broadcast Messages Table Setup
-- ============================================
-- Run this SQL in Supabase SQL Editor to create the broadcast_messages table

-- Create the broadcast_messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.broadcast_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid,
  student_count integer DEFAULT 0,
  status text DEFAULT 'sent', -- 'draft', 'sent', 'archived'
  
  -- Timestamps for tracking
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS (Row Level Security) - optional but recommended
ALTER TABLE public.broadcast_messages ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to read broadcasts
CREATE POLICY "Allow authenticated users to read broadcasts"
  ON public.broadcast_messages
  FOR SELECT
  USING (true);

-- Create policy to allow admins to insert broadcasts
CREATE POLICY "Allow admins to insert broadcasts"
  ON public.broadcast_messages
  FOR INSERT
  WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_broadcast_messages_created_at 
  ON public.broadcast_messages(created_at DESC);

-- Add comment
COMMENT ON TABLE public.broadcast_messages IS 'Stores broadcast messages sent to all students by admins';
COMMENT ON COLUMN public.broadcast_messages.title IS 'Broadcast message title';
COMMENT ON COLUMN public.broadcast_messages.content IS 'Broadcast message content';
COMMENT ON COLUMN public.broadcast_messages.student_count IS 'Number of students who received this broadcast';
COMMENT ON COLUMN public.broadcast_messages.status IS 'Status: draft, sent, or archived';

-- Verify the table was created
SELECT * FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'broadcast_messages';
