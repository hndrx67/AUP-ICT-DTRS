# DTRS Troubleshooting Guide

## Common Issues and Solutions

### Backend Issues

#### 1. **Server Won't Start**

**Error:** `Error: listen EADDRINUSE :::5000`

**Cause:** Port 5000 is already in use

**Solution:**
```bash
# Find process using port
netstat -tulpn | grep :5000

# Kill process
kill -9 <PID>

# Or change port in .env
PORT=5001
```

---

#### 2. **Database Connection Fails**

**Error:** `Error: connect ECONNREFUSED 127.0.0.1:3306`

**Cause:** MySQL is not running or wrong credentials

**Solution:**
```bash
# Check MySQL is running
mysql -u root -p -e "SELECT 1"

# Verify .env credentials
cat backend/.env

# Restart MySQL
# Windows:
net stop MySQL80
net start MySQL80

# Linux:
sudo service mysql restart

# macOS:
brew services restart mysql
```

---

#### 3. **Cannot Create Tables**

**Error:** `Error: Unknown database 'dtrs_db'`

**Cause:** Database doesn't exist

**Solution:**
```sql
# Create database manually
mysql -u root -p
CREATE DATABASE dtrs_db;
EXIT;

# Or run database initialization script
mysql -u root -p dtrs_db < database_schema.sql
```

---

#### 4. **JWT Token Errors**

**Error:** `Error: Invalid token` or `Error: No token provided`

**Cause:** 
- Token not sent in request
- Token has expired
- JWT_SECRET mismatch

**Solution:**
```bash
# Verify JWT_SECRET is consistent across restarts
echo $JWT_SECRET

# Get new token from login endpoint
curl -X POST http://localhost:5000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Include token in header
curl http://localhost:5000/api/students \
  -H "Authorization: Bearer <your_token>"
```

---

#### 5. **CORS Error**

**Error:** `Access to XMLHttpRequest has been blocked by CORS policy`

**Cause:** Frontend and backend on different origins

**Solution:**
```javascript
// Verify backend has CORS enabled in server.js
app.use(cors());

// Check frontend proxy in vite.config.js
proxy: {
  '/api': {
    target: 'http://localhost:5000',
    changeOrigin: true
  }
}

// Ensure frontend uses relative paths
axios.get('/api/students')  // ✓ Correct
axios.get('http://localhost:5000/api/students')  // ✗ Avoid
```

---

### Frontend Issues

#### 1. **Frontend Won't Start**

**Error:** `Port 3000 already in use`

**Cause:** Another application using port 3000

**Solution:**
```bash
# Change Vite port in vite.config.js
server: {
  port: 3001
}

# Or kill existing process
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/macOS:
lsof -ti :3000 | xargs kill -9
```

---

#### 2. **Cannot Reach Backend API**

**Error:** `Cannot GET /api/students` or `Network Error`

**Cause:** 
- Backend not running
- Wrong API URL
- Port mismatch

**Solution:**
```bash
# Check backend is running on port 5000
curl http://localhost:5000/api/time

# If using different port, update:
# frontend/vite.config.js
# backend/.env PORT setting

# Clear browser cache (Ctrl+Shift+Delete)
# Hard refresh (Ctrl+Shift+R)
```

---

#### 3. **Login Page Not Working**

**Error:** `Login failed` or `Invalid credentials`

**Cause:**
- Admin credentials wrong
- Backend not responding
- Network issue

**Solution:**
```bash
# Test login directly
curl -X POST http://localhost:5000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Verify credentials in backend/.env
# Default is admin/admin123

# Check browser console (F12) for detailed error
```

---

#### 4. **Kiosk Input Not Responding**

**Error:** Input field won't focus or accept input

**Cause:**
- JavaScript error
- Component not rendering
- Network issue

**Solution:**
```bash
# Check browser console for errors (F12)
# Clear cache and refresh (Ctrl+Shift+Delete, then Ctrl+R)

# Test API endpoint directly
curl http://localhost:5000/api/students/2024001

# Verify student exists in database
mysql -u root -p dtrs_db
SELECT * FROM students;
```

---

#### 5. **Time Not Updating**

**Error:** System time shows stuck or old time

**Cause:** 
- API not returning time
- Browser caching
- Network delay

**Solution:**
```bash
# Test API endpoint
curl http://localhost:5000/api/time

# Check network tab in DevTools (F12)
# Ensure request succeeds (200 status)

# Verify server time is correct
# Windows: time /t
# Linux/macOS: date
```

---

### Database Issues

#### 1. **phpMyAdmin Won't Connect**

**Error:** `Cannot connect to database server`

**Cause:**
- MySQL not running
- Wrong credentials
- phpMyAdmin misconfigured

**Solution:**
```bash
# Start MySQL service
# Windows:
net start MySQL80

# Test MySQL connection
mysql -h 127.0.0.1 -u root -p

# Verify phpMyAdmin config
# default: http://localhost/phpmyadmin
```

---

#### 2. **Data Not Persisting**

