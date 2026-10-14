-- ==============================================================================
-- Uncharted Waters: New Horizons Web Remake
-- MariaDB / MySQL Database Schema for Debian 13 Virtualmin LAMP VPS
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS `uncharted_waters` 
    DEFAULT CHARACTER SET utf8mb4 
    COLLATE utf8mb4_unicode_ci;

USE `uncharted_waters`;

-- ------------------------------------------------------------------------------
-- 1. User Accounts (Google OAuth Authentication & Role Management)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `google_sub` VARCHAR(255) NOT NULL UNIQUE,
    `email` VARCHAR(255) NOT NULL UNIQUE,
    `name` VARCHAR(255) NOT NULL,
    `avatar_url` TEXT NULL,
    `role` ENUM('player', 'admin') NOT NULL DEFAULT 'player',
    `status` ENUM('active', 'banned') NOT NULL DEFAULT 'active',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `last_login` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_google_sub` (`google_sub`),
    INDEX `idx_email` (`email`),
    INDEX `idx_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 2. Character Save Slots (Isolated SP vs Shared MP)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `save_slots` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `slot_number` TINYINT NOT NULL, -- 1 through 10
    `game_mode` ENUM('sp_scenario', 'sp_endless', 'mp_endless') NOT NULL,
    `protagonist_id` VARCHAR(50) NOT NULL, -- '1' (Joao), '2' (Catalina), ..., 'custom'
    `protagonist_name` VARCHAR(100) NOT NULL,
    `nationality` VARCHAR(50) NOT NULL DEFAULT 'Portugal',
    `is_alive` TINYINT(1) NOT NULL DEFAULT 1, -- Permadeath flag (0 = Deceased / Game Over in Endless)
    `current_year` SMALLINT NOT NULL DEFAULT 1522,
    `current_month` TINYINT NOT NULL DEFAULT 5,
    `current_day` TINYINT NOT NULL DEFAULT 17,
    `current_port_id` VARCHAR(20) NULL DEFAULT '1',
    `gold` INT NOT NULL DEFAULT 1000,
    `fame_adventure` INT NOT NULL DEFAULT 0,
    `fame_trade` INT NOT NULL DEFAULT 0,
    `fame_piracy` INT NOT NULL DEFAULT 0,
    `save_payload` LONGTEXT NOT NULL, -- Full JSON state: fleet, mates, cargo, private economics
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_user_slot` (`user_id`, `slot_number`),
    INDEX `idx_game_mode` (`game_mode`),
    INDEX `idx_is_alive` (`is_alive`),
    CONSTRAINT `fk_saves_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 3. Multiplayer Shared Port Economics (MP Endless Mode ONLY)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `mp_port_economy` (
    `port_id` INT NOT NULL PRIMARY KEY,
    `port_name` VARCHAR(100) NOT NULL,
    `economy_value` INT NOT NULL DEFAULT 500,
    `industry_value` INT NOT NULL DEFAULT 500,
    `support_portugal` INT NOT NULL DEFAULT 0,
    `support_spain` INT NOT NULL DEFAULT 0,
    `support_ottoman` INT NOT NULL DEFAULT 0,
    `support_england` INT NOT NULL DEFAULT 0,
    `support_holland` INT NOT NULL DEFAULT 0,
    `support_italy` INT NOT NULL DEFAULT 0,
    `controlling_nation` VARCHAR(50) NOT NULL DEFAULT 'Neutral',
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 4. Multiplayer Shared Commodity Prices & Market Stock (MP Endless Mode ONLY)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `mp_commodity_prices` (
    `port_id` INT NOT NULL,
    `commodity_id` INT NOT NULL,
    `price_index` INT NOT NULL DEFAULT 100, -- Range: 50% to 150%
    `stock_quantity` INT NOT NULL DEFAULT 1000,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`port_id`, `commodity_id`),
    CONSTRAINT `fk_mp_port` FOREIGN KEY (`port_id`) REFERENCES `mp_port_economy` (`port_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 5. Multiplayer Ghost Fleets & Player Bounties (MP Endless Mode ONLY)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `mp_ghost_fleets` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `save_slot_id` INT NOT NULL,
    `captain_name` VARCHAR(100) NOT NULL,
    `nation` VARCHAR(50) NOT NULL,
    `world_x` INT NOT NULL,
    `world_y` INT NOT NULL,
    `heading` INT NOT NULL DEFAULT 0,
    `fleet_data_json` LONGTEXT NOT NULL,
    `is_pirate` TINYINT(1) NOT NULL DEFAULT 0,
    `bounty_gold` INT NOT NULL DEFAULT 0,
    `last_seen` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_world_pos` (`world_x`, `world_y`),
    INDEX `idx_bounty` (`bounty_gold`),
    UNIQUE KEY `uk_slot` (`save_slot_id`),
    CONSTRAINT `fk_ghost_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_ghost_slot` FOREIGN KEY (`save_slot_id`) REFERENCES `save_slots` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
