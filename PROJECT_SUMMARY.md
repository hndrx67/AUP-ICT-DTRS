# DTRS Project Summary & File Guide

## 📋 Project Overview

**DTRS (Daily Time Record - Student)** is a complete web-based time tracking system featuring:
- ✓ Public kiosk interface for student ID scanning (RFID/manual entry)
- ✓ Admin dashboard for student management and system configuration
- ✓ Automatic time-in/time-out logging with server-verified timestamps
- ✓ Settings management for enabling/disabling RFID and fingerprint scanning
- ✓ MySQL database with phpMyAdmin access
- ✓ JWT-based admin authentication

## 🗂️ Complete File Structure

```
DTRS/
│
├── 📄 Root Documentation
│   ├── README.md                      # Main project documentation
│   ├── QUICK_START.md                 # 5-minute getting started guide
│   ├── SETUP_WINDOWS.md               # Windows-specific setup
│   ├── API_DOCUMENTATION.md           # Complete API reference
│   ├── FINGERPRINT_INTEGRATION.md     # Fingerprint scanner setup
│   ├── TROUBLESHOOTING.md             # 20+ issue solutions
│   ├── DEVELOPMENT.md                 # Development guidelines
│   ├── package.json                   # Root monorepo scripts
│   ├── docker-compose.yml             # Docker setup (MySQL + phpMyAdmin)
│   └── database_schema.sql            # SQL initialization script
│
├── 📁 backend/ (Node.js/Express API)
│   ├── server.js                      # ⭐ Main backend (350+ lines)
│   │   ├── Express app setup
│   │   ├── MySQL connection pool
│   │   ├── Database initialization
│   │   ├── 12 API endpoints
│   │   └── JWT authentication
│   ├── package.json                   # Backend dependencies
│   ├── .env.example                   # Environment template
│   └── .gitignore
│
└── 📁 frontend/ (Vite + React)
    ├── 📁 src/
    │   ├── 📁 pages/
    │   │   ├── KioskScreen.jsx        # ⭐ Public kiosk interface
    │   │   ├── KioskScreen.css        # Kiosk styling (gradient)
    │   │   ├── AdminLogin.jsx         # Admin authentication page
    │   │   ├── AdminLogin.css         # Login styling
    │   │   ├── AdminDashboard.jsx     # ⭐ Admin control panel
    │   │   └── AdminDashboard.css     # Dashboard styling
    │   ├── App.jsx                    # ⭐ Router configuration
    │   ├── App.css
    │   ├── main.jsx                   # Entry point
    │   └── index.css                  # Global styles
    ├── index.html                     # HTML template
    ├── vite.config.js                 # Vite configuration with API proxy
    ├── package.json                   # Frontend dependencies
    └── .gitignore
```

## 🚀 Quick Start (30 seconds)

```bash
# Terminal 1: Backend
cd backend && npm install && npm start

# Terminal 2: Frontend
cd frontend && npm install && npm run dev

# Terminal 3: Create database
mysql -u root -e "CREATE DATABASE dtrs_db;"

# Access:
# Kiosk: http://localhost:3000
# Admin: http://localhost:3000/admin/login (admin/admin123)
```

## 📊 Architecture & Components

### Backend (Node.js/Express)

**Core Features:**
- ✓ 12 RESTful API endpoints
- ✓ JWT token-based authentication
- ✓ MySQL connection pooling
- ✓ Auto database initialization
- ✓ CORS enabled
- ✓ Error handling middleware

**Endpoints (Grouped):**

| Category | Endpoint | Method | Auth |
|----------|----------|--------|------|
| **Public** | `/api/time` | GET | No |
| | `/api/students/:id` | GET | No |
| | `/api/settings` | GET | No |
| | `/api/timelogs` | POST | No |
| **Admin** | `/api/admin/login` | POST | No |
| | `/api/students` | GET/POST | ✓ |
| | `/api/students/:id` | PUT/DELETE | ✓ |
| | `/api/students/:id/timelogs` | GET | ✓ |
| | `/api/settings/:key` | PUT | ✓ |

### Frontend (Vite + React)

**Pages:**

1. **KioskScreen** (`/`)
   - Auto-focused numeric input
   - Accepts RFID scans and manual entry
   - Displays student name + server time
   - Real-time system clock
   - Automatic time-in/time-out toggle

2. **AdminLogin** (`/admin/login`)
   - Credentials: admin/admin123
   - JWT token generation and storage
   - Persistent session

3. **AdminDashboard** (`/admin/dashboard`)
   - **Student Management Tab**
     - Register new students
     - View all registered students
     - Delete students
   - **Settings Tab**
     - Toggle RFID scanning
     - Toggle fingerprint verification
     - Visual status indicators

### Database (MySQL)

**Tables:**

```sql
students (4 columns)
├── id_number (PK)
├── name
├── status (active/inactive)
└── timestamps (created_at, updated_at)

time_logs (5 columns)
├── id (PK)
├── student_id (FK → students)
├── type (time_in/time_out)
├── timestamp
└── date (generated)

settings (3 columns)
├── id (PK)
├── key (unique)
└── value
```

## 🔑 Key Features Explained

### 1. Automatic Time Logging
```
First scan → time_in ✓
Second scan → time_out ✓
Third scan → time_in ✓
(Pattern repeats daily)
```

