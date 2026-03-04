/*
 Authentication System Database Setup
 Run these queries to add authentication support
 Date: February 10, 2026
*/

USE bejjany_pos_test;

-- ============================================
-- 1. Modify users table
-- ============================================

-- Ensure password field can store bcrypt hashes (60 chars minimum)
ALTER TABLE `users` 
MODIFY COLUMN `password` VARCHAR(255) CHARACTER SET latin1 COLLATE latin1_swedish_ci NULL DEFAULT NULL;

-- Add last_login field to track user sessions
ALTER TABLE `users` 
ADD COLUMN `last_login` DATETIME NULL DEFAULT NULL COMMENT 'Last successful login timestamp' AFTER `locked`;

-- ============================================
-- 2. Create refresh_tokens table
-- ============================================

DROP TABLE IF EXISTS `refresh_tokens`;
CREATE TABLE `refresh_tokens` (
  `rt_id` INT(11) NOT NULL AUTO_INCREMENT,
  `rt_token` VARCHAR(500) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL COMMENT 'Refresh token string',
  `rt_userid` INT(11) NOT NULL COMMENT 'FK to users table',
  `rt_expires_at` DATETIME NOT NULL COMMENT 'Token expiration timestamp',
  `rt_created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Token creation timestamp',
  `rt_revoked` TINYINT(1) NULL DEFAULT 0 COMMENT '1 if revoked/logged out, 0 if active',
  `rt_ip_address` VARCHAR(45) CHARACTER SET latin1 COLLATE latin1_swedish_ci NULL DEFAULT NULL COMMENT 'IP address of client',
  `rt_user_agent` VARCHAR(255) CHARACTER SET latin1 COLLATE latin1_swedish_ci NULL DEFAULT NULL COMMENT 'User agent string',
  PRIMARY KEY (`rt_id`) USING BTREE,
  INDEX `idx_rt_token` (`rt_token`) USING BTREE,
  INDEX `idx_rt_userid` (`rt_userid`) USING BTREE,
  INDEX `idx_rt_expires` (`rt_expires_at`) USING BTREE,
  CONSTRAINT `refresh_tokens_ibfk_1` FOREIGN KEY (`rt_userid`) REFERENCES `users` (`userid`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = latin1 COLLATE = latin1_swedish_ci COMMENT = 'Stores refresh tokens for OAuth2 authentication' ROW_FORMAT = Dynamic;

-- ============================================
-- 3. Add indexes for performance
-- ============================================

-- Index on username for faster login queries
ALTER TABLE `users` 
ADD INDEX `idx_username` (`username`) USING BTREE;

-- Index on active and locked fields for faster authentication checks
ALTER TABLE `users` 
ADD INDEX `idx_active_locked` (`active`, `locked`) USING BTREE;

-- ============================================
-- 4. Clean up old expired tokens (maintenance query)
-- ============================================

-- You can run this periodically or set up as a scheduled event
-- DELETE FROM `refresh_tokens` WHERE `rt_expires_at` < NOW() OR `rt_revoked` = 1;

-- Optional: Create event to auto-cleanup expired tokens every day
DELIMITER $$
CREATE EVENT IF NOT EXISTS `cleanup_expired_tokens`
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_TIMESTAMP
DO
BEGIN
  DELETE FROM `refresh_tokens` 
  WHERE `rt_expires_at` < DATE_SUB(NOW(), INTERVAL 7 DAY) 
     OR (`rt_revoked` = 1 AND `rt_created_at` < DATE_SUB(NOW(), INTERVAL 30 DAY));
END$$
DELIMITER ;

-- ============================================
-- 5. Verification queries
-- ============================================

-- Verify users table structure
-- DESCRIBE users;

-- Verify refresh_tokens table structure
-- DESCRIBE refresh_tokens;

-- Check if indexes were created
-- SHOW INDEX FROM users;
-- SHOW INDEX FROM refresh_tokens;

-- ============================================
-- Notes:
-- ============================================
-- 1. Backup your database before running these queries
-- 2. Existing user passwords need to be rehashed with bcrypt
-- 3. The event scheduler must be enabled for auto-cleanup:
--    SET GLOBAL event_scheduler = ON;
-- ============================================
