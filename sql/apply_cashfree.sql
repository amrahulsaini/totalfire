ALTER TABLE wallet_payment_transactions MODIFY COLUMN provider ENUM('cashfree', 'razorpay') NOT NULL DEFAULT 'cashfree';
