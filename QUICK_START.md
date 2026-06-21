# Quick Start Guide for DTRS

## 1. Install Node.js Dependencies

### Backend
```bash
cd backend
npm install
```

### Frontend
```bash
cd frontend
npm install
```

## 2. Set Up MySQL Database

### Option A: Automatic (via Backend Server)
The backend server will automatically create all tables when started. Just ensure MySQL is running and the database `dtrs_db` exists.

Create the database:
```sql
CREATE DATABASE dtrs_db;
```

### Option B: Manual (via phpMyAdmin)
1. Open phpMyAdmin
2. Click on "SQL" tab
3. Copy and paste the contents of `database_schema.sql`
4. Click "Go"

## 3. Configure Environment

Backend `.env` file (copy from `.env.example`):
```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=dtrs_db
JWT_SECRET=your_jwt_secret_key_here
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

Update with your MySQL credentials if different from defaults.

## 4. Start Services

### Terminal 1: Start Backend
```bash
cd backend
npm start
```
✓ Server running on http://localhost:5000

### Terminal 2: Start Frontend
```bash
cd frontend
npm run dev
```
✓ Frontend running on http://localhost:3000

## 5. Access the System

### Public Kiosk Screen
Navigate to: `http://localhost:3000`

### Admin Dashboard
Navigate to: `http://localhost:3000/admin/login`
- Default username: `admin`
- Default password: `admin123`

## First Steps

1. **Register a student** in the Admin Dashboard:
   - Go to Student Management tab
   - Enter ID number (e.g., "2024001")
   - Enter full name (e.g., "John Doe")
   - Click "REGISTER STUDENT"

2. **Test the kiosk**:
   - Go to the public kiosk at `http://localhost:3000`
   - Enter the student ID (e.g., "2024001")
   - Press Enter
   - You should see the student's name and time logged

3. **Configure settings** (optional):
   - In Admin Dashboard, go to Settings tab
   - Toggle RFID and Fingerprint features as needed

## RFID Scanner Setup

If using an RFID scanner that emulates HID keyboard:
1. Ensure "Enable RFID Tapping" is ON in settings
2. Focus the kiosk input field
3. Scan the RFID card
4. The system will automatically process the scan

## Troubleshooting

### Connection Refused Error
```
Error: connect ECONNREFUSED 127.0.0.1:3306
```
- Make sure MySQL is running
- Verify database credentials in `.env`

### Port 5000 Already in Use
```bash
# Change PORT in .env to 5001 or another available port
```

### Node Modules Issues
```bash
# Delete node_modules and reinstall
rm -rf node_modules
npm install
```

### CORS Error
- Ensure backend is running on `http://localhost:5000`
- Check Vite proxy configuration in `frontend/vite.config.js`

## Development Mode with Auto-Reload

### Backend (with nodemon)
```bash
cd backend
npm run dev
```

### Frontend (with Vite)
```bash
cd frontend
npm run dev
```

## Database Management

### View/Edit Data via phpMyAdmin
1. Open `http://localhost/phpmyadmin`
2. Login with MySQL credentials
3. Select `dtrs_db` database
4. Browse tables: `students`, `time_logs`, `settings`

### Bulk Import Students
1. In phpMyAdmin, select `dtrs_db` → `students` table
2. Click "Import" tab
3. Upload CSV file with columns: `id_number`, `name`, `status`

## Production Deployment

Before deploying:
1. Change `ADMIN_USERNAME` and `ADMIN_PASSWORD` in `.env`
2. Change `JWT_SECRET` to a strong random string
3. Use a production MySQL database with backups
4. Build frontend: `cd frontend && npm run build`
5. Serve the `dist` folder with your web server

## Support

For issues or questions, refer to the main [README.md](README.md)
