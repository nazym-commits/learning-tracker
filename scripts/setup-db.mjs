import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load .env.local manually
const envPath = resolve(process.cwd(), '.env.local');
const env = readFileSync(envPath, 'utf-8');
env.split('\n').forEach(line => {
  const [key, ...rest] = line.split('=');
  if (key && rest.length) process.env[key.trim()] = rest.join('=').trim();
});

const sql = neon(process.env.DATABASE_URL);

async function setup() {
  console.log('Creating tables...');

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email       TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name        TEXT NOT NULL DEFAULT '',
      created_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS learning_items (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title       TEXT NOT NULL,
      author      TEXT NOT NULL DEFAULT '',
      type        TEXT NOT NULL CHECK (type IN ('course','book','video','podcast')),
      progress    INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
      created_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_items_user_id ON learning_items(user_id)`;

  await sql`
    CREATE TABLE IF NOT EXISTS api_keys (
      id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name         TEXT NOT NULL DEFAULT '',
      key_hash     TEXT NOT NULL,
      key_prefix   TEXT NOT NULL,
      last_used_at TIMESTAMPTZ,
      revoked_at   TIMESTAMPTZ,
      created_at   TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON api_keys(key_prefix)`;

  console.log('✅ Tables created successfully');
}

setup().catch(err => { console.error('❌', err.message); process.exit(1); });
