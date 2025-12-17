-- Create student_messages table for chatbot questions
CREATE TABLE IF NOT EXISTS student_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name VARCHAR(255),
  message TEXT NOT NULL,
  message_type VARCHAR(50) DEFAULT 'question', -- 'question', 'response'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_student_messages_user_id ON student_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_student_messages_created_at ON student_messages(created_at DESC);

-- Enable RLS
ALTER TABLE student_messages ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own messages
CREATE POLICY "Users can read their own messages" ON student_messages
  FOR SELECT USING (auth.uid() = user_id OR (SELECT auth.jwt() ->> 'user_metadata' ->> 'role') = 'admin');

-- Allow users to insert messages
CREATE POLICY "Users can insert messages" ON student_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT, INSERT ON student_messages TO authenticated;
