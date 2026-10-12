import 'dotenv/config';

const required = ['DATABASE_URL', 'JWT_SECRET'];
for (const key of required) {
  if (!process.env[key]) {
    console.error(`❌ Missing env var: ${key}`);
    process.exit(1);
  }
}

// CORS strategy:
// - dev  → allow ANY origin (so tunnels, LAN IPs, Live Server ports all work)
// - prod → strict list from CORS_ORIGIN
const buildCorsOrigin = () => {
  const isDev = (process.env.NODE_ENV || 'development') !== 'production';

  if (isDev) {
    // Echo back the request origin — allows everything in dev.
    return true;
  }

  // Production: strict list
  return (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
};

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 4000),
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  corsOrigin: buildCorsOrigin(),
  isProd: process.env.NODE_ENV === 'production',
};