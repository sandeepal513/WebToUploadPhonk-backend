-- ====================================================================
-- PHONK HUB - COMPLETE SQL DATABASE SCHEMA (RUNNABLE SQL SCRIPT)
-- Supported Engines: MySQL 5.7+ / MySQL 8.0+ / MariaDB / PostgreSQL
-- Description: Creates full table structure for Phonk Details,
--              User Details, Guest Account Details, Likes, Comments,
--              Playlists, and Play History.
-- ====================================================================

CREATE DATABASE IF NOT EXISTS `phonk_hub` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `phonk_hub`;

-- -------------------------------------------------------------
-- 1. USERS TABLE (Registered Creator & Listener Accounts)
-- -------------------------------------------------------------
DROP TABLE IF EXISTS `play_history`;
DROP TABLE IF EXISTS `playlist_items`;
DROP TABLE IF EXISTS `playlists`;
DROP TABLE IF EXISTS `comments`;
DROP TABLE IF EXISTS `likes`;
DROP TABLE IF EXISTS `tracks`;
DROP TABLE IF EXISTS `guest_accounts`;
DROP TABLE IF EXISTS `users`;

CREATE TABLE `users` (
  `id` VARCHAR(36) NOT NULL,
  `username` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `bio` TEXT DEFAULT NULL,
  `avatar` TEXT DEFAULT NULL,
  `role` ENUM('USER', 'CREATOR', 'ADMIN') NOT NULL DEFAULT 'USER',
  `followers_count` INT NOT NULL DEFAULT 0,
  `following_count` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_users_username` (`username`),
  UNIQUE KEY `uk_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- 2. GUEST ACCOUNTS TABLE (Guest Visitor Sessions & Temp Identifiers)
-- -------------------------------------------------------------
CREATE TABLE `guest_accounts` (
  `id` VARCHAR(36) NOT NULL,
  `guest_token` VARCHAR(255) NOT NULL,
  `guest_name` VARCHAR(100) NOT NULL DEFAULT 'Guest Producer',
  `device_id` VARCHAR(255) DEFAULT NULL,
  `ip_address` VARCHAR(100) DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `last_active_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_guest_token` (`guest_token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- 3. TRACKS TABLE (Phonk Details & Audio Metadata)
-- -------------------------------------------------------------
CREATE TABLE `tracks` (
  `id` VARCHAR(36) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `artist` VARCHAR(255) NOT NULL,
  `album` VARCHAR(150) NOT NULL DEFAULT 'SINGLE',
  `subgenre` VARCHAR(100) NOT NULL DEFAULT 'Drift Phonk',
  `duration` VARCHAR(20) NOT NULL DEFAULT '2:45',
  `duration_sec` INT NOT NULL DEFAULT 165,
  `plays` INT NOT NULL DEFAULT 0,
  `likes_count` INT NOT NULL DEFAULT 0,
  `download_count` INT NOT NULL DEFAULT 0,
  `bpm` INT NOT NULL DEFAULT 150,
  `rating` INT NOT NULL DEFAULT 5,
  `cover_url` TEXT NOT NULL,
  `audio_url` TEXT NOT NULL,
  `download_url` TEXT DEFAULT NULL,
  `mood` VARCHAR(100) NOT NULL DEFAULT 'Aggressive',
  `featured` TINYINT(1) NOT NULL DEFAULT 0,
  `description` TEXT DEFAULT NULL,
  `user_id` VARCHAR(36) DEFAULT NULL,
  `guest_account_id` VARCHAR(36) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_tracks_subgenre` (`subgenre`),
  KEY `idx_tracks_mood` (`mood`),
  KEY `idx_tracks_user_id` (`user_id`),
  KEY `idx_tracks_guest_account_id` (`guest_account_id`),
  CONSTRAINT `fk_tracks_users` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_tracks_guests` FOREIGN KEY (`guest_account_id`) REFERENCES `guest_accounts` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- 4. LIKES TABLE (Registered User & Guest Favorites)
-- -------------------------------------------------------------
CREATE TABLE `likes` (
  `id` VARCHAR(36) NOT NULL,
  `track_id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) DEFAULT NULL,
  `guest_account_id` VARCHAR(36) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_likes_user_track` (`user_id`, `track_id`),
  UNIQUE KEY `uk_likes_guest_track` (`guest_account_id`, `track_id`),
  CONSTRAINT `fk_likes_tracks` FOREIGN KEY (`track_id`) REFERENCES `tracks` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_likes_users` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_likes_guests` FOREIGN KEY (`guest_account_id`) REFERENCES `guest_accounts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- 5. COMMENTS TABLE (Discussion & Feedback)
-- -------------------------------------------------------------
CREATE TABLE `comments` (
  `id` VARCHAR(36) NOT NULL,
  `track_id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) DEFAULT NULL,
  `guest_account_id` VARCHAR(36) DEFAULT NULL,
  `author_name` VARCHAR(150) NOT NULL,
  `author_avatar` TEXT DEFAULT NULL,
  `text` TEXT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_comments_track_id` (`track_id`),
  CONSTRAINT `fk_comments_tracks` FOREIGN KEY (`track_id`) REFERENCES `tracks` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_comments_users` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_comments_guests` FOREIGN KEY (`guest_account_id`) REFERENCES `guest_accounts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- 6. PLAYLISTS TABLE
-- -------------------------------------------------------------
CREATE TABLE `playlists` (
  `id` VARCHAR(36) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `cover_url` TEXT DEFAULT NULL,
  `is_public` TINYINT(1) NOT NULL DEFAULT 1,
  `user_id` VARCHAR(36) DEFAULT NULL,
  `guest_account_id` VARCHAR(36) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_playlists_users` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_playlists_guests` FOREIGN KEY (`guest_account_id`) REFERENCES `guest_accounts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- 7. PLAYLIST ITEMS TABLE
-- -------------------------------------------------------------
CREATE TABLE `playlist_items` (
  `id` VARCHAR(36) NOT NULL,
  `playlist_id` VARCHAR(36) NOT NULL,
  `track_id` VARCHAR(36) NOT NULL,
  `position` INT NOT NULL DEFAULT 0,
  `added_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_playlist_track` (`playlist_id`, `track_id`),
  CONSTRAINT `fk_playlist_items_playlists` FOREIGN KEY (`playlist_id`) REFERENCES `playlists` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_playlist_items_tracks` FOREIGN KEY (`track_id`) REFERENCES `tracks` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- 8. PLAY HISTORY TABLE (Analytics & Streams Log)
-- -------------------------------------------------------------
CREATE TABLE `play_history` (
  `id` VARCHAR(36) NOT NULL,
  `track_id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) DEFAULT NULL,
  `guest_account_id` VARCHAR(36) DEFAULT NULL,
  `played_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_play_history_tracks` FOREIGN KEY (`track_id`) REFERENCES `tracks` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_play_history_users` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_play_history_guests` FOREIGN KEY (`guest_account_id`) REFERENCES `guest_accounts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- 9. DEFAULT SEED DATA (SAMPLE PHONK HUB DATA)
-- -------------------------------------------------------------
INSERT INTO `users` (`id`, `username`, `email`, `password_hash`, `name`, `bio`, `avatar`, `role`, `followers_count`, `following_count`) VALUES
('usr-admin-01', 'phonk_master', 'admin@phonkhub.com', '$2a$10$wO32.rJ1eYF9O...example', 'KORDHELL // PHONK HUB OFFICIAL', 'Official Phonk Hub channel.', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80', 'ADMIN', 12400, 15);

INSERT INTO `guest_accounts` (`id`, `guest_token`, `guest_name`, `device_id`, `ip_address`) VALUES
('gst-sample-01', 'guest_token_808_sample', 'Drift Guest #808', 'device-web-preview', '127.0.0.1');

INSERT INTO `tracks` (`id`, `title`, `artist`, `album`, `subgenre`, `duration`, `duration_sec`, `plays`, `likes_count`, `download_count`, `bpm`, `rating`, `cover_url`, `audio_url`, `mood`, `featured`, `description`, `user_id`) VALUES
('trk-001', 'MURDER IN MY MIND', 'KORDHELL', 'DRIFT MANIA', 'Drift Phonk', '2:25', 145, 1850000, 142000, 45000, 160, 5, 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=500&q=80', 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=action-cyberpunk-112578.mp3', 'Aggressive', 1, 'High energy drift phonk anthem.', 'usr-admin-01'),
('trk-002', 'RAVE NIGHT', 'DVRST', 'MEMPHIS NIGHTS', 'Phonk House', '2:40', 160, 980000, 88000, 21000, 128, 5, 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=500&q=80', 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73379.mp3?filename=cyberpunk-2099-10701.mp3', 'Energetic', 1, 'Groovy house beats with vocal chops.', 'usr-admin-01'),
('trk-003', 'SHADOW DANCER', 'GHOSTFACE PLAYA', 'UNDERGROUND SOUNDS', 'Chill Phonk', '3:10', 190, 420000, 35000, 9500, 110, 4, 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=500&q=80', 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=dark-mystery-trailer-116581.mp3', 'Chill', 0, 'Atmospheric wave vibe with sub-bass.', 'usr-admin-01');
