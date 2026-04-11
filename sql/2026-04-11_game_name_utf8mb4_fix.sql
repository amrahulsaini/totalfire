-- TotalFire migration: Preserve game_name symbols/emojis exactly
-- Safe to run on MySQL 8.x

ALTER TABLE tournament_entries
  ADD COLUMN IF NOT EXISTS game_name VARCHAR(100)
    CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL;

ALTER TABLE tournament_entries
  MODIFY COLUMN game_name VARCHAR(100)
    CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL;
