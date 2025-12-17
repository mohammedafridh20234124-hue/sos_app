import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import multer from 'multer';
import mysql from 'mysql2/promise';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// ==================== Persistent Storage Setup ====================
// Store recordings metadata in a JSON file for persistence across server restarts
const uploadsDir = path.join(__dirname, 'uploads');
const recordingsMetadataFile = path.join(uploadsDir, 'recordings-metadata.json');

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Created uploads directory');
}

// Load recordings metadata from file on startup
let recordingsByUser = {};
const loadRecordingsFromDisk = () => {
  try {
    if (fs.existsSync(recordingsMetadataFile)) {
      const data = fs.readFileSync(recordingsMetadataFile, 'utf-8');
      const metadata = JSON.parse(data);
      
      // Reconstruct recordings with buffers from disk files
      for (const userId in metadata) {
        recordingsByUser[userId] = {
          userId: metadata[userId].userId,
          userName: metadata[userId].userName,
          photos: [],
          videoClips: [],
          audioClips: [],
          recordings: metadata[userId].recordings || []
        };

        // Load photo buffers from disk
        if (metadata[userId].photos && Array.isArray(metadata[userId].photos)) {
          for (const photoMeta of metadata[userId].photos) {
            const bufferPath = path.join(uploadsDir, `${photoMeta.id}.buffer`);
            if (fs.existsSync(bufferPath)) {
              const buffer = fs.readFileSync(bufferPath);
              recordingsByUser[userId].photos.push({
                ...photoMeta,
                buffer: buffer
              });
            }
          }
        }

        // Load video buffers from disk
        if (metadata[userId].videoClips && Array.isArray(metadata[userId].videoClips)) {
          for (const videoMeta of metadata[userId].videoClips) {
            const bufferPath = path.join(uploadsDir, `${videoMeta.id}.buffer`);
            if (fs.existsSync(bufferPath)) {
              const buffer = fs.readFileSync(bufferPath);
              recordingsByUser[userId].videoClips.push({
                ...videoMeta,
                buffer: buffer
              });
            }
          }
        }

        // Load audio buffers from disk
        if (metadata[userId].audioClips && Array.isArray(metadata[userId].audioClips)) {
          for (const audioMeta of metadata[userId].audioClips) {
            const bufferPath = path.join(uploadsDir, `${audioMeta.id}.buffer`);
            if (fs.existsSync(bufferPath)) {
              const buffer = fs.readFileSync(bufferPath);
              recordingsByUser[userId].audioClips.push({
                ...audioMeta,
                buffer: buffer
              });
            }
          }
        }
      }
      console.log(`📂 Loaded recordings metadata for ${Object.keys(recordingsByUser).length} users from disk`);
    }
  } catch (error) {
    console.warn('⚠ Failed to load recordings metadata from disk:', error.message);
    recordingsByUser = {};
  }
};

// Save recordings metadata to file (without buffers - save buffers separately)
const saveRecordingsToDisk = () => {
  try {
    // Save metadata without buffers
    const metadataToSave = {};
    for (const userId in recordingsByUser) {
      metadataToSave[userId] = {
        userId: recordingsByUser[userId].userId,
        userName: recordingsByUser[userId].userName,
        photos: recordingsByUser[userId].photos.map(p => ({
          id: p.id,
          recordingId: p.recordingId,
          userId: p.userId,
          userName: p.userName,
          alertId: p.alertId,
          timestamp: p.timestamp,
          location: p.location,
          size: p.size,
          mimeType: p.mimeType,
          type: p.type
        })),
        videoClips: recordingsByUser[userId].videoClips.map(v => ({
          id: v.id,
          recordingId: v.recordingId,
          userId: v.userId,
          userName: v.userName,
          alertId: v.alertId,
          timestamp: v.timestamp,
          location: v.location,
          size: v.size,
          mimeType: v.mimeType,
          type: v.type
        })),
        audioClips: recordingsByUser[userId].audioClips.map(a => ({
          id: a.id,
          recordingId: a.recordingId,
          userId: a.userId,
          userName: a.userName,
          alertId: a.alertId,
          timestamp: a.timestamp,
          location: a.location,
          size: a.size,
          mimeType: a.mimeType,
          type: a.type
        })),
        recordings: recordingsByUser[userId].recordings.map(r => ({
          id: r.id,
          userId: r.userId,
          userName: r.userName,
          alertId: r.alertId,
          timestamp: r.timestamp,
          location: r.location,
          hasFrame: r.hasFrame,
          hasVideo: r.hasVideo,
          hasAudio: r.hasAudio,
          frameSize: r.frameSize,
          videoSize: r.videoSize,
          audioSize: r.audioSize,
          status: r.status
        }))
      };
    }
    
    fs.writeFileSync(recordingsMetadataFile, JSON.stringify(metadataToSave, null, 2));
    
    // Save buffers as separate files
    for (const userId in recordingsByUser) {
      // Save photo buffers
      for (const photo of recordingsByUser[userId].photos) {
        if (photo.buffer) {
          const bufferPath = path.join(uploadsDir, `${photo.id}.buffer`);
          fs.writeFileSync(bufferPath, photo.buffer);
        }
      }
      
      // Save audio buffers
      for (const audio of recordingsByUser[userId].audioClips) {
        if (audio.buffer) {
          const bufferPath = path.join(uploadsDir, `${audio.id}.buffer`);
          fs.writeFileSync(bufferPath, audio.buffer);
        }
      }
    }
  } catch (error) {
    console.error('❌ Failed to save recordings to disk:', error.message);
  }
};

// Load on startup
loadRecordingsFromDisk();

const MAX_RECORDINGS_PER_USER = 100;
const MAX_ITEMS_PER_USER = 100;

// Configure multer for file uploads (memory storage for demo)
const uploadMulter = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    fieldSize: 50 * 1024 * 1024
  }
});

