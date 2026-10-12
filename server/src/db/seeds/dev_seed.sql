-- Dev seed data. Password for all users: "password123"
-- bcrypt hash of "password123" (rounds=12):
--   $2b$12$C9wYvXFNcuqE9eqFh4sFRu2x1PFLj8MV4K4YcB9oOTG4iJm2nNW1u
-- (Regenerate if needed — hash should verify with bcrypt.compare)

-- NOTE: seed inserts user rows only. Courier profiles are optional extras.

INSERT INTO users (email, password_hash, full_name, phone, role, is_verified)
VALUES
  ('alice@deliverit.dev',
   '$2b$12$C9wYvXFNcuqE9eqFh4sFRu2x1PFLj8MV4K4YcB9oOTG4iJm2nNW1u',
   'Alice Johnson', '+263771000001', 'customer', TRUE),

  ('bob@deliverit.dev',
   '$2b$12$C9wYvXFNcuqE9eqFh4sFRu2x1PFLj8MV4K4YcB9oOTG4iJm2nNW1u',
   'Bob Courier', '+263771000002', 'courier', TRUE),

  ('admin@deliverit.dev',
   '$2b$12$C9wYvXFNcuqE9eqFh4sFRu2x1PFLj8MV4K4YcB9oOTG4iJm2nNW1u',
   'Admin User', '+263771000003', 'admin', TRUE)
ON CONFLICT (email) DO NOTHING;

-- Courier profile for Bob
INSERT INTO courier_profiles (user_id, vehicle_type, license_number, is_available)
SELECT id, 'motorbike', 'LIC-0001', TRUE
FROM users WHERE email = 'bob@deliverit.dev'
ON CONFLICT (user_id) DO NOTHING;