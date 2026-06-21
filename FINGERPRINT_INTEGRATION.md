# Fingerprint Scanner Integration Guide

## Overview

The DTRS system is designed to support fingerprint scanning as an additional security layer. When enabled in the settings, the system will require fingerprint verification before recording a time log.

## Architecture

```
┌─────────────────────┐
│   Kiosk Frontend    │
│   (React/Vite)      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────────┐
│     Node.js/Express Backend     │
│                                 │
│  ┌───────────────────────────┐  │
│  │  Fingerprint Middleware   │  │
│  │  (Scanner SDK Bridge)     │  │
│  └───────────────────────────┘  │
│           ▲                      │
│           │                      │
│  ┌────────┴─────────────────┐   │
│  │  Scanner Hardware/SDK    │   │
│  │  (Serial/USB Interface)  │   │
│  └──────────────────────────┘   │
└─────────────────────────────────┘
           │
           ▼
┌─────────────────────┐
│   MySQL Database    │
│                     │
│  - students         │
│  - time_logs        │
│  - fingerprints     │
│  - settings         │
└─────────────────────┘
```

## Implementation Steps

### Step 1: Install Fingerprint Scanner SDK

Choose a scanner library based on your hardware:

```bash
# Example for typical USB fingerprint scanner
npm install node-serialport
npm install fingerprint-recognition  # or your specific SDK
```

### Step 2: Create Fingerprint Middleware

Create `backend/middleware/fingerprintMiddleware.js`:

```javascript
import SerialPort from 'serialport';
import FingerprintScanner from 'fingerprint-scanner';

class FingerprintMiddleware {
  constructor() {
    this.scanner = null;
    this.isInitialized = false;
    this.initialize();
  }

  async initialize() {
    try {
      // Initialize based on your scanner type
      const portPath = process.env.FINGERPRINT_PORT || 'COM3'; // Windows
      this.scanner = new FingerprintScanner({
        port: portPath,
        baudRate: 9600,
      });

      this.isInitialized = true;
      console.log('✓ Fingerprint scanner initialized');
    } catch (error) {
      console.error('Fingerprint scanner initialization failed:', error);
      this.isInitialized = false;
    }
  }

  async captureFingerprint() {
    if (!this.isInitialized) {
      return { success: false, error: 'Scanner not available' };
    }

    try {
      // Wait for fingerprint scan (timeout after 10 seconds)
      const fingerprint = await Promise.race([
        this.scanner.capture(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Scan timeout')), 10000)
        ),
      ]);

      return { success: true, fingerprint };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async verifyFingerprint(enrolledFingerprint) {
    if (!this.isInitialized) {
      return { success: false, error: 'Scanner not available' };
    }

    try {
      const scannedFingerprint = await Promise.race([
        this.scanner.capture(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Scan timeout')), 10000)
        ),
      ]);

      // Compare fingerprints using your SDK's matching algorithm
      const matchScore = await this.scanner.match(
        enrolledFingerprint,
        scannedFingerprint
      );

      // Typically, scores > 50-60 indicate a match (SDK-dependent)
      const isMatched = matchScore > 50;

      return { success: isMatched, matchScore };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

export default new FingerprintMiddleware();
```

### Step 3: Update Time Log Endpoint

Modify the `/api/timelogs` endpoint in `server.js` to check fingerprint:

```javascript
app.post('/api/timelogs', async (req, res) => {
  const { student_id } = req.body;

  if (!student_id) {
    return res.status(400).json({ error: 'student_id is required' });
  }

  const connection = await pool.getConnection();
  try {
    // Check if fingerprint is enabled
    const [settingsRows] = await connection.execute(
      'SELECT value FROM settings WHERE key = ?',
      ['enable_fingerprint']
    );

    const fingerprintRequired =
      settingsRows.length > 0 && settingsRows[0].value === 'true';

    if (fingerprintRequired) {
      // Verify fingerprint before logging time
      const fingerprintResult = await fingerprintMiddleware.verifyFingerprint(
        null // Would use stored fingerprint for this student
      );

      if (!fingerprintResult.success) {
        return res.status(401).json({
          error: 'Fingerprint verification failed',
          details: fingerprintResult.error,
        });
      }
    }

    // Rest of the time logging logic...
    const today = new Date().toISOString().split('T')[0];
    const [lastLog] = await connection.execute(
      'SELECT * FROM time_logs WHERE student_id = ? AND date = ? ORDER BY timestamp DESC LIMIT 1',
      [student_id, today]
    );

    let logType = 'time_in';
    if (lastLog.length > 0 && lastLog[0].type === 'time_in') {
      logType = 'time_out';
    }

    const [result] = await connection.execute(
      'INSERT INTO time_logs (student_id, type) VALUES (?, ?)',
      [student_id, logType]
    );

    res.json({
      id: result.insertId,
      type: logType,
      timestamp: new Date(),
      message: logType === 'time_in' ? 'Timed in successfully' : 'Timed out successfully',
    });
  } catch (error) {
    console.error('Time log error:', error);
    res.status(500).json({ error: 'Failed to create time log' });
  } finally {
    connection.release();
  }
});
```

