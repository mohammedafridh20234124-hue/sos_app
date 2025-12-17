/*
============================================
NOTIFICATION PANEL - INTEGRATION EXAMPLES
============================================

This file contains 10 code examples for integrating the NotificationPanel component.
Each example shows a different use case and pattern.

⚠️ NOTE: These are TypeScript/code examples. For full JSX components, see:
- src/pages/NotificationPanelDemo.tsx
- src/pages/StudentDashboard.tsx
*/

// ============================================
// Example 1: Basic Setup in StudentDashboard
// ============================================

/*
Step 1: Import the component
-----------
import NotificationPanel, { Notification } from '@/components/NotificationPanel';
import { useState } from 'react';

Step 2: Add state for notifications
-----------
const [notifications, setNotifications] = useState<Notification[]>([]);

Step 3: Create handlers
-----------
const handleDelete = (id: string) => {
  setNotifications((prev) => prev.filter((n) => n.id !== id));
};

const handleMarkAllAsRead = () => {
  setNotifications((prev) =>
    prev.map((n) => ({ ...n, read: true }))
  );
};

Step 4: Add new notification function
-----------
const addNotification = (title: string, message: string) => {
  const newNotif: Notification = {
    id: Date.now().toString(),
    title,
    message,
    timestamp: new Date(),
    read: false,
    role: 'Admin',
  };
  setNotifications((prev) => [newNotif, ...prev].slice(0, 50));
};

Step 5: Render component (in JSX)
-----------
<NotificationPanel
  notifications={notifications}
  onDeleteNotification={handleDelete}
  onMarkAllAsRead={handleMarkAllAsRead}
/>

Result: ✅ Sound and vibration play automatically!
*/

// ============================================
// Example 2: Real-time Integration with Supabase
// ============================================

/*
Subscribe to admin_messages table for real-time notifications:

const { useEffect, useState } = require('react');
const { supabase } = require('@/integrations/supabase/client');
const { Notification } = require('@/components/NotificationPanel');

Code:
-----------
useEffect(() => {
  // Fetch existing notifications
  const fetchNotifications = async () => {
    const { data } = await supabase
      .from('admin_messages')
      .select('*')
      .eq('recipient_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (data) {
      const notifs = data.map((msg: any) => ({
        id: msg.id,
        title: msg.title,
        message: msg.message,
        timestamp: new Date(msg.created_at),
        read: msg.read || false,
        role: 'Admin',
      }));
      setNotifications(notifs);
    }
  };

  // Subscribe to new messages
  const channel = supabase
    .channel('admin_messages')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'admin_messages',
      },
      (payload) => {
        const newMsg = payload.new as any;
        const notif: Notification = {
          id: newMsg.id,
          title: newMsg.title,
          message: newMsg.message,
          timestamp: new Date(newMsg.created_at),
          read: false,
          role: 'Admin',
        };
        setNotifications((prev) => [notif, ...prev].slice(0, 50));
      }
    )
    .subscribe();

  fetchNotifications();

  return () => channel.unsubscribe();
}, [user.id]);

Benefits:
- Real-time updates via Supabase
- Automatic sound/vibration on new messages
- Persistent storage
*/

// ============================================
// Example 3: Emergency Alert Notifications
// ============================================

/*
Create different types of emergency notifications:

Code:
-----------
type EmergencyType = 'fire' | 'medical' | 'security' | 'weather';

const createEmergencyNotification = (type: EmergencyType) => {
  const alerts = {
    fire: {
      title: '🔥 Fire Alert',
      message: 'Fire emergency detected. Evacuate immediately!',
    },
    medical: {
      title: '🏥 Medical Emergency',
      message: 'Medical emergency reported. Help is on the way.',
    },
    security: {
      title: '🚔 Security Alert',
      message: 'Security incident reported. Stay in safe location.',
    },
    weather: {
      title: '⛈️ Weather Alert',
      message: 'Severe weather warning. Move to shelter immediately.',
    },
  };

  const alert = alerts[type];
  return {
    id: Date.now().toString(),
    title: alert.title,
    message: alert.message,
    timestamp: new Date(),
    read: false,
    role: '🚨 EMERGENCY',
  };
};

Usage:
-----------
const fireAlert = createEmergencyNotification('fire');
setNotifications((prev) => [fireAlert, ...prev]);

Effect: Sound plays immediately + vibration feedback
*/

