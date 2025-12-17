import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { useAuth } from "@/contexts/AuthContext";

type Props = {
  alertId?: string | number;
};

export type LiveRecorderRef = {
  startRecording: () => void;
  stopRecording: () => void;
};

// Get the correct server URL based on the current host
const getServerUrl = () => {
  // First try environment variable (for production)
  const envUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_ADMIN_SERVER_URL;
  if (envUrl && envUrl.trim()) {
    console.log("✅ Using env URL:", envUrl);
    if (envUrl.includes('/api/receive')) {
      return envUrl;
    }
    return `${envUrl}/api/receive`;
  }
  
  // In development, use relative path to leverage Vite proxy
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    // Development mode - use Vite proxy
    const fullUrl = `/api/receive`;
    console.log("🔧 Using Vite proxy (development):", fullUrl);
    return fullUrl;
  } else {
    // Production mode - use environment variable or construct from current host
    // If no env var, try to use same host (for same-domain deployments)
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    // For Vercel, backend will be on separate service, so this is fallback
    const baseUrl = `${protocol}//${hostname}:3001`;
    const fullUrl = `${baseUrl}/api/receive`;
    console.log("🔧 Using hostname (fallback):", fullUrl);
    return fullUrl;
  }
};

const apiKey = import.meta.env.VITE_ADMIN_API_KEY || "";

