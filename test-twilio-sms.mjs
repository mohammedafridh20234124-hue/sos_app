#!/usr/bin/env node

/**
 * SMS Verification Test Script
 * Tests if Twilio SMS can be sent with your credentials
 * 
 * Usage: node test-twilio-sms.mjs
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;
const ADMIN_PHONE_NUMBER = process.env.ADMIN_PHONE_NUMBER;

console.log('🔍 Twilio SMS Configuration Test');
console.log('================================\n');

// Step 1: Check credentials are loaded
console.log('Step 1: Checking Credentials');
console.log('-'.repeat(50));

if (!TWILIO_ACCOUNT_SID) {
  console.log('❌ TWILIO_ACCOUNT_SID not found in .env');
  process.exit(1);
}
console.log(`✅ Account SID: ${TWILIO_ACCOUNT_SID.substring(0, 4)}...${TWILIO_ACCOUNT_SID.substring(-4)}`);

if (!TWILIO_AUTH_TOKEN) {
  console.log('❌ TWILIO_AUTH_TOKEN not found in .env');
  process.exit(1);
}
console.log(`✅ Auth Token: ${TWILIO_AUTH_TOKEN.substring(0, 4)}...${TWILIO_AUTH_TOKEN.substring(-4)}`);

if (!TWILIO_PHONE_NUMBER) {
  console.log('❌ TWILIO_PHONE_NUMBER not found in .env');
  process.exit(1);
}
console.log(`✅ Twilio Number: ${TWILIO_PHONE_NUMBER}`);

if (!ADMIN_PHONE_NUMBER) {
  console.log('❌ ADMIN_PHONE_NUMBER not found in .env');
  process.exit(1);
}
console.log(`✅ Admin Number: ${ADMIN_PHONE_NUMBER}\n`);

// Step 2: Validate phone number format
console.log('Step 2: Validating Phone Number Format');
console.log('-'.repeat(50));

function validatePhoneNumber(phone, label) {
  const e164Regex = /^\+\d{1,15}$/;
  
  if (!e164Regex.test(phone)) {
    console.log(`❌ ${label} format invalid: ${phone}`);
    console.log('   Expected format: +[country code][number]');
    console.log('   Examples: +12025551234, +918531996611');
    return false;
  }
  
  const digitsOnly = phone.replace(/\D/g, '');
  if (digitsOnly.length < 10 || digitsOnly.length > 15) {
    console.log(`❌ ${label} has invalid length: ${digitsOnly.length} digits`);
    console.log('   Should be 10-15 digits');
    return false;
  }
  
  console.log(`✅ ${label} format valid: ${phone}`);
  return true;
}

const twilioValid = validatePhoneNumber(TWILIO_PHONE_NUMBER, 'Twilio Number');
const adminValid = validatePhoneNumber(ADMIN_PHONE_NUMBER, 'Admin Number');

if (!twilioValid || !adminValid) {
  console.log('\n❌ Phone number format validation failed');
  process.exit(1);
}
console.log();

// Step 3: Try to initialize Twilio
console.log('Step 3: Initializing Twilio Client');
console.log('-'.repeat(50));

let twilioClient;
try {
  const twilio = await import('twilio');
  twilioClient = twilio.default(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  console.log('✅ Twilio client initialized successfully\n');
} catch (error) {
  console.log(`❌ Failed to initialize Twilio: ${error.message}`);
  console.log('\nPossible solutions:');
  console.log('1. Install twilio package: npm install twilio');
  console.log('2. Check if credentials are correct');
  process.exit(1);
}

// Step 4: Test sending SMS (dry run)
console.log('Step 4: Testing SMS Send (To Your Admin Number)');
console.log('-'.repeat(50));

try {
  console.log(`\n📱 Sending test SMS...`);
  console.log(`   From: ${TWILIO_PHONE_NUMBER}`);
  console.log(`   To: ${ADMIN_PHONE_NUMBER}`);
  console.log(`   Message: "Test SMS from SOS Campus Safety System"`);
  
  const message = await twilioClient.messages.create({
    body: '🔔 Test SMS from SOS Campus Safety System\n\nThis is a test message to verify SMS delivery.',
    from: TWILIO_PHONE_NUMBER,
    to: ADMIN_PHONE_NUMBER
  });
  
  console.log(`\n✅ SMS sent successfully!`);
  console.log(`   Message SID: ${message.sid}`);
  console.log(`   Status: ${message.status}`);
  console.log(`   Date sent: ${message.dateCreated}`);
  
} catch (error) {
  console.log(`\n❌ Failed to send SMS`);
  console.log(`   Error: ${error.message}`);
  console.log(`   Error code: ${error.code}`);
  
  // Provide helpful error messages
  if (error.message.includes('not a valid')) {
    console.log(`\n🔴 Issue: Phone number not verified in Twilio trial account`);
    console.log(`   Solution: Go to Twilio console and verify ${ADMIN_PHONE_NUMBER} in Verified Caller IDs`);
  } else if (error.message.includes('Invalid API key')) {
    console.log(`\n🔴 Issue: Invalid Twilio credentials`);
    console.log(`   Solution: Check TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in .env`);
  } else if (error.message.includes('Account not authorized')) {
    console.log(`\n🔴 Issue: Account not authorized for SMS`);
    console.log(`   Solution: Check if Twilio account is active and has balance`);
  }
  
  process.exit(1);
}

// Step 5: Summary
console.log('\n' + '='.repeat(50));
console.log('✅ SMS Verification Test Completed Successfully!');
console.log('='.repeat(50));
console.log('\nYour Twilio SMS setup is working correctly.');
console.log('Check your phone for the test SMS message.');
console.log('\nNext steps:');
console.log('1. Verify student phone numbers in Twilio console');
console.log('2. Send broadcasts from Admin Dashboard');
console.log('3. Monitor Twilio console for delivery status');
