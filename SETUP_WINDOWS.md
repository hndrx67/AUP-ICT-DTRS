# Windows Setup Guide for DTRS

## Prerequisites

### Step 1: Install MySQL

1. Download MySQL Community Server from [mysql.com](https://www.mysql.com/downloads/)
2. Run the installer
3. Choose "Developer Default" setup
4. Configure MySQL Server:
   - Port: 3306 (default)
   - MySQL X Protocol Port: 33060 (default)
5. Configure MySQL as a Service (recommended)
6. Root password: Set a strong password (or leave empty for development)

### Step 2: Install Node.js

1. Download Node.js LTS from [nodejs.org](https://nodejs.org/)
2. Run the installer
3. Accept defaults (includes npm)
4. Verify installation:
   ```powershell
   node --version
   npm --version
   ```

### Step 3: Install Git (Optional but recommended)

1. Download from [git-scm.com](https://git-scm.com/)
2. Run the installer with default options

## Installation Steps

### Step 1: Open PowerShell

Press `Win + R`, type `powershell`, and press Enter.

### Step 2: Navigate to Project Directory

```powershell
cd "C:\Users\User\Documents\Code\DTRS"
```

### Step 3: Install All Dependencies

```powershell
npm install
cd backend
npm install
cd ..\frontend
npm install
cd ..
```

Or use the root package.json script:

```powershell
npm run install-all
```

### Step 4: Create and Configure .env

Navigate to backend folder:
```powershell
cd backend
copy .env.example .env
```

Edit `.env` with your MySQL credentials:
```powershell
notepad .env
```

Update these values:
```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=dtrs_db
JWT_SECRET=generate_a_random_string_here
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

### Step 5: Create Database

Open another PowerShell window and open MySQL:

```powershell
mysql -u root -p
```

Enter your MySQL password, then run:

```sql
CREATE DATABASE dtrs_db;
EXIT;
```

## Running the Application

### Option A: Separate PowerShell Windows (Recommended for Development)

**Terminal 1: Backend**
```powershell
cd "C:\Users\User\Documents\Code\DTRS\backend"
npm start
```

**Terminal 2: Frontend**
```powershell
cd "C:\Users\User\Documents\Code\DTRS\frontend"
npm run dev
```

### Option B: Using Docker Compose (Recommended for MySQL)

1. Install Docker Desktop from [docker.com](https://www.docker.com/products/docker-desktop)

2. Run Docker Compose:
   ```powershell
   cd "C:\Users\User\Documents\Code\DTRS"
   docker-compose up
   ```

3. Access:
   - Frontend: `http://localhost:3000`
   - Backend: `http://localhost:5000`
   - phpMyAdmin: `http://localhost:8080`
   - MySQL: `localhost:3306`

### Option C: Single Command with npm

```powershell
cd "C:\Users\User\Documents\Code\DTRS"
npm start
```

This requires `concurrently` to be installed:
```powershell
npm install -g concurrently
```

## Accessing the Application

Once both services are running:

1. **Kiosk Screen**: http://localhost:3000
2. **Admin Login**: http://localhost:3000/admin/login
   - Username: `admin`
   - Password: `admin123`

## Managing MySQL

### Option A: Using Command Line

```powershell
# Connect to MySQL
mysql -u root -p

# Show databases
SHOW DATABASES;

# Select database
USE dtrs_db;

# Show tables
SHOW TABLES;
```

### Option B: Using phpMyAdmin (If using Docker Compose)

1. Open browser to `http://localhost:8080`
2. Username: `root`
3. Password: `root`

### Option C: MySQL Workbench (GUI)

1. Download MySQL Workbench
2. Create new connection to `localhost:3306`
3. Browse and manage databases

## Stopping Services

### PowerShell Windows
Press `Ctrl + C` in each terminal

### Docker Compose
```powershell
docker-compose down
```

## Troubleshooting

### Port Already in Use

If port 5000 or 3000 is already in use:

**Find process using port:**
```powershell
Get-NetTCPConnection -LocalPort 5000 | Select-Object -Property State, OwningProcess
taskkill /PID <process_id> /F
```

**Or change port in `.env`:**
```env
PORT=5001
```

And update `frontend/vite.config.js`:
```javascript
proxy: {
  '/api': {
    target: 'http://localhost:5001',
    changeOrigin: true
  }
}
```

### MySQL Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:3306
```

**Solutions:**
1. Start MySQL service:
   ```powershell
   # Using Services Manager
   Get-Service MySQL80 | Start-Service
   
   # Or if different version
   Get-Service | Where-Object {$_.Name -like "*MySQL*"}
   ```

2. Verify MySQL is running:
   ```powershell
   mysql -u root -p -e "SELECT 1"
   ```

3. Check credentials in `.env`

### Node Modules Installation Issues

Clear cache and reinstall:
```powershell
cd backend
npm cache clean --force
rm -r node_modules
npm install

cd ..\frontend
npm cache clean --force
rm -r node_modules
npm install
```

### Permission Denied Error

If you get permission errors, run PowerShell as Administrator:
1. Right-click PowerShell
2. Select "Run as administrator"

## Development Tips

### Hot Reload

Both frontend (Vite) and backend (with `npm run dev` using nodemon) support hot reload.

### Frontend Development Mode

```powershell
cd frontend
npm run dev
```

Vite will show: `Local: http://localhost:5173` (instead of 3000 in some cases)

### Backend Development Mode

```powershell
cd backend
npm run dev
```

Uses nodemon to auto-restart on file changes.

### Building for Production

```powershell
# Build frontend
cd frontend
npm run build

# Output will be in frontend/dist/
```

Serve the `dist` folder with your production web server.

## Environment Variables

### Backend (.env)

```env
# Server
PORT=5000

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=dtrs_db

# JWT
JWT_SECRET=random-secret-string

# Admin
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123

# Optional: Fingerprint Scanner
FINGERPRINT_ENABLED=false
FINGERPRINT_PORT=COM3
FINGERPRINT_BAUDRATE=9600
```

## Useful PowerShell Commands

```powershell
# List all running processes
Get-Process

# Kill a process by name
Stop-Process -Name "node" -Force

# Open file explorer in current directory
explorer .

# Set execution policy (if scripts won't run)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## Next Steps

1. Register some students in the Admin Dashboard
2. Test scanning/entering IDs on the Kiosk
3. View time logs in the Admin Dashboard
4. Check database records in phpMyAdmin
5. Configure RFID/Fingerprint settings as needed

## Support

For issues:
1. Check the [README.md](README.md)
2. Review [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
3. Check backend logs in PowerShell
4. Verify MySQL is running
5. Ensure all ports are available
