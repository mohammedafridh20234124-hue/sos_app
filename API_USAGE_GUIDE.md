# 📡 Notifications API Endpoint - Usage Guide

## Overview
The `api/notifications.php` file provides a REST API to fetch notifications from your MySQL database.

---

## Base URL
```
http://localhost/api/notifications.php
```

---

## Available Actions

### 1. Get ALL Notifications
**Endpoint:**
```
GET http://localhost/api/notifications.php?action=all
```

**Description:** Fetches all notifications from the database, sorted by newest first.

**Response:**
```json
{
  "success": true,
  "message": "All notifications fetched successfully",
  "count": 5,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "user_id": "550e8400-e29b-41d4-a716-446655440001",
      "title": "Fire Drill",
      "message": "Fire drill at 2 PM",
      "type": "broadcast",
      "created_at": "2025-12-09 15:30:00",
      "read": false,
      "read_at": null
    }
  ]
}
```

---

### 2. Get BROADCAST Notifications Only
**Endpoint:**
```
GET http://localhost/api/notifications.php?action=broadcast
```

**Description:** Fetches only broadcast type notifications (admin messages to all students).

**Response:**
```json
{
  "success": true,
  "message": "Broadcast notifications fetched successfully",
  "count": 3,
  "data": [...]
}
```

---

### 3. Get Notifications for a Specific User
**Endpoint:**
```
GET http://localhost/api/notifications.php?action=by_user&user_id=USER_UUID
```

**Example:**
```
GET http://localhost/api/notifications.php?action=by_user&user_id=550e8400-e29b-41d4-a716-446655440001
```

**Description:** Fetches all notifications for a specific student.

**Parameters:**
- `user_id` (required) - UUID of the user

**Response:**
```json
{
  "success": true,
  "message": "Notifications for user 550e8400-e29b-41d4-a716-446655440001 fetched successfully",
  "count": 2,
  "data": [...]
}
```

---

### 4. Get Notifications by Type
**Endpoint:**
```
GET http://localhost/api/notifications.php?action=by_type&type=TYPE
```

**Example:**
```
GET http://localhost/api/notifications.php?action=by_type&type=broadcast
```

**Description:** Fetches notifications of a specific type.

**Parameters:**
- `type` (required) - Type of notification (broadcast, alert, info, warning)

**Response:**
```json
{
  "success": true,
  "message": "Notifications of type 'broadcast' fetched successfully",
  "count": 4,
  "data": [...]
}
```

---

### 5. Get UNREAD Notifications
**Endpoint:**
```
GET http://localhost/api/notifications.php?action=unread
```

**Description:** Fetches only unread notifications (read = false).

**Response:**
```json
{
  "success": true,
  "message": "Unread notifications fetched successfully",
  "count": 2,
  "data": [...]
}
```

---

## How to Use in Your Application

### Using JavaScript/Fetch
```javascript
// Fetch all broadcast notifications
fetch('http://localhost/api/notifications.php?action=broadcast')
  .then(response => response.json())
  .then(data => {
    console.log('Notifications:', data.data);
    console.log('Count:', data.count);
  })
  .catch(error => console.error('Error:', error));
```

### Using JavaScript/Axios
```javascript
// Fetch notifications for a specific user
axios.get('http://localhost/api/notifications.php', {
  params: {
    action: 'by_user',
    user_id: 'user-uuid-here'
  }
})
.then(response => {
  console.log(response.data.data);
})
.catch(error => console.error('Error:', error));
```

### Using jQuery
```javascript
// Fetch unread notifications
$.get('http://localhost/api/notifications.php?action=unread', function(response) {
  if (response.success) {
    console.log('Unread count:', response.count);
  }
});
```

### Using PHP
```php
<?php
// Fetch all notifications from the API
$url = 'http://localhost/api/notifications.php?action=all';
$response = file_get_contents($url);
$data = json_decode($response, true);

if ($data['success']) {
    foreach ($data['data'] as $notification) {
        echo $notification['title'] . "\n";
    }
}
?>
```

---

## Error Responses

### Missing Required Parameter
```json
{
  "success": false,
  "message": "user_id parameter is required for by_user action",
  "data": [],
  "count": 0
}
```

### Invalid Action
```json
{
  "success": false,
  "message": "Invalid action. Available actions: all, broadcast, by_user, by_type, unread",
  "data": [],
  "count": 0
}
```

### Database Error
```json
{
  "success": false,
  "message": "Database error: Table 'sos_db.notifications' doesn't exist",
  "data": [],
  "count": 0
}
```

---

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad Request (missing parameters) |
| 500 | Server Error (database error) |

---

## Quick Test Examples

Open these URLs in your browser:

1. **Get all notifications:**
   ```
   http://localhost/api/notifications.php?action=all
   ```

2. **Get broadcasts only:**
   ```
   http://localhost/api/notifications.php?action=broadcast
   ```

3. **Get unread notifications:**
   ```
   http://localhost/api/notifications.php?action=unread
   ```

4. **Get notifications for a user (replace UUID):**
   ```
   http://localhost/api/notifications.php?action=by_user&user_id=550e8400-e29b-41d4-a716-446655440000
   ```

---

## File Structure

```
prompty-web-builder-main/
├── db.php                          ← Database connection
├── api/
│   └── notifications.php           ← This file (API endpoint)
└── ... (other files)
```

---

## Features

✅ Get all notifications  
✅ Filter by type (broadcast, alert, etc.)  
✅ Filter by user  
✅ Get unread only  
✅ CORS enabled for cross-origin requests  
✅ SQL injection protection (prepared statements)  
✅ JSON response format  
✅ Error handling  
✅ Fully commented code  

---

## Notes

- Replace `http://localhost` with your actual server address in production
- The API returns up to 100 results (configurable in the code)
- Results are sorted by `created_at` in descending order (newest first)
- CORS is enabled, so you can call this API from JavaScript on different domains
