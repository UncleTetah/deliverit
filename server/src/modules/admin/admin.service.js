import { query } from '../../config/db.js';
import { HttpError } from '../../utils/httpError.js';

export async function getAllUsers() {
  const { rows } = await query(
    `SELECT id, public_code, email, full_name, phone, role, is_verified, is_active, created_at 
     FROM users ORDER BY created_at DESC`
  );
  return rows;
}

export async function getAllDeliveries() {
  const { rows } = await query(
    `SELECT d.*, c.full_name AS customer_name, k.full_name AS courier_name
     FROM deliveries d
     JOIN users c ON c.id = d.customer_id
     LEFT JOIN users k ON k.id = d.courier_id
     ORDER BY d.created_at DESC`
  );
  return rows;
}

export async function verifyCourier(userId) {
  // 1. Check if user exists and is a courier
  const { rows: userRows } = await query('SELECT role FROM users WHERE id = $1', [userId]);
  if (!userRows[0]) throw new HttpError(404, 'User not found');
  if (userRows[0].role !== 'courier') throw new HttpError(400, 'User is not a courier');

  // 2. Mark as verified in users table
  await query('UPDATE users SET is_verified = TRUE WHERE id = $1', [userId]);
  
  // 3. Mark as verified in courier_profiles table
  await query('UPDATE courier_profiles SET is_verified = TRUE, verified_at = NOW() WHERE user_id = $1', [userId]);

  return { message: 'Courier verified successfully' };
}