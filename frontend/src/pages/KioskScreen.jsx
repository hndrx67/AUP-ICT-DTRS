import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './KioskScreen.css';

// Helper function to detect image format from base64
function detectImageFormat(base64String) {
  if (!base64String) return 'image/jpeg';
  
  // Check base64 magic numbers (first few characters after decoding)
  const header = base64String.substring(0, 10);
  
  if (header.startsWith('/9j/')) return 'image/jpeg';
  if (header.startsWith('iVBORw0KG')) return 'image/png';
  if (header.startsWith('R0lGODlh')) return 'image/gif';
  if (header.startsWith('UklGRi')) return 'image/webp';
  
  // Default to JPEG
  return 'image/jpeg';
}

function KioskScreen() {
  const [studentId, setStudentId] = useState('');
  const [studentInfo, setStudentInfo] = useState(null);
  const [systemTime, setSystemTime] = useState(new Date());
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [settings, setSettings] = useState({ enable_rfid: true, enable_fingerprint: false });
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef(null);

  // Fetch settings on mount
  useEffect(() => {
    fetchSettings();
  }, []);

  // Update system time every second
  useEffect(() => {
    const timer = setInterval(async () => {
      try {
        const response = await axios.get('/api/time');
        setSystemTime(new Date(response.data.time));
      } catch (error) {
        setSystemTime(new Date());
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Auto-focus input
  useEffect(() => {
    if (inputRef.current && !studentInfo) {
      inputRef.current.focus();
    }
  }, [studentInfo]);

  const fetchSettings = async () => {
    try {
      const response = await axios.get('/api/settings');
      setSettings(response.data);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const handleStudentIdChange = (e) => {
    setStudentId(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent double submission if already processing
    if (isLoading || studentInfo) {
      return;
    }
    
    if (!studentId.trim()) {
      setMessage('Please enter a student ID');
      setMessageType('error');
      return;
    }

    // Check if RFID is enabled (if coming from RFID)
    if (!settings.enable_rfid && !confirm('RFID is disabled. Continue with manual entry?')) {
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      // Fetch student info
      const studentResponse = await axios.get(`/api/students/${studentId}`);
      const student = studentResponse.data;
      
      // Debug: Log what we received
      console.log('Student data received:', {
        id: student.id_number,
        name: student.name,
        hasProfilePicture: !!student.profile_picture,
        hasWallpaper: !!student.wallpaper,
        profilePictureLength: student.profile_picture ? student.profile_picture.length : 0,
        wallpaperLength: student.wallpaper ? student.wallpaper.length : 0
      });

      // Get current server time
      const timeResponse = await axios.get('/api/time');
      const serverTime = new Date(timeResponse.data.time);
      setSystemTime(serverTime);

      // Display student info
      setStudentInfo({
        ...student,
        timestamp: serverTime
      });
      setMessage(`Welcome, ${student.name}!`);
      setMessageType('success');

      // Create time log entry (this will automatically toggle between time_in and time_out)
      try {
        const logResponse = await axios.post('/api/timelogs', {
          student_id: studentId
        });
        
        const logType = logResponse.data.type;
        
        // Update student info with log type
        setStudentInfo(prevState => ({
          ...prevState,
          logType: logType
        }));
        
        // Show the log type message after 1 second
        setTimeout(() => {
          const displayMessage = logType === 'time_in' 
            ? `✓ TIMED IN` 
            : `✗ TIMED OUT`;
          setMessage(displayMessage);
          setMessageType('success');
        }, 1000);

        // Reset form after 4 seconds to allow user to see the message
        setTimeout(() => {
          setStudentId('');
          setStudentInfo(null);
          setMessage('');
          setIsLoading(false);
          if (inputRef.current) {
            inputRef.current.focus();
          }
        }, 4000);
      } catch (logError) {
        console.error('Time log error:', logError);
        setMessage('Student found but failed to record time log');
        setMessageType('error');
        setIsLoading(false);
        
        // Reset on error
        setTimeout(() => {
          setStudentId('');
          setStudentInfo(null);
          setMessage('');
          if (inputRef.current) {
            inputRef.current.focus();
          }
        }, 2000);
      }
    } catch (error) {
      if (error.response?.status === 404) {
        setMessage('Student not found');
      } else {
        setMessage('Error retrieving student information');
      }
      setMessageType('error');
      setIsLoading(false);
      
      // Reset after error
      setTimeout(() => {
        setStudentId('');
        setStudentInfo(null);
        setMessage('');
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 2000);
    }
  };

  return (
    <div className="kiosk-container">
      <div className="kiosk-header">
        <h1>AUP - Daily Time Record</h1>
        <div className="system-time">
          {systemTime.toLocaleTimeString()}
        </div>
      </div>

      <div className="kiosk-content">
        <form onSubmit={handleSubmit} className="input-form">
          <div className="form-group">
            <label htmlFor="studentId">Enter Student ID:</label>
            <input
              ref={inputRef}
              type="text"
              id="studentId"
              value={studentId}
              onChange={handleStudentIdChange}
              placeholder="Scan ID or type manually"
              disabled={isLoading}
              autoComplete="off"
              className="id-input"
            />
          </div>
          <button type="submit" disabled={isLoading} className="submit-btn">
            {isLoading ? 'Processing...' : 'SUBMIT'}
          </button>
        </form>

        {message && (
          <div className={`message message-${messageType}`}>
            {message}
          </div>
        )}
      </div>

      {/* Student ID Card Modal */}
      {studentInfo && (
        <div className="id-card-modal-overlay">
          <div 
            className="id-card-modal"
            style={studentInfo.wallpaper ? {
              backgroundImage: `url(data:${detectImageFormat(studentInfo.wallpaper)};base64,${studentInfo.wallpaper})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            } : {}}
          >
            {/* Left Section - Profile Picture */}
            <div className="id-card-left">
              {studentInfo.profile_picture ? (
                <img 
                  src={`data:${detectImageFormat(studentInfo.profile_picture)};base64,${studentInfo.profile_picture}`}
                  alt={studentInfo.name}
                  className="id-card-profile-picture"
                  onError={(e) => {
                    console.error('Failed to load profile picture');
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                <div className="id-card-profile-placeholder">
                  <div className="placeholder-text">{studentInfo.name.charAt(0).toUpperCase()}</div>
                </div>
              )}
            </div>

            {/* Right Section - Student Info */}
            <div className="id-card-right">
              {studentInfo.logType && (
                <div className={`id-card-indicator id-card-${studentInfo.logType}`}>
                  {studentInfo.logType === 'time_in' ? '→ TIMING IN' : '← TIMING OUT'}
                </div>
              )}
              <div className="id-card-info">
                <h2 className="id-card-name">{studentInfo.name}</h2>
                <div className="id-card-id">
                  <span className="label">ID:</span>
                  <span className="value">{studentInfo.id_number}</span>
                </div>
                <div className="id-card-status">
                  <span className="label">Status:</span>
                  <span className="value">{studentInfo.status || 'Active'}</span>
                </div>
                <div className="id-card-time">
                  <span className="label">Time:</span>
                  <span className="value">{studentInfo.timestamp.toLocaleTimeString()}</span>
                </div>
                <div className="id-card-date">
                  <span className="label">Date:</span>
                  <span className="value">{studentInfo.timestamp.toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="kiosk-footer">
        <p>Status: {settings.enable_rfid ? '✓ RFID Enabled' : '✗ RFID Disabled'} | 
           {settings.enable_fingerprint ? '✓ Fingerprint Enabled' : '✗ Fingerprint Disabled'}</p>
      </div>
    </div>
  );
}

export default KioskScreen;