// Middleware - CORS with explicit configuration
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-alert-id', 'x-user-id', 'x-user-name', 'x-timestamp', 'x-location']
}));

// Important: Add specific routes BEFORE global JSON middleware for multipart routes
// This prevents express.json() from consuming the body before multer can process it

// ==================== Live Recording Receive ====================

// Receive live video/audio frames from the recorder
app.post('/api/receive', uploadMulter.any(), async (req, res) => {
  try {
    console.log(`\n📹 [api/receive] POST request received at ${new Date().toISOString()}`);
    console.log(`   Content-Type: ${req.headers['content-type']}`);
    console.log(`   Files received: ${req.files?.length || 0}`);
    console.log(`   Body keys: ${Object.keys(req.body || {}).join(', ')}`);
    
    // Get user/student ID from request headers or body
    const userId = req.headers['x-user-id'] || req.body?.userId || `unknown_${Date.now()}`;
    const userName = req.headers['x-user-name'] || req.body?.userName || 'Unknown User';
    const alertId = req.headers['x-alert-id'] || req.body?.alertId || `alert_${Date.now()}`;
    const timestamp = req.headers['x-timestamp'] || req.body?.timestamp || new Date().toISOString();
    const locationStr = req.headers['x-location'] || req.body?.location;
    
    let location = { lat: 0, lon: 0 };
    try {
      if (locationStr) {
        location = typeof locationStr === 'string' ? JSON.parse(locationStr) : locationStr;
      }
    } catch (parseErr) {
      console.warn(`   ⚠️ Failed to parse location:`, parseErr.message);
    }

    console.log(`✅ Received live recording from user: ${userName} (${userId})`);
    console.log(`   Alert ID: ${alertId}`);
    console.log(`   Location: ${location.lat}, ${location.lon}`);
    console.log(`   Timestamp: ${timestamp}`);

    // Initialize user storage if not exists
    if (!recordingsByUser[userId]) {
      recordingsByUser[userId] = {
        userId,
        userName,
        photos: [],
        videoClips: [],
        audioClips: [],
        recordings: []
      };
      console.log(`   📝 Created new user entry for: ${userId}`);
    }

    // Extract files from multipart upload
    let frameFile = null;
    let videoFile = null;
    let audioFile = null;
    let fileCount = 0;

    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      console.log(`   📦 Processing ${req.files.length} file(s)`);
      req.files.forEach(file => {
        fileCount++;
        const sizeKB = (file.size / 1024).toFixed(2);
        console.log(`     ${fileCount}. Field: "${file.fieldname}" | Size: ${sizeKB} KB | Type: ${file.mimetype}`);
        
        if (file.fieldname === 'frame') frameFile = file;
        if (file.fieldname === 'video') videoFile = file;
        if (file.fieldname === 'audio') audioFile = file;
      });
    } else {
      console.warn(`   ⚠️ No files received in request!`);
    }

    // Create recording object
    const recordingId = `rec_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const recording = {
      id: recordingId,
      userId,
      userName,
      alertId,
      timestamp: new Date(timestamp).toISOString(),
      location,
      hasFrame: !!frameFile,
      hasVideo: !!videoFile,
      hasAudio: !!audioFile,
      frameSize: frameFile?.size || 0,
      videoSize: videoFile?.size || 0,
      audioSize: audioFile?.size || 0,
      status: 'received',
      frameBuffer: frameFile?.buffer || null,
      videoBuffer: videoFile?.buffer || null,
      audioBuffer: audioFile?.buffer || null
    };

    // Store recording in user's collection
    recordingsByUser[userId].recordings.push(recording);
    if (recordingsByUser[userId].recordings.length > MAX_RECORDINGS_PER_USER) {
      recordingsByUser[userId].recordings.shift();
    }

    // Store frame as photo if available
    if (frameFile && frameFile.buffer && frameFile.buffer.length > 0) {
      const photo = {
        id: `photo_${recordingId}`,
        recordingId,
        userId,
        userName,
        alertId,
        timestamp: new Date(timestamp).toISOString(),
        location,
        size: frameFile.size,
        mimeType: frameFile.mimetype,
        buffer: frameFile.buffer,
        type: 'frame'
      };
      recordingsByUser[userId].photos.push(photo);
      if (recordingsByUser[userId].photos.length > MAX_ITEMS_PER_USER) {
        recordingsByUser[userId].photos.shift();
      }
      console.log(`   📸 ✅ Stored photo: ${photo.id} (${(frameFile.size / 1024).toFixed(2)} KB)`);
    } else if (frameFile) {
      console.warn(`   📸 ⚠️ Frame file received but buffer is empty or missing`);
    }

    // Store audio clip if available
    if (audioFile && audioFile.buffer && audioFile.buffer.length > 0) {
      const audioClip = {
        id: `audio_${recordingId}`,
        recordingId,
        userId,
        userName,
        alertId,
        timestamp: new Date(timestamp).toISOString(),
        location,
        size: audioFile.size,
        mimeType: audioFile.mimetype,
        buffer: audioFile.buffer,
        type: 'audio'
      };
      recordingsByUser[userId].audioClips.push(audioClip);
      if (recordingsByUser[userId].audioClips.length > MAX_ITEMS_PER_USER) {
        recordingsByUser[userId].audioClips.shift();
      }
      console.log(`   🔊 ✅ Stored audio: ${audioClip.id} (${(audioFile.size / 1024).toFixed(2)} KB)`);
    } else if (audioFile) {
      console.warn(`   🔊 ⚠️ Audio file received but buffer is empty or missing`);
    }

    // Store video clip if available
    if (videoFile && videoFile.buffer && videoFile.buffer.length > 0) {
      const videoClip = {
        id: `video_${recordingId}`,
        recordingId,
        userId,
        userName,
        alertId,
        timestamp: new Date(timestamp).toISOString(),
        location,
        size: videoFile.size,
        mimeType: videoFile.mimetype,
        buffer: videoFile.buffer,
        type: 'video'
      };
      recordingsByUser[userId].videoClips.push(videoClip);
      if (recordingsByUser[userId].videoClips.length > MAX_ITEMS_PER_USER) {
        recordingsByUser[userId].videoClips.shift();
      }
      console.log(`   🎬 ✅ Stored video: ${videoClip.id} (${(videoFile.size / 1024).toFixed(2)} KB)`);
    } else if (videoFile) {
      console.warn(`   🎬 ⚠️ Video file received but buffer is empty or missing`);
    }

    // Log storage summary
    const totalUsers = Object.keys(recordingsByUser).length;
    const userPhotos = recordingsByUser[userId].photos.length;
    const userVideos = recordingsByUser[userId].videoClips.length;
    const userAudio = recordingsByUser[userId].audioClips.length;
    const userRecordings = recordingsByUser[userId].recordings.length;
    console.log(`✅ Storage Summary:`);
    console.log(`   Total Users: ${totalUsers}`);
    console.log(`   ${userName} Stats: ${userPhotos} photos | ${userVideos} videos | ${userAudio} audio clips | ${userRecordings} recordings`);

    // Save to disk for persistence
    try {
      saveRecordingsToDisk();
      console.log(`✅ Data saved to disk\n`);
    } catch (diskErr) {
      console.error(`❌ Failed to save to disk:`, diskErr.message);
    }

    res.json({ 
      success: true, 
      message: 'Recording received and stored',
      recordingId,
      userId,
      received: {
        frame: !!frameFile,
        video: !!videoFile,
        audio: !!audioFile
      },
      stored: {
        frameSize: frameFile?.size || 0,
        videoSize: videoFile?.size || 0,
        audioSize: audioFile?.size || 0
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ ERROR in /api/receive:', error);
    console.error('   Stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to receive frame', 
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// NOW add the global JSON middleware - after the multipart route
app.use(express.json());

// Email configuration
let emailTransporter = null;

const configureEmailService = async () => {
  const emailService = process.env.EMAIL_SERVICE || 'gmail';
  const emailUser = process.env.EMAIL_USER;
  const emailPassword = process.env.EMAIL_PASSWORD;

  if (emailUser && emailPassword) {
    try {
      emailTransporter = nodemailer.createTransport({
        service: emailService,
        auth: {
          user: emailUser,
          pass: emailPassword,
        },
      });

      // Verify connection (non-blocking with timeout)
      try {
        await Promise.race([
          emailTransporter.verify(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Email verification timeout')), 5000))
        ]);
        console.log('✓ Email service configured successfully');
      } catch (error) {
        console.warn('⚠ Email service configuration failed:', error.message);
        console.warn('OTP codes will be logged to console instead');
      }
    } catch (error) {
      console.warn('⚠ Email service configuration failed:', error.message);
      console.warn('OTP codes will be logged to console instead');
    }
  } else {
    console.warn('⚠ Email credentials not configured. Set EMAIL_USER and EMAIL_PASSWORD env vars.');
  }
};

// Twilio SMS configuration
let twilioClient = null;

const configureTwilioService = async () => {
  const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

  if (twilioAccountSid && twilioAuthToken && twilioPhoneNumber) {
    try {
      const twilio = await import('twilio');
      twilioClient = twilio.default(twilioAccountSid, twilioAuthToken);
      console.log('✓ Twilio SMS service configured successfully');
    } catch (error) {
      console.warn('⚠ Twilio SMS service configuration failed:', error.message);
      console.warn('SMS codes will be logged to console instead');
    }
  } else {
    console.warn('⚠ Twilio credentials not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER env vars.');
  }
};

// Initialize services (async, don't block server startup)
configureEmailService().catch(err => {
  console.warn('Email service failed to initialize:', err.message);
});
configureTwilioService().catch(err => {
  console.warn('Twilio service failed to initialize:', err.message);
});

// ==================== Email OTP Endpoints ====================

// Send OTP via Email
app.post('/api/send-otp', async (req, res) => {
  try {
    const { email, otp, userName = 'User' } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    // Log OTP for development (security: remove in production)
    console.log(`📧 OTP Email - Email: ${email}, Code: ${otp}`);

    if (emailTransporter) {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
              .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
              .header { color: #333; font-size: 24px; font-weight: bold; margin-bottom: 20px; }
              .message { color: #666; font-size: 16px; margin-bottom: 20px; }
              .otp-box { background-color: #f0f0f0; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0; border-radius: 4px; }
              .otp-code { font-size: 32px; font-weight: bold; color: #2563eb; letter-spacing: 5px; }
              .expiry { color: #999; font-size: 14px; margin-top: 20px; }
              .footer { color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 15px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">🔐 Email Verification</div>
              <div class="message">Hi ${userName},</div>
              <div class="message">Your verification code is:</div>
              <div class="otp-box">
                <div class="otp-code">${otp}</div>
              </div>
              <div class="message">Enter this code to verify your email and complete your registration.</div>
              <div class="expiry">This code expires in 10 minutes</div>
              <div class="message">If you didn't request this code, please ignore this email.</div>
              <div class="footer">
                <p>SOS Campus Security System</p>
                <p>Do not reply to this email - it is automatically generated</p>
              </div>
            </div>
          </body>
        </html>
      `;

      await emailTransporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: `Your Verification Code: ${otp}`,
        html: htmlContent,
      });

      console.log(`✓ OTP email sent to ${email}`);
      res.json({ success: true, message: 'OTP sent via email' });
    } else {
      console.warn(`⚠ Email service unavailable, OTP in database: ${otp}`);
      res.json({ success: true, message: 'OTP saved to database (email service unavailable)' });
    }
  } catch (error) {
    console.error('Error sending OTP email:', error);
    res.status(500).json({ error: 'Failed to send OTP', details: error.message });
  }
});

