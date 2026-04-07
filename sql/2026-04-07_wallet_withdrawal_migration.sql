-- Wallet + Withdrawal migration for TotalFire
-- Run this in the same database used by the app (for example: tota_db)

-- 1) Add optional withdrawal details for better admin handling
ALTER TABLE withdrawal_requests
  ADD COLUMN method VARCHAR(30) NULL AFTER amount,
  ADD COLUMN account_details VARCHAR(255) NULL AFTER method,
  ADD COLUMN processed_by INT NULL AFTER status,
  ADD COLUMN processed_at DATETIME NULL AFTER processed_by,
  ADD COLUMN admin_note VARCHAR(255) NULL AFTER processed_at;

-- 2) Index to speed up pending/history fetches
ALTER TABLE withdrawal_requests
  ADD INDEX idx_withdraw_status_created (status, created_at);

-- 3) Link processed_by to admin user
ALTER TABLE withdrawal_requests
  ADD CONSTRAINT fk_withdraw_processed_by
  FOREIGN KEY (processed_by) REFERENCES users(id)
  ON DELETE SET NULL;

-- 4) Track gateway-level payment lifecycle separately from wallet ledger
CREATE TABLE IF NOT EXISTS wallet_payment_transactions (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  provider ENUM('razorpay') NOT NULL DEFAULT 'razorpay',
  gateway_order_id VARCHAR(100) NOT NULL,
  gateway_payment_id VARCHAR(100) DEFAULT NULL,
  gateway_signature VARCHAR(255) DEFAULT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'INR',
  status ENUM('created', 'authorized', 'captured', 'failed', 'refunded') NOT NULL DEFAULT 'created',
  credited_to_wallet TINYINT(1) NOT NULL DEFAULT 0,
  credited_at DATETIME NULL,
  notes VARCHAR(255) DEFAULT NULL,
  raw_payload JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_wpt_order (gateway_order_id),
  UNIQUE KEY uq_wpt_payment (gateway_payment_id),
  KEY idx_wpt_user_created (user_id, created_at),
  KEY idx_wpt_status_created (status, created_at),
  CONSTRAINT fk_wpt_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 5) Helpful index for top-up reporting from wallet_transactions
ALTER TABLE wallet_transactions
  ADD INDEX idx_wt_user_type_created (user_id, type, created_at),
  ADD INDEX idx_wt_type_desc_created (type, description, created_at);
