-- Push Notifications + Engagement SQL (Firebase FCM-ready)
-- Database: MySQL 8+
-- This file contains:
-- 1) Required tables
-- 2) Template seeds
-- 3) Operational queries for scheduling and engagement

-- =====================================================
-- A) TABLES
-- =====================================================

-- 1) Device tokens for FCM push
CREATE TABLE IF NOT EXISTS user_push_tokens (
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
);

-- 2) Notification preferences per user
CREATE TABLE IF NOT EXISTS user_notification_preferences (
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
);

-- 3) Push templates
CREATE TABLE IF NOT EXISTS notification_templates (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(100) NOT NULL,
  channel ENUM('push','in_app','both') NOT NULL DEFAULT 'both',
  category ENUM('wallet','withdrawal','tournament','engagement','system') NOT NULL DEFAULT 'system',
  title_template VARCHAR(160) NOT NULL,
  body_template VARCHAR(500) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_notification_template_code (code),
  KEY idx_notification_template_active (is_active, category)
);

-- 4) Queue table for push send scheduler/worker
CREATE TABLE IF NOT EXISTS push_notification_jobs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token_id BIGINT DEFAULT NULL,
  template_code VARCHAR(100) DEFAULT NULL,
  category ENUM('wallet','withdrawal','tournament','engagement','system') NOT NULL DEFAULT 'system',
  title VARCHAR(160) NOT NULL,
  body VARCHAR(500) NOT NULL,
  data_json JSON DEFAULT NULL,
  dedupe_key VARCHAR(191) DEFAULT NULL,
  send_at DATETIME NOT NULL,
  status ENUM('queued','processing','sent','failed','cancelled') NOT NULL DEFAULT 'queued',
  attempt_count INT NOT NULL DEFAULT 0,
  max_attempts TINYINT NOT NULL DEFAULT 3,
  last_error VARCHAR(255) DEFAULT NULL,
  sent_at DATETIME DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_push_job_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_push_job_token FOREIGN KEY (token_id) REFERENCES user_push_tokens(id) ON DELETE SET NULL,
  UNIQUE KEY uq_push_job_dedupe (dedupe_key),
  KEY idx_push_job_status_sendat (status, send_at),
  KEY idx_push_job_user_created (user_id, created_at),
  KEY idx_push_job_template (template_code)
);

-- 5) Delivery logs per token attempt
CREATE TABLE IF NOT EXISTS push_notification_delivery_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  job_id BIGINT NOT NULL,
  user_id INT NOT NULL,
  token_id BIGINT DEFAULT NULL,
  provider ENUM('fcm') NOT NULL DEFAULT 'fcm',
  provider_message_id VARCHAR(255) DEFAULT NULL,
  status ENUM('success','failed') NOT NULL,
  error_code VARCHAR(120) DEFAULT NULL,
  error_message VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_push_log_job FOREIGN KEY (job_id) REFERENCES push_notification_jobs(id) ON DELETE CASCADE,
  CONSTRAINT fk_push_log_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_push_log_token FOREIGN KEY (token_id) REFERENCES user_push_tokens(id) ON DELETE SET NULL,
  KEY idx_push_log_job (job_id),
  KEY idx_push_log_user_created (user_id, created_at),
  KEY idx_push_log_status_created (status, created_at)
);


-- =====================================================
-- B) TEMPLATE SEEDS
-- =====================================================

INSERT INTO notification_templates (code, channel, category, title_template, body_template)
VALUES
  ('TOURNAMENT_REMINDER_60M', 'push', 'tournament', 'Match in 60 minutes', 'Your match {{title}} starts in 60 minutes. Join on time.'),
  ('TOURNAMENT_REMINDER_10M', 'push', 'tournament', 'Match starts in 10 minutes', 'Hurry up! {{title}} starts in 10 minutes.'),
  ('ROOM_DETAILS_READY', 'push', 'tournament', 'Room details unlocked', 'Room details for {{title}} are now available.'),
  ('LOW_SEATS_ALERT', 'push', 'engagement', 'Only {{seats_left}} seats left', '{{title}} is filling fast. Join before slots are gone.'),
  ('REENGAGEMENT_NUDGE', 'push', 'engagement', 'New matches waiting', 'Come back and join upcoming tournaments to win more rewards.'),
  ('WALLET_CREDITED', 'both', 'wallet', 'Wallet credited', 'INR {{amount}} added to your wallet.'),
  ('WITHDRAWAL_APPROVED', 'both', 'withdrawal', 'Withdrawal approved', 'Your withdrawal request of INR {{amount}} is approved.'),
  ('WITHDRAWAL_DEPOSITED', 'both', 'withdrawal', 'Withdrawal sent', 'INR {{amount}} has been deposited to your account.')
