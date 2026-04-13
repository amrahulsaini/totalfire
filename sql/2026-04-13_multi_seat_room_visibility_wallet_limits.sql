-- TotalFire migration: multi-seat joins, room visibility guardrails, wallet minimums
-- Safe to run on MySQL 8.x

SET @drop_unique_entry := (
  SELECT IF(
    EXISTS (
      SELECT 1
      FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'tournament_entries'
        AND INDEX_NAME = 'unique_entry'
    ),
    'ALTER TABLE tournament_entries DROP INDEX unique_entry',
    'SELECT 1'
  )
);
PREPARE stmt_drop_unique_entry FROM @drop_unique_entry;
EXECUTE stmt_drop_unique_entry;
DEALLOCATE PREPARE stmt_drop_unique_entry;

SET @add_idx_entry_user := (
  SELECT IF(
    EXISTS (
      SELECT 1
      FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'tournament_entries'
        AND INDEX_NAME = 'idx_entry_user'
    ),
    'SELECT 1',
    'ALTER TABLE tournament_entries ADD INDEX idx_entry_user (tournament_id, user_id)'
  )
);
PREPARE stmt_add_idx_entry_user FROM @add_idx_entry_user;
EXECUTE stmt_add_idx_entry_user;
DEALLOCATE PREPARE stmt_add_idx_entry_user;
