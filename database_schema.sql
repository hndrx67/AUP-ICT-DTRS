-- DTRS Database Initialization Script
-- Run this in phpMyAdmin to set up the database from scratch

-- Create database
CREATE DATABASE IF NOT EXISTS dtrs_db;
USE dtrs_db;

-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id_number VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  profile_picture LONGBLOB,
  wallpaper LONGBLOB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create time_logs table
CREATE TABLE IF NOT EXISTS time_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id VARCHAR(50) NOT NULL,
  type ENUM('time_in', 'time_out') NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  date DATE GENERATED ALWAYS AS (DATE(timestamp)) STORED,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id_number) ON DELETE CASCADE,
  INDEX idx_student_date (student_id, date),
  INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value VARCHAR(255) NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default settings
INSERT IGNORE INTO settings (key, value) VALUES 
('enable_rfid', 'true'),
('enable_fingerprint', 'false');

-- Sample data (optional)
-- Uncomment to add sample students
/*
INSERT INTO students (id_number, name, status) VALUES 
('2024001', 'John Doe', 'active'),
('2024002', 'Jane Smith', 'active'),
('2024003', 'Michael Johnson', 'active');
*/
