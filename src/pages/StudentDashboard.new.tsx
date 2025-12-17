import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, MapPin, Phone, LogOut, CheckCircle, Clock, XCircle } from "lucide-react";
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
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-300/20 to-indigo-300/10 rounded-full blur-3xl -translate-x-1/3 -translate-y-1/3 animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute top-1/3 right-0 w-72 h-72 bg-gradient-to-br from-indigo-300/15 to-blue-300/10 rounded-full blur-3xl translate-x-1/3 animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-gradient-to-tl from-blue-400/10 to-indigo-300/5 rounded-full blur-3xl translate-y-1/3 animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />
        <div className="absolute inset-0 bg-gradient-to-t from-blue-50/30 via-transparent to-indigo-50/20" />
      </div>

      <div className="absolute inset-0 backdrop-blur-sm" />
      
      <div className="relative z-10 max-w-2xl mx-auto space-y-6">
        <div className="flex justify-between items-center backdrop-blur-md bg-white/30 border border-white/40 rounded-2xl p-4 shadow-lg hover:bg-white/40 transition-all duration-300">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Student Dashboard</h1>
          <Button variant="outline" onClick={() => signOut()} className="backdrop-blur-sm bg-white/40 border-white/50 hover:bg-white/60 hover:border-white/70 rounded-xl">
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>

        {activeAlert && (
          <>
            <Card className="backdrop-blur-md bg-gradient-to-br from-red-500/10 via-red-400/5 to-orange-400/10 border border-red-300/40 shadow-2xl hover:shadow-red-500/20 transition-all duration-300">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-4 rounded-full bg-red-500 animate-pulse shadow-lg shadow-red-500/60" />
                    <div>
                      <CardTitle className="text-red-600">Emergency Alert Active</CardTitle>
                      <CardDescription>Campus security has been notified</CardDescription>
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
              <div className="backdrop-blur-md bg-white/20 border border-white/40 rounded-2xl p-4 shadow-lg">
                <LiveRecorder ref={liveRecorderRef} alertId={activeAlert.id} />
              </div>
            </div>
          </>
        )}

        {!activeAlert && (
          <div className="flex flex-col items-center justify-center py-12 space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Stay Safe on Campus</h2>
              <p className="text-muted-foreground">Tap the button below in case of emergency</p>
            </div>
            
            <div className="relative flex items-center justify-center">
              <div className="absolute w-72 h-72 rounded-full border-2 border-red-500/30 animate-pulse" style={{ animationDuration: '2s' }} />
              <div className="absolute w-80 h-80 rounded-full border border-red-500/20 animate-pulse" style={{ animationDuration: '3s', animationDelay: '0.5s' }} />
              <div className="absolute w-88 h-88 rounded-full border border-red-500/10 animate-pulse" style={{ animationDuration: '4s', animationDelay: '1s' }} />
              <div className="absolute w-64 h-64 bg-gradient-to-br from-red-500/40 to-orange-400/20 rounded-full blur-3xl opacity-70 group-hover:opacity-100 transition-opacity duration-500" />
              
              <button
                onClick={() => setShowConfirmDialog(true)}
                className="relative group w-56 h-56 rounded-full bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 shadow-2xl hover:shadow-red-500/50 border-4 border-white/20 backdrop-blur-sm hover:border-white/40"
              >
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative text-center space-y-2 z-10">
                  <AlertCircle className="h-20 w-20 mx-auto drop-shadow-lg" />
                  <div className="space-y-0">
                    <span className="text-4xl font-black drop-shadow-lg block">SOS</span>
                    <span className="text-xs font-semibold text-white/90">EMERGENCY</span>
                  </div>
                </div>
              </button>
            </div>
            
            <p className="text-center text-muted-foreground max-w-md text-sm">
              Only press in case of genuine emergency. Campus security will be notified immediately with your location.
            </p>
          </div>
        )}

        <Card className="backdrop-blur-md bg-white/30 border border-white/40 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Your Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-white/40 backdrop-blur-sm rounded-lg border border-white/50">
              <div className="text-xs text-muted-foreground font-semibold mb-1">Name</div>
              <div className="font-semibold text-sm">{profile?.full_name || 'Not set'}</div>
            </div>
            <div className="p-3 bg-white/40 backdrop-blur-sm rounded-lg border border-white/50">
              <div className="text-xs text-muted-foreground font-semibold mb-1">Email</div>
              <div className="font-semibold text-sm break-all">{profile?.email}</div>
            </div>
            {profile?.user_metadata?.phone_number && (
              <div className="p-3 bg-white/40 backdrop-blur-sm rounded-lg border border-white/50">
                <div className="text-xs text-muted-foreground font-semibold mb-1">Phone</div>
                <div className="font-semibold text-sm flex items-center gap-2">
                  <Phone className="h-4 w-4 text-blue-600" />
                  {profile.user_metadata.phone_number}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="backdrop-blur-md bg-gradient-to-br from-red-500/10 via-orange-400/5 to-red-400/10 border border-red-300/40 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
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
    </div>
  );
};

export default StudentDashboard;
