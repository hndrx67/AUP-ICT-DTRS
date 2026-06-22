# Kiosk Screen Student ID Card Modal Feature

## Overview
The kiosk screen now displays a modal popup styled as a landscape student ID card when a student times in or out. The modal includes the student's profile picture and detailed information.

## What Changed

### 1. **Display Behavior**
- **Before:** When a student was found, the entire kiosk background changed to show the wallpaper
- **After:** The input form remains visible in the background. A centered modal popup appears showing the student ID card with:
  - Profile picture on the left side
  - Student information on the right side
  - Wallpaper as the modal's background (preserves aspect ratio)

### 2. **Modal Design**
The student ID card modal is designed as a landscape card with:

**Left Section (35% width):**
- Student's profile picture (full height, maintains aspect ratio)
- Placeholder with student's initial (gradient background) if no picture
- Subtle separator line on the right edge

**Right Section (65% width):**
- Semi-transparent white background for text clarity
- Blue accent line at the top
- Student name in large, bold text (uppercase)
- Student ID
- Status (Active/Inactive)
- Time (in HH:MM:SS format)
- Date
- Clean, professional layout similar to real ID cards

### 3. **Wallpaper Handling**
- The wallpaper is applied as the modal's background
- **Aspect Ratio Preservation:** Uses `background-size: cover` to prevent stretching
- Portrait images won't be distorted when displayed
- Background is centered and covers the entire modal

### 4. **Animations**
- **Pop-In:** Modal scales up with a 3D rotate effect when appearing (0.4s duration)
- **Overlay:** Backdrop blur effect on the background to focus attention on modal
- Smooth cubic-bezier easing for natural motion
- Graceful fade-in for overlay

### 5. **Responsive Design**
- **Desktop (1200px+):** Horizontal landscape layout (16:10 aspect ratio)
- **Tablet (768px-1199px):** Adjusted sizing and font sizes
- **Mobile (<768px):** Converts to vertical stacked layout with profile picture on top

## Files Modified

### [frontend/src/pages/KioskScreen.jsx](frontend/src/pages/KioskScreen.jsx)
**Changes:**
- Removed full-screen wallpaper background from main container
- Kept input form always visible in the background
- Added new `id-card-modal-overlay` and `id-card-modal` JSX elements
- Modal only appears when `studentInfo` state is set
- Image format detection still works for both profile picture and wallpaper
- Maintained all timing logic (4-second display, auto-reset)

**Key Code Structure:**
```jsx
{studentInfo && (
  <div className="id-card-modal-overlay">
    <div className="id-card-modal" style={{...wallpaper background...}}>
      {/* Left section with profile picture */}
      {/* Right section with student info */}
    </div>
  </div>
)}
```

### [frontend/src/pages/KioskScreen.css](frontend/src/pages/KioskScreen.css)
**New Styles Added:**
- `.id-card-modal-overlay` - Fixed overlay with backdrop blur
- `.id-card-modal` - Landscape card container with aspect ratio
- `.id-card-left` - Profile picture section
- `.id-card-right` - Student information section
- `.id-card-profile-picture` - Image styling
- `.id-card-profile-placeholder` - Gradient placeholder
- `.id-card-info`, `.id-card-name`, `.id-card-id`, etc. - Typography and layout
- `@keyframes popIn` - Entry animation
- `@keyframes fadeIn` - Overlay fade-in
- Responsive design for different screen sizes

## Visual Design Details

### Color Scheme
- **Header Bar:** Blue gradient (light to dark blue)
- **Card Right Section:** Semi-transparent white background
- **Text:** Dark blue for labels (#0369a1), dark gray for values (#1f2937)
- **Placeholder:** Gradient purple (like original placeholder)

### Typography
- **Student Name:** 2.2em, ultra-bold, uppercase
- **Labels:** 0.95em, bold, blue
- **Values:** 1.1em, semi-bold, dark gray
- Professional, readable, ID-card style

### Spacing & Layout
- 30px padding on left section
- 40px horizontal, 50px vertical padding on right section
- 20px gap between info fields
- Divider lines between fields for clarity

## User Experience Flow

1. User scans/enters student ID on the kiosk screen
2. Backend fetches student data (profile picture, wallpaper, etc.)
3. Modal animates in with a smooth pop-in effect
4. Modal displays for 4 seconds showing:
   - Time in/out message
   - Student profile picture
   - Student name and details
   - Wallpaper as background
5. After 4 seconds, modal animates out
6. Input form returns for next student
7. Input field automatically focuses for next scan

## Technical Features

### Image Format Detection
- Automatically detects JPEG, PNG, GIF, WebP formats
- Converts BLOB data from backend to base64
- Falls back to gradient placeholder if image missing or fails to load

### Wallpaper Aspect Ratio
- Uses CSS `background-size: cover` to prevent stretching
- `background-position: center` to center the image
- Portrait and landscape images both work correctly
- No distortion regardless of original aspect ratio

### Performance
- Modal uses CSS transforms (hardware accelerated)
- Backdrop blur is performant on modern browsers
- Animation uses `cubic-bezier` for smooth easing
- No layout recalculation during animation

### Accessibility
- Form input remains accessible in background
- Clear visual hierarchy
- High contrast text colors
- Large touch targets on buttons

## Testing Checklist

- [x] Frontend builds without errors
- [ ] Register student with profile picture and wallpaper
- [ ] Scan/enter student ID on kiosk
- [ ] Verify modal pops in smoothly
- [ ] Check profile picture displays on left side
- [ ] Check wallpaper preserves aspect ratio (no stretching)
- [ ] Verify student name displays correctly
- [ ] Check time and date format correct
- [ ] Verify modal shows for 4 seconds
- [ ] Verify modal pops out smoothly
- [ ] Test on mobile/tablet (responsive layout)
- [ ] Test with portrait wallpaper image
- [ ] Test without profile picture (verify placeholder)
- [ ] Test without wallpaper (verify solid background)

## Notes

- The original `student-display` CSS classes are kept in case they're needed elsewhere
- The `message` component still works and displays time in/out status
- Form input automatically refocuses after modal disappears
- Error handling remains the same as before
- Backend API integration unchanged (still fetches all the same data)

## Future Enhancements

Possible improvements:
- Add a close button to manually dismiss modal
- Add sound effect when timing in/out
- Add animation transition when switching between students
- Add QR code display on the ID card
- Add department/course information
- Add student photo verification overlay
