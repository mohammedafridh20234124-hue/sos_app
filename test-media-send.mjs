import FormData from 'form-data';
import fs from 'fs';
import fetch from 'node-fetch';
import { v4 as uuid } from 'uuid';

// Create test data
const alertId = uuid();
const timestamp = new Date().toISOString();

// Create a simple test frame (small JPEG)
const frameBuffer = Buffer.from(
  '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAIBAQIBAQICAgICAgICAwUDAwwUAxUSDBMRDwsUERAMEgcHBgcGBgcICQsJCAgKCAcHCg0KCgv/2wBDAQICAgICAwUDAwwUExEPDwsUEA8PDwsRDxEPDwsUERAMEgcHBgcGBgcICQsJCAgKCAcHCg0KCgv/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgADBBEhMRJBUWGx8PH/xAAVAQEBAAAAAAAAAAAAAAAAAAAAAv/EABYRAQEBAAAAAAAAAAAAAAAAAAAEAf/aAAwDAQACEQMRAD8AltJaxeKcLoxnHf39QABeKMaABjOOo3//2Q==',
  'base64'
);

// Create test audio (empty WebM)
const audioBuffer = Buffer.from([
  0x1a, 0x45, 0xdf, 0xa3, // EBML header
  0x9f, 0x42, 0x86, 0x81, 0x01, 0x42, 0xf7, 0x80, // Other EBML elements
  0x42, 0xf2, 0x81, 0x04, 0x42, 0xf3, 0x81, 0x08,
  0x42, 0xf4, 0x81, 0x00, 0x42, 0xf5, 0x81, 0x00
]);

// Create test video (empty WebM)
const videoBuffer = Buffer.from([
  0x1a, 0x45, 0xdf, 0xa3, // EBML header
  0x9f, 0x42, 0x86, 0x81, 0x01, 0x42, 0xf7, 0x80,
  0x42, 0xf2, 0x81, 0x04, 0x42, 0xf3, 0x81, 0x08,
  0x42, 0xf4, 0x81, 0x00, 0x42, 0xf5, 0x81, 0x00
]);

async function sendTestData() {
  try {
    console.log('\n🧪 Testing Media Upload');
    console.log('========================');
    console.log('Alert ID:', alertId);
    console.log('Timestamp:', timestamp);

    const form = new FormData();
    form.append('frame', frameBuffer, 'frame.jpg');
    form.append('video', videoBuffer, 'video.webm');
    form.append('audio', audioBuffer, 'audio.webm');

    console.log('\n📤 Sending test data to http://127.0.0.1:3001/api/receive');
    console.log('Files being sent:');
    console.log('  - frame: ' + frameBuffer.length + ' bytes');
    console.log('  - video: ' + videoBuffer.length + ' bytes');
    console.log('  - audio: ' + audioBuffer.length + ' bytes');

    const response = await fetch('http://127.0.0.1:3001/api/receive', {
      method: 'POST',
      body: form,
      headers: {
        'x-alert-id': alertId,
        'x-timestamp': timestamp,
        'x-location': JSON.stringify({
          latitude: 40.7128,
          longitude: -74.0060,
          accuracy: 10,
          timestamp
        }),
        'x-user-id': 'test-user-123',
        'x-user-name': 'Test User'
      }
    });

    console.log('\n📥 Server Response');
    console.log('Status:', response.status);
    
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));

    if (data.success) {
      console.log('\n✅ Files uploaded successfully!');
      console.log('Files saved:');
      if (data.log?.frameFile) console.log('  - ' + data.log.frameFile);
      if (data.log?.videoFile) console.log('  - ' + data.log.videoFile);
      if (data.log?.audioFile) console.log('  - ' + data.log.audioFile);
    } else {
      console.log('\n❌ Upload failed');
    }

    // Now test retrieving recordings
    console.log('\n\n📂 Checking Recordings API');
    console.log('=========================');
    
    const recordingsResponse = await fetch('http://127.0.0.1:3001/api/recordings');
    const recordingsData = await recordingsResponse.json();
    
    console.log('Total recordings:', recordingsData.total);
    console.log('Photos:', recordingsData.photos?.length || 0);
    console.log('Audio clips:', recordingsData.audioClips?.length || 0);
    console.log('Users:', recordingsData.users?.length || 0);

    if (recordingsData.photos?.length > 0) {
      console.log('\n📷 Sample Photo:');
      console.log('  ID:', recordingsData.photos[0].id);
      console.log('  URL:', recordingsData.photos[0].url);
    }

    if (recordingsData.audioClips?.length > 0) {
      console.log('\n🎤 Sample Audio:');
      console.log('  ID:', recordingsData.audioClips[0].id);
      console.log('  URL:', recordingsData.audioClips[0].url);
    }

  } catch (err) {
    console.error('\n❌ Error:', err.message);
    if (err.response) {
      console.error('Response:', await err.response.text());
    }
  }
}

sendTestData();
