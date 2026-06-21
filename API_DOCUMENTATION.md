# DTRS API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication

Admin endpoints require JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Endpoints Reference

### 1. Get Server Time (Public)

**Endpoint:** `GET /api/time`

**Description:** Get current server time to ensure time logs use server timestamp, not client time.

**Response:**
```json
{
  "time": "2024-06-21T14:30:45.123Z"
}
```

**Example:**
```bash
curl http://localhost:5000/api/time
```

---

### 2. Get Student Information (Public)

**Endpoint:** `GET /api/students/:id_number`

**Description:** Retrieve student details by ID number. Used when student scans or enters their ID at the kiosk.

**Parameters:**
- `id_number` (string, required): Student's ID number

**Response (Success):**
```json
{
  "id_number": "2024001",
  "name": "John Doe",
  "status": "active"
}
```

**Response (Not Found):**
```json
{
  "error": "Student not found"
}
```

**Example:**
```bash
curl http://localhost:5000/api/students/2024001
```

---

### 3. Get System Settings (Public)

**Endpoint:** `GET /api/settings`

**Description:** Retrieve current system settings including RFID and fingerprint status.

**Response:**
```json
{
  "enable_rfid": true,
  "enable_fingerprint": false
}
```

**Example:**
```bash
curl http://localhost:5000/api/settings
```

---

### 4. Create Time Log Entry (Public)

**Endpoint:** `POST /api/timelogs`

**Description:** Log a student's time entry. Automatically alternates between time_in and time_out for the same student on the same day.

**Request Body:**
```json
{
  "student_id": "2024001"
}
```

**Response:**
```json
{
  "id": 1,
  "type": "time_in",
  "timestamp": "2024-06-21T14:30:45.123Z",
  "message": "Timed in successfully"
}
```

**Logic:**
- If no entry exists for student on current date → `type: "time_in"`
- If last entry is `time_in` → `type: "time_out"`
- If last entry is `time_out` → `type: "time_in"`

**Example:**
```bash
curl -X POST http://localhost:5000/api/timelogs \
  -H "Content-Type: application/json" \
  -d '{"student_id": "2024001"}'
```

---

### 5. Admin Login

**Endpoint:** `POST /api/admin/login`

**Description:** Authenticate admin user and receive JWT token.

**Request Body:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response (Success):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (Failure):**
```json
{
  "error": "Invalid credentials"
}
```

**Example:**
```bash
curl -X POST http://localhost:5000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

---

### 6. Register New Student (Admin)

**Endpoint:** `POST /api/students`

**Authentication:** Required (Bearer Token)

**Description:** Register a new student in the system.

**Request Body:**
```json
{
  "id_number": "2024001",
  "name": "John Doe"
}
```

**Response (Success):**
```json
{
  "message": "Student registered successfully"
}
```

**Response (Error - Duplicate ID):**
```json
{
  "error": "Student ID already exists"
}
```

**Example:**
```bash
curl -X POST http://localhost:5000/api/students \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"id_number":"2024001","name":"John Doe"}'
```

---

### 7. Get All Students (Admin)

**Endpoint:** `GET /api/students`

**Authentication:** Required (Bearer Token)

**Description:** Retrieve list of all registered students.

**Response:**
```json
[
  {
    "id_number": "2024001",
    "name": "John Doe",
    "status": "active",
    "created_at": "2024-06-21T10:30:00.000Z",
    "updated_at": "2024-06-21T10:30:00.000Z"
  },
  {
    "id_number": "2024002",
    "name": "Jane Smith",
    "status": "active",
    "created_at": "2024-06-21T11:00:00.000Z",
    "updated_at": "2024-06-21T11:00:00.000Z"
  }
]
```

**Example:**
```bash
curl http://localhost:5000/api/students \
  -H "Authorization: Bearer <token>"
```

---

### 8. Update Student (Admin)

**Endpoint:** `PUT /api/students/:id_number`

**Authentication:** Required (Bearer Token)

**Description:** Update student information (name, status).

**Parameters:**
- `id_number` (string, required): Student's ID number

**Request Body:**
```json
{
  "name": "Jane Doe",
  "status": "inactive"
}
```

**Response:**
```json
{
  "message": "Student updated successfully"
}
```

**Example:**
```bash
curl -X PUT http://localhost:5000/api/students/2024001 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane Doe","status":"active"}'
```

---

### 9. Delete Student (Admin)

**Endpoint:** `DELETE /api/students/:id_number`

**Authentication:** Required (Bearer Token)

**Description:** Remove a student from the system (also deletes associated time logs).

**Parameters:**
- `id_number` (string, required): Student's ID number

**Response:**
```json
{
  "message": "Student deleted successfully"
}
```

**Example:**
```bash
curl -X DELETE http://localhost:5000/api/students/2024001 \
  -H "Authorization: Bearer <token>"
```

---

### 10. Update Setting (Admin)

**Endpoint:** `PUT /api/settings/:key`

**Authentication:** Required (Bearer Token)

**Description:** Update a system setting (e.g., enable/disable RFID or fingerprint).

**Parameters:**
- `key` (string, required): Setting key (`enable_rfid` or `enable_fingerprint`)

**Request Body:**
```json
{
  "value": true
}
```

**Response:**
```json
{
  "message": "Setting updated successfully"
}
```

**Example:**
```bash
# Enable RFID
curl -X PUT http://localhost:5000/api/settings/enable_rfid \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"value":true}'

# Disable Fingerprint
curl -X PUT http://localhost:5000/api/settings/enable_fingerprint \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"value":false}'
```

---

### 11. Get Student Time Logs (Admin)

**Endpoint:** `GET /api/students/:id_number/timelogs`

**Authentication:** Required (Bearer Token)

**Description:** Retrieve time log history for a specific student.

**Parameters:**
- `id_number` (string, required): Student's ID number

**Response:**
```json
[
  {
    "id": 1,
    "student_id": "2024001",
    "type": "time_in",
    "timestamp": "2024-06-21T08:30:00.000Z",
    "date": "2024-06-21"
  },
  {
    "id": 2,
    "student_id": "2024001",
    "type": "time_out",
    "timestamp": "2024-06-21T17:00:00.000Z",
    "date": "2024-06-21"
  }
]
```

**Example:**
```bash
curl http://localhost:5000/api/students/2024001/timelogs \
  -H "Authorization: Bearer <token>"
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message describing what went wrong"
}
```

### Common HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (missing/invalid parameters) |
| 401 | Unauthorized (invalid credentials or missing token) |
| 403 | Forbidden (invalid token) |
| 404 | Not Found (student doesn't exist) |
| 500 | Server Error |

---

## CORS Handling

The backend is configured to accept requests from the frontend on `http://localhost:3000`.

For production, update the CORS configuration in `server.js`:

```javascript
app.use(cors({
  origin: 'https://yourdomain.com',
  credentials: true
}));
```

---

## Rate Limiting (Future)

Consider implementing rate limiting to prevent abuse:

```bash
npm install express-rate-limit
```

## WebSocket Support (Future)

For real-time updates, consider implementing WebSocket:

```bash
npm install socket.io
```

This would enable:
- Live time log notifications
- Real-time student count
- Instant setting changes
