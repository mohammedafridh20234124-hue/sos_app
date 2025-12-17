import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, MapPin, Phone, LogOut, CheckCircle, Clock, XCircle, HelpCircle, ArrowRight } from "lucide-react";
import LiveRecorder, { LiveRecorderRef } from "@/components/ui/live-recorder";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const StudentDashboard = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const liveRecorderRef = useRef<LiveRecorderRef>(null);
  const [profile, setProfile] = useState<any>(null);
  const [activeAlert, setActiveAlert] = useState<any>(null);
  const [location, setLocation] = useState<GeolocationPosition | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [alertDuration, setAlertDuration] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  useEffect(() => {
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
      },
      (error) => {
        console.error('Location error:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
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
            await fetch(`${apiBaseUrl}/api/location-update`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Alert-ID': activeAlert.id,
                'X-Timestamp': new Date().toISOString()
              },
              body: JSON.stringify(locationData)
            });
          } catch (fetchErr) {
            console.warn('Location update send failed:', fetchErr instanceof Error ? fetchErr.message : 'Unknown error');
          }

          try {
            await supabase
              .from('alert_data_packets')
              .insert({
                alert_id: activeAlert.id,
                location_data: locationData,
                notes: 'Continuous location tracking'
              });
          } catch (dbErr) {
            console.warn('DB insert failed:', dbErr);
          }
        } catch (err) {
          console.error('Location tracking error:', err);
        }
      }
    }, 5000);

    return () => {
      navigator.geolocation.clearWatch(watchId);
      clearInterval(locationInterval);
    };
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
      } catch (locErr) {
        console.warn("⚠ Location error (will continue without location):", locErr.message);
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
        await supabase.from('alert_data_packets').insert({
          alert_id: alert.id,
          location_data: locationData,
          notes: 'Initial SOS activation'
        });
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
      toast({
        title: "Activation Failed",
        description: error.message,
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

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Student Dashboard</h1>
          <Button variant="outline" onClick={() => signOut()}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>

        {/* Active Alert Status */}
        {activeAlert && (
          <>
            <Card className="border-2 border-red-500">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-4 rounded-full bg-red-500 animate-pulse" />
                    <div>
                      <CardTitle className="text-red-600">Emergency Alert Active</CardTitle>
                      <CardDescription>Campus security has been notified</CardDescription>
                    </div>
                  </div>
                  <Badge variant="destructive">LIVE</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-red-600" />
                    <div>
                      <div className="text-sm text-muted-foreground">Duration</div>
                      <div className="font-bold">{formatDuration(alertDuration)}</div>
                    </div>
                  </div>
                  {location && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <div className="text-sm text-muted-foreground">Location</div>
                        <div className="font-bold text-green-600">Tracked</div>
                      </div>
                    </div>
                  )}
                </div>
                
                {location && (
                  <div className="p-3 bg-blue-50 rounded border border-blue-200">
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
                  className="w-full"
                  onClick={() => setShowCancelDialog(true)}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel Alert
                </Button>
              </CardContent>
            </Card>

            <div className="max-w-2xl mx-auto">
              <LiveRecorder ref={liveRecorderRef} alertId={activeAlert.id} />
            </div>
          </>
        )}

        {/* Main SOS Button */}
        {!activeAlert && (
          <div className="flex flex-col items-center justify-center py-12 space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Stay Safe</h2>
              <p className="text-muted-foreground">Tap the button below in case of emergency</p>
            </div>
            
            <button
              onClick={() => setShowConfirmDialog(true)}
              className="w-48 h-48 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-lg"
            >
              <div className="text-center">
                <AlertCircle className="h-16 w-16 mx-auto mb-2" />
                <span className="text-3xl font-bold">SOS</span>
                <div className="text-xs mt-1">EMERGENCY</div>
              </div>
            </button>
            
            <p className="text-center text-muted-foreground max-w-md">
              Only press in case of genuine emergency. Campus security will be notified immediately.
            </p>
          </div>
        )}

        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle>Your Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-sm text-muted-foreground">Name</div>
              <div className="font-semibold">{profile?.full_name || 'Not set'}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Email</div>
              <div className="font-semibold">{profile?.email}</div>
            </div>
            {profile?.user_metadata?.phone_number && (
              <div>
                <div className="text-sm text-muted-foreground">Phone</div>
                <div className="font-semibold flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {profile.user_metadata.phone_number}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Emergency Contacts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Emergency Contacts
            </CardTitle>
            <CardDescription>Important emergency numbers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <a href="tel:911" className="flex items-center justify-between p-3 border rounded hover:bg-gray-50">
              <div>
                <div className="font-semibold">Emergency Services</div>
                <div className="text-sm text-muted-foreground">Call immediately for life-threatening emergencies</div>
              </div>
              <div className="text-2xl font-bold text-red-600">911</div>
            </a>
            <a href="tel:555-0100" className="flex items-center justify-between p-3 border rounded hover:bg-gray-50">
              <div>
                <div className="font-semibold">Campus Security</div>
                <div className="text-sm text-muted-foreground">Available 24/7</div>
              </div>
              <div className="text-lg font-bold">555-0100</div>
            </a>
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Dialogs */}
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
    </div>
  );
};

export default StudentDashboard;