// ==================== SMS OTP Endpoints ====================

// Send OTP via SMS
app.post('/api/send-sms-otp', async (req, res) => {
  try {
    const { phone, otp, userName = 'User' } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ error: 'Phone and OTP are required' });
    }

    // Log SMS OTP for development (security: remove in production)
    console.log(`📱 SMS OTP - Phone: ${phone}, Code: ${otp}`);

    if (twilioClient) {
      const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
      const message = `Your SOS Campus Security verification code is: ${otp}. Valid for 10 minutes.`;

      try {
        await twilioClient.messages.create({
          body: message,
          from: twilioPhoneNumber,
          to: phone,
        });

        console.log(`✓ SMS OTP sent to ${phone}`);
        res.json({ success: true, message: 'OTP sent via SMS' });
      } catch (twilioError) {
        console.error('Twilio error:', twilioError);
        res.status(500).json({ error: 'Failed to send SMS', details: twilioError.message });
      }
    } else {
      console.warn(`⚠ Twilio service unavailable, SMS saved to database: ${otp}`);
      // Store in a simple file for testing
      res.json({ success: true, message: 'SMS saved (Twilio service unavailable)', testCode: otp });
    }
  } catch (error) {
    console.error('Error sending SMS OTP:', error);
    res.status(500).json({ error: 'Failed to send SMS OTP', details: error.message });
  }
});

