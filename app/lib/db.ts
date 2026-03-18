// lib/db.ts
import { Pool } from 'pg';

const envUrl = process.env.DATABASE_URL;

// Fallback seguro: se env estiver undefined, usar localhost
const fallback = 'postgresql://postgres:postgres@127.0.0.1:5433/appdb';
const raw = envUrl ?? fallback;

export const pool = new Pool({
  connectionString: raw,
  max: 10,
  idleTimeoutMillis: 30000,
});
