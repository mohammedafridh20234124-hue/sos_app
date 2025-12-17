#!/usr/bin/env node
/**
 * Test script to verify Supabase notifications table and broadcast functionality
 * Run with: node test-broadcast.mjs
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://lkxprmsqmtwfouyvoyqx.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxreHBybXNxbXR3Zm91eXZveXF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1NTU3MTksImV4cCI6MjA4MDEzMTcxOX0.Fsdfk2_bSAuEKOE6kc2zKn_YXvu_UxxJ43G5MWwVSNA";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testBroadcast() {
  console.log("🧪 Testing Supabase Broadcast Functionality\n");

  try {
    // Test 1: Check if notifications table exists
    console.log("1️⃣ Checking notifications table...");
    const { data: tables, error: tableError } = await supabase
      .from("notifications")
      .select("*")
      .limit(1);

    if (tableError) {
      console.error(
        "❌ Error accessing notifications table:",
        tableError.message
      );
      return;
    }
    console.log("✅ Notifications table exists\n");

    // Test 2: Fetch existing students
    console.log("2️⃣ Fetching students from user_roles...");
    const { data: students, error: studentError } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "student")
      .limit(5);

    if (studentError) {
      console.error("❌ Error fetching students:", studentError.message);
      return;
    }

    if (!students || students.length === 0) {
      console.error("❌ No students found in database");
      return;
    }

    console.log(`✅ Found ${students.length} students:\n`, students);

    // Test 3: Create test broadcast
    console.log("\n3️⃣ Creating test broadcast notification...");
    const testNotifications = students.map((student) => ({
      user_id: student.user_id,
      title: "🧪 Test Broadcast",
      message: "This is a test broadcast notification",
      type: "broadcast",
      created_at: new Date().toISOString(),
      read: false,
      read_at: null,
    }));

    const { data: inserted, error: insertError } = await supabase
      .from("notifications")
      .insert(testNotifications)
      .select();

    if (insertError) {
      console.error(
        "❌ Error inserting notifications:",
        insertError.message
      );
      console.error("Details:", insertError.details);
      console.error("Code:", insertError.code);
      return;
    }

    console.log(
      `✅ Successfully created ${inserted?.length || 0} test notifications\n`
    );
    console.log("Sample inserted notification:", inserted?.[0]);

    // Test 4: Verify notifications were inserted
    console.log("\n4️⃣ Verifying notifications in database...");
    const { data: verifyNotifs, error: verifyError } = await supabase
      .from("notifications")
      .select("id, user_id, title, type, created_at")
      .eq("type", "broadcast")
      .order("created_at", { ascending: false })
      .limit(5);

    if (verifyError) {
      console.error("❌ Error verifying notifications:", verifyError.message);
      return;
    }

    console.log(
      `✅ Found ${verifyNotifs?.length || 0} broadcast notifications in database`
    );
    console.log("Recent notifications:", verifyNotifs);

    // Test 5: Test student-specific query
    if (students.length > 0) {
      console.log(
        `\n5️⃣ Testing student-specific notification fetch (user: ${students[0].user_id})...`
      );
      const { data: studentNotifs, error: studentNotifError } = await supabase
        .from("notifications")
        .select("id, title, message, created_at")
        .eq("type", "broadcast")
        .eq("user_id", students[0].user_id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (studentNotifError) {
        console.error(
          "❌ Error fetching student notifications:",
          studentNotifError.message
        );
        return;
      }

      console.log(
        `✅ Found ${studentNotifs?.length || 0} notifications for this student`
      );
      if (studentNotifs && studentNotifs.length > 0) {
        console.log("Student's notifications:", studentNotifs);
      }
    }

    console.log("\n✅ All tests passed! Broadcast system is working correctly.");
  } catch (error) {
    console.error("❌ Unexpected error:", error);
  }
}

testBroadcast();
