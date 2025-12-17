import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { LogOut, Send, Trash2, Eye } from "lucide-react";

interface Broadcast {
  id: string;
  title: string;
  message: string;
  created_at: string;
  target_students: number;
}

const AdminDashboard = () => {
  const { logout, admin } = useAdminAuth();
  const navigate = useNavigate();
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!admin) {
      navigate("/admin/login");
    }
    fetchBroadcasts();
  }, [admin, navigate]);

  const fetchBroadcasts = async () => {
    try {
      const response = await fetch("/api/admin/broadcast/list.php");
      const data = await response.json();
      if (data.status === "success") {
        setBroadcasts(data.broadcasts);
      }
    } catch (error) {
      console.error("Failed to fetch broadcasts:", error);
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/broadcast/create.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, message }),
      });

      const data = await response.json();
      if (data.status === "success") {
        setTitle("");
        setMessage("");
        fetchBroadcasts();
        alert("Broadcast sent successfully!");
      }
    } catch (error) {
      alert("Failed to send broadcast");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBroadcast = async (id: string) => {
    if (!confirm("Delete this broadcast?")) return;

    try {
      await fetch(`/api/admin/broadcast/delete.php?id=${id}`, {
        method: "DELETE",
      });
      fetchBroadcasts();
    } catch (error) {
      alert("Failed to delete broadcast");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-slate-400 text-sm">Welcome, {admin?.email}</p>
          </div>
          <Button variant="outline" onClick={handleLogout} className="gap-2">
            <LogOut size={18} />
            Logout
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Create Broadcast Section */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle>Send Broadcast Message</CardTitle>
            <CardDescription>Send important messages to all students</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSendBroadcast} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Broadcast title"
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter your message"
                  rows={4}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700 gap-2"
              >
                <Send size={18} />
                {isLoading ? "Sending..." : "Send to All Students"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Broadcasts List */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle>Sent Broadcasts</CardTitle>
            <CardDescription>{broadcasts.length} messages sent</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {broadcasts.length === 0 ? (
                <p className="text-slate-400 text-center py-8">No broadcasts sent yet</p>
              ) : (
                broadcasts.map((bc) => (
                  <div key={bc.id} className="bg-slate-700/50 p-4 rounded-lg border border-slate-600 flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold">{bc.title}</h3>
                      <p className="text-sm text-slate-300 mt-1">{bc.message}</p>
                      <p className="text-xs text-slate-400 mt-2">
                        📤 {bc.target_students} students • {new Date(bc.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteBroadcast(bc.id)}
                      className="ml-4 p-2 hover:bg-red-600/20 rounded-lg transition"
                    >
                      <Trash2 size={18} className="text-red-400" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