ON DUPLICATE KEY UPDATE
  channel = VALUES(channel),
  category = VALUES(category),
  title_template = VALUES(title_template),
  body_template = VALUES(body_template),
  is_active = 1;


-- =====================================================
-- C) OPERATIONAL QUERIES
-- =====================================================

-- C1) Register / refresh FCM token (run from API on app login/start)
-- Params:
--   ?1 user_id, ?2 platform, ?3 fcm_token, ?4 device_id, ?5 app_version
INSERT INTO user_push_tokens (user_id, platform, fcm_token, device_id, app_version, is_active, last_seen_at)
VALUES (?, ?, ?, ?, ?, 1, NOW())
ON DUPLICATE KEY UPDATE
  user_id = VALUES(user_id),
  platform = VALUES(platform),
  device_id = VALUES(device_id),
  app_version = VALUES(app_version),
  is_active = 1,
  last_seen_at = NOW(),
  updated_at = NOW();


-- C2) Ensure preference row exists for users
INSERT INTO user_notification_preferences (user_id)
SELECT u.id
FROM users u
LEFT JOIN user_notification_preferences p ON p.user_id = u.id
WHERE p.user_id IS NULL;


-- C3) Queue 60-minute reminder for joined users (run every 5-10 minutes)
INSERT INTO push_notification_jobs
  (user_id, template_code, category, title, body, data_json, dedupe_key, send_at, status)
SELECT
  te.user_id,
  'TOURNAMENT_REMINDER_60M',
  'tournament',
  'Match in 60 minutes',
  CONCAT('Your match ', t.title, ' starts in 60 minutes. Join on time.'),
  JSON_OBJECT('tournamentId', t.id, 'matchId', t.match_id, 'type', 'reminder_60m'),
  CONCAT('REM60_', t.id, '_', te.user_id),
  DATE_SUB(t.start_time, INTERVAL 60 MINUTE),
  'queued'
FROM tournaments t
JOIN tournament_entries te ON te.tournament_id = t.id
JOIN user_notification_preferences p ON p.user_id = te.user_id
WHERE t.status = 'upcoming'
  AND t.is_active = 1
  AND p.allow_push = 1
  AND p.allow_tournament = 1
  AND DATE_SUB(t.start_time, INTERVAL 60 MINUTE) BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 7 DAY)
  AND NOT EXISTS (
    SELECT 1 FROM push_notification_jobs j
    WHERE j.dedupe_key = CONCAT('REM60_', t.id, '_', te.user_id)
  );


-- C4) Queue 10-minute reminder for joined users
INSERT INTO push_notification_jobs
  (user_id, template_code, category, title, body, data_json, dedupe_key, send_at, status)
SELECT
  te.user_id,
  'TOURNAMENT_REMINDER_10M',
  'tournament',
  'Match starts in 10 minutes',
  CONCAT('Hurry up! ', t.title, ' starts in 10 minutes.'),
  JSON_OBJECT('tournamentId', t.id, 'matchId', t.match_id, 'type', 'reminder_10m'),
  CONCAT('REM10_', t.id, '_', te.user_id),
  DATE_SUB(t.start_time, INTERVAL 10 MINUTE),
  'queued'
FROM tournaments t
JOIN tournament_entries te ON te.tournament_id = t.id
JOIN user_notification_preferences p ON p.user_id = te.user_id
WHERE t.status = 'upcoming'
  AND t.is_active = 1
  AND p.allow_push = 1
  AND p.allow_tournament = 1
  AND DATE_SUB(t.start_time, INTERVAL 10 MINUTE) BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 7 DAY)
  AND NOT EXISTS (
    SELECT 1 FROM push_notification_jobs j
    WHERE j.dedupe_key = CONCAT('REM10_', t.id, '_', te.user_id)
  );


-- C5) Queue room-details-ready push (when room id/password exists)
INSERT INTO push_notification_jobs
  (user_id, template_code, category, title, body, data_json, dedupe_key, send_at, status)
