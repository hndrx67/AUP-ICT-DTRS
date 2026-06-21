# XAMPP Setup Guide for DTRS

## Step 1: Download XAMPP

1. **Go to**: https://www.apachefriends.org/
2. **Click "Download"** for Windows
3. **Choose the latest version** (preferably 8.0 or higher)
4. The installer will download automatically

## Step 2: Install XAMPP

1. **Run the installer** (`xampp-windows-x64-8.x.x-installer.exe`)
2. **Click "Next"** through the setup wizard
3. **Select installation location** (default: `C:\xampp` is fine)
4. **Uncheck "Learn more..." option** (optional)
5. **Click "Install"**
6. **Wait for installation** to complete
7. **Click "Finish"** when done

## Step 3: Start XAMPP Control Panel

1. **Find XAMPP in Start Menu** or navigate to `C:\xampp`
2. **Run `xampp-control.exe`**
3. The Control Panel will open

## Step 4: Start MySQL and Apache

In the XAMPP Control Panel, you'll see a list of services:

### Start MySQL
- **Find "MySQL"** in the list
- **Click the "Start" button** next to it
- Status should change to **GREEN** with "Running"
- If it says "MySQL is already running", that's fine ✓

### Start Apache (Optional, only needed for phpMyAdmin web interface)
- **Find "Apache"** in the list  
- **Click "Start"** next to it
- Status should change to **GREEN** with "Running"

**Your screen should look like:**
```
Module          Control       Status
MySQL           [Start]       Running
Apache          [Start]       Running
```

## Step 5: Access phpMyAdmin

1. **Open your web browser**
2. **Go to**: `http://localhost/phpmyadmin`
3. **You should see the phpMyAdmin login page**

### Login Credentials
- **Username**: `root`
- **Password**: (leave blank - just press Enter)
- **Click "Go"**

## Step 6: Select Your Database

1. **In the left panel**, you'll see databases listed
2. **Look for `dtrs_db`** (this was created by your Node.js backend)
3. **Click on `dtrs_db`** to select it
4. You should see three tables:
   - `students`
   - `time_logs`
   - `settings`

## Step 7: Manage Your Data

### View Student Data
1. Click on **`students`** table
2. You'll see all registered students with columns:
   - `id_number` - Student ID
   - `name` - Student name
   - `status` - Active/Inactive
   - `created_at`, `updated_at`

### View Time Logs
1. Click on **`time_logs`** table
2. You'll see all attendance records with columns:
   - `id` - Log entry ID
   - `student_id` - Which student
   - `type` - "time_in" or "time_out"
   - `timestamp` - When the log was created
   - `date` - Date of the log

### Edit Data
- **Click the ✏️ (pencil) icon** to edit a row
- **Click the 🗑️ (trash) icon** to delete a row
- **Click "Insert" tab** to add new records manually

## Step 8: Run SQL Queries (Advanced)

1. **Click "SQL" tab** at the top
2. **Paste your SQL command** in the text area
3. **Click "Go"** to execute

### Useful Queries

**Delete all time logs for a student:**
```sql
DELETE FROM time_logs WHERE student_id = '2024001';
```

**Delete a specific student:**
```sql
DELETE FROM students WHERE id_number = '2024001';
```

**Reset all time logs:**
```sql
TRUNCATE TABLE time_logs;
```

**View today's attendance:**
```sql
SELECT student_id, type, timestamp FROM time_logs 
WHERE DATE(timestamp) = CURDATE() 
ORDER BY timestamp DESC;
```

## Troubleshooting

### MySQL won't start
- **Check if port 3306 is in use**: Open PowerShell and run:
  ```powershell
  netstat -ano | findstr :3306
  ```
- If something is using it, change MySQL port in phpMyAdmin or stop the conflicting service

### Can't access phpMyAdmin
- **Make sure Apache is running** (green status in Control Panel)
- **Try**: `http://localhost:80/phpmyadmin`
- **Or**: `http://127.0.0.1/phpmyadmin`

### "Access denied for user 'root'@'localhost'"
- **Your MySQL password in `.env` doesn't match**
- Go to XAMPP Control Panel → MySQL → **Config** → `my.ini`
- Check the default password settings

### Want to change MySQL password
1. In XAMPP Control Panel, click **"Admin"** next to MySQL
2. Or use command line:
   ```bash
   mysql -u root
   ALTER USER 'root'@'localhost' IDENTIFIED BY 'your_new_password';
   FLUSH PRIVILEGES;
   ```

## Keep XAMPP Running

- **Keep the Control Panel open** while working
- Or install XAMPP as a service:
  - XAMPP Control Panel → Click **"Service"** checkbox next to modules
  - MySQL and Apache will start automatically on computer restart

## Next Steps

1. ✓ XAMPP installed and running
2. ✓ MySQL and Apache services started
3. ✓ phpMyAdmin accessible
4. → **Now you can manage your DTRS database!**

## Quick Reference

| Task | How To |
|------|--------|
| Open phpMyAdmin | `http://localhost/phpmyadmin` |
| View students | Select `dtrs_db` → Click `students` table |
| View attendance logs | Select `dtrs_db` → Click `time_logs` table |
| Edit data | Click ✏️ icon on any row |
| Delete data | Click 🗑️ icon on any row |
| Run SQL commands | Click "SQL" tab in phpMyAdmin |
| Stop services | XAMPP Control Panel → Click "Stop" buttons |
