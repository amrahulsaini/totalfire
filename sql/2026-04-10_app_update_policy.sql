-- TotalFire migration: Mobile app update policy controls
-- Safe to run on MySQL 8.x

CREATE TABLE IF NOT EXISTS app_update_settings (
  id INT PRIMARY KEY,
  latest_version VARCHAR(30) NOT NULL DEFAULT '1.0.0',
  min_supported_version VARCHAR(30) NOT NULL DEFAULT '1.0.0',
  force_update TINYINT(1) NOT NULL DEFAULT 0,
  title VARCHAR(120) NOT NULL DEFAULT 'Update Required',
  message VARCHAR(500) NOT NULL DEFAULT 'A new version of TotalFire is available. Please update to continue.',
  download_url VARCHAR(255) NOT NULL DEFAULT 'https://totalfire.in/downloads/totalfire-latest.apk',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO app_update_settings (
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
ON DUPLICATE KEY UPDATE id = id;
