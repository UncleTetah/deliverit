-- =====================================================
-- DeliverIt — Migration 004
-- Removes 'bicycle' from vehicle_type enum.
-- Replaces 'license_class' values with correct ZW codes.
-- =====================================================

-- -----------------------------------------------------
-- 1. Rebuild vehicle_type enum without 'bicycle'
-- -----------------------------------------------------
-- First: migrate any existing 'bicycle' rows to 'motorbike'
UPDATE courier_profiles
   SET vehicle_type = 'motorbike'
 WHERE vehicle_type = 'bicycle';

-- Postgres can't drop enum values directly. Recreate the type.
ALTER TYPE vehicle_type RENAME TO vehicle_type_old;

CREATE TYPE vehicle_type AS ENUM ('motorbike','car','van','truck');

ALTER TABLE courier_profiles
  ALTER COLUMN vehicle_type TYPE vehicle_type
  USING vehicle_type::TEXT::vehicle_type;

DROP TYPE vehicle_type_old;

-- -----------------------------------------------------
-- 2. Normalise licence_class values
--    Previous free-text values → ZW codes:
--      '1' → 'D' (Buses)
--      '2' → 'C' (Heavy trucks)
--      '3' → 'B' (Light motor vehicles)
--      '4' → 'A' (Motorcycles)
--      '5' → 'BE' (Tractors & plant)
-- -----------------------------------------------------
UPDATE courier_profiles SET license_class = 'A'  WHERE license_class IN ('4','A','A1');
UPDATE courier_profiles SET license_class = 'B'  WHERE license_class IN ('3','B');
UPDATE courier_profiles SET license_class = 'C'  WHERE license_class IN ('2','C');
UPDATE courier_profiles SET license_class = 'D'  WHERE license_class IN ('1','D');
UPDATE courier_profiles SET license_class = 'BE' WHERE license_class IN ('5','BE');

-- Constrain the column to the new codes
ALTER TABLE courier_profiles
  DROP CONSTRAINT IF EXISTS chk_license_class;

ALTER TABLE courier_profiles
  ADD CONSTRAINT chk_license_class
  CHECK (license_class IN ('A','B','C','D','BE'));