import { query } from '../../config/db.js';
import { HttpError } from '../../utils/httpError.js';

const shape = (row) => row && ({
  user_id: row.user_id,
  vehicle_type: row.vehicle_type,
  vehicle_make: row.vehicle_make,
  vehicle_model: row.vehicle_model,
  vehicle_color: row.vehicle_color,
  vehicle_plate: row.vehicle_plate,
  vehicle_capacity_kg: row.vehicle_capacity_kg != null ? Number(row.vehicle_capacity_kg) : null,
  license_class: row.license_class,
  license_number: row.license_number,
  license_expiry: row.license_expiry,
  is_available: row.is_available,
  is_verified: row.is_verified,
  verified_at: row.verified_at,
  max_active_jobs: row.max_active_jobs,
  rating_avg: row.rating_avg != null ? Number(row.rating_avg) : 0,
  rating_count: row.rating_count,
  completed_count: row.completed_count,
  current_lat: row.current_lat != null ? Number(row.current_lat) : null,
  current_lng: row.current_lng != null ? Number(row.current_lng) : null,
});

export async function getMine(userId) {
  const { rows } = await query('SELECT * FROM courier_profiles WHERE user_id = $1', [userId]);
  if (!rows[0]) throw new HttpError(404, 'Courier profile not found');
  return shape(rows[0]);
}

export async function upsertMine(userId, payload) {
  const { rows: userRows } = await query('SELECT role FROM users WHERE id = $1', [userId]);
  if (!userRows[0]) throw new HttpError(404, 'User not found');
  if (userRows[0].role !== 'courier') throw new HttpError(403, 'Only couriers have a profile');

  const { rows } = await query(
    `INSERT INTO courier_profiles (
       user_id, vehicle_type, vehicle_make, vehicle_model, vehicle_color,
       vehicle_plate, vehicle_capacity_kg, license_class, license_number,
       license_expiry, max_active_jobs
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, COALESCE($11, 1))
     ON CONFLICT (user_id) DO UPDATE SET
       vehicle_type        = EXCLUDED.vehicle_type,
       vehicle_make        = EXCLUDED.vehicle_make,
       vehicle_model       = EXCLUDED.vehicle_model,
       vehicle_color       = EXCLUDED.vehicle_color,
       vehicle_plate       = EXCLUDED.vehicle_plate,
       vehicle_capacity_kg = EXCLUDED.vehicle_capacity_kg,
       license_class       = EXCLUDED.license_class,
       license_number      = EXCLUDED.license_number,
       license_expiry      = EXCLUDED.license_expiry,
       max_active_jobs     = COALESCE(EXCLUDED.max_active_jobs, courier_profiles.max_active_jobs),
       updated_at          = NOW()
     RETURNING *`,
    [
      userId,
      payload.vehicle_type,
      payload.vehicle_make,
      payload.vehicle_model,
      payload.vehicle_color,
      payload.vehicle_plate,
      payload.vehicle_capacity_kg,
      payload.license_class,
      payload.license_number,
      payload.license_expiry ?? null,
      payload.max_active_jobs ?? null,
    ]
  );
  return shape(rows[0]);
}

export async function setAvailability(userId, isAvailable) {
  const { rows } = await query(
    `UPDATE courier_profiles
       SET is_available = $1, updated_at = NOW()
     WHERE user_id = $2
     RETURNING *`,
    [isAvailable, userId]
  );
  if (!rows[0]) throw new HttpError(404, 'Courier profile not found');
  return shape(rows[0]);
}

/**
 * A courier is "complete" when all credential fields are filled.
 * Incomplete couriers cannot accept jobs.
 */
export function isProfileComplete(p) {
  return Boolean(
    p &&
    p.vehicle_type && p.vehicle_make && p.vehicle_model &&
    p.vehicle_color && p.vehicle_plate && p.vehicle_capacity_kg &&
    p.license_class && p.license_number
  );
}