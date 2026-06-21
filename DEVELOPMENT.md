# DTRS Development Guide

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Layer (Browser)                   │
│                                                             │
│  React Components (Vite):                                  │
│  ├── KioskScreen (Public)                                  │
│  ├── AdminLogin                                             │
│  └── AdminDashboard                                         │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/REST
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Application Layer (Node.js/Express)            │
│                                                             │
│  Middleware:                                                │
│  ├── CORS                                                   │
│  ├── JSON Parser                                            │
│  ├── JWT Authentication                                     │
│  └── Error Handler                                          │
│                                                             │
│  Routes:                                                    │
│  ├── Public API                                             │
│  ├── Admin API                                              │
│  └── Settings API                                           │
└────────────────────────┬────────────────────────────────────┘
                         │ SQL
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Data Layer (MySQL Database)                    │
│                                                             │
│  Tables:                                                    │
│  ├── students                                               │
│  ├── time_logs                                              │
│  └── settings                                               │
└─────────────────────────────────────────────────────────────┘
```

## Codebase Structure

### Backend (Node.js/Express)

**File: `backend/server.js`**

Key sections:
```javascript
// 1. Imports & Setup (lines 1-20)
// 2. Express App Initialization (lines 22-30)
// 3. MySQL Pool Configuration (lines 32-45)
// 4. Database Initialization (lines 47-90)
// 5. Middleware (lines 92-110)
// 6. Public Routes (lines 112-150)
// 7. Admin Routes (lines 152-220)
// 8. Server Start (lines 222-230)
```

**Adding New Endpoints:**

```javascript
// Example: Add new endpoint
app.post('/api/new-endpoint', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    // Your logic here
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Operation failed' });
  } finally {
    connection.release();
  }
});
```

### Frontend (Vite + React)

**File Structure:**
- `src/main.jsx` - Entry point
- `src/App.jsx` - Router configuration
- `src/pages/` - Page components
- `src/components/` - Reusable components (future)
- `src/styles/` - Global styles

**Adding New Page:**

```jsx
// src/pages/NewPage.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import './NewPage.css';

function NewPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await axios.get('/api/endpoint');
      setData(response.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="page-container">
      {/* Component JSX */}
    </div>
  );
}

export default NewPage;
```

**Add Route in `App.jsx`:**

```jsx
<Route path="/new-page" element={<NewPage />} />
```

## Database Design

### Current Schema

```sql
-- students: Student registration
CREATE TABLE students (
  id_number VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- time_logs: Attendance tracking
CREATE TABLE time_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id VARCHAR(50) NOT NULL,
  type ENUM('time_in', 'time_out') NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  date DATE GENERATED ALWAYS AS (DATE(timestamp)) STORED,
  FOREIGN KEY (student_id) REFERENCES students(id_number) ON DELETE CASCADE,
  INDEX idx_student_date (student_id, date)
);

-- settings: Feature toggles
CREATE TABLE settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value VARCHAR(255) NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Extending Schema

**Adding Fingerprint Table:**

```sql
CREATE TABLE fingerprints (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id VARCHAR(50) NOT NULL UNIQUE,
  fingerprint_data LONGBLOB NOT NULL,
  enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id_number) ON DELETE CASCADE
);
```

**Adding Class/Department:**

```sql
ALTER TABLE students ADD COLUMN class VARCHAR(50);
ALTER TABLE students ADD COLUMN department VARCHAR(100);

CREATE TABLE departments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE students
ADD FOREIGN KEY (department) REFERENCES departments(name);
```

## Common Development Tasks

### 1. Adding a New Field to Students

**Database:**
```sql
ALTER TABLE students ADD COLUMN phone VARCHAR(20);
```

**Backend API:**
```javascript
// Update POST endpoint
const { id_number, name, phone } = req.body;
await connection.execute(
  'INSERT INTO students (id_number, name, phone, status) VALUES (?, ?, ?, ?)',
  [id_number, name, phone, 'active']
);
```

**Frontend:**
```jsx
const [newStudent, setNewStudent] = useState({
  id_number: '',
  name: '',
  phone: ''  // Add this
});

// In form:
<input
  type="tel"
  value={newStudent.phone}
  onChange={(e) => setNewStudent({...newStudent, phone: e.target.value})}
  placeholder="Enter phone number"
/>
```

### 2. Adding a New Report

**Backend Endpoint:**
```javascript
app.get('/api/reports/attendance', authenticateToken, async (req, res) => {
  const { start_date, end_date } = req.query;
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(`
      SELECT 
        s.id_number,
        s.name,
        COUNT(CASE WHEN tl.type = 'time_in' THEN 1 END) as days_present,
        COUNT(CASE WHEN tl.type = 'time_out' THEN 1 END) as proper_checkouts
      FROM students s
      LEFT JOIN time_logs tl ON s.id_number = tl.student_id
      WHERE tl.date BETWEEN ? AND ?
      GROUP BY s.id_number
      ORDER BY s.name
    `, [start_date, end_date]);
    res.json(rows);
  } finally {
    connection.release();
  }
});
```

**Frontend Component:**
```jsx
const [report, setReport] = useState([]);

const generateReport = async () => {
  const response = await axios.get('/api/reports/attendance', {
    params: { start_date: '2024-01-01', end_date: '2024-12-31' },
    headers: { Authorization: `Bearer ${token}` }
  });
  setReport(response.data);
};
```

