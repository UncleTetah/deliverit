import { query } from '../../config/db.js';
import { HttpError } from '../../utils/httpError.js';

const publicUser = (u) => ({
  id: u.id,
  public_code: u.public_code,
  email: u.email,
  full_name: u.full_name,
  role: u.role,
  phone: u.phone,
  avatar_url: u.avatar_url,
  national_id: u.national_id,
  is_verified: u.is_verified,
  created_at: u.created_at,
});

export async function getProfile(userId) {
  const { rows } = await query('SELECT * FROM users WHERE id = $1', [userId]);
  if (!rows[0]) throw new HttpError(404, 'User not found');
  return publicUser(rows[0]);
}

export async function updateProfile(userId, patch) {
  const allowed = ['full_name', 'phone', 'avatar_url', 'national_id'];
  const sets = [];
  const values = [];
  let i = 1;

  for (const key of allowed) {
    if (patch[key] !== undefined) {
      sets.push(`${key} = $${i++}`);
      values.push(patch[key]);
    }
  }
  if (!sets.length) return getProfile(userId);

  values.push(userId);
  const { rows } = await query(
    `UPDATE users SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`,
    values
  );
  if (!rows[0]) throw new HttpError(404, 'User not found');
  return publicUser(rows[0]);
}