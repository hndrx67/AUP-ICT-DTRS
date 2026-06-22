# Profile Picture & Wallpaper Setup Verification Guide

## Overview
This guide helps verify that the profile picture and wallpaper feature is working correctly.

## Step 1: Database Schema Update
First, verify that your database has the new columns:

### Via phpMyAdmin:
1. Go to phpMyAdmin
2. Select database `dtrs_db`
3. Click on table `students`
4. Check if these columns exist:
   - `profile_picture` (LONGBLOB)
   - `wallpaper` (LONGBLOB)

### Via MySQL Command Line:
```sql
DESCRIBE students;
```

**Expected Output:**
- id_number, name, status, **profile_picture**, **wallpaper**, created_at, updated_at

### If columns are missing:
Run this SQL in phpMyAdmin to add them:
```sql
ALTER TABLE students ADD COLUMN profile_picture LONGBLOB;
ALTER TABLE students ADD COLUMN wallpaper LONGBLOB;
```

## Step 2: Register a Student with Images

1. Start the backend server
2. Start the frontend
3. Login to Admin Dashboard (admin/admin123)
4. Go to "Student Management" tab
5. Fill in student registration form:
   - **Student ID:** 2024001
   - **Full Name:** Test Student
   - **Profile Picture:** Upload a small image (JPG/PNG)
   - **Kiosk Wallpaper:** Upload a larger image (JPG/PNG)
6. Click "REGISTER STUDENT"

## Step 3: Test Kiosk Display

1. Go to Kiosk Screen
2. Enter the student ID: `2024001`
3. **Expected Results:**
   - ✅ Wallpaper should appear as the background
   - ✅ Student display card should show over the wallpaper
   - ✅ Profile picture should display in the card
   - ✅ Student name should be visible

## Step 4: Browser Console Debugging

If images don't show:

1. Open **Browser DevTools** (F12)
2. Go to **Console** tab
3. Enter the student ID in the kiosk
4. Check console output - should show:
```javascript
Student data received: {
  id: "2024001",
  name: "Test Student",
  hasProfilePicture: true,
  hasWallpaper: true,
  profilePictureLength: 12345,
  wallpaperLength: 54321
}
```

## Step 5: Backend Server Logs

Check the backend server console output when a student is retrieved:

**Expected:**
```
[GET /api/students/2024001] Student retrieved: {
  id: "2024001",
  hasProfilePicture: true,
  haswallpaper: true,
  profilePictureSize: 12345,
  wallpaperSize: 54321
}
```

## Troubleshooting

### Issue: Images show but not wallpaper
- **Solution:** Check that wallpaper image format is JPEG or PNG
- Try uploading a different wallpaper image

### Issue: Profile picture not showing
- **Solution:** Check browser console for errors
- Verify image file is not corrupted
- Try uploading a different image

### Issue: "No images stored" in console
- **Solution:** Database columns might not be created
- Run the ALTER TABLE commands in Step 1

### Issue: White background instead of wallpaper
- **Solution:** Wallpaper base64 data might not be present
- Check Step 1 - database schema
- Re-register student with images

### Issue: Images are very large/slow to load
- **Solution:** Compress images before uploading
- Recommended sizes:
  - Profile Picture: < 500KB
  - Wallpaper: < 2MB

## Image Format Support
- ✅ JPEG (.jpg, .jpeg)
- ✅ PNG (.png)
- ✅ WebP (.webp)
- ✅ GIF (.gif)

The system stores images as base64 in the database, so any browser-compatible format works.

## Testing Checklist

- [ ] Database columns added (profile_picture, wallpaper)
- [ ] Student registered with both images
- [ ] Wallpaper shows in kiosk background
- [ ] Profile picture displays in student card
- [ ] Browser console shows image data
- [ ] Backend server logs show image sizes
- [ ] Student name displays correctly over wallpaper
- [ ] Placeholder letter shows if no profile picture

## Performance Notes

- First load may be slower due to base64 image data
- Images are cached in browser (use F5 to refresh)
- Keep images reasonably sized for best performance

## Database Backup

Before applying this feature to production:
1. Backup your `dtrs_db` database
2. Test with a few students first
3. Monitor database size (LONGBLOB can add storage overhead)

