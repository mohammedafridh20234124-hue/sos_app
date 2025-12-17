-- Create student_messages table for chatbot questions
CREATE TABLE IF NOT EXISTS public.student_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name VARCHAR(255),
  message TEXT NOT NULL,
  message_type VARCHAR(50) DEFAULT 'question',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_student_messages_user_id ON public.student_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_student_messages_created_at ON public.student_messages(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.student_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own messages
CREATE POLICY "Users can insert messages" ON public.student_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can read all messages (for admin dashboard)
CREATE POLICY "Users can read all messages" ON public.student_messages
  FOR SELECT USING (true);

-- Grant permissions to authenticated users
GRANT SELECT, INSERT ON public.student_messages TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
