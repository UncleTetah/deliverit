-- DeliverIt — deliveries, tracking, ratings

CREATE TYPE delivery_status AS ENUM (
    'pending','accepted','picked_up','in_transit','delivered','cancelled','failed'
);

CREATE TABLE deliveries (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id       UUID NOT NULL REFERENCES users(id),
    courier_id        UUID REFERENCES users(id),

    pickup_address    TEXT NOT NULL,
    pickup_lat        NUMERIC(9,6) NOT NULL,
    pickup_lng        NUMERIC(9,6) NOT NULL,
    pickup_contact    VARCHAR(120),

    dropoff_address   TEXT NOT NULL,
    dropoff_lat       NUMERIC(9,6) NOT NULL,
    dropoff_lng       NUMERIC(9,6) NOT NULL,
    dropoff_contact   VARCHAR(120),

    package_desc      TEXT,
    package_weight_kg NUMERIC(6,2),

    status            delivery_status NOT NULL DEFAULT 'pending',
    price             NUMERIC(10,2),
    distance_km       NUMERIC(7,2),
    scheduled_for     TIMESTAMPTZ,
    delivered_at      TIMESTAMPTZ,
    proof_url         TEXT,
    notes             TEXT,

    created_at        TIMESTAMPTZ DEFAULT NOW(),
    updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_deliveries_customer ON deliveries(customer_id);
CREATE INDEX idx_deliveries_courier  ON deliveries(courier_id);
CREATE INDEX idx_deliveries_status   ON deliveries(status);

CREATE TRIGGER trg_deliveries_updated
    BEFORE UPDATE ON deliveries
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============ TRACKING EVENTS ============
CREATE TABLE tracking_events (
    id            BIGSERIAL PRIMARY KEY,
    delivery_id   UUID NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
    status        delivery_status NOT NULL,
    lat           NUMERIC(9,6),
    lng           NUMERIC(9,6),
    note          TEXT,
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tracking_delivery ON tracking_events(delivery_id, created_at DESC);

-- ============ RATINGS ============
CREATE TABLE ratings (
    id            BIGSERIAL PRIMARY KEY,
    delivery_id   UUID NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
    rater_id      UUID NOT NULL REFERENCES users(id),
    ratee_id      UUID NOT NULL REFERENCES users(id),
    score         SMALLINT NOT NULL CHECK (score BETWEEN 1 AND 5),
    comment       TEXT,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (delivery_id, rater_id)
);