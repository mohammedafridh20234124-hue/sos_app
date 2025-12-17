#!/usr/bin/env node
/**
 * Setup script to create notifications table in Supabase
 * Run with: node setup-notifications.mjs
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://lkxprmsqmtwfouyvoyqx.supabase.co";
const SUPABASE_ADMIN_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxreHBybXNxbXR3Zm91eXZveXF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDU1NTcxOSwiZXhwIjoyMDgwMTMxNzE5fQ.tH5PrmsFuzqB64g5mIo_1q1bJNjCB-xfh43cBrW0hKU";

const supabase = createClient(SUPABASE_URL, SUPABASE_ADMIN_KEY);

async function setupNotifications() {
  console.log("📋 Setting up Notifications Table\n");

  try {
    // Execute SQL to create notifications table
    const { data, error } = await supabase.rpc("exec_sql", {
      sql: `
-- Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_id UUID REFERENCES public.emergency_alerts(id) ON DELETE SET NULL,
  title VARCHAR NOT NULL,
  message TEXT,
  type VARCHAR(50) DEFAULT 'alert',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_by_admin BOOLEAN DEFAULT FALSE
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can mark own notifications as read" ON public.notifications;

-- Create new RLS policies
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can insert notifications" ON public.notifications
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can delete notifications" ON public.notifications
  FOR DELETE
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_user_type ON public.notifications(user_id, type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
      `,
    });

    if (error) {
      console.error("❌ Error executing SQL:", error);
      return;
    }

    console.log("✅ Notifications table created successfully\n");

    // Verify table exists
    console.log("Verifying table...");
    const { data: tableCheck, error: checkError } = await supabase
      .from("notifications")
      .select("count(*)")
      .limit(1);

    if (checkError) {
      console.error("❌ Error verifying table:", checkError);
      return;
    }

    console.log("✅ Table verified and accessible!");
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

setupNotifications();