SELECT
  te.user_id,
  'ROOM_DETAILS_READY',
  'tournament',
  'Room details unlocked',
  CONCAT('Room details for ', t.title, ' are now available.'),
  JSON_OBJECT(
    'tournamentId', t.id,
    'matchId', t.match_id,
    'roomId', t.room_id,
    'roomPassword', t.room_password,
    'type', 'room_ready'
  ),
  CONCAT('ROOM_READY_', t.id, '_', te.user_id),
  GREATEST(DATE_SUB(t.start_time, INTERVAL 5 MINUTE), NOW()),
  'queued'
FROM tournaments t
JOIN tournament_entries te ON te.tournament_id = t.id
JOIN user_notification_preferences p ON p.user_id = te.user_id
WHERE t.status = 'upcoming'
  AND t.is_active = 1
  AND t.room_id IS NOT NULL
  AND t.room_id <> ''
  AND p.allow_push = 1
  AND p.allow_tournament = 1
  AND t.start_time BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 2 DAY)
  AND NOT EXISTS (
    SELECT 1 FROM push_notification_jobs j
    WHERE j.dedupe_key = CONCAT('ROOM_READY_', t.id, '_', te.user_id)
  );


-- C6) Low-seats engagement (users interested in same mode but not joined this match)
-- Rule: send when upcoming tournament has between 1 and 8 seats left.
INSERT INTO push_notification_jobs
  (user_id, template_code, category, title, body, data_json, dedupe_key, send_at, status)
SELECT DISTINCT
  mode_users.user_id,
  'LOW_SEATS_ALERT',
  'engagement',
  CONCAT('Only ', low_seat.seats_left, ' seats left'),
  CONCAT(low_seat.title, ' is filling fast. Join before slots are gone.'),
  JSON_OBJECT(
    'tournamentId', low_seat.id,
    'matchId', low_seat.match_id,
    'modeSlug', low_seat.mode_slug,
    'seatsLeft', low_seat.seats_left,
    'type', 'low_seats'
  ),
  CONCAT('LOWSEAT_', low_seat.id, '_', mode_users.user_id),
  NOW(),
  'queued'
FROM (
  SELECT
    t.id,
    t.match_id,
    t.title,
    t.mode_slug,
    t.max_players - COUNT(te.id) AS seats_left
  FROM tournaments t
  LEFT JOIN tournament_entries te ON te.tournament_id = t.id
  WHERE t.status = 'upcoming'
    AND t.is_active = 1
    AND t.start_time BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 2 DAY)
  GROUP BY t.id, t.match_id, t.title, t.mode_slug, t.max_players
  HAVING seats_left BETWEEN 1 AND 8
) low_seat
JOIN (
  SELECT DISTINCT te.user_id, t.mode_slug
  FROM tournament_entries te
  JOIN tournaments t ON t.id = te.tournament_id
  WHERE t.start_time >= DATE_SUB(NOW(), INTERVAL 60 DAY)
) mode_users ON mode_users.mode_slug = low_seat.mode_slug
JOIN user_notification_preferences p ON p.user_id = mode_users.user_id
LEFT JOIN tournament_entries already_joined
  ON already_joined.tournament_id = low_seat.id
 AND already_joined.user_id = mode_users.user_id
WHERE p.allow_push = 1
  AND p.allow_engagement = 1
  AND already_joined.id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM push_notification_jobs j
    WHERE j.dedupe_key = CONCAT('LOWSEAT_', low_seat.id, '_', mode_users.user_id)
  );


-- C7) Re-engagement campaign for inactive users (no join in last 3 days)
INSERT INTO push_notification_jobs
  (user_id, template_code, category, title, body, data_json, dedupe_key, send_at, status)
SELECT
  u.id,
  'REENGAGEMENT_NUDGE',
  'engagement',
  'New matches waiting',
  'Come back and join upcoming tournaments to win more rewards.',
  JSON_OBJECT('type', 'reengagement_daily'),
  CONCAT('REENGAGE_', DATE_FORMAT(NOW(), '%Y%m%d'), '_', u.id),
  NOW(),
  'queued'