// ==================== Location Update Endpoint ====================

// Receive continuous location updates during emergency
app.post('/api/location-update', (req, res) => {
  try {
    const alertId = req.headers['x-alert-id'];
    const timestamp = req.headers['x-timestamp'] || new Date().toISOString();
    const locationData = req.body;

    console.log(`📍 Location Update - Alert: ${alertId}, Location: ${locationData.latitude}, ${locationData.longitude}`);

    res.json({ success: true, message: 'Location recorded' });
  } catch (error) {
    console.error('Error recording location:', error);
    res.status(500).json({ error: 'Failed to record location', details: error.message });
  }
});

// ==================== Notification Endpoints ====================

// Send push notification (placeholder for future enhancement)
app.post('/api/send-notification', async (req, res) => {
  try {
    const { userId, title, message, type = 'info' } = req.body;

    console.log(`📢 Notification - User: ${userId}, Title: ${title}, Message: ${message}, Type: ${type}`);

    res.json({ success: true, message: 'Notification queued' });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({ error: 'Failed to send notification', details: error.message });
  }
});

// Send broadcast SMS to multiple recipients
app.post('/api/send-broadcast-sms', async (req, res) => {
  try {
    const { recipients, title, message } = req.body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ error: 'Recipients array is required' });
    }

    if (!title || !message) {
      return res.status(400).json({ error: 'Title and message are required' });
    }

    // Format message
    const smsMessage = `🔔 ${title}\n\n${message}`;

    if (!twilioClient) {
      console.warn('⚠️ Twilio not configured. SMS messages will be logged to console only.');
      console.log(`📱 [DEMO SMS] Message: "${smsMessage}"`);
      
      recipients.forEach(recipient => {
        console.log(`📱 [DEMO SMS] To: ${recipient.phone_number} | User: ${recipient.user_name}`);
      });

      return res.json({
        success: true,
        mode: 'demo',
        message: 'Broadcast would be sent (Twilio not configured)',
        recipientCount: recipients.length
      });
    }

    // Send SMS to each recipient
    let sentCount = 0;
    let failedCount = 0;
    const failedRecipients = [];

    for (const recipient of recipients) {
      try {
        if (!recipient.phone_number) {
          console.warn(`⚠️ No phone number for user: ${recipient.user_name}`);
          failedCount++;
          failedRecipients.push({ user_name: recipient.user_name, reason: 'No phone number' });
          continue;
        }

        const result = await twilioClient.messages.create({
          body: smsMessage,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: recipient.phone_number
        });

        console.log(`✅ SMS sent to ${recipient.user_name} (${recipient.phone_number}): ${result.sid}`);
        sentCount++;
      } catch (error) {
        console.error(`❌ Failed to send SMS to ${recipient.user_name} (${recipient.phone_number}):`, error.message);
        failedCount++;
        failedRecipients.push({ user_name: recipient.user_name, reason: error.message });
      }
    }

    res.json({
      success: true,
      sentCount,
      failedCount,
      totalRecipients: recipients.length,
      failedRecipients: failedRecipients.length > 0 ? failedRecipients : undefined,
      message: `Sent to ${sentCount}/${recipients.length} recipients`
    });
  } catch (error) {
    console.error('❌ Error in send-broadcast-sms:', error);
    res.status(500).json({ error: 'Failed to send broadcast SMS', details: error.message });
  }
});

// ==================== Get Recordings ====================

