import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Shield, AlertTriangle } from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();

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
      <div className="relative z-10 max-w-4xl w-full">
        <div className="bg-white/95 backdrop-blur-sm rounded-xl p-8 shadow-2xl">
          <div className="text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          {/* Logo/Icon */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full"></div>
              <div className="relative bg-primary/10 p-6 rounded-full border-2 border-primary/20">
                <Shield className="w-16 h-16 text-primary" />
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                SOS Campus Security
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground font-medium">
              Instant Emergency Response for Campus Safety
            </p>
          </div>

          {/* Description */}
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Real-time emergency alert system connecting students with campus security through live location tracking and instant communication.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
            <Button
              size="lg"
              onClick={() => navigate("/auth?role=student")}
              className="w-full sm:w-auto text-lg px-8 py-6 bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Shield className="mr-2 h-5 w-5" />
              Login as Student
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/auth?role=admin")}
              className="w-full sm:w-auto text-lg px-8 py-6 border-2 hover:bg-accent/10 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <AlertTriangle className="mr-2 h-5 w-5" />
              Login as Admin
            </Button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12">
            <div className="p-6 rounded-lg bg-card border border-border/50 hover:border-primary/50 transition-colors">
              <div className="text-4xl mb-3">🚨</div>
              <h3 className="font-semibold mb-2">Instant Alerts</h3>
              <p className="text-sm text-muted-foreground">
                One-tap emergency activation sends immediate alerts to campus security
              </p>
            </div>
            <div className="p-6 rounded-lg bg-card border border-border/50 hover:border-primary/50 transition-colors">
              <div className="text-4xl mb-3">📍</div>
              <h3 className="font-semibold mb-2">Live Location</h3>
              <p className="text-sm text-muted-foreground">
                Real-time GPS tracking ensures security knows exactly where you are
              </p>
            </div>
            <div className="p-6 rounded-lg bg-card border border-border/50 hover:border-primary/50 transition-colors">
              <div className="text-4xl mb-3">⚡</div>
              <h3 className="font-semibold mb-2">Fast Response</h3>
              <p className="text-sm text-muted-foreground">
                Immediate notification to security personnel for rapid assistance
              </p>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;