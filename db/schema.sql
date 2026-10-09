-- PHONK HUB MySQL Schema for Aiven Cloud Database

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(191) PRIMARY KEY,
  username VARCHAR(191) UNIQUE NOT NULL,
  email VARCHAR(191) UNIQUE NOT NULL,
  password_hash VARCHAR(191) NOT NULL,
  name VARCHAR(191) NOT NULL,
  bio TEXT,
  avatar TEXT,
  role VARCHAR(50) DEFAULT 'USER',
  followers_count INT DEFAULT 0,
  following_count INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS guest_accounts (
  id VARCHAR(191) PRIMARY KEY,
  guest_token VARCHAR(191) UNIQUE NOT NULL,
  guest_name VARCHAR(191) DEFAULT 'Guest Producer',
  device_id VARCHAR(191),
  ip_address VARCHAR(191),
  is_active TINYINT(1) DEFAULT 1,
  last_active_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tracks (
  id VARCHAR(191) PRIMARY KEY,
  title VARCHAR(191) NOT NULL,
  artist VARCHAR(191) NOT NULL,
  album VARCHAR(191) DEFAULT 'SINGLE',
  subgenre VARCHAR(191) DEFAULT 'Drift Phonk',
  duration VARCHAR(191) DEFAULT '2:45',
  duration_sec INT DEFAULT 165,
  plays INT DEFAULT 0,
  likes_count INT DEFAULT 0,
  download_count INT DEFAULT 0,
  bpm INT DEFAULT 150,
  rating INT DEFAULT 5,
  cover_url TEXT NOT NULL,
  audio_url TEXT NOT NULL,
  download_url TEXT,
  mood VARCHAR(191) DEFAULT 'Aggressive',
  featured TINYINT(1) DEFAULT 0,
  description TEXT,
  user_id VARCHAR(191),
  guest_account_id VARCHAR(191),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (guest_account_id) REFERENCES guest_accounts(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS likes (
  id VARCHAR(191) PRIMARY KEY,
  track_id VARCHAR(191) NOT NULL,
  user_id VARCHAR(191),
  guest_account_id VARCHAR(191),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (guest_account_id) REFERENCES guest_accounts(id) ON DELETE CASCADE
);
