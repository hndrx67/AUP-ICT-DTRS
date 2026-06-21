# DTRS System Architecture & Data Flow

## System Architecture Diagram

```
                          ┌──────────────────────────────────┐
                          │     Internet/Network              │
                          └──────────────┬───────────────────┘
                                         │
                    ┌────────────────────┼────────────────────┐
                    │                    │                    │
                    ▼                    ▼                    ▼
        ┌─────────────────────┐ ┌─────────────────────┐ ┌──────────────────┐
        │   Admin Browser      │ │ Kiosk Browser       │ │ phpMyAdmin       │
        │   (React App)        │ │ (React App)         │ │ (Web Interface)  │
        │ :3000               │ │ :3000               │ │ :8080            │
        └──────────┬──────────┘ └──────────┬──────────┘ └────────┬─────────┘
                   │                       │                     │
                   │ HTTP/REST (JSON)      │ HTTP/REST (JSON)    │ SQL Queries
                   │                       │                     │
        ┌──────────┴───────────────────────┴─────────────────────┴────────┐
        │                                                                   │
        │              Node.js/Express Backend API Server                  │
        │              Port: 5000                                           │
        │                                                                   │
        │  ┌─────────────────────────────────────────────────────────┐    │
        │  │ Middleware Stack                                        │    │
        │  │ • CORS Configuration                                    │    │
        │  │ • JSON Body Parser                                      │    │
        │  │ • JWT Authentication (Admin Routes)                     │    │
        │  │ • Error Handler                                         │    │
        │  └─────────────────────────────────────────────────────────┘    │
        │                                                                   │
        │  ┌─────────────────────────────────────────────────────────┐    │
        │  │ Route Handlers                                          │    │
        │  ├─ GET  /api/time              (Public)                  │    │
        │  ├─ GET  /api/students/:id      (Public)                  │    │
        │  ├─ GET  /api/settings          (Public)                  │    │
        │  ├─ POST /api/timelogs          (Public)                  │    │
        │  ├─ POST /api/admin/login       (Public)                  │    │
        │  ├─ POST /api/students          (Admin)                   │    │
        │  ├─ GET  /api/students          (Admin)                   │    │
        │  ├─ PUT  /api/students/:id      (Admin)                   │    │
        │  ├─ DELETE /api/students/:id    (Admin)                   │    │
        │  ├─ PUT  /api/settings/:key     (Admin)                   │    │
        │  └─ GET  /api/students/:id/timelogs (Admin)              │    │
        │  └─────────────────────────────────────────────────────────┘    │
        │                                                                   │
        │  ┌─────────────────────────────────────────────────────────┐    │
        │  │ Database Connection Pool                                │    │
        │  │ • 10 concurrent connections                             │    │
        │  │ • Connection pooling & reuse                            │    │
        │  │ • mysql2/promise module                                 │    │
        │  └────────────────────┬────────────────────────────────────┘    │
        │                       │                                         │
        └───────────────────────┼─────────────────────────────────────────┘
                                │
                                │ TCP/IP Port 3306
                                │
                    ┌───────────▼──────────────┐
                    │   MySQL Database         │
                    │   Database: dtrs_db      │
                    │                          │
                    │  ┌──────────────────┐   │
                    │  │ students         │   │
                    │  │ • id_number (PK) │   │
                    │  │ • name           │   │
                    │  │ • status         │   │
                    │  │ • timestamps     │   │
                    │  └──────────────────┘   │
                    │                          │
                    │  ┌──────────────────┐   │
                    │  │ time_logs        │   │
                    │  │ • id (PK)        │   │
                    │  │ • student_id(FK) │   │
                    │  │ • type           │   │
                    │  │ • timestamp      │   │
                    │  │ • date (indexed) │   │
                    │  └──────────────────┘   │
                    │                          │
                    │  ┌──────────────────┐   │
                    │  │ settings         │   │
                    │  │ • key (unique)   │   │
                    │  │ • value          │   │
                    │  └──────────────────┘   │
                    │                          │
                    └──────────────────────────┘
```

