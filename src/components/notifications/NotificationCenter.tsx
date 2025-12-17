import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Bell, X, CheckCircle2, AlertCircle, Info, MessageCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";

interface Notification {
  id: string;
  title: string;
  message: string | null;
  type: string;
  created_at: string;
  read: boolean;
  read_at: string | null;
}

interface ChatMessage {
  id: string;
  user_id: string;
  user_name: string;
  message: string;
  created_at: string;
}

// System prompt for chatbot behavior and guidelines
const CHATBOT_SYSTEM_PROMPT = `You are the Campus Security Assistant for the SOS Emergency App. Your job is to provide clear, helpful, and calm guidance about: emergency alerts, campus safety, reporting problems, using the SOS app, security contact information. Always answer in simple, friendly language. If the user asks something outside emergency or campus safety, politely guide them back to relevant topics. Do not give medical or legal advice. Keep responses short and clear.`;

const FAQ_QUESTIONS = {
  "Emergency Alert Questions": [
    "How do I trigger an SOS alert quickly?",
    "What happens after I press the SOS button?",
    "Will campus security see my live location?",
    "Can I cancel an SOS alert after sending it?",
    "How fast does security respond to emergencies?",
    "Do I need mobile data for the SOS alert to work?",
  ],
  "Campus Safety Questions": [
    "What should I do if someone is following me?",
    "How do I report suspicious activity on campus?",
    "Where are the nearest security checkpoints?",
    "Is the campus monitored 24/7?",
    "How do I contact campus police?",
  ],
  "Personal Safety Questions": [
    "How do I stay safe while walking at night?",
    "What safety features are available in hostels?",
    "Is there a way to share my location with friends?",
  ],
};

// AI Answers for FAQ Questions
const FAQ_ANSWERS = {
  "How do I trigger an SOS alert quickly?": "Press and hold the large red SOS button on the main screen for 2 seconds. The app will ask for confirmation, then immediately alert campus security with your exact location. You can also set up a gesture shortcut in settings for even faster access.",
  
  "What happens after I press the SOS button?": "When you press SOS: 1) Your location is instantly sent to campus security, 2) Your registered emergency contacts receive a notification, 3) Your recorded video and audio are uploaded to security, 4) Campus security starts responding to your location, 5) You can stay in direct contact with security through the app.",
  
  "Will campus security see my live location?": "Yes, campus security can see your real-time location on a map after you press SOS. They will follow your movement to provide the best assistance possible. This helps security reach you faster and track your route if you're moving.",
  
  "Can I cancel an SOS alert after sending it?": "You can cancel within 10 seconds of pressing SOS. After 10 seconds, the alert is sent and cannot be cancelled. If you accidentally sent an alert, immediately contact campus security through the app to let them know it was a false alarm so they don't waste resources.",
  
  "How fast does security respond to emergencies?": "Campus security aims to respond to SOS alerts within 2-5 minutes during busy times and 1-2 minutes during quiet hours. Response time depends on your location and whether security personnel are available. Always have an alternative like calling 911 for non-campus emergencies.",
  
  "Do I need mobile data for the SOS alert to work?": "Yes, your device needs either mobile data or WiFi connection to send an SOS alert. The app will show a warning if you don't have a connection. Make sure your phone has at least some cellular or WiFi signal before you're in a risky situation.",
  
  "What should I do if someone is following me?": "Stay calm and: 1) Don't go directly home, 2) Go to a public area with people, 3) Immediately press SOS in the app to alert security, 4) Call 911 or campus police if off-campus, 5) Ask for help from nearby people, 6) Keep moving toward populated areas, 7) Share your real-time location with trusted friends through the app.",
  
  "How do I report suspicious activity on campus?": "To report suspicious activity: 1) Open the app and tap 'Report Activity', 2) Describe what you saw and when, 3) Include the location on campus, 4) Add any photos if safe to do so, 5) Submit the report to campus security. Your identity can remain anonymous if you prefer. Security will investigate and follow up if needed.",
  
  "Where are the nearest security checkpoints?": "Check the 'Campus Map' feature in the app to see all security checkpoint locations. Major checkpoints are typically near: main gates, parking lots, dorms, library, and student center. If in immediate danger, head to any visible checkpoint or call security directly.",
  
  "Is the campus monitored 24/7?": "Yes, campus security operates 24/7 with patrols and surveillance cameras in most common areas. However, some remote areas may have limited coverage. Always use the SOS app when you feel unsafe and don't assume an area is always being monitored.",
  
  "How do I contact campus police?": "Contact campus police through: 1) SOS app direct messaging (fastest), 2) Emergency hotline (shown in app home screen), 3) Campus police non-emergency number (in app Contact page), 4) Walk to nearest security checkpoint. For life-threatening emergencies off-campus, always call 911 first.",
  
  "How do I stay safe while walking at night?": "Night safety tips: 1) Walk in groups when possible, 2) Stick to main, well-lit paths on campus, 3) Keep your phone charged and the SOS app ready, 4) Tell someone where you're going and when you'll arrive, 5) Be aware of your surroundings, 6) Trust your instincts and move if something feels wrong, 7) Use campus escort service if available.",
  
  "What safety features are available in hostels?": "Hostel safety features: 1) Secure lock on your door, 2) Emergency button in room (if installed), 3) Security staff on-duty 24/7, 4) Visitor log at entrance, 5) CCTV in common areas, 6) Emergency exit clearly marked. Always keep your room locked and report suspicious behavior to hostel management immediately.",
  
  "Is there a way to share my location with friends?": "Yes! In the app, go to 'Share Location' and select trusted friends from your contacts. They can see your real-time location for a set time period (15 min, 1 hour, or until you turn it off). This is great when walking alone or in unfamiliar areas.",
};

