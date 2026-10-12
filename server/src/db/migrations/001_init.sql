-- DeliverIt — initial schema

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

-- ============ USERS ============
CREATE TYPE user_role AS ENUM ('customer', 'courier', 'admin');

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           CITEXT UNIQUE NOT NULL,
    phone           VARCHAR(20) UNIQUE,
    password_hash   TEXT NOT NULL,
    full_name       VARCHAR(120) NOT NULL,
    role            user_role NOT NULL DEFAULT 'customer',
    avatar_url      TEXT,
    is_verified     BOOLEAN DEFAULT FALSE,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role  ON users(role);

-- ============ COURIER PROFILES ============
CREATE TABLE courier_profiles (
    user_id           UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    vehicle_type      VARCHAR(50),
    license_number    VARCHAR(50),
    is_available      BOOLEAN DEFAULT FALSE,
    current_lat       NUMERIC(9,6),
    current_lng       NUMERIC(9,6),
    rating_avg        NUMERIC(3,2) DEFAULT 0,
    rating_count      INTEGER DEFAULT 0,
    completed_count   INTEGER DEFAULT 0,
    updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============ updated_at helper ============
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();