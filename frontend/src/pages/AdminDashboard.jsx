import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AdminDashboard.css';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('students');
  const [students, setStudents] = useState([]);
  const [settings, setSettings] = useState({ enable_rfid: true, enable_fingerprint: false });
  const [newStudent, setNewStudent] = useState({ id_number: '', name: '', profile_picture: null, wallpaper: null });
  const [editingStudent, setEditingStudent] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: '', status: '', profile_picture: null, wallpaper: null });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [timeLogs, setTimeLogs] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const navigate = useNavigate();

  const token = localStorage.getItem('admin_token');
  const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    if (activeTab === 'students') {
      fetchStudents();
    } else if (activeTab === 'settings') {
      fetchSettings();
    } else if (activeTab === 'timelogs') {
      fetchStudents();
    }
  }, [activeTab]);

  const fetchStudents = async () => {
    try {
      const response = await axios.get('/api/students', axiosConfig);
      setStudents(response.data);
    } catch (error) {
      showMessage('Failed to fetch students', 'error');
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await axios.get('/api/settings');
      setSettings(response.data);
    } catch (error) {
      showMessage('Failed to fetch settings', 'error');
    }
  };

  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleFileChange = (e, fileType, isEdit = false) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64String = event.target.result;
        if (isEdit) {
          setEditFormData(prev => ({ ...prev, [fileType]: base64String }));
        } else {
          setNewStudent(prev => ({ ...prev, [fileType]: base64String }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const fetchTimeLogs = async (studentId) => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        `/api/students/${studentId}/timelogs`,
        axiosConfig
      );
      setTimeLogs(response.data);
      setSelectedStudent(students.find(s => s.id_number === studentId));
    } catch (error) {
      showMessage('Failed to fetch time logs', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterStudent = async (e) => {
    e.preventDefault();

    if (!newStudent.id_number || !newStudent.name) {
      showMessage('Please fill all fields', 'error');
      return;
    }

    setIsLoading(true);
    try {
      await axios.post('/api/students', newStudent, axiosConfig);
      showMessage('Student registered successfully', 'success');
      setNewStudent({ id_number: '', name: '', profile_picture: null, wallpaper: null });
      fetchStudents();
    } catch (error) {
      showMessage(error.response?.data?.error || 'Failed to register student', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteStudent = async (id_number) => {
    if (!window.confirm(`Are you sure you want to delete student ${id_number}?`)) {
      return;
    }

    try {
      await axios.delete(`/api/students/${id_number}`, axiosConfig);
      showMessage('Student deleted successfully', 'success');
      fetchStudents();
    } catch (error) {
      showMessage('Failed to delete student', 'error');
    }
  };

  const handleToggleSetting = async (key) => {
    setIsLoading(true);
    try {
      await axios.put(
        `/api/settings/${key}`,
        { value: !settings[key] },
        axiosConfig
      );
      setSettings(prev => ({ ...prev, [key]: !prev[key] }));
      showMessage('Setting updated successfully', 'success');
    } catch (error) {
      showMessage('Failed to update setting', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    navigate('/admin/login');
  };

  const handleEditStudent = (student) => {
    setEditingStudent(student.id_number);
    setEditFormData({
      name: student.name,
      status: student.status,
      profile_picture: null,
      wallpaper: null
    });
  };

  const handleUpdateStudent = async (e) => {
    e.preventDefault();

    if (!editFormData.name) {
      showMessage('Please fill in the name', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const updateData = {
        name: editFormData.name,
        status: editFormData.status
      };

      // Only include images if they were changed
      if (editFormData.profile_picture) {
        updateData.profile_picture = editFormData.profile_picture;
      }
      if (editFormData.wallpaper) {
        updateData.wallpaper = editFormData.wallpaper;
      }

      await axios.put(`/api/students/${editingStudent}`, updateData, axiosConfig);
      showMessage('Student updated successfully', 'success');
      setEditingStudent(null);
      setEditFormData({ name: '', status: '', profile_picture: null, wallpaper: null });
      fetchStudents();
    } catch (error) {
      showMessage(error.response?.data?.error || 'Failed to update student', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingStudent(null);
    setEditFormData({ name: '', status: '', profile_picture: null, wallpaper: null });
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>DTRS Admin Dashboard</h1>
        <button onClick={handleLogout} className="logout-btn">LOGOUT</button>
      </div>

      <div className="admin-tabs">
        <button
          className={`tab ${activeTab === 'students' ? 'active' : ''}`}
          onClick={() => setActiveTab('students')}
        >
          Student Management
        </button>
        <button
          className={`tab ${activeTab === 'timelogs' ? 'active' : ''}`}
          onClick={() => setActiveTab('timelogs')}
        >
          Time Logs
        </button>
        <button
          className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          Settings
        </button>
      </div>

      {message && (
        <div className={`message message-${messageType}`}>
          {message}
        </div>
      )}

      <div className="admin-content">
        {activeTab === 'students' && (
          <div className="tab-content">
            <div className="register-section">
              <h2>Register New Student</h2>
              <form onSubmit={handleRegisterStudent} className="register-form">
                <div className="form-group">
                  <label>Student ID Number:</label>
                  <input
                    type="text"
                    value={newStudent.id_number}
                    onChange={(e) => setNewStudent({ ...newStudent, id_number: e.target.value })}
                    placeholder="Enter student ID"
                    disabled={isLoading}
                  />
                </div>
                <div className="form-group">
                  <label>Full Name:</label>
                  <input
                    type="text"
                    value={newStudent.name}
                    onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                    placeholder="Enter full name"
                    disabled={isLoading}
                  />
                </div>
                <div className="form-group">
                  <label>Profile Picture:</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'profile_picture')}
                    disabled={isLoading}
                  />
                  {newStudent.profile_picture && (
                    <div className="image-preview">
                      <img src={newStudent.profile_picture} alt="Profile preview" />
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label>Kiosk Wallpaper:</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'wallpaper')}
                    disabled={isLoading}
                  />
                  {newStudent.wallpaper && (
                    <div className="image-preview">
                      <img src={newStudent.wallpaper} alt="Wallpaper preview" />
                    </div>
                  )}
                </div>
                <button type="submit" disabled={isLoading} className="submit-btn">
                  {isLoading ? 'Registering...' : 'REGISTER STUDENT'}
                </button>
              </form>
            </div>

            <div className="students-list-section">
              <h2>Registered Students ({students.length})</h2>
              <div className="students-table-wrapper">
                <table className="students-table">
                  <thead>
                    <tr>
                      <th>ID Number</th>
                      <th>Name</th>
                      <th>Status</th>
                      <th>Registered</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map(student => (
                      <tr key={student.id_number}>
                        <td>{student.id_number}</td>
                        <td>{student.name}</td>
                        <td><span className={`status ${student.status}`}>{student.status}</span></td>
                        <td>{new Date(student.created_at).toLocaleDateString()}</td>
                        <td className="actions">
                          <button
                            onClick={() => handleEditStudent(student)}
                            className="edit-btn"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteStudent(student.id_number)}
                            className="delete-btn"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {editingStudent && (
              <div className="modal-overlay">
                <div className="modal-content">
                  <div className="modal-header">
                    <h2>Edit Student</h2>
                    <button className="close-btn" onClick={handleCancelEdit}>×</button>
                  </div>
                  <form onSubmit={handleUpdateStudent} className="edit-form">
                    <div className="form-group">
                      <label>Student ID:</label>
                      <input
                        type="text"
                        value={editingStudent}
                        disabled
                        className="disabled-input"
                      />
                    </div>
                    <div className="form-group">
                      <label>Full Name:</label>
                      <input
                        type="text"
                        value={editFormData.name}
                        onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                        disabled={isLoading}
                      />
                    </div>
                    <div className="form-group">
                      <label>Status:</label>
                      <select
                        value={editFormData.status}
                        onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                        disabled={isLoading}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Profile Picture:</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, 'profile_picture', true)}
                        disabled={isLoading}
                      />
                      {editFormData.profile_picture && (
                        <div className="image-preview">
                          <img src={editFormData.profile_picture} alt="Profile preview" />
                        </div>
                      )}
                    </div>
                    <div className="form-group">
                      <label>Kiosk Wallpaper:</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, 'wallpaper', true)}
                        disabled={isLoading}
                      />
                      {editFormData.wallpaper && (
                        <div className="image-preview">
                          <img src={editFormData.wallpaper} alt="Wallpaper preview" />
                        </div>
                      )}
                    </div>
                    <div className="form-actions">
                      <button type="submit" disabled={isLoading} className="submit-btn">
                        {isLoading ? 'Updating...' : 'UPDATE STUDENT'}
                      </button>
                      <button type="button" onClick={handleCancelEdit} className="cancel-btn" disabled={isLoading}>
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'timelogs' && (
          <div className="tab-content">
            <div className="timelogs-section">
              <h2>Student Time Logs & Calendar</h2>
              
              <div className="student-selector">
                <label>Select a Student:</label>
                <select 
                  onChange={(e) => e.target.value && fetchTimeLogs(e.target.value)}
                  disabled={isLoading}
                  defaultValue=""
                >
                  <option value="">-- Choose a student --</option>
                  {students.map(student => (
                    <option key={student.id_number} value={student.id_number}>
                      {student.name} (ID: {student.id_number})
                    </option>
                  ))}
                </select>
              </div>

              {selectedStudent && (
                <>
                  <div className="student-info-card">
                    <h3>{selectedStudent.name}</h3>
                    <p>ID: {selectedStudent.id_number} | Status: {selectedStudent.status}</p>
                  </div>

                  <div className="timelogs-container">
                    <div className="calendar-section">
                      <TimeLogCalendar 
                        timeLogs={timeLogs} 
                        currentMonth={currentMonth}
                        onMonthChange={setCurrentMonth}
                      />
                    </div>

                    <div className="timelogs-list-section">
                      <h3>Recent Time Logs</h3>
                      {timeLogs.length > 0 ? (
                        <div className="timelogs-list">
                          {timeLogs.slice(0, 20).map((log, index) => (
                            <div key={index} className={`log-entry log-${log.type}`}>
                              <div className="log-date">
                                {new Date(log.timestamp).toLocaleDateString()}
                              </div>
                              <div className="log-time">
                                {new Date(log.timestamp).toLocaleTimeString()}
                              </div>
                              <div className="log-type">
                                {log.type === 'time_in' ? '✓ TIME IN' : '⊗ TIME OUT'}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="no-logs">No time logs found for this student.</p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="tab-content">
            <div className="settings-section">
              <h2>System Settings</h2>
              <div className="settings-list">
                <div className="setting-item">
                  <div className="setting-info">
                    <h3>Enable RFID Tapping</h3>
                    <p>Allow students to use RFID cards for time logging</p>
                  </div>
                  <div className="toggle-switch">
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={settings.enable_rfid || false}
                        onChange={() => handleToggleSetting('enable_rfid')}
                        disabled={isLoading}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <h3>Enable Fingerprint Scanning</h3>
                    <p>Require fingerprint verification for time logging</p>
                  </div>
                  <div className="toggle-switch">
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={settings.enable_fingerprint || false}
                        onChange={() => handleToggleSetting('enable_fingerprint')}
                        disabled={isLoading}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="settings-info-box">
                <h3>Information</h3>
                <ul>
                  <li><strong>RFID Enabled:</strong> {settings.enable_rfid ? '✓ Yes' : '✗ No'}</li>
                  <li><strong>Fingerprint Enabled:</strong> {settings.enable_fingerprint ? '✓ Yes' : '✗ No'}</li>
                </ul>
                <p className="info-note">
                  Disable RFID to prevent automatic ID scanning, requiring manual entry only.
                  Enable fingerprint to add an additional security layer requiring fingerprint verification.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Calendar Component for Time Logs
function TimeLogCalendar({ timeLogs, currentMonth, onMonthChange }) {
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getDaysWithLogs = () => {
    return timeLogs.reduce((acc, log) => {
      const date = new Date(log.timestamp).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { time_in: 0, time_out: 0 };
      }
      acc[date][log.type]++;
      return acc;
    }, {});
  };

  const daysWithLogs = getDaysWithLogs();
  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDayOfMonth = getFirstDayOfMonth(currentMonth);
  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  const handlePrevMonth = () => {
    onMonthChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    onMonthChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  return (
    <div className="calendar-widget">
      <div className="calendar-header">
        <button onClick={handlePrevMonth} className="month-nav">← Prev</button>
        <h3>{monthName}</h3>
        <button onClick={handleNextMonth} className="month-nav">Next →</button>
      </div>

      <div className="calendar-grid">
        <div className="weekdays">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="weekday">{day}</div>
          ))}
        </div>

        <div className="days-grid">
          {days.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="empty-day"></div>;
            }

            const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const logData = daysWithLogs[dateStr];
            const hasLog = logData !== undefined;

            return (
              <div
                key={day}
                className={`calendar-day ${hasLog ? 'has-log' : ''}`}
                title={hasLog ? `In: ${logData.time_in}, Out: ${logData.time_out}` : 'No logs'}
              >
                <div className="day-number">{day}</div>
                {hasLog && (
                  <div className="log-indicator">
                    {logData.time_in > 0 && <span className="log-in">✓</span>}
                    {logData.time_out > 0 && <span className="log-out">⊗</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="calendar-legend">
        <div className="legend-item"><span className="legend-in">✓</span> Time In</div>
        <div className="legend-item"><span className="legend-out">⊗</span> Time Out</div>
      </div>
    </div>
  );
}

export default AdminDashboard;
