-- Full wallet + withdrawal + payment tables for TotalFire
-- Run this on a fresh database where users table already exists.
-- Required dependency:
--   users(id) must be present as PRIMARY KEY.

-- 1) Wallet balance per user
CREATE TABLE IF NOT EXISTS wallets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  balance DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_wallet_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 2) Wallet ledger (every credit/debit entry)
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  type ENUM('credit', 'debit') NOT NULL,
  description VARCHAR(255) NOT NULL,
  reference_id VARCHAR(100) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_wallet_tx_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_wt_user_created (user_id, created_at),
  INDEX idx_wt_type_desc_created (type, description, created_at),
  INDEX idx_wt_reference (reference_id)
);

-- 3) User withdrawal requests
CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  method VARCHAR(30) DEFAULT NULL,
  account_details VARCHAR(255) DEFAULT NULL,
  status ENUM('pending', 'approved', 'rejected', 'deposited') NOT NULL DEFAULT 'pending',
  processed_by INT DEFAULT NULL,
  processed_at DATETIME DEFAULT NULL,
  admin_note VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_withdraw_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_withdraw_processed_by FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_withdraw_status_created (status, created_at),
  INDEX idx_withdraw_user_created (user_id, created_at)
);

-- 4) Gateway-level payment tracking (Cashfree order/payment lifecycle)
CREATE TABLE IF NOT EXISTS wallet_payment_transactions (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  provider ENUM('cashfree', 'razorpay') NOT NULL DEFAULT 'cashfree',
  gateway_order_id VARCHAR(100) NOT NULL,
  gateway_payment_id VARCHAR(100) DEFAULT NULL,
  gateway_signature VARCHAR(255) DEFAULT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'INR',
  status ENUM('created', 'authorized', 'captured', 'failed', 'refunded') NOT NULL DEFAULT 'created',
  credited_to_wallet TINYINT(1) NOT NULL DEFAULT 0,
  credited_at DATETIME DEFAULT NULL,
  notes VARCHAR(255) DEFAULT NULL,
  raw_payload JSON DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_wpt_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_wpt_order (gateway_order_id),
  UNIQUE KEY uq_wpt_payment (gateway_payment_id),
  INDEX idx_wpt_user_created (user_id, created_at),
  INDEX idx_wpt_status_created (status, created_at)
);

-- 5) User notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  type ENUM('wallet', 'withdrawal', 'tournament', 'system') NOT NULL DEFAULT 'system',
  title VARCHAR(120) NOT NULL,
  message VARCHAR(500) NOT NULL,
  payload JSON DEFAULT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_notifications_user_created (user_id, created_at),
  INDEX idx_notifications_user_read_created (user_id, is_read, created_at)
);

-- 6) Auto-create wallet when a new user is inserted
DROP TRIGGER IF EXISTS after_user_insert_wallet;
DELIMITER //
CREATE TRIGGER after_user_insert_wallet
AFTER INSERT ON users
FOR EACH ROW
BEGIN
  INSERT INTO wallets (user_id, balance)
  VALUES (NEW.id, 0.00)
  ON DUPLICATE KEY UPDATE balance = balance;
END //
DELIMITER ;
