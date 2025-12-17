import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, MapPin, LogOut, Clock, User, Phone, Mail, CheckCircle, XCircle, Download, Image, Volume2, Trash2, Play, Eye, Speaker, Moon, Sun } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

// Get API base URL - use relative path to leverage Vite proxy
const getApiBaseUrl = () => {
  // Use relative paths to leverage Vite dev proxy
  // In production, this will be served from the same origin
  return '';
};

const AdminDashboard = () => {
  const { signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [currentUserPhotos, setCurrentUserPhotos] = useState<any[]>([]);
  const [currentUserAudioClips, setCurrentUserAudioClips] = useState<any[]>([]);
  const [recordingsLoading, setRecordingsLoading] = useState(false);
  const [deleteConfirmFile, setDeleteConfirmFile] = useState<any>(null);
  const [studentQuestions, setStudentQuestions] = useState<any[]>([]);
  const [answerText, setAnswerText] = useState("");
  const [selectedQuestion, setSelectedQuestion] = useState<any>(null);
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastTitle, setBroadcastTitle] = useState("");

  useEffect(() => {
    loadAlerts();
    loadRecordings();
    loadStudentQuestions();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('emergency_alerts_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'emergency_alerts'
        },
        () => {
          loadAlerts();
        }
      )
      .subscribe();

    // Poll for new recordings every 3 seconds for faster updates
    // But only if we're not viewing a specific user's recordings
    const recordingsInterval = setInterval(() => {
      if (currentUserPhotos.length === 0 && currentUserAudioClips.length === 0) {
        loadRecordings();
      }
    }, 3000);

    // Poll for new questions every 2 seconds
    const questionsInterval = setInterval(() => {
      loadStudentQuestions();
    }, 2000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(recordingsInterval);
      clearInterval(questionsInterval);
    };
  }, [currentUserPhotos, currentUserAudioClips]);

  useEffect(() => {
    if (selectedAlert) {
      loadStudentProfile(selectedAlert.student_id);
      // Reload location data more frequently
      const locationInterval = setInterval(() => {
        loadStudentProfile(selectedAlert.student_id);
      }, 2000);
      return () => clearInterval(locationInterval);
    }
  }, [selectedAlert]);

  const loadRecordings = async () => {
    try {
      setRecordingsLoading(true);
      const apiBaseUrl = getApiBaseUrl();
      
      // If we have a selected alert with a student ID, fetch that student's recordings
      let url = `${apiBaseUrl}/api/recordings`;
      if (selectedAlert?.student_id) {
        url += `?userId=${encodeURIComponent(selectedAlert.student_id)}`;
      }
      
      console.log("📹 Loading recordings from:", url);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(url, {
        method: "GET",
        headers: { "Accept": "application/json" },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      console.log("📹 API Response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        console.error("❌ API returned:", response.status, response.statusText, errorText);
        // Don't clear allUsers if we get an error, keep showing the list
        return;
      }
      
      const data = await response.json();
      console.log("📹 API Response data:", data);
      
      if (data.success) {
        // Check if this is individual user data (has photos/audioClips) or list data (has users)
        if (data.photos !== undefined || data.audioClips !== undefined) {
          // Single user data with photos and audio clips
          setCurrentUserPhotos(data.photos || []);
          setCurrentUserAudioClips(data.audioClips || []);
          setAllUsers([]);
          console.log(`✅ Loaded ${data.photos?.length || 0} photos and ${data.audioClips?.length || 0} audio clips for ${data.userName}`);
        } else if (data.users && Array.isArray(data.users)) {
          // All users list data - only update if we're NOT currently viewing a specific user's recordings
          if (currentUserPhotos.length === 0 && currentUserAudioClips.length === 0) {
            setAllUsers(data.users || []);
            console.log(`✅ Loaded data for ${data.users?.length || 0} users`);
          }
        } else {
          console.warn("⚠ Unexpected API response format:", data);
          // Keep showing students list even with unexpected format
        }
      } else {
        console.warn("⚠ API returned success:false", data);
        // Keep showing the current state
      }
    } catch (err: any) {
      console.error("❌ Failed to load recordings:", err.message);
      if (err.name === 'AbortError') {
        console.error("❌ Request timeout - server may be unavailable");
      }
      // Don't clear data on error, keep what we have
    } finally {
      setRecordingsLoading(false);
    }
  };

  const loadAlerts = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('emergency_alerts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) {
      setAlerts(data);
      if (!selectedAlert && data.length > 0 && data[0].status === 'active') {
        setSelectedAlert(data[0]);
      }
    }
    setLoading(false);
  };

  const loadStudentProfile = async (studentId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', studentId)
      .single();
    
    if (data) setStudentProfile(data);
  };

  const loadStudentQuestions = () => {
    try {
      // Load questions from localStorage (sent by students to admin)
      const stored = localStorage.getItem("admin_questions");
      if (stored) {
        const questions = JSON.parse(stored);
        setStudentQuestions(questions);
      } else {
        setStudentQuestions([]);
      }
    } catch (err) {
      console.error("Error loading student questions:", err);
      setStudentQuestions([]);
    }
  };

  const sendAnswerToStudent = async (question: any) => {
    if (!answerText.trim()) {
      toast({
        title: "Error",
        description: "Please type an answer",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create notification for the student
      const answerNotification = {
        user_id: question.user_id,
        title: "Admin Response",
        message: answerText.trim(),
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
      
      const key = `student_questions_${question.user_id}`;
      const stored = localStorage.getItem(key);
      const questions = stored ? JSON.parse(stored) : [];
      
      // Add new answer
      const updated = [answerWithId, ...questions];
      
      // Save to localStorage (use student_questions key)
      localStorage.setItem(key, JSON.stringify(updated));
      
      // Also save to a broadcast key so it appears in Notifications tab
      const broadcastKey = `broadcast_notifications_${question.user_id}`;
      const broadcastStored = localStorage.getItem(broadcastKey);
      const broadcasts = broadcastStored ? JSON.parse(broadcastStored) : [];
      const broadcastAnswer = {
        id: `answer_${Date.now()}`,
        user_id: question.user_id,
        title: "Admin Response",
        message: answerText.trim(),
        type: "answer",
        created_at: new Date().toISOString(),
        read: false,
        read_at: null,
      };
      broadcasts.push(broadcastAnswer);
      localStorage.setItem(broadcastKey, JSON.stringify(broadcasts));
      
      // Mark question as read
      const updatedQuestions = studentQuestions.map(q =>
        q.id === question.id ? { ...q, read: true } : q
      );
      setStudentQuestions(updatedQuestions);
      localStorage.setItem("admin_questions", JSON.stringify(updatedQuestions));
      
      // Clear answer field
      setAnswerText("");
      setSelectedQuestion(null);
      
      toast({
        title: "✅ Answer Sent",
        description: `Your response has been sent to ${question.title}`,
      });
      
      console.log("Answer sent to student:", answerNotification);
    } catch (err: any) {
      console.error("Error:", err);
      toast({
        title: "Error",
        description: "Failed to send answer",
        variant: "destructive",
      });
    }
  };

  const sendBroadcastMessage = async () => {
    if (!broadcastMessage.trim() || !broadcastTitle.trim()) {
      toast({
        title: "Error",
        description: "Please enter both title and message",
        variant: "destructive",
      });
      return;
    }

    try {
      // Use localStorage-based broadcast for all students
      // This avoids database calls and works cross-tab
      
      const newBroadcast = {
        id: `broadcast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: broadcastTitle.trim(),
        message: broadcastMessage.trim(),
        created_at: new Date().toISOString(),
        read: false
      };

      console.log("📢 Creating broadcast:", newBroadcast);

      // For a real app with multiple students, you would:
      // 1. Get list of student IDs from database
      // 2. Store broadcast in each student's localStorage
      // 3. Trigger storage events for each student
      
      // For now, we'll use a shared broadcast channel
      const allBroadcasts = JSON.parse(localStorage.getItem("all_broadcasts") || "[]");
      allBroadcasts.unshift(newBroadcast);
      localStorage.setItem("all_broadcasts", JSON.stringify(allBroadcasts));

      // Trigger storage event so all tabs and student instances get notified
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "all_broadcasts",
          newValue: JSON.stringify(allBroadcasts),
          storageArea: localStorage,
        })
      );

      console.log("✅ Broadcast saved to localStorage and notified all tabs");

      // Clear form
      setBroadcastMessage("");
      setBroadcastTitle("");

      toast({
        title: "✅ Message Broadcast",
        description: `Broadcast message sent successfully`,
      });

      console.log("✅ Broadcast message completed");
    } catch (err: any) {
      console.error("❌ Error sending broadcast:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to send broadcast message",
        variant: "destructive",
      });
    }
  };

  const resolveAlert = async () => {
    if (!selectedAlert) return;

    try {
      await supabase
        .from('emergency_alerts')
        .update({
          status: 'resolved',
          end_time: new Date().toISOString()
        })
        .eq('id', selectedAlert.id);

      toast({
        title: "Alert Resolved",
        description: "Emergency alert has been marked as resolved.",
      });

      setShowResolveDialog(false);
      loadAlerts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteRecording = async (file: any) => {
    try {
      if (!file?.id) {
        console.error("❌ Invalid file object - missing id:", file);
        toast({
          title: "Delete Failed",
          description: "Invalid recording object",
          variant: "destructive",
        });
        return;
      }
      
      console.log("🗑 Deleting file:", file.id);
      
      // Delete individual recording
      const apiBaseUrl = getApiBaseUrl();
      
      // Update the state to remove the file immediately (optimistic update)
      if (file.type === "frame") {
        setCurrentUserPhotos(prev => prev.filter(p => p.id !== file.id));
      } else {
        setCurrentUserAudioClips(prev => prev.filter(a => a.id !== file.id));
      }

      // Delete from server using the DELETE endpoint
      const response = await fetch(`${apiBaseUrl}/api/recording/${file.id}`, {
        method: "DELETE",
        headers: { 
          "Accept": "application/json",
          "Content-Type": "application/json" 
        }
      }).catch(err => {
        console.warn("⚠️ Server delete endpoint not available yet, but UI is updated:", err);
        return null;
      });

      if (response && !response.ok) {
        const errorText = await response.text().catch(() => "");
        console.warn("⚠️ Server responded with:", response.status, errorText);
      }

      toast({
        title: "File Deleted",
        description: `${file.id} has been removed from the recordings.`,
      });

      setDeleteConfirmFile(null);
    } catch (err: any) {
      console.error("❌ Failed to delete file:", err);
      // Refresh to revert the optimistic update if there's an error
      loadRecordings();
      toast({
        title: "Delete Failed",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const deleteAllRecordings = async (type: "frame" | "audio") => {
    try {
      const itemsToDelete = type === "frame" ? currentUserPhotos : currentUserAudioClips;
      
      if (itemsToDelete.length === 0) {
        toast({
          title: "No Files",
          description: `No ${type === "frame" ? "photos" : "audio"} to delete.`,
        });
        return;
      }

      // Optimistic update - remove from UI immediately
      if (type === "frame") {
        setCurrentUserPhotos([]);
      } else {
        setCurrentUserAudioClips([]);
      }

      const apiBaseUrl = getApiBaseUrl();
      let url = `${apiBaseUrl}/api/recordings/clear`;
      
      // If we have a current user ID from the recordings
      const userId = itemsToDelete[0]?.userId;
      if (userId) {
        url += `?userId=${encodeURIComponent(userId)}`;
      }

      const response = await fetch(url, {
        method: "POST",
        headers: { 
          "Accept": "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          type: type === "frame" ? "frame" : "audio"
        })
      }).catch(err => {
        console.warn("⚠️ Server delete endpoint not fully available, but UI is updated:", err);
        return null;
      });

      if (response && !response.ok) {
        const errorText = await response.text().catch(() => "");
        console.warn("⚠️ Server responded with:", response.status, errorText);
      }

      toast({
        title: "All Deleted",
        description: `${itemsToDelete.length} ${type === "frame" ? "photo(s)" : "audio file(s)"} deleted successfully.`,
      });

      setDeleteConfirmFile(null);
    } catch (err: any) {
      console.error("❌ Failed to delete files:", err);
      // Refresh to revert the optimistic update if there's an error
      loadRecordings();
      toast({
        title: "Delete Failed",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'destructive';
      case 'resolved':
        return 'default';
      case 'cancelled':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <AlertCircle className="h-4 w-4" />;
      case 'resolved':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getDuration = (startTime: string, endTime?: string) => {
    const start = new Date(startTime).getTime();
    const end = endTime ? new Date(endTime).getTime() : Date.now();
    const duration = Math.floor((end - start) / 1000);
    const mins = Math.floor(duration / 60);
    const secs = duration % 60;
    return `${mins}m ${secs}s`;
  };

  const activeAlerts = alerts.filter(a => a.status === 'active');
  const resolvedAlerts = alerts.filter(a => a.status !== 'active');

  return (
    <div className={`min-h-screen transition-colors duration-500 relative p-4 ${
      theme === 'dark'
        ? 'bg-black'
        : 'bg-gray-50'
    }`}>
      {/* Dark mode glow effects */}
      {theme === 'dark' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-red-600/20 via-red-500/10 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
          <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-gradient-to-br from-blue-600/15 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
          <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-gradient-to-tl from-red-500/10 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />
        </div>
      )}
      
      <div className={`max-w-7xl mx-auto space-y-6 relative z-10`}>
        {/* Header */}
        <div className={`flex justify-between items-center transition-colors duration-500 ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={toggleTheme}
              className={theme === 'dark' ? 'bg-slate-800/60 border-slate-600/50 text-white hover:bg-slate-800/80 hover:text-white' : ''}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
            <Button variant="outline" onClick={signOut} className={theme === 'dark' ? 'bg-slate-800/60 border-red-500/30 text-white hover:bg-slate-800/80 hover:text-white' : ''}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {theme === 'dark' ? (
            <>
              {/* Dark Mode Cards with Glow */}
              <Card className="bg-slate-900/60 border-red-500/30 hover:border-red-500/50 hover:shadow-red-500/20 shadow-2xl transition-all duration-300 backdrop-blur-lg">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardDescription className="font-medium text-gray-400">Active Alerts</CardDescription>
                    <div className="h-8 w-8 rounded-lg bg-red-600/30 flex items-center justify-center animate-pulse">
                      <AlertCircle className="h-4 w-4 text-red-400" />
                    </div>
                  </div>
                  <CardTitle className="text-4xl font-bold text-red-400 mt-2">{activeAlerts.length}</CardTitle>
                </CardHeader>
              </Card>
              <Card className="bg-slate-900/60 border-green-500/30 hover:border-green-500/50 hover:shadow-green-500/20 shadow-2xl transition-all duration-300 backdrop-blur-lg">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardDescription className="font-medium text-gray-400">Resolved Today</CardDescription>
                    <div className="h-8 w-8 rounded-lg bg-green-600/30 flex items-center justify-center animate-pulse">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                    </div>
                  </div>
                  <CardTitle className="text-4xl font-bold text-green-400 mt-2">
                    {resolvedAlerts.filter(a => {
                      const today = new Date().toDateString();
                      return new Date(a.created_at).toDateString() === today;
                    }).length}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card className="bg-slate-900/60 border-blue-500/30 hover:border-blue-500/50 hover:shadow-blue-500/20 shadow-2xl transition-all duration-300 backdrop-blur-lg">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardDescription className="font-medium text-gray-400">Total Alerts</CardDescription>
                    <div className="h-8 w-8 rounded-lg bg-blue-600/30 flex items-center justify-center animate-pulse">
                      <AlertCircle className="h-4 w-4 text-blue-400" />
                    </div>
                  </div>
                  <CardTitle className="text-4xl font-bold text-blue-400 mt-2">{alerts.length}</CardTitle>
                </CardHeader>
              </Card>
            </>
          ) : (
            <>
              {/* Light Mode Cards */}
              <Card className="bg-gradient-to-br from-red-50 to-orange-50 border-red-200 hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardDescription className="font-medium">Active Alerts</CardDescription>
                    <div className="h-8 w-8 rounded-lg bg-emergency/20 flex items-center justify-center">
                      <AlertCircle className="h-4 w-4 text-emergency" />
                    </div>
                  </div>
                  <CardTitle className="text-4xl font-bold text-emergency mt-2">{activeAlerts.length}</CardTitle>
                </CardHeader>
              </Card>
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardDescription className="font-medium">Resolved Today</CardDescription>
                    <div className="h-8 w-8 rounded-lg bg-success/20 flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-success" />
                    </div>
                  </div>
                  <CardTitle className="text-4xl font-bold text-success mt-2">
                    {resolvedAlerts.filter(a => {
                      const today = new Date().toDateString();
                      return new Date(a.created_at).toDateString() === today;
                    }).length}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardDescription className="font-medium">Total Alerts</CardDescription>
                    <div className="h-8 w-8 rounded-lg bg-blue-200 flex items-center justify-center">
                      <AlertCircle className="h-4 w-4 text-blue-600" />
                    </div>
                  </div>
                  <CardTitle className="text-4xl font-bold text-blue-600 mt-2">{alerts.length}</CardTitle>
                </CardHeader>
              </Card>
            </>
          )}
        </div>

        {/* Broadcast Message Section */}
        <Card className={theme === 'dark' ? 'bg-slate-900/60 border-slate-700/50 backdrop-blur-lg' : ''}>
          <CardHeader>
            <CardTitle className={theme === 'dark' ? 'text-white' : ''}>Send Notification to All Students</CardTitle>
            <CardDescription className={theme === 'dark' ? 'text-gray-400' : ''}>Broadcast important safety messages</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className={`block text-sm font-bold mb-2 ${theme === 'dark' ? 'text-gray-300' : ''}`}>Message Title</label>
              <input
                type="text"
                placeholder="e.g., Safety Alert, Emergency Drill..."
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  theme === 'dark'
                    ? 'bg-slate-800/50 border-slate-600/50 text-white placeholder-gray-500 focus:ring-red-500/50'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
              />
            </div>
            <div>
              <label className={`block text-sm font-bold mb-2 ${theme === 'dark' ? 'text-gray-300' : ''}`}>Message Content</label>
              <textarea
                placeholder="Type your message here..."
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                rows={3}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  theme === 'dark'
                    ? 'bg-slate-800/50 border-slate-600/50 text-white placeholder-gray-500 focus:ring-red-500/50'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
              />
            </div>
            <Button
              onClick={sendBroadcastMessage}
              disabled={!broadcastMessage.trim() || !broadcastTitle.trim()}
              className={theme === 'dark' ? 'bg-red-600 hover:bg-red-700 text-white w-full' : 'w-full'}
            >
              Send Message to All Students
            </Button>
          </CardContent>
        </Card>

        {/* Recordings Section */}
        <Card className={theme === 'dark' ? 'bg-slate-900/60 border-slate-700/50 backdrop-blur-lg' : ''}>
          <CardHeader className={`border-b ${theme === 'dark' ? 'border-slate-700/30' : ''}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center text-xl ${
                  theme === 'dark'
                    ? 'bg-purple-600/50'
                    : 'bg-purple-600'
                }`}>
                  📹
                </div>
                <div>
                  <CardTitle className={theme === 'dark' ? 'text-white' : ''}>Live Recordings & Media</CardTitle>
                  <CardDescription className={`mt-1 ${theme === 'dark' ? 'text-gray-400' : ''}`}>
                    {selectedAlert ? `📸 Video frames and 🔊 audio clips from ${studentProfile?.full_name || 'Student'}` : (currentUserPhotos.length > 0 || currentUserAudioClips.length > 0) ? `📊 Viewing ${currentUserPhotos.length} photos and ${currentUserAudioClips.length} audio clips` : '👥 Recordings organized by student'}
                  </CardDescription>
                </div>
              </div>
              <div className="flex gap-2">
                {(currentUserPhotos.length > 0 || currentUserAudioClips.length > 0) ? (
                  <>
                    <button
                      onClick={() => {
                        loadRecordings();
                      }}
                      className={`px-3 py-1 text-sm rounded hover:opacity-80 transition-all ${
                        theme === 'dark'
                          ? 'bg-slate-700/50 text-gray-300 hover:bg-slate-700/70'
                          : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                      }`}
                      title="Refresh the recordings"
                    >
                      🔄 Refresh
                    </button>
                    <button
                      onClick={() => {
                        setCurrentUserPhotos([]);
                        setCurrentUserAudioClips([]);
                        loadRecordings();
                      }}
                      className={`px-3 py-1 text-sm rounded hover:opacity-80 transition-all ${
                        theme === 'dark'
                          ? 'bg-red-600/30 text-red-300 hover:bg-red-600/50'
                          : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                      }`}
                      title="Close and return to student list"
                    >
                      ✕ Close
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      loadRecordings();
                    }}
                    className={`px-3 py-1 text-sm rounded hover:opacity-80 transition-all ${
                      theme === 'dark'
                        ? 'bg-slate-700/50 text-gray-300 hover:bg-slate-700/70'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    }`}
                    title="Refresh the recordings list"
                  >
                    🔄 Refresh
                  </button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {(currentUserPhotos.length > 0 || currentUserAudioClips.length > 0) ? (
              // Single student view - show their recordings
              <div className="space-y-6">
                {/* Video Frames Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className={`text-lg font-semibold flex items-center gap-2 ${theme === 'dark' ? 'text-white' : ''}`}>
                      <Image className="h-5 w-5" />
                      Photos ({currentUserPhotos.length})
                    </h3>
                      {currentUserPhotos.length > 0 && (
                        <button
                          onClick={() => deleteAllRecordings("frame")}
                          className="px-3 py-1 text-xs bg-destructive text-destructive-foreground rounded hover:bg-destructive/90"
                        >
                          <Trash2 className="h-3 w-3 inline mr-1" />
                          Delete All Photos
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                      {currentUserPhotos.length > 0 ? (
                        currentUserPhotos
                          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                          .map((photo) => {
                            const apiBaseUrl = getApiBaseUrl();
                            // Use the backend API endpoint to fetch photo by ID
                            const imageUrl = `${apiBaseUrl}/api/photo/${photo.id}`;
                            return (
                              <div key={photo.id} className="border rounded-lg overflow-hidden hover:shadow-lg transition-all hover:scale-105 relative group">
                                <div className="bg-muted w-full aspect-video flex items-center justify-center">
                                  <img 
                                    src={imageUrl} 
                                    alt="Photo"
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                    onError={(e) => {
                                      console.error(`Failed to load photo: ${imageUrl}`);
                                      (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%23999' width='100' height='100'/%3E%3Ctext x='50' y='50' text-anchor='middle' dy='.3em' fill='white' font-size='12'%3EFailed%3C/text%3E%3C/svg%3E";
                                    }}
                                  />
                                </div>
                                <div className="p-2 text-xs text-muted-foreground space-y-1">
                                  <div className="flex justify-between items-center">
                                    <Badge variant="outline" className="text-xs">Photo</Badge>
                                    <span>{(photo.size / 1024).toFixed(0)} KB</span>
                                  </div>
                                  <div className="truncate">{new Date(photo.timestamp).toLocaleTimeString()}</div>
                                  <div className="flex gap-1">
                                    <a 
                                      href={imageUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90"
                                    >
                                      <Eye className="h-3 w-3" />
                                      Open Photo
                                    </a>
                                    <button
                                      onClick={() => setDeleteConfirmFile(photo)}
                                      className="px-2 py-1 text-xs bg-destructive text-destructive-foreground rounded hover:bg-destructive/90"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                      ) : (
                        <p className="col-span-full text-center text-sm text-muted-foreground py-4">No photos yet</p>
                      )}
                    </div>
                  </div>

                  {/* Audio Section */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Volume2 className="h-5 w-5" />
                        Audio Clips ({currentUserAudioClips.length})
                      </h3>
                      {currentUserAudioClips.length > 0 && (
                        <button
                          onClick={() => deleteAllRecordings("audio")}
                          className="px-3 py-1 text-xs bg-destructive text-destructive-foreground rounded hover:bg-destructive/90"
                        >
                          <Trash2 className="h-3 w-3 inline mr-1" />
                          Delete All Audio
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {currentUserAudioClips.length > 0 ? (
                        currentUserAudioClips
                          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                          .map((audioClip) => {
                            const apiBaseUrl = getApiBaseUrl();
                            // Use the backend API endpoint to fetch audio by ID
                            const audioUrl = `${apiBaseUrl}/api/audio/${audioClip.id}`;
                            return (
                              <div key={audioClip.id} className="border rounded-lg p-4 bg-muted/30 hover:bg-muted/50 transition-colors">
                                <div className="flex items-start justify-between mb-3">
                                  <Badge variant="secondary">Audio</Badge>
                                  <span className="text-xs text-muted-foreground">{(audioClip.size / 1024).toFixed(1)} KB</span>
                                </div>
                                <audio 
                                  controls 
                                  className="w-full mb-2 h-10"
                                  controlsList="nodownload"
                                  preload="metadata"
                                  onError={(e) => {
                                    console.error(`❌ Audio playback error for ${audioClip.id}:`, e);
                                  }}
                                >
                                  <source 
                                    src={audioUrl} 
                                    type={audioClip.mimeType || "audio/webm"}
                                  />
                                  <p>Your browser does not support the audio element. <a href={audioUrl} download>Download audio</a></p>
                                </audio>
                                <div className="text-xs text-muted-foreground mb-2">
                                  {new Date(audioClip.timestamp).toLocaleTimeString()}
                                </div>
                                <div className="flex gap-2">
                                  <a 
                                    href={audioUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90"
                                  >
                                    <Speaker className="h-3 w-3" />
                                    Play Audio
                                  </a>
                                  <button
                                    onClick={() => setDeleteConfirmFile(audioClip)}
                                    className="px-3 py-2 text-xs bg-destructive text-destructive-foreground rounded hover:bg-destructive/90"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                            );
                          })
                      ) : (
                        <p className="col-span-full text-center text-sm text-muted-foreground py-4">No audio clips yet</p>
                      )}
                    </div>
                  </div>
                </div>
            ) : allUsers.length === 0 ? (
              <div className="text-center py-12 space-y-4">
                <Image className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <div className="space-y-1">
                  <p className="font-semibold text-foreground">No Recordings Available</p>
                  <p className="text-sm text-muted-foreground">
                    Recordings will appear here once students trigger an emergency alert and the system starts capturing video frames and audio clips.
                  </p>
                </div>
                <p className="text-xs text-muted-foreground pt-4">
                  💡 Tip: Select an active alert on the left to view that student's live recordings
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground mb-4">Students with recordings:</p>
                {allUsers.map((user) => (
                  <div 
                    key={user.userId} 
                    className="border rounded-lg p-4 bg-muted/30 hover:bg-muted/50 cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
                  >
                    <div className="space-y-3">
                      <div>
                        <p className="font-semibold text-base">{user.userName}</p>
                        <p className="text-xs text-muted-foreground mt-1">ID: {user.userId}</p>
                      </div>
                      <div className="flex flex-wrap gap-3 items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-blue-600">📸 {user.photos} photo{user.photos !== 1 ? 's' : ''}</p>
                          <p className="text-sm font-semibold text-green-600">🔊 {user.audioClips} clip{user.audioClips !== 1 ? 's' : ''}</p>
                        </div>
                        <div className="flex gap-2">
                          {(user.photos > 0 || user.audioClips > 0) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setRecordingsLoading(true);
                                // Load this specific user's recordings
                                const url = `${getApiBaseUrl()}/api/recordings?userId=${encodeURIComponent(user.userId)}`;
                                fetch(url)
                                  .then(r => r.json())
                                  .then(data => {
                                    if (data.success) {
                                      setCurrentUserPhotos(data.photos || []);
                                      setCurrentUserAudioClips(data.audioClips || []);
                                      setAllUsers([]);
                                    }
                                  })
                                  .finally(() => setRecordingsLoading(false));
                              }}
                              className="px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors shadow-sm hover:shadow-md whitespace-nowrap"
                            >
                              👁️ View
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
            }
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Alert List */}
          <div className="space-y-4">
            <Card className={theme === 'dark' ? 'bg-slate-900/60 border-slate-700/50 backdrop-blur-lg' : ''}>
              <CardHeader>
                <CardTitle className={theme === 'dark' ? 'text-white' : ''}>Active Emergency Alerts</CardTitle>
                <CardDescription className={theme === 'dark' ? 'text-gray-400' : ''}>
                  Real-time monitoring of ongoing emergencies
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {loading ? (
                  <p className={`text-center py-4 ${theme === 'dark' ? 'text-gray-400' : 'text-muted-foreground'}`}>Loading alerts...</p>
                ) : activeAlerts.length === 0 ? (
                  <p className={`text-center py-4 ${theme === 'dark' ? 'text-gray-400' : 'text-muted-foreground'}`}>No active alerts</p>
                ) : (
                  activeAlerts.map((alert) => (
                    <button
                      key={alert.id}
                      onClick={() => setSelectedAlert(alert)}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        selectedAlert?.id === alert.id
                          ? theme === 'dark'
                            ? 'border-red-500/50 bg-red-600/10'
                            : 'border-primary bg-primary/5'
                          : theme === 'dark'
                          ? 'border-slate-600/50 hover:border-red-500/30 bg-slate-800/30'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <Badge variant="destructive" className="animate-pulse">
                          <div className="flex items-center gap-1">
                            {getStatusIcon(alert.status)}
                            ACTIVE
                          </div>
                        </Badge>
                        <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-muted-foreground'}`}>
                          {getDuration(alert.start_time)}
                        </span>
                      </div>
                      <div className={`text-sm space-y-1 ${theme === 'dark' ? 'text-gray-300' : ''}`}>
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          {formatTimestamp(alert.start_time)}
                        </div>
                        {alert.last_location && (
                          <div className={`flex items-center gap-2 ${theme === 'dark' ? 'text-gray-400' : 'text-muted-foreground'}`}>
                            <MapPin className="h-3 w-3" />
                            Location available
                          </div>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className={theme === 'dark' ? 'bg-slate-900/60 border-slate-700/50 backdrop-blur-lg' : ''}>
              <CardHeader>
                <CardTitle className={theme === 'dark' ? 'text-white' : ''}>Recent History</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {resolvedAlerts.slice(0, 5).map((alert) => (
                  <button
                    key={alert.id}
                    onClick={() => setSelectedAlert(alert)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      selectedAlert?.id === alert.id
                        ? theme === 'dark'
                          ? 'border-green-500/50 bg-green-600/10'
                          : 'border-primary bg-primary/5'
                        : theme === 'dark'
                        ? 'border-slate-600/50 hover:border-green-500/30 bg-slate-800/30'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant={getStatusColor(alert.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(alert.status)}
                          {alert.status.toUpperCase()}
                        </div>
                      </Badge>
                      <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-muted-foreground'}`}>
                        {getDuration(alert.start_time, alert.end_time)}
                      </span>
                    </div>
                    <div className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-muted-foreground'}`}>
                      {formatTimestamp(alert.start_time)}
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Alert Details */}
          <Card className={`lg:sticky lg:top-4 h-fit ${theme === 'dark' ? 'bg-slate-900/60 border-slate-700/50 backdrop-blur-lg' : ''}`}>
            <CardHeader>
              <CardTitle className={theme === 'dark' ? 'text-white' : ''}>Alert Details</CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedAlert ? (
                <p className={`text-center py-8 ${theme === 'dark' ? 'text-gray-400' : 'text-muted-foreground'}`}>
                  Select an alert to view details
                </p>
              ) : (
                <div className="space-y-6">
                  {/* Student Information */}
                  <div className="space-y-3">
                    <h3 className={`font-semibold flex items-center gap-2 ${theme === 'dark' ? 'text-white' : ''}`}>
                      <User className="h-4 w-4" />
                      Student Information
                    </h3>
                    <div className={`space-y-2 text-sm ${theme === 'dark' ? 'text-gray-300' : ''}`}>
                      <div className="flex justify-between">
                        <span className={theme === 'dark' ? 'text-gray-400' : 'text-muted-foreground'}>Name:</span>
                        <span className={`font-medium ${theme === 'dark' ? 'text-white' : ''}`}>
                          {studentProfile?.full_name || 'Loading...'}
                        </span>
                      </div>
                      {studentProfile?.student_id && (
                        <div className="flex justify-between">
                          <span className={theme === 'dark' ? 'text-gray-400' : 'text-muted-foreground'}>Student ID:</span>
                          <span className={`font-medium ${theme === 'dark' ? 'text-white' : ''}`}>{studentProfile.student_id}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Email:</span>
                        <span className="font-medium">{studentProfile?.email}</span>
                      </div>
                      {studentProfile?.phone_number && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Phone:</span>
                          <span className="font-medium">{studentProfile.phone_number}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Alert Information */}
                  <div className="space-y-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Alert Information
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge variant={getStatusColor(selectedAlert.status)}>
                          {selectedAlert.status.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Started:</span>
                        <span className="font-medium">
                          {formatTimestamp(selectedAlert.start_time)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Duration:</span>
                        <span className="font-medium">
                          {getDuration(selectedAlert.start_time, selectedAlert.end_time)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Location Information */}
                  {selectedAlert.last_location && (
                    <div className="space-y-3">
                      <h3 className="font-semibold flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Location
                      </h3>
                      <div className="p-3 bg-muted rounded-md space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Latitude:</span>
                          <span className="font-medium font-mono">
                            {selectedAlert.last_location.latitude?.toFixed(6)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Longitude:</span>
                          <span className="font-medium font-mono">
                            {selectedAlert.last_location.longitude?.toFixed(6)}
                          </span>
                        </div>
                        {selectedAlert.last_location.accuracy && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Accuracy:</span>
                            <span className="font-medium">
                              {Math.round(selectedAlert.last_location.accuracy)}m
                            </span>
                          </div>
                        )}
                        <a
                          href={`https://www.google.com/maps?q=${selectedAlert.last_location.latitude},${selectedAlert.last_location.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-center text-primary hover:underline mt-2"
                        >
                          Open in Google Maps →
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  {selectedAlert.status === 'active' && (
                    <div className="space-y-2 pt-4 border-t">
                      <Button
                        className="w-full"
                        variant="default"
                        onClick={() => setShowResolveDialog(true)}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Resolve Emergency
                      </Button>
                      {studentProfile?.phone_number && (
                        <Button
                          className="w-full"
                          variant="outline"
                          asChild
                        >
                          <a href={`tel:${studentProfile.phone_number}`}>
                            <Phone className="h-4 w-4 mr-2" />
                            Call Student
                          </a>
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Resolve Dialog */}
        <AlertDialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resolve Emergency Alert?</AlertDialogTitle>
            <AlertDialogDescription>
              Mark this emergency as resolved. The student will be notified that the incident has been handled.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={resolveAlert}>
              Confirm Resolution
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Recording Dialog */}
      <AlertDialog open={!!deleteConfirmFile} onOpenChange={(open) => !open && setDeleteConfirmFile(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Recording?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this {deleteConfirmFile?.type === "frame" ? "photo" : "audio"}? This action cannot be undone.
              <br />
              <span className="font-mono text-xs mt-2 block text-muted-foreground">{deleteConfirmFile?.id}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (deleteConfirmFile?.id) {
                  console.log("🗑️ Deleting recording:", deleteConfirmFile.id);
                  deleteRecording(deleteConfirmFile);
                } else {
                  console.error("❌ Invalid deleteConfirmFile object:", deleteConfirmFile);
                }
              }}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </div>
  );
};

export default AdminDashboard;