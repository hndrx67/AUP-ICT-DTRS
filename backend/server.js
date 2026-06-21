import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware
app.use(cors());
app.use(express.json());

// MySQL Connection Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'dtrs_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Initialize Database Tables
async function initializeDatabase() {
  const connection = await pool.getConnection();
  try {
    // Create students table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS students (
        id_number VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create time_logs table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS time_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id VARCHAR(50) NOT NULL,
        type ENUM('time_in', 'time_out') NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        date DATE GENERATED ALWAYS AS (DATE(timestamp)) STORED,
        FOREIGN KEY (student_id) REFERENCES students(id_number) ON DELETE CASCADE,
        INDEX idx_student_date (student_id, date)
      )
    `);

    // Create settings table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        key VARCHAR(100) UNIQUE NOT NULL,
        value VARCHAR(255) NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Insert default settings if they don't exist
    await connection.execute(`
      INSERT IGNORE INTO settings (key, value) VALUES 
      ('enable_rfid', 'true'),
      ('enable_fingerprint', 'false')
    `);

    console.log('✓ Database tables initialized');
  } catch (error) {
    console.error('Database initialization error:', error);
  } finally {
    connection.release();
  }
}

// Middleware: Authentication
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
}

// Routes

// Public: Get system time
app.get('/api/time', (req, res) => {
  res.json({ time: new Date() });
});

// Public: Get student by ID
app.get('/api/students/:id_number', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(
      'SELECT id_number, name, status FROM students WHERE id_number = ?',
      [req.params.id_number]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  } finally {
    connection.release();
  }
});

// Public: Get settings
app.get('/api/settings', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute('SELECT key, value FROM settings');
    const settings = {};
    rows.forEach(row => {
      settings[row.key] = row.value === 'true';
    });
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  } finally {
    connection.release();
  }
});

// Public: Create time log entry
app.post('/api/timelogs', async (req, res) => {
  const { student_id } = req.body;

  if (!student_id) {
    return res.status(400).json({ error: 'student_id is required' });
  }

  const connection = await pool.getConnection();
  try {
    console.log(`\n========== TIME LOG REQUEST ==========`);
    console.log(`Student ID: ${student_id}`);
    console.log(`Current JS Date: ${new Date()}`);

    // Get the MOST RECENT log entry for this student TODAY (using local date, not UTC)
    const [lastLog] = await connection.execute(
      'SELECT id, student_id, type, timestamp FROM time_logs WHERE student_id = ? ORDER BY timestamp DESC LIMIT 1',
      [student_id]
    );

    console.log(`Found ${lastLog.length} previous entries for this student`);
    
    if (lastLog.length > 0) {
      console.log(`Last entry:`, {
        id: lastLog[0].id,
        type: lastLog[0].type,
        timestamp: lastLog[0].timestamp
      });
      
      // Check if last entry is from today
      const lastLogDate = new Date(lastLog[0].timestamp);
      const today = new Date();
      const isSameDay = 
        lastLogDate.getFullYear() === today.getFullYear() &&
        lastLogDate.getMonth() === today.getMonth() &&
        lastLogDate.getDate() === today.getDate();
      
      console.log(`Last entry same day as today? ${isSameDay}`);
    }

    // Determine the log type based on last entry
    let logType = 'time_in'; // Default: first entry is always time_in
    
    if (lastLog && lastLog.length > 0) {
      const lastLogDate = new Date(lastLog[0].timestamp);
      const today = new Date();
      
      // Check if entry is from today
      const isSameDay = 
        lastLogDate.getFullYear() === today.getFullYear() &&
        lastLogDate.getMonth() === today.getMonth() &&
        lastLogDate.getDate() === today.getDate();
      
      if (isSameDay) {
        // If last entry is from today, toggle it
        const lastLogType = lastLog[0].type;
        console.log(`Last log from TODAY - type was: ${lastLogType}`);
        
        if (lastLogType === 'time_in') {
          logType = 'time_out'; // Toggle to time out
        } else if (lastLogType === 'time_out') {
          logType = 'time_in'; // Toggle to time in
        }
      } else {
        // If last entry is from a different day, start fresh
        console.log(`Last log from DIFFERENT day - starting fresh with time_in`);
        logType = 'time_in';
      }
    }

    console.log(`Final decision: Setting type to ${logType.toUpperCase()}`);

    // Insert new log entry with current timestamp
    const [result] = await connection.execute(
      'INSERT INTO time_logs (student_id, type) VALUES (?, ?)',
      [student_id, logType]
    );

    console.log(`✓ Entry inserted with ID: ${result.insertId}`);
    console.log(`========== END TIME LOG ==========\n`);

    res.json({
      id: result.insertId,
      type: logType,
      timestamp: new Date(),
      message: logType === 'time_in' ? 'Timed in successfully' : 'Timed out successfully'
    });
  } catch (error) {
    console.error('Time log error:', error);
    res.status(500).json({ error: 'Failed to create time log' });
  } finally {
    connection.release();
  }
});

// Admin: Login
app.post('/api/admin/login', async (req, res) => {
  const { username, password } = req.body;

  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  if (username === adminUsername && password === adminPassword) {
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Admin: Register student
app.post('/api/students', authenticateToken, async (req, res) => {
  const { id_number, name } = req.body;

  if (!id_number || !name) {
    return res.status(400).json({ error: 'id_number and name are required' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.execute(
      'INSERT INTO students (id_number, name, status) VALUES (?, ?, ?)',
      [id_number, name, 'active']
    );

    res.status(201).json({ message: 'Student registered successfully' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'Student ID already exists' });
    } else {
      res.status(500).json({ error: 'Database error' });
    }
  } finally {
    connection.release();
  }
});

// Admin: Get all students
app.get('/api/students', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute('SELECT * FROM students ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  } finally {
    connection.release();
  }
});

// Admin: Update student
app.put('/api/students/:id_number', authenticateToken, async (req, res) => {
  const { name, status } = req.body;
  const connection = await pool.getConnection();
  try {
    await connection.execute(
      'UPDATE students SET name = ?, status = ? WHERE id_number = ?',
      [name, status, req.params.id_number]
    );
    res.json({ message: 'Student updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  } finally {
    connection.release();
  }
});

// Admin: Delete student
app.delete('/api/students/:id_number', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.execute('DELETE FROM students WHERE id_number = ?', [req.params.id_number]);
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  } finally {
    connection.release();
  }
});

// Admin: Update settings
app.put('/api/settings/:key', authenticateToken, async (req, res) => {
  const { value } = req.body;
  const connection = await pool.getConnection();
  try {
    await connection.execute(
      'UPDATE settings SET value = ? WHERE key = ?',
      [value ? 'true' : 'false', req.params.key]
    );
    res.json({ message: 'Setting updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  } finally {
    connection.release();
  }
});

// Admin: Get time logs for a student
app.get('/api/students/:id_number/timelogs', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(
      'SELECT * FROM time_logs WHERE student_id = ? ORDER BY timestamp DESC LIMIT 100',
      [req.params.id_number]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  } finally {
    connection.release();
  }
});

// Initialize DB and start server
initializeDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`✓ Server running on http://localhost:${PORT}`);
  });
});
