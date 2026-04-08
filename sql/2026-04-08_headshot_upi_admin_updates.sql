-- TotalFire migration: Headshot modes + Withdrawal UPI support
-- Safe to run on MySQL 8.x

ALTER TABLE modes
  MODIFY COLUMN category ENUM('br','cs','lw','hs') NOT NULL;

ALTER TABLE tournaments
  MODIFY COLUMN category ENUM('br','cs','lw','hs') NOT NULL;

ALTER TABLE withdrawal_requests
  ADD COLUMN IF NOT EXISTS method VARCHAR(30) NULL AFTER amount,
  ADD COLUMN IF NOT EXISTS account_details VARCHAR(255) NULL AFTER method,
  ADD COLUMN IF NOT EXISTS upi_id VARCHAR(80) NULL AFTER account_details;

CREATE TABLE IF NOT EXISTS user_upi_accounts (
  user_id INT PRIMARY KEY,
  upi_id VARCHAR(80) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_upi_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  KEY idx_upi_id (upi_id)
);

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
)
VALUES
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
