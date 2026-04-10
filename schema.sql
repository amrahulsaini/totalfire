-- TotalFire Database Schema
-- Run this on your MySQL server

CREATE DATABASE IF NOT EXISTS tota_db;
USE tota_db;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  username VARCHAR(20) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  mobile VARCHAR(10) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Wallets table
CREATE TABLE IF NOT EXISTS wallets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  balance DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Wallet transactions
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  type ENUM('credit', 'debit') NOT NULL,
  description VARCHAR(255) NOT NULL,
  reference_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Mode catalog table (all tournament details shared earlier)
CREATE TABLE IF NOT EXISTS modes (
  id INT PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  slug VARCHAR(50) NOT NULL UNIQUE,
  image VARCHAR(255) NOT NULL,
  app_image VARCHAR(255) NOT NULL,
  category ENUM('br', 'cs', 'lw', 'hs') NOT NULL,
  players_label VARCHAR(60) NOT NULL,
  max_players INT NOT NULL,
  team_size INT NOT NULL DEFAULT 1,
  entry_fee DECIMAL(10,2) NOT NULL,
  per_kill DECIMAL(10,2) DEFAULT NULL,
  prize_pool DECIMAL(10,2) DEFAULT NULL,
  win_prize VARCHAR(100) DEFAULT NULL,
  full_description TEXT NOT NULL,
  rules_json JSON NOT NULL,
  reward_breakdown_json JSON NOT NULL,
  sort_order INT NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tournaments table
CREATE TABLE IF NOT EXISTS tournaments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  match_id VARCHAR(50) NOT NULL UNIQUE,
  mode_id INT NOT NULL,
  title VARCHAR(100) NOT NULL,
  mode_slug VARCHAR(20) NOT NULL,
  category ENUM('br', 'cs', 'lw', 'hs') NOT NULL,
  max_players INT NOT NULL,
  team_size INT NOT NULL DEFAULT 1,
  entry_fee DECIMAL(10,2) NOT NULL,
  per_kill DECIMAL(10,2) DEFAULT 0,
  win_prize VARCHAR(100),
  prize_pool DECIMAL(10,2) DEFAULT 0,
  room_id VARCHAR(50),
  room_password VARCHAR(50),
  start_time DATETIME NOT NULL,
  status ENUM('upcoming', 'active', 'completed', 'cancelled') DEFAULT 'upcoming',
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (mode_id) REFERENCES modes(id)
);

-- Tournament entries (who joined which tournament)
CREATE TABLE IF NOT EXISTS tournament_entries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tournament_id INT NOT NULL,
  user_id INT NOT NULL,
  slot_number INT NOT NULL,
  team_number INT,
  status ENUM('joined', 'playing', 'completed') DEFAULT 'joined',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_entry (tournament_id, user_id),
  UNIQUE KEY unique_slot (tournament_id, slot_number)
);

-- Match results (kills and rewards per user per tournament)
CREATE TABLE IF NOT EXISTS match_results (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tournament_id INT NOT NULL,
  user_id INT NOT NULL,
  kills INT DEFAULT 0,
  reward_amount DECIMAL(10,2) DEFAULT 0,
  is_winner TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_result (tournament_id, user_id)
);

