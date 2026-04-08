 -- 5) Helpful index for top-up reporting from wallet_transactions
ALTER TABLE wallet_transactions
  ADD INDEX idx_wt_user_type_created (user_id, type, created_at),
  ADD INDEX idx_wt_type_desc_created (type, description, created_at);

-- 6) User notifications table for wallet/tournament/withdrawal events
CREATE TABLE IF NOT EXISTS notifications (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  type ENUM('wallet', 'withdrawal', 'tournament', 'system') NOT NULL DEFAULT 'system',
  title VARCHAR(120) NOT NULL,
  message VARCHAR(500) NOT NULL,
  payload JSON NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_notifications_user_created (user_id, created_at),
  INDEX idx_notifications_user_read_created (user_id, is_read, created_at)
);
