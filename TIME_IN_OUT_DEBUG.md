# Time In/Time Out Debugging Guide

## Quick Fix Steps

### 1. **Stop your backend server**
- In PowerShell, press `CTRL+C` to stop the Node.js server

### 2. **Clear old test data from database**
Open phpMyAdmin or MySQL Command Line and run:

```sql
-- Delete all time logs to start fresh
DELETE FROM time_logs;

-- Verify it's empty
SELECT * FROM time_logs;
```

### 3. **Restart the backend server**
```bash
cd backend
npm start
```

You should see console logs when testing.

### 4. **Test the system**

**First Tap (Same student):**
- Go to `http://localhost:3000`
- Enter any student ID (e.g., `2024001`)
- Should show: `✓ [StudentName] TIMED IN`
- Check database: You should see `type = 'time_in'`

**Second Tap (Same student ID, immediately after):**
- Enter the same student ID again
- Should show: `✗ [StudentName] TIMED OUT`
- Check database: You should see a NEW entry with `type = 'time_out'`

**Third Tap (Same student ID again):**
- Enter the same student ID one more time
- Should show: `✓ [StudentName] TIMED IN`
- Verify in database

## Verify in Database

### Using phpMyAdmin:
1. Go to `http://localhost/phpmyadmin`
2. Click `dtrs_db` → `time_logs`
3. You should see entries like:
```
| id | student_id | type     | timestamp           |
|----|------------|----------|---------------------|
| 1  | 2024001    | time_in  | 2026-06-22 14:30:00 |
| 2  | 2024001    | time_out | 2026-06-22 14:32:00 |
| 3  | 2024001    | time_in  | 2026-06-22 14:33:00 |
```

### Using MySQL Command Line:
```sql
USE dtrs_db;
SELECT id, student_id, type, timestamp FROM time_logs WHERE student_id = '2024001' ORDER BY timestamp;
```

## Check Backend Logs

When you restart the backend, you'll see debug messages like:

```
[TIME_LOG] Student: 2024001, Today: 2026-06-22, Last Log: NONE
[TIME_LOG] Setting new log type to: time_in
[TIME_LOG] Student: 2024001, Today: 2026-06-22, Last Log: { type: 'time_in', ... }
[TIME_LOG] Last log type was: time_in
[TIME_LOG] Setting new log type to: time_out
```

This shows the system correctly detecting the last log and toggling.

## Troubleshooting

### Issue: Shows "time_in" twice
- **Check 1**: Did you restart the backend server? Old code won't have the fix.
- **Check 2**: Are there old test logs in the database? Delete them with:
  ```sql
  DELETE FROM time_logs;
  ```
- **Check 3**: Check backend console logs - what does it say the last log type was?

### Issue: Different students interfering
- Each student should have independent time in/out tracking
- Use different student IDs for each test
- Make sure you're checking the right student's logs in the database

### Issue: Timer resetting too fast
- After 4 seconds, the form resets and is ready for the next student
- Make sure you're waiting for it to reset before entering another ID

## Expected Behavior Timeline

```
Time 0:00 - Student taps ID → "TIMED IN" ✓
Time 0:01 - System shows student name for 4 seconds
Time 0:04 - Form resets, ready for next tap
Time 0:04 - Same student taps ID again → "TIMED OUT" ✗
Time 0:08 - Form resets
Time 0:08 - Same student taps ID again → "TIMED IN" ✓
```

## Need More Help?

Check these things:
1. Is the backend running? (You should see console logs)
2. Is MySQL running? (Check XAMPP or Services)
3. Are there no errors in the browser console? (F12 → Console tab)
4. Did you delete old test data?