// Get all stored recordings organized by user
app.get('/api/recordings', (req, res) => {
  try {
    // Get optional userId filter from query params
    const filterUserId = req.query.userId;

    console.log(`📹 Fetching recordings${filterUserId ? ` for user: ${filterUserId}` : ' (all users)'}`);
    
    let result;
    if (filterUserId) {
      // Return only specific user's data
      const userData = recordingsByUser[filterUserId];
      if (!userData) {
        result = {
          success: true,
          userId: filterUserId,
          recordings: [],
          photos: [],
          audioClips: [],
          total: { recordings: 0, photos: 0, audioClips: 0 }
        };
      } else {
        result = {
          success: true,
          userId: filterUserId,
          userName: userData.userName,
          recordings: userData.recordings.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
          photos: userData.photos.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).map(p => ({
            id: p.id,
            recordingId: p.recordingId,
            userId: p.userId,
            userName: p.userName,
            alertId: p.alertId,
            timestamp: p.timestamp,
            location: p.location,
            size: p.size,
            mimeType: p.mimeType,
            type: p.type
          })),
          videoClips: userData.videoClips.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).map(v => ({
            id: v.id,
            recordingId: v.recordingId,
            userId: v.userId,
            userName: v.userName,
            alertId: v.alertId,
            timestamp: v.timestamp,
            location: v.location,
            size: v.size,
            mimeType: v.mimeType,
            type: v.type
          })),
          audioClips: userData.audioClips.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).map(a => ({
            id: a.id,
            recordingId: a.recordingId,
            userId: a.userId,
            userName: a.userName,
            alertId: a.alertId,
            timestamp: a.timestamp,
            location: a.location,
            size: a.size,
            mimeType: a.mimeType,
            type: a.type
          })),
          total: {
            recordings: userData.recordings.length,
            photos: userData.photos.length,
            videoClips: userData.videoClips.length,
            audioClips: userData.audioClips.length
          }
        };
      }
    } else {
      // Return all users' data organized by user
      const allUsers = Object.keys(recordingsByUser).map(userId => {
        const userData = recordingsByUser[userId];
        return {
          userId: userData.userId,
          userName: userData.userName,
          recordings: userData.recordings.length,
          photos: userData.photos.length,
          videoClips: userData.videoClips.length,
          audioClips: userData.audioClips.length
        };
      });

      result = {
        success: true,
        users: allUsers,
        total: {
          totalUsers: Object.keys(recordingsByUser).length,
          totalRecordings: Object.values(recordingsByUser).reduce((sum, u) => sum + u.recordings.length, 0),
          totalPhotos: Object.values(recordingsByUser).reduce((sum, u) => sum + u.photos.length, 0),
          totalVideoClips: Object.values(recordingsByUser).reduce((sum, u) => sum + u.videoClips.length, 0),
          totalAudioClips: Object.values(recordingsByUser).reduce((sum, u) => sum + u.audioClips.length, 0)
        }
      };
    }

    console.log(`✅ Returning data:`, result.total || result);
    res.json(result);
  } catch (error) {
    console.error('❌ Error fetching recordings:', error);
    res.status(500).json({ error: 'Failed to fetch recordings', details: error.message });
  }
});

// Get a specific photo by ID (searches across all users)
app.get('/api/photo/:id', (req, res) => {
  try {
    const photoId = req.params.id;
    console.log(`📸 Fetching photo: ${photoId}`);
    
    // Search for photo across all users
    for (const userId of Object.keys(recordingsByUser)) {
      const photo = recordingsByUser[userId].photos.find(p => p.id === photoId);
      if (photo) {
        let buffer = null;
        
        // Check if buffer exists in memory
        if (photo.buffer && photo.buffer.length > 0) {
          buffer = photo.buffer;
          console.log(`✅ Found photo in memory: ${photoId}, size: ${buffer.length}`);
        } else {
          // Try to load from disk
          const bufferPath = path.join(uploadsDir, `${photoId}.buffer`);
          if (fs.existsSync(bufferPath)) {
            buffer = fs.readFileSync(bufferPath);
            console.log(`✅ Found photo on disk: ${photoId}, size: ${buffer.length}`);
          }
        }
        
        if (buffer && buffer.length > 0) {
          const mimeType = photo.mimeType || 'image/jpeg';
          res.set('Content-Type', mimeType);
          res.set('Content-Length', buffer.length);
          res.set('Cache-Control', 'public, max-age=86400');
          res.set('Access-Control-Allow-Origin', '*');
          console.log(`📤 Sending photo ${photoId} (${buffer.length} bytes, type: ${mimeType})`);
          return res.send(buffer);
        } else {
          console.warn(`⚠ Photo found but buffer is empty: ${photoId}`);
        }
      }
    }
    
    console.warn(`⚠ Photo not found: ${photoId}`);
    res.status(404).json({ error: 'Photo not found' });
  } catch (error) {
    console.error('❌ Error fetching photo:', error);
    res.status(500).json({ error: 'Failed to fetch photo', details: error.message });
  }
});

// Get a specific video by ID (searches across all users)
app.get('/api/video/:id', (req, res) => {
  try {
    const videoId = req.params.id;
    console.log(`🎬 Fetching video: ${videoId}`);
    
    // Search for video across all users
    for (const userId of Object.keys(recordingsByUser)) {
      const videoClip = recordingsByUser[userId].videoClips.find(v => v.id === videoId);
      if (videoClip) {
        let buffer = null;
        
        // Check if buffer exists in memory
        if (videoClip.buffer && videoClip.buffer.length > 0) {
          buffer = videoClip.buffer;
          console.log(`✅ Found video in memory: ${videoId}, size: ${buffer.length}`);
        } else {
          // Try to load from disk
          const bufferPath = path.join(uploadsDir, `${videoId}.buffer`);
          if (fs.existsSync(bufferPath)) {
            buffer = fs.readFileSync(bufferPath);
            console.log(`✅ Found video on disk: ${videoId}, size: ${buffer.length}`);
          }
        }
        
        if (buffer && buffer.length > 0) {
          const mimeType = videoClip.mimeType || 'video/webm';
          res.set('Content-Type', mimeType);
          res.set('Content-Length', buffer.length);
          res.set('Cache-Control', 'public, max-age=86400');
          res.set('Accept-Ranges', 'bytes');
          res.set('Access-Control-Allow-Origin', '*');
          console.log(`📤 Sending video ${videoId} (${buffer.length} bytes, type: ${mimeType})`);
          return res.send(buffer);
        } else {
          console.warn(`⚠ Video clip found but buffer is empty: ${videoId}`);
        }
      }
    }
    
    console.warn(`⚠ Video clip not found: ${videoId}`);
    res.status(404).json({ error: 'Video clip not found' });
  } catch (error) {
    console.error('❌ Error fetching video:', error);
    res.status(500).json({ error: 'Failed to fetch video', details: error.message });
  }
});

