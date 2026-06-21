# DTRS - Daily Time Record System

A modern web-based time tracking system with an admin dashboard for student management and a public kiosk interface supporting RFID and fingerprint scanning.

## Features

- **Public Kiosk Screen**: Students scan their ID (RFID) or enter manually to log time
- **Admin Dashboard**: Manage students, view logs, and configure system settings
- **Time Logging**: Automatic time-in/time-out tracking with server timestamp
- **Settings Management**: Toggle RFID and fingerprint scanning features
- **MySQL Database**: Persistent data storage with phpMyAdmin access

## Project Structure

```
DTRS/
├── frontend/          # Vite + React application
│   ├── src/
│   │   ├── pages/    # Kiosk, Admin Login, Dashboard
│   │   └── App.jsx
│   ├── package.json
│   └── vite.config.js
├── backend/          # Node.js/Express API server
│   ├── server.js
│   ├── package.json
│   └── .env.example
└── README.md
```

## Setup Instructions

### Prerequisites
- Node.js (v16+)
- MySQL 8.0+
- npm or yarn

### Backend Setup

1. **Install dependencies**:
   ```bash
   cd backend
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your MySQL credentials:
   ```env
   PORT=5000
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=dtrs_db
   JWT_SECRET=your_secret_key
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=admin123
   ```

3. **Create MySQL database**:
   ```sql
   CREATE DATABASE dtrs_db;
   ```

4. **Start the server**:
   ```bash
   npm start
   ```
   
   Development mode with auto-reload:
   ```bash
   npm run dev
   ```

   The server will run on `http://localhost:5000`

### Frontend Setup

1. **Install dependencies**:
   ```bash
   cd frontend
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

   The app will run on `http://localhost:3000`

3. **Build for production**:
   ```bash
   npm run build
   ```

## API Endpoints

### Public Endpoints

- **GET `/api/time`** - Get server time
  ```json
  { "time": "2024-06-21T10:30:00.000Z" }
  ```

- **GET `/api/students/:id_number`** - Get student info
  ```json
  { "id_number": "2024001", "name": "John Doe", "status": "active" }
  ```

- **POST `/api/timelogs`** - Create time log entry
  ```json
  { "student_id": "2024001" }
  ```
  Response:
  ```json
  {
    "id": 1,
    "type": "time_in",
    "timestamp": "2024-06-21T10:30:00.000Z",
    "message": "Timed in successfully"
  }
  ```

- **GET `/api/settings`** - Get system settings
  ```json
  { "enable_rfid": true, "enable_fingerprint": false }
  ```

### Admin Endpoints (Require JWT Token)

- **POST `/api/admin/login`** - Admin login
  ```json
  { "username": "admin", "password": "admin123" }
  ```

- **POST `/api/students`** - Register student
  ```json
  { "id_number": "2024001", "name": "John Doe" }
  ```

- **GET `/api/students`** - Get all students

- **PUT `/api/students/:id_number`** - Update student
  ```json
  { "name": "Jane Doe", "status": "active" }
  ```

- **DELETE `/api/students/:id_number`** - Delete student

- **PUT `/api/settings/:key`** - Update setting
  ```json
  { "value": true }
  ```

- **GET `/api/students/:id_number/timelogs`** - Get student time logs

## Database Schema

### students table
```sql
CREATE TABLE students (
  id_number VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### time_logs table
```sql
CREATE TABLE time_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id VARCHAR(50) NOT NULL,
  type ENUM('time_in', 'time_out') NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  date DATE GENERATED ALWAYS AS (DATE(timestamp)) STORED,
  FOREIGN KEY (student_id) REFERENCES students(id_number) ON DELETE CASCADE,
  INDEX idx_student_date (student_id, date)
);
```

### settings table
```sql
CREATE TABLE settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value VARCHAR(255) NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## Using phpMyAdmin

1. Open phpMyAdmin in your browser (usually at `http://localhost/phpmyadmin`)
2. Login with your MySQL credentials
3. Navigate to `dtrs_db` database
4. You can:
   - View/edit student records directly
   - Bulk import student rosters via CSV
   - View time logs
   - Monitor settings

## Admin Access

Default credentials (can be changed in `.env`):
- **Username**: admin
- **Password**: admin123

Navigate to `http://localhost:3000/admin/login` to access the dashboard.

## RFID Integration

The kiosk screen accepts HID-emulated keystrokes from RFID readers. Simply scan the RFID card into the numeric input field. The system will:
1. Auto-focus the input field
2. Accept RFID scan data (HID keyboard emulation)
3. Process on Enter key press
4. Log time automatically

## Fingerprint Scanner Integration

To integrate a fingerprint scanner:
1. Bridge the scanner SDK in the Node.js middleware
2. Add fingerprint verification before time log creation
3. Enable "Enable Fingerprint Scanning" in settings
4. When enabled, the system will require fingerprint verification before logging time

## Troubleshooting

### Database Connection Error
- Verify MySQL is running
- Check credentials in `.env`
- Ensure database `dtrs_db` exists

### Port Already in Use
- Change `PORT` in `.env` (default: 5000)
- Change Vite port: modify `vite.config.js`

### CORS Issues
- Ensure backend CORS is configured for your frontend URL
- Check proxy settings in `vite.config.js`

## Development Notes

- Backend uses JWT for admin authentication
- Frontend stores token in localStorage
- Time logs alternate between time_in and time_out automatically
- System uses server time to prevent spoofing
- All timestamps are UTC

## Future Enhancements

- Fingerprint scanner SDK integration
- Real-time attendance reports
- Email notifications
- Data export (CSV/PDF)
- Multi-admin support with role-based access
- Attendance analytics dashboard