## Student Time Logging Flow

```
                    ┌──────────────────────────────────┐
                    │   Student Scans/Enters ID         │
                    │   (RFID or Manual Input)          │
                    └──────────────┬───────────────────┘
                                   │
                                   ▼
                    ┌──────────────────────────────────┐
                    │ Frontend: KioskScreen.jsx        │
                    │ • Input field captures ID        │
                    │ • User presses Enter             │
                    └──────────────┬───────────────────┘
                                   │
                          ┌────────┴────────┐
                          │                 │
                          ▼                 ▼
                  ┌────────────────┐  ┌──────────────────┐
                  │ Check Settings │  │ Get Server Time  │
                  │ RFID Enabled?  │  │ GET /api/time    │
                  └────────┬───────┘  └────────┬─────────┘
                           │                  │
                    ┌──────┴──────┐          │
                    │             │          │
                    ▼             ▼          │
            ┌──────────────┐   │          │
            │RFID Disabled │   │          │
            │Show Error    │   │          │
            └──────────────┘   │          │
                                ▼          │
                        ┌────────────────┐ │
                        │ Student Lookup │ │
                        │GET /api/        │ │
                        │students/:id    │ │
                        └────────┬───────┘ │
                                 │         │
                                 ▼         ▼
                    ┌──────────────────────────────┐
                    │  Verify Student Found        │
                    │  Check Status                │
                    └──────────────┬───────────────┘
                                   │
                        ┌──────────┴──────────┐
                        │                     │
                        ▼                     ▼
                ┌──────────────────┐  ┌──────────────────┐
                │ Student Not Found │  │  Display Student │
                │ Show Error        │  │  • Name          │
                └──────────────────┘  │  • Server Time    │
                                       └────────┬─────────┘
                                                │
                                                ▼
                                  ┌────────────────────────────┐
                                  │ Check Fingerprint Setting  │
                                  │ enable_fingerprint = true? │
                                  └────────────┬───────────────┘
                                               │
                                ┌──────────────┴──────────────┐
                                │                             │
                                ▼                             ▼
                        ┌────────────────┐        ┌──────────────────┐
                        │ Scan Fingerprint        │ Skip Fingerprint  │
                        │ (Verify Match)         │ (RFID/Manual)     │
                        └────────┬───────┘        └────────┬─────────┘
                                 │                        │
                    ┌────────────┴──────────────────────────┘
                    │
                    ▼
        ┌─────────────────────────────────────┐
        │ POST /api/timelogs                  │
        │ {student_id: "2024001"}             │
        │                                     │
        │ Backend:                            │
        │ 1. Get today's date                 │
        │ 2. Find last log for this student   │
        │ 3. Determine type (in/out)          │
        │    - No entry? → time_in            │
        │    - Last=in?  → time_out           │
        │    - Last=out? → time_in            │
        │ 4. Insert new log with timestamp    │
        └────────────┬────────────────────────┘
                     │
                     ▼
        ┌─────────────────────────────────────┐
        │ MySQL: INSERT into time_logs        │
        │ (student_id, type, timestamp)       │
        │                                     │
        │ ✓ Log created                       │
        │ ✓ Date auto-generated               │
        │ ✓ Timestamp server-verified         │
        └────────────┬────────────────────────┘
                     │
                     ▼
        ┌─────────────────────────────────────┐
        │ Return Response                     │
        │ {                                   │
        │   id: 1,                            │
        │   type: "time_in",                  │
        │   timestamp: "2024-06-21T...",      │
        │   message: "Timed in successfully"  │
        │ }                                   │
        └────────────┬────────────────────────┘
                     │
                     ▼
        ┌─────────────────────────────────────┐
        │ Frontend: Display Success           │
        │ • Show name                         │
        │ • Show server time                  │
        │ • Display success message           │
        │ • Auto-clear after 3 seconds        │
        │ • Auto-focus input for next scan    │
        └─────────────────────────────────────┘
```

## Admin Dashboard Flow

