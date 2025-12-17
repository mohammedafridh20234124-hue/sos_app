import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Smartphone, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import { InputOTP } from "@/components/ui/input-otp";

interface PhoneVerificationProps {
  phone: string;
  onVerified: (success: boolean) => void;
  onBackClick: () => void;
}

export const PhoneVerification = ({ phone, onVerified, onBackClick }: PhoneVerificationProps) => {
  const [step, setStep] = useState<"send" | "verify">("send");
  const [smsCode, setSmsCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [verified, setVerified] = useState(false);
  const { verifySMSOTP } = useAuth();
  const { toast } = useToast();

  // Handle resend timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleSendSMS = async () => {
    setLoading(true);
    try {
      // Validate phone number format
      if (!phone || phone.length < 10) {
        toast({
          title: "Invalid Phone",
          description: "Please enter a valid phone number",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // In a real app, this would call the backend to send SMS
      // For now, we'll simulate it with localStorage
      const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Store in localStorage for testing (remove in production)
      localStorage.setItem(`sms_${phone}`, generatedCode);
      
      // Also log it for development
      console.log(`SMS code for ${phone}: ${generatedCode}`);

      setStep("verify");
      setResendTimer(60);
      setSmsCode("");
      setAttempts(0);
      
      toast({
        title: "SMS Sent",
        description: `Verification code sent to ${phone}. Check your messages.`,
      });
    } catch (error: any) {
      toast({
        title: "Failed to send SMS",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (smsCode.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter a 6-digit code",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Verify the SMS OTP
      const { success, error } = await verifySMSOTP(phone, smsCode);

      if (success) {
        setVerified(true);
        toast({
          title: "Phone Verified!",
          description: "Your phone number has been verified successfully.",
        });
        
        setTimeout(() => {
          onVerified(true);
        }, 1500);
      } else {
        setAttempts((prev) => prev + 1);
        
        if (attempts >= 4) {
          toast({
            title: "Too Many Attempts",
            description: "Please try sending a new code",
            variant: "destructive",
          });
          setStep("send");
        } else {
          toast({
            title: "Invalid Code",
            description: error || `${5 - attempts} attempts remaining`,
            variant: "destructive",
          });
        }
      }
    } catch (error: any) {
      toast({
        title: "Verification Error",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setSmsCode("");
    setAttempts(0);
    await handleSendSMS();
  };

  if (verified) {
    return (
      <Card className="w-full max-w-md shadow-2xl border-2">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="p-4 rounded-full bg-green-100 dark:bg-green-900">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl">Phone Verified</CardTitle>
            <CardDescription>Your phone number is verified</CardDescription>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md shadow-2xl border-2">
      <CardHeader className="space-y-4">
        <div className="flex items-start gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBackClick}
            className="text-muted-foreground hover:text-foreground"
            disabled={loading}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <CardTitle className="text-2xl flex items-center gap-2">
              <Smartphone className="h-6 w-6 text-primary" />
              Phone Verification
            </CardTitle>
            <CardDescription>
              {step === "send"
                ? "Send verification code to your phone"
                : `Verify code sent to ${phone}`}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {step === "send" ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1234567890"
                value={phone}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Verification code will be sent via SMS
              </p>
            </div>

            <Button
              onClick={handleSendSMS}
              className="w-full"
              size="lg"
              disabled={loading || !phone}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Verification Code"
              )}
            </Button>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="sms-code">Verification Code</Label>
              <InputOTP
                maxLength={6}
                value={smsCode}
                onChange={setSmsCode}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Enter the 6-digit code sent to your phone
              </p>
            </div>

            <Button
              onClick={handleVerifyCode}
              className="w-full"
              size="lg"
              disabled={loading || smsCode.length !== 6}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify Code"
              )}
            </Button>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Didn't receive code?</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResendCode}
                disabled={resendTimer > 0 || loading}
                className="text-primary hover:text-primary/80"
              >
                {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend"}
              </Button>
            </div>

            {attempts > 0 && (
              <p className="text-xs text-center text-muted-foreground">
                {5 - attempts} attempts remaining
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
