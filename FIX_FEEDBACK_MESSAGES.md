# Fix for Feedback & Messages - Create student_messages Table

## Problem
The feedback modal is failing because the `student_messages` table doesn't exist in Supabase.

Error: "Could not find the table 'public.student_messages' in the schema cache"

## Quick Solution (2 minutes)

### Step 1: Open Supabase SQL Editor
1. Go to: https://supabase.com/dashboard
2. Click your project
3. Click **SQL Editor** → **New Query**

### Step 2: Copy & Paste This SQL

```sql
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
```

### Step 3: Click RUN ▶️

### Step 4: Refresh Your App
- Go back to your web app
- Hard refresh: **Ctrl+Shift+R** (Windows) or **Cmd+Shift+R** (Mac)

### Step 5: Test Feedback
1. Open Student Dashboard
2. Click hamburger menu (≡)
3. Click "Questions & FAQs"
4. Type a test message
5. Click "Send Feedback"
6. Should see: **"✅ Feedback Sent Successfully!"**

## Fallback Feature

If the table still doesn't exist, the feedback will be saved to **localStorage** automatically:
- Feedback is saved locally on your device
- Will sync to Supabase when table is created
- You'll see: "✅ Feedback Saved! (offline mode)"

## File Location
- SQL file: `CREATE_STUDENT_MESSAGES_TABLE.sql` (in project root)
- Component: `src/components/FeedbackModal.tsx` (updated with fallback)

---

**Status**: Code is ready with fallback support. Just create the table to fully enable the feature.
