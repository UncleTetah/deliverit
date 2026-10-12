import { query, withTransaction } from '../../config/db.js';
import { HttpError } from '../../utils/httpError.js';
import { isProfileComplete } from '../couriers/couriers.service.js';

// Vehicle capacity must cover package weight (in kg)
// Extra buffer for safety — reject if capacity < weight.
function capacityFits(profile, weightKg) {
  if (!profile || profile.vehicle_capacity_kg == null) return false;
  return Number(profile.vehicle_capacity_kg) >= Number(weightKg);
}

// ---------- List ----------
export async function listForUser(user, { scope } = {}) {
  const { sub: userId, role } = user;

  if (role === 'courier' && scope === 'available') {
    const { rows } = await query(
      `SELECT d.*, u.full_name AS customer_name, u.public_code AS customer_code
         FROM deliveries d
         JOIN users u ON u.id = d.customer_id
        WHERE d.status = 'pending' AND d.courier_id IS NULL
        ORDER BY d.created_at DESC
        LIMIT 100`
    );
    return rows;
  }

  if (role === 'admin') {
    const { rows } = await query(
      `SELECT d.*, c.full_name AS customer_name, c.public_code AS customer_code,
              k.full_name AS courier_name, k.public_code AS courier_code
         FROM deliveries d
         JOIN users c ON c.id = d.customer_id
         LEFT JOIN users k ON k.id = d.courier_id
        ORDER BY d.created_at DESC
        LIMIT 200`
    );
    return rows;
  }

  if (role === 'courier') {
    const { rows } = await query(
      `SELECT d.*, u.full_name AS customer_name, u.public_code AS customer_code
         FROM deliveries d
         JOIN users u ON u.id = d.customer_id
        WHERE d.courier_id = $1
        ORDER BY d.created_at DESC`,
      [userId]
    );
    return rows;
  }

  const { rows } = await query(
    `SELECT d.*, k.full_name AS courier_name, k.public_code AS courier_code
       FROM deliveries d
       LEFT JOIN users k ON k.id = d.courier_id
      WHERE d.customer_id = $1
      ORDER BY d.created_at DESC`,
    [userId]
  );
  return rows;
}

// ---------- Get one ----------
export async function getById(id, user) {
  // Accept either UUID or public_code
  const byUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  const { rows } = await query(
    `SELECT d.*, c.full_name AS customer_name, c.public_code AS customer_code,
            k.full_name AS courier_name, k.public_code AS courier_code
       FROM deliveries d
       JOIN users c ON c.id = d.customer_id
       LEFT JOIN users k ON k.id = d.courier_id
      WHERE ${byUuid ? 'd.id = $1' : 'd.public_code = $1'}`,
    [id]
  );
  const d = rows[0];
  if (!d) throw new HttpError(404, 'Delivery not found');

  const isOwner   = user.role === 'customer' && d.customer_id === user.sub;
  const isCourier = user.role === 'courier'  && d.courier_id  === user.sub;
  const isOpen    = user.role === 'courier'  && d.status === 'pending' && !d.courier_id;
  const isAdmin   = user.role === 'admin';

  if (!isOwner && !isCourier && !isOpen && !isAdmin) {
    throw new HttpError(403, 'Forbidden');
  }
  return d;
}

// ---------- Create ----------
export async function create(user, payload) {
  if (user.role !== 'customer' && user.role !== 'admin') {
    throw new HttpError(403, 'Only customers can create deliveries');
  }

  return withTransaction(async (client) => {
    const { rows } = await client.query(
      `INSERT INTO deliveries (
        customer_id,
        pickup_address, pickup_lat, pickup_lng, pickup_contact,
        dropoff_address, dropoff_lat, dropoff_lng, dropoff_contact,
        category, package_desc, package_weight_kg, notes
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      RETURNING *`,
      [
        user.sub,
        payload.pickup_address, payload.pickup_lat, payload.pickup_lng, payload.pickup_contact ?? null,
        payload.dropoff_address, payload.dropoff_lat, payload.dropoff_lng, payload.dropoff_contact ?? null,
        payload.category, payload.package_desc ?? null, payload.package_weight_kg, payload.notes ?? null,
      ]
    );

    const created = rows[0];

    await client.query(
      `INSERT INTO tracking_events (delivery_id, status, lat, lng, note)
       VALUES ($1, 'pending', $2, $3, $4)`,
      [created.id, payload.pickup_lat, payload.pickup_lng, 'Delivery created']
    );

    return created;
  });
}