### Step 4: Create Fingerprints Table

Add to database initialization:

```sql
CREATE TABLE IF NOT EXISTS fingerprints (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id VARCHAR(50) NOT NULL UNIQUE,
  fingerprint_data LONGBLOB NOT NULL,
  enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id_number) ON DELETE CASCADE
);
```

### Step 5: Create Fingerprint Enrollment Endpoint

Add to `server.js`:

```javascript
app.post('/api/students/:id_number/enroll-fingerprint', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    // Capture fingerprint
    const captureResult = await fingerprintMiddleware.captureFingerprint();

    if (!captureResult.success) {
      return res
        .status(400)
        .json({ error: 'Failed to capture fingerprint' });
    }

    // Store in database
    await connection.execute(
      'INSERT INTO fingerprints (student_id, fingerprint_data) VALUES (?, ?)',
      [req.params.id_number, captureResult.fingerprint]
    );

    res.json({ message: 'Fingerprint enrolled successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to enroll fingerprint' });
  } finally {
    connection.release();
  }
});
```

## Supported Scanners

### Common USB Fingerprint Scanners

1. **ZKTeco** (Most common)
   - Package: `zkteco-sdk`
   - Baud Rate: 9600
   - Protocol: Serial/USB

2. **Secugen**
   - Package: `secugen-sdk`
   - Interface: USB HID
   - Secure library

3. **Futronic**
   - Package: `futronic-fp`
   - Interface: USB
   - Real-time scanning

### Environment Variables

Add to `.env`:

```env
FINGERPRINT_ENABLED=true
FINGERPRINT_PORT=COM3           # Windows
# FINGERPRINT_PORT=/dev/ttyUSB0 # Linux
FINGERPRINT_BAUDRATE=9600
FINGERPRINT_TIMEOUT=10000
```

## Frontend Integration

### Update KioskScreen.jsx

Add fingerprint feedback:

```javascript
const [fingerprintStatus, setFingerprintStatus] = useState('');

// In the message display, add:
{fingerprintStatus && (
  <div className={`message message-info`}>
    {fingerprintStatus}
  </div>
)}
```

## Testing Fingerprint Integration

```bash
# Test endpoint
curl -X POST http://localhost:5000/api/timelogs \
  -H "Content-Type: application/json" \
  -d '{"student_id": "2024001"}'
```

## Troubleshooting

### Scanner Not Detected
```javascript
// Check available ports
SerialPort.list().then(ports => {
  ports.forEach(port => {
    console.log(port.path); // List all serial ports
  });
});
```

### Permission Denied (Linux)
```bash
sudo usermod -a -G dialout $USER
# Restart terminal
```

### Match Score Too Low
- Adjust match threshold in `verifyFingerprint()` method
- Ensure proper finger placement on scanner
- Increase scan quality requirements

## Security Considerations

1. **Fingerprint Data Storage**
   - Store encrypted fingerprint templates, not raw data
   - Use encryption at rest

2. **Transmission Security**
   - Always use HTTPS in production
   - Fingerprint data should never be logged

3. **Privacy**
   - Follow GDPR/local privacy regulations
   - Get explicit consent from students
   - Allow easy deletion of fingerprint data

## Reference Documentation

- [node-serialport](https://serialport.io/)
- [Web API Biometrics Standard](https://www.w3.org/TR/webauthn-2/)
- [FIDO2 Specifications](https://fidoalliance.org/)
