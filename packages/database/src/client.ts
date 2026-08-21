import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

// Dùng connection pool thay vì single client - phù hợp môi trường Next.js
// server-side có nhiều request đồng thời (Server Actions/Server Components).
const globalForDatabase = globalThis as unknown as { pgPool?: Pool };

const pool =
  globalForDatabase.pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
  });

if (process.env.NODE_ENV !== 'production') globalForDatabase.pgPool = pool;

export const db = drizzle(pool, { schema });
