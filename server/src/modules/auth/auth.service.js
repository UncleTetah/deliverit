import jwt from 'jsonwebtoken';
import { query, withTransaction } from '../../config/db.js';
import { env } from '../../config/env.js';
import { hashPassword, verifyPassword } from '../../utils/password.js';
import { HttpError } from '../../utils/httpError.js';

const publicUser = (u) => ({
  id: u.id,
  email: u.email,
  full_name: u.full_name,
  role: u.role,
  phone: u.phone,
  avatar_url: u.avatar_url,
  is_verified: u.is_verified,
  created_at: u.created_at,
});

const signToken = (user) =>
  jwt.sign(
    { sub: user.id, role: user.role, email: user.email },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );

export async function register({ email, password, full_name, phone, role }) {
  const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rowCount > 0) throw new HttpError(409, 'Email already registered');

  const password_hash = await hashPassword(password);

  const user = await withTransaction(async (client) => {
    const { rows } = await client.query(
      `INSERT INTO users (email, password_hash, full_name, phone, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [email, password_hash, full_name, phone ?? null, role]
    );
    const newUser = rows[0];

    if (role === 'courier') {
      await client.query(
        'INSERT INTO courier_profiles (user_id) VALUES ($1)',
        [newUser.id]
      );
    }
    return newUser;
  });

  return { user: publicUser(user), token: signToken(user) };
}

export async function login({ email, password }) {
  const { rows } = await query('SELECT * FROM users WHERE email = $1', [email]);
  const user = rows[0];
  if (!user || !user.is_active) throw new HttpError(401, 'Invalid credentials');

  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) throw new HttpError(401, 'Invalid credentials');

  return { user: publicUser(user), token: signToken(user) };
}

export async function getById(id) {
  const { rows } = await query('SELECT * FROM users WHERE id = $1', [id]);
  if (!rows[0]) throw new HttpError(404, 'User not found');
  return publicUser(rows[0]);
}