```
┌────────────────────────────────────────────────────┐
│  Admin User (http://localhost:3000/admin/login)    │
└────────────────┬─────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────┐
│ AdminLogin.jsx                                     │
│ • Enter username & password                        │
│ • POST /api/admin/login                            │
│   Backend: Verify credentials                      │
│   Response: JWT token                              │
│ • Store token in localStorage                      │
│ • Redirect to /admin/dashboard                     │
└────────────────┬─────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────┐
│ AdminDashboard.jsx (Protected Route)               │
│                                                    │
│ ┌──────────────────────────────────────────────┐  │
│ │ TAB 1: Student Management                    │  │
│ │                                              │  │
│ │ Register New Student:                        │  │
│ │ • Enter ID number                            │  │
│ │ • Enter name                                 │  │
│ │ • POST /api/students                         │  │
│ │   (with Bearer token)                        │  │
│ │                                              │  │
│ │ View All Students:                           │  │
│ │ • GET /api/students                          │  │
│ │ • Display table with:                        │  │
│ │   - ID number                                │  │
│ │   - Name                                     │  │
│ │   - Status                                   │  │
│ │   - Registered date                          │  │
│ │   - Delete button                            │  │
│ │                                              │  │
│ │ Delete Student:                              │  │
│ │ • DELETE /api/students/:id                   │  │
│ │ • Confirm dialog first                       │  │
│ └──────────────────────────────────────────────┘  │
│                                                    │
│ ┌──────────────────────────────────────────────┐  │
│ │ TAB 2: Settings Management                   │  │
│ │                                              │  │
│ │ Toggle RFID Tapping:                         │  │
│ │ • Switch toggle                              │  │
│ │ • PUT /api/settings/enable_rfid              │  │
│ │   {value: true/false}                        │  │
│ │                                              │  │
│ │ Toggle Fingerprint Scanning:                 │  │
│ │ • Switch toggle                              │  │
│ │ • PUT /api/settings/enable_fingerprint       │  │
│ │   {value: true/false}                        │  │
│ │                                              │  │
│ │ Display Current Status:                      │  │
│ │ • GET /api/settings                          │  │
│ │ • Show indicators:                           │  │
│ │   ✓ RFID Enabled/Disabled                    │  │
│ │   ✓ Fingerprint Enabled/Disabled             │  │
│ └──────────────────────────────────────────────┘  │
│                                                    │
│ Logout Button:                                     │
│ • Clear token from localStorage                    │
│ • Redirect to /admin/login                        │
└────────────────────────────────────────────────────┘
```

## Time Log Alternation Logic

```
Day 1:

┌─────────────────────────────────────────────────────┐
│ Student ID: 2024001                                │
│ Date: 2024-06-21                                   │
├─────────────────────────────────────────────────────┤
│ Scan 1: 08:30 AM → time_in  (new day)             │
│ Scan 2: 12:00 PM → time_out (last was in)         │
│ Scan 3: 13:30 PM → time_in  (last was out)        │
│ Scan 4: 17:00 PM → time_out (last was in)         │
└─────────────────────────────────────────────────────┘

Day 2 (Next morning):

┌─────────────────────────────────────────────────────┐
│ Student ID: 2024001                                │
│ Date: 2024-06-22                                   │
├─────────────────────────────────────────────────────┤
│ Scan 1: 08:30 AM → time_in  (new day)             │
│ Scan 2: 12:00 PM → time_out (last was in)         │
│ Scan 3: 13:30 PM → time_in  (last was out)        │
│ Scan 4: 17:00 PM → time_out (last was in)         │
└─────────────────────────────────────────────────────┘


Algorithm:
┌─────────────────────────────────────────────────────┐
│ Query: SELECT * FROM time_logs                     │
│        WHERE student_id = ?                        │
│        AND DATE(timestamp) = TODAY                 │
│        ORDER BY timestamp DESC LIMIT 1             │
│                                                     │
│ IF no result                                        │
│   THEN type = "time_in"                            │
│ ELSE IF last.type = "time_in"                      │
│   THEN type = "time_out"                           │
│ ELSE                                                │
│   THEN type = "time_in"                            │
│ END IF                                              │
│                                                     │
│ INSERT INTO time_logs                              │
│ (student_id, type, timestamp)                      │
│ VALUES (?, ?, NOW())                               │
└─────────────────────────────────────────────────────┘
```