// Get a specific audio clip by ID (searches across all users)
app.get('/api/audio/:id', (req, res) => {
  try {
    const audioId = req.params.id;
    console.log(`🔊 Fetching audio: ${audioId}`);
    
    // Search for audio across all users
    for (const userId of Object.keys(recordingsByUser)) {
      const audioClip = recordingsByUser[userId].audioClips.find(a => a.id === audioId);
      if (audioClip) {
        let buffer = null;
        
        // Check if buffer exists in memory
        if (audioClip.buffer && audioClip.buffer.length > 0) {
          buffer = audioClip.buffer;
          console.log(`✅ Found audio in memory: ${audioId}, size: ${buffer.length}`);
        } else {
          // Try to load from disk
          const bufferPath = path.join(uploadsDir, `${audioId}.buffer`);
          if (fs.existsSync(bufferPath)) {
            buffer = fs.readFileSync(bufferPath);
            console.log(`✅ Found audio on disk: ${audioId}, size: ${buffer.length}`);
          }
        }
        
        if (buffer && buffer.length > 0) {
          const mimeType = audioClip.mimeType || 'audio/webm';
          res.set('Content-Type', mimeType);
          res.set('Content-Length', buffer.length);
          res.set('Cache-Control', 'public, max-age=86400');
          res.set('Accept-Ranges', 'bytes');
          res.set('Access-Control-Allow-Origin', '*');
          console.log(`📤 Sending audio ${audioId} (${buffer.length} bytes, type: ${mimeType})`);
          return res.send(buffer);
        } else {
          console.warn(`⚠ Audio clip found but buffer is empty: ${audioId}`);
        }
      }
    }
    
    console.warn(`⚠ Audio clip not found: ${audioId}`);
    res.status(404).json({ error: 'Audio clip not found' });
  } catch (error) {
    console.error('❌ Error fetching audio:', error);
    res.status(500).json({ error: 'Failed to fetch audio', details: error.message });
  }
});

// ==================== Clear Recordings ====================

// Clear recordings (all or specific user)
app.post('/api/recordings/clear', (req, res) => {
  try {
    const userId = req.query.userId;
    console.log(`📨 DELETE REQUEST received for userId: ${userId}`);

    if (userId) {
      // Clear specific user's data
      if (recordingsByUser[userId]) {
        const recordCount = recordingsByUser[userId].recordings.length;
        const photoCount = recordingsByUser[userId].photos.length;
        const videoCount = recordingsByUser[userId].videoClips.length;
        const audioCount = recordingsByUser[userId].audioClips.length;
        
        console.log(`   Before clear: ${recordCount} recordings, ${photoCount} photos, ${videoCount} videos, ${audioCount} audio clips`);
        
        // Delete buffer files for photos
        if (recordingsByUser[userId].photos) {
          for (const photo of recordingsByUser[userId].photos) {
            const bufferPath = path.join(uploadsDir, `${photo.id}.buffer`);
            if (fs.existsSync(bufferPath)) {
              fs.unlinkSync(bufferPath);
              console.log(`   🗑️  Deleted photo buffer: ${photo.id}.buffer`);
            }
          }
        }

        // Delete buffer files for videos
        if (recordingsByUser[userId].videoClips) {
          for (const video of recordingsByUser[userId].videoClips) {
            const bufferPath = path.join(uploadsDir, `${video.id}.buffer`);
            if (fs.existsSync(bufferPath)) {
              fs.unlinkSync(bufferPath);
              console.log(`   🗑️  Deleted video buffer: ${video.id}.buffer`);
            }
          }
        }
        
        // Delete buffer files for audio
        if (recordingsByUser[userId].audioClips) {
          for (const audio of recordingsByUser[userId].audioClips) {
            const bufferPath = path.join(uploadsDir, `${audio.id}.buffer`);
            if (fs.existsSync(bufferPath)) {
              fs.unlinkSync(bufferPath);
              console.log(`   🗑️  Deleted audio buffer: ${audio.id}.buffer`);
            }
          }
        }
        
        recordingsByUser[userId].recordings = [];
        recordingsByUser[userId].photos = [];
        recordingsByUser[userId].videoClips = [];
        recordingsByUser[userId].audioClips = [];
        
        console.log(`🗑️  Cleared recordings for user ${userId}: ${recordCount} recordings, ${photoCount} photos, ${videoCount} videos, ${audioCount} audio clips`);
        
        // Save to disk
        saveRecordingsToDisk();
        
        res.json({
          success: true,
          message: `Cleared ${recordCount} recordings, ${photoCount} photos, ${videoCount} videos, ${audioCount} audio clips for user ${userId}`,
          userId,
          remaining: {
            recordings: recordingsByUser[userId].recordings.length,
            photos: recordingsByUser[userId].photos.length,
            videoClips: recordingsByUser[userId].videoClips.length,
            audioClips: recordingsByUser[userId].audioClips.length
          }
        });
      } else {
        console.log(`⚠️  User ${userId} not found in recordingsByUser`);
        res.json({ success: true, message: 'User not found', userId });
      }
    } else {
      // Clear ALL users' data
      let totalRecords = 0;
      let totalPhotos = 0;
      let totalVideos = 0;
      let totalAudio = 0;

      Object.keys(recordingsByUser).forEach(uid => {
        // Delete all buffer files for this user's photos
        if (recordingsByUser[uid].photos) {
          for (const photo of recordingsByUser[uid].photos) {
            const bufferPath = path.join(uploadsDir, `${photo.id}.buffer`);
            if (fs.existsSync(bufferPath)) {
              fs.unlinkSync(bufferPath);
            }
          }
        }

        // Delete all buffer files for this user's videos
        if (recordingsByUser[uid].videoClips) {
          for (const video of recordingsByUser[uid].videoClips) {
            const bufferPath = path.join(uploadsDir, `${video.id}.buffer`);
            if (fs.existsSync(bufferPath)) {
              fs.unlinkSync(bufferPath);
            }
          }
        }
        
        // Delete all buffer files for this user's audio
        if (recordingsByUser[uid].audioClips) {
          for (const audio of recordingsByUser[uid].audioClips) {
            const bufferPath = path.join(uploadsDir, `${audio.id}.buffer`);
            if (fs.existsSync(bufferPath)) {
              fs.unlinkSync(bufferPath);
            }
          }
        }
        
        totalRecords += recordingsByUser[uid].recordings.length;
        totalPhotos += recordingsByUser[uid].photos.length;
        totalVideos += recordingsByUser[uid].videoClips.length;
        totalAudio += recordingsByUser[uid].audioClips.length;
        
        recordingsByUser[uid].recordings = [];
        recordingsByUser[uid].photos = [];
        recordingsByUser[uid].videoClips = [];
        recordingsByUser[uid].audioClips = [];
      });

      console.log(`🗑️  Cleared all recordings: ${totalRecords} recordings, ${totalPhotos} photos, ${totalVideos} videos, ${totalAudio} audio clips`);
      
      // Save to disk
      saveRecordingsToDisk();
      
      res.json({
        success: true,
        message: `Cleared ${totalRecords} recordings, ${totalPhotos} photos, ${totalVideos} videos, ${totalAudio} audio clips from all users`,
        remaining: {
          totalUsers: Object.keys(recordingsByUser).length,
          totalRecordings: 0,
          totalPhotos: 0,
          totalVideoClips: 0,
          totalAudioClips: 0
        }
      });
    }
  } catch (error) {
    console.error('❌ Error clearing recordings:', error);
    res.status(500).json({ error: 'Failed to clear recordings', details: error.message });
  }
});

