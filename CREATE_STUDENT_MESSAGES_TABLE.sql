-- Create student_messages table
CREATE TABLE IF NOT EXISTS public.student_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name VARCHAR(255),
  message TEXT NOT NULL,
  message_type VARCHAR(50) DEFAULT 'question',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_student_messages_user_id ON public.student_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_student_messages_created_at ON public.student_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_student_messages_type ON public.student_messages(message_type);

-- Enable RLS
ALTER TABLE public.student_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can read their own messages" ON public.student_messages;
DROP POLICY IF EXISTS "Users can insert messages" ON public.student_messages;
DROP POLICY IF EXISTS "Users can update own messages" ON public.student_messages;

-- Create RLS policies
CREATE POLICY "Users can read their own messages" ON public.student_messages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert messages" ON public.student_messages
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own messages" ON public.student_messages
  FOR UPDATE USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.student_messages TO authenticated;
