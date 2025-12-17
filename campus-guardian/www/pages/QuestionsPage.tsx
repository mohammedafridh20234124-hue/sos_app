import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { MessageCircle, Send, Loader2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Message {
  id: string;
  type: 'question' | 'answer';
  content: string;
  timestamp: Date;
  isAI?: boolean;
}

const QuestionsPage = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // All SOS App related questions
  const quickQuestions = [
    "What is the purpose of this SOS app?",
    "How do I use the SOS button?",
    "What happens when I press the SOS button?",
    "Will the admin receive my location immediately?",
    "How accurate is the live location shared?",
    "How often does the app send photo/audio to the admin?",
    "Will the alarm sound automatically when SOS is activated?",
    "Do I need internet for SOS mode to work?",
    "Can I stop the SOS alert after pressing it?",
  ];

  const generateAIAnswer = async (question: string): Promise<string> => {
    // Simulate AI response generation
    const responses: Record<string, string> = {
      "What is the purpose of this SOS app?": "The Campus SOS app is designed to provide immediate emergency assistance to students. It enables you to quickly alert campus security to emergencies, share your real-time location, and send photos/audio/video evidence. The app ensures that help reaches you faster during critical situations on campus.",
      "How do I use the SOS button?": "Using the SOS button is simple: 1) Open the app and navigate to the Student Dashboard, 2) Click the large red SOS button in the center, 3) Confirm when prompted, 4) The app will automatically capture your location, photo, and audio recording, 5) Campus security will be notified immediately with your location coordinates.",
      "What happens when I press the SOS button?": "When you press the SOS button: 1) An alarm sound activates immediately, 2) Your real-time location is captured via GPS, 3) Your camera and microphone activate to record evidence, 4) All data (location, photo, audio, video) is transmitted to the admin dashboard, 5) Campus security receives an instant alert with your exact location on their map.",
      "Will the admin receive my location immediately?": "Yes! Your location is transmitted to the admin dashboard in real-time. The SOS system provides campus security with your exact GPS coordinates on an interactive map. Your location is continuously updated every 5 seconds as you move, allowing security personnel to track and reach you faster during emergencies.",
      "How accurate is the live location shared?": "The location accuracy depends on your device's GPS capabilities and environmental factors. Typical accuracy range is 5-30 meters in open areas. In urban/indoor environments, accuracy may be reduced. The app displays your location on a map visible to admin, and you can see your own location pin in real-time on your dashboard for verification.",
      "How often does the app send photo/audio to the admin?": "The app continuously captures and sends media during an active SOS alert: 1) Photos: Captured continuously from your camera and sent every few seconds, 2) Audio: Recording continuously during the alert, 3) Video: Streamed live to the admin dashboard, 4) All media is stored on the admin side for evidence and investigation purposes.",
      "Will the alarm sound automatically when SOS is activated?": "Yes! When you press the SOS button, an alarm sound activates automatically on your device. This serves to: 1) Alert people nearby that you need help, 2) Deter potential threats, 3) Signal to campus security that the alert is active. The alarm continues until you manually cancel the SOS alert or security personnel confirm response.",
      "Do I need internet for SOS mode to work?": "Internet (WiFi or mobile data) is strongly recommended for optimal functionality. The app performs best with: 1) Active internet connection for real-time location and media transmission, 2) GPS enabled for accurate location tracking, 3) Microphone and camera permissions granted. Without internet, the alarm will still sound, but location and media transmission may be delayed or unavailable.",
      "Can I stop the SOS alert after pressing it?": "Yes, you can stop the SOS alert. How to cancel: 1) Tap the 'Cancel SOS' button that appears after pressing SOS, 2) Confirm cancellation when prompted, 3) The alarm will stop, and recording will cease. Important: Only cancel if the emergency is resolved. Campus security may still dispatch if they've already received your alert, so inform them of the cancellation if you reach them.",
    };

    // Check if we have a response for this question
    for (const [key, value] of Object.entries(responses)) {
      if (question.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(question.toLowerCase())) {
        return value;
      }
    }

    // Default response if no match found
    return "Thank you for your question. Campus security is here to help. For urgent matters, please call 911 or use the emergency button. For other questions, contact campus security at 555-0100.";
  };

  const handleSendQuestion = async (text: string) => {
    if (!text.trim()) return;

    // Add user question
    const questionId = `q_${Date.now()}`;
    const newQuestion: Message = {
      id: questionId,
      type: 'question',
      content: text,
      timestamp: new Date(),
      isAI: false,
    };

    setMessages(prev => [...prev, newQuestion]);
    setInputValue('');
    setIsLoading(true);

    // Simulate AI thinking time (500-1000ms)
    await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 500));

    // Generate and add AI response
    const aiResponse = await generateAIAnswer(text);
    const answerId = `a_${Date.now()}`;
    const newAnswer: Message = {
      id: answerId,
      type: 'answer',
      content: aiResponse,
      timestamp: new Date(),
      isAI: true,
    };

    setMessages(prev => [...prev, newAnswer]);
    setIsLoading(false);
  };

  const handleQuickQuestion = (question: string) => {
    handleSendQuestion(question);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="hover:bg-blue-100"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Questions Panel */}
          <div className="lg:col-span-1">
            <Card className="border-blue-200 bg-white sticky top-4">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-blue-600" />
                  Quick Questions
                </CardTitle>
                <CardDescription>Click any question to get an answer</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {quickQuestions.map((q, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickQuestion(q)}
                    disabled={isLoading}
                    className="text-left h-auto py-3 px-3 justify-start text-xs hover:bg-blue-50 hover:border-blue-300 w-full"
                  >
                    <span className="line-clamp-2">{q}</span>
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-2">
            <Card className="border-blue-200 bg-white h-full flex flex-col">
              <CardHeader className="border-b border-gray-200">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-blue-600" />
                  Questions & Answers
                </CardTitle>
                <CardDescription>Get answers to your SOS app questions</CardDescription>
              </CardHeader>

              <CardContent className="flex-1 overflow-hidden flex flex-col p-0">
                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      <div className="text-center">
                        <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="text-sm font-medium">No messages yet</p>
                        <p className="text-xs mt-1">Ask a question or click one from the list</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.type === 'question' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-sm px-4 py-3 rounded-lg ${
                              msg.type === 'question'
                                ? 'bg-blue-500 text-white rounded-br-none'
                                : 'bg-gray-100 text-gray-900 rounded-bl-none'
                            }`}
                          >
                            <p className="text-sm">{msg.content}</p>
                            <p className="text-xs opacity-70 mt-2">
                              {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      ))}
                      {isLoading && (
                        <div className="flex justify-start">
                          <div className="bg-gray-100 text-gray-900 px-4 py-3 rounded-lg rounded-bl-none">
                            <div className="flex items-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span className="text-sm">Thinking...</span>
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>

                {/* Input Area */}
                <div className="border-t border-gray-200 p-4 space-y-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ask your question..."
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !isLoading) {
                          handleSendQuestion(inputValue);
                        }
                      }}
                      disabled={isLoading}
                      className="text-sm"
                    />
                    <Button
                      size="icon"
                      onClick={() => handleSendQuestion(inputValue)}
                      disabled={isLoading || !inputValue.trim()}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionsPage;
