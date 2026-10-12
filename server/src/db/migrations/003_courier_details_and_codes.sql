-- =====================================================
-- DeliverIt — Migration 003
-- Adds: public user codes, courier credential fields,
--       vehicle capacity, delivery public codes,
--       delivery category, courier max active jobs.
-- =====================================================

-- -----------------------------------------------------
-- 1. Sequence-backed public codes for users
-- -----------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS user_code_seq START 1;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS public_code VARCHAR(20) UNIQUE;

CREATE OR REPLACE FUNCTION generate_user_code()
RETURNS TEXT AS $$
BEGIN
  RETURN 'DIT-U-' || LPAD(nextval('user_code_seq')::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Backfill existing users
UPDATE users
   SET public_code = 'DIT-U-' || LPAD(nextval('user_code_seq')::TEXT, 6, '0')
 WHERE public_code IS NULL;

ALTER TABLE users
  ALTER COLUMN public_code SET DEFAULT generate_user_code(),
  ALTER COLUMN public_code SET NOT NULL;

-- -----------------------------------------------------
-- 2. National ID (unique per user, optional at signup)
-- -----------------------------------------------------
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS national_id VARCHAR(50) UNIQUE;

-- -----------------------------------------------------
-- 3. Vehicle type enum + capacity
-- -----------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vehicle_type') THEN
    CREATE TYPE vehicle_type AS ENUM ('bicycle','motorbike','car','van','truck');
  END IF;
END$$;

-- -----------------------------------------------------
-- 4. Expand courier_profiles with credentials + capacity
-- -----------------------------------------------------
ALTER TABLE courier_profiles
  ADD COLUMN IF NOT EXISTS vehicle_make        VARCHAR(60),
  ADD COLUMN IF NOT EXISTS vehicle_model       VARCHAR(60),
  ADD COLUMN IF NOT EXISTS vehicle_color       VARCHAR(40),
  ADD COLUMN IF NOT EXISTS vehicle_plate       VARCHAR(20) UNIQUE,
  ADD COLUMN IF NOT EXISTS vehicle_capacity_kg NUMERIC(7,2),
  ADD COLUMN IF NOT EXISTS license_class       VARCHAR(10),
  ADD COLUMN IF NOT EXISTS license_number      VARCHAR(40) UNIQUE,
  ADD COLUMN IF NOT EXISTS license_expiry      DATE,
  ADD COLUMN IF NOT EXISTS max_active_jobs     INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS is_verified         BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS verified_at         TIMESTAMPTZ;

-- Convert vehicle_type to the enum (was VARCHAR(50))
-- Safe because existing data uses free text; we'll default to 'motorbike' when unknown.
ALTER TABLE courier_profiles
  ALTER COLUMN vehicle_type TYPE vehicle_type
  USING (
    CASE
      WHEN vehicle_type IN ('bicycle','motorbike','car','van','truck') THEN vehicle_type::vehicle_type
      ELSE 'motorbike'::vehicle_type
    END
  );

-- -----------------------------------------------------
-- 5. Delivery category
-- -----------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'delivery_category') THEN
    CREATE TYPE delivery_category AS ENUM ('document','parcel','bulk','freight');
  END IF;
END$$;

ALTER TABLE deliveries
  ADD COLUMN IF NOT EXISTS category delivery_category NOT NULL DEFAULT 'parcel';

-- -----------------------------------------------------
-- 6. Sequence-backed public codes for deliveries
--    Format: DIT-D-YYYYMMDD-####  (per-day sequence, simple)
-- -----------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS delivery_code_seq START 1;

ALTER TABLE deliveries
  ADD COLUMN IF NOT EXISTS public_code VARCHAR(30) UNIQUE;

CREATE OR REPLACE FUNCTION generate_delivery_code()
RETURNS TEXT AS $$
BEGIN
  RETURN 'DIT-D-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' ||
         LPAD(nextval('delivery_code_seq')::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

UPDATE deliveries
   SET public_code = 'DIT-D-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' ||
                     LPAD(nextval('delivery_code_seq')::TEXT, 4, '0')
 WHERE public_code IS NULL;

ALTER TABLE deliveries
  ALTER COLUMN public_code SET DEFAULT generate_delivery_code(),
  ALTER COLUMN public_code SET NOT NULL;

-- -----------------------------------------------------
-- 7. Helpful indexes
-- -----------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_users_public_code    ON users(public_code);
CREATE INDEX IF NOT EXISTS idx_deliveries_public_code ON deliveries(public_code);
CREATE INDEX IF NOT EXISTS idx_deliveries_category  ON deliveries(category);