-- Reporting queries for wallet add-money and withdrawal requests

-- A) Per-user total amount added through payment gateway credits
-- Uses existing wallet ledger entries written by verify API.
SELECT
  u.id,
  u.full_name,
  u.email,
  COALESCE(SUM(wt.amount), 0) AS total_added_via_payment,
  COALESCE(COUNT(wt.id), 0) AS successful_topup_count,
  MAX(wt.created_at) AS last_topup_at
FROM users u
LEFT JOIN wallet_transactions wt
  ON wt.user_id = u.id
 AND wt.type = 'credit'
 AND wt.description = 'Razorpay Wallet Top-up'
GROUP BY u.id, u.full_name, u.email
ORDER BY total_added_via_payment DESC;

-- B) Daily total topups from payment
SELECT
  DATE(wt.created_at) AS topup_date,
  COUNT(*) AS topup_count,
  SUM(wt.amount) AS total_topup_amount
FROM wallet_transactions wt
WHERE wt.type = 'credit'
  AND wt.description = 'Razorpay Wallet Top-up'
GROUP BY DATE(wt.created_at)
ORDER BY topup_date DESC;

-- C) Withdrawal request list with user details
SELECT
  wr.id,
  wr.user_id,
  u.full_name,
  u.email,
  wr.amount,
  wr.method,
  wr.account_details,
  wr.status,
  wr.processed_by,
  wr.processed_at,
  wr.admin_note,
  wr.created_at,
  wr.updated_at
FROM withdrawal_requests wr
JOIN users u ON u.id = wr.user_id
ORDER BY wr.created_at DESC;

-- D) Withdrawal summary by status
SELECT
  wr.status,
  COUNT(*) AS request_count,
  SUM(wr.amount) AS total_amount
FROM withdrawal_requests wr
GROUP BY wr.status;

-- D2) Total amount already deposited to users
SELECT
  COUNT(*) AS deposited_request_count,
  COALESCE(SUM(wr.amount), 0) AS total_deposited_amount
FROM withdrawal_requests wr
WHERE wr.status = 'deposited';

-- E) If you use wallet_payment_transactions in APIs, this gives true gateway-level top-up report
SELECT
  u.id,
  u.full_name,
  u.email,
  COALESCE(SUM(wpt.amount), 0) AS total_added_via_gateway,
  COALESCE(COUNT(wpt.id), 0) AS gateway_payment_count,
  MAX(wpt.created_at) AS last_gateway_payment_at
FROM users u
LEFT JOIN wallet_payment_transactions wpt
  ON wpt.user_id = u.id
 AND wpt.credited_to_wallet = 1
 AND wpt.status IN ('authorized', 'captured')
GROUP BY u.id, u.full_name, u.email
ORDER BY total_added_via_gateway DESC;

-- F) User notification list (latest first)
SELECT
  n.id,
  n.user_id,
  u.full_name,
  u.email,
  n.type,
  n.title,
  n.message,
  n.is_read,
  n.created_at
FROM notifications n
JOIN users u ON u.id = n.user_id
ORDER BY n.created_at DESC;

-- G) Unread notifications count per user
SELECT
  u.id,
  u.full_name,
  u.email,
  COALESCE(SUM(CASE WHEN n.is_read = 0 THEN 1 ELSE 0 END), 0) AS unread_notifications
FROM users u
LEFT JOIN notifications n ON n.user_id = u.id
GROUP BY u.id, u.full_name, u.email
ORDER BY unread_notifications DESC;
