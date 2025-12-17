import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useStudentAuth } from "@/hooks/useStudentAuth";
import { Mail, Lock, ArrowRight } from "lucide-react";

const StudentLogin = () => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtpBox, setShowOtpBox] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("info");
  const navigate = useNavigate();
  const { login } = useStudentAuth();

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setMessage("Please enter your email");
      setMessageType("error");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/student/auth/send_verification.php", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `email=${encodeURIComponent(email)}`,
      });

      const data = await response.json();
      if (data.status === "success") {
        setShowOtpBox(true);
        setMessage("✓ OTP sent to your email! Check your inbox.");
        setMessageType("success");
      } else {
        setMessage(data.message || "Failed to send OTP");
        setMessageType("error");
      }
    } catch (error) {
      setMessage("Network error. Please try again.");
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      setMessage("Please enter a valid 6-digit code");
      setMessageType("error");
      return;
    }

    setIsLoading(true);
    try {
      const success = await login(email, otp);
      if (success) {
        navigate("/student/dashboard");
      } else {
        setMessage("Invalid OTP. Please try again.");
        setMessageType("error");
      }
    } catch (error) {
      setMessage("Verification failed.");
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="text-4xl mb-3">🎓</div>
            <CardTitle className="text-2xl">Campus Security</CardTitle>
            <CardDescription>Student Secure Login</CardDescription>
          </CardHeader>

          <CardContent>
            {message && (
              <div
                className={`mb-4 p-3 rounded-lg text-sm ${
                  messageType === "success"
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : messageType === "error"
                    ? "bg-red-50 text-red-700 border border-red-200"
                    : "bg-blue-50 text-blue-700 border border-blue-200"
                }`}
              >
                {message}
              </div>
            )}

            {!showOtpBox ? (
              <form onSubmit={handleSendOTP} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your-email@university.edu"
                      className="pl-10"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 gap-2"
                >
                  {isLoading ? "Sending..." : "Send OTP"}
                  <ArrowRight size={18} />
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                  <p className="text-sm text-blue-700">
                    📧 A 6-digit code has been sent to <strong>{email}</strong>
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Verification Code</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                    <Input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ""))}
                      placeholder="000000"
                      maxLength={6}
                      className="pl-10 text-center font-mono text-lg tracking-widest"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-green-600 hover:bg-green-700 gap-2"
                >
                  {isLoading ? "Verifying..." : "Verify Code"}
                  <ArrowRight size={18} />
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowOtpBox(false);
                    setOtp("");
                    setMessage("");
                  }}
                  className="w-full"
                >
                  Change Email
                </Button>
              </form>
            )}

            <div className="mt-6 pt-4 border-t">
              <p className="text-xs text-gray-500 text-center">
                🔒 Secure email verification • Your data is protected
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentLogin;
