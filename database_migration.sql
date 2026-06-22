-- Database Migration Script for Profile Picture and Wallpaper Feature
-- Run this in phpMyAdmin SQL tab if the backend doesn't automatically add the columns

USE dtrs_db;

-- Add profile_picture column if it doesn't exist
ALTER TABLE students ADD COLUMN profile_picture LONGBLOB AFTER status;

-- Add wallpaper column if it doesn't exist  
ALTER TABLE students ADD COLUMN wallpaper LONGBLOB AFTER profile_picture;

-- Verify the columns were added
DESC students;

-- Expected output should show:
-- profile_picture | LONGBLOB | YES | | NULL |
-- wallpaper       | LONGBLOB | YES | | NULL |
