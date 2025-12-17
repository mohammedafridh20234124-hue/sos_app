import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { LogOut, BarChart3, Users, MessageSquare, Settings, Bell } from "lucide-react";

const AdminLogin = () => {
  const { login, isLoading } = useAdminAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const success = await login(email, password);
      if (success) {
        navigate("/admin/dashboard");
      } else {
        setError("Invalid admin credentials");
      }
    } catch (err) {
      setError("Login failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="bg-slate-800 border-slate-700 text-white">
          <CardHeader className="text-center">
            <div className="text-4xl mb-3">🔐</div>
            <CardTitle className="text-2xl">Admin Portal</CardTitle>
            <CardDescription className="text-slate-300">Secure Administrator Access</CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <div className="mb-4 p-3 bg-red-500/20 text-red-300 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Admin Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@campussecurity.com"
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isLoading ? "Logging in..." : "Login to Admin Panel"}
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-700">
              <p className="text-xs text-slate-400 text-center mb-3">Admin Features:</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <BarChart3 size={16} />
                  <span>Dashboard</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <MessageSquare size={16} />
                  <span>Broadcasts</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Users size={16} />
                  <span>Users</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Bell size={16} />
                  <span>Alerts</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-4 text-center text-slate-400 text-sm">
          <p>🛡️ Admin System - Authorized Access Only</p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
