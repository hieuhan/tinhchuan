import path from 'node:path';
import { config as loadEnv } from 'dotenv';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  loadEnv({ path: path.resolve(process.cwd(), '.env') });
  loadEnv({ path: path.resolve(process.cwd(), '../../.env') });
}

// Khắc phục bug pg-pool/V8 trên Windows khi DB down: pg-pool gọi new AggregateError(null, msg) làm V8 C++ AggregateError crash vì "object null is not iterable"
if (typeof globalThis.AggregateError === 'function') {
  const NativeAggregateError = globalThis.AggregateError;
  const PatchedAggregateError = function (errors: any, message?: string, options?: any) {
    const safeErrors = Array.isArray(errors) ? errors : [];
    return Reflect.construct(NativeAggregateError, [safeErrors, message, options], PatchedAggregateError);
  } as unknown as AggregateErrorConstructor;
  (PatchedAggregateError as any).prototype = NativeAggregateError.prototype;
  (globalThis as any).AggregateError = PatchedAggregateError;
}

// Dùng connection pool thay vì single client - phù hợp môi trường Next.js
// server-side có nhiều request đồng thời (Server Actions/Server Components).
const globalForDatabase = globalThis as unknown as { pgPool?: Pool };

const pool =
  globalForDatabase.pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
  });

// Lắng nghe sự kiện 'error' trên pool để tránh Uncaught Exception (node-postgres EventEmitter) làm crash process khi DB rớt kết nối
pool.on('error', (err) => {
  console.error('[pgPool] Lỗi không mong muốn trên PostgreSQL pool:', err.message);
});

if (process.env.NODE_ENV !== 'production') globalForDatabase.pgPool = pool;

export const db = drizzle(pool, { schema });
