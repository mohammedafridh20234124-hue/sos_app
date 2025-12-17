import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Shield, AlertTriangle, ArrowLeft, Eye, EyeOff, Mail, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { EnhancedRegistration } from "@/components/auth/EnhancedRegistration";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const role = searchParams.get("role") || "student";
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showEnhancedRegistration, setShowEnhancedRegistration] = useState(false);
  const navigate = useNavigate();
  const { signIn, signUp, user, userRole } = useAuth();
  const { toast } = useToast();

  // Redirect if already authenticated
  useEffect(() => {
    if (user && userRole) {
      if (userRole === "admin") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    }
  }, [user, userRole, navigate]);

  // For admin, pre-fill credentials
  useEffect(() => {
    if (role === "admin") {
      setEmail("admin@campus.edu");
      setPassword("admin123");
      if (!isLogin) {
        setFullName("System Administrator");
      }
    }
  }, [role, isLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        // Simple login
        const { error } = await signIn(email, password);
        
        if (error) {
          toast({
            title: "Login Failed",
            description: error.message,
            variant: "destructive",
          });
        } else {
          // Login successful, redirect
          if (role === "admin") {
            navigate("/admin");
          } else {
            navigate("/dashboard");
          }
        }
      } else {
        // For signup, show enhanced registration
        setShowEnhancedRegistration(true);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = role === "admin";

  // Show enhanced registration form
  if (showEnhancedRegistration) {
    return (
      <div 
        className="min-h-screen p-4 relative flex items-center justify-center"
        style={{
          backgroundImage: 'url(/building-bg.svg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        <div className="relative z-10">
          <EnhancedRegistration
            onRegistrationComplete={() => {
              toast({
                title: "Account Created!",
                description: "Please sign in with your credentials.",
              });
              setShowEnhancedRegistration(false);
              setIsLogin(true);
              setEmail("");
              setPassword("");
              setFullName("");
            }}
            onBackClick={() => {
              setShowEnhancedRegistration(false);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen p-4 relative flex items-center justify-center"
      style={{
        backgroundImage: 'url(/building-bg.svg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative z-10 bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl" style={{ padding: '0' }}>
        <Card className="w-full max-w-md shadow-none border-0">
        <CardHeader className="space-y-4">
          <div className="flex justify-between items-start">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className={`p-3 rounded-full ${isAdmin ? 'bg-accent/10' : 'bg-primary/10'}`}>
              {isAdmin ? (
                <AlertTriangle className="h-8 w-8 text-accent" />
              ) : (
                <Shield className="h-8 w-8 text-primary" />
              )}
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl">
              {isAdmin ? "Admin Access" : "Student Access"}
            </CardTitle>
            <CardDescription>
              {isLogin
                ? "Sign in to your account"
                : "Create a new student account"}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isAdmin ? (
              // Admin login - simple form
              <>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@campus.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isAdmin}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isAdmin}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>

                <div className="text-xs text-muted-foreground text-center bg-muted p-3 rounded-md">
                  <strong>Demo Credentials:</strong><br />
                  Email: admin@campus.edu<br />
                  Password: admin123
                </div>
              </>
            ) : (
              // Student login/signup
              <>
                {isLogin ? (
                  // Simple student email login
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="student@campus.edu"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing In...
                        </>
                      ) : (
                        "Sign In"
                      )}
                    </Button>

                    <div className="text-center text-sm">
                      <button
                        type="button"
                        onClick={() => setIsLogin(false)}
                        className="text-primary hover:underline"
                        disabled={loading}
                      >
                        Don't have an account? Sign up
                      </button>
                    </div>
                  </>
                ) : (
                  // Signup prompt
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Create a new student account with your details.
                    </p>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        "Create Account"
                      )}
                    </Button>

                    <div className="text-center text-sm">
                      <button
                        type="button"
                        onClick={() => setIsLogin(true)}
                        className="text-primary hover:underline"
                        disabled={loading}
                      >
                        Already have an account? Sign in
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </form>
        </CardContent>
      </Card>
      </div>
    </div>
  );
};

export default Auth;