interface NotificationCenterProps {
  isEmbedded?: boolean;
}

export const NotificationCenter = ({ isEmbedded = false }: NotificationCenterProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [showPanel, setShowPanel] = useState(isEmbedded ? true : false);
  const [activeTab, setActiveTab] = useState<"notifications" | "chat">("notifications");
  const [unreadCount, setUnreadCount] = useState(0);
  const [newMessage, setNewMessage] = useState("");
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [replyText, setReplyText] = useState("");
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const isAdmin = userRole === 'admin';

  // Clean up corrupted localStorage on first load
  useEffect(() => {
    if (user && !isAdmin) {
      const key = `student_questions_${user.id}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        try {
          const messages = JSON.parse(stored);
          // Check if messages are in wrong order (answer before question)
          if (messages.length > 0 && messages[0].type === 'answer' && messages[1]?.type === 'question') {
            console.log("🧹 Detected corrupted message order - clearing localStorage");
            localStorage.removeItem(key);
            setChatMessages([]);
          }
        } catch (e) {
          console.log("🧹 Corrupted localStorage data - clearing");
          localStorage.removeItem(key);
        }
      }
    }
  }, [user, isAdmin]);

  useEffect(() => {
    if (!user) return;

    // Fetch initial notifications
    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Error fetching notifications:", error);
        return;
      }

      let filtered = (data || []);
      
      // For admins: filter to only show questions/answers
      // For students: show all notifications (including answers from admin)
      if (isAdmin) {
        filtered = filtered.filter(n => ['question', 'answer'].includes(n.type));
      }
      
      setNotifications(filtered);
      const unread = filtered.filter((n) => !n.read).length;
      setUnreadCount(unread);
    };

    // Fetch chat messages from localStorage only (no database)
    const fetchChatMessages = async () => {
      try {
        // Chat messages are no longer used separately
        // All messages are stored as notifications
        setChatMessages([]);
      } catch (err) {
        console.warn("Error loading messages:", err);
        setChatMessages([]);
      }
    };

    fetchNotifications();
    fetchChatMessages();

    // Subscribe to real-time notifications
    const notifChannel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          
          setNotifications((prev) => [newNotification, ...prev]);
          setUnreadCount((prev) => prev + 1);

          // Show toast for new notification
          toast({
            title: newNotification.title,
            description: newNotification.message || "",
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const updatedNotification = payload.new as Notification;
          
          setNotifications((prev) =>
            prev.map((n) => (n.id === updatedNotification.id ? updatedNotification : n))
          );
          setUnreadCount(
            (prev) =>
              prev - (updatedNotification.read && !payload.old.read ? 1 : 0)
          );
        }
      )
      .subscribe();

    // For students, poll localStorage for broadcast messages every 2 seconds
    let broadcastPollInterval: any = null;
    let handleBroadcastChange: any = null;
    
    if (!isAdmin && user) {
      const loadBroadcasts = () => {
        const key = `broadcast_notifications_${user.id}`;
        console.log("🔍 Checking for broadcasts with key:", key);
        const stored = localStorage.getItem(key);
        if (stored) {
          try {
            const broadcasts = JSON.parse(stored);
            if (broadcasts && broadcasts.length > 0) {
              console.log("📢 Broadcast messages found:", broadcasts.length, broadcasts);
              setNotifications((prev) => {
                const merged = [...broadcasts, ...prev];
                // Remove duplicates by id
                const unique = merged.reduce((acc: any[], curr: any) => {
                  if (!acc.find(n => n.id === curr.id)) {
                    acc.push(curr);
                  }
                  return acc;
                }, []);
                unique.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                console.log("✅ Notifications updated with broadcasts");
                return unique;
              });
              // Clear the broadcast notifications after loading to prevent duplicates
              localStorage.removeItem(key);
              console.log("🧹 Cleared broadcast from localStorage");
            }
          } catch (e) {
            console.error("Error loading broadcast messages:", e);
          }
        } else {
          console.log("❌ No broadcast found for key:", key);
        }
      };

      // Load broadcasts immediately on mount
      loadBroadcasts();
      
      // Poll every 2 seconds
      broadcastPollInterval = setInterval(loadBroadcasts, 2000);
      
      // Also listen for storage changes from other tabs or manual dispatch
      handleBroadcastChange = (e: StorageEvent) => {
        const key = `broadcast_notifications_${user.id}`;
        if (e.key === key) {
          console.log("📢 Broadcast storage change detected");
          loadBroadcasts();
        }
      };
      
      window.addEventListener('storage', handleBroadcastChange);
    }

    // For admins, poll localStorage for new questions every 1 second
    let adminPollInterval: any = null;
    let handleStorageChange: any = null;
    
    if (isAdmin) {
      adminPollInterval = setInterval(() => {
        const stored = localStorage.getItem("admin_questions");
        if (stored) {
          try {
            const questions = JSON.parse(stored);
            console.log("📋 Admin polling - Found questions:", questions.length);
            setNotifications((prev) => {
              // Get non-question notifications from DB
              const dbNotifications = prev.filter(n => n.type !== 'question');
              // Merge with questions from localStorage, sorting by date
              const merged = [...questions, ...dbNotifications];
              merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
              return merged;
            });
          } catch (e) {
            console.error("Error parsing admin questions:", e);
          }
        }
      }, 1000);

      // Also listen for storage changes from other tabs
      handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'admin_questions') {
          console.log("📋 Storage change detected - admin_questions updated");
          const stored = localStorage.getItem("admin_questions");
          if (stored) {
            try {
              const questions = JSON.parse(stored);
              setNotifications((prev) => {
                const dbNotifications = prev.filter(n => n.type !== 'question');
                const merged = [...questions, ...dbNotifications];
                merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                return merged;
              });
            } catch (e) {
              console.error("Error parsing admin questions from storage change:", e);
            }
          }
        }
      };

      window.addEventListener('storage', handleStorageChange);
    }

    // Note: Chat messages are stored in localStorage only
    // No real-time subscription needed

    return () => {
      supabase.removeChannel(notifChannel);
      if (broadcastPollInterval) clearInterval(broadcastPollInterval);
      if (adminPollInterval) clearInterval(adminPollInterval);
      if (handleStorageChange) window.removeEventListener('storage', handleStorageChange);
      if (handleBroadcastChange) window.removeEventListener('storage', handleBroadcastChange);
    };
  }, [user, toast, isAdmin]);

  // Load questions from localStorage when chat tab is active
  useEffect(() => {
    const loadQuestions = () => {
      if (user && !isAdmin) {
        const key = `student_questions_${user.id}`;
        const stored = localStorage.getItem(key);
        if (stored) {
          try {
            const qs = JSON.parse(stored);
            console.log("📝 Loaded student questions:", qs.length);
            setChatMessages(qs);
          } catch (e) {
            console.error("Error loading questions:", e);
            setChatMessages([]);
          }
        } else {
          setChatMessages([]);
        }
      }
    };

    // Always load questions when component mounts or when user changes
    loadQuestions();

    if (activeTab === "chat") {
      loadQuestions();
      
      // Listen for storage changes to update questions in real-time
      const handleStorageChange = (e: StorageEvent) => {
        const key = `student_questions_${user?.id}`;
        if (e.key === key) {
          console.log("📝 Storage change detected - refreshing questions");
          loadQuestions();
        }
      };
      
      window.addEventListener('storage', handleStorageChange);
      
      // Also poll localStorage every 500ms to catch same-tab updates
      const pollInterval = setInterval(() => {
        loadQuestions();
      }, 500);
      
      return () => {
        window.removeEventListener('storage', handleStorageChange);
        clearInterval(pollInterval);
      };
    }
  }, [activeTab, user, isAdmin]);

  // For students, always listen for storage changes (admin replies)
  useEffect(() => {
    if (isAdmin || !user) return;

    const loadQuestions = () => {
      if (user && !isAdmin) {
        const key = `student_questions_${user.id}`;
        const stored = localStorage.getItem(key);
        if (stored) {
          try {
            const qs = JSON.parse(stored);
            setChatMessages(qs);
            console.log("📝 Loaded student questions:", qs.length);
          } catch (e) {
            console.error("Error loading questions:", e);
          }
        }
      }
    };

    const handleReplyChange = (e: StorageEvent) => {
      const key = `student_questions_${user.id}`;
      if (e.key === key) {
        console.log("📝 Student received admin reply - refreshing questions");
        loadQuestions();
      }
    };

    window.addEventListener('storage', handleReplyChange);
    return () => {
      window.removeEventListener('storage', handleReplyChange);
    };
  }, [user, isAdmin]);

  const markAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true, read_at: new Date().toISOString() })
      .eq("id", notificationId);

    if (error) {
      console.error("Error marking notification as read:", error);
      return;
    }

    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const deleteNotification = async (notificationId: string) => {
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId);

    if (error) {
      console.error("Error deleting notification:", error);
      return;
    }

    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
  };

  // Get AI answer for a question (with fallback for custom questions)
  const getAIAnswer = (question: string): string => {
    // Check if this is a FAQ question with a predefined answer
    if (FAQ_ANSWERS[question as keyof typeof FAQ_ANSWERS]) {
      return FAQ_ANSWERS[question as keyof typeof FAQ_ANSWERS];
    }
    
    // For custom questions, generate a contextual response
    const customQuestion = question.toLowerCase();
    let answer = "Thank you for your question! ";
    
    if (customQuestion.includes("alert") || customQuestion.includes("emergency")) {
      answer += "Your question about emergency alerts is important. Please ensure you understand that the SOS system is designed for genuine emergencies. Contact campus security directly for detailed assistance with emergency procedures. They're available 24/7 to help.";
    } else if (customQuestion.includes("location") || customQuestion.includes("track")) {
      answer += "Location tracking in the SOS system is only activated when you send an emergency alert. Your privacy is protected - we do not track your location during normal use. Location data is only shared with authorized campus security personnel.";
    } else if (customQuestion.includes("contact") || customQuestion.includes("reach")) {
      answer += "You can reach campus security through multiple channels: 1) Emergency SOS button in the app, 2) Phone: Contact campus security non-emergency line, 3) App messaging feature for non-urgent inquiries, 4) In-person at the security office.";
    } else if (customQuestion.includes("permission") || customQuestion.includes("enable")) {
      answer += "To enable the necessary app permissions: Go to your phone Settings > Apps > SOS Campus Security > Permissions, and enable Location, Camera, Microphone, and Contacts as needed. These are required for the app to function properly.";
    } else if (customQuestion.includes("problem") || customQuestion.includes("not work") || customQuestion.includes("error")) {
      answer += "For technical issues: 1) Try restarting the app, 2) Restart your phone, 3) Check your internet connection, 4) Update the app to the latest version, 5) Clear app cache in settings. If the problem persists, please contact our technical support team.";
    } else {
      answer += "Thank you for reaching out! This question is important. For the most accurate and detailed response, please contact campus security directly through the app or call the security office. Our team is available to help with specific concerns and provide personalized guidance.";
    }
    
    return answer;
  };

  const handleSendMessage = async (messageText: string) => {
    if (!user || !messageText.trim()) return;

    try {
      const cleanMessage = messageText.trim();
      
      // Create user's question object
      const userQuestion = {
        id: `q_${Date.now()}`,
        user_id: user.id,
        user_name: user.user_metadata?.full_name || user.email || "Anonymous",
        message: cleanMessage,
        type: "question",
        created_at: new Date().toISOString(),
        read: false,
        read_at: null,
      };

      // Get AI answer for this question
      const aiAnswer = getAIAnswer(cleanMessage);
      
      // Create AI answer notification for the student
      const aiResponse = {
        id: `answer_${Date.now()}`,
        user_id: user.id,
        title: "Campus Security Assistant",
        message: aiAnswer,
        type: "answer",
        created_at: new Date(Date.now() + 500).toISOString(), // Slight delay to show it came after question
        read: false,
        read_at: null,
      };

      // Get existing student questions/answers from localStorage
      const key = `student_questions_${user.id}`;
      const stored = localStorage.getItem(key);
      const existingMessages = stored ? JSON.parse(stored) : [];
      
      // Add question and answer to the END (so oldest appear first, newest appear last)
      const updated = [...existingMessages, userQuestion, aiResponse];
      
      // Save to localStorage
      localStorage.setItem(key, JSON.stringify(updated));
      console.log("💬 Question asked and AI answer generated:", { question: cleanMessage, answer: aiAnswer });
      
      // Update chat messages in real-time
      setChatMessages(updated);
      
      // Clear input
      setNewMessage("");
      
      toast({
        title: "✅ AI Answer Ready",
        description: "Your question has been answered by the Campus Security Assistant",
      });
      
      console.log("AI answer generated:", aiResponse);
    } catch (err: any) {
      console.error("Error:", err);
      toast({
        title: "Error",
        description: "Failed to process your question",
        variant: "destructive",
      });
    }
  };

  // Function for admin to send answers to students
  const sendAnswerToStudent = async (studentUserId: string, studentName: string, answerText: string) => {
    if (!answerText.trim()) return;

    try {
      // Create notification for the student
      const answerNotification = {
        id: `answer_${Date.now()}`,
        user_id: studentUserId,
        title: "Admin Response",
        message: answerText.trim(),
        type: "answer",
        created_at: new Date().toISOString(),
        read: false,
        read_at: null,
      };

      // Get existing student questions/answers from localStorage (use student_questions key)
      const key = `student_questions_${studentUserId}`;
      const stored = localStorage.getItem(key);
      const questions = stored ? JSON.parse(stored) : [];
      
      // Add new answer
      const updated = [answerNotification, ...questions];
      
      // Save to localStorage (use student_questions, not student_notifications)
      localStorage.setItem(key, JSON.stringify(updated));
      
      toast({
        title: "✅ Answer Sent",
        description: `Answer sent to ${studentName}`,
      });
      
      console.log("Answer sent to student:", answerNotification);
      return true;
    } catch (err: any) {
      console.error("Error:", err);
      toast({
        title: "Error",
        description: "Failed to send answer",
        variant: "destructive",
      });
      return false;
    }
  };

  const sendMessage = async () => {
    handleSendMessage(newMessage);
  };

  const sendReplyToStudent = async (studentQuestion: any) => {
    if (!replyText.trim()) return;

    try {
      // Create notification for the student
      const answerNotification = {
        user_id: studentQuestion.user_id,
        title: "Admin Response",
        message: replyText.trim(),
        type: "answer",
        created_at: new Date().toISOString(),
        read: false,
        read_at: null,
      };

      // Try to save to Supabase notifications table
      try {
        const { error } = await supabase
          .from("notifications")
          .insert([answerNotification]);

        if (error) {
          console.error("Supabase insert error:", error);
          // Continue anyway - localStorage backup will handle it
        }
      } catch (dbError) {
        console.error("Database error (continuing with localStorage):", dbError);
      }

      // Always save to localStorage for Questions tab with an ID
      const answerWithId = {
        id: `answer_${Date.now()}`,
        ...answerNotification,
      };
      
      const key = `student_questions_${studentQuestion.user_id}`;
      const stored = localStorage.getItem(key);
      const questions = stored ? JSON.parse(stored) : [];
      
      // Add new answer
      const updated = [answerWithId, ...questions];
      
      // Save to localStorage
      localStorage.setItem(key, JSON.stringify(updated));
      
      // Also save to a broadcast key so it appears in Notifications tab
      const broadcastKey = `broadcast_notifications_${studentQuestion.user_id}`;
      const broadcastStored = localStorage.getItem(broadcastKey);
      const broadcasts = broadcastStored ? JSON.parse(broadcastStored) : [];
      const broadcastAnswer = {
        id: `answer_${Date.now()}`,
        user_id: studentQuestion.user_id,
        title: "Admin Response",
        message: replyText.trim(),
        type: "answer",
        created_at: new Date().toISOString(),
        read: false,
        read_at: null,
      };
      broadcasts.push(broadcastAnswer);
      localStorage.setItem(broadcastKey, JSON.stringify(broadcasts));
      
      // Dispatch storage event manually for same-tab updates
      const event = new StorageEvent('storage', {
        key: broadcastKey,
        newValue: JSON.stringify(broadcasts),
        url: window.location.href,
      });
      window.dispatchEvent(event);
      
      // Mark question as read in admin's list
      const updatedNotifications = notifications.map(n =>
        n.id === studentQuestion.id ? { ...n, read: true } : n
      );
      setNotifications(updatedNotifications);
      
      // Clear reply field
      setReplyText("");
      setReplyingTo(null);
      
      toast({
        title: "✅ Reply Sent",
        description: `Your response has been sent to ${studentQuestion.title}`,
      });
      
      console.log("💬 Reply sent to student:", answerNotification);
    } catch (err: any) {
      console.error("Error:", err);
      toast({
        title: "Error",
        description: "Failed to send reply",
        variant: "destructive",
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "alert":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "info":
        return <Info className="h-5 w-5 text-blue-500" />;
      case "question":
        return <MessageCircle className="h-5 w-5 text-orange-500" />;
      case "answer":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      default:
        return <Bell className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return date.toLocaleDateString();
  };

  return (
    <>
      {/* Notification Bell - Only show if not embedded in menu */}
      {!isEmbedded && (
        <div className="fixed top-4 right-4 z-50">
          <Button
            size="lg"
            variant="outline"
            className="rounded-full shadow-lg relative bg-white hover:bg-gray-100"
            onClick={() => setShowPanel(!showPanel)}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold transform translate-x-1 -translate-y-1">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Button>
        </div>
      )}

      {/* Notification Panel - Full overlay on mobile, dropdown on desktop */}
      {showPanel && (
        <>
          {/* Mobile Overlay - Only show if not embedded */}
          {!isEmbedded && (
            <div 
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={() => setShowPanel(false)}
            />
          )}
          
          {/* Notification Panel */}
          <div className={`${isEmbedded ? 'w-full' : 'fixed md:absolute top-0 md:top-16 right-0 md:right-0 bottom-0 md:bottom-auto left-0 md:left-auto w-full md:w-96 h-full md:h-96 z-50 md:z-40'} flex flex-col bg-white rounded-none md:rounded-lg shadow-lg md:shadow-xl`}>
            {/* Header - Only show if not embedded */}
            {!isEmbedded && (
              <div className="flex items-center justify-between px-4 py-4 border-b bg-gradient-to-r from-blue-50 to-white">
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowPanel(false)}
                  className="h-8 w-8 p-0 hover:bg-gray-200"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {!isAdmin && (
                <>
                  {notifications.length === 0 ? (
                    <div className={`${isEmbedded ? 'p-4' : 'p-8'} text-center text-muted-foreground`}>
                      <Bell className={`${isEmbedded ? 'h-8 w-8' : 'h-12 w-12'} mx-auto mb-3 opacity-30`} />
                      <p className={`${isEmbedded ? 'text-sm' : 'text-base'} font-medium`}>No notifications yet</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`${isEmbedded ? 'p-3' : 'p-4'} hover:bg-gray-50 transition-colors border-b`}
                        >
                          <div className="flex gap-3">
                            <div className="flex-shrink-0 mt-1">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`${isEmbedded ? 'text-xs' : 'text-sm'} font-semibold text-gray-900`}>{notification.title}</p>
                              {notification.message && (
                                <p className={`${isEmbedded ? 'text-xs' : 'text-sm'} text-gray-600 mt-1 line-clamp-3`}>
                                  {notification.message}
                                </p>
                              )}
                              <p className="text-xs text-gray-500 mt-2">
                                {formatTime(notification.created_at)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Admin Message */}
              {isAdmin && (
                <div className="p-6 text-center">
                  <Info className="h-10 w-10 mx-auto mb-3 text-blue-500 opacity-70" />
                  <p className="text-sm font-medium text-gray-900">Questions Handled Automatically</p>
                  <p className="text-xs text-gray-600 mt-2">Student questions are now answered by AI.</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
};
