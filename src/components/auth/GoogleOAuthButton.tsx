import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Chrome, Loader2 } from "lucide-react";
import { useState } from "react";

interface GoogleOAuthButtonProps {
  variant?: "default" | "outline" | "ghost" | "secondary" | "destructive";
  className?: string;
  disabled?: boolean;
  isSignUp?: boolean;
}

export const GoogleOAuthButton = ({ 
  variant = "outline", 
  className = "", 
  disabled = false,
  isSignUp = false 
}: GoogleOAuthButtonProps) => {
  const [loading, setLoading] = useState(false);
  const { signInWithGoogle } = useAuth();
  const { toast } = useToast();

  const handleGoogleAuth = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (error: any) {
      toast({
        title: "Authentication Error",
        description: error.message || "Failed to sign in with Google",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      className={className}
      onClick={handleGoogleAuth}
      disabled={disabled || loading}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Connecting...
        </>
      ) : (
        <>
          <Chrome className="mr-2 h-4 w-4" />
          {isSignUp ? "Sign up with Google" : "Sign in with Google"}
        </>
      )}
    </Button>
  );
};
