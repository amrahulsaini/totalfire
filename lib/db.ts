import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || undefined,
  database: process.env.DB_NAME,
  ...(process.env.DB_PORT ? { port: Number(process.env.DB_PORT) } : {}),
  dateStrings: true,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Set IST timezone for every new connection so all TIMESTAMP reads/writes
// and NOW() / CURRENT_TIMESTAMP use Indian Standard Time (+05:30).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(pool as any).pool.on("connection", (conn: any) => {
  conn.query("SET time_zone = '+05:30'");
});

// Auto-migrate: add game_name (utf8mb4 for emojis/symbols) if it doesn't exist yet.
pool
  .query(
    `ALTER TABLE tournament_entries
     ADD COLUMN IF NOT EXISTS game_name VARCHAR(100)
       CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL`
  )
  .catch(() => {
    // Non-fatal — column may already exist or table not yet created.
  });

pool
  .query(
    `ALTER TABLE withdrawal_requests
     ADD COLUMN IF NOT EXISTS method VARCHAR(30) NULL AFTER amount,
     ADD COLUMN IF NOT EXISTS account_details VARCHAR(255) NULL AFTER method,
     ADD COLUMN IF NOT EXISTS upi_id VARCHAR(80) NULL AFTER account_details,
     ADD COLUMN IF NOT EXISTS processed_by INT NULL AFTER status,
     ADD COLUMN IF NOT EXISTS processed_at DATETIME NULL AFTER processed_by,
     ADD COLUMN IF NOT EXISTS admin_note VARCHAR(255) NULL AFTER processed_at`
  )
  .catch(() => {
    // Non-fatal — table may not exist in brand new setup yet.
  });

pool
  .query(
    `ALTER TABLE withdrawal_requests
     MODIFY COLUMN status ENUM('pending','approved','rejected','deposited')
     NOT NULL DEFAULT 'pending'`
  )
  .catch(() => {
    // Non-fatal — status may already match or table may not exist.
  });

pool
  .query(
    `CREATE TABLE IF NOT EXISTS user_upi_accounts (
      user_id INT PRIMARY KEY,
      upi_id VARCHAR(80) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_user_upi_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      KEY idx_upi_id (upi_id)
    )`
  )
  .catch(() => {
    // Non-fatal — table migration should not block startup.
  });

pool
  .query(
    `ALTER TABLE modes
     MODIFY COLUMN category ENUM('br','cs','lw','hs') NOT NULL`
  )
  .catch(() => {
    // Non-fatal — mode category may already match or table may not exist.
  });

pool
  .query(
    `ALTER TABLE tournaments
     MODIFY COLUMN category ENUM('br','cs','lw','hs') NOT NULL`
  )
  .catch(() => {
    // Non-fatal — tournament category may already match or table may not exist.
  });

pool
  .query(
    `CREATE TABLE IF NOT EXISTS notifications (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      type ENUM('wallet','withdrawal','tournament','system') NOT NULL DEFAULT 'system',
      title VARCHAR(120) NOT NULL,
      message VARCHAR(500) NOT NULL,
      payload JSON NULL,
      is_read TINYINT(1) NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_notifications_user_created (user_id, created_at),
      INDEX idx_notifications_user_read_created (user_id, is_read, created_at)
    )`
  )
  .catch(() => {
    // Non-fatal — table migration should not block startup.
  });

pool
  .query(
    `CREATE TABLE IF NOT EXISTS user_push_tokens (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      platform ENUM('android','ios','web') NOT NULL DEFAULT 'android',
      fcm_token VARCHAR(255) NOT NULL,
      device_id VARCHAR(120) DEFAULT NULL,
      app_version VARCHAR(40) DEFAULT NULL,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      last_seen_at DATETIME DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_push_token_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE KEY uq_push_fcm_token (fcm_token),
      KEY idx_push_user_active (user_id, is_active),
      KEY idx_push_active_updated (is_active, updated_at)
    )`
  )
  .catch(() => {
    // Non-fatal — table migration should not block startup.
  });

pool
  .query(
    `CREATE TABLE IF NOT EXISTS user_notification_preferences (
      user_id INT PRIMARY KEY,
      allow_push TINYINT(1) NOT NULL DEFAULT 1,
      allow_wallet TINYINT(1) NOT NULL DEFAULT 1,
      allow_withdrawal TINYINT(1) NOT NULL DEFAULT 1,
      allow_tournament TINYINT(1) NOT NULL DEFAULT 1,
      allow_engagement TINYINT(1) NOT NULL DEFAULT 1,
      allow_promotions TINYINT(1) NOT NULL DEFAULT 1,
      quiet_hours_start TIME DEFAULT NULL,
      quiet_hours_end TIME DEFAULT NULL,
      timezone VARCHAR(40) NOT NULL DEFAULT 'Asia/Kolkata',
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_notification_pref_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`
  )
  .catch(() => {
    // Non-fatal — table migration should not block startup.
  });

pool
  .query(
    `CREATE TABLE IF NOT EXISTS user_app_settings (
      user_id INT PRIMARY KEY,
      language_code ENUM('en','hi') NOT NULL DEFAULT 'en',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_user_app_settings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`
  )
  .catch(() => {
    // Non-fatal — table migration should not block startup.
  });

pool
  .query(
    `CREATE TABLE IF NOT EXISTS password_reset_otps (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      otp_hash VARCHAR(255) NOT NULL,
      expires_at DATETIME NOT NULL,
      verified_at DATETIME DEFAULT NULL,
      used_at DATETIME DEFAULT NULL,
      attempts INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_password_reset_otp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_password_reset_user_created (user_id, created_at),
      INDEX idx_password_reset_expiry (expires_at),
      INDEX idx_password_reset_used (user_id, used_at)
    )`
  )
  .catch(() => {
    // Non-fatal — table migration should not block startup.
  });

pool
  .query(
    `CREATE TABLE IF NOT EXISTS app_update_settings (
      id INT PRIMARY KEY,
      latest_version VARCHAR(30) NOT NULL DEFAULT '1.0.0',
      min_supported_version VARCHAR(30) NOT NULL DEFAULT '1.0.0',
      force_update TINYINT(1) NOT NULL DEFAULT 0,
      title VARCHAR(120) NOT NULL DEFAULT 'Update Required',
      message VARCHAR(500) NOT NULL DEFAULT 'A new version of TotalFire is available. Please update to continue.',
      download_url VARCHAR(255) NOT NULL DEFAULT 'https://totalfire.in/downloads/totalfire-latest.apk',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`
  )
  .catch(() => {
    // Non-fatal — table migration should not block startup.
  });

pool
  .query(
    `INSERT INTO app_update_settings (
      id,
      latest_version,
      min_supported_version,
      force_update,
      title,
      message,
      download_url
    ) VALUES (
      1,
      '1.0.0',
      '1.0.0',
      0,
      'Update Required',
      'A new version of TotalFire is available. Please update to continue.',
      'https://totalfire.in/downloads/totalfire-latest.apk'
    )
    ON DUPLICATE KEY UPDATE id = id`
  )
  .catch(() => {
    // Non-fatal — table migration should not block startup.
  });

export default pool;
