-- -- USERS
-- INSERT INTO users (username, name, email, phone, balance, account_type, language)
-- VALUES 
-- ('john_doe', 'John Doe', 'john@example.com', '9999999999', 15000.00, 'SAVINGS', 'en'),
-- ('jane_smith', 'Jane Smith', 'jane@example.com', '8888888888', 20000.00, 'CURRENT', 'en'),
-- ('rahul_kumar', 'Rahul Kumar', 'rahul@example.com', '7777777777', 10000.00, 'SAVINGS', 'hi'),
-- ('meera_reddy', 'Meera Reddy', 'meera@example.com', '6666666666', 25000.00, 'SAVINGS', 'te'),
-- ('arjun_mehta', 'Arjun Mehta', 'arjun@example.com', '5555555555', 12000.00, 'CURRENT', 'en')
-- ON DUPLICATE KEY UPDATE username = username;

-- -- CARDS (each linked to a user)
-- -- Default PIN = 1234 (bcrypt hash)
-- INSERT INTO cards (user_id, card_number, pin_hash, expiry_date, cvv, status)
-- SELECT id, '4111111111111111', '$2a$10$1tX9C7z6y8xw4fYgU1bUruD1u9JmF9Q5QfiU9SgJX1ZtJvZkQnH9K', DATE_ADD(CURDATE(), INTERVAL 2 YEAR), '123', 'ACTIVE'
-- FROM users WHERE username = 'john_doe'
-- ON DUPLICATE KEY UPDATE card_number = card_number;

-- INSERT INTO cards (user_id, card_number, pin_hash, expiry_date, cvv, status)
-- SELECT id, '4222222222222222', '$2a$10$1tX9C7z6y8xw4fYgU1bUruD1u9JmF9Q5QfiU9SgJX1ZtJvZkQnH9K', DATE_ADD(CURDATE(), INTERVAL 2 YEAR), '456', 'ACTIVE'
-- FROM users WHERE username = 'jane_smith'
-- ON DUPLICATE KEY UPDATE card_number = card_number;

-- INSERT INTO cards (user_id, card_number, pin_hash, expiry_date, cvv, status)
-- SELECT id, '4333333333333333', '$2a$10$1tX9C7z6y8xw4fYgU1bUruD1u9JmF9Q5QfiU9SgJX1ZtJvZkQnH9K', DATE_ADD(CURDATE(), INTERVAL 2 YEAR), '789', 'ACTIVE'
-- FROM users WHERE username = 'rahul_kumar'
-- ON DUPLICATE KEY UPDATE card_number = card_number;

-- INSERT INTO cards (user_id, card_number, pin_hash, expiry_date, cvv, status)
-- SELECT id, '4444444444444444', '$2a$10$1tX9C7z6y8xw4fYgU1bUruD1u9JmF9Q5QfiU9SgJX1ZtJvZkQnH9K', DATE_ADD(CURDATE(), INTERVAL 2 YEAR), '321', 'ACTIVE'
-- FROM users WHERE username = 'meera_reddy'
-- ON DUPLICATE KEY UPDATE card_number = card_number;

-- INSERT INTO cards (user_id, card_number, pin_hash, expiry_date, cvv, status)
-- SELECT id, '4555555555555555', '$2a$10$1tX9C7z6y8xw4fYgU1bUruD1u9JmF9Q5QfiU9SgJX1ZtJvZkQnH9K', DATE_ADD(CURDATE(), INTERVAL 2 YEAR), '654', 'ACTIVE'
-- FROM users WHERE username = 'arjun_mehta'
-- ON DUPLICATE KEY UPDATE card_number = card_number;