FROM users u
LEFT JOIN (
  SELECT te.user_id, MAX(t.start_time) AS last_played_at
  FROM tournament_entries te
  JOIN tournaments t ON t.id = te.tournament_id
  GROUP BY te.user_id
) lp ON lp.user_id = u.id
JOIN user_notification_preferences p ON p.user_id = u.id
WHERE u.role = 'user'
  AND p.allow_push = 1
  AND p.allow_engagement = 1
  AND (lp.last_played_at IS NULL OR lp.last_played_at < DATE_SUB(NOW(), INTERVAL 3 DAY))
  AND NOT EXISTS (
    SELECT 1 FROM push_notification_jobs j
    WHERE j.dedupe_key = CONCAT('REENGAGE_', DATE_FORMAT(NOW(), '%Y%m%d'), '_', u.id)
  );


-- C8) Worker: fetch due jobs + active tokens
-- Use in your backend scheduler every minute.
SELECT
  j.id,
  j.user_id,
  j.template_code,
  j.category,
  j.title,
  j.body,
  j.data_json,
  j.attempt_count,
  j.max_attempts,
  t.id AS token_id,
  t.fcm_token,
  t.platform
FROM push_notification_jobs j
JOIN user_notification_preferences p ON p.user_id = j.user_id
JOIN user_push_tokens t ON t.user_id = j.user_id
WHERE j.status = 'queued'
  AND j.send_at <= NOW()
  AND p.allow_push = 1
  AND t.is_active = 1
ORDER BY j.send_at ASC
LIMIT 500;


-- C9) Worker: lock job for processing
-- Param: ?1 job_id
UPDATE push_notification_jobs
SET status = 'processing', updated_at = NOW()
WHERE id = ?
  AND status = 'queued';


-- C10) Worker: mark sent success
-- Params: ?1 job_id
UPDATE push_notification_jobs
SET status = 'sent',
    sent_at = NOW(),
    attempt_count = attempt_count + 1,
    updated_at = NOW()
WHERE id = ?;


-- C11) Worker: mark failed and retry with backoff
-- Params: ?1 error_message, ?2 job_id
UPDATE push_notification_jobs
SET
  status = CASE WHEN attempt_count + 1 >= max_attempts THEN 'failed' ELSE 'queued' END,
  attempt_count = attempt_count + 1,
  last_error = ?,
  send_at = CASE
    WHEN attempt_count + 1 >= max_attempts THEN send_at
    ELSE DATE_ADD(NOW(), INTERVAL 2 MINUTE)
  END,
  updated_at = NOW()
WHERE id = ?;


-- C12) Save provider log entry
-- Params: ?1 job_id, ?2 user_id, ?3 token_id, ?4 provider_message_id, ?5 status, ?6 error_code, ?7 error_message
INSERT INTO push_notification_delivery_logs
  (job_id, user_id, token_id, provider, provider_message_id, status, error_code, error_message)
VALUES
  (?, ?, ?, 'fcm', ?, ?, ?, ?);


-- C13) Deactivate invalid token (FCM NotRegistered / InvalidRegistration)
-- Param: ?1 token_id
UPDATE user_push_tokens
SET is_active = 0, updated_at = NOW()
WHERE id = ?;


-- =====================================================
-- D) REPORTING QUERIES
-- =====================================================

-- D1) Push send performance by day
SELECT
  DATE(created_at) AS day,
  SUM(status = 'queued') AS queued_jobs,
  SUM(status = 'processing') AS processing_jobs,
  SUM(status = 'sent') AS sent_jobs,
  SUM(status = 'failed') AS failed_jobs
FROM push_notification_jobs
GROUP BY DATE(created_at)
ORDER BY day DESC;


-- D2) Top failed reasons
SELECT
  last_error,
  COUNT(*) AS failures
FROM push_notification_jobs
WHERE status = 'failed'
GROUP BY last_error
ORDER BY failures DESC
LIMIT 20;


-- D3) Active token count by platform
SELECT
  platform,
  COUNT(*) AS active_tokens
FROM user_push_tokens
WHERE is_active = 1
GROUP BY platform;


-- D4) Upcoming tournaments with seats left (engagement monitor)
SELECT
  t.id,
  t.match_id,
  t.title,
  t.mode_slug,
  t.start_time,
  t.max_players,
  COUNT(te.id) AS joined_players,
  t.max_players - COUNT(te.id) AS seats_left
FROM tournaments t
LEFT JOIN tournament_entries te ON te.tournament_id = t.id
WHERE t.status = 'upcoming'
  AND t.is_active = 1
  AND t.start_time > NOW()
GROUP BY t.id, t.match_id, t.title, t.mode_slug, t.start_time, t.max_players
ORDER BY t.start_time ASC;