### 2. Server-Verified Timestamps
- Prevents client-side time spoofing
- All logs use server clock via `/api/time`
- Accurate attendance tracking

### 3. Settings Management
- **RFID Enabled**: Allows automated ID scanning
- **Fingerprint Enabled**: Requires biometric verification before logging
- Both toggles are checked before processing

### 4. Admin Authentication
- JWT token with 24-hour expiry
- Token stored in localStorage
- Protected routes require valid token

## 📚 Documentation Files Explained

| File | Purpose | Who Should Read |
|------|---------|-----------------|
| **README.md** | Complete project overview | Everyone |
| **QUICK_START.md** | Step-by-step setup | First-time users |
| **SETUP_WINDOWS.md** | Windows-specific guide | Windows users |
| **API_DOCUMENTATION.md** | All endpoint details with examples | Developers |
| **FINGERPRINT_INTEGRATION.md** | Scanner SDK integration | DevOps/Hardware team |
| **TROUBLESHOOTING.md** | Solutions for common issues | When things break |
| **DEVELOPMENT.md** | Code structure & extensions | Backend/Frontend devs |
| **SETUP.md** (this file) | File reference & overview | Quick navigation |

## 🔧 Configuration

### Environment Variables (`.env`)
```env
PORT=5000                          # Backend port
DB_HOST=localhost                  # MySQL host
DB_PORT=3306                       # MySQL port
DB_USER=root                       # MySQL user
DB_PASSWORD=                       # MySQL password
DB_NAME=dtrs_db                    # Database name
JWT_SECRET=your-secret-key         # JWT signing key
ADMIN_USERNAME=admin               # Default admin username
ADMIN_PASSWORD=admin123            # Default admin password
```

### Frontend Configuration (`vite.config.js`)
```javascript
server: {
  port: 3000,                      // Frontend port
  proxy: {
    '/api': {
      target: 'http://localhost:5000',  // Backend URL
      changeOrigin: true
    }
  }
}
```

## 🐳 Docker Setup (Optional)

Use `docker-compose.yml` to run MySQL + phpMyAdmin:

```bash
docker-compose up
```

Includes:
- MySQL 8.0 with auto-initialization
- phpMyAdmin for database management
- Persistent data volume
- Health checks

## 📦 Dependencies

### Backend (Node.js)
- **express** - Web framework
- **mysql2** - MySQL driver
- **cors** - Cross-origin requests
- **dotenv** - Environment variables
- **jsonwebtoken** - JWT authentication
- **bcryptjs** - Password hashing

### Frontend (React)
- **react** - UI framework
- **react-router-dom** - Routing
- **axios** - HTTP client
- **vite** - Build tool

## 🔐 Security Features

✓ JWT token authentication
✓ Password hashing (bcrypt)
✓ SQL injection prevention (parameterized queries)
✓ CORS protection
✓ Input validation
✓ Server-side timestamp verification

## 📈 Performance Optimizations

✓ Database indexes on frequently queried columns
✓ Connection pooling (10 concurrent connections)
✓ Vite hot module replacement (HMR)
✓ React functional components and hooks
✓ CSS scoping per component

## 🔮 Future Enhancements

**High Priority:**
- Full fingerprint scanner integration
- Real-time Socket.io notifications
- Attendance reports and analytics
- Email/SMS notifications

**Medium Priority:**
- Multi-admin support with roles
- CSV/Excel data export
- Mobile app (React Native)
- Advanced search filters

**Low Priority:**
- Multi-language support
- Theme customization
- Data visualization dashboards

## 🆘 Getting Help

1. Check **QUICK_START.md** for setup issues
2. Review **API_DOCUMENTATION.md** for endpoint questions
3. Read **TROUBLESHOOTING.md** for specific errors
4. See **DEVELOPMENT.md** for extending the code
5. Refer to **README.md** for complete overview

## 📝 Typical Workflow

### Admin Setup
1. Start backend & frontend
2. Login at `/admin/login`
3. Register students in Student Management
4. Configure RFID/Fingerprint in Settings

### Student Usage
1. Go to Kiosk at `/`
2. Scan ID or enter manually
3. System displays name & time
4. Automatic log recorded

### Data Management
1. View logs in Admin Dashboard
2. Check database in phpMyAdmin
3. Export data as needed

## 🎯 Success Criteria

- ✓ Backend running on port 5000
- ✓ Frontend running on port 3000
- ✓ MySQL database created with 3 tables
- ✓ Student can be registered
- ✓ Time can be logged with alternation
- ✓ Admin settings can be toggled
- ✓ Server time displayed correctly

## 📞 Support Resources

- **MySQL Documentation**: https://dev.mysql.com/doc/
- **Express.js Guide**: https://expressjs.com/
- **React Documentation**: https://react.dev/
- **Vite Documentation**: https://vitejs.dev/
- **Node.js API**: https://nodejs.org/api/

---

**Last Updated:** June 2024
**Version:** 1.0.0
**Status:** Production Ready

## 🎉 You're All Set!

Everything is ready to run. Start with **QUICK_START.md** and follow the 5 steps to get the system up and running in minutes.

For detailed configuration, see **SETUP_WINDOWS.md** or relevant OS guide.