// ---------- Accept (with concurrency + capacity + completeness checks) ----------
export async function accept(id, user) {
  if (user.role !== 'courier') throw new HttpError(403, 'Only couriers can accept');

  return withTransaction(async (client) => {
    // 1. Lock courier profile
    const { rows: profileRows } = await client.query(
      `SELECT * FROM courier_profiles WHERE user_id = $1 FOR UPDATE`,
      [user.sub]
    );
    const profile = profileRows[0];

    if (!profile) throw new HttpError(400, 'Courier profile missing');

    if (!isProfileComplete(profile)) {
      throw new HttpError(400, 'Complete your vehicle and licence details before accepting jobs');
    }

    // 2. Enforce concurrent job limit
    const { rows: activeRows } = await client.query(
      `SELECT COUNT(*)::INT AS active
         FROM deliveries
        WHERE courier_id = $1
          AND status IN ('accepted','picked_up','in_transit')`,
      [user.sub]
    );
    const activeCount = activeRows[0].active;

    if (activeCount >= profile.max_active_jobs) {
      throw new HttpError(
        409,
        `You already have ${activeCount} active job(s). Limit is ${profile.max_active_jobs}. Complete or cancel one before accepting another.`
      );
    }

    // 3. Lock delivery row
    const { rows: dRows } = await client.query(
      `SELECT * FROM deliveries WHERE id = $1 FOR UPDATE`,
      [id]
    );
    const d = dRows[0];
    if (!d) throw new HttpError(404, 'Delivery not found');
    if (d.status !== 'pending' || d.courier_id) {
      throw new HttpError(409, 'Delivery already taken');
    }

    // 4. Capacity check
    if (!capacityFits(profile, d.package_weight_kg)) {
      throw new HttpError(
        400,
        `Package weight (${d.package_weight_kg} kg) exceeds your vehicle capacity (${profile.vehicle_capacity_kg} kg)`
      );
    }

    // 5. Assign
    const { rows: updated } = await client.query(
      `UPDATE deliveries
          SET courier_id = $1, status = 'accepted'
        WHERE id = $2
        RETURNING *`,
      [user.sub, id]
    );

    await client.query(
      `INSERT INTO tracking_events (delivery_id, status, note)
       VALUES ($1, 'accepted', $2)`,
      [id, `Courier accepted (${profile.vehicle_type}, ${profile.vehicle_plate})`]
    );

    return updated[0];
  });
}

// ---------- Update status ----------
export async function updateStatus(id, user, payload) {
  return withTransaction(async (client) => {
    const { rows } = await client.query(
      `SELECT * FROM deliveries WHERE id = $1 FOR UPDATE`,
      [id]
    );
    const d = rows[0];
    if (!d) throw new HttpError(404, 'Delivery not found');

    const isAssignedCourier = user.role === 'courier' && d.courier_id === user.sub;
    const isAdmin = user.role === 'admin';
    const isOwnerCancelling =
      user.role === 'customer' &&
      d.customer_id === user.sub &&
      payload.status === 'cancelled' &&
      ['pending', 'accepted'].includes(d.status);

    if (!isAssignedCourier && !isAdmin && !isOwnerCancelling) {
      throw new HttpError(403, 'Forbidden');
    }

    const deliveredAt = payload.status === 'delivered' ? new Date() : d.delivered_at;

    const { rows: updated } = await client.query(
      `UPDATE deliveries
          SET status = $1, delivered_at = $2
        WHERE id = $3
        RETURNING *`,
      [payload.status, deliveredAt, id]
    );

    await client.query(
      `INSERT INTO tracking_events (delivery_id, status, lat, lng, note)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, payload.status, payload.lat ?? null, payload.lng ?? null, payload.note ?? null]
    );

    return updated[0];
  });
}

// ---------- Tracking ----------
export async function getTracking(id) {
  const byUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  const { rows } = await query(
    `SELECT te.id, te.status, te.lat, te.lng, te.note, te.created_at
       FROM tracking_events te
       JOIN deliveries d ON d.id = te.delivery_id
      WHERE ${byUuid ? 'd.id = $1' : 'd.public_code = $1'}
      ORDER BY te.created_at ASC`,
    [id]
  );
  return rows;
}