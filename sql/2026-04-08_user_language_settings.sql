-- User language preference settings (cloud-synced)

CREATE TABLE IF NOT EXISTS user_app_settings (
  user_id INT PRIMARY KEY,
  language_code ENUM('en', 'hi') NOT NULL DEFAULT 'en',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_app_settings_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