### 3. Adding Real-time Notifications (Socket.io)

**Backend:**
```bash
npm install socket.io
```

```javascript
import { Server } from 'socket.io';

const io = new Server(server, {
  cors: { origin: 'http://localhost:3000' }
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Emit time log event
  socket.on('timelog-created', (data) => {
    io.emit('timelog-updated', data);
  });
});
```

**Frontend:**
```jsx
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

useEffect(() => {
  socket.on('timelog-updated', (data) => {
    console.log('Time log updated:', data);
    // Update UI
  });
}, []);
```

## Testing Strategies

### Backend Testing

```bash
# Install testing framework
npm install --save-dev jest supertest

# Create test file: backend/__tests__/api.test.js
const request = require('supertest');
const app = require('../server');

describe('GET /api/time', () => {
  it('should return current time', async () => {
    const res = await request(app).get('/api/time');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('time');
  });
});
```

### Frontend Testing

```bash
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom

# Create test: src/__tests__/KioskScreen.test.jsx
import { render, screen } from '@testing-library/react';
import KioskScreen from '../pages/KioskScreen';

describe('KioskScreen', () => {
  it('should render student input', () => {
    render(<KioskScreen />);
    expect(screen.getByPlaceholderText(/Scan ID/)).toBeInTheDocument();
  });
});
```

## Performance Optimization

### Database Optimization

```sql
-- Add indexes for slow queries
CREATE INDEX idx_date_type ON time_logs(date, type);
CREATE INDEX idx_student_id ON time_logs(student_id);

-- Analyze query performance
EXPLAIN SELECT * FROM time_logs WHERE student_id = '2024001' AND date = '2024-06-21';
```

### Backend Optimization

```javascript
// 1. Connection pooling (already implemented)
// 2. Add response caching
const cache = new Map();

app.get('/api/settings', (req, res) => {
  if (cache.has('settings')) {
    return res.json(cache.get('settings'));
  }
  // ... fetch from DB
  cache.set('settings', data);
});

// 3. Add pagination for large result sets
app.get('/api/students', authenticateToken, async (req, res) => {
  const page = req.query.page || 1;
  const limit = 10;
  const offset = (page - 1) * limit;
  // ... fetch with LIMIT and OFFSET
});
```

### Frontend Optimization

```javascript
// 1. Code splitting
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

// 2. Memoization
const StudentList = memo(({ students }) => {
  return students.map(s => <StudentCard key={s.id_number} student={s} />);
});

// 3. API response caching
const queryClient = new QueryClient();
// Use React Query for intelligent caching
```

## Security Considerations

### Input Validation

```javascript
// Validate on backend before DB insert
function validateStudentInput(id_number, name) {
  if (!id_number || id_number.length > 50) {
    throw new Error('Invalid ID number');
  }
  if (!name || name.length > 255) {
    throw new Error('Invalid name');
  }
  if (!/^[a-zA-Z0-9\s\-\.]+$/.test(name)) {
    throw new Error('Invalid characters in name');
  }
  return true;
}
```

### SQL Injection Prevention

```javascript
// ✓ Safe: Using parameterized queries
await connection.execute(
  'SELECT * FROM students WHERE id_number = ?',
  [studentId]
);

// ✗ Unsafe: String concatenation
await connection.execute(
  `SELECT * FROM students WHERE id_number = '${studentId}'`
);
```

### Password Security

```javascript
import bcrypt from 'bcryptjs';

// Hash password
const hashedPassword = bcrypt.hashSync(password, 10);

// Compare password
const isMatch = bcrypt.compareSync(password, hashedPassword);
```

## Deployment Checklist

- [ ] Update all `.env` variables
- [ ] Set strong `JWT_SECRET`
- [ ] Change default admin credentials
- [ ] Enable HTTPS
- [ ] Set up database backups
- [ ] Configure logging
- [ ] Test all endpoints
- [ ] Build frontend (`npm run build`)
- [ ] Set up CI/CD pipeline
- [ ] Configure monitoring
- [ ] Document API endpoints
- [ ] Create admin guide

## Future Enhancements Priority

### High Priority
1. Fingerprint scanner full integration
2. Real-time Socket.io notifications
3. Attendance reports/analytics
4. Email notifications

### Medium Priority
1. Multi-admin support with roles
2. Data export (CSV/Excel/PDF)
3. Mobile app (React Native)
4. Advanced search and filters

### Low Priority
1. Biometric template storage
2. Machine learning for patterns
3. Multi-language support
4. Theme customization

## Useful npm Packages

### Backend
- `express-rate-limit` - Rate limiting
- `helmet` - Security headers
- `compression` - Response compression
- `morgan` - HTTP logging
- `joi` - Data validation

### Frontend
- `react-query` - Data fetching
- `zustand` - State management
- `date-fns` - Date utilities
- `react-hook-form` - Form management
- `classnames` - CSS class helpers

## Resources

- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [React Documentation](https://react.dev)
- [MySQL Documentation](https://dev.mysql.com/doc/)
- [Express.js Guide](https://expressjs.com/)
- [Vite Documentation](https://vitejs.dev/)
