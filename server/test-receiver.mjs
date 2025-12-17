import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { sendOTPEmail } from "./email-service.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, "uploads");

// Ensure uploads directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const app = express();
const upload = multer({ 
  dest: uploadDir, 
  limits: { 
    fileSize: 100 * 1024 * 1024,
    fields: 10,
    files: 10
  }
});

// Middleware
app.use(express.json());

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, x-alert-id, x-timestamp, x-location, x-user-id, x-user-name, X-Alert-ID, X-Timestamp, X-Location, X-User-ID, X-User-Name");
  res.header("Access-Control-Max-Age", "86400");
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
    return;
  }
  next();
});

// Delete recording file (before multer middleware)
app.delete("/api/recordings/:filename", (req, res) => {
  try {
    const filename = req.params.filename;
    console.log("🗑 Deleting file:", filename);
    
    // Prevent directory traversal
    if (filename.includes("..")) {
      console.warn("⚠ Directory traversal attempt blocked");
      return res.status(400).json({ error: "Invalid filename" });
    }
    
    const filePath = path.join(uploadDir, filename);
    console.log("🗑 Full path:", filePath);
    
    if (!fs.existsSync(filePath)) {
      console.warn("⚠ File not found:", filePath);
      return res.status(404).json({ error: "File not found" });
    }
    
    // Delete the file
    fs.unlinkSync(filePath);
    console.log("✅ File deleted:", filename);
    res.json({ success: true, message: "File deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting file:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/receive", upload.any(), (req, res) => {
  try {
    console.log("📥 Received request - headers:", { 
      alertId: req.get("x-alert-id"),
      timestamp: req.get("x-timestamp"),
      location: req.get("x-location")
    }, "files:", req.files?.length || 0);
    
    if (req.files && req.files.length > 0) {
      console.log("📁 Files received:");
      req.files.forEach(f => {
        console.log(`  - fieldname: ${f.fieldname}, size: ${f.size}, mimetype: ${f.mimetype}`);
      });
    }
    
    const alertId = req.get("x-alert-id") || "unknown";
    const timestamp = req.get("x-timestamp");
    let locationData = null;
    
    try {
      const locStr = req.get("x-location");
      if (locStr) {
        locationData = JSON.parse(locStr);
      }
    } catch (e) {
      console.warn("⚠ Could not parse location header");
    }
    
    const frameFile = req.files?.find(f => f.fieldname === "frame");
    const videoFile = req.files?.find(f => f.fieldname === "video");
    const audioFile = req.files?.find(f => f.fieldname === "audio");

    const log = {
      timestamp: new Date().toISOString(),
      alertId,
      receivedAt: timestamp,
      frameSize: frameFile?.size || 0,
      videoSize: videoFile?.size || 0,
      audioSize: audioFile?.size || 0,
      location: locationData,
      frameFile: frameFile?.filename || "none",
      videoFile: videoFile?.filename || "none",
      audioFile: audioFile?.filename || "none",
    };

    console.log("✅ Received data packet:", log);

    // Rename files with timestamp
    if (frameFile) {
      const newPath = path.join(uploadDir, `frame-${alertId}-${Date.now()}.jpg`);
      fs.renameSync(frameFile.path, newPath);
      log.frameFile = newPath;
    }
    if (videoFile) {
      const newPath = path.join(uploadDir, `video-${alertId}-${Date.now()}.webm`);
      fs.renameSync(videoFile.path, newPath);
      log.videoFile = newPath;
    }
    if (audioFile) {
      const newPath = path.join(uploadDir, `audio-${alertId}-${Date.now()}.webm`);
      fs.renameSync(audioFile.path, newPath);
      log.audioFile = newPath;
    }

    res.setHeader("Content-Type", "application/json");
    res.json({ success: true, message: "Data received", log });
  } catch (err) {
    console.error("❌ Error in /api/receive:", err);
    res.setHeader("Content-Type", "application/json");
    res.status(500).json({ success: false, error: err.message });
  }
});

// Location update endpoint
app.post("/api/location-update", (req, res) => {
  try {
    const alertId = req.get("x-alert-id") || "unknown";
    const timestamp = req.get("x-timestamp");
    const locationData = req.body;

    console.log("📍 Location update for", alertId, ":", {
      lat: locationData.latitude?.toFixed(4),
      lon: locationData.longitude?.toFixed(4),
      accuracy: locationData.accuracy?.toFixed(1) + "m"
    });

    res.setHeader("Content-Type", "application/json");
    res.json({ success: true, message: "Location received" });
  } catch (err) {
    console.error("❌ Error in /api/location-update:", err);
    res.setHeader("Content-Type", "application/json");
    res.status(500).json({ success: false, error: err.message });
  }
});

// Multer error handler
app.use((err, req, res, next) => {
  console.error("❌ Middleware error:", err.message, err.code);
  res.setHeader("Content-Type", "application/json");
  res.status(500).json({ 
    success: false, 
    error: err.message || "Server error",
    details: err.code
  });
});

// List all recorded files
app.get("/api/recordings", (req, res) => {
  try {
    console.log("📁 /api/recordings: scanning upload directory...");
    const files = fs.readdirSync(uploadDir);
    console.log("📁 Files in uploadDir:", files);
    
    // Group files by alert ID
    const filesByAlertId = {};
    
    const recordings = files
      .filter((f) => f.endsWith(".jpg") || f.endsWith(".webm"))
      .map((f) => {
        const fullPath = path.join(uploadDir, f);
        const stat = fs.statSync(fullPath);
        const match = f.match(/^(frame|video|audio)-(.+?)-(\d+)\./);
        const fileType = match ? match[1] : "unknown";
        
        // Determine type: frame=jpg, audio=webm with audio prefix, video=webm with video prefix
        let type = "video";
        if (fileType === "frame" || f.endsWith(".jpg")) {
          type = "frame";
        } else if (fileType === "audio") {
          type = "audio";
        }
        
        const alertId = match ? match[2] : "unknown";
        
        // Group by alert ID
        if (!filesByAlertId[alertId]) {
          filesByAlertId[alertId] = { frames: [], audio: [], video: [] };
        }
        
        if (type === "frame") {
          filesByAlertId[alertId].frames.push(f);
        } else if (type === "audio") {
          filesByAlertId[alertId].audio.push(f);
        } else {
          filesByAlertId[alertId].video.push(f);
        }
        
        return {
          filename: f,
          type: type,
          size: stat.size,
          mtime: stat.mtime,
          alertId: alertId,
          timestamp: match ? parseInt(match[3]) : 0,
        };
      })
      .sort((a, b) => b.timestamp - a.timestamp);

    // Convert to frontend format with photos and audioClips
    const photos = [];
    const audioClips = [];
    
    recordings.forEach((rec) => {
      if (rec.type === "frame") {
        photos.push({
          id: rec.filename,
          filename: rec.filename,
          url: `/api/recordings/${rec.filename}`,
          timestamp: rec.timestamp,
          alertId: rec.alertId,
          size: rec.size,
          mtime: rec.mtime,
        });
      } else if (rec.type === "audio") {
        audioClips.push({
          id: rec.filename,
          filename: rec.filename,
          url: `/api/recordings/${rec.filename}`,
          timestamp: rec.timestamp,
          alertId: rec.alertId,
          size: rec.size,
          mtime: rec.mtime,
        });
      }
    });

    // Build users list with their recordings
    const users = Object.entries(filesByAlertId).map(([alertId, files]) => ({
      id: alertId,
      name: alertId,
      email: alertId,
      hasPhotos: files.frames.length > 0,
      hasAudio: files.audio.length > 0,
      hasVideo: files.video.length > 0,
      photoCount: files.frames.length,
      audioCount: files.audio.length,
      videoCount: files.video.length,
      lastRecording: Math.max(
        ...recordings
          .filter((r) => r.alertId === alertId)
          .map((r) => r.timestamp || 0),
        0
      ),
    }));

    console.log("✅ /api/recordings: returning", recordings.length, "recordings,", users.length, "users");
    res.json({ 
      success: true, 
      recordings, 
      photos,
      audioClips,
      users,
      total: recordings.length 
    });
  } catch (err) {
    console.error("❌ Error in /api/recordings:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Serve recorded file
app.get("/api/recordings/:filename", (req, res) => {
  try {
    const filename = req.params.filename;
    console.log("📥 Serving file:", filename);
    
    // Prevent directory traversal
    if (filename.includes("..")) {
      console.warn("⚠ Directory traversal attempt blocked");
      return res.status(400).json({ error: "Invalid filename" });
    }
    
    const filePath = path.join(uploadDir, filename);
    console.log("📥 Full path:", filePath);
    
    if (!fs.existsSync(filePath)) {
      console.warn("⚠ File not found:", filePath);
      return res.status(404).json({ error: "File not found" });
    }
    
    // Set proper MIME types
    if (filename.startsWith("audio-") && filename.endsWith(".webm")) {
      res.setHeader("Content-Type", "audio/webm");
      res.setHeader("Content-Disposition", "inline; filename=" + filename);
    } else if (filename.endsWith(".webm")) {
      res.setHeader("Content-Type", "video/webm");
      res.setHeader("Content-Disposition", "inline; filename=" + filename);
    } else if (filename.endsWith(".jpg")) {
      res.setHeader("Content-Type", "image/jpeg");
      res.setHeader("Content-Disposition", "inline; filename=" + filename);
    }
    
    console.log("✅ Sending file:", filename);
    res.sendFile(filePath);
  } catch (err) {
    console.error("❌ Error serving file:", err);
    res.status(500).json({ error: err.message });
  }
});

// OTP Email endpoint
app.post("/api/send-otp", express.json(), async (req, res) => {
  try {
    const { email, otp, userName } = req.body;

    // Validate request body
    if (!email || !otp) {
      return res.status(400).json({ 
        success: false, 
        error: "Email and OTP are required" 
      });
    }

    // Send OTP email
    const result = await sendOTPEmail(email, otp, userName || "User");

    if (result.success) {
      console.log(`✉️ OTP email sent to ${email}`);
      return res.status(200).json({ 
        success: true, 
        message: "OTP email sent successfully" 
      });
    } else {
      console.error(`❌ Failed to send OTP to ${email}:`, result.error);
      return res.status(500).json({ 
        success: false, 
        error: result.error || "Failed to send OTP email" 
      });
    }
  } catch (error) {
    console.error("❌ Error in /api/send-otp:", error);
    return res.status(500).json({ 
      success: false, 
      error: "Internal server error" 
    });
  }
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", uploadDir });
});

const PORT = 3001;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Test receiver listening on http://localhost:${PORT}`);
  console.log(`📁 Uploads saved to: ${uploadDir}`);
});

process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

server.on("error", (err) => {
  console.error("❌ Server error:", err);
  process.exit(1);
});
