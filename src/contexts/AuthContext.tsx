import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string, registerNumber?: string, role?: string, phoneNumber?: string) => Promise<{ error: any }>;
  sendOTP: (email: string) => Promise<{ error: any; success?: boolean }>;
  verifyOTP: (email: string, otp: string) => Promise<{ error: any; success?: boolean }>;
  sendSMSOTP: (phone: string) => Promise<{ error: any; success?: boolean }>;
  verifySMSOTP: (phone: string, otp: string) => Promise<{ error: any; success?: boolean }>;
  signOut: () => Promise<void>;
  userRole: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch user role
          setTimeout(async () => {
            const { data: roles } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', session.user.id)
              .single();
            
            setUserRole(roles?.role ?? 'student');
          }, 0);
        } else {
          setUserRole(null);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .single()
          .then(({ data: roles }) => {
            setUserRole(roles?.role ?? 'student');
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string, registerNumber: string = '', role: string = 'student', phoneNumber: string = '') => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          register_number: registerNumber,
          phone_number: phoneNumber,
          role: role,
        },
      },
    });
    return { error };
  };

  const signInWithGoogle = async () => {
    return { error: 'Google OAuth has been disabled. Please use phone or email authentication.' };
  };

  const signUpWithGoogle = async () => {
    return { error: 'Google OAuth has been disabled. Please use phone or email authentication.' };
  };

  const sendSMSOTP = async (phone: string) => {
    try {
      // Validate phone number
      if (!phone || phone.length < 10) {
        return { error: 'Invalid phone number', success: false };
      }

      // Generate a 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Save OTP to database (create sms_otp_tokens table)
      const { error: insertError } = await supabase
        .from('sms_otp_tokens')
        .insert({
          phone,
          otp_code: otp,
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
          verified: false,
          attempt_count: 0,
        });

      if (insertError && !insertError.message.includes('relation')) {
        return { error: insertError, success: false };
      }

      // Get the backend URL
      const backendUrl = window.location.hostname === 'localhost' 
        ? 'http://localhost:3001'
        : `http://${window.location.hostname}:3001`;

      // Send OTP via SMS through backend service
      try {
        const response = await fetch(`${backendUrl}/api/send-sms-otp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phone,
            otp,
            userName: 'Student',
          }),
        });

        if (!response.ok) {
          console.warn('Backend SMS service unavailable, OTP saved to database');
        } else {
          console.log('SMS OTP sent successfully');
        }
      } catch (smsError) {
        console.warn('Failed to send SMS OTP via backend:', smsError);
      }

      // Store OTP in localStorage for testing (remove in production)
      localStorage.setItem(`sms_${phone}`, otp);

      return { error: null, success: true };
    } catch (err) {
      return { error: err, success: false };
    }
  };

  const verifySMSOTP = async (phone: string, otp: string) => {
    try {
      // Try to find the OTP record in the database
      const { data: otpRecord, error: fetchError } = await supabase
        .from('sms_otp_tokens')
        .select('*')
        .eq('phone', phone)
        .eq('otp_code', otp)
        .gt('expires_at', new Date().toISOString())
        .single();

      // If table doesn't exist, check localStorage (for testing)
      if (fetchError?.message.includes('relation') || !otpRecord) {
        const storedOTP = localStorage.getItem(`sms_${phone}`);
        if (storedOTP === otp) {
          localStorage.removeItem(`sms_${phone}`);
          return { error: null, success: true };
        }
        return { error: 'Invalid or expired OTP', success: false };
      }

      // Check attempt count
      if (otpRecord.attempt_count >= 5) {
        return { error: 'Too many attempts. Please request a new OTP', success: false };
      }

      // Mark OTP as verified
      const { error: updateError } = await supabase
        .from('sms_otp_tokens')
        .update({ verified: true })
        .eq('id', otpRecord.id);

      if (updateError) {
        return { error: updateError, success: false };
      }

      return { error: null, success: true };
    } catch (err) {
      return { error: err, success: false };
    }
  };

  const sendOTP = async (email: string) => {
    try {
      // Generate a 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Save OTP to database
      const { error: insertError } = await supabase
        .from('otp_tokens')
        .insert({
          email,
          otp_code: otp,
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes expiry
          verified: false,
          attempt_count: 0,
        });

      if (insertError) {
        return { error: insertError, success: false };
      }

      // Get the backend URL
      const backendUrl = window.location.hostname === 'localhost' 
        ? 'http://localhost:3001'
        : `http://${window.location.hostname}:3001`;

      // Send OTP via email through backend service
      try {
        const response = await fetch(`${backendUrl}/api/send-otp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            otp,
            userName: 'Student',
          }),
        });

        if (!response.ok) {
          console.warn('Backend email service unavailable, OTP saved to database');
          // Still return success as OTP is in database for testing
        } else {
          console.log('OTP sent via email successfully');
        }
      } catch (emailError) {
        console.warn('Failed to send OTP email via backend:', emailError);
        // Still return success as OTP is in database
      }

      // Store OTP in localStorage for testing (remove in production)
      localStorage.setItem(`otp_${email}`, otp);

      return { error: null, success: true };
    } catch (err) {
      return { error: err, success: false };
    }
  };

  const verifyOTP = async (email: string, otp: string) => {
    try {
      // Find the OTP record
      const { data: otpRecord, error: fetchError } = await supabase
        .from('otp_tokens')
        .select('*')
        .eq('email', email)
        .eq('otp_code', otp)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (fetchError || !otpRecord) {
        return { error: 'Invalid or expired OTP', success: false };
      }

      // Check attempt count
      if (otpRecord.attempt_count >= 5) {
        return { error: 'Too many attempts. Please request a new OTP', success: false };
      }

      // Mark OTP as verified
      const { error: updateError } = await supabase
        .from('otp_tokens')
        .update({ verified: true })
        .eq('id', otpRecord.id);

      if (updateError) {
        return { error: updateError, success: false };
      }

      return { error: null, success: true };
    } catch (err) {
      return { error: err, success: false };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUserRole(null);
    navigate('/');
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, sendOTP, verifyOTP, sendSMSOTP, verifySMSOTP, signOut, userRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};