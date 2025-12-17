import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Send, AlertCircle } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { supabase } from "@/integrations/supabase/client";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  studentId: string;
}

export const FeedbackModal = ({
  isOpen,
  onClose,
  studentName,
  studentId,
}: FeedbackModalProps) => {
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { theme } = useTheme();

  const handleSubmit = async () => {
    if (!feedbackMessage.trim()) {
      toast({
        title: "Empty Feedback",
        description: "Please enter your feedback before submitting.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // First, save to Supabase for database record
      const feedbackData = {
        user_id: studentId,
        user_name: studentName,
        message: feedbackMessage.trim(),
        message_type: "feedback",
        created_at: new Date().toISOString(),
      };

      try {
        const { error } = await supabase
          .from("student_messages")
          .insert([feedbackData]);

        if (error) {
          console.warn("Supabase error:", error);
        }
      } catch (dbError) {
        console.warn("Database save failed, continuing with SMS notification:", dbError);
      }

      // Send feedback notification via API endpoint (triggers Twilio SMS to admin)
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentName,
          studentId,
          feedbackMessage: feedbackMessage.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API error:", errorData);
        throw new Error(errorData.error || "Failed to send feedback");
      }

      const result = await response.json();
      console.log("✅ Feedback notification sent:", result);

      toast({
        title: "✅ Feedback Sent Successfully!",
        description: "Your feedback has been sent securely to the campus safety team.",
        className: theme === 'dark' ? 'bg-green-900/80 border-green-700' : 'bg-green-50 border-green-200',
      });

      setFeedbackMessage("");
      onClose();
    } catch (error: any) {
      console.error("Error sending feedback:", error);

      // Fallback to localStorage if API fails
      try {
        const feedbackKey = `student_feedback_${studentId}`;
        const existingFeedback = localStorage.getItem(feedbackKey);
        const feedbackList = existingFeedback ? JSON.parse(existingFeedback) : [];
        feedbackList.push({
          user_id: studentId,
          user_name: studentName,
          message: feedbackMessage.trim(),
          message_type: "feedback",
          created_at: new Date().toISOString(),
        });
        localStorage.setItem(feedbackKey, JSON.stringify(feedbackList));

        toast({
          title: "✅ Feedback Saved Locally",
          description: "Your feedback will be sent when the connection is restored.",
          className: theme === 'dark' ? 'bg-yellow-900/80 border-yellow-700' : 'bg-yellow-50 border-yellow-200',
        });

        setFeedbackMessage("");
        onClose();
      } catch (localError) {
        toast({
          title: "Failed to Send Feedback",
          description: "Could not save your feedback. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`backdrop-blur-lg rounded-2xl shadow-2xl max-w-md ${
        theme === 'dark'
          ? 'bg-slate-900/90 border border-red-500/20'
          : 'bg-white/90 border border-gray-200/50'
      }`}>
        <DialogHeader>
          <DialogTitle className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
            Send Feedback
          </DialogTitle>
          <DialogDescription className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
            Share your feedback with the campus safety team
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className={`flex items-start gap-3 p-3 rounded-lg border ${
            theme === 'dark'
              ? 'bg-blue-900/30 border-blue-500/30'
              : 'bg-blue-50/60 border-blue-200/50'
          }`}>
            <AlertCircle className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
              theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
            }`} />
            <p className={`text-sm ${
              theme === 'dark' ? 'text-blue-200' : 'text-blue-800'
            }`}>
              Your feedback will be sent securely to the campus safety team.
            </p>
          </div>

          <div className="space-y-2">
            <label className={`text-sm font-medium ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Your Feedback
            </label>
            <Textarea
              placeholder="Please share your feedback or concerns..."
              value={feedbackMessage}
              onChange={(e) => setFeedbackMessage(e.target.value)}
              className={`resize-none border ${
                theme === 'dark'
                  ? 'bg-slate-800 border-red-500/20 text-white placeholder:text-gray-500'
                  : 'bg-white border-gray-300/50 text-gray-900 placeholder:text-gray-500'
              }`}
              rows={5}
              disabled={isLoading}
            />
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className={theme === 'dark'
              ? 'bg-slate-800/60 border-red-500/30 hover:bg-slate-800/80 text-white'
              : 'bg-gray-100 border-gray-300/50 hover:bg-gray-200 text-gray-900'
            }
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !feedbackMessage.trim()}
            className={`gap-2 ${
              theme === 'dark'
                ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800'
                : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
            }`}
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send Feedback
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
