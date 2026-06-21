import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './KioskScreen.css';

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
        
        // Show the log type message after 1 second
        setTimeout(() => {
          const logType = logResponse.data.type;
          const displayMessage = logType === 'time_in' 
            ? `✓ ${student.name} TIMED IN` 
            : `✗ ${student.name} TIMED OUT`;
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
        <h1>DTRS - Kiosk</h1>
        <div className="system-time">
          {systemTime.toLocaleTimeString()}
        </div>
      </div>

      <div className="kiosk-content">
        {!studentInfo ? (
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
        ) : (
          <div className="student-display">
            <div className="welcome-message">
              <h2>Welcome!</h2>
            </div>
            <div className="student-name">
              <p>{studentInfo.name}</p>
            </div>
            <div className="system-timestamp">
              <p>{studentInfo.timestamp.toLocaleString()}</p>
            </div>
          </div>
        )}

        {message && (
          <div className={`message message-${messageType}`}>
            {message}
          </div>
        )}
      </div>

      <div className="kiosk-footer">
        <p>Status: {settings.enable_rfid ? '✓ RFID Enabled' : '✗ RFID Disabled'} | 
           {settings.enable_fingerprint ? '✓ Fingerprint Enabled' : '✗ Fingerprint Disabled'}</p>
      </div>
    </div>
  );
}

export default KioskScreen;
