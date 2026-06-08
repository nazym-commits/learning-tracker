import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import { getDb } from './db';

export const KEY_PREFIX = 'lt_';
const PREFIX_LOOKUP_LEN = 10; // first ~10 chars stored for fast lookup

export interface ApiKeyRow {
  id: string;
  user_id: string;
  name: string;
  key_prefix: string;
  last_used_at: string | null;
  revoked_at: string | null;
  created_at: string;
}

export interface ResolvedKey {
  keyId: string;
  userId: string;
}

/** Generate a new plaintext key and its bcrypt hash. The plaintext is shown to the user once. */
export async function generateApiKey(): Promise<{
  key: string;
  keyHash: string;
  keyPrefix: string;
}> {
  const key = `${KEY_PREFIX}${randomBytes(24).toString('base64url')}`;
  const keyHash = await bcrypt.hash(key, 12);
  const keyPrefix = key.slice(0, PREFIX_LOOKUP_LEN);
  return { key, keyHash, keyPrefix };
}

/** Resolve a plaintext key to its owner. Updates last_used_at on success. Returns null if invalid/revoked. */
export async function resolveApiKey(key: string | null | undefined): Promise<ResolvedKey | null> {
  if (!key || !key.startsWith(KEY_PREFIX)) return null;

  const keyPrefix = key.slice(0, PREFIX_LOOKUP_LEN);
  const sql = getDb();
  const rows = await sql`
    SELECT id, user_id, key_hash
    FROM api_keys
    WHERE key_prefix = ${keyPrefix} AND revoked_at IS NULL
  `;

  for (const row of rows) {
    if (await bcrypt.compare(key, row.key_hash as string)) {
      await sql`UPDATE api_keys SET last_used_at = NOW() WHERE id = ${row.id as string}`;
      return { keyId: row.id as string, userId: row.user_id as string };
    }
  }
  return null;
}

/** List a user's keys (never returns hashes). */
export async function listApiKeys(userId: string): Promise<ApiKeyRow[]> {
  const sql = getDb();
  const rows = await sql`
    SELECT id, user_id, name, key_prefix, last_used_at, revoked_at, created_at
    FROM api_keys
    WHERE user_id = ${userId} AND revoked_at IS NULL
    ORDER BY created_at DESC
  `;
  return rows as ApiKeyRow[];
}

/** Create a key for a user. Returns the row plus the one-time plaintext key. */
export async function createApiKey(
  userId: string,
  name: string,
): Promise<{ row: ApiKeyRow; key: string }> {
  const { key, keyHash, keyPrefix } = await generateApiKey();
  const sql = getDb();
  const rows = await sql`
    INSERT INTO api_keys (user_id, name, key_hash, key_prefix)
    VALUES (${userId}, ${name}, ${keyHash}, ${keyPrefix})
    RETURNING id, user_id, name, key_prefix, last_used_at, revoked_at, created_at
  `;
  return { row: rows[0] as ApiKeyRow, key };
}

/** Soft-revoke a key owned by the user. Returns true if a key was revoked. */
export async function revokeApiKey(userId: string, keyId: string): Promise<boolean> {
  const sql = getDb();
  const rows = await sql`
    UPDATE api_keys
    SET revoked_at = NOW()
    WHERE id = ${keyId} AND user_id = ${userId} AND revoked_at IS NULL
    RETURNING id
  `;
  return rows.length > 0;
}