// ============================================
// Example 4: Notification Categories with Filtering
// ============================================

/*
Filter notifications by category:

Type definition:
-----------
type NotificationCategory = 'all' | 'admin' | 'emergency' | 'system';

Filter function:
-----------
const filterNotifications = (
  notifications: Notification[],
  category: NotificationCategory
) => {
  if (category === 'all') return notifications;
  if (category === 'admin') {
    return notifications.filter((n) => n.role === 'Admin');
  }
  if (category === 'emergency') {
    return notifications.filter((n) => n.role?.includes('EMERGENCY'));
  }
  if (category === 'system') {
    return notifications.filter((n) => n.role === 'System');
  }
  return notifications;
};

State management:
-----------
const [filter, setFilter] = useState<NotificationCategory>('all');
const filtered = filterNotifications(notifications, filter);

Then pass filtered array to NotificationPanel:
<NotificationPanel notifications={filtered} />

Render filter buttons:
-----------
<button onClick={() => setFilter('all')}>All</button>
<button onClick={() => setFilter('admin')}>Admin</button>
<button onClick={() => setFilter('emergency')}>Emergency</button>
<button onClick={() => setFilter('system')}>System</button>
*/

// ============================================
// Example 5: Notification Persistence
// ============================================

/*
Save and load notifications from localStorage:

Load on component mount:
-----------
const [notifications, setNotifications] = useState<Notification[]>(() => {
  const saved = localStorage.getItem('student_notifications');
  return saved ? JSON.parse(saved) : [];
});

Save when notifications change:
-----------
useEffect(() => {
  localStorage.setItem('student_notifications', JSON.stringify(notifications));
}, [notifications]);

Clear storage when needed:
-----------
const clearNotifications = () => {
  setNotifications([]);
  localStorage.removeItem('student_notifications');
};

Benefits:
- Notifications persist across page refreshes
- Offline access to notification history
- No backend calls needed for storage
*/

// ============================================
// Example 6: Auto-cleanup Old Notifications
// ============================================

/*
Automatically remove notifications older than 24 hours:

Setup with useEffect:
-----------
const NOTIFICATION_TTL = 24 * 60 * 60 * 1000; // 24 hours

useEffect(() => {
  const interval = setInterval(() => {
    const now = Date.now();
    setNotifications((prev) =>
      prev.filter((n) => {
        const notifTime = new Date(n.timestamp).getTime();
        return now - notifTime < NOTIFICATION_TTL;
      })
    );
  }, 60000); // Check every minute

  return () => clearInterval(interval);
}, []);

Customization:
-----------
// Change TTL
const NOTIFICATION_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

// Change check interval
// 300000 = 5 minutes
// 60000 = 1 minute
// 10000 = 10 seconds
setInterval(cleanupFunc, 300000);

Benefits:
- Prevents notification list from growing infinitely
- Automatic memory management
- Optional manual cleanup button
*/

// ============================================
// Example 7: Custom Sound Notifications
// ============================================

/*
Customize the notification sound frequency, duration, and volume:

In NotificationPanel.tsx, modify playNotificationAlert():
-----------

// Current default settings:
osc.frequency.setValueAtTime(800, now);        // Frequency: 800 Hz
gain.gain.setValueAtTime(0.3, now);            // Volume: 0.3 (0-1 range)
gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3); // Duration: 300ms

Custom sound examples:
-----------

// High-pitched alert (urgent)
osc.frequency.setValueAtTime(1200, now);

// Low tone (calm)
osc.frequency.setValueAtTime(400, now);

// Very quiet (subtle)
gain.gain.setValueAtTime(0.1, now);

// Very loud (alarm)
gain.gain.setValueAtTime(0.8, now);

// Short beep
osc.frequency.setValueAtTime(800, now);
gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1); // 100ms

// Long notification
osc.frequency.setValueAtTime(800, now);
gain.gain.exponentialRampToValueAtTime(0.01, now + 1.0); // 1000ms

Frequency reference:
-----------
C4: 262 Hz
E4: 330 Hz
G4: 392 Hz
C5: 523 Hz
E5: 659 Hz
G5: 784 Hz (high, urgent)
A5: 880 Hz (very high, alarm)

Volume reference:
-----------
0.1: Very quiet, subtle
0.3: Moderate (default)
0.5: Noticeable
0.8: Loud
1.0: Maximum volume (may distort)
*/

