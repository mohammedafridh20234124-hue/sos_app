#!/usr/bin/env node

/**
 * Test Backend API Endpoints
 * Run this with: node test-backend.mjs
 */

const BASE_URL = 'http://localhost:3001';

async function testEndpoints() {
  console.log('\n🧪 Testing Campus Security Backend API\n');
  console.log(`📍 Server: ${BASE_URL}\n`);

  // Test 1: Health Check
  try {
    console.log('1️⃣  Testing /api/health...');
    const response = await fetch(`${BASE_URL}/api/health`);
    const data = await response.json();
    console.log(`   ✅ Status: ${response.status}`);
    console.log(`   📋 Response:`, JSON.stringify(data, null, 2));
  } catch (err) {
    console.log(`   ❌ Error:`, err.message);
  }

  // Test 2: Location Update
  try {
    console.log('\n2️⃣  Testing /api/location-update...');
    const response = await fetch(`${BASE_URL}/api/location-update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Alert-ID': 'test-alert-123',
        'X-Timestamp': new Date().toISOString()
      },
      body: JSON.stringify({
        latitude: 9.9029,
        longitude: 78.1192,
        accuracy: 10,
        timestamp: new Date().toISOString()
      })
    });
    const data = await response.json();
    console.log(`   ✅ Status: ${response.status}`);
    console.log(`   📋 Response:`, JSON.stringify(data, null, 2));
  } catch (err) {
    console.log(`   ❌ Error:`, err.message);
  }

  // Test 3: Get Recordings
  try {
    console.log('\n3️⃣  Testing /api/recordings...');
    const response = await fetch(`${BASE_URL}/api/recordings`);
    const data = await response.json();
    console.log(`   ✅ Status: ${response.status}`);
    console.log(`   📋 Users with recordings:`, data.users?.length || 0);
    if (data.total) {
      console.log(`   📊 Total recordings: ${data.total.totalRecordings}`);
      console.log(`   📸 Total photos: ${data.total.totalPhotos}`);
      console.log(`   🔊 Total audio clips: ${data.total.totalAudioClips}`);
    }
  } catch (err) {
    console.log(`   ❌ Error:`, err.message);
  }

  // Test 4: Send OTP (basic test)
  try {
    console.log('\n4️⃣  Testing /api/send-otp...');
    const response = await fetch(`${BASE_URL}/api/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        otp: '123456',
        userName: 'Test User'
      })
    });
    const data = await response.json();
    console.log(`   ✅ Status: ${response.status}`);
    console.log(`   📋 Response:`, JSON.stringify(data, null, 2));
  } catch (err) {
    console.log(`   ❌ Error:`, err.message);
  }

  console.log('\n✅ API Test Complete!\n');
}

testEndpoints().catch(console.error);