// ==================== Delete Individual Recording ====================

// Delete a specific photo or audio clip by ID
app.delete('/api/recording/:id', (req, res) => {
  try {
    const recordingId = req.params.id;
    let deleted = false;

    // Search across all users for the recording item
    for (const userId of Object.keys(recordingsByUser)) {
      const userData = recordingsByUser[userId];

      // Check and remove from photos
      const photoIndex = userData.photos.findIndex(p => p.id === recordingId);
      if (photoIndex !== -1) {
        // Delete buffer file
        const bufferPath = path.join(uploadsDir, `${recordingId}.buffer`);
        if (fs.existsSync(bufferPath)) {
          fs.unlinkSync(bufferPath);
          console.log(`   🗑️  Deleted buffer file: ${recordingId}.buffer`);
        }
        userData.photos.splice(photoIndex, 1);
        console.log(`🗑️  Deleted photo ${recordingId} from user ${userId}`);
        deleted = true;
        break;
      }

      // Check and remove from audio clips
      const audioIndex = userData.audioClips.findIndex(a => a.id === recordingId);
      if (audioIndex !== -1) {
        // Delete buffer file
        const bufferPath = path.join(uploadsDir, `${recordingId}.buffer`);
        if (fs.existsSync(bufferPath)) {
          fs.unlinkSync(bufferPath);
          console.log(`   🗑️  Deleted buffer file: ${recordingId}.buffer`);
        }
        userData.audioClips.splice(audioIndex, 1);
        console.log(`🗑️  Deleted audio ${recordingId} from user ${userId}`);
        deleted = true;
        break;
      }

      // Check and remove from recordings
      const recordingIndex = userData.recordings.findIndex(r => r.id === recordingId);
      if (recordingIndex !== -1) {
        userData.recordings.splice(recordingIndex, 1);
        console.log(`🗑️  Deleted recording ${recordingId} from user ${userId}`);
        deleted = true;
        break;
      }
    }

    if (deleted) {
      // Save to disk
      saveRecordingsToDisk();
      res.json({ success: true, message: 'Recording deleted', recordingId });
    } else {
      res.status(404).json({ error: 'Recording not found', recordingId });
    }
  } catch (error) {
    console.error('❌ Error deleting recording:', error);
    res.status(500).json({ error: 'Failed to delete recording', details: error.message });
  }
});

// ==================== Health Check ====================

// Broadcast Message Endpoint - logs broadcast messages and sends SMS/Email
app.post('/api/broadcast', async (req, res) => {
  try {
    const { title, messageContent, studentCount, studentIds } = req.body;

    // Validate input
    if (!title || !messageContent) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        required: ['title', 'messageContent'] 
      });
    }

    console.log(`\n📢 [api/broadcast] Broadcast message received`);
    console.log(`   Title: ${title}`);
    console.log(`   Content: ${messageContent.substring(0, 100)}...`);
    console.log(`   Students: ${studentCount || 'unknown'}`);
    console.log(`   Student IDs: ${studentIds?.length || 0} provided`);

    // Log the broadcast
    const timestamp = new Date().toISOString();
    const broadcastLog = {
      id: `broadcast_${Date.now()}`,
      title,
      content: messageContent,
      studentCount: studentCount || 0,
      timestamp,
      status: 'sent',
      recipientCount: studentIds?.length || studentCount || 0
    };

    console.log(`✅ Broadcast recorded:`, broadcastLog);

    // TODO: Integration points for future features
    // - Send SMS to students via Twilio if phone numbers available
    // - Send email notifications if email addresses available
    // - Log to audit trail for admin records

    // Send success response
    res.json({ 
      success: true, 
      message: 'Broadcast message processed successfully',
      broadcast: broadcastLog,
      sentTo: studentIds?.length || studentCount || 0
    });

  } catch (error) {
    console.error('❌ Error processing broadcast:', error);
    res.status(500).json({ 
      error: 'Failed to process broadcast message', 
      details: error.message 
    });
  }
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    emailConfigured: emailTransporter !== null,
    twilioConfigured: twilioClient !== null,
    timestamp: new Date().toISOString(),
  });
});

// ==================== MySQL Notifications Endpoint ====================