// ============================================
// Example 8: Notification Factory Pattern
// ============================================

/*
Create different notification types programmatically:

Type definition:
-----------
type NotificationType = 'alert' | 'message' | 'update' | 'achievement';

Factory function:
-----------
const createNotification = (
  type: NotificationType,
  title: string,
  message: string
) => {
  const roleMap = {
    alert: '⚠️ Alert',
    message: '💬 Message',
    update: '📦 Update',
    achievement: '🏆 Achievement',
  };

  return {
    id: Date.now().toString(),
    title,
    message,
    timestamp: new Date(),
    read: false,
    role: roleMap[type],
  };
};

Usage examples:
-----------
const alert = createNotification('alert', 'Security', 'Intrusion detected');
const msg = createNotification('message', 'Admin', 'Check new guidelines');
const update = createNotification('update', 'App', 'Version 2.0 released');
const achievement = createNotification('achievement', 'Badge', 'Completed training');

setNotifications((prev) => [alert, ...prev]);
*/

// ============================================
// Example 9: Testing with Mock Data
// ============================================

/*
Generate mock notifications for testing:

Simple function:
-----------
const getMockNotifications = (count: number = 5) => {
  const titles = [
    'Campus Safety Update',
    'New Alert',
    'Location Verified',
    'Message from Admin',
    'System Notification',
  ];

  const messages = [
    'Your location has been updated',
    'Please check the latest announcements',
    'Emergency drill scheduled for tomorrow',
    'Thank you for using the safety system',
    'Your feedback has been received',
  ];

  return Array.from({ length: count }, (_, i) => ({
    id: `mock-${i}`,
    title: titles[i % titles.length],
    message: messages[i % messages.length],
    timestamp: new Date(Date.now() - i * 5 * 60000),
    read: i > 2,
    role: 'Admin',
  }));
};

Usage in testing:
-----------
const mockNotifications = getMockNotifications(10);
setNotifications(mockNotifications);
*/

// ============================================
// Example 10: State Management Integration
// ============================================

/*
If using Redux or other state management systems:

Redux pattern with hooks:
-----------
// Dispatch actions
const dispatch = useDispatch();
const notifications = useSelector((state) => state.notifications);

// Add notification
dispatch(addNotification({
  id: Date.now().toString(),
  title: 'Test',
  message: 'Test message',
  timestamp: new Date(),
  read: false,
  role: 'Admin',
}));

// Delete notification
dispatch(deleteNotification(notificationId));

// Mark all as read
dispatch(markAllAsRead());

Zustand pattern with hooks:
-----------
const { notifications, addNotification, deleteNotification } =
  useNotificationStore();

return (
  <NotificationPanel
    notifications={notifications}
    onDeleteNotification={deleteNotification}
    onMarkAllAsRead={() => {
      useNotificationStore.setState({
        notifications: notifications.map((n) => ({ ...n, read: true })),
      });
    }}
  />
);
*/

// ============================================
// SUMMARY & NEXT STEPS
// ============================================

/*
Integration patterns provided:
1. Basic setup in StudentDashboard
2. Supabase real-time notifications
3. Emergency alert notifications
4. Category filtering
5. Local storage persistence
6. Auto-cleanup old notifications
7. Custom sound notifications
8. Notification factory pattern
9. Mock data for testing
10. State management integration

For full JSX examples, see:
- src/pages/StudentDashboard.tsx
- src/pages/NotificationPanelDemo.tsx

For documentation:
- NOTIFICATION_PANEL_GUIDE.md
- NOTIFICATION_PANEL_QUICK_START.md
- NOTIFICATION_VISUAL_REFERENCE.md
*/
