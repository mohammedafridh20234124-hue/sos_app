#!/usr/bin/env node

import dotenv from 'dotenv';
import http from 'http';
dotenv.config();

const API_BASE_URL = 'http://localhost:3001'; // Backend port

console.log('\n🔍 Testing Feedback API Endpoint\n');
console.log('='.repeat(50));

// Test data
const testFeedback = {
  studentName: 'Test Student',
  studentId: 'test-student-12345',
  feedbackMessage: 'This is a test feedback message to verify the SMS notification system is working correctly.',
};

console.log('\n📝 Test Feedback Data:');
console.log(`   Student Name: ${testFeedback.studentName}`);
console.log(`   Student ID: ${testFeedback.studentId}`);
console.log(`   Message: ${testFeedback.feedbackMessage}`);

console.log('\n🚀 Sending feedback to: POST /api/feedback\n');

// Use http module instead of fetch for better compatibility
const postData = JSON.stringify(testFeedback);

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/feedback',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
  },
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log(`📡 Response Status: ${res.statusCode} ${res.statusMessage}`);

    try {
      const responseData = JSON.parse(data);

      if (res.statusCode === 200) {
        console.log('\n✅ Feedback Sent Successfully!');
        console.log(`   Response: ${JSON.stringify(responseData, null, 2)}`);
        console.log(`\n💡 Expected: Admin should receive SMS with feedback on ${process.env.ADMIN_PHONE_NUMBER}`);
        console.log(`   SMS Format:`);
        console.log(`   📢 Student Feedback Received`);
        console.log(`   Student: ${testFeedback.studentName}`);
        console.log(`   ID: ${testFeedback.studentId}`);
        console.log(`   Message: "${testFeedback.feedbackMessage}"`);
        console.log(`   Timestamp: <current timestamp>`);
      } else {
        console.log('\n❌ Feedback Request Failed!');
        console.log(`   Error: ${responseData.error}`);
        if (responseData.details) {
          console.log(`   Details: ${responseData.details}`);
        }
      }
    } catch (e) {
      console.log('\n❌ Failed to parse response');
      console.log(`   Response: ${data}`);
    }

    console.log('\n' + '='.repeat(50) + '\n');
  });
});

req.on('error', (error) => {
  console.error('\n❌ Error testing feedback API:');
  console.error(`   ${error.message}`);
  console.log('\n💡 Make sure:');
  console.log('   1. Backend server is running (npm run dev or node server/sms-service.mjs)');
  console.log(`   2. Backend is on ${API_BASE_URL}`);
  console.log('   3. Twilio credentials are configured in .env');
  console.log('\n' + '='.repeat(50) + '\n');
});

req.write(postData);
req.end();
