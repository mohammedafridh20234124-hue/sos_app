import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface OTPVerificationProps {
  email: string;
  onVerified: (success: boolean) => void;
  onBackClick: () => void;
}

export const OTPVerification = ({ email, onVerified, onBackClick }: OTPVerificationProps) => {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const { toast } = useToast();
  const { verifyOTP, sendOTP } = useAuth();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter a 6-digit code",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { success, error } = await verifyOTP(email, otp);

    if (success) {
      toast({
        title: "Success!",
        description: "OTP verified successfully",
      });
      onVerified(true);
    } else {
      toast({
        title: "Verification Failed",
        description: error || "Invalid OTP. Please try again.",
        variant: "destructive",
      });
      setOtp("");
    }
    setLoading(false);
  };

  const handleResendOTP = async () => {
    setResendLoading(true);
    const { success, error } = await sendOTP(email);

    if (success) {
      toast({
        title: "OTP Sent",
        description: `A new OTP has been sent to ${email}`,
      });
      // Set 60-second cooldown
      setResendCooldown(60);
      const interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      toast({
        title: "Failed to resend OTP",
        description: error || "Please try again later",
        variant: "destructive",
      });
    }
    setResendLoading(false);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Verify Your Email</CardTitle>
        <CardDescription>
          We've sent a 6-digit OTP to {email}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleVerify} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="otp" className="text-sm font-medium">
              Enter OTP
            </label>
            <Input
              id="otp"
              type="text"
              placeholder="000000"
              maxLength={6}
              inputMode="numeric"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              disabled={loading}
              className="text-center text-2xl tracking-widest font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Enter the 6-digit code sent to your email. Valid for 10 minutes.
            </p>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading || otp.length !== 6}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify OTP"
            )}
          </Button>

          <div className="space-y-2">
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={handleResendOTP}
              disabled={resendLoading || resendCooldown > 0}
            >
              {resendCooldown > 0 ? (
                `Resend OTP in ${resendCooldown}s`
              ) : (
                "Resend OTP"
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={onBackClick}
              disabled={loading}
            >
              Back
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Didn't receive the code? Check your spam folder or request a new one.
          </p>
        </form>
      </CardContent>
    </Card>
  );
};
