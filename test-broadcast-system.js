// Test script to verify broadcast message system is working end-to-end
// Run this in the browser console on the Student Dashboard after admin sends a message

async function testBroadcastSystem() {
  console.log('🧪 Testing Broadcast System...\n');

  // Get the current user ID (from StudentDashboard context)
  const userElement = document.querySelector('[data-user-id]');
  const userId = userElement?.getAttribute('data-user-id') || 'unknown';
  
  console.log('📍 Current User ID:', userId);
  
  // Check localStorage for broadcast messages
  const broadcastKey = `broadcast_notifications_${userId}`;
  const localStorageBroadcasts = localStorage.getItem(broadcastKey);
  
  if (localStorageBroadcasts) {
    try {
      const broadcasts = JSON.parse(localStorageBroadcasts);
      console.log(`✅ Found ${broadcasts.length} broadcasts in localStorage:`, broadcasts);
    } catch (e) {
      console.log('❌ Error parsing localStorage broadcasts:', e);
    }
  } else {
    console.log('⚠️  No broadcasts in localStorage yet');
  }
  
  // Check page DOM for notification elements
  const notifications = document.querySelectorAll('[data-notification-id]');
  console.log(`📢 Found ${notifications.length} notification elements in DOM`);
  
  if (notifications.length > 0) {
    console.log('✅ Notifications are being displayed!');
    notifications.forEach((notif, idx) => {
      console.log(`  ${idx + 1}. ${notif.textContent.substring(0, 50)}...`);
    });
  } else {
    console.log('⚠️  No notification elements found in DOM');
  }
  
  // Check console for broadcast logs
  console.log('\n📋 Check console for these logs:');
  console.log('  ✅ "Fetched broadcasts from DB: X"');
  console.log('  ✅ "Successfully subscribed to broadcasts"');
  console.log('  ✅ "New broadcast received via subscription"');
  
  console.log('\n✨ Test complete!');
}

// Run the test
testBroadcastSystem();