-- USERS
INSERT INTO users (username, name, email, phone, balance, account_type, language)
VALUES
('diddi_shivani',  'Diddi Shivani',    'diddi.shivani@example.com',  '9999999999', 15000.00, 'SAVINGS', 'en'),
('bhagya_sree',    'Bhagya sree',      'bhagya.sree@example.com',    '8888888888', 20000.00, 'CURRENT', 'en'),
('laranya_r',      'Laranya R',        'laranya.r@example.com',      '7777777777', 10000.00, 'SAVINGS', 'hi'),
('aaesha_akram',   'Aaesha Akram',     'aaesha.akram@example.com',   '6666666666', 25000.00, 'SAVINGS', 'te'),
('hasrath_rahamate','Hasrath Rahamate','hasrath.rahamate@example.com','5555555555',12000.00, 'CURRENT', 'en'),
('preeti_singh',   'Preeti Singh',     'preeti.singh@example.com',   '4444444444', 18000.00, 'SAVINGS', 'en')
ON DUPLICATE KEY UPDATE username = username;

-- CARDS (each linked to a user)
-- Default PIN = 1234 (bcrypt hash)
-- Same hash for all below:
-- $2a$10$1tX9C7z6y8xw4fYgU1bUruD1u9JmF9Q5QfiU9SgJX1ZtJvZkQnH9K

INSERT INTO cards (user_id, card_number, pin_hash, expiry_date, cvv, status)
SELECT id, '4111111111111111', '$2a$10$1tX9C7z6y8xw4fYgU1bUruD1u9JmF9Q5QfiU9SgJX1ZtJvZkQnH9K', DATE_ADD(CURDATE(), INTERVAL 2 YEAR), '123', 'ACTIVE'
FROM users WHERE username = 'diddi_shivani'
ON DUPLICATE KEY UPDATE card_number = card_number;

INSERT INTO cards (user_id, card_number, pin_hash, expiry_date, cvv, status)
SELECT id, '4222222222222222', '$2a$10$1tX9C7z6y8xw4fYgU1bUruD1u9JmF9Q5QfiU9SgJX1ZtJvZkQnH9K', DATE_ADD(CURDATE(), INTERVAL 2 YEAR), '456', 'ACTIVE'
FROM users WHERE username = 'bhagya_sree'
ON DUPLICATE KEY UPDATE card_number = card_number;

INSERT INTO cards (user_id, card_number, pin_hash, expiry_date, cvv, status)
SELECT id, '4333333333333333', '$2a$10$1tX9C7z6y8xw4fYgU1bUruD1u9JmF9Q5QfiU9SgJX1ZtJvZkQnH9K', DATE_ADD(CURDATE(), INTERVAL 2 YEAR), '789', 'ACTIVE'
FROM users WHERE username = 'laranya_r'
ON DUPLICATE KEY UPDATE card_number = card_number;

INSERT INTO cards (user_id, card_number, pin_hash, expiry_date, cvv, status)
SELECT id, '4444444444444444', '$2a$10$1tX9C7z6y8xw4fYgU1bUruD1u9JmF9Q5QfiU9SgJX1ZtJvZkQnH9K', DATE_ADD(CURDATE(), INTERVAL 2 YEAR), '321', 'ACTIVE'
FROM users WHERE username = 'aaesha_akram'
ON DUPLICATE KEY UPDATE card_number = card_number;

INSERT INTO cards (user_id, card_number, pin_hash, expiry_date, cvv, status)
SELECT id, '4555555555555555', '$2a$10$1tX9C7z6y8xw4fYgU1bUruD1u9JmF9Q5QfiU9SgJX1ZtJvZkQnH9K', DATE_ADD(CURDATE(), INTERVAL 2 YEAR), '654', 'ACTIVE'
FROM users WHERE username = 'hasrath_rahamate'
ON DUPLICATE KEY UPDATE card_number = card_number;

INSERT INTO cards (user_id, card_number, pin_hash, expiry_date, cvv, status)
SELECT id, '4666666666666666', '$2a$10$1tX9C7z6y8xw4fYgU1bUruD1u9JmF9Q5QfiU9SgJX1ZtJvZkQnH9K', DATE_ADD(CURDATE(), INTERVAL 2 YEAR), '987', 'ACTIVE'
FROM users WHERE username = 'preeti_singh'
ON DUPLICATE KEY UPDATE card_number = card_number;

