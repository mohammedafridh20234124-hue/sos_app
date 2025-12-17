# 📊 MySQL Notifications API Endpoints

## Access the MySQL endpoints through your existing Node.js backend

**Base URL:** `http://localhost:3001`

---

## Available Endpoints

### 1. Test MySQL Connection
```
GET http://localhost:3001/api/mysql/health
```

**Response:**
```json
{
  "success": true,
  "message": "MySQL connection successful",
  "status": "connected",
  "database": "sos_db"
}
```

---

### 2. Get ALL Notifications
```
GET http://localhost:3001/api/mysql/notifications?action=all
```

**Response:**
```json
{
  "success": true,
  "message": "Notifications fetched successfully (action: all)",
  "count": 5,
  "data": [...]
}
```

---

### 3. Get BROADCAST Notifications
```
GET http://localhost:3001/api/mysql/notifications?action=broadcast
```

---

### 4. Get Notifications for Specific User
```
GET http://localhost:3001/api/mysql/notifications?action=by_user&user_id=USER_UUID
```

Example:
```
http://localhost:3001/api/mysql/notifications?action=by_user&user_id=550e8400-e29b-41d4-a716-446655440000
```

---

### 5. Get Notifications by Type
```
GET http://localhost:3001/api/mysql/notifications?action=by_type&type=broadcast
```

---

### 6. Get UNREAD Notifications
```
GET http://localhost:3001/api/mysql/notifications?action=unread
```

---

## Setup Instructions

### Step 1: Ensure MySQL is Running
Check if MySQL is running on your system:

```powershell
# Windows - Check if MySQL service is running
Get-Service MySQL80  # or MySQL57, depending on your version
```

If not running, start it:
```powershell
Start-Service MySQL80
```

### Step 2: Verify Database Credentials
Make sure these match your setup in `db.php`:
- Host: `localhost`
- User: `root`
- Password: (empty)
- Database: `sos_db`

### Step 3: Create notifications Table (if not exists)
Run in MySQL:
```sql
CREATE TABLE IF NOT EXISTS sos_db.notifications (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36),
  title TEXT,
  message TEXT,
  type VARCHAR(50) DEFAULT 'broadcast',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP NULL
);
```

### Step 4: Test the Connection
Open in browser:
```
http://localhost:3001/api/mysql/health
```

You should see `"success": true`

---

## Quick Test Commands

```powershell
# Test MySQL health
curl http://localhost:3001/api/mysql/health

# Get all notifications
curl "http://localhost:3001/api/mysql/notifications?action=all"

# Get broadcasts only
curl "http://localhost:3001/api/mysql/notifications?action=broadcast"

# Get unread
curl "http://localhost:3001/api/mysql/notifications?action=unread"
```

---

## Using in Your React App

```typescript
// Fetch broadcasts from MySQL
const response = await fetch('http://localhost:3001/api/mysql/notifications?action=broadcast');
const data = await response.json();

if (data.success) {
  console.log('Notifications:', data.data);
  console.log('Count:', data.count);
}
```

---

## Troubleshooting

### "MySQL connection failed"
- Make sure MySQL is running on `localhost:3306`
- Check credentials: user=root, password=empty, database=sos_db
- Verify the notifications table exists

### "Unknown database 'sos_db'"
- Create the database in MySQL:
  ```sql
  CREATE DATABASE sos_db;
  ```

### "Table 'sos_db.notifications' doesn't exist"
- Create the table using the SQL script above

### Port 3001 not accessible
- Make sure the Node.js backend is running:
  ```powershell
  netstat -ano | Select-String "3001"
  ```

---

## File Structure

```
prompty-web-builder-main/
├── server/
│   └── sms-service.mjs          ← Has /api/mysql/* endpoints
├── db.php                        ← PHP database connection
├── api/
│   └── notifications.php         ← PHP API endpoint
└── ... (other files)
```

---

## Notes

✅ MySQL endpoints added to existing Node.js backend  
✅ No need for separate PHP server  
✅ Uses connection pooling for performance  
✅ All endpoints return JSON  
✅ CORS enabled  
✅ Error handling included