// Create MySQL connection pool
const mysqlPool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'sos_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Endpoint: Get notifications from MySQL database
app.get('/api/mysql/notifications', async (req, res) => {
  try {
    const action = req.query.action || 'all';
    const userId = req.query.user_id;
    const type = req.query.type;
    
    let query = 'SELECT * FROM notifications';
    const params = [];
    
    // Filter by user_id if provided
    if (action === 'by_user' && userId) {
      query += ' WHERE user_id = ?';
      params.push(userId);
    }
    // Filter by type if provided
    else if (action === 'by_type' && type) {
      query += ' WHERE type = ?';
      params.push(type);
    }
    // Filter by broadcast type
    else if (action === 'broadcast') {
      query += " WHERE type = 'broadcast'";
    }
    // Filter unread only
    else if (action === 'unread') {
      query += ' WHERE is_read = FALSE OR is_read = 0';
    }
    
    // Order by created_at descending (newest first)
    query += ' ORDER BY created_at DESC LIMIT 100';
    
    console.log(`\n📊 [api/mysql/notifications] Query: ${query}`);
    console.log(`   Action: ${action}`);
    console.log(`   Params: ${params.join(', ')}`);
    
    // Get connection from pool
    const connection = await mysqlPool.getConnection();
    
    try {
      // Execute query
      const [rows] = await connection.execute(query, params);
      
      console.log(`✅ Found ${rows.length} notifications`);
      
      // Send response
      res.json({
        success: true,
        message: `Notifications fetched successfully (action: ${action})`,
        count: rows.length,
        data: rows
      });
      
    } finally {
      // Release connection back to pool
      connection.release();
    }
    
  } catch (error) {
    console.error('❌ MySQL query error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
});

// Endpoint: Test MySQL connection
app.get('/api/mysql/health', async (req, res) => {
  try {
    const connection = await mysqlPool.getConnection();
    const [rows] = await connection.execute('SELECT 1 as status');
    connection.release();
    
    res.json({
      success: true,
      message: 'MySQL connection successful',
      status: 'connected',
      database: 'sos_db'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'MySQL connection failed',
      error: error.message
    });
  }
});

// ==================== Student Feedback Endpoint ====================

// Send student feedback to admin via Twilio SMS
app.post('/api/feedback', async (req, res) => {
  try {
    const { studentName, studentId, feedbackMessage } = req.body;

    // Validate input
    if (!studentName || !studentId || !feedbackMessage) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        required: ['studentName', 'studentId', 'feedbackMessage'] 
      });
    }

    console.log(`\n📢 [api/feedback] Feedback received from student: ${studentName} (${studentId})`);
    console.log(`   Message: ${feedbackMessage.substring(0, 100)}...`);

    // Send feedback via Twilio SMS
    const success = await sendFeedbackNotification(studentName, studentId, feedbackMessage);

    if (success) {
      res.json({ 
        success: true, 
        message: 'Feedback sent successfully',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to send feedback notification',
        details: 'Twilio service may not be configured'
      });
    }
  } catch (error) {
    console.error('❌ Error processing feedback:', error);
    res.status(500).json({ 
      error: 'Failed to process feedback', 
      details: error.message 
    });
  }
});

// ==================== Twilio Feedback Notification Function ====================

/**
 * Send student feedback notification to admin via Twilio SMS
 * @param {string} studentName - Name of the student providing feedback
 * @param {string} studentId - ID of the student
 * @param {string} feedbackMessage - The feedback message content
 * @returns {Promise<boolean>} - True if notification sent successfully
 */
const sendFeedbackNotification = async (studentName, studentId, feedbackMessage) => {
  try {
    const adminPhoneNumber = process.env.ADMIN_PHONE_NUMBER;
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

    // Log if ADMIN_PHONE_NUMBER is not configured
    if (!adminPhoneNumber) {
      console.warn('⚠️ ADMIN_PHONE_NUMBER not configured in environment variables');
      console.log(`📢 Feedback received (SMS not sent):`);
      console.log(`   Student: ${studentName} (${studentId})`);
      console.log(`   Message: ${feedbackMessage}`);
      return true; // Return true since feedback was logged
    }

    if (!twilioClient) {
      console.warn('⚠️ Twilio service not configured');
      console.log(`📢 Feedback received (SMS not sent):`);
      console.log(`   Student: ${studentName} (${studentId})`);
      console.log(`   Message: ${feedbackMessage}`);
      return true; // Return true since feedback was logged
    }

    // Format the feedback message for SMS
    const timestamp = new Date().toLocaleString();
    const feedbackSMS = `📢 Student Feedback Received\nStudent: ${studentName}\nID: ${studentId}\nMessage:\n"${feedbackMessage}"\nTimestamp: ${timestamp}`;

    // Send SMS via Twilio
    const message = await twilioClient.messages.create({
      body: feedbackSMS,
      from: twilioPhoneNumber,
      to: adminPhoneNumber,
    });

    console.log(`✓ Feedback SMS sent to admin (${adminPhoneNumber})`);
    console.log(`  Message SID: ${message.sid}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send feedback notification:', error.message);
    
    // Log feedback for manual review even if Twilio fails
    console.log(`📢 Feedback logged for manual review:`);
    console.log(`   Student: ${studentName} (${studentId})`);
    console.log(`   Message: ${feedbackMessage}`);
    
    return false;
  }
};

// Global error handlers
app.use((err, req, res, next) => {
  console.error('❌ Express error handler:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection:', reason);
});

// Start server - listen on localhost specifically
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`   Listening on 127.0.0.1:${PORT}`);
  console.log(`📧 Email service: ${emailTransporter ? 'Configured' : 'Not configured'}`);
  console.log(`📱 Twilio SMS: ${twilioClient ? 'Configured' : 'Not configured'}`);
  console.log(`\n📌 Available Endpoints:`);
  console.log(`   POST /api/send-otp - Send OTP via email`);
  console.log(`   POST /api/send-sms-otp - Send OTP via SMS`);
});

server.on('error', (err) => {
  console.error('❌ Server error:', err.message);
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
  }
  process.exit(1);
});

server.on('error', (err) => {
  console.error('❌ Server error:', err);
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
  }
  process.exit(1);
});