const LiveRecorder = forwardRef<LiveRecorderRef, Props>(function LiveRecorder({ alertId }, ref) {
  const { user } = useAuth();
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordedAudioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const geoWatchIdRef = useRef<number | null>(null);
  const sendIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioMimeTypeRef = useRef<string>("audio/webm"); // Store the MIME type used for recording

  const [recording, setRecording] = useState(false);
  const [audioRecording, setAudioRecording] = useState(false);
  const [videoRecording, setVideoRecording] = useState(false);
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [transmitStatus, setTransmitStatus] = useState<string | null>(null);
  const [lastSentAt, setLastSentAt] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [audioTracksCount, setAudioTracksCount] = useState<number>(0);
  const [videoTracksCount, setVideoTracksCount] = useState<number>(0);
  const [recorderState, setRecorderState] = useState<string>("idle");
  const [lastSendResponse, setLastSendResponse] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(10);
  const [framesCaptured, setFramesCaptured] = useState<number>(0);
  const [audioBytesRecorded, setAudioBytesRecorded] = useState<number>(0);

  // Expose start/stop methods via ref
  useImperativeHandle(ref, () => ({
    startRecording: () => {
      console.log("🎬 StartRecording called via ref");
      startAll();
    },
    stopRecording: () => {
      console.log("🛑 StopRecording called via ref");
      stopAll();
    }
  }), []);

  useEffect(() => {
    return () => stopAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startCountdown() {
    setCountdown(10);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? 10 : prev - 1));
    }, 1000);
  }

  async function startAll() {
    try {
      setErrorMessage(null);
      console.log("📹 startAll: requesting camera VIDEO + AUDIO...");

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Media devices API not available");
      }

      // Request VIDEO + AUDIO
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: true,
      });

      streamRef.current = stream;
      const videoTracks = stream.getVideoTracks();
      const audioTracks = stream.getAudioTracks();

      setVideoTracksCount(videoTracks.length);
      setAudioTracksCount(audioTracks.length);

      console.log("✅ Got stream:", { videoTracks: videoTracks.length, audioTracks: audioTracks.length });

      if (videoTracks.length === 0 || audioTracks.length === 0) {
        throw new Error("Video or audio track not available");
      }

      // Attach video to preview
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch((err) => console.warn("⚠ Video play error:", err));
      }

      // Create audio stream from audio tracks
      if (audioTracks.length > 0) {
        const audioStream = new MediaStream(audioTracks);
        audioStreamRef.current = audioStream;
        console.log("✅ Audio stream created from", audioTracks.length, "audio track(s)");
        console.log("🎤 Audio stream active:", audioStream.active, "tracks:", audioStream.getTracks().length);
      } else {
        console.warn("⚠ No audio tracks available");
        throw new Error("No audio tracks available for recording");
      }

      // Create MediaRecorder for video with audio
      let videoMimeType = "video/webm";
      if (typeof MediaRecorder !== "undefined" && (MediaRecorder as any).isTypeSupported) {
        const types = [
          "video/webm;codecs=vp8,opus",
          "video/webm;codecs=vp9,opus",
          "video/webm",
        ];
        for (const t of types) {
          if ((MediaRecorder as any).isTypeSupported(t)) {
            videoMimeType = t;
            break;
          }
        }
      }

      console.log("📹 Using video MIME type:", videoMimeType);
      const mr = new MediaRecorder(stream, { mimeType: videoMimeType, videoBitsPerSecond: 2500000 });

      recordedChunksRef.current = [];

      mr.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
          console.log("📹 Video chunk received:", event.data.size, "bytes, total chunks:", recordedChunksRef.current.length);
        }
      };

      mr.onstart = () => {
        console.log("▶ Video Recording started");
        setVideoRecording(true);
        setRecorderState("recording");
      };

      mr.onstop = () => {
        console.log("⏹ Video Recording stopped");
        setVideoRecording(false);
        setRecorderState("stopped");
      };

      mr.onerror = (event) => {
        console.error("❌ MediaRecorder error:", event.error);
        setErrorMessage(`Recorder error: ${event.error}`);
        setRecorderState("error");
      };

      // Start video recording and request data every 10 seconds
      mr.start(10000);
      mediaRecorderRef.current = mr;

      // Create separate audio recorder
      let audioMimeType = "audio/webm";
      if (typeof MediaRecorder !== "undefined" && (MediaRecorder as any).isTypeSupported) {
        const types = [
          "audio/webm;codecs=opus",
          "audio/webm",
        ];
        for (const t of types) {
          if ((MediaRecorder as any).isTypeSupported(t)) {
            audioMimeType = t;
            break;
          }
        }
      }
      
      // Store the MIME type for later use when creating the blob
      audioMimeTypeRef.current = audioMimeType;

      console.log("🎤 Using audio MIME type:", audioMimeType);
      
      // Check if audio stream is valid before creating recorder
      if (!audioStreamRef.current || audioStreamRef.current.getTracks().length === 0) {
        console.error("❌ Audio stream is invalid or has no tracks");
        setErrorMessage("Audio stream is not available");
        throw new Error("Audio stream failed to initialize");
      }
      
      const audioRecorder = new MediaRecorder(audioStreamRef.current, { mimeType: audioMimeType });
      
      recordedAudioChunksRef.current = [];

      audioRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedAudioChunksRef.current.push(event.data);
          setAudioBytesRecorded((prev) => prev + event.data.size);
          console.log("🎤 Audio chunk received:", event.data.size, "bytes, total chunks:", recordedAudioChunksRef.current.length);
        }
      };

      audioRecorder.onstart = () => {
        console.log("▶ Audio Recording started");
        setAudioRecording(true);
      };

      audioRecorder.onstop = () => {
        console.log("⏹ Audio Recording stopped");
        setAudioRecording(false);
      };

      audioRecorder.onerror = (event) => {
        console.error("❌ Audio Recorder error:", event.error);
        setErrorMessage(`Audio recorder error: ${event.error}`);
      };

      // Start audio recording and request data every 10 seconds
      try {
        audioRecorder.start(10000);
        audioRecorderRef.current = audioRecorder;
        console.log("✅ Audio recorder started with 10-second interval");
      } catch (audioStartErr) {
        console.error("❌ Failed to start audio recorder:", audioStartErr);
        setErrorMessage(`Audio recorder failed to start: ${audioStartErr}`);
      }
      console.log("✅ Audio recorder started with 10-second interval");

      // Start geolocation
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setPosition(pos);
            console.log("📍 Got location:", { lat: pos.coords.latitude, lon: pos.coords.longitude });
          },
          (err) => {
            console.warn("⚠ Geolocation error:", err.message);
          },
          { enableHighAccuracy: true, timeout: 10000 }
        );

        const watchId = navigator.geolocation.watchPosition(
          (pos) => setPosition(pos),
          (err) => console.warn("⚠ Geolocation watch:", err.message),
          { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
        );
        geoWatchIdRef.current = watchId;
      }

      setRecording(true);
      startCountdown();
      startSendLoop();
    } catch (err: any) {
      console.error("❌ startAll failed:", err);
      setErrorMessage(err.message || String(err));
      setTransmitStatus("Failed to start");
    }
  }

  function stopAll() {
    console.log("🛑 Stopping all...");

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.warn("⚠ Error stopping video recorder:", e);
      }
    }

    if (audioRecorderRef.current && audioRecorderRef.current.state !== "inactive") {
      try {
        audioRecorderRef.current.stop();
      } catch (e) {
        console.warn("⚠ Error stopping audio recorder:", e);
      }
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => {
        try {
          t.stop();
        } catch {}
      });
      streamRef.current = null;
    }

    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((t) => {
        try {
          t.stop();
        } catch {}
      });
      audioStreamRef.current = null;
    }

    // Stop the video element from playing
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      try {
        videoRef.current.pause();
      } catch {}
    }

    if (geoWatchIdRef.current !== null) {
      try {
        navigator.geolocation?.clearWatch(geoWatchIdRef.current);
      } catch {}
      geoWatchIdRef.current = null;
    }

    if (sendIntervalRef.current) {
      clearInterval(sendIntervalRef.current);
      sendIntervalRef.current = null;
    }

    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }

    recordedChunksRef.current = [];
    recordedAudioChunksRef.current = [];
    setRecording(false);
    setAudioRecording(false);
    setVideoRecording(false);
    setRecorderState("idle");
    setCountdown(10);
  }

  async function captureFrame(): Promise<Blob | null> {
    try {
      const video = videoRef.current;
      if (!video) {
        console.warn("⚠ Video ref not available");
        return null;
      }

      // Wait a bit for video to be ready if needed
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        console.warn("⚠ Video not ready, dimensions:", { w: video.videoWidth, h: video.videoHeight });
        // Try waiting for loadedmetadata
        if (video.readyState < 2) {
          await new Promise((resolve) => {
            const handler = () => {
              video.removeEventListener("loadedmetadata", handler);
              resolve(null);
            };
            video.addEventListener("loadedmetadata", handler);
            setTimeout(resolve, 500); // Timeout after 500ms
          });
        }
      }

      // Check again after potential wait
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        console.warn("⚠ Video still not ready after wait");
        return null;
      }

      let canvas = canvasRef.current;
      if (!canvas) {
        canvas = document.createElement("canvas");
        canvasRef.current = canvas;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        console.warn("⚠ Could not get canvas context");
        return null;
      }

      ctx.drawImage(video, 0, 0);
      
      return new Promise((resolve) => {
        canvas!.toBlob(
          (b) => {
            if (b) {
              setFramesCaptured((prev) => prev + 1);
              console.log("🖼 Frame captured:", b.size, "bytes");
            } else {
              console.warn("⚠ toBlob returned null");
            }
            resolve(b);
          },
          "image/jpeg",
          0.85
        );
      });
    } catch (err) {
      console.warn("⚠ Frame capture exception:", err);
      return null;
    }
  }

  function startSendLoop() {
    sendPacket(); // send immediately
    sendIntervalRef.current = setInterval(() => sendPacket(), 10000);
  }

  async function sendPacket() {
    try {
      setTransmitStatus("Sending...");
      console.log("📤 sendPacket: collecting video + audio + frame...");

      // Combine all recorded video chunks into a single video blob
      let videoBlob: Blob | null = null;
      if (recordedChunksRef.current.length > 0) {
        videoBlob = new Blob(recordedChunksRef.current, { type: "video/webm" });
        console.log("📹 Video blob created:", videoBlob.size, "bytes from", recordedChunksRef.current.length, "chunks");
        recordedChunksRef.current = []; // Clear chunks after consuming
      } else {
        console.warn("⚠ No video chunks recorded yet - will send without video on first send");
      }

      // Combine all recorded audio chunks into a single audio blob
      let audioBlob: Blob | null = null;
      if (recordedAudioChunksRef.current.length > 0) {
        // Use the MIME type that was used during recording
        audioBlob = new Blob(recordedAudioChunksRef.current, { type: audioMimeTypeRef.current });
        console.log("🎤 Audio blob created:", audioBlob.size, "bytes from", recordedAudioChunksRef.current.length, "chunks, MIME:", audioMimeTypeRef.current);
        recordedAudioChunksRef.current = []; // Clear chunks after consuming
      } else {
        console.warn("⚠ No audio chunks recorded yet");
      }

      // Try to capture frame, but don't fail the entire send if it fails
      let frameBlob: Blob | null = null;
      try {
        frameBlob = await captureFrame();
        if (frameBlob) {
          console.log("🖼 Frame captured successfully:", frameBlob.size, "bytes");
        } else {
          console.warn("⚠ Frame capture returned null, will send without frame");
        }
      } catch (frameErr) {
        console.warn("⚠ Frame capture failed but continuing:", frameErr);
      }

      const loc = position
        ? {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date(position.timestamp).toISOString(),
          }
        : null;

      console.log("📊 Package contents:", {
        frameSize: frameBlob?.size || 0,
        videoSize: videoBlob?.size || 0,
        audioSize: audioBlob?.size || 0,
        location: loc ? "yes" : "no",
      });

      const fd = new FormData();
      if (frameBlob) fd.append("frame", frameBlob, "frame.jpg");
      if (videoBlob) fd.append("video", videoBlob, "video.webm");
      if (audioBlob && audioBlob.size > 0) {
        fd.append("audio", audioBlob, "audio.webm");
        console.log("✅ Audio blob added to FormData:", audioBlob.size, "bytes");
      } else {
        console.warn("⚠ Audio blob not added (size:", audioBlob?.size || 0, "bytes)");
      }

      // Only send if we have at least a frame or location
      if (!frameBlob && !videoBlob && !audioBlob && !loc) {
        console.warn("⚠ Nothing to send - no media or location data");
        setTransmitStatus("❌ No data to send");
        return;
      }

      const serverUrl = getServerUrl();
      console.log("🌐 POSTing to:", serverUrl);
      const headers: Record<string, string> = {};
      
      if (apiKey) {
        headers["Authorization"] = `Bearer ${apiKey}`;
      }
      
      // Send metadata as headers
      headers["x-alert-id"] = String(alertId || "unknown");
      headers["x-user-id"] = String(user?.id || "unknown");
      headers["x-user-name"] = String(user?.user_metadata?.full_name || user?.email || "Unknown User");
      headers["x-timestamp"] = new Date().toISOString();
      if (loc) {
        headers["x-location"] = JSON.stringify(loc);
      }
      
      console.log("📋 Request headers:", Object.keys(headers));
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        console.log("🌐 Sending FormData to:", serverUrl);
        console.log("📋 FormData contents:", {
          hasFrame: fd.has('frame'),
          hasVideo: fd.has('video'),
          hasAudio: fd.has('audio')
        });
        
        // IMPORTANT: When sending FormData, do NOT set Content-Type header
        // The browser will automatically set it with the correct boundary
        const res = await fetch(serverUrl, {
          method: "POST",
          body: fd,
          headers: headers,
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          console.error(`❌ Server error ${res.status}: ${text}`);
          throw new Error(`Server ${res.status}: ${text.slice(0, 200)}`);
        }

        const responseData = await res.json().catch(() => ({}));
        console.log("✅ Response:", { status: res.status, statusText: res.statusText, data: responseData });
        
        if (responseData.success) {
          console.log("✅ Send successful");
          setTransmitStatus("✓ Data Sent");
          setLastSentAt(new Date().toLocaleTimeString());
          setLastSendResponse(`${res.status} OK`);
        } else {
          console.warn("⚠️ Server returned non-success response:", responseData);
          setTransmitStatus("⚠️ Server warning - check logs");
        }
      } catch (fetchErr: any) {
        console.error("❌ Fetch error details:", {
          name: fetchErr.name,
          message: fetchErr.message,
          url: serverUrl,
          type: typeof fetchErr
        });
        
        // Check if it's a network error
        if (fetchErr.name === 'AbortError') {
          console.error("❌ Request timeout (30s exceeded)");
          setErrorMessage("❌ Request timeout - server may be unresponsive");
          setTransmitStatus("✗ Timeout");
          return; // Don't throw, let it retry
        }
        if (fetchErr.message === 'Failed to fetch' || fetchErr.message.includes('Cannot reach')) {
          console.error("❌ Network error - check server is running at:", serverUrl);
          console.error("   Ensure backend is started with: npm run server");
          console.error("   Server should be accessible at http://localhost:3001");
          setErrorMessage(`❌ Cannot reach server at ${serverUrl}.\n\nMake sure:\n1. Backend is running (npm run server)\n2. Port 3001 is not blocked\n3. No firewall is blocking the connection`);
          setTransmitStatus("✗ No Connection");
          return; // Don't throw, let it retry
        }
        console.error("❌ Unexpected error:", fetchErr.message);
        setErrorMessage(`❌ Send failed: ${fetchErr.message}`);
        setTransmitStatus("✗ Failed");
      }
    } catch (err: any) {
      console.error("❌ sendPacket failed:", err);
      setTransmitStatus("Send Failed ✗");
      setErrorMessage(err.message || String(err));
      setLastSendResponse(`Error: ${err.message}`);
    }
  }

  return (
    <div className="p-4 border rounded-lg bg-muted space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium">Live Video + Audio Recording</div>
          <div className="text-xs text-muted-foreground">Real-time video/audio/location to admin</div>
        </div>
        {!recording ? (
          <button
            onClick={startAll}
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 text-sm font-medium"
          >
            Start Live Feed
          </button>
        ) : (
          <button
            onClick={stopAll}
            className="px-4 py-2 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 text-sm font-medium"
          >
            Stop Live Feed
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="col-span-2">
          <video
            ref={videoRef}
            className="w-full bg-black rounded"
            style={{ maxHeight: "400px" }}
            playsInline
          />
          <canvas ref={canvasRef} style={{ display: "none" }} />
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Video</span>
            <div className="text-right">
              <div className={videoRecording ? "text-emergency font-bold" : "text-muted-foreground"}>
                {videoRecording ? "Recording ●" : "Idle"}
              </div>
              <div className="text-xs text-muted-foreground">Tracks: {videoTracksCount}</div>
              <div className="text-xs text-muted-foreground">Frames: {framesCaptured}</div>
            </div>
          </div>

          <div className="flex justify-between">
            <span>Audio</span>
            <div className="text-right">
              <div className={audioRecording ? "text-emergency font-bold" : "text-muted-foreground"}>
                {audioRecording ? "Recording ●" : "Idle"}
              </div>
              <div className="text-xs text-muted-foreground">Tracks: {audioTracksCount}</div>
              <div className="text-xs text-muted-foreground">Bytes: {(audioBytesRecorded / 1024).toFixed(1)} KB</div>
            </div>
          </div>

          <div className="flex justify-between">
            <span>Location</span>
            <div className="text-right">
              <div className={position ? "text-success font-bold" : "text-muted-foreground"}>
                {position ? "Tracking ✓" : "Waiting..."}
              </div>
              {position && (
                <div className="text-xs text-muted-foreground">
                  {position.coords.latitude.toFixed(4)}, {position.coords.longitude.toFixed(4)}
                </div>
              )}
            </div>
          </div>

          <div className={`p-2 bg-background rounded border ${errorMessage ? 'border-destructive' : ''}`}>
            <div className="text-xs font-mono space-y-1">
              <div>Send in: <strong>{countdown}s</strong></div>
              <div className={transmitStatus?.includes('Failed') ? 'text-destructive font-bold' : ''}>
                Status: {transmitStatus || "Idle"}
              </div>
              {lastSentAt && <div className="text-success">✓ Last: {lastSentAt}</div>}
              {lastSendResponse && <div>Resp: {lastSendResponse}</div>}
              {errorMessage && (
                <div className="text-destructive text-xs border-t pt-1 mt-1">
                  <div className="font-bold">❌ Error:</div>
                  <div className="whitespace-pre-wrap break-words">{errorMessage}</div>
                  <div className="text-muted-foreground text-xxs mt-1">
                    💡 Tip: Make sure backend server is running on port 3001
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default LiveRecorder;