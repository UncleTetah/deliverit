// Tiny runner for dev_seed.sql
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from '../config/db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SEED_FILE = join(__dirname, 'seeds', 'dev_seed.sql');

async function run() {
  const sql = await readFile(SEED_FILE, 'utf8');
  try {
    await pool.query(sql);
    console.log('🌱 Seed applied.');
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();