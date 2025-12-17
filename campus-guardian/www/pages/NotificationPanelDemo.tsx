import React, { useState } from 'react';
import NotificationPanel, { Notification } from '@/components/NotificationPanel';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

const NotificationPanelDemo: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'Emergency Alert',
      message: 'Campus emergency response activated. Stay safe and follow instructions.',
      timestamp: new Date(Date.now() - 5 * 60000),
      read: false,
      role: 'Admin',
    },
    {
      id: '2',
      title: 'Location Check-in',
      message: 'Your location has been updated and shared with the safety team.',
      timestamp: new Date(Date.now() - 15 * 60000),
      read: true,
      role: 'Admin',
    },
    {
      id: '3',
      title: 'System Update',
      message: 'Campus Safety System has been updated with new features.',
      timestamp: new Date(Date.now() - 2 * 3600000),
      read: false,
      role: 'Admin',
    },
  ]);

  const addNotification = () => {
    const messages = [
      { title: 'New Alert', message: 'A new emergency alert has been issued.' },
      { title: 'Update Available', message: 'The app has been updated with latest security features.' },
      { title: 'User Help', message: 'Need help? Contact campus safety at extension 2911.' },
      { title: 'Location Shared', message: 'Your location is being shared with the safety team.' },
      { title: 'Response Confirmed', message: 'Your emergency response has been confirmed.' },
    ];

    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    const newNotif: Notification = {
      id: Date.now().toString(),
      ...randomMessage,
      timestamp: new Date(),
      read: false,
      role: 'Admin',
    };

    setNotifications((prev) => [newNotif, ...prev]);
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        theme === 'dark' ? 'bg-slate-950' : 'bg-gray-50'
      } p-8`}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold mb-2">Notification Panel Demo</h1>
            <p className={`${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}>
              Modern notification system with glassmorphism and smooth animations
            </p>
          </div>
          <Button onClick={toggleTheme} variant="outline">
            {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
          </Button>
        </div>

        {/* Demo Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Controls */}
          <div
            className={`lg:col-span-1 ${
              theme === 'dark'
                ? 'bg-slate-900 border border-slate-700'
                : 'bg-white border border-gray-200'
            } rounded-lg p-6`}
          >
            <h2 className="text-xl font-bold mb-6">Controls</h2>

            <div className="space-y-4">
              <Button
                onClick={addNotification}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <Plus size={18} />
                Add Notification
              </Button>

              <Button
                onClick={markAllAsRead}
                variant="outline"
                className="w-full"
              >
                Mark All as Read
              </Button>

              <div
                className={`p-4 rounded-lg ${
                  theme === 'dark'
                    ? 'bg-slate-800 border border-slate-700'
                    : 'bg-gray-100 border border-gray-200'
                }`}
              >
                <p className="text-sm font-semibold mb-2">Features:</p>
                <ul className="text-sm space-y-1">
                  <li>✅ Sound alert on new notification</li>
                  <li>✅ Vibration feedback</li>
                  <li>✅ 3-second pulse highlight</li>
                  <li>✅ Unread badge with count</li>
                  <li>✅ Smooth slide-in animation</li>
                  <li>✅ Glassmorphic cards</li>
                  <li>✅ Hover effects & animations</li>
                  <li>✅ Delete individual notifications</li>
                  <li>✅ Mark all as read</li>
                  <li>✅ Responsive design</li>
                </ul>
              </div>

              <div
                className={`p-4 rounded-lg ${
                  theme === 'dark'
                    ? 'bg-slate-800 border border-slate-700'
                    : 'bg-gray-100 border border-gray-200'
                }`}
              >
                <p className="text-sm font-semibold mb-2">Total Notifications:</p>
                <p className="text-2xl font-bold text-blue-500">
                  {notifications.length}
                </p>
                <p className="text-xs mt-2">
                  Unread: {notifications.filter((n) => !n.read).length}
                </p>
              </div>
            </div>
          </div>

          {/* Right Column - Notification Panel Preview */}
          <div className="lg:col-span-2">
            <div
              className={`${
                theme === 'dark'
                  ? 'bg-slate-900 border border-slate-700'
                  : 'bg-white border border-gray-200'
              } rounded-lg p-6 min-h-screen relative`}
            >
              <h2 className="text-xl font-bold mb-6">Notification Panel</h2>
              <p
                className={`text-sm mb-6 ${
                  theme === 'dark' ? 'text-slate-400' : 'text-gray-600'
                }`}
              >
                Click the bell icon in the top right to open the notification drawer.
                The panel demonstrates:
              </p>
              <ul
                className={`text-sm space-y-2 mb-8 ${
                  theme === 'dark' ? 'text-slate-300' : 'text-gray-700'
                }`}
              >
                <li>• <strong>Right-side drawer</strong> that slides in smoothly</li>
                <li>• <strong>Glassmorphic UI</strong> with frosted background</li>
                <li>• <strong>Unread indicator</strong> on bell icon (red dot)</li>
                <li>• <strong>Notification count</strong> badge</li>
                <li>• <strong>Scrollable list</strong> with max-height constraint</li>
                <li>• <strong>Individual delete</strong> buttons (X icon)</li>
                <li>• <strong>Role badges</strong> (Admin label)</li>
                <li>• <strong>Timestamps</strong> showing relative time</li>
                <li>• <strong>Hover animations</strong> - cards lift up with glow</li>
                <li>• <strong>Pulse effect</strong> on new notifications (3 seconds)</li>
              </ul>

              {/* Notification Panel Component */}
              <div className="relative inline-block">
                <NotificationPanel
                  notifications={notifications}
                  onDeleteNotification={deleteNotification}
                  onMarkAllAsRead={markAllAsRead}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard
            title="Sound & Vibration"
            description="Audio notification and device vibration on new messages"
            icon="🔔"
            theme={theme}
          />
          <FeatureCard
            title="Glassmorphic Design"
            description="Modern frosted glass effect with blur and transparency"
            icon="🎨"
            theme={theme}
          />
          <FeatureCard
            title="Smooth Animations"
            description="Slide-in drawer, hover lift, and pulse effects"
            icon="✨"
            theme={theme}
          />
          <FeatureCard
            title="Responsive Layout"
            description="Works seamlessly on mobile, tablet, and desktop"
            icon="📱"
            theme={theme}
          />
          <FeatureCard
            title="Unread Management"
            description="See unread count and mark all as read button"
            icon="📊"
            theme={theme}
          />
          <FeatureCard
            title="Easy Integration"
            description="Simple props-based API for easy integration"
            icon="⚙️"
            theme={theme}
          />
        </div>
      </div>
    </div>
  );
};

interface FeatureCardProps {
  title: string;
  description: string;
  icon: string;
  theme: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, description, icon, theme }) => (
  <div
    className={`p-6 rounded-lg border transition-all hover:scale-105 hover:shadow-lg ${
      theme === 'dark'
        ? 'bg-slate-900 border-slate-700 hover:border-blue-500/50'
        : 'bg-white border-gray-200 hover:border-blue-400/50'
    }`}
  >
    <div className="text-4xl mb-3">{icon}</div>
    <h3 className="font-bold mb-2">{title}</h3>
    <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}>
      {description}
    </p>
  </div>
);

export default NotificationPanelDemo;
