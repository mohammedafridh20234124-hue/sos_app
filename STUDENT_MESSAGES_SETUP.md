# How to Create the Student Messages Table in Supabase

## Step 1: Open Supabase SQL Editor
1. Go to your Supabase project dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**

## Step 2: Copy and Paste This SQL

```sql
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
```

## Step 3: Execute the Query
1. Click the **Run** button (or press Ctrl+Enter)
2. You should see a success message "Query successful"

## Step 4: Verify the Table
1. Go to **Table Editor** in the left sidebar
2. You should now see `student_messages` table in the list
3. Click on it to view the schema

## Step 5: Test in the App
1. Go back to the app
2. Click on **Questions** tab in the notification bell
3. Try clicking a FAQ question or typing your own
4. You should see "✅ Message Sent" toast

## Admin View
- The admin can see all student questions in real-time on the admin dashboard
- Questions appear in the **Questions** tab of the notification center
- New questions trigger a toast notification

If you get any errors, make sure:
- You're logged in to Supabase with proper permissions
- The SQL syntax is correct
- The table doesn't already exist (if it does, you can DROP and recreate it)
