-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Apr 25, 2026 at 04:40 AM
-- Server version: 10.11.16-MariaDB
-- PHP Version: 8.3.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `tota_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `app_update_settings`
--

CREATE TABLE `app_update_settings` (
  `id` int(11) NOT NULL,
  `latest_version` varchar(30) NOT NULL DEFAULT '1.0.3',
  `min_supported_version` varchar(30) NOT NULL DEFAULT '1.0.3',
  `force_update` tinyint(1) NOT NULL DEFAULT 0,
  `title` varchar(120) NOT NULL DEFAULT 'Update Required',
  `message` varchar(500) NOT NULL DEFAULT 'A new version of TotalFire is available. Please update to continue.',
  `download_url` varchar(255) NOT NULL DEFAULT 'https://totalfire.in/downloads/totalfire-v1.0.3.apk',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `match_results`
--

CREATE TABLE `match_results` (
  `id` int(11) NOT NULL,
  `tournament_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `kills` int(11) DEFAULT 0,
  `reward_amount` decimal(10,2) DEFAULT 0.00,
  `is_winner` tinyint(1) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `modes`
--

CREATE TABLE `modes` (
  `id` int(11) NOT NULL,
  `title` varchar(100) NOT NULL,
  `slug` varchar(50) NOT NULL,
  `image` varchar(255) NOT NULL,
  `app_image` varchar(255) NOT NULL,
  `category` enum('br','cs','lw','hs') NOT NULL,
  `players_label` varchar(60) NOT NULL,
  `max_players` int(11) NOT NULL,
  `team_size` int(11) NOT NULL DEFAULT 1,
  `entry_fee` decimal(10,2) NOT NULL,
  `per_kill` decimal(10,2) DEFAULT NULL,
  `prize_pool` decimal(10,2) DEFAULT NULL,
  `win_prize` varchar(100) DEFAULT NULL,
  `full_description` text NOT NULL,
  `rules_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`rules_json`)),
  `reward_breakdown_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`reward_breakdown_json`)),
  `sort_order` int(11) NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` bigint(20) NOT NULL,
  `user_id` int(11) NOT NULL,
  `type` enum('wallet','withdrawal','tournament','system') NOT NULL DEFAULT 'system',
  `title` varchar(120) NOT NULL,
  `message` varchar(500) NOT NULL,
  `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`payload`)),
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notification_templates`
--

CREATE TABLE `notification_templates` (
  `id` bigint(20) NOT NULL,
  `code` varchar(100) NOT NULL,
  `channel` enum('push','in_app','both') NOT NULL DEFAULT 'both',
  `category` enum('wallet','withdrawal','tournament','engagement','system') NOT NULL DEFAULT 'system',
  `title_template` varchar(160) NOT NULL,
  `body_template` varchar(500) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `password_reset_otps`
--

CREATE TABLE `password_reset_otps` (
  `id` bigint(20) NOT NULL,
  `user_id` int(11) NOT NULL,
  `otp_hash` varchar(255) NOT NULL,
  `expires_at` datetime NOT NULL,
  `verified_at` datetime DEFAULT NULL,
  `used_at` datetime DEFAULT NULL,
  `attempts` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `push_notification_delivery_logs`
--

CREATE TABLE `push_notification_delivery_logs` (
  `id` bigint(20) NOT NULL,
  `job_id` bigint(20) NOT NULL,
  `user_id` int(11) NOT NULL,
  `token_id` bigint(20) DEFAULT NULL,
  `provider` enum('fcm') NOT NULL DEFAULT 'fcm',
  `provider_message_id` varchar(255) DEFAULT NULL,
  `status` enum('success','failed') NOT NULL,
  `error_code` varchar(120) DEFAULT NULL,
  `error_message` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `push_notification_jobs`
--

CREATE TABLE `push_notification_jobs` (
  `id` bigint(20) NOT NULL,
  `user_id` int(11) NOT NULL,
  `token_id` bigint(20) DEFAULT NULL,
  `template_code` varchar(100) DEFAULT NULL,
  `category` enum('wallet','withdrawal','tournament','engagement','system') NOT NULL DEFAULT 'system',
  `title` varchar(160) NOT NULL,
  `body` varchar(500) NOT NULL,
  `data_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`data_json`)),
  `dedupe_key` varchar(191) DEFAULT NULL,
  `send_at` datetime NOT NULL,
  `status` enum('queued','processing','sent','failed','cancelled') NOT NULL DEFAULT 'queued',
  `attempt_count` int(11) NOT NULL DEFAULT 0,
  `max_attempts` tinyint(4) NOT NULL DEFAULT 3,
  `last_error` varchar(255) DEFAULT NULL,
  `sent_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tournaments`