-- Withdrawal requests
CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  method VARCHAR(30) NULL,
  account_details VARCHAR(255) NULL,
  upi_id VARCHAR(80) NULL,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_upi_accounts (
  user_id INT PRIMARY KEY,
  upi_id VARCHAR(80) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Per-user app settings (language preference synced from mobile app)
CREATE TABLE IF NOT EXISTS user_app_settings (
  user_id INT PRIMARY KEY,
  language_code ENUM('en', 'hi') NOT NULL DEFAULT 'en',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- App version update policy (used by mobile startup gate)
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

-- Password reset OTP sessions
CREATE TABLE IF NOT EXISTS password_reset_otps (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  otp_hash VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  verified_at DATETIME DEFAULT NULL,
  used_at DATETIME DEFAULT NULL,
  attempts INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_password_reset_user_created (user_id, created_at),
  INDEX idx_password_reset_expiry (expires_at),
  INDEX idx_password_reset_used (user_id, used_at)
);

-- Create trigger to auto-create wallet for new users
DROP TRIGGER IF EXISTS after_user_insert;
DELIMITER //
CREATE TRIGGER after_user_insert
AFTER INSERT ON users
FOR EACH ROW
BEGIN
  INSERT INTO wallets (user_id, balance)
  VALUES (NEW.id, 0.00)
  ON DUPLICATE KEY UPDATE balance = balance;
END //
DELIMITER ;

-- Seed all predefined TotalFire mode details
INSERT INTO modes (
  id,
  title,
  slug,
  image,
  app_image,
  category,
  players_label,
  max_players,
  team_size,
  entry_fee,
  per_kill,
  prize_pool,
  win_prize,
  full_description,
  rules_json,
  reward_breakdown_json,
  sort_order,
  is_active
) VALUES
  (
    1,
    'BR Ranked — Solo',
    'br-ranked',
    '/modes-images/br-allmodes.jpeg',
    '/modes-images/app-inside/br-solo.jpeg',
    'br',
    '48 Players (Solo)',
    48,
    1,
    25,
    20,
    400,
    NULL,
    'Battle Royale Ranked Solo mode with 48 solo players. Every kill earns ₹20. The displayed prize pool is for tournament context, but the main payout logic is driven by kill rewards and admin-updated results.',
    '["48 solo players per match","Entry fee: ₹25 per player","Per kill reward: ₹20","Prize pool shown as ₹400","Solo teaming is strictly prohibited","All players must join before match start","Admins verify final results and payouts"]',
    '[{"label":"Entry Fee","value":"₹25 per player"},{"label":"Per Kill","value":"₹20"},{"label":"Prize Pool","value":"₹400"},{"label":"Slots","value":"48 solo slots"}]',
    1,
    1
  ),
  (
    2,
    'BR — Duo',
    'br-duo',
    '/modes-images/br-allmodes.jpeg',
    '/modes-images/app-inside/br-duo.jpeg',
    'br',
    '48 Players (2×24)',
    48,
    2,
    25,
    20,
    500,
    NULL,
    'Battle Royale Duo mode with 24 teams and 48 total players. Every kill earns ₹20. The prize pool is displayed for visibility, while actual reward distribution is managed through kills and admin-entered results.',
    '["24 duo teams, 48 players total","Entry fee: ₹25 per player","Per kill reward: ₹20","Prize pool shown as ₹500","Team coordination matters for slot assignment","No cross-team collaboration allowed","Admins control room details and result settlement"]',
    '[{"label":"Entry Fee","value":"₹25 per player"},{"label":"Per Kill","value":"₹20"},{"label":"Prize Pool","value":"₹500"},{"label":"Teams","value":"24 duo teams"}]',
    2,
    1
  ),
  (
    3,
    'BR — Squad',
    'br-squad',
    '/modes-images/br-allmodes.jpeg',
    '/modes-images/app-inside/br-squad.jpeg',
    'br',
    '48 Players (4×12)',
    48,
    4,
    20,
    15,
    500,
    NULL,
    'Battle Royale Squad mode with 12 squads and 48 total players. Every kill earns ₹15. Squad slots are grouped by team so admins and players can see the occupied positions clearly.',
    '["12 squads, 4 players each","Entry fee: ₹20 per player","Per kill reward: ₹15","Prize pool shown as ₹500","Team slots fill in grouped order","Full squads are shown in upcoming entries","Admins finalize reward credits after the match"]',
    '[{"label":"Entry Fee","value":"₹20 per player"},{"label":"Per Kill","value":"₹15"},{"label":"Prize Pool","value":"₹500"},{"label":"Teams","value":"12 squad teams"}]',
    3,
    1
  ),
  (
    4,
    'CS 1 vs 1',
    'cs-1v1',
    '/modes-images/cs1vs1.jpeg',
    '/modes-images/app-inside/cs1vs1.webp',
    'cs',
    '2 Players',
    2,
    1,
    25,
    NULL,
    NULL,
    '₹40 to Winner',
    'Clash Squad 1v1 is a direct head-to-head match. There is no kill reward. The winner receives ₹40 based on admin-updated result submission.',
    '["2 players only","Entry fee: ₹25 per player","No per kill reward","Winner receives ₹40","Room details appear 5 minutes before start time","Filled slot blocks any second registration","Admins verify winners and settle the wallet credit"]',
    '[{"label":"Entry Fee","value":"₹25 per player"},{"label":"Per Kill","value":"No kill reward"},{"label":"Winner Prize","value":"₹40"},{"label":"Slots","value":"2 players"}]',
    4,
    1
  ),
  (
    5,
    'CS 2 vs 2',
    'cs-2v2',
    '/modes-images/cs2vs2.jpeg',
    '/modes-images/app-inside/cs2vs2.jpeg',
    'cs',
    '4 Players (2×2)',
    4,
    2,
    25,
    NULL,
    NULL,
    '₹40/member',
    'Clash Squad 2v2 with 2 teams of 2. There is no kill payout. Each member of the winning team receives ₹40 through the admin result flow.',
    '["2 teams, 2 players each","Entry fee: ₹25 per player","No per kill reward","Winning team members receive ₹40 each","Teams are grouped visibly in slot order","Filled matches are marked unavailable","Admins push final wallet rewards after result entry"]',
    '[{"label":"Entry Fee","value":"₹25 per player"},{"label":"Per Kill","value":"No kill reward"},{"label":"Winner Prize","value":"₹40 per member"},{"label":"Teams","value":"2 teams of 2"}]',
    5,
    1
  ),
  (
    6,
    'CS 4 vs 4',
    'cs-4v4',
    '/modes-images/cs2vs2.jpeg',
    '/modes-images/app-inside/cs4vs4.jpeg',
    'cs',
    '8 Players (4×4)',
    8,
    4,
    25,
    NULL,
    NULL,
    '₹45/member (₹180)',
    'Clash Squad 4v4 with 2 teams of 4. There is no kill payout. Each winning team member receives ₹45, for a total winner payout of ₹180.',
    '["2 teams, 4 players each","Entry fee: ₹25 per player","No per kill reward","Winning team members receive ₹45 each","Teams fill slot groups in order","Room information is time-gated by the admin","Admins update winners and rewards after completion"]',
    '[{"label":"Entry Fee","value":"₹25 per player"},{"label":"Per Kill","value":"No kill reward"},{"label":"Winner Prize","value":"₹45 per member"},{"label":"Teams","value":"2 teams of 4"}]',
    6,
    1
  ),
  (
    7,
    'LW 1 vs 1',
    'lw-1v1',
    '/modes-images/lw1vs1.jpeg',
    '/modes-images/app-inside/lw1vs1.jpeg',
    'lw',
    '2 Players',
    2,
    1,
    25,
    NULL,
    NULL,
    '₹40 to Winner',
    'Lone Wolf 1v1 is a compact duel with direct winner payout. There is no kill reward. The winner receives ₹40 after admin result confirmation.',
    '["2 players only","Entry fee: ₹25 per player","No per kill reward","Winner receives ₹40","Users can see occupied and open slots clearly","Full matches are blocked from join","Admins decide final payout after review"]',
    '[{"label":"Entry Fee","value":"₹25 per player"},{"label":"Per Kill","value":"No kill reward"},{"label":"Winner Prize","value":"₹40"},{"label":"Slots","value":"2 players"}]',
    7,
    1
  ),
  (
    8,
    'LW 2 vs 2',
    'lw-2v2',
    '/modes-images/lw2vs2.jpeg',
    '/modes-images/app-inside/lw2vs2.jpeg',
    'lw',
    '4 Players (2×2)',
    4,
    2,
    25,
    NULL,
    NULL,
    '₹40/member (₹80)',
    'Lone Wolf 2v2 runs as two paired teams. There is no kill reward. Each winning team member receives ₹40, for a total team winner payout of ₹80.',
    '["2 teams, 2 players each","Entry fee: ₹25 per player","No per kill reward","Winning team members receive ₹40 each","Slots stay locked once occupied","Filled matches show a join another match message","Admins update final rewards and completion status"]',
    '[{"label":"Entry Fee","value":"₹25 per player"},{"label":"Per Kill","value":"No kill reward"},{"label":"Winner Prize","value":"₹40 per member"},{"label":"Teams","value":"2 teams of 2"}]',
    8,
    1
  ),
  (
    9,
    'HS 1 vs 1',
    'hs-1v1',
    '/modes-images/app-inside/hs1vs1.webp',
    '/modes-images/app-inside/hs1vs1.webp',
    'hs',
    '2 Players',
    2,
    1,
    25,
    NULL,
    NULL,
    '₹40 to Winner',
    'Headshot Only 1v1 is a precision duel where body shots do not count. There is no kill payout. The winner receives ₹40 after admin result verification.',
    '["2 players only","Headshot only mode","Entry fee: ₹25 per player","No per kill reward","Winner receives ₹40","Room details unlock close to match time","Admins verify results before payout"]',
    '[{"label":"Entry Fee","value":"₹25 per player"},{"label":"Per Kill","value":"No kill reward"},{"label":"Winner Prize","value":"₹40"},{"label":"Slots","value":"2 players"}]',
    9,
    1
  ),
  (
    10,
    'HS 2 vs 2',
    'hs-2v2',
    '/modes-images/app-inside/hs2vs2.webp',
    '/modes-images/app-inside/hs2vs2.webp',
    'hs',
    '4 Players (2×2)',
    4,
    2,
    25,
    NULL,
    NULL,
    '₹40/member',
    'Headshot Only 2v2 features two teams of two in a tactical close-range format. There is no kill payout. Each winning member receives ₹40.',
    '["2 teams, 2 players each","Headshot only mode","Entry fee: ₹25 per player","No per kill reward","Winning team members receive ₹40 each","Slot grouping follows team order","Admins verify winners and settle rewards"]',
    '[{"label":"Entry Fee","value":"₹25 per player"},{"label":"Per Kill","value":"No kill reward"},{"label":"Winner Prize","value":"₹40 per member"},{"label":"Teams","value":"2 teams of 2"}]',
    10,
    1
  ),
  (
    11,
    'HS 4 vs 4',
    'hs-4v4',
    '/modes-images/app-inside/hs4vs4.webp',
    '/modes-images/app-inside/hs4vs4.webp',
    'hs',
    '8 Players (4×4)',
    8,
    4,
    25,
    NULL,
    NULL,
    '₹45/member (₹180)',
    'Headshot Only 4v4 is a team-based elimination format focused on precision and positioning. There is no kill payout. Each winning member receives ₹45.',
    '["2 teams, 4 players each","Headshot only mode","Entry fee: ₹25 per player","No per kill reward","Winning team members receive ₹45 each","Teams are assigned in grouped slots","Admins publish final rewards after result entry"]',
    '[{"label":"Entry Fee","value":"₹25 per player"},{"label":"Per Kill","value":"No kill reward"},{"label":"Winner Prize","value":"₹45 per member"},{"label":"Teams","value":"2 teams of 4"}]',
    11,
    1
  )
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  image = VALUES(image),
  app_image = VALUES(app_image),
  category = VALUES(category),
  players_label = VALUES(players_label),
  max_players = VALUES(max_players),
  team_size = VALUES(team_size),
  entry_fee = VALUES(entry_fee),
  per_kill = VALUES(per_kill),
  prize_pool = VALUES(prize_pool),
  win_prize = VALUES(win_prize),
  full_description = VALUES(full_description),
  rules_json = VALUES(rules_json),
  reward_breakdown_json = VALUES(reward_breakdown_json),
  sort_order = VALUES(sort_order),
  is_active = VALUES(is_active);

-- Insert default admin user (password: Admin@123)
-- You can change this after first login
INSERT INTO users (full_name, username, email, mobile, password, role)
VALUES (
  'Admin',
  'admin',
  'admin@totalfire.com',
  '0000000000',
  '$2b$12$96Zgwa87D1E/X213fzmEeuOv3lVxfI3.0Ql0KBTLT.jwLyE/M6a52',
  'admin'
)
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name),
  mobile = VALUES(mobile),
  password = VALUES(password),
  role = VALUES(role);
