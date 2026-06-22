# Backend Database Issues - FIXED

## Issues Found and Resolved

### 1. **SQL Syntax Error: Unknown Columns**
**Problem:** Backend was trying to SELECT `profile_picture` and `wallpaper` columns that didn't exist in the database.
```
Error: Unknown column 'profile_picture' in 'field list'
```

**Solution:** 
- Modified all GET endpoints to dynamically check if columns exist before querying them
- Added fallback queries that work with basic columns only
- Database ALTER TABLE statements now run automatically on server startup

### 2. **Database Schema Not Updated**
**Problem:** The students table existed in the database but didn't have the new image columns.

**Solution:**
- Converted database initialization from `CREATE TABLE` (which only runs once) to include `ALTER TABLE` statements
- Added `IF NOT EXISTS` checks for column addition to prevent errors
- Gracefully handles both old and new database schemas

### 3. **MySQL Reserved Keyword Issue**
**Problem:** The `key` column in settings table was a MySQL reserved keyword, causing syntax errors:
```
Error: You have an error in your SQL syntax... near 'VARCHAR(100) UNIQUE NOT NULL'
```

**Solution:**
- Quoted all references to `key` column with backticks: `` `key` ``
- Updated in CREATE TABLE, INSERT, SELECT, and UPDATE queries

### 4. **Query Compatibility Issues**
**Problem:** INSERT and UPDATE endpoints were trying to use image columns without checking if they exist.

**Solution:**
- Modified POST /api/students to try insert with images first, fallback to basic insert if columns don't exist
- Modified PUT /api/students/:id_number with dynamic query building and fallback handling

## Changes Made to Backend (server.js)

### Database Initialization (Lines 30-103)
✅ Split `CREATE TABLE` to separate `ALTER TABLE` statements for adding columns
✅ Added error handling for duplicate column names (ER_DUP_FIELDNAME)
✅ Properly quotes `key` column with backticks in CREATE TABLE

### GET /api/students/:id_number (Lines 128-182)
✅ Dynamically builds SELECT query checking for column existence
✅ Falls back to basic SELECT if image columns don't exist
✅ Safely converts BLOB to base64 or sets to null
✅ Added debug logging

### GET /api/settings (Lines 194-208)
✅ Quotes `key` column with backticks
✅ Uses bracket notation `row['key']` to access reserved keyword column

### POST /api/students (Lines 332-380)
✅ Try-catch wrapper for image columns
✅ Falls back to insert without images if columns don't exist
✅ Handles buffer conversion safely
✅ Added detailed logging

### PUT /api/students/:id_number (Lines 442-510)
✅ Dynamic query building with optional image fields
✅ Falls back to update without images if needed
✅ Proper error handling and logging

### PUT /api/settings/:key (Lines 533-545)
✅ Quotes `key` column with backticks in WHERE clause

## Testing Instructions

### 1. Start Backend Server
```bash
cd backend
npm install  # if dependencies not installed
npm start    # or: node server.js
```

**Expected Output:**
```
✓ Added profile_picture column to students table
✓ Added wallpaper column to students table
✓ Database tables initialized
✓ Server running on http://localhost:5000
```

### 2. Verify Database Schema
Open phpMyAdmin and check students table:
- Should have: `profile_picture` (LONGBLOB)
- Should have: `wallpaper` (LONGBLOB)

### 3. Test API Endpoints
```bash
# Get a student (should work now)
curl http://localhost:5000/api/students/2024001

# Get settings (should work now)
curl http://localhost:5000/api/settings

# Register new student with images (optional)
curl -X POST http://localhost:5000/api/students \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "id_number": "2024099",
    "name": "Test Student",
    "profile_picture": null,
    "wallpaper": null
  }'
```

## Files Created

### database_migration.sql
Manual SQL script if auto-migration doesn't work. Run in phpMyAdmin if needed:
```sql
ALTER TABLE students ADD COLUMN profile_picture LONGBLOB AFTER status;
ALTER TABLE students ADD COLUMN wallpaper LONGBLOB AFTER profile_picture;
```

## Compatibility

✅ Works with existing databases (auto-upgrades schema)
✅ Works with new databases (creates all columns)
✅ No data loss during migration
✅ Fallback queries ensure backward compatibility

## Backend Server Status

**Current Status:** ✅ **WORKING**
- Server starts successfully
- Database initializes without errors
- All endpoints available
- Ready for frontend to connect

## Next Steps

1. ✅ Backend is fixed and running
2. Start frontend server: `npm start` in frontend directory
3. Test image upload in Admin Dashboard
4. Verify images display in Kiosk Screen
5. Check browser console for any errors (F12)