--

CREATE TABLE `tournaments` (
  `id` int(11) NOT NULL,
  `match_id` varchar(50) NOT NULL,
  `mode_id` int(11) NOT NULL,
  `title` varchar(100) NOT NULL,
  `mode_slug` varchar(20) NOT NULL,
  `category` enum('br','cs','lw','hs') NOT NULL,
  `max_players` int(11) NOT NULL,
  `team_size` int(11) DEFAULT 1,
  `entry_fee` decimal(10,2) NOT NULL,
  `per_kill` decimal(10,2) DEFAULT 0.00,
  `win_prize` varchar(100) DEFAULT NULL,
  `prize_pool` decimal(10,2) DEFAULT 0.00,
  `room_id` varchar(50) DEFAULT NULL,
  `room_password` varchar(50) DEFAULT NULL,
  `start_time` datetime NOT NULL,
  `status` enum('upcoming','active','completed','cancelled') DEFAULT 'upcoming',
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tournament_entries`
--

CREATE TABLE `tournament_entries` (
  `id` int(11) NOT NULL,
  `tournament_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `slot_number` int(11) NOT NULL,
  `team_number` int(11) DEFAULT NULL,
  `status` enum('joined','playing','completed') DEFAULT 'joined',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `game_name` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `username` varchar(20) NOT NULL,
  `email` varchar(255) NOT NULL,
  `mobile` varchar(10) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('user','admin') DEFAULT 'user',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Triggers `users`
--
DELIMITER $$
CREATE TRIGGER `after_user_insert` AFTER INSERT ON `users` FOR EACH ROW BEGIN
  INSERT INTO wallets (user_id, balance)
  VALUES (NEW.id, 0.00)
  ON DUPLICATE KEY UPDATE balance = balance;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `after_user_insert_wallet` AFTER INSERT ON `users` FOR EACH ROW BEGIN
  INSERT INTO wallets (user_id, balance)
  VALUES (NEW.id, 0.00)
  ON DUPLICATE KEY UPDATE balance = balance;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `user_app_settings`
--

CREATE TABLE `user_app_settings` (
  `user_id` int(11) NOT NULL,
  `language_code` enum('en','hi') NOT NULL DEFAULT 'en',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_notification_preferences`
--

CREATE TABLE `user_notification_preferences` (
  `user_id` int(11) NOT NULL,
  `allow_push` tinyint(1) NOT NULL DEFAULT 1,
  `allow_wallet` tinyint(1) NOT NULL DEFAULT 1,
  `allow_withdrawal` tinyint(1) NOT NULL DEFAULT 1,
  `allow_tournament` tinyint(1) NOT NULL DEFAULT 1,
  `allow_engagement` tinyint(1) NOT NULL DEFAULT 1,
  `allow_promotions` tinyint(1) NOT NULL DEFAULT 1,
  `quiet_hours_start` time DEFAULT NULL,
  `quiet_hours_end` time DEFAULT NULL,
  `timezone` varchar(40) NOT NULL DEFAULT 'Asia/Kolkata',
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_push_tokens`
--

CREATE TABLE `user_push_tokens` (
  `id` bigint(20) NOT NULL,
  `user_id` int(11) NOT NULL,
  `platform` enum('android','ios','web') NOT NULL DEFAULT 'android',
  `fcm_token` varchar(255) NOT NULL,
  `device_id` varchar(120) DEFAULT NULL,
  `app_version` varchar(40) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `last_seen_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_upi_accounts`
--

CREATE TABLE `user_upi_accounts` (
  `user_id` int(11) NOT NULL,
  `upi_id` varchar(80) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `wallets`
--

CREATE TABLE `wallets` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `balance` decimal(10,2) DEFAULT 0.00,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `wallet_payment_transactions`
--

CREATE TABLE `wallet_payment_transactions` (
  `id` bigint(20) NOT NULL,
  `user_id` int(11) NOT NULL,
  `provider` enum('cashfree', 'razorpay') NOT NULL DEFAULT 'cashfree',
  `gateway_order_id` varchar(100) NOT NULL,
  `gateway_payment_id` varchar(100) DEFAULT NULL,
  `gateway_signature` varchar(255) DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `currency` char(3) NOT NULL DEFAULT 'INR',
  `status` enum('created','authorized','captured','failed','refunded') NOT NULL DEFAULT 'created',
  `credited_to_wallet` tinyint(1) NOT NULL DEFAULT 0,
  `credited_at` datetime DEFAULT NULL,
  `notes` varchar(255) DEFAULT NULL,
  `raw_payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`raw_payload`)),
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `wallet_transactions`
--

CREATE TABLE `wallet_transactions` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `type` enum('credit','debit') NOT NULL,
  `description` varchar(255) NOT NULL,
  `reference_id` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `withdrawal_requests`
--

CREATE TABLE `withdrawal_requests` (
  `id` bigint(20) NOT NULL,
  `user_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `method` varchar(30) DEFAULT NULL,
  `account_details` varchar(255) DEFAULT NULL,
  `upi_id` varchar(80) DEFAULT NULL,
  `status` enum('pending','approved','rejected','deposited') NOT NULL DEFAULT 'pending',
  `processed_by` int(11) DEFAULT NULL,
  `processed_at` datetime DEFAULT NULL,
  `admin_note` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `app_update_settings`
--
ALTER TABLE `app_update_settings`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `match_results`
--
ALTER TABLE `match_results`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_result` (`tournament_id`,`user_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `modes`
--
ALTER TABLE `modes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_notifications_user_created` (`user_id`,`created_at`),
  ADD KEY `idx_notifications_user_read_created` (`user_id`,`is_read`,`created_at`);

--
-- Indexes for table `notification_templates`
--
ALTER TABLE `notification_templates`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_notification_template_code` (`code`),
  ADD KEY `idx_notification_template_active` (`is_active`,`category`);

--
-- Indexes for table `password_reset_otps`
--
ALTER TABLE `password_reset_otps`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_password_reset_user_created` (`user_id`,`created_at`),
  ADD KEY `idx_password_reset_expiry` (`expires_at`),
  ADD KEY `idx_password_reset_used` (`user_id`,`used_at`);

--
-- Indexes for table `push_notification_delivery_logs`
--
ALTER TABLE `push_notification_delivery_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_push_log_token` (`token_id`),
  ADD KEY `idx_push_log_job` (`job_id`),
  ADD KEY `idx_push_log_user_created` (`user_id`,`created_at`),
  ADD KEY `idx_push_log_status_created` (`status`,`created_at`);

--
-- Indexes for table `push_notification_jobs`
--
ALTER TABLE `push_notification_jobs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_push_job_dedupe` (`dedupe_key`),
  ADD KEY `fk_push_job_token` (`token_id`),
  ADD KEY `idx_push_job_status_sendat` (`status`,`send_at`),
  ADD KEY `idx_push_job_user_created` (`user_id`,`created_at`),
  ADD KEY `idx_push_job_template` (`template_code`);

--
-- Indexes for table `tournaments`
--
ALTER TABLE `tournaments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `match_id` (`match_id`),
  ADD KEY `mode_id` (`mode_id`);

--
-- Indexes for table `tournament_entries`
--
ALTER TABLE `tournament_entries`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_slot` (`tournament_id`,`slot_number`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `idx_entry_user` (`tournament_id`,`user_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `mobile` (`mobile`);

--
-- Indexes for table `user_app_settings`
--
ALTER TABLE `user_app_settings`
  ADD PRIMARY KEY (`user_id`);

--
-- Indexes for table `user_notification_preferences`
--
ALTER TABLE `user_notification_preferences`
  ADD PRIMARY KEY (`user_id`);

--
-- Indexes for table `user_push_tokens`
--
ALTER TABLE `user_push_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_push_fcm_token` (`fcm_token`),
  ADD KEY `idx_push_user_active` (`user_id`,`is_active`),
  ADD KEY `idx_push_active_updated` (`is_active`,`updated_at`);

--
-- Indexes for table `user_upi_accounts`
--
ALTER TABLE `user_upi_accounts`
  ADD PRIMARY KEY (`user_id`),
  ADD KEY `idx_upi_id` (`upi_id`);

--
-- Indexes for table `wallets`
--
ALTER TABLE `wallets`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`);

--
-- Indexes for table `wallet_payment_transactions`
--
ALTER TABLE `wallet_payment_transactions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_wpt_order` (`gateway_order_id`),
  ADD UNIQUE KEY `uq_wpt_payment` (`gateway_payment_id`),
  ADD KEY `idx_wpt_user_created` (`user_id`,`created_at`),
  ADD KEY `idx_wpt_status_created` (`status`,`created_at`);

--
-- Indexes for table `wallet_transactions`
--
ALTER TABLE `wallet_transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_wt_user_type_created` (`user_id`,`type`,`created_at`),
  ADD KEY `idx_wt_type_desc_created` (`type`,`description`,`created_at`);

--
-- Indexes for table `withdrawal_requests`
--
ALTER TABLE `withdrawal_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_withdraw_processed_by` (`processed_by`),
  ADD KEY `idx_withdraw_status_created` (`status`,`created_at`),
  ADD KEY `idx_withdraw_user_created` (`user_id`,`created_at`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `match_results`
--
ALTER TABLE `match_results`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `notification_templates`
--
ALTER TABLE `notification_templates`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `password_reset_otps`
--
ALTER TABLE `password_reset_otps`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `push_notification_delivery_logs`
--
ALTER TABLE `push_notification_delivery_logs`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `push_notification_jobs`
--
ALTER TABLE `push_notification_jobs`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tournaments`
--
ALTER TABLE `tournaments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tournament_entries`
--
ALTER TABLE `tournament_entries`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `user_push_tokens`
--
ALTER TABLE `user_push_tokens`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `wallets`
--
ALTER TABLE `wallets`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `wallet_payment_transactions`
--
ALTER TABLE `wallet_payment_transactions`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `wallet_transactions`
--
ALTER TABLE `wallet_transactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `withdrawal_requests`
--
ALTER TABLE `withdrawal_requests`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `match_results`
--
ALTER TABLE `match_results`
  ADD CONSTRAINT `match_results_ibfk_1` FOREIGN KEY (`tournament_id`) REFERENCES `tournaments` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `match_results_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `fk_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `password_reset_otps`
--
ALTER TABLE `password_reset_otps`
  ADD CONSTRAINT `fk_password_reset_otp_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `push_notification_delivery_logs`
--
ALTER TABLE `push_notification_delivery_logs`
  ADD CONSTRAINT `fk_push_log_job` FOREIGN KEY (`job_id`) REFERENCES `push_notification_jobs` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_push_log_token` FOREIGN KEY (`token_id`) REFERENCES `user_push_tokens` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_push_log_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `push_notification_jobs`
--
ALTER TABLE `push_notification_jobs`
  ADD CONSTRAINT `fk_push_job_token` FOREIGN KEY (`token_id`) REFERENCES `user_push_tokens` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_push_job_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `tournaments`
--
ALTER TABLE `tournaments`
  ADD CONSTRAINT `tournaments_ibfk_1` FOREIGN KEY (`mode_id`) REFERENCES `modes` (`id`);

--
-- Constraints for table `tournament_entries`
--
ALTER TABLE `tournament_entries`
  ADD CONSTRAINT `tournament_entries_ibfk_1` FOREIGN KEY (`tournament_id`) REFERENCES `tournaments` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tournament_entries_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_app_settings`
--
ALTER TABLE `user_app_settings`
  ADD CONSTRAINT `fk_user_app_settings_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_notification_preferences`
--
ALTER TABLE `user_notification_preferences`
  ADD CONSTRAINT `fk_notification_pref_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_push_tokens`
--
ALTER TABLE `user_push_tokens`
  ADD CONSTRAINT `fk_push_token_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_upi_accounts`
--
ALTER TABLE `user_upi_accounts`
  ADD CONSTRAINT `fk_user_upi_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `wallets`
--
ALTER TABLE `wallets`
  ADD CONSTRAINT `wallets_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `wallet_payment_transactions`
--
ALTER TABLE `wallet_payment_transactions`
  ADD CONSTRAINT `fk_wpt_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `wallet_transactions`
--
ALTER TABLE `wallet_transactions`
  ADD CONSTRAINT `wallet_transactions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `withdrawal_requests`
--
ALTER TABLE `withdrawal_requests`
  ADD CONSTRAINT `fk_withdraw_processed_by` FOREIGN KEY (`processed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_withdraw_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