**Error:** Data saved but lost after restart

**Cause:**
- MySQL data not persisted (Docker)
- Wrong database name
- Database deleted

**Solution:**
```bash
# Check database exists
mysql -u root -p
SHOW DATABASES;

# If using Docker, verify volumes
docker inspect dtrs-mysql | grep Mounts

# Ensure database_schema.sql has been run
mysql -u root -p dtrs_db < database_schema.sql
```

---

#### 3. **Duplicate Student ID Error**

**Error:** `Student ID already exists`

**Cause:** Trying to register same ID twice

**Solution:**
```sql
-- Check existing students
SELECT id_number FROM students WHERE id_number = '2024001';

-- Delete duplicate if needed
DELETE FROM students WHERE id_number = '2024001';

-- Or use different ID
```

---

#### 4. **Foreign Key Constraint Error**

**Error:** `FOREIGN KEY constraint failed`

**Cause:** 
- Deleting student with time logs
- Wrong student_id in time logs
- Table structure issue

**Solution:**
```sql
-- Check foreign keys
SHOW CREATE TABLE time_logs\G

-- Delete time logs first, then student
DELETE FROM time_logs WHERE student_id = '2024001';
DELETE FROM students WHERE id_number = '2024001';

-- Or rely on CASCADE delete (configured in schema)
```

---

### RFID Scanner Issues

#### 1. **Scanner Not Detected**

**Error:** RFID scans not registering

**Cause:**
- Scanner not connected
- RFID disabled in settings
- Driver issues

**Solution:**
```bash
# Check RFID is enabled
curl http://localhost:5000/api/settings

# If disabled, enable via admin dashboard
# Or update directly via API:
curl -X PUT http://localhost:5000/api/settings/enable_rfid \
  -H "Content-Type: application/json" \
  -d '{"value":true}'

# Verify scanner connection (USB)
# Windows: Device Manager → USB devices
# Linux: lsusb
```

---

#### 2. **Slow Response Time**

**Error:** Scanning takes 5+ seconds to process

**Cause:**
- Database query slow
- Network latency
- Server processing

**Solution:**
```bash
# Check server logs for slow queries
# Enable query logging in MySQL

# Add database indexes (already in schema)
# Check backend load

# Optimize API endpoint timing
```

---

### Docker Issues

#### 1. **Docker Compose Won't Start**

**Error:** `docker: command not found` or service fails to start

**Cause:** Docker not installed or not running

**Solution:**
```bash
# Install Docker Desktop from docker.com

# Verify installation
docker --version
docker-compose --version

# Start Docker service
# Windows: Docker Desktop application
# Linux: sudo service docker start

# Check logs
docker-compose logs
```

---

#### 2. **MySQL Container Can't Connect**

**Error:** `Can't connect to MySQL server` with Docker

**Cause:**
- Container not running
- Port mapping wrong
- Network issue

**Solution:**
```bash
# Check container status
docker ps

# View logs
docker logs dtrs-mysql

# Verify port mapping
docker inspect dtrs-mysql | grep Ports

# Restart container
docker-compose restart mysql
```

---

#### 3. **Data Lost After Docker Restart**

**Error:** Database is empty after `docker-compose down`

**Cause:** Volume not properly configured

**Solution:**
```bash
# Check volumes
docker volume ls

# Verify docker-compose.yml has volume config
volumes:
  mysql_data:

# Ensure volume persists
docker-compose down --remove-orphans  # Don't use -v
```

---

## Debug Commands

### Backend Debugging

```bash
# Enable verbose logging
DEBUG=* npm start

# Check all routes
curl http://localhost:5000/

# Test endpoints
curl http://localhost:5000/api/time
curl http://localhost:5000/api/settings

# Monitor real-time logs
tail -f backend.log
```

### Frontend Debugging

```bash
# Check browser console (F12)
# Network tab to see API calls
# Application tab for localStorage

# Build errors
npm run build

# View detailed warnings
npm run build -- --mode production
```

### Database Debugging

```sql
-- Check database structure
DESCRIBE students;
DESCRIBE time_logs;
DESCRIBE settings;

-- View recent logs
SELECT * FROM time_logs ORDER BY timestamp DESC LIMIT 10;

-- Check for issues
SELECT COUNT(*) FROM students;
SELECT COUNT(*) FROM time_logs;
```

---

## Getting Help

1. **Check logs**: Look at terminal output when starting services
2. **Browser DevTools**: Press F12 to see frontend errors
3. **Network Tab**: See API request/response details
4. **MySQL Logs**: Check MySQL error log
5. **Documentation**: Review README.md, QUICK_START.md, API_DOCUMENTATION.md

---

## Reporting Issues

When reporting an issue, include:

1. Error message (full text)
2. Affected component (frontend/backend/database)
3. Steps to reproduce
4. Environment:
   - OS (Windows/Mac/Linux)
   - Node version: `node --version`
   - npm version: `npm --version`
   - MySQL version: `mysql --version`
5. Recent logs
6. Browser console errors (F12)