## Security Architecture

```
┌────────────────────────────────────────────┐
│         Client (Browser)                   │
│                                            │
│  • LocalStorage (JWT Token)                │
│  • HTTPS Recommended in Production         │
└────────────┬───────────────────────────────┘
             │
             │ HTTPS/TLS in Production
             │
┌────────────▼───────────────────────────────┐
│     Express.js Backend Server              │
│                                            │
│  • CORS Validation                         │
│  • Input Validation                        │
│  • JWT Verification (admin routes)         │
│  • Parameterized SQL Queries               │
│  • Error Handling (no stack traces)        │
│  • Rate Limiting (optional)                │
│  • HTTPS/TLS Support                       │
└────────────┬───────────────────────────────┘
             │
             │ TCP/IP with SSL Option
             │
┌────────────▼───────────────────────────────┐
│        MySQL Database                      │
│                                            │
│  • Foreign Key Constraints                 │
│  • Prepared Statements                     │
│  • Connection Pool                         │
│  • Data Encryption at Rest (optional)      │
│  • Regular Backups                         │
│  • Access Control (DB user/pass)           │
└────────────────────────────────────────────┘
```

## API Response Patterns

```
SUCCESS (200 OK):
┌────────────────────────────────┐
│ {                              │
│   "id_number": "2024001",     │
│   "name": "John Doe",          │
│   "status": "active",          │
│   "timestamp": "2024-06-21..." │
│ }                              │
└────────────────────────────────┘

CREATED (201):
┌────────────────────────────────┐
│ {                              │
│   "message": "Success...",     │
│   "id": 1                      │
│ }                              │
└────────────────────────────────┘

BAD REQUEST (400):
┌────────────────────────────────┐
│ {                              │
│   "error": "Invalid input"     │
│ }                              │
└────────────────────────────────┘

UNAUTHORIZED (401):
┌────────────────────────────────┐
│ {                              │
│   "error": "Invalid token"     │
│ }                              │
└────────────────────────────────┘

NOT FOUND (404):
┌────────────────────────────────┐
│ {                              │
│   "error": "Student not found" │
│ }                              │
└────────────────────────────────┘

SERVER ERROR (500):
┌────────────────────────────────┐
│ {                              │
│   "error": "Database error"    │
│ }                              │
└────────────────────────────────┘
```

## Deployment Architecture (Production)

```
┌─────────────────────────────────────────────────────┐
│           Users/Students                            │
└────────────┬────────────────────────────────────────┘
             │
             │ HTTPS
             │
┌────────────▼────────────────────────────────────────┐
│        Load Balancer (Optional)                     │
│        • Distribute traffic                         │
│        • SSL/TLS termination                        │
│        • Health checks                              │
└────────────┬────────────────────────────────────────┘
             │
       ┌─────┴─────┐
       │           │
       ▼           ▼
    ┌──────┐   ┌──────┐
    │ App  │   │ App  │  (Multiple instances)
    │ #1   │   │ #2   │
    └──┬───┘   └──┬───┘
       │         │
       └────┬────┘
            │
            ▼
    ┌────────────────────────┐
    │  MySQL Database        │
    │  (Master-Slave or      │
    │   Cluster)             │
    │  • Automatic Backups   │
    │  • Replication         │
    │  • High Availability   │
    └────────────────────────┘

    ┌────────────────────────┐
    │  CDN (Static Assets)   │
    │  • Frontend Build      │
    │  • CSS/Images          │
    │  • Global Distribution │
    └────────────────────────┘
```

---

This architecture supports:
- ✓ Real-time student tracking
- ✓ Scalable attendance logging
- ✓ Secure admin operations
- ✓ Multi-user concurrent access
- ✓ Data persistence and recovery
- ✓ Integration with biometric scanners
