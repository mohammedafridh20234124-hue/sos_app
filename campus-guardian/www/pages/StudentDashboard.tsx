import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, MapPin, Phone, LogOut, CheckCircle, Clock, XCircle, Menu, X, Bell, MessageCircle, Moon, Sun, MessageSquare, Info, AlertTriangle, Send } from "lucide-react";
import LiveRecorder, { LiveRecorderRef } from "@/components/ui/live-recorder";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { FeedbackModal } from "@/components/FeedbackModal";
import NotificationPanel, { Notification } from "@/components/NotificationPanel";
import { Link } from "react-router-dom";

const StudentDashboard = () => {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const liveRecorderRef = useRef<LiveRecorderRef>(null);
  const [profile, setProfile] = useState<any>(null);
  const [activeAlert, setActiveAlert] = useState<any>(null);
  const [location, setLocation] = useState<GeolocationPosition | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [alertDuration, setAlertDuration] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{role: 'user' | 'bot', text: string}>>([]);
  const [broadcastMessages, setBroadcastMessages] = useState<Array<{id: string; title: string; message: string; created_at: string; read: boolean}>>([]);
  const [hiddenBroadcastIds, setHiddenBroadcastIds] = useState<Set<string>>(new Set());
  const [expandedNotification, setExpandedNotification] = useState<string | null>(null);
  const [panelNotifications, setPanelNotifications] = useState<Notification[]>([]);
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const notificationTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages appear - Enhanced for mobile
  useEffect(() => {
    if (chatMessagesEndRef.current) {
      // Use setTimeout to ensure DOM is fully rendered
      setTimeout(() => {
        chatMessagesEndRef.current?.scrollIntoView({ 
          behavior: 'smooth',
          block: 'nearest' 
        });
      }, 0);
    }
  }, [chatMessages]);

  // Load chat history from localStorage on mount
  useEffect(() => {
    const savedChatMessages = localStorage.getItem('chatbot_messages');
    if (savedChatMessages) {
      try {
        const messages = JSON.parse(savedChatMessages);
        setChatMessages(messages);
      } catch (e) {
        console.error('Error loading chat history:', e);
      }
    }
  }, []);

  // Save chat messages to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('chatbot_messages', JSON.stringify(chatMessages));
  }, [chatMessages]);

  useEffect(() => {
    if (!user) return;

    // Load broadcasts from localStorage only (no database calls)
    // Check both personal broadcasts and shared all_broadcasts
    const broadcastKey = `broadcast_notifications_${user.id}`;
    const broadcastStored = localStorage.getItem(broadcastKey);
    const allBroadcastsStored = localStorage.getItem("all_broadcasts");
    
    let allBroadcasts: any[] = [];
    
    if (broadcastStored) {
      try {
        allBroadcasts = JSON.parse(broadcastStored);
      } catch (e) {
        console.error('Error parsing personal broadcasts:', e);
      }
    }
    
    if (allBroadcastsStored) {
      try {
        const shared = JSON.parse(allBroadcastsStored);
        allBroadcasts = [...shared, ...allBroadcasts];
      } catch (e) {
        console.error('Error parsing shared broadcasts:', e);
      }
    }
    
    console.log('📢 Loaded broadcasts from localStorage:', allBroadcasts);
    setBroadcastMessages(allBroadcasts);

    // Listen for storage changes (when admin sends broadcast from another tab)
    const handleStorageChange = (event: StorageEvent) => {
      let updatedBroadcasts: any[] = [];
      
      if (event.key === broadcastKey && event.newValue) {
        try {
          updatedBroadcasts = JSON.parse(event.newValue);
        } catch (e) {
          console.error('Error parsing updated broadcasts:', e);
        }
      } else if (event.key === "all_broadcasts" && event.newValue) {
        try {
          const shared = JSON.parse(event.newValue);
          const personal = localStorage.getItem(broadcastKey);
          updatedBroadcasts = [...shared, ...(personal ? JSON.parse(personal) : [])];
        } catch (e) {
          console.error('Error parsing updated broadcasts:', e);
        }
      }
      
      if (updatedBroadcasts.length > 0) {
        setBroadcastMessages(updatedBroadcasts);
        console.log('📢 Broadcasts updated from localStorage:', updatedBroadcasts);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [user]);

  useEffect(() => {
    if (!user) return;

    // Fetch initial notifications
    const loadProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();
      if (data) {
        setProfile({
          ...data,
          user_metadata: user?.user_metadata || {}
        });
      }
    };

    loadProfile();
    checkActiveAlert();
    return () => {
      stopAlarm();
    };
  }, [user?.id]);

  const startAlarm = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillatorRef.current = osc;
      gainRef.current = gain;
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.setValueAtTime(1200, ctx.currentTime + 0.5);
      osc.frequency.setValueAtTime(800, ctx.currentTime + 1.0);
      let time = ctx.currentTime;
      for (let i = 0; i < 60; i++) {
        osc.frequency.setValueAtTime(800, time + i);
        osc.frequency.setValueAtTime(1200, time + i + 0.5);
      }
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      console.log("🔔 Alarm started");
    } catch (err) {
      console.error("Failed to start alarm:", err);
    }
  };

  const stopAlarm = () => {
    try {
      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
        oscillatorRef.current = null;
      }
      if (gainRef.current) {
        gainRef.current.disconnect();
        gainRef.current = null;
      }
      console.log("🔕 Alarm stopped");
    } catch (err) {
      console.error("Failed to stop alarm:", err);
    }
  };

  useEffect(() => {
    if (activeAlert) {
      const interval = setInterval(() => {
        const start = new Date(activeAlert.start_time).getTime();
        const now = Date.now();
        const duration = Math.floor((now - start) / 1000);
        setAlertDuration(duration);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [activeAlert]);

  const checkActiveAlert = async () => {
    const { data } = await supabase
      .from('emergency_alerts')
      .select('*')
      .eq('student_id', user?.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) {
      setActiveAlert(data);
      startLocationTracking();
    }
  };

  const getCurrentLocation = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0
      });
    });
  };

  const startLocationTracking = () => {
    if (!navigator.geolocation) {
      console.warn("⚠ Geolocation not available");
      toast({
        title: "Geolocation Not Supported",
        description: "Your device doesn't support location tracking",
        variant: "destructive",
      });
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setLocation(position);
        console.log("📍 Location updated:", {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => {
        console.error('❌ Location watch error:', error);
        if (error.code === error.PERMISSION_DENIED) {
          toast({
            title: "Location Permission Denied",
            description: "Please enable location access in your browser settings.",
            variant: "destructive",
          });
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          console.warn("⚠ Location position unavailable");
        } else if (error.code === error.TIMEOUT) {
          console.warn("⚠ Location request timeout");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );

    const locationInterval = setInterval(async () => {
      if (activeAlert && location) {
        try {
          const locationData = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy,
            timestamp: new Date().toISOString()
          };

          const hostname = window.location.hostname;
          const apiBaseUrl = (hostname === 'localhost' || hostname === '127.0.0.1') 
            ? 'http://localhost:3001' 
            : `http://${hostname}:3001`;

          try {
            const response = await fetch(`${apiBaseUrl}/api/location-update`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Alert-ID': activeAlert.id,
                'X-Timestamp': new Date().toISOString()
              },
              body: JSON.stringify(locationData)
            });
            
            if (!response.ok) {
              console.warn(`⚠ Location API returned ${response.status}`);
            } else {
              console.log("✅ Location sent to admin");
            }
          } catch (fetchErr) {
            console.warn('⚠ Location update API call failed:', fetchErr instanceof Error ? fetchErr.message : 'Unknown error');
          }

          try {
            const { error: dbErr } = await supabase
              .from('alert_data_packets')
              .insert({
                alert_id: activeAlert.id,
                location_data: locationData,
                notes: 'Continuous location tracking'
              });
            
            if (dbErr) {
              console.warn('⚠ DB location insert failed:', dbErr);
            } else {
              console.log("✅ Location saved to database");
            }
          } catch (dbErr) {
            console.warn('⚠ DB insert error:', dbErr);
          }
        } catch (err) {
          console.error('❌ Location tracking error:', err);
        }
      }
    }, 5000);

    return () => {
      navigator.geolocation.clearWatch(watchId);
      clearInterval(locationInterval);
    };
  };

  // ============ NOTIFICATION SYSTEM FUNCTIONS ============
  
  /**
   * Add a new broadcast notification to the panel
   * Call this function from Admin side when sending a broadcast
   * Example: addNotification({ title: "Security Alert", message: "Campus gate closed" })
   */
  const addNotification = (data: { title: string; message: string }) => {
    const newNotification = {
      id: `notif_${Date.now()}_${Math.random()}`,
      title: data.title,
      message: data.message,
      created_at: new Date().toISOString(),
      read: false
    };
    
    setBroadcastMessages(prev => [newNotification, ...prev]);
    
    // Show toast
    toast({
      title: data.title,
      description: data.message,
    });
  };

  /**
   * Mark all notifications as read when panel opens
   */
  const markAllAsRead = () => {
    setBroadcastMessages(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  /**
   * Get count of unread notifications
   */
  const getUnreadCount = () => {
    return broadcastMessages.filter(notif => !notif.read).length;
  };

  /**
   * Format time for notification display
   */
  const formatNotificationTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const activateSOS = async () => {
    try {
      let locationData = null;
      try {
        const position = await getCurrentLocation();
        locationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date().toISOString()
        };
        console.log("📍 Location obtained:", locationData);
      } catch (locErr: any) {
        console.warn("⚠ Location error (will continue without location):", locErr?.message || 'Unknown error');
        toast({
          title: "Location Permission Required",
          description: "Please enable location access in your browser settings. The alert will still be sent without location.",
          variant: "destructive",
        });
        locationData = null;
      }

      const { data: alert, error } = await supabase
        .from('emergency_alerts')
        .insert({
          student_id: user?.id,
          last_location: locationData,
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;

      setActiveAlert(alert);
      startLocationTracking();
      startAlarm();

      if (locationData) {
        try {
          await supabase.from('alert_data_packets').insert({
            alert_id: alert.id,
            location_data: locationData,
            notes: 'Initial SOS activation'
          });
          console.log("✅ Location saved to database");
        } catch (dbErr) {
          console.warn("⚠ Could not save location to database:", dbErr);
        }
      }

      toast({
        title: "Emergency Alert Activated",
        description: "Campus security has been notified. Help is on the way!",
        variant: "default",
      });

      setShowConfirmDialog(false);

      setTimeout(() => {
        console.log("🎬 Auto-starting live feed...");
        liveRecorderRef.current?.startRecording();
      }, 500);
    } catch (error: any) {
      console.error("❌ SOS Activation error:", error);
      toast({
        title: "Activation Failed",
        description: error.message || "Failed to activate SOS alert. Please try again.",
        variant: "destructive",
      });
    }
  };

  const cancelSOS = async () => {
    if (!activeAlert) return;

    try {
      stopAlarm();

      await supabase
        .from('emergency_alerts')
        .update({
          status: 'cancelled',
          end_time: new Date().toISOString()
        })
        .eq('id', activeAlert.id);

      setActiveAlert(null);
      setLocation(null);
      setAlertDuration(0);

      toast({
        title: "Alert Cancelled",
        description: "Emergency alert has been cancelled successfully.",
      });

      setShowCancelDialog(false);
    } catch (error: any) {
      toast({
        title: "Cancellation Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const faqDatabase = {
    "How do I trigger an SOS alert quickly?": "Press and hold the large red SOS button on the main screen for 2 seconds. The app will ask for confirmation, then immediately alert campus security with your exact location. You can also set up a gesture shortcut in settings for even faster access.",
    "What happens after I press the SOS button?": "When you press SOS: 1) Your location is instantly sent to campus security, 2) Your registered emergency contacts receive a notification, 3) Your recorded video and audio are uploaded to security, 4) Campus security starts responding to your location, 5) You can stay in direct contact with security through the app.",
    "What happens after I send an SOS alert?": "Immediately after sending: 1) Your exact GPS location is transmitted to security, 2) Campus police are dispatched to your location, 3) Your emergency contacts get notified with a map link, 4) A secure chat opens with the responding officer, 5) Video/audio from your device goes to security for context, 6) Your location updates in real-time on security's dashboard.",
    "Will campus security see my live location?": "Yes, campus security can see your real-time location on a map after you press SOS. They will follow your movement to provide the best assistance possible. This helps security reach you faster and track your route if you're moving.",
    "Can I cancel an SOS alert after sending it?": "You can cancel within 10 seconds of pressing SOS. After 10 seconds, the alert is sent and cannot be cancelled. If you accidentally sent an alert, immediately contact campus security through the app to let them know it was a false alarm so they don't waste resources.",
    "Can I cancel an alert if I send it by mistake?": "Yes! You have a 10-second window to cancel after pressing SOS. Just tap the red 'CANCEL ALERT' button that appears on your screen. After 10 seconds, the alert is locked and will be sent. If you miss the window, contact security immediately through the app chat to report it as a false alarm.",
    "Do campus security get my live location immediately?": "Yes, the moment you press SOS, your live GPS location is instantly sent to security dispatch. They see your location on a real-time map and begin responding. As you move, your location updates every few seconds so security can track your exact position and route.",
    "How fast does security respond to emergencies?": "Campus security aims to respond to SOS alerts within 2-5 minutes during busy times and 1-2 minutes during quiet hours. Response time depends on your location and whether security personnel are available. Always have an alternative like calling 911 for non-campus emergencies.",
    "Do I need mobile data for the SOS alert to work?": "Yes, your device needs either mobile data or WiFi connection to send an SOS alert. The app will show a warning if you don't have a connection. Make sure your phone has at least some cellular or WiFi signal before you're in a risky situation.",
    "What features does the SOS system support?": "The SOS system includes: 1) Instant location sharing with security, 2) One-tap emergency alert, 3) Live video/audio recording and transmission, 4) Direct chat with responding officers, 5) Emergency contact notifications, 6) Real-time location tracking on security map, 7) Audio/video evidence collection, 8) Gesture shortcuts for ultra-fast access.",
    "Does the system work off-campus?": "The SOS system works both on and off-campus! However, response times may vary. Off-campus emergencies may route to local police instead of campus security. If off-campus during serious emergencies, call 911 directly. The app will detect your location and connect you with the appropriate emergency services.",
    "Can I attach photos or videos when sending an alert?": "The app automatically records video and audio from your device camera/microphone when you press SOS, which are sent to security. However, you cannot manually attach additional photos. The automatic video/audio capture provides real-time evidence of your situation. You can add text descriptions in the chat with security.",
    "Is my location tracked only during emergencies?": "By default, your location is ONLY tracked when you actively press SOS or share your location with friends. Campus security does NOT have continuous access to your location. Your privacy is protected - they can only see your location when you explicitly activate sharing. You control when and with whom your location is shared.",
    "What should I do if someone is following me?": "Stay calm and: 1) Don't go directly home, 2) Go to a public area with people, 3) Immediately press SOS in the app to alert security, 4) Call 911 or campus police if off-campus, 5) Ask for help from nearby people, 6) Keep moving toward populated areas, 7) Share your real-time location with trusted friends through the app.",
    "How do I report suspicious activity on campus?": "To report suspicious activity: 1) Open the app and tap 'Report Activity', 2) Describe what you saw and when, 3) Include the location on campus, 4) Add any photos if safe to do so, 5) Submit the report to campus security. Your identity can remain anonymous if you prefer. Security will investigate and follow up if needed.",
    "Where are the nearest security checkpoints?": "Check the 'Campus Map' feature in the app to see all security checkpoint locations. Major checkpoints are typically near: main gates, parking lots, dorms, library, and student center. If in immediate danger, head to any visible checkpoint or call security directly.",
    "Is the campus monitored 24/7?": "Yes, campus security operates 24/7 with patrols and surveillance cameras in most common areas. However, some remote areas may have limited coverage. Always use the SOS app when you feel unsafe and don't assume an area is always being monitored.",
    "How do I contact campus police?": "Contact campus police through: 1) SOS app direct messaging (fastest), 2) Emergency hotline (shown in app home screen), 3) Campus police non-emergency number (in app Contact page), 4) Walk to nearest security checkpoint. For life-threatening emergencies off-campus, always call 911 first.",
    "How do I stay safe while walking at night?": "Night safety tips: 1) Walk in groups when possible, 2) Stick to main, well-lit paths on campus, 3) Keep your phone charged and the SOS app ready, 4) Tell someone where you're going and when you'll arrive, 5) Be aware of your surroundings, 6) Trust your instincts and move if something feels wrong, 7) Use campus escort service if available.",
    "What safety features are available in hostels?": "Hostel safety features: 1) Secure lock on your door, 2) Emergency button in room (if installed), 3) Security staff on-duty 24/7, 4) Visitor log at entrance, 5) CCTV in common areas, 6) Emergency exit clearly marked. Always keep your room locked and report suspicious behavior to hostel management immediately.",
    "Is there a way to share my location with friends?": "Yes! In the app, go to 'Share Location' and select trusted friends from your contacts. They can see your real-time location for a set time period (15 min, 1 hour, or until you turn it off). This is great when walking alone or in unfamiliar areas.",
  };

  const handleChatQuestion = (question: string) => {
    const userMessage = { role: 'user' as const, text: question };
    const response = faqDatabase[question as keyof typeof faqDatabase] || "I'm not sure about that question. Please contact campus security for more information.";
    
    // Add user message to existing messages
    setChatMessages(prev => [...prev, userMessage]);
    
    // Show thinking animation for 2-3 seconds before showing answer
    setTimeout(() => {
      const botMessage = { role: 'bot' as const, text: response };
      setChatMessages(prev => [...prev, botMessage]);
    }, 2500); // 2.5 seconds delay
  };

  return (
    <div className={`min-h-screen relative overflow-hidden transition-all duration-500 ${
      theme === 'dark'
        ? 'bg-black'
        : 'bg-white'
    } p-4`}>
      {/* Deep Background Layer */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {theme === 'dark' ? (
          <>
            {/* Deep matte black base with subtle texture */}
            <div className="absolute inset-0 bg-black opacity-100" />
            
            {/* Subtle dark grid pattern overlay */}
            <div 
              className="absolute inset-0 opacity-5"
              style={{
                backgroundImage: `linear-gradient(0deg, transparent 24%, rgba(255, 0, 0, 0.05) 25%, rgba(255, 0, 0, 0.05) 26%, transparent 27%, transparent 74%, rgba(255, 0, 0, 0.05) 75%, rgba(255, 0, 0, 0.05) 76%, transparent 77%, transparent),
                                 linear-gradient(90deg, transparent 24%, rgba(255, 0, 0, 0.05) 25%, rgba(255, 0, 0, 0.05) 26%, transparent 27%, transparent 74%, rgba(255, 0, 0, 0.05) 75%, rgba(255, 0, 0, 0.05) 76%, transparent 77%, transparent)`,
                backgroundSize: '50px 50px'
              }}
            />
            
            {/* Red pulse glow behind SOS button area (centered) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-red-600/30 via-red-500/15 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '3s' }} />
            
            {/* Secondary deeper red glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-br from-red-700/20 via-red-600/10 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s', animationDelay: '0.5s' }} />
            
            {/* Tertiary subtle ambient red glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-red-500/10 via-transparent to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
            
            {/* Cool blue accent glows in corners */}
            <div className="absolute -top-20 -left-32 w-80 h-80 bg-gradient-to-br from-blue-600/10 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1.5s' }} />
            <div className="absolute -bottom-20 -right-32 w-72 h-72 bg-gradient-to-tl from-blue-600/8 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '7s', animationDelay: '2s' }} />
            
            {/* Gradient overlay for depth */}
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-black/20 to-red-950/20" />
            
            {/* Top-down dark gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black opacity-60" />
          </>
        ) : (
          <>
            {/* Clean white base */}
            <div className="absolute inset-0 bg-white opacity-100" />
            
            {/* Subtle gradient overlay for depth */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-100 opacity-80" />
            
            {/* Soft shadow gradients for frosted glass effect depth */}
            <div className="absolute inset-0 bg-gradient-to-t from-gray-200/20 via-transparent to-gray-200/10" />
            <div className="absolute inset-0 bg-gradient-to-b from-gray-200/15 via-transparent to-gray-300/20" />
            
            {/* Subtle radial gradient for ambient lighting */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-200/20 to-transparent rounded-full blur-3xl opacity-40 animate-pulse" style={{ animationDuration: '4s' }} />
            <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-gradient-to-tl from-indigo-200/15 to-transparent rounded-full blur-3xl opacity-30 animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
            
            {/* Soft accent glows */}
            <div className="absolute top-1/3 -right-20 w-72 h-72 bg-gradient-to-br from-gray-300/20 to-transparent rounded-full blur-2xl opacity-50" />
            <div className="absolute -bottom-32 left-1/2 w-96 h-96 bg-gradient-to-tr from-gray-300/15 to-transparent rounded-full blur-3xl opacity-40" />
            
            {/* Fine grain texture overlay */}
            <div 
              className="absolute inset-0 opacity-[0.015]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' seed='2' /%3E%3C/filter%3E%3Crect width='400' height='400' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                backgroundSize: '100%'
              }}
            />
          </>
        )}
      </div>

      {/* Menu Backdrop */}
      {showMenu && (
        <div 
          className="fixed inset-0 z-[9990]"
          onClick={() => setShowMenu(false)}
        />
      )}

      <div className="relative z-10 max-w-2xl mx-auto space-y-6">
        <div className={`flex justify-between items-center backdrop-blur-lg rounded-2xl p-4 shadow-2xl transition-all duration-500 ${
          theme === 'dark'
            ? 'bg-slate-900/60 border border-red-500/20 hover:bg-slate-900/80 hover:border-red-500/40'
            : 'bg-white/70 border border-gray-200/50 hover:bg-white/90 hover:shadow-lg shadow-gray-200/30'
        }`}>
          <h1 className={`text-3xl font-bold transition-colors duration-500 ${
            theme === 'dark'
              ? 'bg-gradient-to-r from-red-400 to-red-500 bg-clip-text text-transparent'
              : 'bg-gradient-to-r from-gray-800 to-gray-900 bg-clip-text text-transparent'
          }`}>Student Dashboard</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-all duration-300 hover:scale-110 ${
                theme === 'dark'
                  ? 'bg-red-600/30 hover:bg-red-600/50 text-red-300 border border-red-500/30'
                  : 'bg-gray-200/60 hover:bg-gray-300/70 text-gray-700 border border-gray-300/40'
              }`}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            
            {/* Modern Notification Panel - Broadcasts */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotificationPanel(!showNotificationPanel);
                  if (!showNotificationPanel) {
                    markAllAsRead();
                  }
                }}
                className={`relative p-2 rounded-lg transition-all duration-300 ${
                  theme === 'dark'
                    ? 'bg-slate-800/60 border-red-500/30 hover:bg-slate-800/80 hover:border-red-500/50 text-white'
                    : 'bg-white/60 border-gray-300/40 hover:bg-white/80 hover:border-gray-400/60 text-gray-900'
                }`}
              >
                <Bell className="h-5 w-5" />
                
                {/* Red Glowing Dot for Unread Notifications */}
                {getUnreadCount() > 0 && (
                  <div className={`absolute top-1 right-1 h-3 w-3 rounded-full ${
                    theme === 'dark'
                      ? 'bg-red-500 shadow-lg shadow-red-500/80'
                      : 'bg-red-500 shadow-lg shadow-red-500/60'
                  } animate-pulse`}
                    style={{
                      boxShadow: theme === 'dark' 
                        ? '0 0 12px rgba(239, 68, 68, 0.8), 0 0 24px rgba(239, 68, 68, 0.5)'
                        : '0 0 10px rgba(239, 68, 68, 0.6), 0 0 20px rgba(239, 68, 68, 0.3)'
                    }}
                  />
                )}
              </button>

              {/* Notification Dropdown Panel */}
              {showNotificationPanel && (
                <div className={`absolute -right-32 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 top-14 w-80 sm:w-96 max-h-64 rounded-xl shadow-2xl border overflow-hidden z-50 ${
                  theme === 'dark'
                    ? 'bg-slate-800 border-slate-700/50'
                    : 'bg-white border-gray-200/50'
                }`}>
                  {/* Header */}
                  <div className={`px-3 sm:px-4 py-2 sm:py-3 border-b font-bold text-sm sm:text-base ${
                    theme === 'dark'
                      ? 'bg-slate-700 border-slate-700/50 text-white'
                      : 'bg-gray-50 border-gray-200/50 text-gray-900'
                  }`}>
                    Broadcasts ({broadcastMessages.length})
                  </div>

                  {/* Notifications List */}
                  <div className="overflow-y-auto max-h-56">
                    {broadcastMessages.length === 0 ? (
                      <div className={`p-4 text-center text-xs sm:text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        No broadcast messages yet
                      </div>
                    ) : (
                      <div className="divide-y space-y-0">
                        {broadcastMessages.map((notif) => (
                          <div
                            key={notif.id}
                            className={`p-2.5 sm:p-3 border-b transition-all duration-200 ${
                              !notif.read
                                ? (theme === 'dark' ? 'bg-blue-950/30 border-blue-700/30' : 'bg-blue-50/60 border-blue-200/30')
                                : (theme === 'dark' ? 'bg-slate-800/50 border-slate-700/30' : 'bg-gray-50/40 border-gray-200/30')
                            } hover:${theme === 'dark' ? 'bg-slate-700/30' : 'bg-gray-100/50'} cursor-pointer`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <h3 className={`font-bold text-xs sm:text-sm line-clamp-1 break-words ${
                                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                                  }`}>
                                    {notif.title}
                                  </h3>
                                  {!notif.read && (
                                    <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 animate-pulse" />
                                  )}
                                </div>
                                <p className={`text-xs sm:text-sm line-clamp-2 leading-snug break-words whitespace-normal ${
                                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                  {notif.message}
                                </p>
                                <p className={`text-[0.65rem] sm:text-xs mt-1 ${
                                  theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                                }`}>
                                  {formatNotificationTime(notif.created_at)}
                                </p>
                              </div>
                              <button
                                onClick={() => {
                                  setBroadcastMessages(prev =>
                                    prev.filter(n => n.id !== notif.id)
                                  );
                                }}
                                className={`text-lg sm:text-xl leading-none flex-shrink-0 transition-colors pt-0.5 ${
                                  theme === 'dark'
                                    ? 'text-gray-500 hover:text-gray-300'
                                    : 'text-gray-400 hover:text-gray-600'
                                }`}
                              >
                                ×
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="relative">
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setShowMenu(!showMenu)}
                className={`backdrop-blur-sm rounded-lg transition-all duration-300 ${
                  theme === 'dark'
                    ? 'bg-slate-800/60 border-red-500/30 hover:bg-slate-800/80 hover:border-red-500/50 text-white'
                    : 'bg-white/60 border-gray-300/40 hover:bg-white/80 hover:border-gray-400/60 text-gray-900'
                }`}
              >
                {showMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>

        {activeAlert && (
          <>
            <Card className={`backdrop-blur-lg rounded-2xl shadow-2xl transition-all duration-500 border ${
              theme === 'dark'
                ? 'bg-slate-900/60 border-red-500/30 hover:bg-slate-900/80 hover:shadow-red-500/20'
                : 'bg-white/70 border-gray-200/50 hover:bg-white/90 hover:shadow-gray-200/30'
            }`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-4 w-4 rounded-full animate-pulse shadow-lg ${
                      theme === 'dark'
                        ? 'bg-red-500 shadow-red-500/60'
                        : 'bg-red-500 shadow-red-500/40'
                    }`} />
                    <div>
                      <CardTitle className={theme === 'dark' ? 'text-red-400' : 'text-red-600'}>Emergency Alert Active</CardTitle>
                      <CardDescription className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Campus security has been notified</CardDescription>
                    </div>
                  </div>
                  <Badge variant="destructive" className="animate-pulse">LIVE</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 p-3 bg-white/40 backdrop-blur-sm rounded-lg border border-white/50">
                    <Clock className="h-5 w-5 text-red-600" />
                    <div>
                      <div className="text-sm text-muted-foreground">Duration</div>
                      <div className="font-bold">{formatDuration(alertDuration)}</div>
                    </div>
                  </div>
                  {location && (
                    <div className="flex items-center gap-2 p-3 bg-white/40 backdrop-blur-sm rounded-lg border border-white/50">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <div className="text-sm text-muted-foreground">Location</div>
                        <div className="font-bold text-green-600">Tracked</div>
                      </div>
                    </div>
                  )}
                </div>
                
                {location && (
                  <div className="p-3 bg-blue-500/10 backdrop-blur-sm rounded border border-blue-300/40">
                    <div className="flex items-center gap-2 font-bold mb-2">
                      <MapPin className="h-4 w-4" />
                      Current Location
                    </div>
                    <div className="text-sm">
                      Lat: {location.coords.latitude.toFixed(6)}, 
                      Long: {location.coords.longitude.toFixed(6)}
                    </div>
                  </div>
                )}

                <Button
                  variant="destructive"
                  className="w-full shadow-lg hover:shadow-xl"
                  onClick={() => setShowCancelDialog(true)}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel Alert
                </Button>
              </CardContent>
            </Card>

            <div className="max-w-2xl mx-auto">
              <div className={`backdrop-blur-lg rounded-2xl p-4 shadow-2xl transition-all duration-500 border ${
                theme === 'dark'
                  ? 'bg-slate-900/60 border-red-500/20'
                  : 'bg-white/70 border-gray-200/50'
              }`}>
                <LiveRecorder ref={liveRecorderRef} alertId={activeAlert.id} />
              </div>
            </div>
          </>
        )}

        {!activeAlert && (
          <div className="flex flex-col items-center justify-center py-12 space-y-8">
            <div className="text-center space-y-2">
              <h2 className={`text-3xl font-bold transition-colors duration-500 ${
                theme === 'dark'
                  ? 'text-white'
                  : 'text-gray-900'
              }`}>Stay Safe on Campus</h2>
              <p className={`transition-colors duration-500 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>Tap the button below in case of emergency</p>
            </div>
            
            <div className="relative flex items-center justify-center">
              {theme === 'dark' ? (
                <>
                  {/* Dark mode: Red pulse rings around SOS */}
                  <div className="absolute w-80 h-80 rounded-full border-2 border-red-600/40 animate-pulse" style={{ animationDuration: '2s' }} />
                  <div className="absolute w-96 h-96 rounded-full border border-red-600/30 animate-pulse" style={{ animationDuration: '3s', animationDelay: '0.3s' }} />
                  <div className="absolute w-[28rem] h-[28rem] rounded-full border border-red-600/20 animate-pulse" style={{ animationDuration: '4s', animationDelay: '0.6s' }} />
                  
                  {/* Intense red glow effect */}
                  <div className="absolute w-72 h-72 bg-gradient-to-br from-red-600/60 to-red-700/30 rounded-full blur-3xl opacity-70 animate-pulse" style={{ animationDuration: '2.5s' }} />
                  <div className="absolute w-80 h-80 bg-gradient-to-br from-red-500/40 via-red-600/20 to-transparent rounded-full blur-2xl opacity-60 animate-pulse" style={{ animationDuration: '3.5s', animationDelay: '0.5s' }} />
                </>
              ) : (
                <>
                  {/* Light mode: Subtle soft rings */}
                  <div className="absolute w-80 h-80 rounded-full border-2 border-gray-300/40 animate-pulse" style={{ animationDuration: '2.5s' }} />
                  <div className="absolute w-96 h-96 rounded-full border border-gray-300/25 animate-pulse" style={{ animationDuration: '3.5s', animationDelay: '0.3s' }} />
                  <div className="absolute w-[28rem] h-[28rem] rounded-full border border-gray-300/15 animate-pulse" style={{ animationDuration: '4.5s', animationDelay: '0.6s' }} />
                  
                  {/* Soft ambient glow */}
                  <div className="absolute w-72 h-72 bg-gradient-to-br from-gray-400/20 to-gray-300/10 rounded-full blur-3xl opacity-50 animate-pulse" style={{ animationDuration: '3s' }} />
                  <div className="absolute w-80 h-80 bg-gradient-to-br from-gray-300/15 via-gray-400/10 to-transparent rounded-full blur-2xl opacity-40 animate-pulse" style={{ animationDuration: '4s', animationDelay: '0.5s' }} />
                </>
              )}
              
              <button
                onClick={() => setShowConfirmDialog(true)}
                className={`relative group w-56 h-56 rounded-full text-white flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 shadow-2xl border-4 backdrop-blur-sm ${
                  theme === 'dark'
                    ? 'bg-gradient-to-br from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 hover:shadow-red-500/80 border-red-500/40 hover:border-red-500/80'
                    : 'bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 hover:shadow-red-500/60 border-red-400/60 hover:border-red-500/80'
                }`}
              >
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative text-center space-y-2 z-10">
                  <AlertCircle className="h-20 w-20 mx-auto drop-shadow-lg" />
                  <div className="space-y-0">
                    <span className="text-4xl font-black drop-shadow-lg block text-white">SOS</span>
                    <span className="text-xs font-semibold drop-shadow-lg text-white/90">EMERGENCY</span>
                  </div>
                </div>
              </button>
            </div>
            
            <p className={`text-center max-w-md text-sm transition-colors duration-500 ${
              theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
            }`}>
              Only press in case of genuine emergency. Campus security will be notified immediately with your location.
            </p>
          </div>
        )}

        <Card className={`backdrop-blur-lg rounded-2xl shadow-2xl transition-all duration-500 border ${
          theme === 'dark'
            ? 'bg-slate-900/60 border-red-500/20 hover:bg-slate-900/80 hover:shadow-red-500/20'
            : 'bg-white/70 border-gray-200/50 hover:bg-white/90 hover:shadow-gray-200/30'
        }`}>
          <CardHeader>
            <CardTitle className={`transition-colors duration-500 ${
              theme === 'dark'
                ? 'text-white'
                : 'text-gray-900'
            }`}>Your Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className={`p-3 backdrop-blur-sm rounded-lg border transition-all duration-500 ${
              theme === 'dark'
                ? 'bg-slate-800/40 border-red-500/20'
                : 'bg-gray-100/50 border-gray-300/40'
            }`}>
              <div className={`text-xs font-semibold mb-1 transition-colors duration-500 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-700'
              }`}>Name</div>
              <div className={`font-semibold text-sm transition-colors duration-500 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>{profile?.full_name || 'Not set'}</div>
            </div>
            <div className={`p-3 backdrop-blur-sm rounded-lg border transition-all duration-500 ${
              theme === 'dark'
                ? 'bg-slate-800/40 border-red-500/20'
                : 'bg-gray-100/50 border-gray-300/40'
            }`}>
              <div className={`text-xs font-semibold mb-1 transition-colors duration-500 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-700'
              }`}>Email</div>
              <div className={`font-semibold text-sm break-all transition-colors duration-500 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>{profile?.email}</div>
            </div>
            {profile?.user_metadata?.phone_number && (
              <div className={`p-3 backdrop-blur-sm rounded-lg border transition-all duration-500 ${
                theme === 'dark'
                  ? 'bg-slate-800/40 border-red-500/20'
                  : 'bg-gray-100/50 border-gray-300/40'
              }`}>
                <div className={`text-xs font-semibold mb-1 transition-colors duration-500 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-700'
                }`}>Phone</div>
                <div className={`font-semibold text-sm flex items-center gap-2 transition-colors duration-500 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  <Phone className={`h-4 w-4 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`} />
                  {profile.user_metadata.phone_number}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className={`backdrop-blur-lg rounded-2xl shadow-2xl transition-all duration-500 border ${
          theme === 'dark'
            ? 'bg-slate-900/60 border-red-500/30 hover:bg-slate-900/80 hover:shadow-red-500/20'
            : 'bg-white/70 border-gray-200/50 hover:bg-white/90 hover:shadow-gray-200/30'
        }`}>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 transition-colors duration-500 ${
              theme === 'dark' ? 'text-red-400' : 'text-red-600'
            }`}>
              <Phone className="h-5 w-5" />
              Emergency Contacts
            </CardTitle>
            <CardDescription>Important emergency numbers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <a href="tel:911" className="flex items-center justify-between p-4 bg-white/40 backdrop-blur-sm border border-white/50 rounded-xl hover:bg-white/60 hover:border-white/70 transition-all duration-300 group">
              <div>
                <div className="font-semibold text-red-600 group-hover:text-red-700">Emergency Services</div>
                <div className="text-xs text-muted-foreground">Life-threatening emergencies</div>
              </div>
              <div className="text-2xl font-bold text-red-600 group-hover:text-red-700">911</div>
            </a>
            <a href="tel:555-0100" className="flex items-center justify-between p-4 bg-white/40 backdrop-blur-sm border border-white/50 rounded-xl hover:bg-white/60 hover:border-white/70 transition-all duration-300 group">
              <div>
                <div className="font-semibold text-blue-600 group-hover:text-blue-700">Campus Security</div>
                <div className="text-xs text-muted-foreground">Available 24/7</div>
              </div>
              <div className="text-xl font-bold text-blue-600 group-hover:text-blue-700">555-0100</div>
            </a>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Activate Emergency Alert?</AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately notify campus security with your location. Only use in case of genuine emergency.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={activateSOS} className="bg-red-600 hover:bg-red-700">
              Confirm SOS
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Emergency Alert?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to stop the emergency alert?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Active</AlertDialogCancel>
            <AlertDialogAction onClick={cancelSOS}>
              Cancel Alert
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        studentName={profile?.first_name || user?.email || "Student"}
        studentId={user?.id || ""}
      />

      {/* Chatbot Modal */}
      {showChatbot && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[10001] pointer-events-auto">
          {/* Compact Floating Chatbot Widget */}
          <div className={`w-80 sm:w-96 h-[500px] sm:h-[600px] rounded-2xl shadow-xl flex flex-col border overflow-hidden ${
            theme === 'dark'
              ? 'bg-slate-900 border-slate-700/50'
              : 'bg-white border-gray-200'
          }`}>
            
            {/* Header */}
            <div className={`px-4 py-3 border-b flex items-center justify-between flex-shrink-0 ${
              theme === 'dark'
                ? 'bg-slate-800 border-slate-700/30'
                : 'bg-gradient-to-r from-blue-50 to-cyan-50 border-gray-100'
            }`}>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="h-3.5 w-3.5 text-white" />
                </div>
                <h3 className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Campus Assistant
                </h3>
              </div>
              <button
                onClick={() => setShowChatbot(false)}
                className={`p-1 rounded-md transition-colors ${
                  theme === 'dark'
                    ? 'hover:bg-slate-700 text-gray-400'
                    : 'hover:bg-gray-100 text-gray-500'
                }`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Chat Messages Area */}
            <div className={`flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 sm:space-y-3 flex flex-col justify-end ${
              theme === 'dark' ? 'bg-slate-900' : 'bg-white'
            }`}>
              {chatMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-2.5">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center">
                    <MessageCircle className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className={`text-xs sm:text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      Campus Assistant
                    </p>
                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mt-0.5`}>
                      How can we help?
                    </p>
                  </div>
                  
                  {/* Quick Suggestion Pills - Scrollable */}
                  <div className="w-full flex flex-col gap-1.5 mt-3 pt-3 max-h-[280px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
                    {[
                      "How do I trigger an SOS alert quickly?",
                      "What happens after I send an SOS alert?",
                      "Can I cancel an alert if I send it by mistake?",
                      "Do campus security get my live location immediately?",
                      "What features does the SOS system support?",
                      "Does the system work off-campus?",
                      "Can I attach photos or videos when sending an alert?",
                      "Is my location tracked only during emergencies?",
                      "How do I stay safe while walking at night?",
                      "What should I do if someone is following me?",
                      "Where are the nearest security checkpoints?",
                      "How do I contact campus police?"
                    ].map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleChatQuestion(suggestion)}
                        className={`text-xs px-2.5 py-1.5 rounded-full transition-all duration-200 whitespace-normal text-left ${
                          theme === 'dark'
                            ? 'bg-slate-700/60 hover:bg-slate-700 text-blue-300 hover:text-blue-200'
                            : 'bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700'
                        }`}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {chatMessages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] px-3 py-2 rounded-lg text-xs sm:text-sm leading-relaxed break-words ${
                        msg.role === 'user'
                          ? 'bg-blue-500 text-white rounded-br-none'
                          : (theme === 'dark'
                            ? 'bg-slate-700 text-gray-100 rounded-bl-none'
                            : 'bg-gray-100 text-gray-900 rounded-bl-none')
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  
                  {/* Thinking Indicator */}
                  {chatMessages.length === 1 && chatMessages[0].role === 'user' && (
                    <div className="flex justify-start">
                      <div className={`px-3 py-2 rounded-lg ${
                        theme === 'dark' ? 'bg-slate-700 rounded-bl-none' : 'bg-gray-100 rounded-bl-none'
                      }`}>
                        <div className="flex items-center gap-1">
                          <div className={`w-1.5 h-1.5 rounded-full animate-bounce ${theme === 'dark' ? 'bg-gray-400' : 'bg-gray-600'}`} style={{ animationDelay: '0s' }}></div>
                          <div className={`w-1.5 h-1.5 rounded-full animate-bounce ${theme === 'dark' ? 'bg-gray-400' : 'bg-gray-600'}`} style={{ animationDelay: '0.2s' }}></div>
                          <div className={`w-1.5 h-1.5 rounded-full animate-bounce ${theme === 'dark' ? 'bg-gray-400' : 'bg-gray-600'}`} style={{ animationDelay: '0.4s' }}></div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Show suggestions after each bot response */}
                  {chatMessages.length > 0 && chatMessages[chatMessages.length - 1].role === 'bot' && (
                    <div className="w-full flex flex-col gap-1.5 mt-3 pt-2 border-t border-slate-700/20">
                      <p className={`text-xs font-medium px-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>More questions:</p>
                      <div className="flex flex-col gap-1.5 max-h-[200px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
                        {[
                          "How do I trigger an SOS alert quickly?",
                          "What happens after I send an SOS alert?",
                          "Can I cancel an alert if I send it by mistake?",
                          "Do campus security get my live location immediately?",
                          "What features does the SOS system support?",
                          "Does the system work off-campus?",
                          "Can I attach photos or videos when sending an alert?",
                          "Is my location tracked only during emergencies?",
                          "How do I stay safe while walking at night?",
                          "What should I do if someone is following me?",
                          "Where are the nearest security checkpoints?",
                          "How do I contact campus police?"
                        ].map((suggestion, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleChatQuestion(suggestion)}
                            className={`text-xs px-2.5 py-1.5 rounded-full transition-all duration-200 whitespace-normal text-left ${
                              theme === 'dark'
                                ? 'bg-slate-700/60 hover:bg-slate-700 text-blue-300 hover:text-blue-200'
                                : 'bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700'
                            }`}
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
              <div ref={chatMessagesEndRef} />
            </div>

            {/* Input Area */}
            <div className={`px-3 py-2.5 sm:py-3 border-t flex gap-2 flex-shrink-0 ${
              theme === 'dark'
                ? 'bg-slate-800 border-slate-700/30'
                : 'bg-gray-50 border-gray-100'
            }`}>
              <input
                type="text"
                placeholder="Type here..."
                className={`flex-1 px-3 py-1.5 rounded-lg text-xs sm:text-sm border transition-all focus:outline-none focus:ring-2 ${
                  theme === 'dark'
                    ? 'bg-slate-700 border-slate-600 text-white placeholder-gray-500 focus:ring-blue-500/50'
                    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:ring-blue-500/50'
                }`}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                    handleChatQuestion(e.currentTarget.value.trim());
                    e.currentTarget.value = '';
                  }
                }}
              />
              <button
                onClick={(e) => {
                  const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                  if (input && input.value.trim()) {
                    handleChatQuestion(input.value.trim());
                    input.value = '';
                  }
                }}
                className="px-2 py-1.5 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white transition-all duration-200 flex-shrink-0"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Menu Dropdown - Rendered at Root Level */}
      {showMenu && (
        <div className={`fixed top-24 right-8 backdrop-blur-lg rounded-2xl shadow-2xl w-80 z-[10000] overflow-visible flex flex-col transition-all duration-300 pointer-events-auto ${
          theme === 'dark'
            ? 'bg-slate-800/95 border border-slate-700/50'
            : 'bg-white/95 border border-gray-200/60'
        }`}>
          {/* Menu Items */}
          <div className={`${theme === 'dark' ? 'bg-slate-800/50' : 'bg-gray-50/50'}`}>
            {/* Chatbot */}
            <button
              onClick={() => {
                setShowChatbot(!showChatbot);
                setShowMenu(false);
              }}
              className={`w-full flex items-center gap-4 px-4 py-3 transition-all duration-200 border-b ${
                theme === 'dark'
                  ? 'hover:bg-slate-700/40 text-white border-slate-700/20'
                  : 'hover:bg-gray-100/60 text-gray-900 border-gray-200/40'
              }`}
            >
              <MessageCircle className={`h-5 w-5 flex-shrink-0 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`} />
              <span className="text-sm font-medium">Chatbot</span>
            </button>

            {/* Questions & FAQs */}
            <button
              onClick={() => {
                setShowFeedbackModal(true);
                setShowMenu(false);
              }}
              className={`w-full flex items-center gap-4 px-4 py-3 transition-all duration-200 border-b ${
                theme === 'dark'
                  ? 'hover:bg-slate-700/40 text-white border-slate-700/20'
                  : 'hover:bg-gray-100/60 text-gray-900 border-gray-200/40'
              }`}
            >
              <MessageSquare className={`h-5 w-5 flex-shrink-0 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`} />
              <span className="text-sm font-medium">Questions & FAQs</span>
            </button>

            {/* Sign Out */}
            <button
              onClick={() => {
                setShowMenu(false);
                signOut();
              }}
              className={`w-full flex items-center gap-4 px-4 py-3 transition-all duration-200 ${
                theme === 'dark'
                  ? 'hover:bg-red-500/20 text-red-400'
                  : 'hover:bg-red-50 text-red-600'
              }`}
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
