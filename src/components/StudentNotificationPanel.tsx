import { useState, useRef, useEffect } from 'react';
import { Bell, X, Trash2, CheckCircle2 } from 'lucide-react';

interface Broadcast {
  id: string;
  title: string;
  message: string;
  created_at: string;
  user_id?: string;
}

interface StudentNotificationPanelProps {
  notifications: Broadcast[];
  onDeleteNotification?: (id: string) => void;
  theme?: 'dark' | 'light';
  unreadCount?: number;
}

const StudentNotificationPanel = ({
  notifications = [],
  onDeleteNotification,
  theme = 'light',
  unreadCount = 0,
}: StudentNotificationPanelProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [readNotifications, setReadNotifications] = useState<Set<string>>(new Set());
  const panelRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Play notification sound
  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.log('Audio context not available');
    }
  };

  // Trigger vibration
  const triggerVibration = () => {
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }
  };

  // Play toast notification
  const showToast = (notification: Broadcast) => {
    playNotificationSound();
    triggerVibration();

    const toast = document.createElement('div');
    toast.className = `fixed top-20 right-4 z-[9999] animate-in slide-in-from-top fade-in duration-300 pointer-events-auto`;

    toast.innerHTML = `
      <div class="flex items-start gap-3 p-4 rounded-xl border backdrop-blur-2xl shadow-2xl w-96 max-w-[calc(100vw-2rem)]
        ${theme === 'dark' 
          ? 'bg-gradient-to-br from-purple-950/80 via-blue-950/70 to-slate-900/60 border-purple-500/40 shadow-purple-500/20' 
          : 'bg-gradient-to-br from-purple-100/90 via-blue-100/80 to-white/70 border-purple-300/60'
        }">
        <div class="flex-shrink-0 mt-1">
          <div class="flex items-center justify-center h-10 w-10 rounded-full 
            ${theme === 'dark' 
              ? 'bg-gradient-to-br from-purple-500 to-blue-500 shadow-lg shadow-purple-500/50' 
              : 'bg-gradient-to-br from-purple-500 to-blue-500 shadow-lg'
            }">
            <svg class="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5.951-1.429 5.951 1.429a1 1 0 001.169-1.409l-7-14z"/>
            </svg>
          </div>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-bold ${theme === 'dark' ? 'text-purple-200' : 'text-purple-900'}">
            New Message from Admin
          </p>
          <p class="text-sm font-semibold mt-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}">
            ${notification.title}
          </p>
          <p class="text-sm opacity-80 mt-1 line-clamp-2 ${theme === 'dark' ? 'text-purple-100' : 'text-purple-800'}">
            ${notification.message}
          </p>
        </div>
        <button class="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors">
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
    `;

    document.body.appendChild(toast);

    // Add click handler to close button
    toast.querySelector('button')?.addEventListener('click', () => {
      toast.remove();
    });

    setTimeout(() => {
      if (toast.parentElement) {
        toast.remove();
      }
    }, 5000);
  };

  // Show toast for new notifications
  useEffect(() => {
    notifications.forEach((notification) => {
      if (!readNotifications.has(notification.id)) {
        showToast(notification);
        setReadNotifications((prev) => new Set(prev).add(notification.id));
      }
    });
  }, [notifications]);

  const handleDeleteNotification = (id: string) => {
    onDeleteNotification?.(id);
  };

  const handleMarkAllAsRead = () => {
    setReadNotifications(new Set(notifications.map((n) => n.id)));
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const secondsAgo = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (secondsAgo < 60) return 'Just now';
    if (secondsAgo < 3600) return `${Math.floor(secondsAgo / 60)}m ago`;
    if (secondsAgo < 86400) return `${Math.floor(secondsAgo / 3600)}h ago`;
    if (secondsAgo < 604800) return `${Math.floor(secondsAgo / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const unread = notifications.filter((n) => !readNotifications.has(n.id)).length;

  return (
    <div ref={panelRef} className="relative">
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-lg transition-all duration-300 ${
          theme === 'dark'
            ? 'bg-slate-800/50 hover:bg-slate-700/70 border border-slate-600/50 hover:border-slate-500/70 text-blue-300 hover:text-blue-200'
            : 'bg-blue-100/50 hover:bg-blue-200/70 border border-blue-300/50 hover:border-blue-400/70 text-blue-600 hover:text-blue-700'
        }`}
        title="Notifications"
      >
        <Bell className="h-5 w-5" />

        {/* Unread Indicator Dot */}
        {unread > 0 && (
          <span className={`absolute top-1 right-1 h-3 w-3 rounded-full animate-pulse ${
            theme === 'dark'
              ? 'bg-red-500 shadow-lg shadow-red-500/50'
              : 'bg-red-500 shadow-lg shadow-red-500/30'
          }`} />
        )}

        {/* Unread Count Badge */}
        {unread > 0 && (
          <span className={`absolute -top-2 -right-2 h-5 w-5 rounded-full text-xs font-bold flex items-center justify-center ${
            theme === 'dark'
              ? 'bg-red-600 text-white shadow-lg'
              : 'bg-red-500 text-white shadow-lg'
          }`}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Notification Panel Drawer */}
      <div
        className={`fixed right-0 top-0 h-screen w-full max-w-md z-[9998] transition-all duration-300 ease-out pointer-events-none ${
          isOpen ? 'pointer-events-auto' : ''
        }`}
      >
        {/* Backdrop */}
        {isOpen && (
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setIsOpen(false)}
          />
        )}

        {/* Panel */}
        <div
          className={`relative h-full w-full max-w-md ml-auto flex flex-col shadow-2xl transition-transform duration-300 ease-out transform pointer-events-auto ${
            isOpen ? 'translate-x-0' : 'translate-x-full'
          } ${
            theme === 'dark'
              ? 'bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-slate-950/95 border-l border-slate-700/50'
              : 'bg-gradient-to-b from-white/95 via-blue-50/90 to-white/85 border-l border-blue-200/40'
          }`}
        >
          {/* Header */}
          <div className={`flex items-center justify-between p-5 border-b ${
            theme === 'dark'
              ? 'border-slate-700/30 bg-slate-900/50'
              : 'border-blue-200/30 bg-white/40'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                theme === 'dark'
                  ? 'bg-gradient-to-br from-blue-600 to-purple-600'
                  : 'bg-gradient-to-br from-blue-500 to-purple-500'
              }`}>
                <Bell className="h-4 w-4 text-white" />
              </div>
              <h2 className={`text-lg font-bold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Notifications
              </h2>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className={`p-1.5 rounded-lg transition-colors ${
                theme === 'dark'
                  ? 'hover:bg-slate-800/70 text-slate-400 hover:text-white'
                  : 'hover:bg-blue-100/70 text-gray-500 hover:text-gray-900'
              }`}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                <div className={`h-14 w-14 rounded-full flex items-center justify-center mb-3 ${
                  theme === 'dark'
                    ? 'bg-slate-800/50'
                    : 'bg-blue-100/50'
                }`}>
                  <Bell className={`h-6 w-6 ${
                    theme === 'dark' ? 'text-slate-600' : 'text-blue-400'
                  }`} />
                </div>
                <p className={`text-sm font-medium mb-1 ${
                  theme === 'dark' ? 'text-slate-400' : 'text-gray-600'
                }`}>
                  No notifications yet
                </p>
                <p className={`text-xs ${
                  theme === 'dark' ? 'text-slate-500' : 'text-gray-500'
                }`}>
                  Admin messages will appear here
                </p>
              </div>
            ) : (
              <div className="space-y-2 p-4">
                {notifications.map((notification, index) => {
                  const isUnread = !readNotifications.has(notification.id);
                  return (
                    <div
                      key={notification.id}
                      className={`group relative p-4 rounded-xl border backdrop-blur-2xl transition-all duration-300 hover:scale-105 ${
                        isUnread ? 'animate-pulse' : ''
                      } ${
                        theme === 'dark'
                          ? 'bg-gradient-to-br from-slate-800/60 via-slate-700/40 to-slate-800/60 border-purple-500/30 hover:border-purple-500/60 hover:shadow-lg hover:shadow-purple-500/20'
                          : 'bg-gradient-to-br from-blue-50/60 via-white/40 to-blue-50/60 border-blue-300/40 hover:border-blue-400/70 hover:shadow-lg hover:shadow-blue-300/20'
                      }`}
                      style={{
                        animation: isUnread && index === 0 ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) 3' : 'none'
                      }}
                    >
                      {/* Unread Indicator */}
                      {isUnread && (
                        <div className={`absolute top-0 left-0 w-1 h-full rounded-l-xl ${
                          theme === 'dark'
                            ? 'bg-gradient-to-b from-blue-500 to-purple-500'
                            : 'bg-gradient-to-b from-blue-500 to-purple-500'
                        }`} />
                      )}

                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div className={`flex-shrink-0 h-10 w-10 rounded-lg flex items-center justify-center ${
                          theme === 'dark'
                            ? 'bg-gradient-to-br from-blue-600/80 to-purple-600/80'
                            : 'bg-gradient-to-br from-blue-500/80 to-purple-500/80'
                        }`}>
                          <Bell className="h-5 w-5 text-white" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h3 className={`font-bold text-sm truncate ${
                                theme === 'dark' ? 'text-white' : 'text-gray-900'
                              }`}>
                                {notification.title}
                              </h3>
                              <p className={`text-xs mt-1 line-clamp-2 ${
                                theme === 'dark'
                                  ? 'text-slate-300'
                                  : 'text-gray-700'
                              }`}>
                                {notification.message}
                              </p>
                            </div>
                            {isUnread && (
                              <div className={`h-2 w-2 rounded-full flex-shrink-0 mt-2 ${
                                theme === 'dark'
                                  ? 'bg-blue-400'
                                  : 'bg-blue-500'
                              }`} />
                            )}
                          </div>

                          {/* Footer with time and badge */}
                          <div className="flex items-center justify-between mt-3 pt-2 border-t border-current/10">
                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                                theme === 'dark'
                                  ? 'bg-blue-500/30 text-blue-200'
                                  : 'bg-blue-200/60 text-blue-700'
                              }`}>
                                Admin
                              </span>
                              <time className={`text-xs ${
                                theme === 'dark'
                                  ? 'text-slate-400'
                                  : 'text-gray-600'
                              }`}>
                                {formatTime(notification.created_at)}
                              </time>
                            </div>
                            <button
                              onClick={() => handleDeleteNotification(notification.id)}
                              className={`p-1 rounded transition-colors opacity-0 group-hover:opacity-100 ${
                                theme === 'dark'
                                  ? 'hover:bg-red-500/20 text-red-400 hover:text-red-300'
                                  : 'hover:bg-red-100 text-red-500 hover:text-red-600'
                              }`}
                              title="Delete notification"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && unread > 0 && (
            <div className={`border-t p-4 flex gap-2 ${
              theme === 'dark'
                ? 'border-slate-700/30 bg-slate-900/50'
                : 'border-blue-200/30 bg-white/40'
            }`}>
              <button
                onClick={handleMarkAllAsRead}
                className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                  theme === 'dark'
                    ? 'bg-blue-600/80 hover:bg-blue-600 text-white hover:shadow-lg hover:shadow-blue-500/30'
                    : 'bg-blue-500/80 hover:bg-blue-600 text-white hover:shadow-lg hover:shadow-blue-300/30'
                }`}
              >
                <CheckCircle2 className="h-4 w-4" />
                Mark all as read
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
};

export default StudentNotificationPanel;
