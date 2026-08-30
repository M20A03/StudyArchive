CREATE DATABASE IF NOT EXISTS campushub
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE campushub;

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  college_name VARCHAR(255) NOT NULL,
  username VARCHAR(120) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  profile_picture TEXT DEFAULT '',
  branch VARCHAR(64) NOT NULL,
  semester INT NOT NULL DEFAULT 1,
  bio TEXT DEFAULT '',
  recognition_points INT NOT NULL DEFAULT 0,
  resources_uploaded INT NOT NULL DEFAULT 0,
  resources_downloaded INT NOT NULL DEFAULT 0,
  created_at DATETIME(6) NOT NULL,
  updated_at DATETIME(6) NOT NULL,
  INDEX idx_users_email (email),
  INDEX idx_users_full_name (full_name)
);

CREATE TABLE IF NOT EXISTS resources (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  subject VARCHAR(120) NOT NULL,
  semester INT NOT NULL,
  branch VARCHAR(64) NOT NULL,
  file_url TEXT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  uploaded_by VARCHAR(255) NOT NULL,
  uploader_college VARCHAR(255) NOT NULL,
  privacy_status ENUM('Public', 'Private') NOT NULL DEFAULT 'Public',
  created_at DATETIME(6) NOT NULL,
  updated_at DATETIME(6) NOT NULL,
  downloads INT NOT NULL DEFAULT 0,
  tags JSON NOT NULL,
  file_type ENUM('PDF', 'Image', 'Document') NOT NULL DEFAULT 'Document',
  size BIGINT NOT NULL,
  INDEX idx_resources_privacy (privacy_status),
  INDEX idx_resources_subject (subject),
  INDEX idx_resources_semester (semester),
  INDEX idx_resources_branch (branch),
  INDEX idx_resources_uploaded_by (uploaded_by),
  INDEX idx_resources_created_at (created_at)
);
