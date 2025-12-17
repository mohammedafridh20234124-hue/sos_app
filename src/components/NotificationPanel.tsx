import React, { useState, useEffect } from 'react';
import { Bell, X, CheckCheck } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import './NotificationPanel.css';

export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: Date | string;
  read?: boolean;
  sender?: string;
  role?: string;
  isNew?: boolean;
}

interface NotificationPanelProps {
  notifications?: Notification[];
  onDeleteNotification?: (id: string) => void;
  onMarkAllAsRead?: () => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({
  notifications = [],
  onDeleteNotification,
  onMarkAllAsRead,
}) => {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [displayNotifications, setDisplayNotifications] = useState<Notification[]>(notifications);
  const [unreadCount, setUnreadCount] = useState(0);
  const [newNotificationId, setNewNotificationId] = useState<string | null>(null);
  const audioContextRef = React.useRef<AudioContext | null>(null);

  useEffect(() => {
    setDisplayNotifications(notifications);
    setUnreadCount(notifications.filter(n => !n.read).length);

    // Add pulse to first (newest) notification
    if (notifications.length > 0) {
      setNewNotificationId(notifications[0].id);
      playNotificationAlert();
      
      setTimeout(() => setNewNotificationId(null), 3000);
    }
  }, [notifications]);

  // Play notification sound and vibration
  const playNotificationAlert = () => {
    // Vibration API
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }

    // Sound notification
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const ctx = audioContextRef.current;
      const now = ctx.currentTime;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      
      osc.start(now);
      osc.stop(now + 0.3);
    } catch (error) {
      console.warn('Audio notification failed:', error);
    }
  };

  const handleDelete = (id: string) => {
    setDisplayNotifications((prev) => prev.filter((n) => n.id !== id));
    onDeleteNotification?.(id);
  };

  const handleMarkAllAsRead = () => {
    setUnreadCount(0);
    onMarkAllAsRead?.();
  };

  const formatTime = (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return dateObj.toLocaleDateString();
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.notification-container')) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <>
      {/* Notification Container */}
      <div className="notification-container">
        {/* Bell Icon Button */}
        <button
          className="notification-bell"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Notifications"
          title="View notifications"
        >
          <Bell className="notification-bell-icon" size={20} />
          {unreadCount > 0 && (
            <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
          )}
        </button>

        {/* Notification Panel */}
        <div className={`notification-drawer ${isOpen ? 'open' : ''}`}>
          {/* Header */}
          <div className="notification-header">
            <div className="notification-header-content">
              <h2>Notifications</h2>
              {unreadCount > 0 && (
                <span className="notification-count-badge">{unreadCount}</span>
              )}
            </div>
            <button
              className="notification-close-btn"
              onClick={() => setIsOpen(false)}
              aria-label="Close notifications"
            >
              <X size={20} />
            </button>
          </div>

          {/* Mark All as Read Button */}
          {unreadCount > 0 && (
            <div className="notification-toolbar">
              <button className="mark-all-read-btn" onClick={handleMarkAllAsRead}>
                <CheckCheck size={16} />
                Mark all as read
              </button>
            </div>
          )}

          {/* Notifications List */}
          <div className="notification-list">
            {displayNotifications.length === 0 ? (
              <div className="notification-empty-state">
                <Bell size={40} />
                <p>No notifications yet</p>
                <span>You're all caught up!</span>
              </div>
            ) : (
              displayNotifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`notification-card ${!notif.read ? 'unread' : ''} ${
                    newNotificationId === notif.id ? 'pulse' : ''
                  }`}
                >
                  {/* Card Icon */}
                  <div className="notification-card-icon">
                    <Bell size={16} />
                  </div>

                  {/* Card Content */}
                  <div className="notification-card-content">
                    <div className="notification-card-header">
                      <h3>{notif.title}</h3>
                      <button
                        className="notification-card-delete"
                        onClick={() => handleDelete(notif.id)}
                        aria-label="Delete notification"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <p className="notification-card-message">{notif.message}</p>
                    <div className="notification-card-footer">
                      {notif.role && (
                        <span className="notification-role-badge">{notif.role}</span>
                      )}
                      <span className="notification-timestamp">{formatTime(notif.timestamp)}</span>
                    </div>
                  </div>

                  {/* Unread Indicator */}
                  {!notif.read && <div className="notification-unread-indicator" />}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div className="notification-overlay" onClick={() => setIsOpen(false)} />
      )}
    </>
  );
};

export default NotificationPanel;
