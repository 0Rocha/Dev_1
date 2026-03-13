// lib/db.ts
import { Pool } from 'pg';

const envUrl = process.env.DATABASE_URL;

// Fallback seguro: se env estiver undefined, usar localhost
const fallback = 'postgresql://postgres:altere_senha_segura@127.0.0.1:5432/appdb';
const raw = envUrl ?? fallback;

// máscara senha para logs (não exponha em produção)
const maskConn = (s: string) => s.replace(/:(.*?)@/, ':****@');

console.log('DATABASE_URL USADA:', envUrl ? maskConn(envUrl) : '(fallback) ' + maskConn(fallback));

export const pool = new Pool({
  connectionString: raw,
  max: 10,
  idleTimeoutMillis: 30000,
});